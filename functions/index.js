import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2/options';
import { defineSecret } from 'firebase-functions/params';
import nodemailer from 'nodemailer';

initializeApp();
setGlobalOptions({ region: 'asia-east1', maxInstances: 5 });

const db = getFirestore();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '104@david888.com';
const ADMIN_EMAILS = new Set(['oobwei@gmail.com', 'david@aicreate360.com', '104@david888.com']);
const smtpUserSecret = defineSecret('SMTP_USER');
const smtpPassSecret = defineSecret('SMTP_PASS');
const resendApiKeySecret = defineSecret('RESEND_API_KEY');

const clean = (value, maxLength) => String(value || '').trim().replace(/[<>]/g, '').slice(0, maxLength);
const cleanSingleLine = (value, maxLength) => String(value || '').trim().replace(/[\r\n<>]/g, ' ').slice(0, maxLength);
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const taipeiDate = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date()).replaceAll('-', '');

const getResendApiKey = () => {
  try {
    return resendApiKeySecret.value() || process.env.RESEND_API_KEY || '';
  } catch {
    return process.env.RESEND_API_KEY || '';
  }
};

const sendMailViaResend = async ({ to, subject, text, replyTo }) => {
  const apiKey = getResendApiKey();
  if (!apiKey) return false;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'David888 Portfolio <onboarding@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.warn('Resend API delivery failed:', errorText);
    return false;
  }
  return true;
};

const smtpTransport = () => {
  const user = smtpUserSecret.value() || process.env.SMTP_USER;
  const pass = smtpPassSecret.value() || process.env.SMTP_PASS;
  if (!user || !pass) return null;
  return { transport: nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_PORT || 465) === '465',
    auth: { user, pass },
  }), user };
};

const sendMailIfConfigured = async ({ to, subject, text, replyTo }) => {
  // 1. Try Resend API first
  try {
    const sentViaResend = await sendMailViaResend({ to, subject, text, replyTo });
    if (sentViaResend) {
      console.log('Notification email sent successfully via Resend API.');
      return;
    }
  } catch (resendError) {
    console.warn('Resend API encountered an error, falling back to SMTP:', resendError);
  }

  // 2. Fallback to SMTP
  const transport = smtpTransport();
  if (!transport) {
    console.warn('Neither Resend nor SMTP is configured; ticket was stored without email delivery.');
    return;
  }
  await transport.transport.sendMail({
    from: process.env.SMTP_FROM || transport.user,
    to,
    subject,
    text,
    ...(replyTo ? { replyTo } : {}),
  });
};

export const createContactTicket = onCall({ secrets: [smtpUserSecret, smtpPassSecret, resendApiKeySecret] }, async (request) => {
  const input = request.data || {};
  const name = cleanSingleLine(input.name, 100);
  const email = cleanSingleLine(input.email, 160).toLowerCase();
  const company = cleanSingleLine(input.company, 160);
  const subject = cleanSingleLine(input.subject, 180);
  const message = clean(input.message, 5000);

  if (!name || !isEmail(email) || !subject || message.length < 10) {
    throw new HttpsError('invalid-argument', 'Please provide valid contact details and a message.');
  }

  const turnstileSecret = process.env.TURNSTILE_SECRET;
  if (turnstileSecret) {
    const token = clean(input.turnstileToken, 2048);
    if (!token) {
      throw new HttpsError('permission-denied', 'Cloudflare Turnstile token is required.');
    }
    try {
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: turnstileSecret, response: token }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        throw new HttpsError('permission-denied', 'Cloudflare Turnstile verification failed.');
      }
    } catch (verErr) {
      console.warn('Turnstile verification error in Cloud Function:', verErr);
      throw new HttpsError('internal', 'Verification service error.');
    }
  }

  const date = taipeiDate();
  const counterRef = db.doc(`counters/tickets-${date}`);
  const ticketRef = db.collection('tickets').doc();
  let sequence = 0;

  await db.runTransaction(async (transaction) => {
    const counter = await transaction.get(counterRef);
    sequence = (counter.exists ? Number(counter.data()?.value || 0) : 0) + 1;
    transaction.set(counterRef, { value: sequence, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    transaction.set(ticketRef, {
      ticketNo: `CS-${date}-${String(sequence).padStart(4, '0')}`,
      name, email, company, subject, message,
      status: 'new',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  const ticketNo = `CS-${date}-${String(sequence).padStart(4, '0')}`;
  // 1. Notify admin
  await sendMailIfConfigured({
    to: ADMIN_EMAIL,
    replyTo: email,
    subject: `[${ticketNo}] ${subject}`,
    text: `新聯絡案件\n\n服務序號：${ticketNo}\n諮詢類型：${subject}\n姓名：${name}\nEmail：${email}\n公司／團隊：${company || '-'}\n\n留言內容：\n${message}`,
  });

  // 2. Best-effort customer receipt
  try {
    await sendMailIfConfigured({
      to: email,
      replyTo: ADMIN_EMAIL,
      subject: `[收件確認] 我們已收到您的訊息 (${ticketNo}) - ${subject}`,
      text: `您好 ${name}：\n\n感謝您的來信！我們已收到您的聯絡訊息，以下是您填寫的案件存根：\n\n====================\n服務序號：${ticketNo}\n諮詢類型：${subject}\n姓名：${name}\nEmail：${email}\n公司／團隊：${company || '-'}\n\n留言內容：\n${message}\n====================\n\nDavid 會盡快親自查閱並透過此 Email 與您聯繫。\n\nDavid888 Portfolio (david888.com)`,
    });
  } catch (receiptErr) {
    console.warn('Customer receipt email delivery skipped:', receiptErr);
  }

  return { ticketNo };
});

export const replyToContactTicket = onCall({ secrets: [smtpUserSecret, smtpPassSecret, resendApiKeySecret] }, async (request) => {
  if (!request.auth?.token?.email || !request.auth.token.email_verified || !ADMIN_EMAILS.has(request.auth.token.email)) {
    throw new HttpsError('permission-denied', 'Admin authentication with verified email is required.');
  }

  const ticketId = clean(request.data?.ticketId, 100);
  const body = clean(request.data?.body, 5000);
  if (!ticketId || body.length < 2) throw new HttpsError('invalid-argument', 'Reply is required.');

  const ticketRef = db.doc(`tickets/${ticketId}`);
  const ticket = await ticketRef.get();
  if (!ticket.exists) throw new HttpsError('not-found', 'Ticket not found.');

  const ticketData = ticket.data();
  await ticketRef.collection('replies').add({
    body,
    authorEmail: request.auth.token.email,
    createdAt: FieldValue.serverTimestamp(),
  });
  await ticketRef.update({ status: 'replied', updatedAt: FieldValue.serverTimestamp() });
  await sendMailIfConfigured({
    to: ticketData.email,
    replyTo: ADMIN_EMAIL,
    subject: `Re: [${ticketData.ticketNo}] ${ticketData.subject}`,
    text: `David888 回覆你的聯絡案件（${ticketData.ticketNo}）：\n\n${body}`,
  });
  return { ok: true };
});
