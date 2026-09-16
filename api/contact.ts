interface ContactPayload {
  name?: string;
  email?: string;
  company?: string;
  subject?: string;
  message?: string;
  turnstileToken?: string;
}

const clean = (value: unknown, maxLength: number): string =>
  String(value || '')
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, maxLength);

const isEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const taipeiDate = (): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replaceAll('-', '');

export const processContactSubmission = async (
  payload: ContactPayload,
  env: Record<string, string | undefined> = process.env,
): Promise<{ status: number; body: Record<string, unknown> }> => {
  const name = clean(payload.name, 100);
  const email = clean(payload.email, 160).toLowerCase();
  const company = clean(payload.company, 160);
  const subject = clean(payload.subject, 180);
  const message = clean(payload.message, 5000);
  const turnstileToken = payload.turnstileToken;

  if (!name || !isEmail(email) || !subject || message.length < 10) {
    return {
      status: 400,
      body: {
        error: 'Please provide a valid name, email, subject, and a message of at least 10 characters.',
      },
    };
  }

  // Cloudflare Turnstile Verification (if TURNSTILE_SECRET is configured)
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

  const adminEmail = env.ADMIN_EMAIL || '104@david888.com';
  const fromEmail = env.RESEND_FROM || 'David888 Portfolio <onboarding@resend.dev>';
  const date = taipeiDate();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const ticketNo = `CS-${date}-${rand}`;

  try {
    // 1. Send notification email to admin (104@david888.com)
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [adminEmail],
        reply_to: email,
        subject: `[${ticketNo}] ${subject}`,
        text: `新聯絡案件 (Resend API)\n\n服務序號：${ticketNo}\n主旨：${subject}\n姓名：${name}\nEmail：${email}\n公司／團隊：${company || '-'}\n\n留言內容：\n${message}`,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.warn('Resend API call failed:', resendResponse.status, errorText);
      return {
        status: 502,
        body: {
          error: 'Resend API failed to deliver email.',
          details: errorText,
          fallback: true,
        },
      };
    }

    // 2. Best-effort confirmation receipt to the sender
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          reply_to: adminEmail,
          subject: `[收件確認] 我們已收到您的訊息 (${ticketNo}) - ${subject}`,
          text: `您好 ${name}：\n\n感謝您的來信！我們已收到您的聯絡訊息，以下是您送出的案件內容摘要：\n\n====================\n服務序號：${ticketNo}\n諮詢主旨：${subject}\n姓名：${name}\nEmail：${email}\n公司／團隊：${company || '-'}\n\n留言內容：\n${message}\n====================\n\nDavid 會盡快親自查閱並透過此 Email 與您聯繫。\n\nDavid888 Portfolio (david888.com)`,
        }),
      });
    } catch (receiptError) {
      console.warn('Sender confirmation receipt email skipped or restricted in sandbox:', receiptError);
    }

    return {
      status: 200,
      body: {
        ok: true,
        ticketNo,
        provider: 'resend',
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error invoking Resend API:', message);
    return {
      status: 500,
      body: {
        error: 'Failed to communicate with Resend API.',
        details: message,
        fallback: true,
      },
    };
  }
};

export default async function handler(req: any, res?: any) {
  // Support Web Standard Request/Response (Vercel Edge or Web runtime)
  if (typeof Request !== 'undefined' && req instanceof Request) {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const payload = await req.json().catch(() => ({}));
    const result = await processContactSubmission(payload);
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Standard Node.js Serverless Function (req, res)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const result = await processContactSubmission(payload);
  return res.status(result.status).json(result.body);
}
