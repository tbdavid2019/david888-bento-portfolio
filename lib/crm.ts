import type { Timestamp } from 'firebase/firestore';
import {
  selectTopContextItems,
  buildDeterministicQaReply,
  detectCommercialContactIntent,
  EMBEDDED_FALLBACK_CONTEXT,
  isValidHttpUrl,
  type SafeContextReference,
  type SiteContextItem,
} from './context-retrieval.ts';
import { extractContactDetailsFromMessages } from './contact-extraction.ts';

export type TicketStatus = 'new' | 'replied' | 'closed';

export interface ContactTicket {
  id: string;
  ticketNo: string;
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
  status: TicketStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface TicketReply {
  id: string;
  body: string;
  authorEmail: string;
  createdAt?: Timestamp;
}

export interface HomepageAnnouncement {
  enabled: boolean;
  eyebrow: string;
  title: string;
  body: string;
  linkLabel: string;
  link: string;
}

export interface SubmitContactResult {
  ok?: boolean;
  blocked?: boolean;
  status?: string;
  ticketNo?: string;
  provider?: string;
  error?: string;
}

class NonFallbackContactError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonFallbackContactError';
  }
}

export const submitContactTicket = async (input: {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
  locale?: 'zh' | 'en';
  turnstileToken?: string;
}): Promise<SubmitContactResult> => {
  // 1. Try Resend API first (via Cloudflare Worker or custom API URL)
  try {
    const contactApiUrl =
      import.meta.env?.VITE_CONTACT_API_URL ||
      'https://david888-contact-worker.raspy-salad-a4b7.workers.dev';
    const response = await fetch(contactApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.ok || data?.status === 'pending_confirmation' || data?.ticketNo) {
        return {
          ok: true,
          status: data.status || 'pending_confirmation',
          ticketNo: data.ticketNo,
          provider: data.provider || 'resend',
        };
      }
    } else {
      const data = (await response.json().catch(() => ({}))) as Record<string, any>;
      // If blocked by spam filter (403), return blocked flag directly (do not fallback)
      if (response.status === 403 && data?.blocked) {
        return {
          ok: false,
          blocked: true,
          error: data.error || '此內容未通過安全性檢驗，已被系統自動屏蔽拒絕發送。',
        };
      }
      // If bad request (400) or explicitly non-fallback error (e.g. ambiguous post-DATA SMTP drop), do not fallback to Firebase
      if (response.status === 400) {
        throw new NonFallbackContactError(data?.error || 'Invalid contact submission');
      }
      if (data?.fallback === false) {
        throw new NonFallbackContactError(
          data.error || 'Email delivery status is uncertain; please check your inbox before retrying.',
        );
      }
      console.warn(`[CRM] Contact API endpoint returned status ${response.status}, falling back to Firebase.`);
    }
  } catch (resendError) {
    if (resendError instanceof NonFallbackContactError) {
      throw resendError;
    }
    console.warn('[CRM] Contact API endpoint unreachable or failed, falling back to Firebase:', resendError);
  }

  // 2. Fallback to Firebase Cloud Function (loaded on demand)
  const [{ httpsCallable }, { firebaseFunctions }] = await Promise.all([
    import('firebase/functions'),
    import('./firebase'),
  ]);
  const createTicket = httpsCallable<
    Omit<ContactTicket, 'id' | 'ticketNo' | 'status' | 'createdAt' | 'updatedAt'>,
    { ticketNo?: string; ok?: boolean }
  >(firebaseFunctions, 'createContactTicket');
  const result = await createTicket(input);
  return { ...result.data, ok: true, provider: 'firebase' };
};

export interface ConciergeChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConciergeChatInput {
  messages: ConciergeChatMessage[];
  locale?: 'zh' | 'en';
  defaultSubject?: string;
  mode?: 'qa' | 'contact';
  turnstileToken?: string;
  fallbackContextItems?: SiteContextItem[];
}

export interface ConciergeChatDraft {
  name: string;
  email: string;
  company: string;
  subject: string;
  message: string;
}

