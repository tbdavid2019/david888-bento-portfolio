/**
 * Unified Email Delivery Module
 * Priority:
 * 1. Primary: SMTP (STARTTLS on port 587 / TLS on port 465) via `cloudflare:sockets` (Workers) or `node:net`/`node:tls` (Node.js)
 * 2. Fallback: Resend HTTP API (`https://api.resend.com/emails`)
 */

export interface MailEnv {
  SMTP_HOST?: string;
  SMTP_PORT?: string | number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  [key: string]: unknown;
}

export interface SendMailInput {
  env: MailEnv;
  from: string;
  to: string[];
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
}

export interface SendMailResult {
  ok: boolean;
  provider?: 'smtp' | 'resend';
  status?: number;
  error?: string;
  details?: string;
  fallback?: boolean;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const sanitizeHeaderValue = (value: string): string =>
  String(value || '').replace(/[\r\n]+/g, ' ').trim();

export const extractEmailAddress = (addressOrFormatted: string): string => {
  const cleaned = sanitizeHeaderValue(addressOrFormatted);
  const match = cleaned.match(/<([^<>\s]+@[^<>\s]+)>/);
  return (match ? match[1] : cleaned).trim();
};

export const toBase64Utf8 = (input: string): string => {
  const bytes = textEncoder.encode(input);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};

export const wrapBase64Lines = (b64: string, lineLength = 76): string => {
  const lines: string[] = [];
  for (let i = 0; i < b64.length; i += lineLength) {
    lines.push(b64.slice(i, i + lineLength));
  }
  return lines.join('\r\n');
};

export const encodeMimeHeaderText = (value: string): string => {
  const cleaned = sanitizeHeaderValue(value);
  if (/^[\x20-\x7E]*$/.test(cleaned)) {
    return cleaned;
  }
  // Split UTF-8 bytes into <= 45-byte chunks so each =?UTF-8?B?...?= stays <= 75 chars
  const bytes = textEncoder.encode(cleaned);
  const chunks: string[] = [];
  let i = 0;
  while (i < bytes.length) {
    let end = Math.min(i + 42, bytes.length);
    // Avoid splitting inside a multi-byte UTF-8 sequence (continuation bytes: 10xxxxxx)
    while (end > i && end < bytes.length && (bytes[end] & 0xc0) === 0x80) {
      end--;
    }
    if (end === i) end = Math.min(i + 42, bytes.length);
    let binary = '';
    for (let j = i; j < end; j++) {
      binary += String.fromCharCode(bytes[j]);
    }
    chunks.push(`=?UTF-8?B?${btoa(binary)}?=`);
    i = end;
  }
  return chunks.join('\r\n ');
};

export const formatAddressHeader = (addressOrFormatted: string): string => {
  const cleaned = sanitizeHeaderValue(addressOrFormatted);
  const match = cleaned.match(/^(.*?)<([^<>\s]+@[^<>\s]+)>$/);
  if (!match) return cleaned;
  const displayName = match[1].trim().replace(/^"|"$/g, '');
  const email = match[2].trim();
  if (!displayName) return `<${email}>`;
  return `${encodeMimeHeaderText(displayName)} <${email}>`;
};

export const buildMimeMessage = (params: {
  from: string;
  to: string[];
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
}): string => {
  const boundary = `----=_Part_${crypto.randomUUID().replace(/-/g, '')}`;
  const fromDomain = extractEmailAddress(params.from).split('@')[1] || 'david888.com';
  const messageId = `<${crypto.randomUUID()}@${fromDomain}>`;
  const headers = [
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${messageId}`,
    `From: ${formatAddressHeader(params.from)}`,
    `To: ${params.to.map(formatAddressHeader).join(', ')}`,
    ...(params.replyTo ? [`Reply-To: ${formatAddressHeader(params.replyTo)}`] : []),
    `Subject: ${encodeMimeHeaderText(params.subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];

  const textBody = wrapBase64Lines(toBase64Utf8(params.text));
  const htmlBody = wrapBase64Lines(toBase64Utf8(params.html));

  return [
    headers.join('\r\n'),
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    textBody,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    htmlBody,
    '',
    `--${boundary}--`,
    '',
  ].join('\r\n');
};

export interface SmtpStreamConnection {
  readChunk: () => Promise<Uint8Array | null>;
  writeText: (text: string) => Promise<void>;
  upgradeToTls: () => Promise<void>;
  close: () => Promise<void>;
}

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`SMTP timeout during ${label} (${timeoutMs}ms)`)), timeoutMs);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });

async function openWorkerSocket(host: string, port: number, timeoutMs: number): Promise<SmtpStreamConnection | null> {
  try {
    const mod = await import(/* @vite-ignore */ 'cloudflare:sockets');
    if (!mod || typeof mod.connect !== 'function') return null;

    let socket: any = mod.connect(
      { hostname: host, port },
      { secureTransport: port === 465 ? 'on' : 'starttls' },
    );
    await withTimeout(socket.opened, timeoutMs, 'socket.opened');

    let reader = socket.readable.getReader();
    let writer = socket.writable.getWriter();

    return {
      readChunk: async () => {
        const { value, done } = await withTimeout<{ value?: Uint8Array; done: boolean }>(
          reader.read(),
          timeoutMs,
          'socket.read',
        );
        if (done || !value) return null;
        return value;
      },
      writeText: async (text: string) => {
        await withTimeout(writer.write(textEncoder.encode(text)), timeoutMs, 'socket.write');
      },
      upgradeToTls: async () => {
        reader.releaseLock();
        writer.releaseLock();
        socket = socket.startTls();
        reader = socket.readable.getReader();
        writer = socket.writable.getWriter();
      },
      close: async () => {
        try {
          reader.releaseLock();
        } catch {
          // ignore
        }
        try {
          writer.releaseLock();
        } catch {
          // ignore
        }
        try {
          await socket.close();
        } catch {
          // ignore
        }
      },
    };
  } catch {
    return null;
  }
}

async function openNodeSocket(host: string, port: number, timeoutMs: number): Promise<SmtpStreamConnection> {
  const net = await import('node:net');
  const tls = await import('node:tls');

  let activeSocket: any = await withTimeout(
    new Promise<any>((resolve, reject) => {
      const sock =
        port === 465
          ? tls.connect({ host, port, servername: host }, () => resolve(sock))
          : net.connect({ host, port }, () => resolve(sock));
      sock.once('error', reject);
    }),
    timeoutMs,
    'node.connect',
  );

  let chunks: Uint8Array[] = [];
  let closed = false;
  let pendingResolve: ((chunk: Uint8Array | null) => void) | null = null;
  let pendingReject: ((err: Error) => void) | null = null;

  const attachListeners = (sock: any) => {
    sock.on('data', (buf: Buffer) => {
      const u8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
      if (pendingResolve) {
        const res = pendingResolve;
        pendingResolve = null;
        pendingReject = null;
        res(u8);
      } else {
        chunks.push(u8);
      }
    });
    sock.on('end', () => {
      closed = true;
      if (pendingResolve) {
        const res = pendingResolve;
        pendingResolve = null;
        pendingReject = null;
        res(null);
      }
    });
    sock.on('error', (err: Error) => {
      closed = true;
      if (pendingReject) {
        const rej = pendingReject;
        pendingResolve = null;
        pendingReject = null;
        rej(err);
      }
    });
  };

  attachListeners(activeSocket);

  return {
    readChunk: async () => {
      if (chunks.length > 0) return chunks.shift()!;
      if (closed) return null;
      return withTimeout(
        new Promise<Uint8Array | null>((resolve, reject) => {
          pendingResolve = resolve;
          pendingReject = reject;
        }),
        timeoutMs,
        'node.read',
      );
    },
    writeText: async (text: string) => {
      await withTimeout(
        new Promise<void>((resolve, reject) => {
          activeSocket.write(text, 'utf8', (err?: Error | null) => {
            if (err) reject(err);
            else resolve();
          });
        }),
        timeoutMs,
        'node.write',
      );
    },
    upgradeToTls: async () => {
      activeSocket.removeAllListeners('data');
      activeSocket.removeAllListeners('end');
      activeSocket.removeAllListeners('error');
      chunks = [];
      activeSocket = await withTimeout(
        new Promise<any>((resolve, reject) => {
          const tlsSock = tls.connect(
            { socket: activeSocket, servername: host },
            () => resolve(tlsSock),
          );
          tlsSock.once('error', reject);
        }),
        timeoutMs,
        'node.startTls',
      );
      attachListeners(activeSocket);
    },
    close: async () => {
      try {
        activeSocket.destroy();
      } catch {
        // ignore
      }
    },
  };
}

