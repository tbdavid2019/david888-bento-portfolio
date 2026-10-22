export interface Env {
  RESEND_API_KEY: string;
  CONFIRM_SECRET?: string;
  TURNSTILE_SECRET?: string;
  ADMIN_EMAIL?: string;
  RESEND_FROM?: string;
  CF_MODEL?: string;
  ORIGIN?: string;
  AI?: any;
}

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
    .replace(/\bAI\b/gi, '小秘書')
    .replace(/人工智慧/g, '秘書服務')
    .replace(/機器人/g, '秘書助理')
    .replace(/\bBot\b/gi, 'Concierge')
    .replace(/\bLLM\b/gi, '')
    .replace(/語言模型/g, '');
}

export function resolveConfirmOrigin(requestOrigin?: string, envOrigin?: string): string {
  const candidate = (requestOrigin || envOrigin || '').trim();
  if (
    candidate.startsWith('https://') ||
    candidate.startsWith('http://localhost') ||
    candidate.startsWith('http://127.0.0.1')
  ) {
    return candidate.replace(/\/$/, '');
  }
  return 'https://david888-contact-worker.raspy-salad-a4b7.workers.dev';
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

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

// In-memory cache to prevent duplicate sends on repeated link clicks
export const confirmedSignatures = new Set<string>();

export const processContactSubmission = async (
  payload: ContactPayload,
  env: Env,
  requestOrigin?: string,
): Promise<{ status: number; body: Record<string, unknown> }> => {
  const name = clean(payload.name, 100);
  const email = clean(payload.email, 160).toLowerCase();
  const company = clean(payload.company, 160);
  const subject = clean(payload.subject, 180);
  const message = clean(payload.message, 5000);
  const locale = payload.locale === 'en' ? 'en' : 'zh';
  const turnstileToken = clean(payload.turnstileToken, 2048);

  if (!name || !isEmail(email) || !subject || message.length < 10) {
    return {
      status: 400,
      body: {
        error: 'Please provide a valid name, email, subject, and a message of at least 10 characters.',
      },
    };
  }

  // 1. Cloudflare Turnstile Verification
  if (env.TURNSTILE_SECRET && turnstileToken) {
    try {
      const verifyRes = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            secret: env.TURNSTILE_SECRET,
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
    } catch (verifyErr) {
      console.warn('Turnstile verify network error:', verifyErr);
      return {
        status: 403,
        body: {
          error: 'Could not connect to Cloudflare Turnstile verification service.',
          turnstileFailed: true,
        },
      };
    }
  }

  // 2. Clef-Flash System One Spam & Scam Verification (Primary + Fallback + Fail-Open)
  const clefEndpoints = [
    'https://clef.create360.ai/v1/systemone',
    'https://clef.aiurl.tw/v1/systemone',
  ];

  for (const endpoint of clefEndpoints) {
    try {
      const clefRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'clef-flash',
          state: { sender_name: name, sender_email: email, company: company || '', subject, message },
          questions: {
            classification: {
              type: 'choice',
              instructions: 'Classify the intent of this contact message.',
              criteria: {
                legitimate_inquiry:
                  'Legitimate business contact, executive recruitment, tech consulting, partnership, or client question.',
                spam_or_scam:
                  'Automated spam, SEO link pitching, telegram crypto pump, gambling ads, phishing, or bulk solicitation.',
              },
            },
          },
        }),
      });

      if (clefRes.ok) {
        const clefData = (await clefRes.json()) as any;
        const choice = clefData?.answers?.classification?.choice;
        const spamProb = clefData?.answers?.classification?.probabilities?.spam_or_scam ?? 0;
        if (choice === 'spam_or_scam' || spamProb >= 0.7) {
          console.warn(`[Worker] Clef-Flash (${endpoint}) blocked spam from ${email}: choice=${choice}, prob=${spamProb}`);
          return {
            status: 403,
            body: {
              error: '此內容未通過安全性檢驗，已被系統自動屏蔽拒絕發送。',
              blocked: true,
            },
          };
        }
        break; // Verified safe by this node
      } else {
        console.warn(`[Worker] Clef endpoint ${endpoint} HTTP ${clefRes.status}, trying fallback...`);
      }
    } catch (clefErr) {
      console.warn(`[Worker] Clef endpoint ${endpoint} failed, trying fallback:`, clefErr);
    }
  }

  if (!env.RESEND_API_KEY) {
    return {
      status: 503,
      body: {
        error: 'RESEND_API_KEY is not configured in Worker. Fallback to Firebase.',
        fallback: true,
      },
    };
  }

  // 3. Double Opt-in: Generate stateless HMAC token and send confirmation email to the VISITOR
  const secret = env.CONFIRM_SECRET || env.RESEND_API_KEY;
  const tokenPayload: ConfirmationPayload = {
    n: name,
    e: email,
    c: company,
    s: subject,
    m: message,
    l: locale,
    exp: Date.now() + 86400000, // 24-hour expiration
  };

  const confirmationToken = await createConfirmationToken(tokenPayload, secret);
  const origin = resolveConfirmOrigin(requestOrigin, env.ORIGIN);
  const confirmUrl = `${origin}/confirm?token=${encodeURIComponent(confirmationToken)}`;

  const adminEmails = (env.ADMIN_EMAIL || '104@david888.com, tbdavid2019@gmail.com')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
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
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        reply_to: adminEmails[0] || '104@david888.com',
        subject: emailSubject,
        html: htmlContent,
        text: textContent,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.warn('Resend API call failed in Worker:', errorText);
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
        provider: 'resend-edge',
      },
    };
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    return {
      status: 500,
      body: {
        error: 'Unexpected error sending confirmation email in Worker.',
        details: errMessage,
        fallback: true,
      },
    };
  }
};

