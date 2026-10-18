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

export const submitContactTicket = async (input: {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
  turnstileToken?: string;
}): Promise<{ ticketNo: string; provider?: string }> => {
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
      if (data?.ticketNo) {
        return { ticketNo: data.ticketNo, provider: data.provider || 'resend' };
      }
    } else {
      console.warn(`[CRM] Resend API endpoint returned status ${response.status}, falling back to Firebase.`);
    }
  } catch (resendError) {
    console.warn('[CRM] Resend API endpoint unreachable or failed, falling back to Firebase:', resendError);
  }

  // 2. Fallback to Firebase Cloud Function (loaded on demand)
  const [{ httpsCallable }, { firebaseFunctions }] = await Promise.all([
    import('firebase/functions'),
    import('./firebase'),
  ]);
  const createTicket = httpsCallable<
    Omit<ContactTicket, 'id' | 'ticketNo' | 'status' | 'createdAt' | 'updatedAt'>,
    { ticketNo: string }
  >(firebaseFunctions, 'createContactTicket');
  const result = await createTicket(input);
  return { ...result.data, provider: 'firebase' };
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
