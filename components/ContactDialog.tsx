import React, { useState, useRef, useEffect } from 'react';
import {
  Briefcase,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  Ghost,
  Info,
  LoaderCircle,
  Mail,
  MessageCircle,
  MessageSquare,
  Mic,
  Send,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  submitContactTicket,
  sendConciergeMessage,
  type ConciergeChatMessage,
  type ConciergeChatDraft,
} from '../lib/crm';
import { checkSpamWithClef } from '../lib/clef-guard';
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
  },
  {
    id: 'tech_chat',
    zh: '技術交流／打個招呼',
    en: 'Tech Chat & Say Hello',
  },
  {
    id: 'recruitment',
    zh: '職缺邀約／演講培訓',
    en: 'Opportunities & Speaking',
  },
  {
    id: 'other',
    zh: '其他想法／隨意聊聊',
    en: 'Other Ideas & Chat',
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
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full bg-primary text-white dark:text-bg-base border border-border shadow-xs select-none ${className}`}
      style={{ width: size, height: size }}
      aria-label={label}
    >
      <Ghost size={iconSize} strokeWidth={2} aria-hidden="true" />

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
  const [isBlocked, setIsBlocked] = useState(false);
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
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

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
    ? '您好！我是 David 的小秘書。無論是顧問諮詢、系統架構合作、職缺邀約，或是想直接索取 David 的信箱，我都能為您服務。請問今天想聊聊哪方面的事情呢？'
    : "Hello! I am David's Concierge. Whether you would like to discuss technical consulting, architecture collaboration, career opportunities, or request David's direct contact, I am at your service. How may I assist you today?";

  const [messages, setMessages] = useState<ConciergeChatMessage[]>([
    {
      role: 'assistant',
      content: initialGreeting,
    },
  ]);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, revealEmail, conciergeReady]);

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
    if (typeof window !== 'undefined') {
      const targetPath = tab === 'form' ? '/contact/form' : '/contact';
      if (window.location.pathname !== targetPath) {
        window.history.replaceState(null, '', targetPath);
      }
    }
  };

  // Submit contact message (from either Concierge Chat or Direct Form)
  const executeSubmission = async (submissionPayload: {
    name: string;
    email: string;
    company?: string;
    subject: string;
    message: string;
  }) => {
    setBusy(true);
    setError('');
    setIsBlocked(false);

    // 1. Clef-Flash Spam & Scam Verification
    try {
      const guardResult = await checkSpamWithClef({
        name: submissionPayload.name,
        email: submissionPayload.email,
        company: submissionPayload.company,
        subject: submissionPayload.subject,
        message: submissionPayload.message,
      });

      if (guardResult.isSpam) {
        setBusy(false);
        setIsBlocked(true);
        return; // Blocked safely before hitting Resend
      }
    } catch (guardErr) {
      console.warn('[ContactDialog] Clef guard check failed, proceeding to backend:', guardErr);
    }

    try {
      const result = await submitContactTicket({
        name: submissionPayload.name,
        email: submissionPayload.email,
        company: submissionPayload.company,
        subject: submissionPayload.subject,
        message: submissionPayload.message,
        locale,
      });

      if (result?.blocked) {
        setIsBlocked(true);
        return;
      }

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
            ? '請完整填寫姓名、有效信箱，且留言內容至少需 10 個字元。'
            : 'Please provide a valid name, email, subject, and a message of at least 10 characters.',
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

  const handleConciergeSubmit = async (overrideDraft?: ConciergeChatDraft) => {
    const draft = overrideDraft || conciergeDraft;
    if (!draft.email || !draft.message || draft.message.trim().length < 5) {
      setError(
        isZh
          ? '請至少提供您的 Email 以及想與 David 交流的留言內容。'
          : 'Please provide your email and message details.',
      );
      return;
    }
    await executeSubmission({
      name: draft.name.trim() || (isZh ? '訪客' : 'Visitor'),
      email: draft.email.trim(),
      company: draft.company?.trim(),
      subject: draft.subject || (isZh ? defaultOption.zh : defaultOption.en),
      message: draft.message.trim(),
    });
  };

  // Quick reply chip click in chat
  const handleChipClick = async (chipId: string, chipLabel: string) => {
    if (chipId === 'email_direct') {
      setRevealEmail(true);
      const userMsg: ConciergeChatMessage = {
        role: 'user',
        content: isZh ? '我想直接索取 David 的 Email 信箱。' : "I'd like to get David's direct email address.",
      };
      const assistantMsg: ConciergeChatMessage = {
        role: 'assistant',
        content: isZh
          ? '沒問題！已為您在下方展開 David 的直通信箱名片卡 (104@david888.com)。您也可以直接在對話中告訴我想轉達給 David 的話，由我為您整理送達！'
          : "Certainly! I've displayed David's direct contact card below (104@david888.com). You can also tell me what you'd like to forward to David right here!",
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      return;
    }

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
    }

    // Check if user is confirming a ready draft in dialogue
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
            ? `收到！小秘書正為您發送確認信至 ${conciergeDraft.email}，請稍候查收信箱！`
            : `Understood! Dispatching confirmation email to ${conciergeDraft.email}...`,
        },
      ];
      setMessages(nextMessages);
      await handleConciergeSubmit();
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

      if (result.revealEmail) {
        setRevealEmail(true);
      }

      setConciergeDraft((prev) => ({
        name: result.draft?.name || prev.name,
        email: result.draft?.email || prev.email,
        company: result.draft?.company || prev.company,
        subject: result.draft?.subject || prev.subject,
        message: result.draft?.message || prev.message || textToSend,
      }));

      setConciergeReady(Boolean(result.readyToConfirm));

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.reply },
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

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText('104@david888.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
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
                className="inline-flex h-11 w-full sm:flex-1 items-center justify-center rounded-full bg-primary px-4 text-sm font-bold text-white dark:text-bg-base transition-opacity hover:opacity-90 shadow-xs"
              >
                {isZh ? '完成' : 'Done'}
              </button>
            </div>
          </div>
        ) : isBlocked ? (
          /* 2. Security Blocked View */
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-lg sm:text-xl font-bold text-text-main">
                {isZh ? '訊息已被安全機制攔截屏蔽' : 'Security Verification Notice'}
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

            <div className="rounded-2xl border-2 border-[var(--error)]/50 bg-[var(--error)]/10 p-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--error)] text-white shadow-sm">
                <ShieldAlert size={24} strokeWidth={2.2} />
              </div>
              <h3 className="mt-3.5 text-lg font-bold text-text-main">
                {isZh ? '未通過安全性檢驗' : 'Message Blocked'}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted max-w-md mx-auto">
                {isZh
                  ? '系統偵測此留言未通過安全性與推銷廣告檢驗，已被系統自動屏蔽拒絕發送。'
                  : 'This message failed automated security verification and has been blocked.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsBlocked(false)}
                className="inline-flex h-11 w-full sm:flex-1 items-center justify-center rounded-full border border-border bg-bg-surface px-4 text-sm font-bold text-text-main transition-colors hover:bg-bg-elevated"
              >
                {isZh ? '返回修改留言' : 'Back to Edit Message'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-full sm:flex-1 items-center justify-center rounded-full bg-primary px-4 text-sm font-bold text-white transition-opacity hover:opacity-90 dark:text-bg-base"
              >
                {isZh ? '關閉' : 'Close'}
              </button>
            </div>
          </div>
        ) : (
          /* 3. Main Views: Segmented Tabs (Concierge Chat / Direct Form) */
          <div className="space-y-3.5">
            {/* Top Row: Segmented Mode Switcher + Close Button (No redundant header block!) */}
            <div className="flex items-center justify-between gap-2.5">
              <div
                role="tablist"
                aria-label={isZh ? '選擇接待模式' : 'Choose mode'}
                className="flex flex-1 rounded-xl bg-bg-elevated p-1 border border-border/70 text-sm font-bold"
              >
                <button
                  role="tab"
                  type="button"
                  id="tab-chat"
                  aria-selected={activeTab === 'chat'}
                  aria-controls="panel-chat"
                  onClick={() => switchTab('chat')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'chat'
                      ? 'bg-bg-surface text-primary shadow-xs'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  <Ghost size={16} strokeWidth={2} />
                  <span>{isZh ? '小秘書接待' : 'Concierge Chat'}</span>
                </button>
                <button
                  role="tab"
                  type="button"
                  id="tab-form"
                  aria-selected={activeTab === 'form'}
                  aria-controls="panel-form"
                  onClick={() => switchTab('form')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'form'
                      ? 'bg-bg-surface text-primary shadow-xs'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  <Mail size={16} strokeWidth={2} />
                  <span>{isZh ? '直接填寫表單' : 'Direct Form'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-elevated text-text-main hover:bg-bg-surface transition-colors"
                aria-label={isZh ? '關閉' : 'Close'}
              >
                <X size={18} />
              </button>
            </div>

            {/* TAB 1: Concierge Chat View */}
            {activeTab === 'chat' && (
              <div id="panel-chat" role="tabpanel" aria-labelledby="tab-chat" className="space-y-3.5">
                {/* Chat Scroll Container */}
                <div className="max-h-[52vh] min-h-[240px] overflow-y-auto space-y-4 rounded-2xl border border-border bg-bg-elevated/40 p-4">
                  {messages.map((msg, idx) => {
                    const isAssistant = msg.role === 'assistant';
                    return (
                      <div
                        key={idx}
                        className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                      >
                        {isAssistant && <SecretaryAvatar size={36} locale={locale} />}
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed box-border ${
                            isAssistant
                              ? 'bg-bg-elevated border border-border text-text-main shadow-2xs'
                              : 'bg-primary text-white dark:text-bg-base font-bold shadow-2xs'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}

                  {/* Quick Reply Chips (Pure Lucide Icons + Unified text-sm font scale) */}
                  <div className="pt-1 space-y-2.5">
                    <div className="text-sm font-bold text-text-muted flex items-center gap-1.5">
                      <MessageCircle size={15} strokeWidth={2} className="text-primary" />
                      <span>{isZh ? '快速選擇諮詢項目' : 'Quick Inquiry Options'}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleChipClick('consulting', isZh ? '顧問諮詢／業務合作' : 'Consulting & Business')}
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-surface hover:border-primary hover:bg-bg-elevated px-3.5 py-2.5 text-sm font-bold text-text-main transition-colors text-left"
                      >
                        <Briefcase size={16} strokeWidth={2} className="shrink-0 text-primary" />
                        <span className="truncate">{isZh ? '顧問諮詢／業務合作' : 'Consulting & Business'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChipClick('tech_chat', isZh ? '技術交流／打個招呼' : 'Tech Chat & Say Hello')}
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-surface hover:border-primary hover:bg-bg-elevated px-3.5 py-2.5 text-sm font-bold text-text-main transition-colors text-left"
                      >
                        <MessageCircle size={16} strokeWidth={2} className="shrink-0 text-primary" />
                        <span className="truncate">{isZh ? '技術交流／打個招呼' : 'Tech Chat & Say Hello'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChipClick('recruitment', isZh ? '職缺邀約／演講培訓' : 'Opportunities & Speaking')}
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-surface hover:border-primary hover:bg-bg-elevated px-3.5 py-2.5 text-sm font-bold text-text-main transition-colors text-left"
                      >
                        <Mic size={16} strokeWidth={2} className="shrink-0 text-primary" />
                        <span className="truncate">{isZh ? '職缺邀約／演講培訓' : 'Opportunities & Speaking'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChipClick('email_direct', isZh ? '直接索取聯絡信箱' : "Get Direct Email")}
                        className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/15 hover:border-primary px-3.5 py-2.5 text-sm font-bold text-primary transition-colors text-left"
                      >
                        <Mail size={16} strokeWidth={2} className="shrink-0 text-primary" />
                        <span className="truncate">{isZh ? '直接索取聯絡信箱' : 'Get Direct Email'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Inline Direct Contact Card (when revealEmail is triggered) */}
                  {revealEmail && (
                    <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 text-sm shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
                        <span className="font-bold text-sm text-text-main flex items-center gap-2">
                          <Mail size={16} strokeWidth={2} className="text-primary" />
                          <span>{isZh ? 'David 直通信箱名片卡' : "David's Direct Contact Card"}</span>
                        </span>
                        <span className="text-xs font-bold text-success bg-success/10 border border-success/30 px-2.5 py-0.5 rounded-full">
                          {isZh ? '直通個人信箱' : 'Direct Inbox'}
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
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-white dark:text-bg-base font-bold text-sm hover:opacity-90 transition-opacity"
                          >
                            {copiedEmail ? <Check size={15} /> : <Copy size={15} />}
                            <span>{copiedEmail ? (isZh ? '已複製' : 'Copied') : (isZh ? '複製信箱' : 'Copy Email')}</span>
                          </button>
                          <a
                            href="mailto:104@david888.com"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-border bg-bg-elevated font-bold text-sm text-text-main hover:border-border-hover hover:bg-bg-surface"
                          >
                            <span>{isZh ? '直接寫信' : 'Email Directly'}</span>
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inline Conversational Summary & Dispatch Confirmation Widget */}
                  {conciergeReady && conciergeDraft.email && (
                    <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-border/80 pb-2">
                        <span className="font-bold text-sm text-text-main flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-success shrink-0" />
                          <span>{isZh ? '小秘書已為您彙整完畢' : 'Inquiry Summary Ready'}</span>
                        </span>
                        <span className="text-xs font-bold text-success bg-success/10 border border-success/30 px-2.5 py-0.5 rounded-full">
                          {isZh ? '待確認發送' : 'Ready to Send'}
                        </span>
                      </div>

                      <div className="text-xs text-text-muted space-y-1.5 leading-relaxed bg-bg-surface/80 p-3 rounded-xl border border-border/60">
                        <div>
                          <span className="font-bold text-text-main">{isZh ? '稱呼：' : 'Name: '}</span>
                          <span className="text-text-main font-medium">{conciergeDraft.name || (isZh ? '訪客' : 'Visitor')}</span>
                        </div>
                        <div>
                          <span className="font-bold text-text-main">Email：</span>
                          <span className="font-bold text-primary">{conciergeDraft.email}</span>
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
                        <div>
                          <span className="font-bold text-text-main">{isZh ? '留言內容：' : 'Message: '}</span>
                          <span className="text-text-main">{conciergeDraft.message}</span>
                        </div>
                      </div>

                      {error && (
                        <p role="alert" className="rounded-xl bg-[var(--error)]/10 px-3.5 py-2 text-xs font-bold text-[var(--error)]">
                          {error}
                        </p>
                      )}

                      <button
                        disabled={busy}
                        type="button"
                        onClick={() => handleConciergeSubmit()}
                        className="w-full inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white dark:text-bg-base transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 shadow-xs"
                      >
                        {busy ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={16} />}
                        <span>
                          {busy
                            ? isZh
                              ? '發送確認信中…'
                              : 'Sending…'
                            : isZh
                              ? `確認由小秘書寄出確認信至 ${conciergeDraft.email}`
                              : `Confirm & Send to ${conciergeDraft.email}`}
                        </span>
                      </button>
                    </div>
                  )}

                  <div ref={chatMessagesEndRef} />
                </div>

                {/* Chat Input Controls with IME Protection */}
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    aria-label={isZh ? '輸入詢問或轉達內容' : 'Type inquiry or message'}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onCompositionStart={() => {
                      isComposingRef.current = true;
                    }}
                    onCompositionEnd={() => {
                      isComposingRef.current = false;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        if (
                          isComposingRef.current ||
                          e.nativeEvent.isComposing ||
                          e.keyCode === 229
                        ) {
                          return; // IME composition in progress, do nothing!
                        }
                        e.preventDefault();
                        handleSendChat();
                      }
                    }}
                    placeholder={
                      isZh
                        ? '輸入想對 David 說的話、您的稱呼或信箱…'
                        : 'Type your message, name, or email…'
                    }
                    className="flex-1 min-w-[200px] h-11 rounded-xl border border-border bg-bg-elevated px-3.5 text-base sm:text-sm text-text-main outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    disabled={chatBusy || !chatInput.trim()}
                    onClick={() => handleSendChat()}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white dark:text-bg-base transition-opacity hover:opacity-90 disabled:opacity-40"
                    title={isZh ? '送出' : 'Send'}
                  >
                    {chatBusy ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} strokeWidth={2} />}
                  </button>
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
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectSubject(opt.id)}
                          className={`flex min-h-[46px] w-full items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left text-sm font-bold transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary shadow-2xs ring-1 ring-primary/40'
                              : 'border-border bg-bg-elevated text-text-muted hover:border-text-muted hover:text-text-main'
                          }`}
                        >
                          <span className="min-w-0 flex-1 truncate">{isZh ? opt.zh : opt.en}</span>
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
                    {isZh ? '想討論的內容（至少 10 個字）*' : 'Message (min 10 characters) *'}
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    minLength={10}
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
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-white dark:text-bg-base transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 shadow-xs"
                >
                  {busy ? <LoaderCircle size={18} className="animate-spin" /> : <Mail size={18} strokeWidth={2} />}
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
