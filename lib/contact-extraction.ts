export interface ExtractedContactDetails {
  lastUserMsg: string;
  allUserText: string;
  foundEmail: string;
  wantsEmail: boolean;
  extractedName: string;
  extractedCompany: string;
  detectedSubject: string;
  extractedMessage: string;
  hasOnlyTopicPrompt: boolean;
}

/**
 * Extract contact details (name, company, email, subject, message) from multi-turn concierge messages.
 * Shared across Worker, Vercel API, and offline client fallback without Node-only dependencies.
 */
export function extractContactDetailsFromMessages(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  locale: 'zh' | 'en',
  defaultSubject = '',
): ExtractedContactDetails {
  const isZh = locale !== 'en';
  const userMessages = messages.filter((m) => m.role === 'user');
  const lastUserMsg = userMessages[userMessages.length - 1]?.content || '';
  const allUserText = userMessages.map((m) => m.content).join('\n');

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const foundEmail = allUserText.match(emailRegex)?.[0] || '';
  const lastMsgHasEmail = emailRegex.test(lastUserMsg);

  const asksForDavidsContact =
    /(?:索取|要|提供|給|看|詢問|有|請問|查|寄給).*(?:david|大衛).*(?:email|mail|信箱|郵件|聯絡方式|contact)/i.test(lastUserMsg) ||
    /(?:david|大衛).*(?:email|mail|信箱|郵件|聯絡方式).*(?:是多少|是什麼|在哪|嗎|可以給我)/i.test(lastUserMsg) ||
    /(?:想|希望|能否|可以|方便).*(?:索取|要|詢問|獲得).*(?:email|mail|信箱|郵件|聯絡方式)/i.test(lastUserMsg) ||
    (!lastMsgHasEmail &&
      (/(?:索取|要|提供|給|看|詢問|有|請問|查|寄給).*(?:email|mail|信箱|郵件|聯絡方式|contact)/i.test(lastUserMsg) ||
        /^(?:email|mail|信箱|聯絡方式)$/i.test(lastUserMsg.trim())));

  const nonNameVerbs =
    /^(the|a|an|with|from|at|reaching|writing|contacting|looking|interested|delighted|pleased|happy|thrilled|excited|sending|emailing|here|just|glad|wondering|hoping|trying)$/i;

  let extractedName = '';
  const complexIntroMatch = allUserText.match(
    /(?:我是|我叫|叫我|稱呼我|稱呼為)\s*(?:[\w\u4e00-\u9fa5]+(?:\s*的\s*(?:HR|人資|recruiter|經理|主管|顧問|特助|招募)?\s*))([^\s,，。!！\n]{2,15})/i,
  );
  const nameMatch =
    complexIntroMatch ||
    allUserText.match(/(?:我是|我叫|叫我|稱呼我|稱呼為|name is|I am|I'm)\s*([^\s,，。!！\n]{2,15})/i);
  if (nameMatch && !nonNameVerbs.test(nameMatch[1].trim())) {
    extractedName = nameMatch[1].trim();
  } else {
    for (let i = 0; i < messages.length - 1; i++) {
      const cur = messages[i];
      const next = messages[i + 1];
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

  let detectedSubject = defaultSubject || '';
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

  const contentFilterRegex =
    /^(?:我想諮詢「.+」相關事宜。|I'd like to discuss ".+"\.|好|好的|確認|送出|寄出|發送|可以|沒問題|ok|yes|confirm|send)$/i;
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

  return {
    lastUserMsg,
    allUserText,
    foundEmail,
    wantsEmail: Boolean(asksForDavidsContact),
    extractedName,
    extractedCompany,
    detectedSubject,
    extractedMessage,
    hasOnlyTopicPrompt: isTopicPromptText(lastUserMsg),
  };
}
