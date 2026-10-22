import test from 'node:test';
import assert from 'node:assert/strict';
import {
  processContactSubmission,
  confirmContactSubmission,
  createConfirmationToken,
  verifyConfirmationToken,
  processConciergeChat,
  confirmedSignatures,
  sanitizeSecretaryText,
  resolveConfirmOrigin,
} from '../api/contact.ts';
import workerDefault from '../workers/contact-worker/src/index.ts';

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
    message: '1234', // < 5 chars should be rejected with 400
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

test('Step 1 Double Opt-in: processContactSubmission checks Clef-Flash, does NOT email David yet, sends confirmation link to visitor, and returns pending_confirmation with NO ticket number', async () => {
  const originalFetch = globalThis.fetch;
  const interceptedRequests = [];

  globalThis.fetch = async (url, options) => {
    const body = options?.body ? JSON.parse(options.body) : null;
    interceptedRequests.push({ url, options, body });

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
        subject: '顧問諮詢／業務合作',
        message: 'Looking forward to collaborating on an enterprise system project.',
      },
      {
        RESEND_API_KEY: 're_test_key_123',
        ADMIN_EMAIL: '104@david888.com',
      },
      'https://david888.com',
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.status, 'pending_confirmation');
    assert.equal(res.body.provider, 'resend');
    // Critical Rule 2: NO ticketNo generated or returned!
    assert.equal(res.body.ticketNo, undefined);

    // Verify David (104@david888.com) was NOT emailed yet!
    const adminReq = interceptedRequests.find(
      (r) => r.url === 'https://api.resend.com/emails' && r.body?.to?.includes('104@david888.com'),
    );
    assert.equal(adminReq, undefined, 'David should NOT receive email before visitor confirms!');

    // Verify visitor received confirmation email
    const visitorReq = interceptedRequests.find(
      (r) => r.url === 'https://api.resend.com/emails' && r.body?.to?.includes('alice@example.com'),
    );
    assert.ok(visitorReq, 'Visitor must receive double opt-in confirmation email');
    assert.ok(visitorReq.body.subject.includes('請確認信箱'));
    assert.ok(visitorReq.body.subject.includes('David 的小秘書'));
    assert.ok(visitorReq.body.text.includes('https://david888.com/confirm?token='));
    assert.ok(visitorReq.body.html.includes('https://david888.com/confirm?token='));
    assert.ok(visitorReq.body.html.includes('確認轉達給 David'));

    // Critical Rule 1: No "AI" or "Bot" words anywhere in email content
    assert.ok(!/\bAI\b/i.test(visitorReq.body.text));
    assert.ok(!visitorReq.body.text.includes('人工智慧'));
    assert.ok(!visitorReq.body.text.includes('機器人'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Step 2 Double Opt-in: confirmContactSubmission verifies HMAC token, delivers to 104@david888.com, and is idempotent on repeat clicks', async () => {
  const originalFetch = globalThis.fetch;
  let adminResendCalls = 0;
  let dispatchedPayload = null;

  globalThis.fetch = async (url, options) => {
    if (url.includes('api.resend.com/emails')) {
      adminResendCalls++;
      dispatchedPayload = JSON.parse(options.body);
      return { ok: true, status: 200, json: async () => ({ id: 'email_admin_123' }) };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };

  try {
    const env = {
      RESEND_API_KEY: 're_secret_abc123',
      ADMIN_EMAIL: '104@david888.com, tbdavid2019@gmail.com',
    };

    // 1. Create a valid HMAC token
    const token = await createConfirmationToken(
      {
        n: 'Bob Dylan',
        e: 'bob@music.com',
        c: 'Studio Co.',
        s: '技術交流／打個招呼',
        m: 'Greetings! Would love to chat about architecture and systems.',
        l: 'zh',
        exp: Date.now() + 86400000,
      },
      env.RESEND_API_KEY,
    );

    // 2. Click confirm (first time)
    const result1 = await confirmContactSubmission(token, env);
    assert.equal(result1.status, 200);
    assert.equal(result1.ok, true);
    assert.equal(adminResendCalls, 1);
    assert.ok(dispatchedPayload);
    assert.deepEqual(dispatchedPayload.to, ['104@david888.com', 'tbdavid2019@gmail.com']);
    assert.equal(dispatchedPayload.reply_to, 'bob@music.com');
    assert.equal(dispatchedPayload.subject, '[小秘書轉達] 技術交流／打個招呼 — Bob Dylan');
    assert.ok(dispatchedPayload.text.includes('Bob Dylan'));
    assert.ok(result1.html.includes('David 的小秘書已將您的訊息正式呈交給 David！'));
    assert.ok(result1.html.includes('#fff9e8'));

    // 3. Click confirm again (idempotency check: should return 200 HTML without re-calling Resend!)
    const result2 = await confirmContactSubmission(token, env);
    assert.equal(result2.status, 200);
    assert.equal(result2.ok, true);
    assert.equal(adminResendCalls, 1, 'Resend API should NOT be called a second time!');
    assert.ok(result2.html.includes('David 的小秘書已將您的訊息正式呈交給 David！'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('confirmContactSubmission Resend failure retry safety: does not mark confirmed and allows retry', async () => {
  const originalFetch = globalThis.fetch;
  let attempts = 0;

  const env = {
    RESEND_API_KEY: 're_secret_retry_test',
    ADMIN_EMAIL: '104@david888.com',
  };

  const token = await createConfirmationToken(
    {
      n: 'Retry User',
      e: 'retry@example.com',
      s: '顧問諮詢／業務合作',
      m: 'Message for retry test exceeding ten characters.',
      l: 'zh',
      exp: Date.now() + 86400000,
    },
    env.RESEND_API_KEY,
  );

  globalThis.fetch = async (url) => {
    if (url.includes('api.resend.com/emails')) {
      attempts++;
      if (attempts === 1) {
        return { ok: false, status: 500, text: async () => 'Internal Server Error' };
      }
      return { ok: true, status: 200, json: async () => ({ id: 'email_ok' }) };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };

  try {
    // Attempt 1: Resend fails (500)
    const res1 = await confirmContactSubmission(token, env);
    assert.equal(res1.status, 502);
    assert.equal(res1.ok, false);
    assert.ok(res1.html.includes('訊息送達失敗'));

    // Attempt 2: Visitor retries clicking the confirmation link, Resend succeeds
    const res2 = await confirmContactSubmission(token, env);
    assert.equal(res2.status, 200);
    assert.equal(res2.ok, true);
    assert.ok(res2.html.includes('David 的小秘書已將您的訊息正式呈交給 David！'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('rejects tampered or expired confirmation tokens with 400', async () => {
  const env = { RESEND_API_KEY: 're_test_key_xyz' };

  // 1. Tampered signature
  const validToken = await createConfirmationToken(
    {
      n: 'Charlie',
      e: 'charlie@test.com',
      s: 'Topic',
      m: 'Message of ten characters.',
      exp: Date.now() + 86400000,
    },
    env.RESEND_API_KEY,
  );
  const tamperedToken = validToken + 'tampered';
  const resTampered = await confirmContactSubmission(tamperedToken, env);
  assert.equal(resTampered.status, 400);
  assert.equal(resTampered.ok, false);
  assert.ok(resTampered.html.includes('確認連結無效或已過期'));

  // 2. Expired token
  const expiredToken = await createConfirmationToken(
    {
      n: 'Charlie',
      e: 'charlie@test.com',
      s: 'Topic',
      m: 'Message of ten characters.',
      exp: Date.now() - 1000, // expired 1s ago
    },
    env.RESEND_API_KEY,
  );
  const resExpired = await confirmContactSubmission(expiredToken, env);
  assert.equal(resExpired.status, 400);
  assert.equal(resExpired.ok, false);
});

test('HMAC secret validation: create throws error and verify returns null when secret is empty', async () => {
  await assert.rejects(
    async () => {
      await createConfirmationToken({ n: 'Test', e: 'test@test.com', s: 'S', m: 'Message of 10 chars', exp: 123 }, '');
    },
    { message: 'HMAC secret is required' },
  );

  await assert.rejects(
    async () => {
      await createConfirmationToken({ n: 'Test', e: 'test@test.com', s: 'S', m: 'Message of 10 chars', exp: 123 }, '   ');
    },
    { message: 'HMAC secret is required' },
  );

  const verifyEmpty = await verifyConfirmationToken('abc.def', '');
  assert.equal(verifyEmpty, null);

  const verifySpaces = await verifyConfirmationToken('abc.def', '   ');
  assert.equal(verifySpaces, null);
});

test('Double Opt-in localization: renders English HTML when locale is en', async () => {
  const env = {
    RESEND_API_KEY: 're_secret_en_test',
    ADMIN_EMAIL: '104@david888.com',
  };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ id: 'resend_ok' }) });

  try {
    const token = await createConfirmationToken(
      {
        n: 'John Doe',
        e: 'john@example.com',
        c: 'Global Corp',
        s: 'Consulting & Business',
        m: 'Inquiry regarding enterprise cloud architecture.',
        l: 'en',
        exp: Date.now() + 86400000,
      },
      env.RESEND_API_KEY,
    );

    const result = await confirmContactSubmission(token, env);
    assert.equal(result.status, 200);
    assert.equal(result.ok, true);
    assert.ok(result.html.includes('<html lang="en">'));
    assert.ok(result.html.includes("David's Concierge has officially delivered your message to David!"));
    assert.ok(result.html.includes('Name:'));
    assert.ok(result.html.includes('Company:'));
    assert.ok(result.html.includes('Topic:'));
    assert.ok(result.html.includes('Message:'));
    assert.ok(result.html.includes('Return to Homepage'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('resolveConfirmOrigin validates protocols and defaults to worker URL', () => {
  assert.equal(
    resolveConfirmOrigin('https://custom.com', ''),
    'https://custom.com',
  );
  assert.equal(
    resolveConfirmOrigin('http://localhost:5173', ''),
    'http://localhost:5173',
  );
  assert.equal(
    resolveConfirmOrigin('javascript:alert(1)', ''),
    'https://david888-contact-worker.raspy-salad-a4b7.workers.dev',
  );
  assert.equal(
    resolveConfirmOrigin('', ''),
    'https://david888-contact-worker.raspy-salad-a4b7.workers.dev',
  );
});

test('sanitizeSecretaryText removes forbidden AI jargon completely', () => {
  const text = '這是一個AI人工智慧機器人Bot提供的LLM語言模型回答，並經由Clef與Jev安全驗證。';
  const cleanText = sanitizeSecretaryText(text);
  assert.ok(!/\bAI\b/i.test(cleanText));
  assert.ok(!cleanText.includes('人工智慧'));
  assert.ok(!cleanText.includes('機器人'));
  assert.ok(!/\bBot\b/i.test(cleanText));
  assert.ok(!/\bLLM\b/i.test(cleanText));
  assert.ok(!cleanText.includes('語言模型'));
  assert.ok(!/\bClef\b/i.test(cleanText));
  assert.ok(!/\bJev\b/i.test(cleanText));
});

test('verifies Turnstile token when TURNSTILE_SECRET is set', async () => {
  const originalFetch = globalThis.fetch;

  // 1. Missing Turnstile token
  const resNoToken = await processContactSubmission(
    {
      name: 'David',
      email: 'david@example.com',
      subject: '職缺邀約／演講培訓',
      message: 'Recruitment discussion for system architect position.',
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
        subject: '職缺邀約／演講培訓',
        message: 'Recruitment discussion for system architect position.',
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
        subject: '顧問諮詢／業務合作',
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
      return { ok: false, status: 503, json: async () => ({}) };
    }
    if (url.includes('clef.aiurl.tw')) {
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
        subject: '顧問諮詢／業務合作',
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

test('fails open and sends confirmation email when both Clef-Flash nodes are down', async () => {
  const originalFetch = globalThis.fetch;
  let resendDispatched = false;

  globalThis.fetch = async (url) => {
    if (url.includes('clef.create360.ai') || url.includes('clef.aiurl.tw')) {
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
        subject: '顧問諮詢／業務合作',
        message: 'We want to discuss e-commerce system architecture and consulting.',
      },
      { RESEND_API_KEY: 're_test_key_123' },
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.status, 'pending_confirmation');
    assert.equal(resendDispatched, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('processConciergeChat runs Workers AI with CF_MODEL (@cf/openai/gpt-oss-20b) and has zero AI words', async () => {
  let aiRunCalled = false;
  let receivedModel = '';

  const mockEnv = {
    CF_MODEL: '@cf/openai/gpt-oss-20b',
    AI: {
      run: async (model, params) => {
        aiRunCalled = true;
        receivedModel = model;
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  reply: '您好！我是 David 的小秘書。請問您希望就哪項架構或系統專案進行討論呢？',
                  revealEmail: false,
                  draft: {
                    name: '王小明',
                    email: 'wang@example.com',
                    company: '創新科技',
                    subject: '顧問諮詢／業務合作',
                    message: '希望諮詢高併發電商系統架構',
                  },
                  readyToConfirm: true,
                }),
              },
            },
          ],
        };
      },
    },
  };

  const res = await processConciergeChat(
    {
      messages: [
        { role: 'user', content: '我是創新科技的王小明 (wang@example.com)，想諮詢高併發電商系統架構。' },
      ],
      locale: 'zh',
    },
    mockEnv,
  );

  assert.equal(res.status, 200);
  assert.equal(aiRunCalled, true);
  assert.equal(receivedModel, '@cf/openai/gpt-oss-20b');
  assert.equal(res.body.revealEmail, false);
  assert.equal(res.body.readyToConfirm, true);
  assert.equal(res.body.draft.name, '王小明');
  assert.equal(res.body.draft.email, 'wang@example.com');
  // Critical Rule 1 check: Zero occurrences of "AI" or "Bot"
  assert.ok(!/\bAI\b/i.test(res.body.reply));
  assert.ok(!res.body.reply.includes('人工智慧'));
  assert.ok(!res.body.reply.includes('機器人'));
});

test('processConciergeChat topic prompt: asks for user details and keeps draft message empty', async () => {
  const res = await processConciergeChat(
    {
      messages: [
        { role: 'user', content: '我想諮詢「顧問諮詢／業務合作」相關事宜。' },
      ],
      locale: 'zh',
    },
    {},
  );

  assert.equal(res.status, 200);
  assert.equal(res.body.revealEmail, false);
  assert.equal(res.body.readyToConfirm, false);
  assert.equal(res.body.draft.message, '');
  assert.ok(res.body.reply.includes('顧問諮詢／業務合作'));
});

test('processConciergeChat smart fallback refuses unverified email request as gatekeeper with zero AI words', async () => {
  const res = await processConciergeChat(
    {
      messages: [
        { role: 'user', content: '我想直接索取 David 的 Email 信箱，謝謝！' },
      ],
      locale: 'zh',
    },
    {}, // No Workers AI bound, triggers smart fallback with Clef gatekeeper
  );

  assert.equal(res.status, 200);
  assert.equal(res.body.revealEmail, false);
  assert.ok(
    res.body.reply.includes('David 先生平時公務繁忙') ||
    res.body.reply.includes('直通信箱僅提供給') ||
    res.body.reply.includes('小秘書審核'),
  );
  assert.ok(!/\bAI\b/i.test(res.body.reply));
  assert.ok(!res.body.reply.includes('人工智慧'));
  assert.ok(!res.body.reply.includes('機器人'));
});

test('processConciergeChat reveals email card when Clef System One approves verified executive recruitment request', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (url.includes('systemone')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          model: 'clef-flash',
          answers: {
            intent: {
              choice: 'recruitment_or_interview',
              confidence: 0.98,
              probabilities: { recruitment_or_interview: 0.98 },
            },
            email_disclosure: {
              choice: 'approved',
              confidence: 0.95,
              probabilities: { approved: 0.95, denied: 0.05 },
            },
          },
        }),
      };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };

  try {
    const res = await processConciergeChat(
      {
        messages: [
          {
            role: 'user',
            content: '我是 Hytech 的招募主管 Sarah (sarah@hytech.com)，想索取 David 的 Email 信箱以便寄送 Chief Architect 職缺面試邀請。',
          },
        ],
        locale: 'zh',
      },
      {},
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.revealEmail, true);
    assert.ok(res.body.reply.includes('名片卡'));
    assert.ok(res.body.reply.includes('104@david888.com'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('workers/contact-worker fetch handler routes OPTIONS, GET /confirm, POST /chat, and POST / correctly', async () => {
  const workerEnv = {
    RESEND_API_KEY: 're_worker_test_123',
    ADMIN_EMAIL: '104@david888.com',
  };

  // 1. OPTIONS preflight
  const optReq = new Request('https://worker.dev/', { method: 'OPTIONS' });
  const optRes = await workerDefault.fetch(optReq, workerEnv);
  assert.equal(optRes.status, 200);
  assert.equal(optRes.headers.get('Access-Control-Allow-Origin'), '*');

  // 2. 405 Method Not Allowed
  const putReq = new Request('https://worker.dev/', { method: 'PUT' });
  const putRes = await workerDefault.fetch(putReq, workerEnv);
  assert.equal(putRes.status, 405);

  // 3. POST /chat (unverified email request is gatekept)
  const chatReq = new Request('https://worker.dev/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: '我想索取信箱' }],
    }),
  });
  const chatRes = await workerDefault.fetch(chatReq, workerEnv);
  assert.equal(chatRes.status, 200);
  const chatData = await chatRes.json();
  assert.equal(chatData.revealEmail, false);

  // 4. GET /confirm
  const token = await createConfirmationToken(
    {
      n: 'Worker Tester',
      e: 'wtester@example.com',
      s: '技術交流／打個招呼',
      m: 'Worker test message exceeding ten characters.',
      l: 'zh',
      exp: Date.now() + 86400000,
    },
    workerEnv.RESEND_API_KEY,
  );

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ id: 'ok' }) });

  try {
    const confirmReq = new Request(`https://worker.dev/confirm?token=${encodeURIComponent(token)}`, {
      method: 'GET',
    });
    const confirmRes = await workerDefault.fetch(confirmReq, workerEnv);
    assert.equal(confirmRes.status, 200);
    const html = await confirmRes.text();
    assert.ok(html.includes('David 的小秘書已將您的訊息正式呈交給 David！'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('processConciergeChat conducts multi-turn interview: asks for missing contact details before confirming', async () => {
  // Turn 1: User only provides message intent without name or email
  const turn1 = await processConciergeChat(
    {
      messages: [
        { role: 'user', content: '我想跟他說，我有使用他的專案' },
      ],
      locale: 'zh',
    },
    {},
  );

  assert.equal(turn1.status, 200);
  assert.equal(turn1.body.readyToConfirm, false);
  assert.ok(turn1.body.reply.includes('稱呼'));
  assert.ok(turn1.body.reply.includes('Email') || turn1.body.reply.includes('信箱'));

  // Turn 2: User answers with name and email
  const turn2 = await processConciergeChat(
    {
      messages: [
        { role: 'user', content: '我想跟他說，我有使用他的專案' },
        { role: 'assistant', content: turn1.body.reply },
        { role: 'user', content: '我是 Alex，信箱是 alex@example.com' },
      ],
      locale: 'zh',
    },
    {},
  );

  assert.equal(turn2.status, 200);
  assert.equal(turn2.body.readyToConfirm, true);
  assert.equal(turn2.body.draft.name, 'Alex');
  assert.equal(turn2.body.draft.email, 'alex@example.com');
  assert.ok(turn2.body.draft.message.includes('我有使用他的專案'));
  assert.ok(turn2.body.reply.includes('Alex'));
  assert.ok(turn2.body.reply.includes('alex@example.com'));
});

test('accepts submissions with minimum 5 character message', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ id: 'email_ok_5char' }),
  });

  try {
    const res = await processContactSubmission(
      {
        name: 'Five Char Tester',
        email: 'tester@example.com',
        subject: '顧問諮詢／業務合作',
        message: '12345', // exactly 5 characters
      },
      { RESEND_API_KEY: 're_test_key_123' },
    );
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.status, 'pending_confirmation');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('processConciergeChat preserves standalone name across turns and isolates topic chip prompt', async () => {
  // Turn 1: User clicks topic chip
  const turn1 = await processConciergeChat(
    {
      messages: [
        { role: 'user', content: '我想諮詢「顧問諮詢／業務合作」相關事宜。' },
      ],
      locale: 'zh',
    },
    {},
  );
  assert.equal(turn1.body.readyToConfirm, false);
  assert.equal(turn1.body.draft.message, '');

  // Turn 2: User provides message
  const turn2 = await processConciergeChat(
    {
      messages: [
        { role: 'user', content: '我想諮詢「顧問諮詢／業務合作」相關事宜。' },
        { role: 'assistant', content: turn1.body.reply },
        { role: 'user', content: '我們團隊想邀請 David 擔任系統架構顧問。' },
      ],
      locale: 'zh',
    },
    {},
  );
  assert.equal(turn2.body.readyToConfirm, false);
  assert.ok(turn2.body.draft.message.includes('系統架構顧問'));
  assert.ok(!turn2.body.draft.message.includes('我想諮詢「顧問諮詢／業務合作」相關事宜。'));

  // Turn 3: User provides standalone name in response to assistant asking for name
  const turn3 = await processConciergeChat(
    {
      messages: [
        { role: 'user', content: '我想諮詢「顧問諮詢／業務合作」相關事宜。' },
        { role: 'assistant', content: turn1.body.reply },
        { role: 'user', content: '我們團隊想邀請 David 擔任系統架構顧問。' },
        { role: 'assistant', content: '太棒了，很樂意為您轉達！請問方便請教您的稱呼與聯繫 Email 嗎？' },
        { role: 'user', content: '陳大文' },
      ],
      locale: 'zh',
    },
    {},
  );
  assert.equal(turn3.body.draft.name, '陳大文');
  // Message must NOT be contaminated by the name
  assert.ok(!turn3.body.draft.message.includes('陳大文'));

  // Turn 4: User provides email
  const turn4 = await processConciergeChat(
    {
      messages: [
        { role: 'user', content: '我想諮詢「顧問諮詢／業務合作」相關事宜。' },
        { role: 'assistant', content: turn1.body.reply },
        { role: 'user', content: '我們團隊想邀請 David 擔任系統架構顧問。' },
        { role: 'assistant', content: '太棒了，很樂意為您轉達！請問方便請教您的稱呼與聯繫 Email 嗎？' },
        { role: 'user', content: '陳大文' },
        { role: 'assistant', content: '陳大文 您好！請問方便提供您的 Email 嗎？' },
        { role: 'user', content: 'dawen.chen@example.com' },
      ],
      locale: 'zh',
    },
    {},
  );
  assert.equal(turn4.body.readyToConfirm, true);
  assert.equal(turn4.body.draft.name, '陳大文');
  assert.equal(turn4.body.draft.email, 'dawen.chen@example.com');
  assert.ok(turn4.body.draft.message.includes('系統架構顧問'));
  assert.ok(!turn4.body.draft.message.includes('我想諮詢'));
  assert.ok(!turn4.body.draft.message.includes('dawen.chen@example.com'));
});

test('processConciergeChat guarantees non-empty reply even if LLM returns empty reply or alternative key', async () => {
  const mockEnv = {
    AI: {
      run: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                reply: '', // empty reply from model
                draft: {
                  name: '',
                  email: '',
                  company: 'Acme Corp',
                  message: 'Long interview inquiry text',
                },
              }),
            },
          },
        ],
      }),
    },
  };

  const res = await processConciergeChat(
    {
      messages: [{ role: 'user', content: 'Long interview inquiry text' }],
      locale: 'zh',
    },
    mockEnv,
  );

  assert.equal(res.status, 200);
  assert.ok(res.body.reply.length > 0, 'Reply must never be an empty string');
  assert.ok(res.body.reply.includes('Acme Corp'));
  assert.ok(res.body.reply.includes('稱呼'));
  assert.ok(res.body.reply.includes('信箱') || res.body.reply.includes('Email'));
});

test('processConciergeChat handles English job invitation: ignores "reaching" as name and extracts company', async () => {
  const longMsg = `Hello David,
I am reaching out to you on behalf of Hytech's hiring managers regarding our technical interview process for a Lead Architect role in our Taipei office.
1. What is your current availability?
2. Are you open to discussing this opportunity?
3. What would be the best contact email?`;

  const res = await processConciergeChat(
    {
      messages: [{ role: 'user', content: longMsg }],
      locale: 'zh',
    },
    {},
  );

  assert.equal(res.status, 200);
  assert.notEqual(res.body.draft.name.toLowerCase(), 'reaching', 'Verb "reaching" must NOT be extracted as a name');
  assert.equal(res.body.draft.company, 'Hytech');
  assert.equal(res.body.draft.subject, '職缺邀約／演講培訓');
  assert.ok(res.body.reply.length > 0);
  assert.ok(res.body.reply.includes('Hytech'));
  assert.ok(res.body.reply.includes('稱呼'));
  assert.ok(res.body.reply.includes('信箱') || res.body.reply.includes('Email'));
});

test('processConciergeChat handles complex Chinese intro: extracts company and individual name correctly', async () => {
  const introMsg = '我是 Hytech 的 HR Linda，信箱是 linda@hytech.tw，想與 David 安排技術架構面試';
  const res = await processConciergeChat(
    {
      messages: [{ role: 'user', content: introMsg }],
      locale: 'zh',
    },
    {},
  );

  assert.equal(res.status, 200);
  assert.equal(res.body.draft.name, 'Linda');
  assert.equal(res.body.draft.company, 'Hytech');
  assert.equal(res.body.draft.email, 'linda@hytech.tw');
  assert.equal(res.body.draft.subject, '職缺邀約／演講培訓');
});
