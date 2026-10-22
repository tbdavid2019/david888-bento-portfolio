import React, { useState, useRef, useEffect } from 'react';
import {
  Briefcase,
  Check,
  CheckCircle2,
  Code2,
  ConciergeBell,
  Copy,
  ExternalLink,
  Info,
  LoaderCircle,
  Mail,
  Send,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import {
  submitContactTicket,
  sendConciergeMessage,
  type ConciergeChatMessage,
  type ConciergeChatDraft,
} from '../lib/crm';
import type { Locale } from '../types';

interface ContactDialogProps {
  locale: Locale;
  defaultSubjectId?: string;
  initialTab?: 'chat' | 'form';
  onClose: () => void;
}

export const SUBJECT_OPTIONS = [
  {
    id: 'consulting',
    zh: '顧問諮詢／業務合作',
    en: 'Consulting & Business',
    icon: Briefcase,
  },
  {
    id: 'tech_chat',
    zh: '技術交流／打個招呼',
    en: 'Tech Chat & Say Hello',
    icon: Code2,
  },
  {
    id: 'recruitment',
    zh: '職缺邀約／演講培訓',
    en: 'Opportunities & Speaking',
    icon: Target,
  },
  {
    id: 'other',
    zh: '其他想法／隨意聊聊',
    en: 'Other Ideas & Chat',
    icon: Sparkles,
  },
];

interface SubmittedSummary {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
}

export const SecretaryAvatar: React.FC<{
  size?: number;
  className?: string;
  locale?: Locale;
}> = ({ size = 36, className = '', locale = 'zh' }) => {
  const isZh = locale !== 'en';
  const label = isZh ? 'David 的小秘書' : "David's Concierge";
  const onlineTitle = isZh ? '小秘書線上接待中' : 'Concierge online';
  const iconSize = Math.round(size * 0.52);

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full bg-[#17324d] text-[#ffb010] border border-[#d6bc7c]/60 shadow-xs select-none ${className}`}
      style={{ width: size, height: size }}
      aria-label={label}
    >
      <ConciergeBell size={iconSize} strokeWidth={2.2} aria-hidden="true" />

      {/* Online Status Dot */}
      <span
        className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-bg-surface ring-1.5 ring-bg-surface"
        title={onlineTitle}
      >
        <span className="h-2 w-2 rounded-full bg-success" />
      </span>
    </div>
  );
};

export const ContactDialog: React.FC<ContactDialogProps> = ({
  locale,
  defaultSubjectId,
  initialTab = 'chat',
  onClose,
}) => {
  const isZh = locale === 'zh';
  const defaultOption =
    SUBJECT_OPTIONS.find((opt) => opt.id === defaultSubjectId) || SUBJECT_OPTIONS[0];

  // Mode: 'chat' (Concierge Chat) | 'form' (Direct Form)
  const [activeTab, setActiveTab] = useState<'chat' | 'form'>(initialTab);

  // Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    subject: isZh ? defaultOption.zh : defaultOption.en,
    message: '',
  });
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(defaultOption.id);
  const [customSubject, setCustomSubject] = useState('');

  // Processing & UI States
  const [busy, setBusy] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const [error, setError] = useState('');
  const [submittedSummary, setSubmittedSummary] = useState<SubmittedSummary | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Chat & Concierge States
  const [chatInput, setChatInput] = useState('');
  const [revealEmail, setRevealEmail] = useState(false);
  const [conciergeReady, setConciergeReady] = useState(false);
  const [conciergeDraft, setConciergeDraft] = useState<ConciergeChatDraft>({
    name: '',
    email: '',
    company: '',
    subject: isZh ? defaultOption.zh : defaultOption.en,
    message: '',
  });
  const isComposingRef = useRef(false);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    const nextHeight = Math.min(Math.max(el.scrollHeight, 44), 120);
    el.style.height = `${nextHeight}px`;
  };

  // Sync initialTab when props change
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Keyboard accessibility: Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const initialGreeting = isZh
    ? '您好！我是 David 的小秘書，很高興為您服務！David 具備百人工程組織帶領經驗，專精於高併發系統架構、跨系統整合與技術顧問。請問今天想了解 David 哪方面的專業？或是希望我如何為您協助安排呢？'
    : "Hello! I am David's Concierge. David has extensive experience leading 100+ engineer R&D organizations as a CTO, specializing in high-concurrency systems, cross-system integration, and technology advisory. How may I assist you today?";

  const [messages, setMessages] = useState<ConciergeChatMessage[]>([
    {
      role: 'assistant',
      content: initialGreeting,
    },
  ]);

  useEffect(() => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, revealEmail, conciergeReady, chatBusy]);

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText('104@david888.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSelectSubject = (id: string) => {
    setError('');
    setSelectedSubjectId(id);
    const target = SUBJECT_OPTIONS.find((opt) => opt.id === id);
    if (!target) return;

    if (id === 'other') {
      setForm((prev) => ({
        ...prev,
        subject: customSubject.trim() || (isZh ? target.zh : target.en),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        subject: isZh ? target.zh : target.en,
      }));
    }
  };

  const handleCustomSubjectChange = (val: string) => {
    setError('');
    setCustomSubject(val);
    setForm((prev) => ({
      ...prev,
      subject: val.trim() || (isZh ? '其他想法／隨意聊聊' : 'Other Ideas & Chat'),
    }));
  };

  const update = (field: 'name' | 'email' | 'company' | 'message' | 'subject', value: string) => {
    setError('');
    setForm((current) => ({ ...current, [field]: value }));
    if (field === 'subject') {
      const matched = SUBJECT_OPTIONS.find((opt) => (isZh ? opt.zh : opt.en) === value);
      if (matched) {
        setSelectedSubjectId(matched.id);
      }
    }
  };

  const switchTab = (tab: 'chat' | 'form') => {
    setError('');
    setActiveTab(tab);
    if (tab === 'form') {
      setForm((prev) => ({
        name: conciergeDraft.name || prev.name,
        email: conciergeDraft.email || prev.email,
        company: conciergeDraft.company || prev.company,
        subject: conciergeDraft.subject || prev.subject,
        message: conciergeDraft.message || prev.message,
      }));
    }
    if (typeof window !== 'undefined') {
      const targetPath = tab === 'form' ? '/contact/form' : '/contact';
      const search = window.location.search || '';
      if (window.location.pathname !== targetPath) {
        window.history.replaceState(null, '', `${targetPath}${search}`);
      }
    }
  };

  // Submit contact message (from Direct Form)
  const executeSubmission = async (submissionPayload: {
    name: string;
    email: string;
    company?: string;
    subject: string;
    message: string;
  }) => {
    setBusy(true);
    setError('');

    try {
      await submitContactTicket({
        name: submissionPayload.name,
        email: submissionPayload.email,
        company: submissionPayload.company,
        subject: submissionPayload.subject,
        message: submissionPayload.message,
        locale,
      });

      setSubmittedSummary({
        name: submissionPayload.name,
        email: submissionPayload.email,
        company: submissionPayload.company,
        subject: submissionPayload.subject,
        message: submissionPayload.message,
      });
    } catch (submissionError: unknown) {
      console.error(submissionError);
      const errMsg = submissionError instanceof Error ? submissionError.message : '';
      if (errMsg.includes('Invalid contact submission')) {
        setError(
          isZh
            ? '請完整填寫姓名、有效信箱，且留言內容至少需 5 個字元。'
            : 'Please provide a valid name, email, subject, and a message of at least 5 characters.',
        );
      } else {
        setError(
          isZh
            ? '目前服務連線較為忙碌，請稍後再試。'
            : 'The contact service is temporarily unavailable. Please try again shortly.',
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.message.trim().length < 5) {
      setError(
        isZh
          ? '留言內容至少需要 5 個字。'
          : 'Message must be at least 5 characters.',
      );
      return;
    }
    const finalSubject =
      selectedSubjectId === 'other' && customSubject.trim()
        ? (isZh ? `其他：${customSubject.trim()}` : `Other: ${customSubject.trim()}`)
        : form.subject;

    await executeSubmission({
      name: form.name,
      email: form.email,
      company: form.company,
      subject: finalSubject,
      message: form.message,
    });
  };

  // Quick reply chip click in chat
  const handleChipClick = async (chipId: string, chipLabel: string) => {
    const selectedOpt = SUBJECT_OPTIONS.find((opt) => opt.id === chipId);
    if (selectedOpt) {
      setSelectedSubjectId(selectedOpt.id);
      setConciergeDraft((prev) => ({
        ...prev,
        subject: isZh ? selectedOpt.zh : selectedOpt.en,
      }));
    }

    const userMsgText = isZh ? `我想諮詢「${chipLabel}」相關事宜。` : `I'd like to discuss "${chipLabel}".`;
    await handleSendChat(userMsgText, true);
  };

  // Send message in Concierge Chat
  const handleSendChat = async (overrideText?: string, isChipPrompt = false) => {
    const textToSend = (overrideText || chatInput).trim();
    if (!textToSend || chatBusy) return;

    if (!overrideText) {
      setChatInput('');
      if (chatTextareaRef.current) {
        chatTextareaRef.current.style.height = '44px';
      }
    }

    // Check if user is acknowledging in dialogue
    const isConfirmWord =
      conciergeReady &&
      Boolean(conciergeDraft.email) &&
      /^(好|好的|確認|送出|寄出|發送|可以|沒問題|ok|yes|confirm|send)$/i.test(textToSend);

    if (isConfirmWord) {
      const nextMessages: ConciergeChatMessage[] = [
        ...messages,
        { role: 'user', content: textToSend },
        {
          role: 'assistant',
          content: isZh
            ? `好的！確認信已自動寄送至 ${conciergeDraft.email}，請務必至您的信箱查收並點擊「確認轉達給 David」連結。一經確認，訊息將立即直達呈報給 David！`
            : `Understood! A confirmation email has been dispatched to ${conciergeDraft.email}. Please check your inbox and verify the link to deliver your message to David!`,
        },
      ];
      setMessages(nextMessages);
      return;
    }

    const nextMessages: ConciergeChatMessage[] = [
      ...messages,
      { role: 'user', content: textToSend },
    ];
    setMessages(nextMessages);
    setChatBusy(true);

    try {
      const result = await sendConciergeMessage({
        messages: nextMessages,
        locale,
        defaultSubject: conciergeDraft.subject || form.subject,
      });

      setConciergeDraft((prev) => ({
        name: result.draft?.name || prev.name,
        email: result.draft?.email || prev.email,
        company: result.draft?.company || prev.company,
        subject: result.draft?.subject || prev.subject,
        message: result.draft?.message || prev.message || (isChipPrompt ? '' : textToSend),
      }));

      setConciergeReady(Boolean(result.readyToConfirm));

      if (result.revealEmail) {
        setRevealEmail(true);
      }

      const replyText =
        (result.reply || '').trim() ||
        (isZh
          ? '好的，已為您記錄下此項訊息。請問方便請教您的稱呼與聯繫信箱嗎？這樣 David 才能親自回信給您！'
          : "Understood, I've noted down your message. Could you please share your name and email so David can reply directly?");

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: replyText },
      ]);
    } catch (err) {
      console.warn('Chat interaction error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: isZh
            ? '好的，我已為您記錄。請問方便請教您的稱呼與聯繫信箱嗎？這樣 David 才能親自回信給您！'
            : "Understood, I've noted down your message. Could you please share your name and email so David can reply directly?",
        },
      ]);
    } finally {
      setChatBusy(false);
    }
  };

  const copyMessageSummary = () => {
    if (!submittedSummary) return;
    const text = isZh
      ? [
          `【David 的小秘書 — 留言存根】`,
          `主旨：${submittedSummary.subject}`,
          `姓名：${submittedSummary.name}`,
          `Email：${submittedSummary.email}`,
          `公司團隊：${submittedSummary.company || '-'}`,
          `留言內容：\n${submittedSummary.message}`,
        ].join('\n')
      : [
          `[David's Concierge - Submission Summary]`,
          `Subject: ${submittedSummary.subject}`,
          `Name: ${submittedSummary.name}`,
          `Email: ${submittedSummary.email}`,
          `Company: ${submittedSummary.company || '-'}`,
          `Message:\n${submittedSummary.message}`,
        ].join('\n');
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-2 sm:p-4 backdrop-blur-sm overflow-x-hidden overflow-y-auto"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="my-auto max-h-[94vh] sm:max-h-[92vh] w-full max-w-[calc(100vw-1rem)] sm:max-w-xl md:max-w-2xl overflow-y-auto overflow-x-hidden rounded-2xl sm:rounded-[28px] border border-border bg-bg-surface p-4 sm:p-5 md:p-6 shadow-2xl box-border"
        style={{
          fontFamily:
            '"Gen Jyuu Gothic", "Noto Sans TC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={isZh ? '聯絡 David' : 'Contact David'}
      >
        {/* 1. Pending Confirmation View (NO CS-xxxxxxxx ticket number) */}
        {submittedSummary ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-lg sm:text-xl font-bold text-text-main">
                {isZh ? '確認信已寄出，請至信箱點擊確認' : 'Confirmation Email Sent — Please Check Your Inbox'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-text-main hover:bg-bg-elevated transition-colors"
                aria-label={isZh ? '關閉' : 'Close'}
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl border border-primary/25 bg-primary/10 p-4 sm:p-5">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white dark:text-bg-base shadow-xs">
                  <Mail size={20} strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-text-main">
                    {isZh ? '雙重確認信已送達您的信箱' : 'Double Opt-in Confirmation Email Dispatched'}
                  </h3>
                  <p className="text-sm text-text-main/90 mt-1.5 leading-relaxed">
                    {isZh ? (
                      <>
                        為了確保 David 回信時能順利聯繫上您，小秘書已將確認信寄至{' '}
                        <span className="font-bold text-primary underline underline-offset-2">
                          {submittedSummary.email}
                        </span>
                        。請打開信箱並點擊信中的「確認轉達給 David」按鈕，信件就會立即送達 David 本人信箱。
                      </>
                    ) : (
                      <>
                        To make sure David can reply to you directly, a confirmation link has been sent to{' '}
                        <span className="font-bold text-primary underline underline-offset-2">
                          {submittedSummary.email}
                        </span>
                        . Please check your inbox and click "Deliver to David" to complete delivery.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Submission Content Summary */}
            <div className="rounded-2xl border border-border bg-bg-elevated/60 p-4 sm:p-5 text-sm space-y-3">
              <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
                <span className="font-bold text-text-main text-sm">
                  {isZh ? '待轉達訊息內容存根' : 'Message Summary'}
                </span>
                <span className="text-sm text-text-muted">{new Date().toLocaleDateString()}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-text-muted">
                <div>
                  <span className="font-bold text-text-main">{isZh ? '姓名：' : 'Name: '}</span>
                  <span className="text-text-main font-medium">{submittedSummary.name}</span>
                </div>
                <div>
                  <span className="font-bold text-text-main">Email：</span>
                  <span className="text-text-main font-medium break-all">{submittedSummary.email}</span>
                </div>
                {submittedSummary.company && (
                  <div className="sm:col-span-2">
                    <span className="font-bold text-text-main">{isZh ? '公司／團隊：' : 'Company: '}</span>
                    <span className="text-text-main font-medium">{submittedSummary.company}</span>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <span className="font-bold text-text-main">{isZh ? '交流主旨：' : 'Subject: '}</span>
                  <span className="font-bold text-primary">{submittedSummary.subject}</span>
                </div>
              </div>

              <div className="border-t border-border/70 pt-2.5">
                <div className="font-bold text-text-main text-sm mb-1.5">
                  {isZh ? '留言內容：' : 'Message:'}
                </div>
                <div className="max-h-36 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-border/60 bg-bg-surface p-3.5 text-text-main text-sm leading-relaxed">
                  {submittedSummary.message}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={copyMessageSummary}
                className="inline-flex h-11 w-full sm:flex-1 items-center justify-center gap-2 rounded-full border border-border bg-bg-surface px-4 text-sm font-bold text-text-main transition-colors hover:bg-bg-elevated"
              >
                {copiedSummary ? (
                  <Check size={16} className="text-success" />
                ) : (
                  <Copy size={16} />
                )}
                <span>
                  {copiedSummary
                    ? isZh
                      ? '已複製內容'
                      : 'Copied'
                    : isZh
                      ? '複製留言存根'
                      : 'Copy Summary'}
                </span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-full sm:flex-1 items-center justify-center rounded-full bg-[#ffb010] hover:bg-[#f2a600] px-4 text-sm font-bold text-[#2b251a] shadow-xs transition-colors"
              >
                {isZh ? '完成' : 'Done'}
              </button>
            </div>
          </div>
        ) : (
          /* 2. Main Views: Segmented Tabs (Concierge Chat / Direct Form) */
          <div className="space-y-3.5">
            {/* Top Bar: Mode Switcher Tabs + Close Button */}
            <div className="flex items-center justify-between gap-2.5">
              <div
                role="tablist"
                aria-label={isZh ? '選擇接待模式' : 'Choose mode'}
                className="flex flex-1 rounded-xl bg-bg-elevated p-1 border border-border/70 text-xs sm:text-sm font-bold"
              >
                <button
                  role="tab"
                  type="button"
                  id="tab-chat"
                  aria-selected={activeTab === 'chat'}
                  aria-controls="panel-chat"
                  onClick={() => switchTab('chat')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-bold transition-all ${
                    activeTab === 'chat'
                      ? 'bg-[#17324d] text-[#ffb010] shadow-xs'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  <ConciergeBell size={15} strokeWidth={2.2} />
                  <span>{isZh ? '小秘書接待' : 'Concierge Chat'}</span>
                </button>
                <button
                  role="tab"
                  type="button"
                  id="tab-form"
                  aria-selected={activeTab === 'form'}
                  aria-controls="panel-form"
                  onClick={() => switchTab('form')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-bold transition-all ${
                    activeTab === 'form'
                      ? 'bg-[#17324d] text-[#ffb010] shadow-xs'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  <Mail size={15} strokeWidth={2.2} />
                  <span>{isZh ? '直接填寫表單' : 'Direct Form'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-elevated text-text-main hover:bg-bg-surface transition-colors"
                aria-label={isZh ? '關閉' : 'Close'}
              >
                <X size={18} />
              </button>
            </div>

            {/* TAB 1: Concierge Chat View */}
            {activeTab === 'chat' && (
              <div id="panel-chat" role="tabpanel" aria-labelledby="tab-chat" className="space-y-3">
                {/* Chat Scroll Container (NO Card-inside-Card nested border!) */}
                <div
                  ref={chatScrollContainerRef}
                  className="max-h-[48vh] min-h-[250px] overflow-y-auto space-y-3.5 px-1 py-1 sm:px-2 scroll-smooth"
                >
                  {messages.map((msg, idx) => {
                    if (!msg.content || !msg.content.trim()) return null;
                    const isAssistant = msg.role === 'assistant';
                    return (
                      <div
                        key={idx}
                        className={`flex gap-2.5 sm:gap-3 ${isAssistant ? 'justify-start items-start' : 'justify-end items-start'}`}
                      >
                        {isAssistant && <SecretaryAvatar size={34} locale={locale} />}
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                            isAssistant
                              ? 'rounded-tl-xs bg-[#fffdfa] dark:bg-[#122338] border border-[#d6bc7c]/70 dark:border-[#2b4a6b] text-[#2b251a] dark:text-[#f8fafc] shadow-xs'
                              : 'rounded-tr-xs bg-[#17324d] text-white font-medium shadow-xs'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}

                  {/* Concierge Typing Indicator */}
                  {chatBusy && (
                    <div className="flex gap-2.5 sm:gap-3 justify-start items-center">
                      <SecretaryAvatar size={34} locale={locale} />
                      <div className="rounded-2xl rounded-tl-xs border border-[#d6bc7c]/70 dark:border-[#2b4a6b] bg-[#fffdfa] dark:bg-[#122338] px-4 py-2 text-sm shadow-xs flex items-center gap-2.5 text-text-muted">
                        <span className="flex gap-1 items-center">
                          <span className="h-2 w-2 rounded-full bg-[#ffb010] animate-bounce [animation-delay:-0.3s]" />
                          <span className="h-2 w-2 rounded-full bg-[#ffb010] animate-bounce [animation-delay:-0.15s]" />
                          <span className="h-2 w-2 rounded-full bg-[#ffb010] animate-bounce" />
                        </span>
                        <span className="text-xs font-medium text-text-muted">
                          {isZh ? '小秘書正在記錄…' : 'Concierge is typing…'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Lightweight Inline Topic Pills: Auto-collapses once visitor messages */}
                  {messages.filter((m) => m.role === 'user').length === 0 && (
                    <div className="pt-1.5 space-y-2">
                      <div className="text-xs font-bold text-text-muted flex items-center gap-1.5">
                        <Sparkles size={13} className="text-[#ffb010]" />
                        <span>{isZh ? '快速選擇交流主題' : 'Quick Inquiry Topics'}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {SUBJECT_OPTIONS.filter((opt) => opt.id !== 'other').map((opt) => {
                          const IconComp = opt.icon;
                          const label = isZh ? opt.zh : opt.en;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleChipClick(opt.id, label)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-[#d6bc7c]/70 dark:border-[#2b4a6b] bg-bg-surface hover:border-[#ffb010] hover:bg-[#ffb010]/10 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-text-main transition-colors shadow-2xs"
                            >
                              <IconComp size={14} className="shrink-0 text-[#ffb010]" />
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Inline Direct Contact Card (ONLY shown when Clef / Jev approves revealEmail) */}
                  {revealEmail && (
                    <div className="rounded-2xl border border-[#d6bc7c] dark:border-[#2b4a6b] bg-[#fffdfa] dark:bg-[#122338] p-4 text-sm shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-[#d6bc7c]/30 dark:border-[#2b4a6b] pb-2.5">
                        <span className="font-bold text-sm text-[#17324d] dark:text-[#ffb010] flex items-center gap-2">
                          <Mail size={16} strokeWidth={2} />
                          <span>{isZh ? 'David 直通信箱名片卡' : "David's Direct Contact Card"}</span>
                        </span>
                        <span className="text-[11px] font-bold text-[#17324d] dark:text-[#ffb010] bg-[#ffb010]/20 border border-[#ffb010]/40 px-2.5 py-0.5 rounded-full">
                          {isZh ? '正式交流授權' : 'Verified Partner'}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-bg-surface p-3 rounded-xl border border-border">
                        <span className="font-mono text-sm font-bold text-text-main">
                          104@david888.com
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={copyEmailToClipboard}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#ffb010] hover:bg-[#f2a600] text-[#2b251a] font-bold text-sm shadow-xs transition-colors"
                          >
                            {copiedEmail ? <Check size={15} /> : <Copy size={15} />}
                            <span>{copiedEmail ? (isZh ? '已複製' : 'Copied') : (isZh ? '複製信箱' : 'Copy Email')}</span>
                          </button>
                          <a
                            href="mailto:104@david888.com"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-border bg-bg-elevated font-bold text-sm text-text-main hover:bg-bg-surface transition-colors"
                          >
                            <span>{isZh ? '直接寫信' : 'Email Directly'}</span>
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inline Conversational Summary & Auto-Dispatched Status Card */}
                  {conciergeReady && conciergeDraft.email && (
                    <div className="rounded-2xl border border-[#ffb010]/30 bg-[#fffdfa] dark:bg-[#122338] p-4 text-sm shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-[#ffb010]/20 pb-2">
                        <span className="font-bold text-sm text-text-main flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-success shrink-0" />
                          <span>{isZh ? '小秘書已自動為您送出確認信' : 'Confirmation Email Dispatched'}</span>
                        </span>
                        <span className="text-[11px] font-bold text-success bg-success/15 border border-success/30 px-2.5 py-0.5 rounded-full">
                          {isZh ? '已自動寄出' : 'Auto Dispatched'}
                        </span>
                      </div>

                      <div className="text-xs text-text-muted space-y-1.5 leading-relaxed bg-bg-surface p-3 rounded-xl border border-border/80">
                        <div>
                          <span className="font-bold text-text-main">{isZh ? '稱呼：' : 'Name: '}</span>
                          <span className="text-text-main font-medium">{conciergeDraft.name || (isZh ? '訪客' : 'Visitor')}</span>
                        </div>
                        <div>
                          <span className="font-bold text-text-main">Email：</span>
                          <span className="font-bold text-[#17324d] dark:text-[#ffb010]">{conciergeDraft.email}</span>
                        </div>
                        {conciergeDraft.company && (
                          <div>
                            <span className="font-bold text-text-main">{isZh ? '公司／團隊：' : 'Company: '}</span>
                            <span className="text-text-main font-medium">{conciergeDraft.company}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-text-main">{isZh ? '交流主旨：' : 'Topic: '}</span>
                          <span className="font-bold text-text-main">{conciergeDraft.subject}</span>
                        </div>
                        <div className="pt-2 text-text-main/90 font-medium border-t border-border/60 flex items-start gap-2">
                          <Info size={15} className="shrink-0 text-[#ffb010] mt-0.5" />
                          <span>
                            {isZh
                              ? '提醒您：小秘書已直接發送雙重確認信至上述信箱。請務必前往信箱查收並點擊「確認轉達給 David」連結。一經確認，訊息將立即直達呈報給 David 本人！'
                              : 'Notice: A double opt-in confirmation email has been dispatched. Please check your inbox and click the verification link to deliver your message directly to David!'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input Controls: Auto-expanding Textarea with Shift+Enter / Enter */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex gap-2 items-end">
                    <textarea
                      ref={chatTextareaRef}
                      rows={1}
                      aria-label={isZh ? '輸入想對 David 說的話' : 'Type inquiry or message to David'}
                      value={chatInput}
                      onChange={(e) => {
                        setChatInput(e.target.value);
                        adjustTextareaHeight(e.target);
                      }}
                      onCompositionStart={() => {
                        isComposingRef.current = true;
                      }}
                      onCompositionEnd={() => {
                        setTimeout(() => {
                          isComposingRef.current = false;
                        }, 50);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (e.shiftKey) {
                            // Allow natural newline on Shift+Enter
                            setTimeout(() => adjustTextareaHeight(chatTextareaRef.current), 10);
                            return;
                          }
                          if (
                            isComposingRef.current ||
                            (e.nativeEvent as any).isComposing ||
                            e.keyCode === 229
                          ) {
                            return; // IME composition in progress
                          }
                          e.preventDefault();
                          handleSendChat();
                        }
                      }}
                      placeholder={
                        isZh
                          ? '輸入想與 David 交流的事由…'
                          : 'Type message or inquiry…'
                      }
                      className="flex-1 min-w-[200px] min-h-[44px] max-h-[120px] resize-none py-2.5 px-3.5 rounded-xl border border-border bg-bg-elevated text-base sm:text-sm text-text-main outline-none focus:border-[#ffb010] leading-normal transition-all"
                    />
                    <button
                      type="button"
                      disabled={chatBusy || !chatInput.trim()}
                      onClick={() => handleSendChat()}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ffb010] hover:bg-[#f2a600] text-[#2b251a] font-bold shadow-xs transition-colors disabled:opacity-40"
                      title={isZh ? '送出' : 'Send'}
                    >
                      {chatBusy ? <LoaderCircle size={18} className="animate-spin text-[#2b251a]" /> : <Send size={18} strokeWidth={2.2} />}
                    </button>
                  </div>

                  {/* Legible real-email helper notice: always visible, never clipped */}
                  <div className="flex items-center justify-between gap-2 px-1 text-xs text-text-muted leading-tight">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Info size={13} className="shrink-0 text-[#ffb010]" />
                      <span className="truncate">
                        {isZh
                          ? '請留真實有效信箱，小秘書將自動發送驗證信以直達呈報 David'
                          : 'Valid active email required to deliver verification link to David.'}
                      </span>
                    </div>
                    <span className="shrink-0 text-[11px] opacity-75 font-mono hidden sm:inline">
                      {isZh ? 'Enter 送出 ↵' : 'Enter ↵ to send'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Direct Form View */}
            {activeTab === 'form' && (
              <form id="panel-form" role="tabpanel" aria-labelledby="tab-form" onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-bold text-text-main mb-1.5">
                      {isZh ? '姓名 *' : 'Name *'}
                    </label>
                    <input
                      id="contact-name"
                      required
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      placeholder={isZh ? '請輸入您的稱呼' : 'Your name'}
                      className="block h-11 w-full rounded-xl border border-border bg-bg-elevated px-3.5 text-base sm:text-sm text-text-main outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-bold text-text-main mb-1.5">
                      Email *
                    </label>
                    <input
                      id="contact-email"
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      placeholder="name@example.com"
                      className="block h-11 w-full rounded-xl border border-border bg-bg-elevated px-3.5 text-base sm:text-sm text-text-main outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-company" className="block text-sm font-bold text-text-main mb-1.5">
                    {isZh ? '公司／團隊（選填）' : 'Company / Organization (Optional)'}
                  </label>
                  <input
                    id="contact-company"
                    value={form.company}
                    onChange={(e) => update('company', e.target.value)}
                    placeholder={isZh ? '您的公司或團隊名稱' : 'Company or team name'}
                    className="block h-11 w-full rounded-xl border border-border bg-bg-elevated px-3.5 text-base sm:text-sm text-text-main outline-none focus:border-primary"
                  />
                </div>

                {/* Subject Selector */}
                <div className="space-y-2">
                  <span className="block text-sm font-bold text-text-main">
                    {isZh ? '交流主旨' : 'Topic'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SUBJECT_OPTIONS.map((opt) => {
                      const isSelected = selectedSubjectId === opt.id;
                      const IconComp = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectSubject(opt.id)}
                          className={`flex min-h-[46px] w-full items-center justify-between gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm font-bold transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary shadow-2xs ring-1 ring-primary/40'
                              : 'border-border bg-bg-elevated text-text-muted hover:border-text-muted hover:text-text-main'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                            <IconComp
                              size={15}
                              className={`shrink-0 ${isSelected ? 'text-primary' : 'text-text-muted'}`}
                            />
                            <span className="truncate">{isZh ? opt.zh : opt.en}</span>
                          </div>
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              isSelected
                                ? 'border-primary bg-primary text-white dark:text-bg-base'
                                : 'border-border bg-bg-surface'
                            }`}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedSubjectId === 'other' && (
                    <div className="pt-1">
                      <input
                        id="contact-custom-subject"
                        type="text"
                        required
                        aria-label={isZh ? '自訂交流主旨' : 'Custom Topic'}
                        value={customSubject}
                        onChange={(e) => handleCustomSubjectChange(e.target.value)}
                        placeholder={isZh ? '請輸入自訂交流主旨…' : 'Enter custom topic…'}
                        className="block h-11 w-full rounded-xl border border-border bg-bg-elevated px-3.5 text-base sm:text-sm text-text-main outline-none focus:border-primary"
                      />
                    </div>
                  )}
                </div>

                {/* Message Textarea */}
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-bold text-text-main mb-1.5">
                    {isZh ? '想討論的內容（至少 5 個字）*' : 'Message (min 5 characters) *'}
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    minLength={5}
                    rows={4}
                    value={form.message}
                    onChange={(e) => update('message', e.target.value)}
                    placeholder={isZh ? '請簡述您想與 David 交流或合作的內容…' : 'Describe what you would like to discuss…'}
                    className="block w-full resize-y rounded-xl border border-border bg-bg-elevated p-3.5 text-base sm:text-sm leading-relaxed text-text-main outline-none focus:border-primary min-h-[110px]"
                  />
                </div>

                <div className="flex items-start gap-2 text-sm text-text-muted leading-relaxed">
                  <Info size={16} strokeWidth={2} className="shrink-0 mt-0.5 text-primary" />
                  <span>
                    {isZh
                      ? '送出後小秘書會發送一封確認信至您的信箱，點擊確認後信件將立即轉達給 David 本人。'
                      : 'After sending, a confirmation link will be emailed to your inbox. Click to deliver to David.'}
                  </span>
                </div>

                {error && (
                  <p role="alert" className="rounded-xl bg-[var(--error)]/10 px-4 py-3 text-sm font-bold text-[var(--error)]">
                    {error}
                  </p>
                )}

                {/* Submit Button */}
                <button
                  disabled={busy}
                  type="submit"
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[#ffb010] hover:bg-[#f2a600] px-4 text-sm font-bold text-[#2b251a] shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? <LoaderCircle size={18} className="animate-spin text-[#2b251a]" /> : <Mail size={18} strokeWidth={2.2} />}
                  <span>
                    {busy
                      ? isZh
                        ? '安全檢驗與送出中…'
                        : 'Sending…'
                      : isZh
                        ? '寄送確認信（驗證信箱後轉達）'
                        : 'Send Confirmation Email'}
                  </span>
                </button>
              </form>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
