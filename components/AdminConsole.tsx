import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { LogIn, LogOut, MessageCircle, Megaphone, RefreshCw, Send } from 'lucide-react';
import { firebaseAuth, firebaseDb } from '../lib/firebase';
import { listTicketReplies, listTickets, loadHomepageAnnouncement, saveHomepageAnnouncement, sendTicketReply, type ContactTicket, type HomepageAnnouncement, type TicketReply } from '../lib/crm';

const emptyAnnouncement: HomepageAnnouncement = { enabled: false, eyebrow: '公告', title: '', body: '', linkLabel: '', link: '' };

export const AdminConsole: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('oobwei@gmail.com');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tickets, setTickets] = useState<ContactTicket[]>([]);
  const [selected, setSelected] = useState<ContactTicket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [reply, setReply] = useState('');
  const [announcement, setAnnouncement] = useState(emptyAnnouncement);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => onAuthStateChanged(firebaseAuth, setUser), []);

  useEffect(() => {
    if (!user) return;
    void refresh();
  }, [user]);

  const refresh = async () => {
    setBusy(true);
    setNotice('');
    try {
      const [nextTickets, nextAnnouncement] = await Promise.all([listTickets(), loadHomepageAnnouncement()]);
      setTickets(nextTickets);
      setAnnouncement(nextAnnouncement ?? emptyAnnouncement);
      if (selected) setReplies(await listTicketReplies(selected.id));
    } catch (error) {
      console.error(error);
      setNotice('讀取失敗：請確認 Firestore 已建立，且登入帳號是管理者。');
    } finally {
      setBusy(false);
    }
  };

  const login = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setLoginError('');
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      setPassword('');
    } catch (error) {
      console.error(error);
      setLoginError('登入失敗：請確認 Firebase Authentication 已啟用 Email/Password。');
    } finally {
      setBusy(false);
    }
  };

  const selectTicket = async (ticket: ContactTicket) => {
    setSelected(ticket);
    setReplies(await listTicketReplies(ticket.id));
    setNotice('');
  };

  const saveAnnouncement = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      await saveHomepageAnnouncement(announcement);
      setNotice('公告已更新。');
    } catch (error) {
      console.error(error);
      setNotice('公告儲存失敗，請確認 Firestore 權限。');
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || !reply.trim()) return;
    setBusy(true);
    try {
      await sendTicketReply(selected.id, reply.trim());
      await updateDoc(doc(firebaseDb, 'tickets', selected.id), { status: 'replied' });
      setReply('');
      setReplies(await listTicketReplies(selected.id));
      await refresh();
      setNotice('回覆已寄出並記錄。');
    } catch (error) {
      console.error(error);
      setNotice('回覆失敗：請確認 Functions 與 SMTP 設定已部署。');
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <form onSubmit={login} className="w-full max-w-md rounded-[28px] border border-border bg-bg-surface p-7 shadow-2xl">
          <div className="mb-7 flex items-center gap-3 text-primary"><LogIn size={20} /><span className="text-xs font-black uppercase tracking-[0.2em]">David888 CRM</span></div>
          <h1 className="text-3xl font-black text-text-main">管理後台</h1>
          <p className="mt-2 text-sm leading-6 text-text-muted">登入後管理首頁公告、查看聯絡案件與回覆客戶。</p>
          <div className="mt-6 space-y-4">
            <label className="block space-y-2 text-sm font-bold text-text-main"><span>Email</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-xl border border-border bg-bg-elevated px-3 outline-none focus:border-primary" /></label>
            <label className="block space-y-2 text-sm font-bold text-text-main"><span>密碼</span><input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded-xl border border-border bg-bg-elevated px-3 outline-none focus:border-primary" /></label>
          </div>
          {loginError && <p role="alert" className="mt-4 rounded-xl bg-[var(--error)]/10 px-4 py-3 text-sm font-bold text-[var(--error)]">{loginError}</p>}
          <button disabled={busy} type="submit" className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-black text-white disabled:opacity-60 dark:text-bg-base">{busy ? '登入中…' : '登入後台'}</button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 rounded-[28px] border border-border bg-bg-surface p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div><div className="text-xs font-black uppercase tracking-[0.2em] text-primary">David888 CRM</div><h1 className="mt-1 text-2xl font-black text-text-main">管理後台</h1></div>
          <div className="flex items-center gap-2"><button type="button" onClick={() => void refresh()} className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-bold text-text-main"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} />重新整理</button><button type="button" onClick={() => void signOut(firebaseAuth)} className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-black text-white dark:text-bg-base"><LogOut size={15} />登出</button></div>
        </header>
        {notice && <div role="status" className="mb-6 rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm font-bold text-text-main">{notice}</div>}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-[28px] border border-border bg-bg-surface p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><MessageCircle size={18} className="text-primary" /><h2 className="text-lg font-black text-text-main">客戶案件</h2><span className="ml-auto rounded-full bg-bg-elevated px-3 py-1 text-xs font-black text-text-muted">{tickets.length}</span></div>
            <div className="space-y-2">
              {tickets.length === 0 && <p className="rounded-2xl bg-bg-elevated px-4 py-8 text-center text-sm text-text-muted">目前沒有聯絡案件。</p>}
              {tickets.map((ticket) => <button type="button" key={ticket.id} onClick={() => void selectTicket(ticket)} className={`w-full rounded-2xl border p-4 text-left transition-colors ${selected?.id === ticket.id ? 'border-primary bg-primary/10' : 'border-border bg-bg-elevated hover:border-primary/50'}`}><div className="flex items-start justify-between gap-3"><span className="font-mono text-sm font-black text-primary">{ticket.ticketNo}</span><span className="rounded-full bg-bg-surface px-2 py-1 text-[11px] font-black text-text-muted">{ticket.status}</span></div><div className="mt-2 font-black text-text-main">{ticket.subject}</div><div className="mt-1 text-sm text-text-muted">{ticket.name} · {ticket.email}</div></button>)}
            </div>
          </section>

          <section className="rounded-[28px] border border-border bg-bg-surface p-5 shadow-sm">
            {selected ? <><div className="border-b border-border pb-4"><div className="font-mono text-sm font-black text-primary">{selected.ticketNo}</div><h2 className="mt-2 text-xl font-black text-text-main">{selected.subject}</h2><p className="mt-2 text-sm text-text-muted">{selected.name} · {selected.email}{selected.company ? ` · ${selected.company}` : ''}</p></div><div className="max-h-64 space-y-3 overflow-y-auto py-4"><div className="rounded-2xl bg-bg-elevated p-4 text-sm leading-6 text-text-main">{selected.message}</div>{replies.map((item) => <div key={item.id} className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm leading-6 text-text-main"><div className="mb-1 text-[11px] font-black uppercase tracking-wider text-primary">你的回覆</div>{item.body}</div>)}</div><form onSubmit={sendReply} className="space-y-3"><textarea required minLength={2} rows={4} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="輸入回覆…" className="w-full resize-y rounded-xl border border-border bg-bg-elevated px-3 py-3 text-sm outline-none focus:border-primary" /><button disabled={busy} type="submit" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-black text-white disabled:opacity-60 dark:text-bg-base"><Send size={15} />寄出回覆</button></form></> : <div className="flex min-h-[360px] items-center justify-center text-center text-sm text-text-muted">選擇左側案件查看內容並回覆。</div>}
          </section>
        </div>

        <section className="mt-6 rounded-[28px] border border-border bg-bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><Megaphone size={18} className="text-primary" /><h2 className="text-lg font-black text-text-main">首頁公告</h2></div>
          <form onSubmit={saveAnnouncement} className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 text-sm font-bold text-text-main md:col-span-2"><input type="checkbox" checked={announcement.enabled} onChange={(event) => setAnnouncement({ ...announcement, enabled: event.target.checked })} className="h-4 w-4 accent-[var(--primary)]" />啟用公告</label>
            <label className="space-y-2 text-sm font-bold text-text-main"><span>標籤</span><input value={announcement.eyebrow} onChange={(event) => setAnnouncement({ ...announcement, eyebrow: event.target.value })} className="h-11 w-full rounded-xl border border-border bg-bg-elevated px-3" /></label>
            <label className="space-y-2 text-sm font-bold text-text-main"><span>標題</span><input value={announcement.title} onChange={(event) => setAnnouncement({ ...announcement, title: event.target.value })} className="h-11 w-full rounded-xl border border-border bg-bg-elevated px-3" /></label>
            <label className="space-y-2 text-sm font-bold text-text-main md:col-span-2"><span>內容</span><textarea rows={3} value={announcement.body} onChange={(event) => setAnnouncement({ ...announcement, body: event.target.value })} className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-3" /></label>
            <div className="grid gap-4 sm:grid-cols-2 md:col-span-2"><label className="space-y-2 text-sm font-bold text-text-main"><span>按鈕文字</span><input value={announcement.linkLabel} onChange={(event) => setAnnouncement({ ...announcement, linkLabel: event.target.value })} className="h-11 w-full rounded-xl border border-border bg-bg-elevated px-3" /></label><label className="space-y-2 text-sm font-bold text-text-main"><span>連結</span><input type="url" value={announcement.link} onChange={(event) => setAnnouncement({ ...announcement, link: event.target.value })} className="h-11 w-full rounded-xl border border-border bg-bg-elevated px-3" /></label></div>
            <button disabled={busy} type="submit" className="h-11 rounded-full bg-primary text-sm font-black text-white disabled:opacity-60 md:col-span-2 dark:text-bg-base">儲存首頁公告</button>
          </form>
        </section>
      </div>
    </main>
  );
};
