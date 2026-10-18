import React, { useState } from 'react';
import { Check, Copy, LoaderCircle, Mail, ShieldAlert, X } from 'lucide-react';
import { submitContactTicket } from '../lib/crm';
import { checkSpamWithClef } from '../lib/clef-guard';
import type { Locale } from '../types';

interface ContactDialogProps {
  locale: Locale;
  onClose: () => void;
}

export const SUBJECT_OPTIONS = [
  {
    id: 'tech_chat',
    zh: '技術交流／打個招呼',
    en: 'Tech Chat & Say Hello',
  },
  {
    id: 'consulting',
    zh: '顧問諮詢／業務合作',
    en: 'Consulting & Business',
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

interface SubmittedReceipt {
  ticketNo: string;
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
}

export const ContactDialog: React.FC<ContactDialogProps> = ({ locale, onClose }) => {
  const isZh = locale === 'zh';
  const defaultOption = SUBJECT_OPTIONS[0];

  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    subject: isZh ? defaultOption.zh : defaultOption.en,
    message: '',
  });
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(defaultOption.id);
  const [customSubject, setCustomSubject] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [submittedReceipt, setSubmittedReceipt] = useState<SubmittedReceipt | null>(null);
  const [copiedTicketNo, setCopiedTicketNo] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  const activeOption =
    SUBJECT_OPTIONS.find((opt) => opt.id === selectedSubjectId) || defaultOption;

  const handleSelectSubject = (id: string) => {
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
    setCustomSubject(val);
    setForm((prev) => ({
      ...prev,
      subject: val.trim() || (isZh ? '其他想法／隨意聊聊' : 'Other Ideas & Chat'),
    }));
  };

  const update = (field: 'name' | 'email' | 'company' | 'message', value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setIsBlocked(false);

    const finalSubject =
      selectedSubjectId === 'other' && customSubject.trim()
        ? (isZh ? `其他：${customSubject.trim()}` : `Other: ${customSubject.trim()}`)
        : form.subject;

    // 1. Clef-Flash Decision API: Spam, Scam & Phishing Verification
    try {
      const guardResult = await checkSpamWithClef({
        name: form.name,
        email: form.email,
        company: form.company,
        subject: finalSubject,
        message: form.message,
      });

      if (guardResult.isSpam) {
        setBusy(false);
        setIsBlocked(true);
        return; // Hard stop: rejected before hitting backend/Resend
      }
    } catch (guardErr) {
      console.warn('[ContactDialog] Clef guard check failed, proceeding to backend:', guardErr);
    }

    try {
      const result = await submitContactTicket({
        name: form.name,
        email: form.email,
        company: form.company,
        subject: finalSubject,
        message: form.message,
      });

      setSubmittedReceipt({
        ticketNo: result.ticketNo,
        name: form.name,
        email: form.email,
        company: form.company,
        subject: finalSubject,
        message: form.message,
      });
    } catch (submissionError) {
      console.error(submissionError);
      setError(
        isZh
          ? '目前服務尚未完成連線，請稍後再試。'
          : 'The contact service is temporarily unavailable. Please try again shortly.',
      );
    } finally {
      setBusy(false);
    }
  };

  const copyTicket = () => {
    if (!submittedReceipt) return;
    navigator.clipboard.writeText(submittedReceipt.ticketNo);
    setCopiedTicketNo(true);
    setTimeout(() => setCopiedTicketNo(false), 2000);
  };

  const copyFullReceipt = () => {
    if (!submittedReceipt) return;
    const text = isZh
      ? [
          `【David888 聯絡案件存根】`,
          `服務序號：${submittedReceipt.ticketNo}`,
          `諮詢類型：${submittedReceipt.subject}`,
          `聯絡姓名：${submittedReceipt.name}`,
          `電子郵件：${submittedReceipt.email}`,
          `公司團隊：${submittedReceipt.company || '-'}`,
          `留言內容：\n${submittedReceipt.message}`,
        ].join('\n')
      : [
          `[David888 Contact Receipt]`,
          `Ticket No: ${submittedReceipt.ticketNo}`,
          `Category: ${submittedReceipt.subject}`,
          `Name: ${submittedReceipt.name}`,
          `Email: ${submittedReceipt.email}`,
          `Company: ${submittedReceipt.company || '-'}`,
          `Message:\n${submittedReceipt.message}`,
        ].join('\n');
    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="max-h-[92vh] w-full max-w-xl sm:max-w-2xl overflow-y-auto rounded-[28px] border border-border bg-bg-surface p-6 shadow-2xl md:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-dialog-title"
      >
        {/* Modal Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary">
              <Mail size={15} /> {isZh ? '聯絡交流' : 'Get in Touch'}
            </div>
            <h2 id="contact-dialog-title" className="text-2xl font-black text-text-main">
              {submittedReceipt
                ? isZh
                  ? '已收到你的訊息'
                  : 'Message Received'
                : isBlocked
                  ? isZh
                    ? '訊息已被安全機制攔截屏蔽'
                    : 'Security Verification Notice'
                  : isZh
                    ? '與 David 交流與合作'
                    : 'Get in Touch with David'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-text-main hover:bg-bg-elevated transition-colors"
            aria-label={isZh ? '關閉' : 'Close'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Success View: Full Receipt Display ("顯示他寫了什麼！") */}
        {submittedReceipt ? (
          <div className="space-y-4">
            {/* Status card with Ticket Number */}
            <div className="rounded-2xl border border-[var(--success)]/35 bg-[var(--success)]/10 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--success)] text-white">
                  <Check size={20} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-text-main">
                    {isZh ? '訊息已送出，已建立案件！' : 'Message Sent & Ticket Logged'}
                  </h3>
                  <p className="text-sm text-text-muted mt-0.5">
                    {isZh
                      ? '訊息已送達 David 個人信箱，將盡速與您聯繫。'
                      : "Delivered directly to David's inbox. You will receive a response shortly."}
                  </p>
                </div>
              </div>

              {/* Ticket No Badge with 1-click copy */}
              <div className="mt-3.5 flex items-center justify-between rounded-xl bg-bg-elevated px-4 py-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-text-muted">
                    {isZh ? '服務追蹤序號' : 'Service Tracking No.'}
                  </div>
                  <div className="font-mono text-lg md:text-xl font-black text-primary mt-0.5">
                    {submittedReceipt.ticketNo}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={copyTicket}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-surface px-3 py-1.5 text-xs md:text-sm font-bold text-text-main transition-colors hover:bg-bg-elevated"
                >
                  {copiedTicketNo ? (
                    <Check size={14} className="text-[var(--success)]" />
                  ) : (
                    <Copy size={14} />
                  )}
                  <span>
                    {copiedTicketNo
                      ? isZh
                        ? '已複製'
                        : 'Copied'
                      : isZh
                        ? '複製序號'
                        : 'Copy'}
                  </span>
                </button>
              </div>
            </div>

            {/* Complete Submission Details (發出者內容存根) */}
            <div className="rounded-2xl border border-border bg-bg-elevated/60 p-4 sm:p-5 text-sm space-y-3.5">
              <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
                <span className="font-black text-text-main uppercase tracking-wider text-xs md:text-sm">
                  {isZh ? '您填寫的案件存根' : 'Your Submission Receipt'}
                </span>
                <span className="text-xs text-text-muted">
                  {new Date().toLocaleDateString()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-text-muted">
                <div>
                  <span className="font-bold text-text-main">{isZh ? '姓名：' : 'Name: '}</span>
                  <span className="text-text-main font-medium">{submittedReceipt.name}</span>
                </div>
                <div>
                  <span className="font-bold text-text-main">Email：</span>
                  <span className="text-text-main font-medium break-all">
                    {submittedReceipt.email}
                  </span>
                </div>
                {submittedReceipt.company && (
                  <div className="sm:col-span-2">
                    <span className="font-bold text-text-main">
                      {isZh ? '公司／團隊：' : 'Company: '}
                    </span>
                    <span className="text-text-main font-medium">
                      {submittedReceipt.company}
                    </span>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <span className="font-bold text-text-main">
                    {isZh ? '諮詢類型：' : 'Subject: '}
                  </span>
                  <span className="font-black text-primary">{submittedReceipt.subject}</span>
                </div>
              </div>

              <div className="border-t border-border/70 pt-3">
                <div className="font-bold text-text-main mb-2">
                  {isZh ? '留言內容：' : 'Message:'}
                </div>
                <div className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border/50 bg-bg-surface p-3.5 text-text-main font-mono text-xs md:text-sm leading-relaxed">
                  {submittedReceipt.message}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={copyFullReceipt}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border bg-bg-surface px-4 text-sm font-bold text-text-main transition-colors hover:bg-bg-elevated"
              >
                {copiedReceipt ? (
                  <Check size={16} className="text-[var(--success)]" />
                ) : (
                  <Copy size={16} />
                )}
                {copiedReceipt
                  ? isZh
                    ? '已複製存根'
                    : 'Receipt Copied'
                  : isZh
                    ? '複製完整存根'
                    : 'Copy Full Receipt'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-primary px-4 text-sm font-black text-white transition-opacity hover:opacity-90 dark:text-bg-base"
              >
                {isZh ? '完成' : 'Done'}
              </button>
            </div>
          </div>
        ) : isBlocked ? (
          /* Option A: Direct Hard Shield View (Zero Information Leak) */
          <div className="space-y-5">
            <div className="rounded-2xl border-2 border-[var(--error)]/50 bg-[var(--error)]/10 p-5 sm:p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--error)] text-white shadow-md">
                <ShieldAlert size={28} strokeWidth={2.5} />
              </div>
              <h3 className="mt-4 text-xl font-black text-text-main">
                {isZh ? '訊息已被安全機制攔截屏蔽' : 'Message Blocked by Security Filter'}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted max-w-md mx-auto">
                {isZh
                  ? '系統偵測此留言未通過安全性與推銷廣告檢驗，已被系統自動屏蔽拒絕發送。'
                  : 'This message failed automated security verification and has been blocked.'}
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsBlocked(false)}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-border bg-bg-surface px-4 text-sm font-bold text-text-main transition-colors hover:bg-bg-elevated"
              >
                {isZh ? '返回修改留言' : 'Back to Edit Message'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-primary px-4 text-sm font-black text-white transition-opacity hover:opacity-90 dark:text-bg-base"
              >
                {isZh ? '關閉' : 'Close'}
              </button>
            </div>
          </div>
        ) : (
          /* Form View (Clean Inputs with Zero Redundant Placeholders) */
          <form onSubmit={submit} className="space-y-4">
            {/* Name and Email - Option B: Floating Labels */}
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="relative">
                <input
                  id="contact-name"
                  required
                  value={form.name}
                  onChange={(event) => update('name', event.target.value)}
                  placeholder=" "
                  className="peer block h-[52px] w-full rounded-xl border border-border bg-bg-elevated px-3.5 pt-5 pb-1 text-sm md:text-base text-text-main outline-none transition-colors focus:border-primary"
                />
                <label
                  htmlFor="contact-name"
                  className={`pointer-events-none absolute left-3.5 origin-[0] font-bold transition-all duration-200 ${
                    form.name
                      ? 'top-1.5 text-[11px] text-text-muted peer-focus:text-primary dark:peer-focus:text-[#ffb010]'
                      : 'top-1.5 text-[11px] text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm md:peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:text-text-muted peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:font-bold peer-focus:text-primary dark:peer-focus:text-[#ffb010]'
                  }`}
                >
                  {isZh ? '姓名' : 'Name'}
                </label>
              </div>

              <div className="relative">
                <input
                  id="contact-email"
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                  placeholder=" "
                  className="peer block h-[52px] w-full rounded-xl border border-border bg-bg-elevated px-3.5 pt-5 pb-1 text-sm md:text-base text-text-main outline-none transition-colors focus:border-primary"
                />
                <label
                  htmlFor="contact-email"
                  className={`pointer-events-none absolute left-3.5 origin-[0] font-bold transition-all duration-200 ${
                    form.email
                      ? 'top-1.5 text-[11px] text-text-muted peer-focus:text-primary dark:peer-focus:text-[#ffb010]'
                      : 'top-1.5 text-[11px] text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm md:peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:text-text-muted peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:font-bold peer-focus:text-primary dark:peer-focus:text-[#ffb010]'
                  }`}
                >
                  Email
                </label>
              </div>
            </div>

            {/* Company - Option B: Floating Label */}
            <div className="relative">
              <input
                id="contact-company"
                value={form.company}
                onChange={(event) => update('company', event.target.value)}
                placeholder=" "
                className="peer block h-[52px] w-full rounded-xl border border-border bg-bg-elevated px-3.5 pt-5 pb-1 text-sm md:text-base text-text-main outline-none transition-colors focus:border-primary"
              />
              <label
                htmlFor="contact-company"
                className={`pointer-events-none absolute left-3.5 origin-[0] font-bold transition-all duration-200 ${
                  form.company
                    ? 'top-1.5 text-[11px] text-text-muted peer-focus:text-primary dark:peer-focus:text-[#ffb010]'
                    : 'top-1.5 text-[11px] text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm md:peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:text-text-muted peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:font-bold peer-focus:text-primary dark:peer-focus:text-[#ffb010]'
                }`}
              >
                {isZh ? '公司／團隊（選填）' : 'Company / Organization (Optional)'}
              </label>
            </div>

            {/* Subject Checkbox / Pill Selection (打勾選項) */}
            <div className="space-y-2">
              <span className="text-sm font-bold text-text-main">
                {isZh ? '交流主旨' : 'Topic'}
              </span>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {SUBJECT_OPTIONS.map((opt) => {
                  const isSelected = selectedSubjectId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectSubject(opt.id)}
                      className={`flex min-h-[50px] items-center justify-between gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-xs sm:text-sm font-bold transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/40'
                          : 'border-border bg-bg-elevated text-text-muted hover:border-text-muted hover:text-text-main'
                      }`}
                    >
                      <span className="min-w-0 flex-1 leading-snug">{isZh ? opt.zh : opt.en}</span>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs transition-colors ${
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

              {/* If "其他" is selected, allow custom input with Floating Label */}
              {selectedSubjectId === 'other' && (
                <div className="relative pt-1">
                  <input
                    id="contact-custom-subject"
                    type="text"
                    required
                    value={customSubject}
                    onChange={(e) => handleCustomSubjectChange(e.target.value)}
                    placeholder=" "
                    className="peer block h-[52px] w-full rounded-xl border border-border bg-bg-elevated px-3.5 pt-5 pb-1 text-sm md:text-base text-text-main outline-none transition-colors focus:border-primary"
                  />
                  <label
                    htmlFor="contact-custom-subject"
                    className={`pointer-events-none absolute left-3.5 origin-[0] font-bold transition-all duration-200 ${
                      customSubject
                        ? 'top-2.5 text-[11px] text-text-muted peer-focus:text-primary dark:peer-focus:text-[#ffb010]'
                        : 'top-2.5 text-[11px] text-text-muted peer-placeholder-shown:top-4.5 peer-placeholder-shown:text-sm md:peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:text-text-muted peer-focus:top-2.5 peer-focus:text-[11px] peer-focus:font-bold peer-focus:text-primary dark:peer-focus:text-[#ffb010]'
                    }`}
                  >
                    {isZh ? '自訂交流主旨…' : 'Custom Topic…'}
                  </label>
                </div>
              )}
            </div>

            {/* Message Area - Option B: Floating Label */}
            <div className="relative">
              <textarea
                id="contact-message"
                required
                minLength={10}
                rows={4}
                value={form.message}
                onChange={(event) => update('message', event.target.value)}
                placeholder=" "
                className="peer block w-full resize-y rounded-xl border border-border bg-bg-elevated px-3.5 pt-6 pb-2.5 text-sm md:text-base leading-relaxed text-text-main outline-none transition-colors focus:border-primary min-h-[110px]"
              />
              <label
                htmlFor="contact-message"
                className={`pointer-events-none absolute left-3.5 origin-[0] font-bold transition-all duration-200 ${
                  form.message
                    ? 'top-1.5 text-[11px] text-text-muted peer-focus:text-primary dark:peer-focus:text-[#ffb010]'
                    : 'top-1.5 text-[11px] text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm md:peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:text-text-muted peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:font-bold peer-focus:text-primary dark:peer-focus:text-[#ffb010]'
                }`}
              >
                {isZh ? '想討論的內容' : 'Message'}
              </label>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl bg-[var(--error)]/10 px-4 py-3 text-sm font-bold text-[var(--error)]"
              >
                {error}
              </p>
            )}

            {/* Submit Button */}
            <button
              disabled={busy}
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-black text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60 dark:text-bg-base shadow-sm"
            >
              {busy && <LoaderCircle size={18} className="animate-spin" />}
              {busy
                ? isZh
                  ? '安全檢驗與送出中…'
                  : 'Sending…'
                : isZh
                  ? '送出訊息'
                  : 'Send Message'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
};
