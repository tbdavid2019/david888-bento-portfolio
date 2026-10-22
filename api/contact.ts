import {
  checkSpamWithClef,
  evaluateConversationWithClef,
  type ConversationEvaluationResult,
} from '../lib/clef-guard.ts';

export interface ContactPayload {
  action?: string;
  name?: string;
  email?: string;
  company?: string;
  subject?: string;
  message?: string;
  locale?: 'zh' | 'en';
  turnstileToken?: string;
  // For chat
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  defaultSubject?: string;
}

export interface ConfirmationPayload {
  n: string; // name
  e: string; // email
  c?: string; // company
  s: string; // subject
  m: string; // message
  l?: string; // locale
  exp: number; // timestamp in ms
  sp?: boolean; // isSpam
  sc?: string; // choice
  cf?: number; // confidence
  ep?: string; // endpoint
}

const clean = (value: unknown, maxLength: number): string =>
  String(value || '')
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, maxLength);

const isEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const escapeHtml = (str: string): string =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export function sanitizeSecretaryText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/(?:AI\s*(?:小秘書|秘書|助理|助手|客服)|(?<![a-zA-Z])AI(?![a-zA-Z]))/gi, '小秘書')
    .replace(/chat\s*bot|\bBot\b/gi, 'Concierge')
    .replace(/人工智慧/g, '秘書服務')
    .replace(/機器人/g, '秘書助理')
    .replace(/\bLLM\b/gi, '')
    .replace(/語言模型/g, '')
    .replace(/\b(?:Clef|Jev|System\s*One|TypeSafe)\b/gi, '');
}

export function resolveConfirmOrigin(requestOrigin?: string, envOrigin?: string): string {
  const candidate = (envOrigin || requestOrigin || '').trim();
  if (
    candidate.startsWith('https://') ||
    candidate.startsWith('http://localhost') ||
    candidate.startsWith('http://127.0.0.1')
  ) {
    return candidate.replace(/\/$/, '');
  }
  return 'https://david888-contact-worker.raspy-salad-a4b7.workers.dev';
}

// Helper for Base64URL encoding/decoding supporting full UTF-8
function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  if (!secret || !String(secret).trim()) {
    throw new Error('HMAC secret is required');
  }
  const enc = new TextEncoder();
  const keyData = enc.encode(secret.trim());
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function createConfirmationToken(
  payload: ConfirmationPayload,
  secret: string,
): Promise<string> {
  if (!secret || !String(secret).trim()) {
    throw new Error('HMAC secret is required');
  }
  const jsonStr = JSON.stringify(payload);
  const encodedPayload = toBase64Url(new TextEncoder().encode(jsonStr));
  const key = await getHmacKey(secret);
  const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(encodedPayload));
  const encodedSig = toBase64Url(new Uint8Array(sigBuffer));
  return `${encodedPayload}.${encodedSig}`;
}