export const confirmContactSubmission = async (
  token: string,
  env: Env,
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

  // Idempotency check: if token was already confirmed, return success page without calling Resend again
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
        subject: `[小秘書轉達] ${payload.s} — ${payload.n}`,
        text: `David 的小秘書 — 訪客訊息轉達（已完成信箱雙重驗證）\n\n諮詢主旨：${payload.s}\n訪客姓名：${payload.n}\n訪客信箱：${payload.e}\n公司／團隊：${payload.c || '-'}\n\n留言內容：\n${payload.m}\n\n──────────────────────────────────\n此訊息已由訪客於其電子信箱點擊確認驗證後轉達。直接點擊「回覆」即可與訪客聯繫。`,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text().catch(() => '');
      console.error('Failed to deliver confirmed message via Resend in Worker:', resendRes.status, errText);
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
    console.error('Failed to deliver confirmed message to admin email in Worker:', err);
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
  env: Env,
): Promise<{ status: number; body: Record<string, unknown> }> => {
  const rawMessages = Array.isArray(payload.messages) ? payload.messages : [];
  const messages = rawMessages.slice(-10).map((m: any) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: clean(m.content, 800),
  }));

  const locale = payload.locale === 'en' ? 'en' : 'zh';
  const isZh = locale !== 'en';
  const defaultSubject = clean(payload.defaultSubject, 100);

  // 1. Try Cloudflare Workers AI
  if (env.AI && typeof env.AI.run === 'function') {
    const model = env.CF_MODEL || '@cf/openai/gpt-oss-20b';
    const systemPrompt = `You are "David 的小秘書" (in English: "David's Concierge"), the warm, professional, executive personal secretary for David Chiang (江政達 / David888).

CRITICAL DIRECTIVES:
1. PERSONA INTEGRITY: Speak strictly as David's real personal human secretary. Never refer to yourself as virtual, automated, an AI, a bot, or a language model.
2. TONE: Warm, courteous, refined, concise (1-3 sentences), executive assistant persona.
3. CONVERSATIONAL INTERVIEW & GATHERING (NEVER ASK THE USER TO FILL OUT A FORM):
   - You must converse with the visitor step-by-step through natural dialogue to understand their inquiry and collect all necessary details to deliver a message to David.
   - The 3 essential pieces of information required to deliver a message to David are:
     1. Message / Intent (what they want to tell or ask David)
     2. Name / Greeting (how David should address them)
     3. Email (where you will send the confirmation link, and where David can reply)
     (Company is optional).
   - If any of these 3 essential pieces is missing, politely and warmly ask for the missing item(s) in your conversational reply!
4. SUMMARY & DISPATCH:
   - When all 3 essential pieces (Message, Name, valid Email) are provided in the conversation:
     - Formulate a clear bulleted summary in your reply:
       • 稱呼: {name}
       • 信箱: {email}
       • 主旨: {subject}
       • 內容: {message}
     - Ask the visitor: "請問確認要由小秘書為您寄出確認信至 {email} 嗎？"
     - Set "readyToConfirm": true.
5. DIRECT CONTACT CARD:
   - If the visitor asks for David's direct contact, email, or phone, set "revealEmail": true.

OUTPUT FORMAT:
Respond ONLY with a valid JSON object matching this schema:
{
  "reply": "string (warm, concise secretary response in ${isZh ? 'Traditional Chinese' : 'English'})",
  "revealEmail": boolean,
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
        const reply = sanitizeSecretaryText(String(parsed.reply || ''));
        const draftSubject = sanitizeSecretaryText(String(parsed.draft?.subject || defaultSubject || ''));
        const draftMessage = sanitizeSecretaryText(String(parsed.draft?.message || ''));

        return {
          status: 200,
          body: {
            reply,
            revealEmail: Boolean(parsed.revealEmail),
            draft: {
              name: String(parsed.draft?.name || ''),
              email: String(parsed.draft?.email || ''),
              company: String(parsed.draft?.company || ''),
              subject: draftSubject,
              message: draftMessage,
            },
            readyToConfirm: Boolean(parsed.readyToConfirm),
          },
        };
      }
    } catch (aiErr) {
      console.warn('[Concierge] Workers AI execution error, using deterministic fallback:', aiErr);
    }
  }

  // 2. Smart deterministic fallback (multi-turn conversational interview)
  const userMessages = messages.filter((m) => m.role === 'user');
  const lastUserMsg = userMessages[userMessages.length - 1]?.content || '';
  const allUserText = userMessages.map((m) => m.content).join('\n');

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const foundEmail = allUserText.match(emailRegex)?.[0] || '';
  const lastMsgHasEmail = emailRegex.test(lastUserMsg);

  // Distinguish between asking for David's email vs visitor providing their own email
  const wantsEmail =
    !lastMsgHasEmail &&
    (/(?:索取|要|提供|給|看|詢問|有|請問|查|寄給).*(?:email|mail|信箱|郵件|聯絡方式|contact)|(?:david|大衛).*(?:email|mail|信箱|郵件)|(?:email|mail|信箱|郵件|聯絡方式).*(?:是多少|是什麼|在哪|嗎)/i.test(
      lastUserMsg,
    ) ||
      /^(?:email|mail|信箱|聯絡方式)$/i.test(lastUserMsg.trim()));

  let extractedName = '';
  const nameMatch = allUserText.match(/(?:我是|我叫|叫我|稱呼我|稱呼為|name is|I am|I'm)\s*([^\s,，。!！\n]{2,15})/i);
  if (nameMatch) {
    extractedName = nameMatch[1];
  } else {
    const assistantMessages = messages.filter((m) => m.role === 'assistant');
    const lastAssistantMsg = assistantMessages[assistantMessages.length - 1]?.content || '';
    if (/稱呼|姓名|怎麼稱呼|your name/i.test(lastAssistantMsg) && !foundEmail && lastUserMsg.length >= 2 && lastUserMsg.length <= 10) {
      extractedName = lastUserMsg.replace(/^[我叫我是叫我\s]+/, '').trim();
    }
  }

  let extractedCompany = '';
  const companyMatch = allUserText.match(/(?:來自|公司是|任職於|公司名稱|代表\s*|from\s+)([^\s,，。!！\n]{2,20})/i);
  if (companyMatch) extractedCompany = companyMatch[1];

  let detectedSubject = defaultSubject || '';
  if (!detectedSubject) {
    if (/顧問|諮詢|業務|合作|商業|consulting|business/i.test(allUserText)) {
      detectedSubject = isZh ? '顧問諮詢／業務合作' : 'Consulting & Business';
    } else if (/技術|系統|架構|專案|tech|architecture|project/i.test(allUserText)) {
      detectedSubject = isZh ? '技術交流／專案反饋' : 'Tech Chat & Project Feedback';
    } else if (/職缺|招募|獵頭|演講|培訓|recruitment|speaking|job/i.test(allUserText)) {
      detectedSubject = isZh ? '職缺邀約／演講培訓' : 'Opportunities & Speaking';
    } else {
      detectedSubject = isZh ? '其他交流／隨意聊聊' : 'Other Ideas & Chat';
    }
  }

  // Extract message intent
  let extractedMessage = '';
  for (const u of userMessages) {
    const trimmed = u.content.trim();
    if (!trimmed) continue;
    if (trimmed === foundEmail) continue;
    if (nameMatch && (trimmed === `我是${extractedName}` || trimmed === `我叫${extractedName}`)) continue;
    if (/^我想諮詢「.+」相關事宜。$/.test(trimmed)) continue;
    extractedMessage = extractedMessage ? `${extractedMessage}\n${trimmed}` : trimmed;
  }
  if (!extractedMessage) extractedMessage = lastUserMsg;

  // Check if user only clicked a topic inquiry prompt
  const isTopicPrompt =
    /^我想諮詢「.+」相關事宜。$/.test(lastUserMsg.trim()) ||
    /^I'd like to discuss ".+"\./.test(lastUserMsg.trim());

  if (isTopicPrompt) {
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

  // Check missing elements
  const hasEmail = Boolean(foundEmail);
  const hasName = Boolean(extractedName && extractedName.length >= 2);
  const hasMessage = Boolean(extractedMessage && extractedMessage.length >= 5);
  const ready = hasEmail && hasName && hasMessage;

  const isConfirming =
    ready &&
    /^(好|好的|確認|送出|寄出|發送|可以|沒問題|ok|yes|confirm|send)$/i.test(lastUserMsg.trim());

  let reply = '';
  if (wantsEmail) {
    reply = isZh
      ? '好的！已為您在下方展開 David 的直通信箱名片卡 (104@david888.com)。您也可以直接在對話中告訴我想轉達給 David 的話，由我為您整理送達！'
      : "Certainly! I've displayed David's direct contact card below (104@david888.com). You can also tell me what you'd like to forward to David right here!";
  } else if (isConfirming) {
    reply = isZh
      ? `收到！小秘書正為您發送確認信至 ${foundEmail}，請點擊下方按鈕或稍候接收確認信！`
      : `Understood! A confirmation email is being sent to ${foundEmail}. Please click below to complete delivery!`;
  } else if (ready) {
    reply = isZh
      ? `好的！小秘書已為您彙整好欲轉達給 David 的訊息：\n\n• 稱呼：${extractedName}\n• 信箱：${foundEmail}${extractedCompany ? `\n• 公司：${extractedCompany}` : ''}\n• 洽詢主旨：${detectedSubject}\n• 留言內容：${extractedMessage}\n\n請問確認要由小秘書為您寄送確認信至 ${foundEmail} 嗎？請點擊下方「確認送出確認信」即可！`
      : `Excellent! I have compiled your inquiry for David:\n\n• Name: ${extractedName}\n• Email: ${foundEmail}${extractedCompany ? `\n• Company: ${extractedCompany}` : ''}\n• Topic: ${detectedSubject}\n• Message: ${extractedMessage}\n\nShall I send the confirmation email to ${foundEmail}? Please click the confirmation button below!`;
  } else if (!hasName && !hasEmail) {
    reply = isZh
      ? `太棒了，很樂意為您轉達！請問方便請教您的稱呼與聯繫 Email 嗎？小秘書會為您整理好留言並發送確認信，讓 David 能親自回信給您！`
      : `Glad to help forward your message! Could you please share your name and email address so I can prepare a confirmation email for you?`;
  } else if (!hasEmail) {
    reply = isZh
      ? `${extractedName} 您好！請問方便提供您的 Email 嗎？小秘書會寄送一封確認信給您，點擊確認後訊息就會直達 David！`
      : `Nice to meet you, ${extractedName}! Could you share your email address so we can send the confirmation link?`;
  } else if (!hasName) {
    reply = isZh
      ? `感謝您提供信箱 (${foundEmail})！請問方便請教該如何稱呼您呢？`
      : `Thank you for providing ${foundEmail}! How should David address you?`;
  } else {
    reply = isZh
      ? '您好！我是 David 的小秘書。請問有什麼事情需要我協助記錄或轉達給 David 呢？'
      : "Hello! I am David's Concierge. How may I assist you with forwarding an inquiry to David?";
  }

  return {
    status: 200,
    body: {
      reply: sanitizeSecretaryText(reply),
      revealEmail: wantsEmail,
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
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 1. Handle CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // 2. Handle GET /confirm?token=...
    if (request.method === 'GET' && (url.pathname === '/confirm' || url.searchParams.has('token'))) {
      const token = url.searchParams.get('token') || '';
      const result = await confirmContactSubmission(token, env);
      return new Response(result.html, {
        status: result.status,
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    try {
      const payload = (await request.json().catch(() => ({}))) as ContactPayload;

      // 3. Handle POST /chat or payload.action === 'chat'
      if (url.pathname === '/chat' || payload.action === 'chat') {
        const result = await processConciergeChat(payload, env);
        return new Response(JSON.stringify(result.body), {
          status: result.status,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // 4. Handle Contact Submission (Double Opt-in)
      const result = await processContactSubmission(payload, env, url.origin);
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return new Response(
        JSON.stringify({
          error: 'Unexpected error in Contact Worker.',
          details: message,
          fallback: true,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }
  },
};
