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
  autoDispatched?: boolean;
  dispatchedTo?: string;
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
      if (data && typeof data.reply === 'string' && data.reply.trim()) {
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

  const nonNameVerbs =
    /^(the|a|an|with|from|at|reaching|writing|contacting|looking|interested|delighted|pleased|happy|thrilled|excited|sending|emailing|here|just|glad|wondering|hoping|trying)$/i;

  let extractedName = '';
  const complexIntroMatch = allUserText.match(
    /(?:我是|我叫|叫我|稱呼我|稱呼為)\s*(?:[\w\u4e00-\u9fa5]+(?:\s*的\s*(?:HR|人資|recruiter|經理|主管|顧問|特助|招募)?\s*))([^\s,，。!！\n]{2,15})/i,
  );
  const nameMatch = complexIntroMatch || allUserText.match(/(?:我是|我叫|叫我|稱呼我|稱呼為|name is|I am|I'm)\s*([^\s,，。!！\n]{2,15})/i);
  if (nameMatch && !nonNameVerbs.test(nameMatch[1].trim())) {
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
            !isConfirm &&
            !nonNameVerbs.test(candidate)
          ) {
            extractedName = candidate;
            break;
          }
        }
      }
    }
  }

  let extractedCompany = '';
  const companyMatch =
    allUserText.match(/(?:我是|來自)\s*([A-Za-z0-9\u4e00-\u9fa5]{2,20})\s*的\s*(?:HR|人資|recruiter|經理|主管|顧問|特助|工程師|招募|團隊)/i) ||
    allUserText.match(/\b([A-Z][a-zA-Z0-9_.-]+)(?:'s|’s)\s*(?:hiring managers|recruitment team|talent acquisition|team)/) ||
    allUserText.match(/\b(?:hiring managers|recruitment team|talent acquisition)\s+at\s+([A-Za-z0-9_.-]+)/i) ||
    allUserText.match(/\b(?:on behalf of|representative of)\s+([A-Z][a-zA-Z0-9_.-]+)/) ||
    allUserText.match(/(?:來自|公司是|任職於|公司名稱|代表\s*|from\s+)([^\s,，。!！\n]{2,20})/i);
  if (companyMatch) extractedCompany = companyMatch[1].trim();

  let detectedSubject = input.defaultSubject || '';
  if (!detectedSubject) {
    if (/職缺|招募|獵頭|演講|培訓|面試|人資|\bHR\b|recruitment|speaking|job|interview|hiring\s*manager|talent\s*acquisition/i.test(allUserText)) {
      detectedSubject = isZh ? '職缺邀約／演講培訓' : 'Opportunities & Speaking';
    } else if (/顧問|諮詢|業務|合作|商業|consulting|business/i.test(allUserText)) {
      detectedSubject = isZh ? '顧問諮詢／業務合作' : 'Consulting & Business';
    } else if (/技術|系統|架構|專案|tech|architecture|project/i.test(allUserText)) {
      detectedSubject = isZh ? '技術交流／專案反饋' : 'Tech Chat & Project Feedback';
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

  const hasDetailedContext = Boolean(extractedCompany && hasName && extractedMessage.length >= 10);
  const finalRevealEmail = Boolean(wantsEmail && hasDetailedContext);

  let reply = '';
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
    // In client-side offline fallback, trigger dispatch in background if not yet done
    submitContactTicket({
      name: extractedName || (isZh ? '貴賓' : 'Guest'),
      email: foundEmail,
      company: extractedCompany,
      subject: detectedSubject,
      message: extractedMessage || allUserText,
      locale: isZh ? 'zh' : 'en',
    }).catch((e) => console.warn('[CRM Fallback] submitContactTicket error:', e));

    reply = isZh
      ? `非常感謝${extractedName ? ` ${extractedName}` : ''}！小秘書已自動為您將訊息整理妥當，並已直接寄出確認信至 ${foundEmail}。\n\n請務必前往該信箱查收並點擊確認連結（提醒您：請確認信箱真實有效），一經確認，訊息將立即直達呈報給 David 本人！`
      : `Thank you so much${extractedName ? `, ${extractedName}` : ''}! I have prepared your message and automatically sent a confirmation email to ${foundEmail}.\n\nPlease check your inbox and click the verification link (please ensure your email is active) to deliver your message directly to David!`;
  } else if (/職缺|招募|獵頭|演講|培訓|recruitment|speaking|job|interview/i.test(detectedSubject) && (!hasName || !hasEmail)) {
    reply = isZh
      ? (extractedCompany
          ? `非常感謝 ${extractedCompany} 對 David 的關注與邀請！David 具備百人工程組織帶領經驗，專精於高併發系統架構與技術顧問。請問方便請教您的稱呼與聯繫 Email 嗎？小秘書會為您整理完整邀約並呈交給 David！`
          : '非常感謝您對 David 的關注與邀請！David 具備百人工程組織帶領經驗，專精於高併發系統架構與技術顧問。請問方便請教您的稱呼、公司與聯繫 Email 嗎？小秘書會為您整理完整邀約並呈交給 David！')
      : `Thank you for reaching out with this opportunity for David! David brings extensive CTO experience leading 100+ engineer R&D teams in distributed high-concurrency systems. Could you share your name, organization, and contact email so I can forward your invitation to David?`;
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
    autoDispatched: ready,
    dispatchedTo: foundEmail || undefined,
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
