import test from 'node:test';
import assert from 'node:assert/strict';
import { processContactSubmission } from '../api/contact.ts';

test('rejects submissions with missing or invalid fields', async () => {
  const res1 = await processContactSubmission({});
  assert.equal(res1.status, 400);

  const res2 = await processContactSubmission({
    name: 'David',
    email: 'invalid-email',
    subject: 'Hello',
    message: 'Short',
  });
  assert.equal(res2.status, 400);

  const res3 = await processContactSubmission({
    name: 'David',
    email: 'david@example.com',
    subject: 'Hello',
    message: 'Too short',
  });
  assert.equal(res3.status, 400);
});

test('returns 503 fallback when RESEND_API_KEY is not configured', async () => {
  const res = await processContactSubmission(
    {
      name: 'David',
      email: 'david@example.com',
      subject: 'Consultation Inquiry',
      message: 'This is a detailed message with more than ten characters.',
    },
    { RESEND_API_KEY: '' },
  );

  assert.equal(res.status, 503);
  assert.equal(res.body.fallback, true);
});

test('successfully dispatches email to 104@david888.com via Resend API and sends confirmation', async () => {
  const originalFetch = globalThis.fetch;
  const interceptedRequests = [];

  globalThis.fetch = async (url, options) => {
    interceptedRequests.push({ url, options, body: JSON.parse(options.body) });
    if (url.includes('clef.create360.ai')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          model: 'clef-flash',
          answers: {
            classification: {
              choice: 'legitimate_inquiry',
              probabilities: { legitimate_inquiry: 0.95, spam_or_scam: 0.05 },
            },
          },
        }),
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ id: 'email_test_123' }),
    };
  };

  try {
    const res = await processContactSubmission(
      {
        name: 'Alice Cooper',
        email: 'alice@example.com',
        company: 'Cooper Tech',
        subject: '資訊顧問／工商合作',
        message: 'Looking forward to collaborating on an AI agent project.',
      },
      {
        RESEND_API_KEY: 're_test_key_123',
        ADMIN_EMAIL: '104@david888.com',
      },
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.provider, 'resend');
    assert.match(res.body.ticketNo, /^CS-\d{8}-\d{4}$/);

    const adminReq = interceptedRequests.find(
      (r) => r.url === 'https://api.resend.com/emails' && r.body.to?.includes('104@david888.com'),
    );
    assert.ok(adminReq);
    assert.equal(adminReq.options.headers.Authorization, 'Bearer re_test_key_123');
    assert.deepEqual(adminReq.body.to, ['104@david888.com']);
    assert.equal(adminReq.body.reply_to, 'alice@example.com');
    assert.match(adminReq.body.subject, /\[CS-\d{8}-\d{4}\] 資訊顧問／工商合作/);
    assert.ok(adminReq.body.text.includes('Alice Cooper'));
    assert.ok(adminReq.body.text.includes('Cooper Tech'));

    // Verify confirmation receipt request was also attempted
    const receiptReq = interceptedRequests.find((r) => r.body.to?.includes('alice@example.com'));
    assert.ok(receiptReq);
    assert.ok(receiptReq.body.subject.includes('收件確認'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('verifies Turnstile token when TURNSTILE_SECRET is set', async () => {
  const originalFetch = globalThis.fetch;

  // 1. Missing Turnstile token
  const resNoToken = await processContactSubmission(
    {
      name: 'David',
      email: 'david@example.com',
      subject: '獵頭招募／職缺邀約',
      message: 'Recruitment discussion for AI architect position.',
    },
    {
      RESEND_API_KEY: 're_test_123',
      TURNSTILE_SECRET: '0x4AAAAAAtestsecret',
    },
  );
  assert.equal(resNoToken.status, 403);
  assert.equal(resNoToken.body.turnstileFailed, true);

  // 2. Valid Turnstile token verified
  let turnstileVerified = false;
  globalThis.fetch = async (url) => {
    if (url.includes('turnstile/v0/siteverify')) {
      turnstileVerified = true;
      return {
        ok: true,
        json: async () => ({ success: true }),
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ id: 'email_ok' }),
    };
  };

  try {
    const resValid = await processContactSubmission(
      {
        name: 'David',
        email: 'david@example.com',
        subject: '獵頭招募／職缺邀約',
        message: 'Recruitment discussion for AI architect position.',
        turnstileToken: 'cf_valid_token_123',
      },
      {
        RESEND_API_KEY: 're_test_123',
        TURNSTILE_SECRET: '0x4AAAAAAtestsecret',
      },
    );
    assert.equal(resValid.status, 200);
    assert.equal(turnstileVerified, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('returns 502 with fallback flag when Resend API responds with error', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => ({
    ok: false,
    status: 403,
    text: async () => 'Domain not verified',
  });

  try {
    const res = await processContactSubmission(
      {
        name: 'Bob',
        email: 'bob@example.com',
        subject: 'Test Subject',
        message: 'This is a test message that exceeds ten chars.',
      },
      {
        RESEND_API_KEY: 're_test_key_123',
      },
    );

    assert.equal(res.status, 502);
    assert.equal(res.body.fallback, true);
    assert.equal(res.body.details, 'Domain not verified');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('blocks spam or scam messages with 403 when detected by Clef-Flash decision engine', async () => {
  const originalFetch = globalThis.fetch;
  let resendCalled = false;

  globalThis.fetch = async (url) => {
    if (url.includes('clef.create360.ai')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          model: 'clef-flash',
          answers: {
            classification: {
              choice: 'spam_or_scam',
              probabilities: { legitimate_inquiry: 0.01, spam_or_scam: 0.99 },
            },
          },
        }),
      };
    }
    if (url.includes('resend.com')) {
      resendCalled = true;
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };

  try {
    const res = await processContactSubmission(
      {
        name: 'Spam Bot',
        email: 'spammer@casino-seo.xyz',
        subject: '資訊顧問／工商合作',
        message: 'BUY CHEAP BACKLINKS CASINO GAMBLING GUARANTEED RANK 1 TELEGRAM ME',
      },
      {
        RESEND_API_KEY: 're_test_key_123',
      },
    );

    assert.equal(res.status, 403);
    assert.equal(res.body.blocked, true);
    assert.equal(resendCalled, false); // Resend was never called!
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('falls back to Clef-Flash-Q4 (clef.aiurl.tw) when primary node fails, and blocks spam', async () => {
  const originalFetch = globalThis.fetch;
  const contactedEndpoints = [];

  globalThis.fetch = async (url) => {
    contactedEndpoints.push(url);
    if (url.includes('clef.create360.ai')) {
      // Simulate primary failure
      return { ok: false, status: 503, json: async () => ({}) };
    }
    if (url.includes('clef.aiurl.tw')) {
      // Fallback node responds with spam classification
      return {
        ok: true,
        status: 200,
        json: async () => ({
          model: 'clef-flash-q4_k_m',
          answers: {
            classification: {
              choice: 'spam_or_scam',
              probabilities: { legitimate_inquiry: 0.05, spam_or_scam: 0.95 },
            },
          },
        }),
      };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };

  try {
    const res = await processContactSubmission(
      {
        name: 'SEO Scammer',
        email: 'seo@backlink-scam.xyz',
        subject: '資訊顧問／工商合作',
        message: 'Guaranteed #1 ranking backlink network telegram contact me',
      },
      { RESEND_API_KEY: 're_test_key_123' },
    );

    assert.equal(res.status, 403);
    assert.equal(res.body.blocked, true);
    assert.ok(contactedEndpoints.some((u) => u.includes('clef.create360.ai')));
    assert.ok(contactedEndpoints.some((u) => u.includes('clef.aiurl.tw')));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fails open and delivers inquiry when both Clef-Flash nodes are down', async () => {
  const originalFetch = globalThis.fetch;
  let resendDispatched = false;

  globalThis.fetch = async (url) => {
    if (url.includes('clef.create360.ai') || url.includes('clef.aiurl.tw')) {
      // Both nodes down
      throw new Error('Connection refused / 503');
    }
    if (url.includes('resend.com')) {
      resendDispatched = true;
      return { ok: true, status: 200, json: async () => ({ id: 'email_ok_123' }) };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };

  try {
    const res = await processContactSubmission(
      {
        name: 'Real Client',
        email: 'client@realcompany.com',
        subject: '資訊顧問／工商合作',
        message: 'We want to discuss e-commerce system architecture and consulting.',
      },
      { RESEND_API_KEY: 're_test_key_123' },
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.equal(resendDispatched, true); // Fail-open allowed legitimate message to be sent!
  } finally {
    globalThis.fetch = originalFetch;
  }
});
