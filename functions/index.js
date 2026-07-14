import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2/options';
import { defineSecret } from 'firebase-functions/params';
import nodemailer from 'nodemailer';

initializeApp();
setGlobalOptions({ region: 'asia-east1', maxInstances: 5 });

const db = getFirestore();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ray168j@gmail.com';
const ADMIN_EMAILS = new Set(['oobwei@gmail.com', 'david@aicreate360.com', '104@david888.com']);
const smtpUserSecret = defineSecret('SMTP_USER');
const smtpPassSecret = defineSecret('SMTP_PASS');

const clean = (value, maxLength) => String(value || '').trim().replace(/[<>]/g, '').slice(0, maxLength);
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const taipeiDate = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date()).replaceAll('-', '');

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

const sendMailIfConfigured = async ({ to, subject, text }) => {
  const transport = smtpTransport();
  if (!transport) {
    console.warn('SMTP is not configured; ticket was stored without email delivery.');
    return;
  }
  await transport.transport.sendMail({
    from: process.env.SMTP_FROM || transport.user,
    to,
    subject,
    text,
  });
};

export const createContactTicket = onCall({ secrets: [smtpUserSecret, smtpPassSecret] }, async (request) => {
  const input = request.data || {};
  const name = clean(input.name, 100);
  const email = clean(input.email, 160).toLowerCase();
  const company = clean(input.company, 160);
  const subject = clean(input.subject, 180);
  const message = clean(input.message, 5000);

  if (!name || !isEmail(email) || !subject || message.length < 10) {
    throw new HttpsError('invalid-argument', 'Please provide valid contact details and a message.');
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
  await sendMailIfConfigured({
    to: ADMIN_EMAIL,
    subject: `[${ticketNo}] ${subject}`,
    text: `新聯絡案件\n\n服務序號：${ticketNo}\n姓名：${name}\nEmail：${email}\n公司：${company || '-'}\n\n${message}`,
  });
  return { ticketNo };
});

export const replyToContactTicket = onCall({ secrets: [smtpUserSecret, smtpPassSecret] }, async (request) => {
  if (!request.auth?.token?.email || !ADMIN_EMAILS.has(request.auth.token.email)) {
    throw new HttpsError('permission-denied', 'Admin authentication is required.');
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
    subject: `Re: [${ticketData.ticketNo}] ${ticketData.subject}`,
    text: `David888 回覆你的聯絡案件（${ticketData.ticketNo}）：\n\n${body}`,
  });
  return { ok: true };
});
