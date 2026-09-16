export interface Env {
  RESEND_API_KEY: string;
  TURNSTILE_SECRET?: string;
  ADMIN_EMAIL?: string;
  RESEND_FROM?: string;
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 1. Handle CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    try {
      const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const name = clean(payload.name, 100);
      const email = clean(payload.email, 160).toLowerCase();
      const company = clean(payload.company, 160);
      const subject = clean(payload.subject, 180);
      const message = clean(payload.message, 5000);
      const turnstileToken = clean(payload.turnstileToken, 2048);

      if (!name || !isEmail(email) || !subject || message.length < 10) {
        return new Response(
          JSON.stringify({
            error: 'Please provide a valid name, email, subject, and a message of at least 10 characters.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        );
      }

      // 2. Cloudflare Turnstile Verification (Independent of Firebase)
      if (env.TURNSTILE_SECRET) {
        if (!turnstileToken) {
          return new Response(
            JSON.stringify({
              error: 'Cloudflare Turnstile verification token missing.',
              turnstileFailed: true,
            }),
            { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
          );
        }

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
          return new Response(
            JSON.stringify({
              error: 'Turnstile verification failed.',
              turnstileFailed: true,
            }),
            { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
          );
        }
      }

      if (!env.RESEND_API_KEY) {
        return new Response(
          JSON.stringify({
            error: 'RESEND_API_KEY is not configured in Worker. Fallback to Firebase.',
            fallback: true,
          }),
          { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        );
      }

      const adminEmail = env.ADMIN_EMAIL || '104@david888.com';
      const fromEmail = env.RESEND_FROM || 'David888 Portfolio <onboarding@resend.dev>';
      const date = taipeiDate();
      const rand = Math.floor(1000 + Math.random() * 9000);
      const ticketNo = `CS-${date}-${rand}`;

      // 3. Send notification email to admin via Resend API (Direct, 0% Firebase)
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [adminEmail],
          reply_to: email,
          subject: `[${ticketNo}] ${subject}`,
          text: `新聯絡案件 (Resend API - Cloudflare Edge)\n\n服務序號：${ticketNo}\n諮詢類型：${subject}\n姓名：${name}\nEmail：${email}\n公司／團隊：${company || '-'}\n\n留言內容：\n${message}`,
        }),
      });

      if (!resendResponse.ok) {
        const errorText = await resendResponse.text();
        console.warn('Resend API call failed in Worker:', errorText);
        return new Response(
          JSON.stringify({
            error: 'Resend API failed to deliver email.',
            details: errorText,
            fallback: true,
          }),
          { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        );
      }

      // 4. Best-effort receipt to the customer
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [email],
            reply_to: adminEmail,
            subject: `[收件確認] 我們已收到您的訊息 (${ticketNo}) - ${subject}`,
            text: `您好 ${name}：\n\n感謝您的來信！我們已收到您的聯絡訊息，以下是您填寫的案件存根：\n\n====================\n服務序號：${ticketNo}\n諮詢類型：${subject}\n姓名：${name}\nEmail：${email}\n公司／團隊：${company || '-'}\n\n留言內容：\n${message}\n====================\n\nDavid 會盡快親自查閱並透過此 Email 與您聯繫。\n\nDavid888 Portfolio (david888.com)`,
          }),
        });
      } catch (receiptErr) {
        console.warn('Receipt delivery skipped in Worker:', receiptErr);
      }

      return new Response(
        JSON.stringify({
          ok: true,
          ticketNo,
          provider: 'resend-edge',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
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
