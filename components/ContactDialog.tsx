import React, { useState } from 'react';
import { Check, Copy, LoaderCircle, Mail, X } from 'lucide-react';
import { submitContactTicket } from '../lib/crm';
import { TurnstileWidget } from './TurnstileWidget';
import type { Locale } from '../types';

interface ContactDialogProps {
  locale: Locale;
  onClose: () => void;
}

export const SUBJECT_OPTIONS = [
  {
    id: 'consulting',
    zh: '資訊顧問／工商合作',
    en: 'IT Consulting & Partnership',
    placeholderZh: '請描述諮詢需求（例如：系統架構評估、AI Agent 落地規劃、專案跨系統整合…）',
    placeholderEn: 'Describe your consulting scope (e.g. system architecture, AI agents, integrations…)',
  },
  {
    id: 'recruiting',
    zh: '獵頭招募／職缺邀約',
    en: 'Recruitment & Job Inquiry',
    placeholderZh: '請簡述招募職位名稱、公司簡介、工作模式（顧問／全職／遠端）及相關條件…',
    placeholderEn: 'Describe the position, company intro, work mode (advisory / full-time / remote)…',
  },
  {
    id: 'training',
    zh: '技術演講／企業培訓',
    en: 'Tech Workshop & Speaking',
    placeholderZh: '請說明活動主題、預計舉辦時間、參與對象與預期成效…',
    placeholderEn: 'Describe the event topic, expected date, audience, and objectives…',
  },
  {
    id: 'other',
    zh: '其他合作提案',
    en: 'Other Inquiries',
    placeholderZh: '請在此詳細說明您想討論或合作的內容…',
    placeholderEn: 'Please describe in detail what you would like to discuss or collaborate on…',
  },
];

