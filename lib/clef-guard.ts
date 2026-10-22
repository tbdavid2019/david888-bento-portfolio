/**
 * Clef-Flash & TypeSafe Jev System One Decision Engine
 * High-reliability 3-Tier Zero-Shot Classification & Conversational Gatekeeping
 *
 * 3-Tier Resilient Fallback Architecture:
 * 1. Primary: 自建 Clef-Flash (https://clef.create360.ai/v1/systemone) - 極速 <200ms
 * 2. Fallback 2: 自建備援節點 Clef-Flash-Q4 (https://clef.aiurl.tw/v1/systemone)
 * 3. Fallback 3: TypeSafe 官方 Jev 服務 (https://api.typesafe.ai/v1/systemone) - 需帶 Bearer TYPESAFE_API_KEY
 * 4. Graceful Fail-Open: 若 3 節點皆超時 (25s) 或異常，Fail-open 自然優雅由 LLM 接手，絕不中斷對話！
 */

export interface ClefSpamCheckInput {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
  typesafeApiKey?: string;
}

export interface ClefSpamCheckResult {
  isSpam: boolean;
  confidence: number;
  choice?: string;
  endpoint?: string;
  error?: string;
}

export interface ConversationEvaluationInput {
  messages: Array<{ role: string; content: string }>;
  lastUserMsg: string;
  senderName?: string;
  senderEmail?: string;
  company?: string;
  subject?: string;
  typesafeApiKey?: string;
}

export interface ConversationEvaluationResult {
  intent:
    | 'recruitment_or_interview'
    | 'consulting_or_partnership'
    | 'tech_chat_or_greeting'
    | 'spam_or_solicitation'
    | 'vague_or_unclear';
  canRevealEmail: boolean;
  isSpam: boolean;
  confidence: number;
  guidance: string;
  sourceNode?: string;
}

export const CLEF_PRIMARY_URL = 'https://clef.create360.ai/v1/systemone';
export const CLEF_FALLBACK2_URL = 'https://clef.aiurl.tw/v1/systemone';
export const CLEF_TYPESAFE_URL = 'https://api.typesafe.ai/v1/systemone';

export const CLEF_DEFAULT_TYPESAFE_KEY =
  'apikey_259d4143052cecd4163b1c9f0a242ce8261_dbb3e525dc222cbf9ffed9a63213f95ee18822f0bccda8b3baaff5461008ae55';

export const CLEF_ENDPOINTS = [CLEF_PRIMARY_URL, CLEF_FALLBACK2_URL];

/**
 * 3-Tier Contact Submission Spam & Scam Guard
 */
export const checkSpamWithClef = async (
  input: ClefSpamCheckInput,
  timeoutPerEndpointMs: number = 25000,
): Promise<ClefSpamCheckResult> => {
  const typesafeKey =
    input.typesafeApiKey ||
    (typeof process !== 'undefined' && process.env?.TYPESAFE_API_KEY) ||
    CLEF_DEFAULT_TYPESAFE_KEY;

  const nodes = [
    { url: CLEF_PRIMARY_URL, model: 'clef-flash', auth: null },
    { url: CLEF_FALLBACK2_URL, model: 'clef-flash', auth: null },
    { url: CLEF_TYPESAFE_URL, model: 'jev-latest', auth: `Bearer ${typesafeKey}` },
  ];

  for (const node of nodes) {
    const payload = {
      model: node.model,
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

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutPerEndpointMs);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (node.auth) headers['Authorization'] = node.auth;

      const response = await fetch(node.url, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.warn(`[ClefGuard] Node ${node.url} returned HTTP ${response.status}, trying fallback...`);
        continue;
      }

      const data = await response.json();
      const answer = data?.answers?.classification;
      if (!answer) {
        console.warn(`[ClefGuard] Node ${node.url} returned invalid structure, trying fallback...`);
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
        endpoint: node.url,
      };
    } catch (err: any) {
      console.warn(`[ClefGuard] Node ${node.url} failed (${err?.name || err?.message}), trying fallback...`);
    } finally {
      clearTimeout(timer);
    }
  }

  // Fallback: fail-open (放行！絕不擋住正常使用者)
  console.warn('[ClefGuard] All Clef / Jev nodes unavailable. Failing open (allowing submission).');
  return {
    isSpam: false,
    confidence: 0,
    error: 'all_nodes_failed_fail_open',
  };
};

/**
 * 3-Tier Conversational Intent & Gatekeeping Evaluator
 * Runs on every user message to evaluate intent and decide email disclosure.
 */
