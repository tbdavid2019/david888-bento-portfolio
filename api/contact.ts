import {
  confirmContactSubmission,
  confirmedSignatures,
  createConfirmationToken,
  handleContactHttpRequest,
  processConciergeChat,
  processContactSubmission,
  resolveConfirmOrigin,
  sanitizeSecretaryText,
  verifyConfirmationToken,
  type ConfirmationPayload,
  type ContactPayload,
} from '../lib/contact-core.ts';

export type { ConfirmationPayload, ContactPayload };

export {
  confirmContactSubmission,
  confirmedSignatures,
  createConfirmationToken,
  processConciergeChat,
  processContactSubmission,
  resolveConfirmOrigin,
  sanitizeSecretaryText,
  verifyConfirmationToken,
};

export default async function handler(req: any, res?: any) {
  if (typeof Request !== 'undefined' && req instanceof Request) {
    return handleContactHttpRequest(req, process.env, false);
  }

  if (req.method === 'GET' && (req.url?.includes('/confirm') || req.query?.token || req.url?.includes('token='))) {
    let token = (req.query?.token as string) || '';
    if (!token) {
      try {
        const parsedUrl = new URL(req.url || '', 'http://localhost');
        token = parsedUrl.searchParams.get('token') || '';
      } catch {
        // Ignore malformed local request URL
      }
    }
    const result = await confirmContactSubmission(token, process.env);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(result.status).send(result.html);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  if (req.url?.includes('/chat') || payload.action === 'chat') {
    const result = await processConciergeChat(payload, process.env);
    return res.status(result.status).json(result.body);
  }

  const result = await processContactSubmission(payload, process.env);
  return res.status(result.status).json(result.body);
}