export interface ConciergeChatOutput {
  reply: string;
  revealEmail: boolean;
  draft: ConciergeChatDraft;
  readyToConfirm: boolean;
  autoDispatched?: boolean;
  dispatchedTo?: string;
  mode?: 'qa' | 'contact';
  suggestedAction?: 'contact';
  references?: SafeContextReference[];
}

export const sendConciergeMessage = async (
  input: ConciergeChatInput
): Promise<ConciergeChatOutput> => {
  const contactApiUrl =
    import.meta.env?.VITE_CONTACT_API_URL ||
    'https://david888-contact-worker.raspy-salad-a4b7.workers.dev';

  const mode: 'qa' | 'contact' = input.mode === 'qa' ? 'qa' : 'contact';

  try {
    const url = `${contactApiUrl.replace(/\/$/, '')}/chat`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'chat',
        messages: input.messages,
        locale: input.locale,
        defaultSubject: input.defaultSubject,
        mode,
        turnstileToken: input.turnstileToken,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as ConciergeChatOutput;
      const modeMatches = mode !== 'qa' || data?.mode === 'qa';
      if (data && modeMatches && typeof data.reply === 'string' && data.reply.trim()) {
        const safeRefs = Array.isArray(data.references)
          ? data.references.filter((r) => r && isValidHttpUrl(r.url) && typeof r.title === 'string')
          : undefined;
        return {
          ...data,
          mode: data.mode || mode,
          references: safeRefs,
        };
      }
    }
  } catch (err) {
    console.warn('[CRM] Concierge chat API error, falling back to client-side logic:', err);
  }

  // Safe Q&A offline fallback: return catalog/embedded context matches without soliciting email
  const isZh = input.locale !== 'en';
  if (mode === 'qa') {
    const fallbackItems = Array.isArray(input.fallbackContextItems) && input.fallbackContextItems.length > 0
      ? [...input.fallbackContextItems, ...EMBEDDED_FALLBACK_CONTEXT.items]
      : EMBEDDED_FALLBACK_CONTEXT.items;
    const retrieved = selectTopContextItems(
      { items: fallbackItems },
      input.messages,
      { topK: 4 },
    );
    const suggestedAction =
      !retrieved.hasMatch || detectCommercialContactIntent(input.messages)
        ? ('contact' as const)
        : undefined;
    return {
      reply: buildDeterministicQaReply(retrieved, isZh),
      revealEmail: false,
      autoDispatched: false,
      readyToConfirm: false,
      mode: 'qa',
      ...(suggestedAction ? { suggestedAction } : {}),
      references: retrieved.hasMatch ? retrieved.references : [],
      draft: {
        name: '',
        email: '',
        company: '',
        subject: '',
        message: '',
      },
    };
  }

  // Smart client-side fallback (offline or network error) for contact mode
  const {
    lastUserMsg,
    allUserText,
    foundEmail,
    wantsEmail,
    extractedName,
    extractedCompany,
    detectedSubject,
    extractedMessage,
    hasOnlyTopicPrompt,
  } = extractContactDetailsFromMessages(input.messages, isZh ? 'zh' : 'en', input.defaultSubject);

  if (hasOnlyTopicPrompt) {
    const promptReply = isZh
      ? `您好！很樂意為您安排「${detectedSubject}」相關事宜。請問方便請教您的稱呼與聯繫 Email 是？以及目前想與 David 討論的具體內容是什麼呢？`
      : `Certainly! Regarding "${detectedSubject}", could you share your name, email, and any specific details you would like to discuss with David?`;
    return {
      reply: promptReply,
      revealEmail: false,
      draft: {
        name: extractedName,
        email: foundEmail,
        company: extractedCompany,
        subject: detectedSubject,
        message: '',
      },
      readyToConfirm: false,
    };
  }

  // Check missing elements
  const hasEmail = Boolean(foundEmail);
  const hasName = Boolean(extractedName && extractedName.length >= 2);
  const hasMessage = Boolean(extractedMessage && extractedMessage.length >= 5);
  const ready = hasEmail && hasName && hasMessage;

  const isConfirming =
    ready &&
    /^(好|好的|確認|送出|寄出|發送|可以|沒問題|ok|yes|confirm|send)$/i.test(lastUserMsg.trim());

  const hasDetailedContext = Boolean(extractedCompany && hasName && extractedMessage.length >= 10);
  const finalRevealEmail = Boolean(wantsEmail && hasDetailedContext);

  let reply = '';
  let offlineDispatched = false;
  if (wantsEmail) {
    if (finalRevealEmail) {
      reply = isZh
        ? '感謝您提供詳實完整的交流資訊！經小秘書意圖與安全審核確認為正式邀約，已在下方為您展開 David 的直通信箱名片卡 (104@david888.com)。您可直接複製來信，或由小秘書為您寄出確認信呈報！'
        : "Thank you for providing detailed inquiry information! Having verified this as a formal invitation, I have displayed David's direct contact card below (104@david888.com). You may email directly or have me send a confirmation email!";
    } else {
      reply = isZh
        ? '抱歉，David 先生平時公務繁忙，直通信箱僅提供給具備明確事由的正式合作夥伴。請您先說明您代表的單位、大名與具體洽談主題，小秘書審核後很樂意為您轉達或提供進一步聯繫管道！'
        : "David's direct inbox is reserved for formal partners with verified context. Please share your name, organization, and inquiry topic first, and I will gladly review and forward your message!";
    }
  } else if (ready) {
    // In client-side fallback, await dispatch cleanly so status is never misreported
    try {
      const submitRes = await submitContactTicket({
        name: extractedName || (isZh ? '貴賓' : 'Guest'),
        email: foundEmail,
        company: extractedCompany,
        subject: detectedSubject,
        message: extractedMessage || allUserText,
        locale: isZh ? 'zh' : 'en',
      });
      offlineDispatched = Boolean(submitRes?.ok);
    } catch (e) {
      console.warn('[CRM Fallback] submitContactTicket error:', e);
      offlineDispatched = false;
    }

    reply = isZh
      ? (offlineDispatched
          ? `非常感謝${extractedName ? ` ${extractedName}` : ''}！小秘書已為您將訊息整理妥當，並已寄出確認信至 ${foundEmail}。\n\n請務必前往該信箱查收並點擊確認連結（提醒您：請確認信箱真實有效），一經確認，訊息將立即直達呈報給 David 本人！`
          : `感謝${extractedName ? ` ${extractedName}` : ''}！目前離線或後端暫時無法寄出確認信至 ${foundEmail}，請點擊上方「直接填寫表單」或稍後重試。`)
      : (offlineDispatched
          ? `Thank you so much${extractedName ? `, ${extractedName}` : ''}! I have prepared your message and sent a confirmation email to ${foundEmail}.\n\nPlease check your inbox and click the verification link (please ensure your email is active) to deliver your message directly to David!`
          : `Thank you${extractedName ? `, ${extractedName}` : ''}! Automatic dispatch to ${foundEmail} could not be completed just now. Please use Direct Form or try again shortly.`);
  } else if (/職缺|招募|獵頭|演講|培訓|recruitment|speaking|job|interview/i.test(detectedSubject) && (!hasName || !hasEmail)) {
    reply = isZh
      ? (extractedCompany
          ? `非常感謝 ${extractedCompany} 對 David 的關注與邀請！David 具備百人工程組織帶領經驗，專長於技術戰略判斷、跨系統整合與架構決策落地。請問方便請教您的稱呼與聯繫 Email 嗎？小秘書會為您整理完整邀約並呈交給 David！`
          : '非常感謝您對 David 的關注與邀請！David 具備百人工程組織帶領經驗，專長於技術戰略判斷、跨系統整合與架構決策落地。請問方便請教您的稱呼、公司與聯繫 Email 嗎？小秘書會為您整理完整邀約並呈交給 David！')
      : `Thank you for reaching out with this opportunity for David! David brings extensive CTO experience leading 100+ engineer R&D organizations, specializing in technology strategy, cross-system integration, and architecture delivery. Could you share your name, organization, and contact email so I can forward your invitation to David?`;
  } else if (!hasName && !hasEmail) {
    reply = isZh
      ? (extractedCompany
          ? `${extractedCompany} 的夥伴您好！已為您記錄此項訊息。請問方便請教您的稱呼與聯繫信箱嗎？這樣 David 能親自回信給您！`
          : '太棒了，很樂意為您轉達！請問方便請教您的稱呼與聯繫 Email 嗎？小秘書會為您整理好留言並發送確認信，讓 David 能親自回信給您！')
      : `Glad to help forward your message! Could you please share your name and email address so I can prepare a confirmation email for you?`;
  } else if (!hasEmail) {
    reply = isZh
      ? `${extractedName} 您好！請問方便提供您的 Email 嗎？小秘書會寄送一封確認信給您，點擊確認後訊息就會直達 David！`
      : `Nice to meet you, ${extractedName}! Could you share your email address so we can send the confirmation link?`;
  } else if (!hasName) {
    reply = isZh
      ? `感謝您提供信箱 (${foundEmail})！請問方便請教該如何稱呼您呢？`
      : `Thank you for providing ${foundEmail}! How should David address you?`;
  } else {
    reply = isZh
      ? '您好！我是 David 的小秘書。請問有什麼事情需要我協助記錄或轉達給 David 呢？'
      : "Hello! I am David's Concierge. How may I assist you with forwarding an inquiry to David?";
  }

  return {
    reply,
    revealEmail: finalRevealEmail,
    autoDispatched: offlineDispatched,
    dispatchedTo: offlineDispatched ? (foundEmail || undefined) : undefined,
    draft: {
      name: extractedName,
      email: foundEmail,
      company: extractedCompany,
      subject: detectedSubject,
      message: extractedMessage || allUserText,
    },
    readyToConfirm: offlineDispatched,
  };
};

