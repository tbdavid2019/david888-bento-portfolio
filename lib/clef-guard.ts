/**
 * Clef-Flash System One Spam & Scam Guard
 * Evaluates contact form submissions against Cloudflare Clef-Flash decision model.
 * Pure zero-shot classification: identifies spam, advertising, crypto scam, and bot noise.
 *
 * 3-Tier Resilient Fallback Architecture:
 * 1. Primary: 自建 Clef-Flash (https://clef.create360.ai/v1/systemone)
 * 2. Fallback 2: 自建備援節點 Clef-Flash-Q4 (https://clef.aiurl.tw/v1/systemone)
 * 3. Fallback 3: 若兩節點皆超時或異常，Fail-open 正常放行，絕不擋住真實正常使用者！
 */

export interface ClefSpamCheckInput {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
}

export interface ClefSpamCheckResult {
  isSpam: boolean;
  confidence: number;
  choice?: string;
  endpoint?: string;
  error?: string;
}

export const CLEF_ENDPOINTS = [
  'https://clef.create360.ai/v1/systemone', // Primary
  'https://clef.aiurl.tw/v1/systemone',      // Fallback 2
];

export const checkSpamWithClef = async (
  input: ClefSpamCheckInput,
  timeoutPerEndpointMs: number = 2500,
): Promise<ClefSpamCheckResult> => {
  const payload = {
    model: 'clef-flash',
    state: {
      sender_name: input.name,
      sender_email: input.email,
      company: input.company || '',
      subject: input.subject,
      message: input.message,
    },
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
  };

  for (const endpoint of CLEF_ENDPOINTS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutPerEndpointMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.warn(`[ClefGuard] Endpoint ${endpoint} returned HTTP ${response.status}, trying fallback...`);
        continue;
      }

      const data = await response.json();
      const answer = data?.answers?.classification;

      if (!answer) {
        console.warn(`[ClefGuard] Endpoint ${endpoint} returned invalid structure, trying fallback...`);
        continue;
      }

      const choice = answer.choice;
      const spamProb = answer.probabilities?.spam_or_scam ?? 0;
      const confidence = answer.confidence ?? 0;
      const isSpam = choice === 'spam_or_scam' || spamProb >= 0.7;

      return {
        isSpam,
        confidence,
        choice,
        endpoint,
      };
    } catch (err: any) {
      console.warn(`[ClefGuard] Endpoint ${endpoint} failed (${err?.name || err?.message}), trying fallback...`);
    } finally {
      clearTimeout(timer);
    }
  }

  // 3. Fallback 3: If all endpoints fail or time out, fail-open (放行！系統照常送出，絕不擋住正常使用者)
  console.warn('[ClefGuard] All Clef-Flash nodes unavailable. Failing open (allowing submission).');
  return {
    isSpam: false,
    confidence: 0,
    error: 'all_nodes_failed_fail_open',
  };
};
