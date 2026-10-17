/**
 * Clef-Flash System One Spam & Scam Guard
 * Evaluates contact form submissions against Cloudflare Clef-Flash decision model (clef.create360.ai).
 * Pure zero-shot classification: identifies spam, advertising, crypto scam, and bot noise.
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
  error?: string;
}

export const checkSpamWithClef = async (
  input: ClefSpamCheckInput,
  timeoutMs: number = 3000,
): Promise<ClefSpamCheckResult> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('https://clef.create360.ai/v1/systemone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
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
      }),
    });

    if (!response.ok) {
      console.warn(`[ClefGuard] API returned status ${response.status}`);
      return { isSpam: false, confidence: 0, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    const answer = data?.answers?.classification;

    if (!answer) {
      return { isSpam: false, confidence: 0, error: 'No classification answer' };
    }

    const choice = answer.choice;
    const spamProb = answer.probabilities?.spam_or_scam ?? 0;
    const confidence = answer.confidence ?? 0;

    // Direct classification or high probability threshold
    const isSpam = choice === 'spam_or_scam' || spamProb >= 0.7;

    return {
      isSpam,
      confidence,
      choice,
    };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.warn('[ClefGuard] Request timed out, failing open for real users.');
    } else {
      console.warn('[ClefGuard] Check failed:', err?.message || err);
    }
    return { isSpam: false, confidence: 0, error: err?.message || 'unknown' };
  } finally {
    clearTimeout(timer);
  }
};