export const sendTicketReply = async (ticketId: string, body: string) => {
  const [{ httpsCallable }, { firebaseFunctions }] = await Promise.all([
    import('firebase/functions'),
    import('./firebase'),
  ]);
  const replyToTicket = httpsCallable<{ ticketId: string; body: string }, { ok: true }>(
    firebaseFunctions,
    'replyToContactTicket',
  );
  return (await replyToTicket({ ticketId, body })).data;
};

export const listTickets = async () => {
  const [{ collection, getDocs, limit, orderBy, query }, { firebaseDb }] = await Promise.all([
    import('firebase/firestore'),
    import('./firebase'),
  ]);
  const snapshot = await getDocs(
    query(collection(firebaseDb, 'tickets'), orderBy('createdAt', 'desc'), limit(100)),
  );
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ContactTicket);
};

export const listTicketReplies = async (ticketId: string) => {
  const [{ collection, getDocs, orderBy, query }, { firebaseDb }] = await Promise.all([
    import('firebase/firestore'),
    import('./firebase'),
  ]);
  const snapshot = await getDocs(
    query(collection(firebaseDb, 'tickets', ticketId, 'replies'), orderBy('createdAt', 'asc')),
  );
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as TicketReply);
};

export const loadHomepageAnnouncement = async (): Promise<HomepageAnnouncement | null> => {
  const [{ doc, getDoc }, { firebaseDb }] = await Promise.all([
    import('firebase/firestore'),
    import('./firebase'),
  ]);
  const snapshot = await getDoc(doc(firebaseDb, 'announcements', 'homepage'));
  return snapshot.exists() ? (snapshot.data() as HomepageAnnouncement) : null;
};

export const saveHomepageAnnouncement = async (announcement: HomepageAnnouncement) => {
  const [{ doc, serverTimestamp, setDoc }, { firebaseDb }] = await Promise.all([
    import('firebase/firestore'),
    import('./firebase'),
  ]);
  await setDoc(
    doc(firebaseDb, 'announcements', 'homepage'),
    { ...announcement, updatedAt: serverTimestamp() },
    { merge: true },
  );
};
