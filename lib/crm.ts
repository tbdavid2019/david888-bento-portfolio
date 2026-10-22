import type { Timestamp } from 'firebase/firestore';

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
      import.meta.env.VITE_CONTACT_API_URL ||
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
      // If bad request (400), throw directly (do not fallback)
      if (response.status === 400) {
        throw new Error(data?.error || 'Invalid contact submission');
      }
      console.warn(`[CRM] Contact API endpoint returned status ${response.status}, falling back to Firebase.`);
    }
  } catch (resendError) {
    if (resendError instanceof Error && resendError.message.includes('Invalid contact submission')) {
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
}

export const sendConciergeMessage = async (
  input: ConciergeChatInput
): Promise<ConciergeChatOutput> => {
  const contactApiUrl =
    import.meta.env.VITE_CONTACT_API_URL ||
    'https://david888-contact-worker.raspy-salad-a4b7.workers.dev';

  try {
    const url = `${contactApiUrl.replace(/\/$/, '')}/chat`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'chat', ...input }),
    });

    if (response.ok) {
      const data = (await response.json()) as ConciergeChatOutput;
      if (data && typeof data.reply === 'string') {
        return data;
      }
    }
  } catch (err) {
    console.warn('[CRM] Concierge chat API error, falling back to client-side logic:', err);
  }

  // Smart client-side fallback (offline or network error)
  const isZh = input.locale !== 'en';
  const userMessages = input.messages.filter((m) => m.role === 'user');
  const lastUserMsg = userMessages[userMessages.length - 1]?.content || '';
  const allUserText = userMessages.map((m) => m.content).join('\n');

  const wantsEmail = /email|mail|信箱|郵件|聯絡方式|contact/i.test(lastUserMsg);
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const foundEmail = allUserText.match(emailRegex)?.[0] || '';

  let detectedSubject = input.defaultSubject || '';
  if (!detectedSubject) {
    if (/顧問|諮詢|業務|合作|商業|consulting|business/i.test(allUserText)) {
      detectedSubject = isZh ? '顧問諮詢／業務合作' : 'Consulting & Business';
    } else if (/技術|系統|架構|tech|architecture/i.test(allUserText)) {
      detectedSubject = isZh ? '技術交流／打個招呼' : 'Tech Chat & Say Hello';
    } else if (/職缺|招募|獵頭|演講|培訓|recruitment|speaking|job/i.test(allUserText)) {
      detectedSubject = isZh ? '職缺邀約／演講培訓' : 'Opportunities & Speaking';
    } else {
      detectedSubject = isZh ? '其他想法／隨意聊聊' : 'Other Ideas & Chat';
    }
  }

  // Check if user only clicked a topic inquiry prompt
  const isTopicPrompt =
    /^我想諮詢「.+」相關事宜。$/.test(lastUserMsg.trim()) ||
    /^I'd like to discuss ".+"\./.test(lastUserMsg.trim());

  if (isTopicPrompt) {
    const promptReply = isZh
      ? `好的，關於「${detectedSubject}」，請問您方便告訴我您的姓名、信箱以及想與 David 討論的具體內容嗎？`
      : `Certainly! Regarding "${detectedSubject}", could you share your name, email, and any specific details you would like to discuss with David?`;
    return {
      reply: promptReply,
      revealEmail: false,
      draft: {
        name: '',
        email: foundEmail,
        company: '',
        subject: detectedSubject,
        message: '',
      },
      readyToConfirm: false,
    };
  }

  const ready = allUserText.trim().length >= 10 || !!foundEmail;

  let reply = '';
  if (wantsEmail) {
    reply = isZh
      ? '好的！已為您在下方展開 David 的直通信箱名片卡。您可直接複製信箱來信，或由小秘書為您將訊息正式轉達！'
      : "Certainly! I've displayed David's direct contact card below. You can copy his email or have me forward your message directly.";
  } else if (ready) {
    reply = isZh
      ? '已為您整理好轉達信件的草稿。請確認下方資訊，點擊「寄送確認信至我的信箱」，小秘書就會為您正式呈交給 David！'
      : "I have prepared a draft of your message. Please review the details below and click 'Send Confirmation Email to My Inbox' to have it delivered to David!";
  } else {
    reply = isZh
      ? '您好！我是 David 的小秘書。請問有什麼事情需要我協助記錄或轉達給 David 呢？'
      : "Hello! I am David's Concierge. How may I assist you with forwarding an inquiry to David?";
  }

  return {
    reply,
    revealEmail: wantsEmail,
    draft: {
      name: '',
      email: foundEmail,
      company: '',
      subject: detectedSubject,
      message: lastUserMsg || allUserText,
    },
    readyToConfirm: ready,
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