export async function verifyConfirmationToken(
  token: string,
  secret: string,
): Promise<ConfirmationPayload | null> {
  if (!token || typeof token !== 'string') return null;
  if (!secret || !String(secret).trim()) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, encodedSig] = parts;

  try {
    const key = await getHmacKey(secret);
    const sigBytes = fromBase64Url(encodedSig);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as unknown as BufferSource,
      new TextEncoder().encode(encodedPayload),
    );
    if (!isValid) return null;

    const payloadJson = new TextDecoder().decode(fromBase64Url(encodedPayload));
    const payload = JSON.parse(payloadJson) as ConfirmationPayload;
    if (!payload || typeof payload.exp !== 'number' || payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// In-memory set to prevent duplicate sends on repeated link clicks
export const confirmedSignatures = new Set<string>();

export const processContactSubmission = async (
  payload: ContactPayload,
  env: Record<string, string | undefined> = process.env,
  requestOrigin?: string,
  precomputedClefResult?: any,
): Promise<{ status: number; body: Record<string, unknown> }> => {
  const name = clean(payload.name, 100);
  const email = clean(payload.email, 160).toLowerCase();
  const company = clean(payload.company, 160);
  const subject = clean(payload.subject, 180);
  const message = clean(payload.message, 5000);
  const locale = payload.locale === 'en' ? 'en' : 'zh';
  const turnstileToken = payload.turnstileToken;

  if (!name || !isEmail(email) || !subject || message.length < 5) {
    return {
      status: 400,
      body: {
        error: 'Please provide a valid name, email, subject, and a message of at least 5 characters.',
      },
    };
  }

  // 1. Cloudflare Turnstile Verification (if TURNSTILE_SECRET is configured)
  const turnstileSecret = env.TURNSTILE_SECRET;
  if (turnstileSecret) {
    if (!turnstileToken) {
      return {
        status: 403,
        body: {
          error: 'Cloudflare Turnstile verification token is missing.',
          turnstileFailed: true,
        },
      };
    }

    try {
      const verifyRes = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            secret: turnstileSecret,
            response: turnstileToken,
          }),
        },
      );
      const verifyData = (await verifyRes.json()) as { success?: boolean; 'error-codes'?: string[] };
      if (!verifyData.success) {
        console.warn('Turnstile verification failed:', verifyData['error-codes']);
        return {
          status: 403,
          body: {
            error: 'Cloudflare Turnstile verification failed. Please try again.',
            turnstileFailed: true,
          },
        };
      }
    } catch (turnstileErr: unknown) {
      console.error('Turnstile verification network error:', turnstileErr);
      return {
        status: 403,
        body: {
          error: 'Could not connect to Cloudflare Turnstile verification service.',
          turnstileFailed: true,
        },
      };
    }
  }

  // 2. Clef-Flash & TypeSafe Jev System One Spam & Scam Verification (Evaluated in background, NEVER block!)
  const clefResult = precomputedClefResult || await checkSpamWithClef(
    {
      name,
      email,
      company,
      subject,
      message,
      typesafeApiKey: env.TYPESAFE_API_KEY,
    },
    5000,
  );

  const resendApiKey = env.RESEND_API_KEY;
  if (!resendApiKey) {
    return {
      status: 503,
      body: {
        error: 'RESEND_API_KEY is not configured. Fallback required.',
        fallback: true,
      },
    };
  }

  // 3. Double Opt-in: Generate stateless HMAC token and send confirmation email to the VISITOR
  const secret = env.CONFIRM_SECRET || resendApiKey;
  const tokenPayload: ConfirmationPayload = {
    n: name,
    e: email,
    c: company,
    s: subject,
    m: message,
    l: locale,
    exp: Date.now() + 86400000, // 24-hour expiration
    sp: clefResult.isSpam,
    sc: clefResult.choice,
    cf: clefResult.confidence,
    ep: clefResult.endpoint,
  };

  const confirmationToken = await createConfirmationToken(tokenPayload, secret);
  const origin = resolveConfirmOrigin(requestOrigin, env.ORIGIN);
  const confirmUrl = `${origin}/confirm?token=${encodeURIComponent(confirmationToken)}`;

  const adminEmail = (env.ADMIN_EMAIL || '104@david888.com').split(',')[0].trim();
  const fromEmail = env.RESEND_FROM || "David's Concierge <contact@vip.david888.com>";

  const emailSubject =
    locale === 'en'
      ? `[Confirm Your Email] David's Concierge: Click to deliver your message — ${subject}`
      : `【請確認信箱】David 的小秘書：請點擊完成訊息轉達 — ${subject}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 24px 16px; background-color: #fff9e8; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #17324d; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #faeccb; padding: 32px 28px; box-shadow: 0 4px 20px rgba(23,50,77,0.06); }
    .header { font-size: 20px; font-weight: 800; color: #17324d; margin-bottom: 12px; }
    .intro { font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
    .box { background: #fffdf5; border: 1px solid #f6eccd; border-radius: 12px; padding: 18px; margin-bottom: 28px; font-size: 14px; line-height: 1.6; }
    .row { margin-bottom: 8px; }
    .label { font-weight: 700; color: #17324d; display: inline-block; width: 85px; }
    .msg-preview { margin-top: 10px; padding: 10px; background: #ffffff; border-radius: 8px; border: 1px solid #ebdcb7; white-space: pre-wrap; font-size: 13px; color: #1e293b; }
    .btn-wrap { text-align: center; margin: 30px 0 24px; }
    .btn { display: inline-block; background-color: #ffb010; color: #17324d; font-size: 16px; font-weight: 800; padding: 15px 36px; border-radius: 30px; text-decoration: none; box-shadow: 0 3px 10px rgba(255,176,16,0.35); }
    .footnote { font-size: 12px; color: #64748b; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 16px; word-break: break-all; }
    .footnote a { word-break: break-all; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${locale === 'en' ? "David's Concierge — Confirm Your Message" : 'David 的小秘書：請確認信箱以完成訊息轉達'}
    </div>
    <p class="intro">
      ${
        locale === 'en'
          ? `Hello ${escapeHtml(name)}, thank you for reaching out! To ensure that David can directly reply to you, please click the button below to verify your email and forward your inquiry to David.`
          : `您好 ${escapeHtml(name)}！為了確保 David 收到訊息後能順利回覆您，請點擊下方確認按鈕。點擊後，小秘書將立即將您的訊息呈交給 David 本人！`
      }
    </p>

    <div class="box">
      <div class="row"><span class="label">${locale === 'en' ? 'Name:' : '姓名：'}</span><span>${escapeHtml(name)}</span></div>
      <div class="row"><span class="label">Email：</span><span>${escapeHtml(email)}</span></div>
      ${company ? `<div class="row"><span class="label">${locale === 'en' ? 'Company:' : '公司／團隊：'}</span><span>${escapeHtml(company)}</span></div>` : ''}
      <div class="row"><span class="label">${locale === 'en' ? 'Topic:' : '主旨：'}</span><span>${escapeHtml(subject)}</span></div>
      <div class="row" style="margin-bottom:0;"><span class="label">${locale === 'en' ? 'Message:' : '留言內容：'}</span></div>
      <div class="msg-preview">${escapeHtml(message)}</div>
    </div>

    <div class="btn-wrap">
      <a href="${escapeHtml(confirmUrl)}" class="btn">
        ${locale === 'en' ? 'Deliver to David' : '確認轉達給 David'}
      </a>
    </div>

    <div class="footnote">
      ${
        locale === 'en'
          ? `If you did not initiate this request, you can safely ignore this email. This link will expire in 24 hours.<br>Direct link: <a href="${escapeHtml(confirmUrl)}">${escapeHtml(confirmUrl)}</a>`
          : `若您未曾填寫過此訊息，請忽略此郵件。此確認連結將於 24 小時後失效。<br>備用連結：<a href="${escapeHtml(confirmUrl)}">${escapeHtml(confirmUrl)}</a>`
      }
    </div>
  </div>
</body>
</html>
  `;

  const textContent =
    locale === 'en'
      ? `David's Concierge — Confirm Your Message

Hello ${name},

Please click the confirmation link below to deliver your message directly to David:
${confirmUrl}

====================
Topic: ${subject}
Name: ${name}
Email: ${email}
Company: ${company || '-'}

Message:
${message}
====================

This link will expire in 24 hours.`
      : `David 的小秘書 — 請確認您的信箱以完成訊息轉達

您好 ${name}：

為了確保 David 回信時能順利聯繫上您，請點擊下方確認連結：
${confirmUrl}

點擊連結後，小秘書將立即將您的訊息正式呈交給 David！

====================
主旨：${subject}
姓名：${name}
Email：${email}
公司／團隊：${company || '-'}

留言內容：
${message}
====================

此連結將於 24 小時後失效。`;

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        reply_to: adminEmail,
        subject: emailSubject,
        html: htmlContent,
        text: textContent,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.warn('Resend confirmation email delivery failed:', errorText);
      return {
        status: 502,
        body: {
          error: 'Resend API failed to deliver confirmation email.',
          details: errorText,
          fallback: true,
        },
      };
    }

    return {
      status: 200,
      body: {
        ok: true,
        status: 'pending_confirmation',
        provider: 'resend',
      },
    };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error('Error invoking Resend API:', errMessage);
    return {
      status: 500,
      body: {
        error: 'Failed to communicate with Resend API.',
        details: errMessage,
        fallback: true,
      },
    };
  }
};

