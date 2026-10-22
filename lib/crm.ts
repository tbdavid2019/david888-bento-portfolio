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

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const foundEmail = allUserText.match(emailRegex)?.[0] || '';
  const lastMsgHasEmail = emailRegex.test(lastUserMsg);

  // Distinguish between asking for David's email vs visitor providing their own email
  const wantsEmail =
    !lastMsgHasEmail &&
    (/(?:索取|要|提供|給|看|詢問|有|請問|查|寄給).*(?:email|mail|信箱|郵件|聯絡方式|contact)|(?:david|大衛).*(?:email|mail|信箱|郵件)|(?:email|mail|信箱|郵件|聯絡方式).*(?:是多少|是什麼|在哪|嗎)/i.test(
      lastUserMsg,
    ) ||
      /^(?:email|mail|信箱|聯絡方式)$/i.test(lastUserMsg.trim()));

  let extractedName = '';
  const nameMatch = allUserText.match(/(?:我是|我叫|叫我|稱呼我|稱呼為|name is|I am|I'm)\s*([^\s,，。!！\n]{2,15})/i);
  if (nameMatch) {
    extractedName = nameMatch[1].trim();
  } else {
    for (let i = 0; i < input.messages.length - 1; i++) {
      const cur = input.messages[i];
      const next = input.messages[i + 1];
      if (cur.role === 'assistant' && next.role === 'user') {
        if (/稱呼|姓名|名字|貴姓|怎麼稱呼|your name|who you are|who I am speaking with/i.test(cur.content)) {
          const candidate = next.content.trim().replace(/^[，,。.\s]+|[，,。.\s]+$/g, '');
          const isEmailCandidate = emailRegex.test(candidate);
          const isGreeting = /^(您好|你好|嗨|哈囉|hello|hi|hey)$/i.test(candidate);
          const isChip = /^我想諮詢|^I'd like to discuss/i.test(candidate);
          const isConfirm = /^(好|好的|確認|送出|寄出|發送|可以|沒問題|ok|yes|confirm|send)$/i.test(candidate);
          if (
            candidate.length >= 2 &&
            candidate.length <= 15 &&
            !isEmailCandidate &&
            !isGreeting &&
            !isChip &&
            !isConfirm
          ) {
            extractedName = candidate;
            break;
          }
        }
      }
    }
  }

  let extractedCompany = '';
  const companyMatch = allUserText.match(/(?:來自|公司是|任職於|公司名稱|代表\s*|from\s+)([^\s,，。!！\n]{2,20})/i);
  if (companyMatch) extractedCompany = companyMatch[1];

  let detectedSubject = input.defaultSubject || '';
  if (!detectedSubject) {
    if (/顧問|諮詢|業務|合作|商業|consulting|business/i.test(allUserText)) {
      detectedSubject = isZh ? '顧問諮詢／業務合作' : 'Consulting & Business';
    } else if (/技術|系統|架構|專案|tech|architecture|project/i.test(allUserText)) {
      detectedSubject = isZh ? '技術交流／專案反饋' : 'Tech Chat & Project Feedback';
    } else if (/職缺|招募|獵頭|演講|培訓|recruitment|speaking|job/i.test(allUserText)) {
      detectedSubject = isZh ? '職缺邀約／演講培訓' : 'Opportunities & Speaking';
    } else {
      detectedSubject = isZh ? '其他交流／隨意聊聊' : 'Other Ideas & Chat';
    }
  }

  // Extract message intent
  const contentFilterRegex = /^(?:我想諮詢「.+」相關事宜。|I'd like to discuss ".+"\.|好|好的|確認|送出|寄出|發送|可以|沒問題|ok|yes|confirm|send)$/i;
  let extractedMessage = '';
  for (const u of userMessages) {
    const trimmed = u.content.trim();
    if (!trimmed) continue;
    if (contentFilterRegex.test(trimmed)) continue;
    if (emailRegex.test(trimmed) && trimmed.length <= 50 && !trimmed.includes(' ') && !trimmed.includes('\n')) continue;
    if (extractedName && trimmed === extractedName) continue;
    if (nameMatch && (trimmed === `我是${extractedName}` || trimmed === `我叫${extractedName}`)) continue;
    extractedMessage = extractedMessage ? `${extractedMessage}\n${trimmed}` : trimmed;
  }

  const isTopicPromptText = (text: string): boolean =>
    /^我想諮詢「.+」相關事宜。$/.test(text.trim()) || /^I'd like to discuss ".+"\./.test(text.trim());

  if (!extractedMessage && !isTopicPromptText(lastUserMsg)) extractedMessage = lastUserMsg;

  // Check if user only clicked a topic inquiry prompt
  const hasOnlyTopicPrompt = isTopicPromptText(lastUserMsg);

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

  let reply = '';
  if (wantsEmail) {
    reply = isZh
      ? '好的！已為您在下方展開 David 的直通信箱名片卡 (104@david888.com)。您也可以直接在對話中告訴我想轉達給 David 的話，由我為您整理送達！'
      : "Certainly! I've displayed David's direct contact card below (104@david888.com). You can also tell me what you'd like to forward to David right here!";
  } else if (isConfirming) {
    reply = isZh
      ? `收到！小秘書正為您發送確認信至 ${foundEmail}，請點擊下方按鈕或稍候接收確認信！`
      : `Understood! A confirmation email is being sent to ${foundEmail}. Please click below to complete delivery!`;
  } else if (ready) {
    reply = isZh
      ? `好的！小秘書已為您彙整好欲轉達給 David 的訊息：\n\n• 稱呼：${extractedName}\n• 信箱：${foundEmail}${extractedCompany ? `\n• 公司：${extractedCompany}` : ''}\n• 洽詢主旨：${detectedSubject}\n• 留言內容：${extractedMessage}\n\n請問確認要由小秘書為您寄送確認信至 ${foundEmail} 嗎？請點擊下方「確認送出確認信」即可！`
      : `Excellent! I have compiled your inquiry for David:\n\n• Name: ${extractedName}\n• Email: ${foundEmail}${extractedCompany ? `\n• Company: ${extractedCompany}` : ''}\n• Topic: ${detectedSubject}\n• Message: ${extractedMessage}\n\nShall I send the confirmation email to ${foundEmail}? Please click the confirmation button below!`;
  } else if (!hasName && !hasEmail) {
    reply = isZh
      ? `太棒了，很樂意為您轉達！請問方便請教您的稱呼與聯繫 Email 嗎？小秘書會為您整理好留言並發送確認信，讓 David 能親自回信給您！`
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
    revealEmail: wantsEmail,
    draft: {
      name: extractedName,
      email: foundEmail,
      company: extractedCompany,
      subject: detectedSubject,
      message: extractedMessage || allUserText,
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