class SmtpLineReader {
  private buffer = '';
  private conn: SmtpStreamConnection;

  constructor(conn: SmtpStreamConnection) {
    this.conn = conn;
  }

  async readResponse(): Promise<{ code: number; lines: string[]; raw: string }> {
    const lines: string[] = [];
    while (true) {
      const nlIdx = this.buffer.indexOf('\n');
      if (nlIdx !== -1) {
        const line = this.buffer.slice(0, nlIdx).replace(/\r$/, '');
        this.buffer = this.buffer.slice(nlIdx + 1);
        lines.push(line);
        // Last line of SMTP response has space after 3-digit code (e.g., "250 OK"), or just 3 digits
        if (/^\d{3}(?: |$)/.test(line)) {
          return {
            code: Number(line.slice(0, 3)),
            lines,
            raw: lines.join('\n'),
          };
        }
        continue;
      }

      const chunk = await this.conn.readChunk();
      if (!chunk) {
        throw new Error(`SMTP connection closed unexpectedly (buffer=${this.buffer})`);
      }
      this.buffer += textDecoder.decode(chunk, { stream: true });
    }
  }
}

export async function sendEmailViaSmtp(params: {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  to: string[];
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
  timeoutMs?: number;
  connectSocket?: (host: string, port: number, timeoutMs: number) => Promise<SmtpStreamConnection>;
}): Promise<void> {
  const timeoutMs = params.timeoutMs ?? 15000;
  const conn =
    (params.connectSocket && (await params.connectSocket(params.host, params.port, timeoutMs))) ||
    (await openWorkerSocket(params.host, params.port, timeoutMs)) ||
    (await openNodeSocket(params.host, params.port, timeoutMs));

  const reader = new SmtpLineReader(conn);
  const expectCode = async (expectedCodes: number[], step: string) => {
    const res = await reader.readResponse();
    if (!expectedCodes.includes(res.code)) {
      throw new Error(`SMTP ${step} failed (${res.code}): ${res.raw}`);
    }
    return res;
  };

  try {
    await expectCode([220], 'greeting');

    const ehloHost = 'david888-contact-worker.local';
    await conn.writeText(`EHLO ${ehloHost}\r\n`);
    let ehloRes = await expectCode([250], 'EHLO');

    if (params.port !== 465) {
      await conn.writeText('STARTTLS\r\n');
      await expectCode([220], 'STARTTLS');
      await conn.upgradeToTls();
      await conn.writeText(`EHLO ${ehloHost}\r\n`);
      ehloRes = await expectCode([250], 'EHLO after STARTTLS');
    }

    const supportsPlain = ehloRes.lines.some((l) => /AUTH.*\bPLAIN\b/i.test(l));
    if (supportsPlain) {
      const authToken = toBase64Utf8(`\0${params.user}\0${params.pass}`);
      await conn.writeText(`AUTH PLAIN ${authToken}\r\n`);
      await expectCode([235], 'AUTH PLAIN');
    } else {
      await conn.writeText('AUTH LOGIN\r\n');
      await expectCode([334], 'AUTH LOGIN');
      await conn.writeText(`${toBase64Utf8(params.user)}\r\n`);
      await expectCode([334], 'AUTH LOGIN username');
      await conn.writeText(`${toBase64Utf8(params.pass)}\r\n`);
      await expectCode([235], 'AUTH LOGIN password');
    }

    const envelopeFrom = extractEmailAddress(params.from);
    await conn.writeText(`MAIL FROM:<${envelopeFrom}>\r\n`);
    await expectCode([250], 'MAIL FROM');

    for (const recipient of params.to) {
      const rcptEmail = extractEmailAddress(recipient);
      await conn.writeText(`RCPT TO:<${rcptEmail}>\r\n`);
      await expectCode([250, 251], `RCPT TO ${rcptEmail}`);
    }

    await conn.writeText('DATA\r\n');
    await expectCode([354], 'DATA');

    const mime = buildMimeMessage({
      from: params.from,
      to: params.to,
      replyTo: params.replyTo,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    // Dot-stuffing per RFC 5321 section 4.5.2
    const stuffed = mime.replace(/(^|\r\n)\./g, '$1..');
    await conn.writeText(`${stuffed}\r\n.\r\n`);
    await expectCode([250], 'DATA end');

    await conn.writeText('QUIT\r\n');
    try {
      await reader.readResponse();
    } catch {
      // Ignore QUIT close errors
    }
  } finally {
    await conn.close();
  }
}

export async function sendEmailWithFallback(input: SendMailInput): Promise<SendMailResult> {
  const { env, from, to, replyTo, subject, text, html } = input;
  const smtpHost = String(env.SMTP_HOST || '').trim();
  const smtpPort = Number(env.SMTP_PORT || 587);
  const smtpUser = String(env.SMTP_USER || '').trim();
  const smtpPass = String(env.SMTP_PASS || '').trim();
  const hasSmtp = Boolean(smtpHost && smtpUser && smtpPass);
  const resendApiKey = String(env.RESEND_API_KEY || '').trim();

  if (!hasSmtp && !resendApiKey) {
    return {
      ok: false,
      status: 503,
      error: 'Neither SMTP nor RESEND_API_KEY is configured in Worker. Fallback to Firebase.',
      fallback: true,
    };
  }

  let lastErrorDetails = '';

  // 1. Primary: SMTP (AWS SES / configured SMTP server)
  if (hasSmtp) {
    try {
      const smtpFrom = String(env.SMTP_FROM || from).trim();
      await sendEmailViaSmtp({
        host: smtpHost,
        port: smtpPort,
        user: smtpUser,
        pass: smtpPass,
        from: smtpFrom,
        to,
        replyTo,
        subject,
        text,
        html,
      });
      return { ok: true, provider: 'smtp' };
    } catch (smtpErr: unknown) {
      lastErrorDetails = smtpErr instanceof Error ? smtpErr.message : String(smtpErr);
      console.warn('[Mailer] Primary SMTP delivery failed, falling back to Resend API:', lastErrorDetails);
    }
  }

  // 2. Fallback: Resend API
  if (resendApiKey) {
    try {
      const resendFrom = String(env.RESEND_FROM || from).trim();
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: resendFrom,
          to,
          ...(replyTo ? { reply_to: replyTo } : {}),
          subject,
          html,
          text,
        }),
      });

      if (resendRes.ok) {
        return { ok: true, provider: 'resend' };
      }

      const errorText = await resendRes.text().catch(() => '');
      console.warn('[Mailer] Resend fallback API call failed:', resendRes.status, errorText);
      return {
        ok: false,
        status: 502,
        error: 'Failed to deliver email via both SMTP and Resend API.',
        details: errorText || lastErrorDetails,
        fallback: true,
      };
    } catch (resendErr: unknown) {
      const errMsg = resendErr instanceof Error ? resendErr.message : String(resendErr);
      return {
        ok: false,
        status: 502,
        error: 'Failed to deliver email via both SMTP and Resend API.',
        details: errMsg || lastErrorDetails,
        fallback: true,
      };
    }
  }

  return {
    ok: false,
    status: 502,
    error: 'Primary SMTP delivery failed and RESEND_API_KEY fallback is not configured.',
    details: lastErrorDetails,
    fallback: true,
  };
}