export const evaluateConversationWithClef = async (
  input: ConversationEvaluationInput,
  timeoutPerEndpointMs: number = 25000,
): Promise<ConversationEvaluationResult> => {
  const typesafeKey =
    input.typesafeApiKey ||
    (typeof process !== 'undefined' && process.env?.TYPESAFE_API_KEY) ||
    CLEF_DEFAULT_TYPESAFE_KEY;

  const nodes = [
    { url: CLEF_PRIMARY_URL, model: 'clef-flash', auth: null },
    { url: CLEF_FALLBACK2_URL, model: 'clef-flash', auth: null },
    { url: CLEF_TYPESAFE_URL, model: 'jev-latest', auth: `Bearer ${typesafeKey}` },
  ];

  const dialogueContext = input.messages
    .slice(-6)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  for (const node of nodes) {
    const payload = {
      model: node.model,
      state: {
        dialogue_context: dialogueContext,
        latest_user_message: input.lastUserMsg,
        sender_name: input.senderName || '',
        sender_email: input.senderEmail || '',
        company: input.company || '',
        subject: input.subject || '',
      },
      questions: {
        intent: {
          type: 'choice',
          instructions: 'Classify the visitor inquiry intent.',
          criteria: {
            recruitment_or_interview:
              'Executive recruitment, talent acquisition, job interview, or hiring invitation.',
            consulting_or_partnership:
              'Architecture consulting, system refactoring, technical advisory, business partnership, or commercial inquiry.',
            tech_chat_or_greeting:
              'Friendly greeting, open-source project discussion, casual tech chat, or general networking.',
            spam_or_solicitation:
              'Spam, advertising, SEO pitch, cryptocurrency pump, phishing, gambling, or hostile solicitation.',
            vague_or_unclear:
              'Vague query, demand for email without explanation, one-word prompt, or unspecific request.',
          },
        },
        email_disclosure: {
          type: 'choice',
          instructions: "Decide if David's personal email (104@david888.com) may be displayed.",
          criteria: {
            approved:
              'Visitor represents a verified legitimate company, detailed job/interview offer, or clear formal consulting scope with authentic sender details.',
            denied:
              'Visitor provides no context, only demands contact info, sends casual greeting, is vague, or is classified as spam/solicitation.',
          },
        },
      },
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutPerEndpointMs);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (node.auth) headers['Authorization'] = node.auth;

      const response = await fetch(node.url, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.warn(`[SystemOne] Node ${node.url} returned HTTP ${response.status}, trying fallback...`);
        continue;
      }

      const data = await response.json();
      const answers = data?.answers;
      if (!answers || !answers.intent) {
        console.warn(`[SystemOne] Node ${node.url} returned incomplete answers, trying fallback...`);
        continue;
      }

      const intent = (answers.intent.choice || 'vague_or_unclear') as ConversationEvaluationResult['intent'];
      const intentProb = answers.intent.probabilities?.[intent] ?? answers.intent.confidence ?? 0;
      const isSpam = intent === 'spam_or_solicitation' || (answers.intent.probabilities?.spam_or_solicitation ?? 0) >= 0.7;

      const emailChoice = answers.email_disclosure?.choice;
      const approvedProb = answers.email_disclosure?.probabilities?.approved ?? 0;
      const canRevealEmail = !isSpam && (emailChoice === 'approved' || approvedProb >= 0.7);

      let guidance = '';
      if (isSpam) {
        guidance = 'Visitor appears to be spam or automated solicitation. Politely refuse or redirect.';
      } else if (canRevealEmail) {
        guidance =
          "Approved. Visitor has provided authentic and verified high-value context. If they requested direct contact, you may set revealEmail: true and present David's contact card.";
      } else {
        guidance =
          "Denied. Gatekeeping active. Do NOT reveal David's email or phone. Ask visitor for their name, organization, and concrete topic details so you can review and forward.";
      }

      return {
        intent,
        canRevealEmail,
        isSpam,
        confidence: intentProb,
        guidance,
        sourceNode: node.url,
      };
    } catch (err: any) {
      console.warn(`[SystemOne] Node ${node.url} failed (${err?.name || err?.message}), trying fallback...`);
    } finally {
      clearTimeout(timer);
    }
  }

  // Graceful degradation / Fail-Open: LLM autonomous gatekeeping active
  console.warn('[SystemOne] All 3 decision engine nodes unavailable. Gracefully delegating to LLM autonomous gatekeeping.');
  return {
    intent: 'vague_or_unclear',
    canRevealEmail: false,
    isSpam: false,
    confidence: 0,
    guidance: '[Decision Engine Unavailable, LLM Autonomous Gatekeeping Active]',
    sourceNode: 'fail_open_llm',
  };
};
