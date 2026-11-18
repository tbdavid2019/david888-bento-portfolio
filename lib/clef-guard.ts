/**
 * Clef-Flash Decision Engine (2-Tier Resilient Reference Classifier)
 *
 * 2-Tier Resilient Fallback Architecture:
 * 1. Primary: 自建 Clef-Flash (https://clef.create360.ai/v1/systemone)
 * 2. Fallback 2: 自建備援節點 Clef-Flash-Q4 (https://clef.aiurl.tw/v1/systemone)
 * 3. Graceful Fail-Open: 若節點超時或異常，直接 Fail-open 放行，意圖結果僅作為信件標題參考數值，絕不擋信！
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

export interface ConversationEvaluationInput {
  messages: Array<{ role: string; content: string }>;
  lastUserMsg: string;
  senderName?: string;
  senderEmail?: string;
  company?: string;
  subject?: string;
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

export const CLEF_ENDPOINTS = [CLEF_PRIMARY_URL, CLEF_FALLBACK2_URL];

const INTENT_LABELS: Record<string, string> = {
  job_interview_or_recruitment: '招募面試',
  recruitment_or_interview: '招募面試',
  business_consulting_or_project: '商務諮詢',
  consulting_or_partnership: '商務諮詢',
  friendly_greeting_or_chat: '技術交流',
  tech_chat_or_greeting: '技術交流',
  harmful_spam_or_scam: '疑似推銷',
  spam_or_solicitation: '疑似推銷',
  vague_or_unclear: '一般洽詢',
  legitimate_inquiry: '一般商務',
};

/**
 * Formats the intent classification & confidence as a non-blocking reference badge for email subjects.
 */
export const formatIntentReferenceBadge = (
  intentOrChoice?: string,
  confidence?: number,
  isSpam?: boolean,
): { intentLabel: string; badge: string } => {
  const key = String(intentOrChoice || '').trim();
  const intentLabel = INTENT_LABELS[key] || (key ? key : '一般洽詢');
  const hasScore = typeof confidence === 'number' && Number.isFinite(confidence) && confidence > 0;
  const pct = hasScore ? `${Math.round(confidence * 100)}%` : '';
  const warn = isSpam ? ' ⚠️' : '';
  const badge = hasScore
    ? `[意圖參考: ${intentLabel} ${pct}${warn}]`
    : `[意圖參考: ${intentLabel}${warn}]`;
  return { intentLabel, badge };
};

/**
 * 2-Tier Contact Submission Intent & Reference Classifier (Never blocks delivery)
 */
export const checkSpamWithClef = async (
  input: ClefSpamCheckInput,
  timeoutPerEndpointMs: number = 5000,
): Promise<ClefSpamCheckResult> => {
  const nodes = [
    { url: CLEF_PRIMARY_URL, model: 'clef-flash' },
    { url: CLEF_FALLBACK2_URL, model: 'clef-flash' },
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
          instructions: 'Classify the true purpose of this contact message.',
          criteria: {
            job_interview_or_recruitment:
              'A job interview invitation, talent recruitment, executive search, or hiring manager inquiry.',
            business_consulting_or_project:
              'Technical architecture consulting, software development project, partnership, or client business inquiry.',
            friendly_greeting_or_chat:
              'A genuine personal greeting, networking message, or tech discussion from a developer.',
            harmful_spam_or_scam:
              'Automated bulk spam, SEO link pitching, telegram crypto pump, gambling ads, phishing link, or malicious fraud.',
          },
        },
      },
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutPerEndpointMs);

    try {
      const response = await fetch(node.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const spamProb =
        answer.probabilities?.harmful_spam_or_scam ??
        answer.probabilities?.spam_or_scam ??
        0;
      const confidence =
        answer.probabilities?.[choice] ??
        answer.confidence ??
        0;
      const isSpam =
        (choice === 'harmful_spam_or_scam' || choice === 'spam_or_scam') &&
        spamProb >= 0.7;

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
  console.warn('[ClefGuard] All Clef nodes unavailable. Failing open (allowing submission).');
  return {
    isSpam: false,
    confidence: 0,
    error: 'all_nodes_failed_fail_open',
  };
};

/**
 * 2-Tier Conversational Intent Evaluator (Advisory reference only, never blocks forwarding)
 */
export const evaluateConversationWithClef = async (
  input: ConversationEvaluationInput,
  timeoutPerEndpointMs: number = 5000,
): Promise<ConversationEvaluationResult> => {
  const nodes = [
    { url: CLEF_PRIMARY_URL, model: 'clef-flash' },
    { url: CLEF_FALLBACK2_URL, model: 'clef-flash' },
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
      const response = await fetch(node.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      if (canRevealEmail) {
        guidance =
          "Approved. Visitor has provided authentic and verified high-value context. If they requested direct contact, you may set revealEmail: true and present David's contact card.";
      } else {
        guidance =
          'Advisory reference only. Always warmly assist the visitor and collect their inquiry, name, and email so the message can be forwarded to David with the intent reference label.';
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

  // Graceful degradation / Fail-Open
  console.warn('[SystemOne] Clef nodes unavailable. Failing open for concierge chat.');
  return {
    intent: 'vague_or_unclear',
    canRevealEmail: false,
    isSpam: false,
    confidence: 0,
    guidance: '[Intent Classifier Unavailable — Collect & Forward All Inquiries Normally]',
    sourceNode: 'fail_open_llm',
  };
};