export const confirmContactSubmission = async (
  token: string,
  env: Record<string, string | undefined> = process.env,
): Promise<{ status: number; ok: boolean; html: string; error?: string }> => {
  const secret = env.CONFIRM_SECRET || env.RESEND_API_KEY || '';
  const payload = await verifyConfirmationToken(token, secret);
  const isEn = payload?.l === 'en';

  const errorHtml = (title: string, msg: string, lang = 'zh-TW') => `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; padding: 24px 16px; background-color: #fff9e8; color: #17324d; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { max-width: 540px; width: 100%; background: #ffffff; border-radius: 24px; border: 1px solid #f0e6cf; padding: 36px 30px; box-shadow: 0 8px 30px rgba(23, 50, 77, 0.08); text-align: center; }
    h1 { color: #dc2626; font-size: 20px; font-weight: 800; margin-bottom: 12px; }
    p { color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
    .btn { display: inline-block; background-color: #ffb010; color: #17324d; font-size: 15px; font-weight: 800; padding: 13px 32px; border-radius: 30px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(msg)}</p>
    <a href="https://david888.com" class="btn">${lang === 'en' ? 'Back to Homepage' : '返回首頁'}</a>
  </div>
</body>
</html>
  `;

  if (!payload) {
    return {
      status: 400,
      ok: false,
      error: 'Invalid or expired confirmation token.',
      html: errorHtml(
        isEn ? 'Invalid or Expired Link' : '確認連結無效或已過期',
        isEn
          ? 'This confirmation link is invalid or has expired. Please submit your message again at david888.com.'
          : '此確認連結可能已失效或過期，請重新至 david888.com 填寫送出。',
        isEn ? 'en' : 'zh-TW',
      ),
    };
  }

  const successHtml = `
<!DOCTYPE html>
<html lang="${isEn ? 'en' : 'zh-TW'}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${isEn ? "David's Concierge — Message Successfully Delivered" : 'David 的小秘書 — 訊息已成功轉達'}</title>
  <style>
    body {
      margin: 0;
      padding: 24px 16px;
      background-color: #fff9e8;
      color: #17324d;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .card {
      max-width: 580px;
      width: 100%;
      background: #ffffff;
      border-radius: 24px;
      border: 1px solid #f0e6cf;
      padding: 36px 32px;
      box-shadow: 0 8px 30px rgba(23, 50, 77, 0.08);
      box-sizing: border-box;
      text-align: center;
    }
    .avatar-wrap {
      width: 84px;
      height: 84px;
      margin: 0 auto 20px;
      border-radius: 50%;
      background: #fff9e8;
      border: 3px solid #ffb010;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(255, 176, 16, 0.25);
    }
    .avatar-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    h1 {
      color: #17324d;
      font-size: 21px;
      font-weight: 900;
      margin: 0 0 12px;
      line-height: 1.4;
    }
    p.lead {
      color: #4a5568;
      font-size: 15px;
      line-height: 1.6;
      margin: 0 0 24px;
    }
    .receipt {
      background: #fffdf7;
      border: 1px solid #f6eccd;
      border-radius: 16px;
      padding: 20px;
      text-align: left;
      font-size: 14px;
      margin-bottom: 28px;
    }
    .row {
      margin-bottom: 10px;
      display: flex;
      flex-direction: column;
    }
    @media (min-width: 480px) {
      .row { flex-direction: row; }
    }
    .label {
      font-weight: 700;
      color: #17324d;
      width: 90px;
      flex-shrink: 0;
    }
    .val {
      color: #2d3748;
      word-break: break-word;
    }
    .msg-box {
      margin-top: 10px;
      padding: 12px;
      background: #ffffff;
      border-radius: 10px;
      border: 1px solid #ebdcb7;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 13px;
      line-height: 1.6;
      color: #1a202c;
    }
    .btn {
      display: inline-block;
      background-color: #ffb010;
      color: #17324d;
      font-size: 15px;
      font-weight: 800;
      padding: 14px 32px;
      border-radius: 30px;
      text-decoration: none;
      box-shadow: 0 4px 12px rgba(255, 176, 16, 0.35);
      transition: opacity 0.2s;
    }
    .btn:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="avatar-wrap" style="background:#17324d;">
      <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#ffb010" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
    </div>
    <h1>${isEn ? "David's Concierge has officially delivered your message to David!" : 'David 的小秘書已將您的訊息正式呈交給 David！'}</h1>
    <p class="lead">${
      isEn
        ? 'Thank you for verifying your email. Your inquiry and contact info have been sent to David. He will personally review it and reply to your email shortly.'
        : '感謝您完成信箱驗證。您的留言與聯絡資訊已正式送達 David 本人信箱，David 會親自查閱並盡速透過 Email 與您聯繫。'
    }</p>
    <div class="receipt">
      <div class="row"><span class="label">${isEn ? 'Name:' : '姓名：'}</span><span class="val">${escapeHtml(payload.n)}</span></div>
      <div class="row"><span class="label">Email:</span><span class="val">${escapeHtml(payload.e)}</span></div>
      ${payload.c ? `<div class="row"><span class="label">${isEn ? 'Company:' : '公司／團隊：'}</span><span class="val">${escapeHtml(payload.c)}</span></div>` : ''}
      <div class="row"><span class="label">${isEn ? 'Topic:' : '主旨：'}</span><span class="val">${escapeHtml(payload.s)}</span></div>
      <div class="row" style="margin-bottom: 0;">
        <span class="label">${isEn ? 'Message:' : '留言內容：'}</span>
      </div>
      <div class="msg-box">${escapeHtml(payload.m)}</div>
    </div>
    <a href="https://david888.com" class="btn">${isEn ? 'Return to Homepage' : '返回 David 的個人首頁'}</a>
  </div>
</body>
</html>
  `;

  // Idempotency check: if token was already confirmed, return success page without re-sending email
  const sig = token.split('.')[1] || token;
  if (confirmedSignatures.has(sig)) {
    return {
      status: 200,
      ok: true,
      html: successHtml,
    };
  }

  const resendApiKey = env.RESEND_API_KEY;
  if (!resendApiKey) {
    return {
      status: 503,
      ok: false,
      error: 'RESEND_API_KEY is not configured.',
      html: errorHtml(
        isEn ? 'Service Unavailable' : '服務暫時不可用',
        isEn
          ? 'Email delivery service is currently not configured. Please try again later.'
          : '郵件發送服務目前尚未配置，請稍後再試。',
        isEn ? 'en' : 'zh-TW',
      ),
    };
  }

  const adminEmails = (env.ADMIN_EMAIL || '104@david888.com, tbdavid2019@gmail.com')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const fromEmail = env.RESEND_FROM || "David's Concierge <contact@vip.david888.com>";

  try {
    const isSpam = Boolean(payload.sp);
    const choice = payload.sc || 'legitimate_inquiry';
    const confidence = typeof payload.cf === 'number' ? payload.cf : 0.9;
    const endpoint = payload.ep || 'clef-flash';

    const safetyBadge = isSpam
      ? `[⚠️ 疑似廣告 (${(confidence * 100).toFixed(0)}%)]`
      : `[✅ 正常商務 (${(confidence * 100).toFixed(0)}%)]`;

    const finalSubject = `[直通呈報] ${safetyBadge} ${payload.s} — ${payload.n}${payload.c ? ` (${payload.c})` : ''}`;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: adminEmails,
        reply_to: payload.e,
        subject: finalSubject,
        text: `David 的小秘書 — 訪客訊息轉達（已完成信箱雙重驗證）\n\n【決策模型安全分析報告】\n• 識別意圖：${choice}\n• 評估狀態：${safetyBadge}\n• 判定信心度：${(confidence * 100).toFixed(1)}%\n• 推論服務節點：${endpoint}\n\n──────────────────────────────────\n諮詢主旨：${payload.s}\n訪客姓名：${payload.n}\n訪客信箱：${payload.e}\n公司／團隊：${payload.c || '-'}\n\n留言內容：\n${payload.m}\n\n──────────────────────────────────\n此訊息已由訪客於其電子信箱點擊確認驗證後轉達。直接點擊「回覆」即可與訪客聯繫。`,
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin: 0; padding: 24px; background: #fff9e8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #17324d;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #d6bc7c; border-radius: 16px; padding: 24px 28px; box-shadow: 0 4px 16px rgba(23, 50, 77, 0.06);">
    <div style="font-size: 18px; font-weight: bold; color: #17324d; margin-bottom: 16px; border-bottom: 2px solid #ffb010; padding-bottom: 10px;">
      📬 David 的小秘書 — 訪客訊息直通呈報
    </div>
    
    <div style="background: #fffdfa; border: 1px solid #d6bc7c; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px;">
      <div style="font-weight: bold; font-size: 13px; color: #17324d; margin-bottom: 6px;">🛡️ 決策模型安全分析報告</div>
      <div style="font-size: 12px; color: #2b251a; line-height: 1.6;">
        • 識別意圖：<strong>${escapeHtml(choice)}</strong><br/>
        • 評估狀態：<strong>${escapeHtml(safetyBadge)}</strong><br/>
        • 判定信心度：<strong>${(confidence * 100).toFixed(1)}%</strong><br/>
        • 推論服務節點：<code>${escapeHtml(endpoint)}</code>
      </div>
    </div>

    <div style="font-size: 14px; line-height: 1.7; color: #2b251a; margin-bottom: 20px;">
      <strong>稱呼：</strong>${escapeHtml(payload.n)}<br/>
      <strong>信箱：</strong><a href="mailto:${escapeHtml(payload.e)}" style="color: #17324d; font-weight: bold;">${escapeHtml(payload.e)}</a><br/>
      ${payload.c ? `<strong>公司／團隊：</strong>${escapeHtml(payload.c)}<br/>` : ''}
      <strong>主旨：</strong>${escapeHtml(payload.s)}
    </div>

    <div style="background: #fafaf9; border-left: 4px solid #ffb010; padding: 14px 16px; border-radius: 4px; font-size: 14px; line-height: 1.6; color: #1c1917; white-space: pre-wrap; margin-bottom: 20px;">
${escapeHtml(payload.m)}
    </div>

    <div style="font-size: 12px; color: #78716c; border-top: 1px solid #e7e5e4; padding-top: 12px; margin-top: 16px;">
      此郵件由訪客於其電子信箱點擊確認驗證後自動送出。您可以直接點擊此信件的「回覆」與訪客交流。
    </div>
  </div>
</body>
</html>`,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text().catch(() => '');
      console.error('Failed to deliver confirmed message via Resend:', resendRes.status, errText);
      return {
        status: 502,
        ok: false,
        error: 'Failed to deliver confirmed message.',
        html: errorHtml(
          isEn ? 'Delivery Failed' : '訊息送達失敗',
          isEn
            ? 'We encountered an error delivering your message to David. Please click the link in your email again to retry.'
            : '轉達訊息時發生連線錯誤，請再次點擊信中的確認連結重新嘗試。',
          isEn ? 'en' : 'zh-TW',
        ),
      };
    }
  } catch (err) {
    console.error('Failed to deliver confirmed message to admin email:', err);
    return {
      status: 502,
      ok: false,
      error: 'Failed to deliver confirmed message.',
      html: errorHtml(
        isEn ? 'Delivery Failed' : '訊息送達失敗',
        isEn
          ? 'Network error delivering your message to David. Please click the link in your email again to retry.'
          : '轉達訊息時發生網路錯誤，請稍後再次點擊信中的確認連結。',
        isEn ? 'en' : 'zh-TW',
      ),
    };
  }

  // Delivery succeeded! Add to confirmedSignatures
  if (confirmedSignatures.size >= 5000) {
    const oldest = confirmedSignatures.values().next().value;
    if (oldest) confirmedSignatures.delete(oldest);
  }
  confirmedSignatures.add(sig);

  return {
    status: 200,
    ok: true,
    html: successHtml,
  };
};

export const processConciergeChat = async (
  payload: Record<string, any>,
  env: Record<string, any> = process.env,
  workerOrigin?: string,
): Promise<{ status: number; body: Record<string, unknown> }> => {
  const rawMessages = Array.isArray(payload.messages) ? payload.messages : [];
  const messages = rawMessages.slice(-10).map((m: any) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: clean(m.content, 800),
  }));

  const locale = payload.locale === 'en' ? 'en' : 'zh';
  const isZh = locale !== 'en';
  const defaultSubject = clean(payload.defaultSubject, 100);
  const requestOrigin = payload.requestOrigin || workerOrigin || (env.DEFAULT_BASE_URL as string);

  // Check if confirmation email was already dispatched in earlier turns of this conversation
  const alreadyDispatchedInHistory = messages.some(
    (m) =>
      m.role === 'assistant' &&
      (m.content.includes('已自動為您將訊息整理妥當') ||
        m.content.includes('已直接寄出確認信') ||
        m.content.includes('automatically sent a confirmation email') ||
        m.content.includes('已自動為您送出確認信') ||
        m.content.includes('已自動寄送確認信'))
  );

  // 1. Extract conversational details from all user messages
  const userMessages = messages.filter((m) => m.role === 'user');
  const lastUserMsg = userMessages[userMessages.length - 1]?.content || '';
  const allUserText = userMessages.map((m) => m.content).join('\n');

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const foundEmail = allUserText.match(emailRegex)?.[0] || '';
  const lastMsgHasEmail = emailRegex.test(lastUserMsg);

  // Distinguish between asking for David's contact vs visitor simply providing their own email
  const asksForDavidsContact =
    /(?:索取|要|提供|給|看|詢問|有|請問|查|寄給).*(?:david|大衛).*(?:email|mail|信箱|郵件|聯絡方式|contact)/i.test(lastUserMsg) ||
    /(?:david|大衛).*(?:email|mail|信箱|郵件|聯絡方式).*(?:是多少|是什麼|在哪|嗎|可以給我)/i.test(lastUserMsg) ||
    /(?:想|希望|能否|可以|方便).*(?:索取|要|詢問|獲得).*(?:email|mail|信箱|郵件|聯絡方式)/i.test(lastUserMsg) ||
    (!lastMsgHasEmail &&
      (/(?:索取|要|提供|給|看|詢問|有|請問|查|寄給).*(?:email|mail|信箱|郵件|聯絡方式|contact)/i.test(lastUserMsg) ||
        /^(?:email|mail|信箱|聯絡方式)$/i.test(lastUserMsg.trim())));

  const wantsEmail = Boolean(asksForDavidsContact);

  const nonNameVerbs =
    /^(the|a|an|with|from|at|reaching|writing|contacting|looking|interested|delighted|pleased|happy|thrilled|excited|sending|emailing|here|just|glad|wondering|hoping|trying)$/i;

  let extractedName = '';
  const complexIntroMatch = allUserText.match(
    /(?:我是|我叫|叫我|稱呼我|稱呼為)\s*(?:[\w\u4e00-\u9fa5]+(?:\s*的\s*(?:HR|人資|recruiter|經理|主管|顧問|特助|招募)?\s*))([^\s,，。!！\n]{2,15})/i,
  );
  const nameMatch = complexIntroMatch || allUserText.match(/(?:我是|我叫|叫我|稱呼我|稱呼為|name is|I am|I'm)\s*([^\s,，。!！\n]{2,15})/i);
  if (nameMatch && !nonNameVerbs.test(nameMatch[1].trim())) {
    extractedName = nameMatch[1].trim();
  } else {
    for (let i = 0; i < messages.length - 1; i++) {
      const cur = messages[i];
      const next = messages[i + 1];
      if (cur.role === 'assistant' && next.role === 'user') {
        if (/稱呼|姓名|名字|貴姓|怎麼稱呼|your name|who you are|who I am speaking with/i.test(cur.content)) {
          const candidate = next.content.trim().replace(/^[，,。.\s]+|[，,。.\s]+$/g, '');
          const isEmailCandidate = emailRegex.test(candidate);
          const isGreeting = /^(您好|你好|嗨|哈囉|hello|hi|hey)$/i.test(candidate);
          const isChip = /^我想諮詢|^I'd like to discuss/i.test(candidate);
          const isConfirm = /^(好|好的|確認|送出|寄出|發送|可以|沒問題|ok|yes|confirm|send)$/i.test(candidate);
          if (
            candidate.length >= 2 &&
            candidate.length <= 15 &&
            !isEmailCandidate &&
            !isGreeting &&
            !isChip &&
            !isConfirm &&
            !nonNameVerbs.test(candidate)
          ) {
            extractedName = candidate;
            break;
          }
        }
      }
    }
  }

  let extractedCompany = '';
  const companyMatch =
    allUserText.match(/(?:我是|來自)\s*([A-Za-z0-9\u4e00-\u9fa5]{2,20})\s*的\s*(?:HR|人資|recruiter|經理|主管|顧問|特助|工程師|招募|團隊)/i) ||
    allUserText.match(/\b([A-Z][a-zA-Z0-9_.-]+)(?:'s|’s)\s*(?:hiring managers|recruitment team|talent acquisition|team)/) ||
    allUserText.match(/\b(?:hiring managers|recruitment team|talent acquisition)\s+at\s+([A-Za-z0-9_.-]+)/i) ||
    allUserText.match(/\b(?:on behalf of|representative of)\s+([A-Z][a-zA-Z0-9_.-]+)/) ||
    allUserText.match(/(?:來自|公司是|任職於|公司名稱|代表\s*|from\s+)([^\s,，。!！\n]{2,20})/i);
  if (companyMatch) extractedCompany = companyMatch[1].trim();

  let detectedSubject = defaultSubject || '';
  if (!detectedSubject) {
    if (/職缺|招募|獵頭|演講|培訓|面試|人資|\bHR\b|recruitment|speaking|job|interview|hiring\s*manager|talent\s*acquisition/i.test(allUserText)) {
      detectedSubject = isZh ? '職缺邀約／演講培訓' : 'Opportunities & Speaking';
    } else if (/顧問|諮詢|業務|合作|商業|consulting|business/i.test(allUserText)) {
      detectedSubject = isZh ? '顧問諮詢／業務合作' : 'Consulting & Business';
    } else if (/技術|系統|架構|專案|tech|architecture|project/i.test(allUserText)) {
      detectedSubject = isZh ? '技術交流／專案反饋' : 'Tech Chat & Project Feedback';
    } else {
      detectedSubject = isZh ? '其他交流／隨意聊聊' : 'Other Ideas & Chat';
    }
  }

  // Extract message intent
  const contentFilterRegex = /^(?:我想諮詢「.+」相關事宜。|I'd like to discuss ".+"\.|好|好的|確認|送出|寄出|發送|可以|沒問題|ok|yes|confirm|send)$/i;
  let extractedMessage = '';
  for (const u of userMessages) {
    const trimmed = u.content.trim();
    if (!trimmed) continue;
    if (contentFilterRegex.test(trimmed)) continue;
    if (emailRegex.test(trimmed) && trimmed.length <= 50 && !trimmed.includes(' ') && !trimmed.includes('\n')) continue;
    if (extractedName && trimmed === extractedName) continue;
    if (nameMatch && (trimmed === `我是${extractedName}` || trimmed === `我叫${extractedName}`)) continue;
    extractedMessage = extractedMessage ? `${extractedMessage}\n${trimmed}` : trimmed;
  }
  const isTopicPromptText = (text: string): boolean =>
    /^我想諮詢「.+」相關事宜。$/.test(text.trim()) || /^I'd like to discuss ".+"\./.test(text.trim());

  if (!extractedMessage && !isTopicPromptText(lastUserMsg)) extractedMessage = lastUserMsg;

  // Check if user only clicked a topic inquiry prompt
  const hasOnlyTopicPrompt = isTopicPromptText(lastUserMsg);

  if (hasOnlyTopicPrompt) {
    const promptReply = isZh
      ? `您好！很樂意為您安排「${detectedSubject}」相關事宜。請問方便請教您的稱呼與聯繫 Email 是？以及目前想與 David 討論的具體內容是什麼呢？`
      : `Certainly! Regarding "${detectedSubject}", could you share your name, email, and any specific details you would like to discuss with David?`;
    return {
      status: 200,
      body: {
        reply: sanitizeSecretaryText(promptReply),
        revealEmail: false,
        draft: {
          name: extractedName,
          email: foundEmail,
          company: extractedCompany,
          subject: detectedSubject,
          message: '',
        },
        readyToConfirm: false,
      },
    };
  }

  // 2. Invoke Clef / Jev System One Decision Engine for Intent & Gatekeeping Evaluation
  const decision = await evaluateConversationWithClef(
    {
      messages,
      lastUserMsg,
      senderName: extractedName,
      senderEmail: foundEmail,
      company: extractedCompany,
      subject: detectedSubject,
      typesafeApiKey: env.TYPESAFE_API_KEY,
    },
    25000,
  );

  // 3. Gatekeeper Handling for Contact / Email Requests
  const hasEmail = Boolean(foundEmail);
  const hasName = Boolean(extractedName && extractedName.length >= 2);
  const hasMessage = Boolean(extractedMessage && extractedMessage.length >= 5);
  const ready = hasEmail && hasMessage;
  const finalRevealEmail = Boolean(wantsEmail && decision.canRevealEmail);

  let autoDispatched = false;
  let reply = '';

  if (wantsEmail) {
    if (finalRevealEmail) {
      reply = isZh
        ? '感謝您提供詳實完整的交流資訊！經小秘書意圖與安全審核確認為正式邀約，已在下方為您展開 David 的直通信箱名片卡 (104@david888.com)。您可直接複製來信，或由小秘書為您寄出確認信呈報！'
        : "Thank you for providing detailed inquiry information! Having verified this as a formal invitation, I have displayed David's direct contact card below (104@david888.com). You may email directly or have me send a confirmation email!";
    } else {
      reply = isZh
        ? '抱歉，David 先生平時公務繁忙，直通信箱僅提供給具備明確事由的正式合作夥伴。請您先說明您代表的單位、大名與具體洽談主題，小秘書審核後很樂意為您轉達或提供進一步聯繫管道！'
        : "David's direct inbox is reserved for formal partners with verified context. Please share your name, organization, and inquiry topic first, and I will gladly review and forward your message!";
    }

    return {
      status: 200,
      body: {
        reply: sanitizeSecretaryText(reply),
        revealEmail: finalRevealEmail,
        autoDispatched: false,
        draft: {
          name: extractedName,
          email: foundEmail,
          company: extractedCompany,
          subject: detectedSubject,
          message: sanitizeSecretaryText(extractedMessage || allUserText),
        },
        readyToConfirm: ready,
      },
    };
  }

  // 4. Try Cloudflare Workers AI for conversation
  if (env.AI && typeof env.AI.run === 'function') {
    const model = env.CF_MODEL || '@cf/openai/gpt-oss-20b';
    const systemPrompt = `You are "David 的小秘書" (in English: "David's Concierge"), the warm, professional, executive personal secretary and ambassador for David Chiang (江政達 / David888).

[INTERNAL SECURITY & INTENT ASSESSMENT]:
- Evaluated Primary Intent: ${decision.intent} (Confidence: ${Math.round(decision.confidence * 100)}%)
- Safety Assessment: ${decision.isSpam ? 'POTENTIAL SPAM (Handle politely)' : 'CLEAN & SAFE'}
- Email Disclosure Authorization: ${decision.canRevealEmail ? 'APPROVED (Verified High-Value Commercial/Interview Inquiry)' : 'DENIED (Gatekeeping Active: Do NOT disclose David\'s email or phone)'}
- Policy Guidance: ${decision.guidance}

CRITICAL DIRECTIVES:
1. PERSONA & AMBASSADOR IDENTITY (YOU ARE DAVID'S SECRETARY, NOT DAVID, NOT THE CANDIDATE):
   - You are David's personal executive secretary acting on his behalf. You are NOT David himself, and you are NOT the candidate/applicant being interviewed.
   - When a visitor presents an interview invitation, job opportunity, recruitment, or consulting inquiry, NEVER say "Thank you for inviting me to an interview". Instead, proudly and professionally represent David: "非常感謝您對 David 的關注與邀請！我是 David 的秘書，David 具備百人工程組織帶領經驗，專長於技術戰略判斷、跨系統整合與架構決策落地。我會將這份邀請完整呈交給 David 本人。" (in English: "Thank you so much for your interest and invitation to David! As David's concierge, I will make sure this is delivered directly to David.")
   - Never refer to yourself as virtual, automated, an AI, a bot, or a language model.
   - Never reveal, mention, or discuss backend technologies, security systems, model names, or vendor names. Simply represent yourself as David's professional executive secretary.
   - STRICT RULE: NEVER GUESS, INVENT, OR ASSUME NAMES (such as Daniel, John). If the sender's name is not explicitly stated in the dialogue, address them politely as "您".
   - STRICT RULE: DO NOT ask the user to re-paste or summarize what they already typed in the dialogue!
   - STRICT RULE: Whenever asking for their email, always remind them: "（提醒您：請務必提供真實有效信箱，小秘書將自動寄送確認信給您，點擊信中連結驗證後訊息才會送達 David 本人）".
2. GATEKEEPER & PRIVACY DIRECTIVE:
   - David's personal direct email (104@david888.com) is strictly confidential.
   - If the visitor asks for David's email, phone, or direct contact:
     - ONLY set "revealEmail": true IF the decision engine has AUTHORIZED email disclosure (Email Disclosure Authorization: APPROVED).
     - If Email Disclosure Authorization is DENIED (or visitor has not yet provided clear company name, sender name, and inquiry topic):
       - Keep "revealEmail": false.
       - Politely explain that David is occupied with technical architecture and client commitments, and that direct contact is reserved for formal partners with verified context.
       - Warmly invite the visitor to share their name, company, and message details so you can review and deliver it to David.
3. DIRECT RESPECTFUL ADDRESS (NEVER USE "使用者", "對方", "用戶"):
   - You are speaking directly to the visitor in a private consultation. Always address the visitor respectfully as "您" or "[稱呼] 您好". NEVER refer to the visitor as "使用者", "對方", or "用戶"!
4. STRICT LANGUAGE PURITY (ZERO CODE-SWITCHING):
   - When the conversation is in Traditional Chinese (${isZh ? 'YES' : 'NO'}), respond in 100% pure Traditional Chinese (繁體中文). NEVER append or mix English words or sentences.
   - When the conversation is in English, respond in 100% fluent business English.
5. CONVERSATIONAL INTERVIEW & GATHERING:
   - Understand the inquiry and collect the essential pieces of information:
     1. Message / Details (what they wish to tell or propose to David)
     2. Email (where you will automatically send the confirmation link, and where David can reply)
     3. Name / Greeting (optional, how David should address them)
   - If email is missing, politely and warmly ask for their contact email with the real-email reminder.

OUTPUT FORMAT:
Respond ONLY with a valid JSON object matching this schema:
{
  "reply": "string (warm, concise secretary response in ${isZh ? '100% Traditional Chinese with NO English' : 'English'})",
  "revealEmail": ${decision.canRevealEmail ? 'boolean' : 'false'},
  "draft": {
    "name": "string",
    "email": "string",
    "company": "string",
    "subject": "string",
    "message": "string"
  },
  "readyToConfirm": boolean
}`;

    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    try {
      let aiResult: any = null;
      try {
        aiResult = await env.AI.run(model, {
          instructions: systemPrompt,
          input: messages.map((m) => ({ role: m.role, content: m.content })),
          reasoning: { effort: 'low' },
        });
      } catch {
        aiResult = await env.AI.run(model, {
          messages: aiMessages,
        });
      }

      const outputMsgItem = Array.isArray(aiResult?.output)
        ? aiResult.output.find((item: any) => item?.type === 'message' && Array.isArray(item?.content))
        : null;
      const outputTextFromResponsesApi =
        outputMsgItem?.content?.find((c: any) => c?.type === 'output_text' || typeof c?.text === 'string')?.text || '';

      const rawContent =
        outputTextFromResponsesApi ||
        aiResult?.choices?.[0]?.message?.content ||
        aiResult?.response ||
        aiResult?.output_text ||
        '';

      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        let extractedReply =
          parsed.reply ||
          parsed.message ||
          parsed.response ||
          parsed.content ||
          parsed.text ||
          '';
        if (typeof extractedReply !== 'string') {
          extractedReply =
            typeof extractedReply === 'object'
              ? extractedReply.text || extractedReply.content || ''
              : String(extractedReply || '');
        }
        let reply = sanitizeSecretaryText(String(extractedReply || '').trim());

        const rawDraftName = sanitizeSecretaryText(String(parsed.draft?.name || '').trim());
        const isForbiddenName = /^(david|daniel|user|visitor|訪客|使用者|貴賓|guest)$/i.test(rawDraftName);
        const nameAppearsInText = rawDraftName && allUserText.toLowerCase().includes(rawDraftName.toLowerCase());
        const draftName = (!isForbiddenName && nameAppearsInText) ? rawDraftName : (extractedName || '');

        const rawDraftEmail = String(parsed.draft?.email || '').trim().toLowerCase();
        const draftEmail = (isEmail(rawDraftEmail) && allUserText.toLowerCase().includes(rawDraftEmail))
          ? rawDraftEmail
          : (isEmail(foundEmail) ? foundEmail : '');

        const draftCompany = String(parsed.draft?.company || extractedCompany || '').trim();
        const draftSubject = sanitizeSecretaryText(String(parsed.draft?.subject || detectedSubject || defaultSubject || ''));
        const draftMessage = sanitizeSecretaryText(String(parsed.draft?.message || extractedMessage || ''));
        const isReadyNow = Boolean(draftEmail && (draftMessage.length >= 5 || allUserText.length >= 5));

        if (isReadyNow) {
          if (!alreadyDispatchedInHistory) {
            try {
              const submitRes = await processContactSubmission(
                {
                  name: draftName || (isZh ? '貴賓' : 'Guest'),
                  email: draftEmail,
                  company: draftCompany,
                  subject: draftSubject,
                  message: sanitizeSecretaryText(draftMessage || allUserText),
                  locale,
                },
                env,
                requestOrigin,
                decision,
              );
              autoDispatched = submitRes.status === 200;
            } catch (submitErr) {
              console.warn('[ConciergeChat] Auto-dispatch background error:', submitErr);
              autoDispatched = false;
            }
          } else {
            autoDispatched = true;
          }
        }

        if (!reply) {
          if (isReadyNow && autoDispatched) {
            reply = isZh
              ? (alreadyDispatchedInHistory
                  ? `好的！確認信先前已自動寄送至 ${draftEmail}，請務必至您的信箱查收並點擊「確認轉達給 David」連結。一經確認，訊息將立即直達呈報給 David 本人！`
                  : `非常感謝${draftName ? ` ${draftName}` : ''}！小秘書已自動為您將訊息整理妥當，並已直接寄出確認信至 ${draftEmail}。\n\n請務必前往該信箱查收並點擊確認連結（提醒您：請確認信箱真實有效），一經確認，訊息將立即直達呈報給 David 本人！`)
              : (alreadyDispatchedInHistory
                  ? `Understood! The confirmation email was dispatched to ${draftEmail}. Please verify via your inbox to deliver your message directly to David!`
                  : `Thank you so much${draftName ? `, ${draftName}` : ''}! I have prepared your message and automatically sent a confirmation email to ${draftEmail}.\n\nPlease check your inbox and click the verification link (please ensure your email is active) to deliver your message directly to David!`);
          } else if (!draftEmail) {
            reply = isZh
              ? (draftCompany
                  ? `${draftCompany} 的夥伴您好！已為您記錄此項訊息。請問方便請教您的稱呼與真實有效的聯繫 Email 嗎？（提醒您：請務必提供真實有效信箱，小秘書將自動寄送確認信給您，點擊信中連結驗證後訊息才會送達 David 本人）`
                  : '太棒了，很樂意為您轉達！請問方便請教您的稱呼與真實有效的聯繫 Email 嗎？（提醒您：請務必提供真實有效信箱，小秘書將自動寄送確認信給您，點擊信中連結驗證後訊息才會送達 David 本人）')
              : `Glad to help forward your message! Could you please share your name and active contact email? (Please ensure you provide a valid email, as a confirmation link will be sent to complete delivery).`;
          }
        }

        return {
          status: 200,
          body: {
            reply: sanitizeSecretaryText(reply),
            revealEmail: false,
            autoDispatched,
            dispatchedTo: draftEmail || undefined,
            draft: {
              name: draftName,
              email: draftEmail,
              company: draftCompany,
              subject: draftSubject,
              message: draftMessage,
            },
            readyToConfirm: isReadyNow,
          },
        };
      }
    } catch (aiErr) {
      console.warn('[Concierge] Workers AI execution error, using deterministic fallback:', aiErr);
    }
  }

  // 5. Smart deterministic fallback
  if (ready) {
    if (!alreadyDispatchedInHistory) {
      try {
        const submitRes = await processContactSubmission(
          {
            name: extractedName || (isZh ? '貴賓' : 'Guest'),
            email: foundEmail,
            company: extractedCompany,
            subject: detectedSubject,
            message: sanitizeSecretaryText(extractedMessage || allUserText),
            locale,
          },
          env,
          requestOrigin,
          decision,
        );
        autoDispatched = submitRes.status === 200;
      } catch (submitErr) {
        console.warn('[ConciergeChat] Auto-dispatch background error:', submitErr);
        autoDispatched = false;
      }
    } else {
      autoDispatched = true;
    }

    reply = isZh
      ? (alreadyDispatchedInHistory
          ? `好的！確認信先前已自動寄送至 ${foundEmail}，請務必至您的信箱查收並點擊「確認轉達給 David」連結。一經確認，訊息將立即直達呈報給 David 本人！`
          : `非常感謝${extractedName ? ` ${extractedName}` : ''}！小秘書已自動為您將訊息整理妥當，並已直接寄出確認信至 ${foundEmail}。\n\n請務必前往該信箱查收並點擊確認連結（提醒您：請確認信箱真實有效），一經確認，訊息將立即直達呈報給 David 本人！`)
      : (alreadyDispatchedInHistory
          ? `Understood! The confirmation email was dispatched to ${foundEmail}. Please verify via your inbox to deliver your message directly to David!`
          : `Thank you so much${extractedName ? `, ${extractedName}` : ''}! I have prepared your message and automatically sent a confirmation email to ${foundEmail}.\n\nPlease check your inbox and click the verification link (please ensure your email is active) to deliver your message directly to David!`);

    return {
      status: 200,
      body: {
        reply: sanitizeSecretaryText(reply),
        revealEmail: false,
        autoDispatched,
        dispatchedTo: foundEmail,
        draft: {
          name: extractedName,
          email: foundEmail,
          company: extractedCompany,
          subject: detectedSubject,
          message: sanitizeSecretaryText(extractedMessage || allUserText),
        },
        readyToConfirm: ready,
      },
    };
  }

  if (!hasEmail) {
    if (decision.intent === 'recruitment_or_interview' || /職缺|招募|面試|interview/i.test(detectedSubject)) {
      reply = isZh
        ? (extractedCompany
            ? `非常感謝 ${extractedCompany} 對 David 的關注與邀請！我是 David 的秘書，David 具備百人工程組織帶領經驗，專長於技術戰略判斷、跨系統整合與架構決策落地。我會將這份邀請完整呈交給 David 本人。\n\n請問方便請教您的稱呼與真實有效的聯繫 Email 嗎？（提醒您：請務必提供真實有效信箱，小秘書將自動寄送確認信給您，點擊信中連結驗證後訊息才會送達 David 本人）`
            : `非常感謝您對 David 的關注與邀請！我是 David 的秘書，David 具備百人工程組織帶領經驗，專長於技術戰略判斷、跨系統整合與架構決策落地。我會將這份邀請完整呈交給 David 本人。\n\n請問方便請教您的稱呼、公司與真實有效的聯繫 Email 嗎？（提醒您：請務必提供真實有效信箱，小秘書將自動寄送確認信給您，點擊信中連結驗證後訊息才會送達 David 本人）`)
        : `Thank you for reaching out with this opportunity for David! David brings extensive CTO experience leading 100+ engineer R&D organizations, specializing in technology strategy, cross-system integration, and architecture delivery. Could you share your name, organization, and active contact email? (Please ensure you provide a valid email, as a confirmation link will be sent to complete delivery).`;
    } else {
      reply = isZh
        ? (extractedCompany
            ? `${extractedCompany} 的夥伴您好！已為您記錄此項訊息。請問方便請教您的稱呼與真實有效的聯繫 Email 嗎？（提醒您：請務必提供真實有效信箱，小秘書將自動寄送確認信給您，點擊信中連結驗證後訊息才會送達 David 本人）`
            : `太棒了，很樂意為您轉達！請問方便請教您的稱呼與真實有效的聯繫 Email 嗎？（提醒您：請務必提供真實有效信箱，小秘書將自動寄送確認信給您，點擊信中連結驗證後訊息才會送達 David 本人）`)
        : `Glad to help forward your message! Could you please share your name and active contact email? (Please ensure you provide a valid email, as a confirmation link will be sent to complete delivery).`;
    }
  } else {
    reply = isZh
      ? '您好！我是 David 的小秘書。請問有什麼事情需要我協助記錄或轉達給 David 呢？'
      : "Hello! I am David's Concierge. How may I assist you with forwarding an inquiry to David?";
  }

  return {
    status: 200,
    body: {
      reply: sanitizeSecretaryText(reply),
      revealEmail: false,
      autoDispatched: false,
      draft: {
        name: extractedName,
        email: foundEmail,
        company: extractedCompany,
        subject: detectedSubject,
        message: sanitizeSecretaryText(extractedMessage || allUserText),
      },
      readyToConfirm: false,
    },
  };
};

export default async function handler(req: any, res?: any) {
  // Support Web Standard Request/Response (Vercel Edge, Web runtime, Cloudflare)
  if (typeof Request !== 'undefined' && req instanceof Request) {
    const url = new URL(req.url);

    // GET /confirm?token=...
    if (req.method === 'GET' && (url.pathname === '/confirm' || url.searchParams.has('token'))) {
      const token = url.searchParams.get('token') || '';
      const result = await confirmContactSubmission(token);
      return new Response(result.html, {
        status: result.status,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    if (url.pathname === '/chat' || payload.action === 'chat') {
      const result = await processConciergeChat(payload, process.env, url.origin);
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await processContactSubmission(payload, process.env, url.origin);
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Standard Node.js Serverless Function (req, res)
  if (req.method === 'GET' && (req.url?.includes('/confirm') || req.query?.token || req.url?.includes('token='))) {
    let token = (req.query?.token as string) || '';
    if (!token) {
      try {
        const parsedUrl = new URL(req.url || '', 'http://localhost');
        token = parsedUrl.searchParams.get('token') || '';
      } catch {}
    }
    const result = await confirmContactSubmission(token);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(result.status).send(result.html);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  if (req.url?.includes('/chat') || payload.action === 'chat') {
    const result = await processConciergeChat(payload);
    return res.status(result.status).json(result.body);
  }

  const result = await processContactSubmission(payload, process.env);
  return res.status(result.status).json(result.body);
}
