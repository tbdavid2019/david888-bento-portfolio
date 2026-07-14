import React, { useState } from 'react';
import { Check, LoaderCircle, Mail, X } from 'lucide-react';
import { submitContactTicket } from '../lib/crm';
import type { Locale } from '../types';

interface ContactDialogProps {
  locale: Locale;
  onClose: () => void;
}

const initialForm = { name: '', email: '', company: '', subject: '', message: '' };

export const ContactDialog: React.FC<ContactDialogProps> = ({ locale, onClose }) => {
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [ticketNo, setTicketNo] = useState('');
  const [error, setError] = useState('');
  const isZh = locale === 'zh';

  const update = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const result = await submitContactTicket(form);
      setTicketNo(result.ticketNo);
    } catch (submissionError) {
      console.error(submissionError);
      setError(
        isZh
          ? '目前服務尚未完成部署，請稍後再試。'
          : 'The contact service is not deployed yet. Please try again shortly.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-border bg-bg-surface p-6 shadow-2xl md:p-8" role="dialog" aria-modal="true" aria-labelledby="contact-dialog-title">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary">
              <Mail size={15} /> {isZh ? '聯絡表單' : 'Contact'}
            </div>
            <h2 id="contact-dialog-title" className="text-2xl font-black text-text-main">
              {isZh ? '把你的問題交給我' : 'Tell me what you are building'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-text-main" aria-label={isZh ? '關閉' : 'Close'}>
            <X size={18} />
          </button>
        </div>

        {ticketNo ? (
          <div className="rounded-2xl border border-[var(--success)]/35 bg-[var(--success)]/10 p-5">
            <Check className="mb-3 text-[var(--success)]" size={24} />
            <h3 className="text-lg font-black text-text-main">{isZh ? '已收到你的訊息' : 'Message received'}</h3>
            <p className="mt-2 text-sm leading-6 text-text-muted">{isZh ? '請保存這個服務序號，後續回覆會依此追蹤。' : 'Keep this service number for follow-up.'}</p>
            <div className="mt-4 rounded-xl bg-bg-elevated px-4 py-3 font-mono text-lg font-black text-text-main">{ticketNo}</div>
            <button type="button" onClick={onClose} className="mt-5 h-11 rounded-full bg-primary px-5 text-sm font-black text-white dark:text-bg-base">{isZh ? '完成' : 'Done'}</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-bold text-text-main">
                <span>{isZh ? '姓名' : 'Name'} *</span>
                <input required value={form.name} onChange={(event) => update('name', event.target.value)} className="h-11 w-full rounded-xl border border-border bg-bg-elevated px-3 outline-none focus:border-primary" />
              </label>
              <label className="space-y-2 text-sm font-bold text-text-main">
                <span>Email *</span>
                <input required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} className="h-11 w-full rounded-xl border border-border bg-bg-elevated px-3 outline-none focus:border-primary" />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-bold text-text-main">
                <span>{isZh ? '公司／團隊' : 'Company / Team'}</span>
                <input value={form.company} onChange={(event) => update('company', event.target.value)} className="h-11 w-full rounded-xl border border-border bg-bg-elevated px-3 outline-none focus:border-primary" />
              </label>
              <label className="space-y-2 text-sm font-bold text-text-main">
                <span>{isZh ? '主旨' : 'Subject'} *</span>
                <input required value={form.subject} onChange={(event) => update('subject', event.target.value)} className="h-11 w-full rounded-xl border border-border bg-bg-elevated px-3 outline-none focus:border-primary" />
              </label>
            </div>
            <label className="block space-y-2 text-sm font-bold text-text-main">
              <span>{isZh ? '想討論的內容' : 'Message'} *</span>
              <textarea required minLength={10} rows={6} value={form.message} onChange={(event) => update('message', event.target.value)} className="w-full resize-y rounded-xl border border-border bg-bg-elevated px-3 py-3 outline-none focus:border-primary" />
            </label>
            {error && <p role="alert" className="rounded-xl bg-[var(--error)]/10 px-4 py-3 text-sm font-bold text-[var(--error)]">{error}</p>}
            <button disabled={busy} type="submit" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60 dark:text-bg-base">
              {busy && <LoaderCircle size={17} className="animate-spin" />}
              {busy ? (isZh ? '送出中…' : 'Sending…') : (isZh ? '送出並取得服務序號' : 'Send and get a service number')}
            </button>
          </form>
        )}
      </section>
    </div>
  );
};