interface SubmittedReceipt {
  ticketNo: string;
  name: string;
  email: string;
  company: string;
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
  const [turnstileToken, setTurnstileToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
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
      subject: val.trim() || (isZh ? '其他合作提案' : 'Other Inquiries'),
    }));
  };

  const update = (field: 'name' | 'email' | 'company' | 'message', value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');

    const finalSubject =
      selectedSubjectId === 'other' && customSubject.trim()
        ? (isZh ? `其他：${customSubject.trim()}` : `Other: ${customSubject.trim()}`)
        : form.subject;

    try {
      const result = await submitContactTicket({
        name: form.name,
        email: form.email,
        company: form.company,
        subject: finalSubject,
        message: form.message,
        turnstileToken: turnstileToken || undefined,
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
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-border bg-bg-surface p-6 shadow-2xl md:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-dialog-title"
      >
        {/* Modal Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary">
              <Mail size={15} /> {isZh ? '聯絡表單' : 'Contact'}
            </div>
            <h2 id="contact-dialog-title" className="text-2xl font-black text-text-main">
              {submittedReceipt
                ? isZh
                  ? '已收到你的訊息'
                  : 'Message Received'
                : isZh
                  ? '把你的問題交給我'
                  : 'Tell me what you are building'}
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
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--success)] text-white">
                  <Check size={18} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-base font-black text-text-main">
                    {isZh ? '訊息已送出，已建立案件！' : 'Message Sent & Ticket Logged'}
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {isZh
                      ? '通知已發送至 104@david888.com，David 會盡速回覆。'
                      : 'Delivered to 104@david888.com. David will reply shortly.'}
                  </p>
                </div>
              </div>

              {/* Ticket No Badge with 1-click copy */}
              <div className="mt-3.5 flex items-center justify-between rounded-xl bg-bg-elevated px-3.5 py-2.5">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                    {isZh ? '服務追蹤序號' : 'Service Tracking No.'}
                  </div>
                  <div className="font-mono text-base font-black text-primary">
                    {submittedReceipt.ticketNo}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={copyTicket}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-surface px-2.5 py-1 text-xs font-bold text-text-main transition-colors hover:bg-bg-elevated"
                >
                  {copiedTicketNo ? (
                    <Check size={13} className="text-[var(--success)]" />
                  ) : (
                    <Copy size={13} />
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
            <div className="rounded-2xl border border-border bg-bg-elevated/60 p-4 text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-border/70 pb-2">
                <span className="font-black text-text-main uppercase tracking-wider text-[11px]">
                  {isZh ? '您填寫的案件存根' : 'Your Submission Receipt'}
                </span>
                <span className="text-[11px] text-text-muted">
                  {new Date().toLocaleDateString()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-text-muted">
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

              <div className="border-t border-border/70 pt-2.5">
                <div className="font-bold text-text-main mb-1.5">
                  {isZh ? '留言內容：' : 'Message:'}
                </div>
                <div className="max-h-36 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border/50 bg-bg-surface p-3 text-text-main font-mono text-[11px] leading-relaxed">
                  {submittedReceipt.message}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={copyFullReceipt}
                className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-bg-surface px-4 text-xs font-bold text-text-main transition-colors hover:bg-bg-elevated"
              >
                {copiedReceipt ? (
                  <Check size={14} className="text-[var(--success)]" />
                ) : (
                  <Copy size={14} />
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
                className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-primary px-4 text-xs font-black text-white transition-opacity hover:opacity-90 dark:text-bg-base"
              >
                {isZh ? '完成' : 'Done'}
              </button>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={submit} className="space-y-4">
            {/* Name and Email */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-bold text-text-main">
                <span>{isZh ? '姓名' : 'Name'} *</span>
                <input
                  required
                  value={form.name}
                  onChange={(event) => update('name', event.target.value)}
                  placeholder={isZh ? '王大明 / David' : 'Your name'}
                  className="h-10 w-full rounded-xl border border-border bg-bg-elevated px-3 text-xs outline-none focus:border-primary transition-colors"
                />
              </label>
              <label className="space-y-1.5 text-xs font-bold text-text-main">
                <span>Email *</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                  placeholder="contact@yourdomain.com"
                  className="h-10 w-full rounded-xl border border-border bg-bg-elevated px-3 text-xs outline-none focus:border-primary transition-colors"
                />
              </label>
            </div>

            {/* Company */}
            <label className="block space-y-1.5 text-xs font-bold text-text-main">
              <span>{isZh ? '公司／團隊（選填）' : 'Company / Organization (Optional)'}</span>
              <input
                value={form.company}
                onChange={(event) => update('company', event.target.value)}
                placeholder={isZh ? '例如：某某科技、獵頭顧問團隊' : 'e.g. Acme Corp'}
                className="h-10 w-full rounded-xl border border-border bg-bg-elevated px-3 text-xs outline-none focus:border-primary transition-colors"
              />
            </label>

            {/* Subject Checkbox / Pill Selection (打勾選項) */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-text-main">
                {isZh ? '諮詢類型／主旨 *' : 'Inquiry Category / Subject *'}
              </span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SUBJECT_OPTIONS.map((opt) => {
                  const isSelected = selectedSubjectId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectSubject(opt.id)}
                      className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/40'
                          : 'border-border bg-bg-elevated text-text-muted hover:border-text-muted hover:text-text-main'
                      }`}
                    >
                      <span className="truncate">{isZh ? opt.zh : opt.en}</span>
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary text-white dark:text-bg-base'
                            : 'border-border bg-bg-surface'
                        }`}
                      >
                        {isSelected && <Check size={10} strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* If "其他" is selected, allow custom input */}
              {selectedSubjectId === 'other' && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => handleCustomSubjectChange(e.target.value)}
                    placeholder={
                      isZh
                        ? '請輸入自訂主旨說明（例如：專訪、社群技術分享…）'
                        : 'Enter custom subject details…'
                    }
                    className="h-9 w-full rounded-xl border border-border bg-bg-elevated px-3 text-xs outline-none focus:border-primary transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Message Area */}
            <label className="block space-y-1.5 text-xs font-bold text-text-main">
              <span>{isZh ? '想討論的內容 *' : 'Message *'}</span>
              <textarea
                required
                minLength={10}
                rows={5}
                value={form.message}
                onChange={(event) => update('message', event.target.value)}
                placeholder={isZh ? activeOption.placeholderZh : activeOption.placeholderEn}
                className="w-full resize-y rounded-xl border border-border bg-bg-elevated px-3 py-2.5 text-xs leading-relaxed outline-none focus:border-primary transition-colors"
              />
            </label>

            {/* Cloudflare Turnstile Bot Verification */}
            <div className="pt-0.5">
              <TurnstileWidget
                action="contact"
                onSuccess={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken('')}
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl bg-[var(--error)]/10 px-4 py-2.5 text-xs font-bold text-[var(--error)]"
              >
                {error}
              </p>
            )}

            {/* Submit Button */}
            <button
              disabled={busy}
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-xs font-black text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60 dark:text-bg-base"
            >
              {busy && <LoaderCircle size={15} className="animate-spin" />}
              {busy
                ? isZh
                  ? '送出中…'
                  : 'Sending…'
                : isZh
                  ? '送出並取得服務序號'
                  : 'Send and get service number'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
};
