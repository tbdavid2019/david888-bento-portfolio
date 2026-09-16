import { httpsCallable } from 'firebase/functions';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { firebaseDb, firebaseFunctions } from './firebase';

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

const createTicket = httpsCallable<
  Omit<ContactTicket, 'id' | 'ticketNo' | 'status' | 'createdAt' | 'updatedAt'>,
  { ticketNo: string }
>(firebaseFunctions, 'createContactTicket');

const replyToTicket = httpsCallable<{ ticketId: string; body: string }, { ok: true }>(
  firebaseFunctions,
  'replyToContactTicket',
);

export const submitContactTicket = async (input: {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
  turnstileToken?: string;
}): Promise<{ ticketNo: string; provider?: string }> => {
  // 1. Try Resend API first (via Vercel Serverless Function or custom API URL)
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

  // 2. Fallback to Firebase Cloud Function
  const result = await createTicket(input);
  return { ...result.data, provider: 'firebase' };
};

export const sendTicketReply = async (ticketId: string, body: string) =>
  (await replyToTicket({ ticketId, body })).data;

export const listTickets = async () => {
  const snapshot = await getDocs(
    query(collection(firebaseDb, 'tickets'), orderBy('createdAt', 'desc'), limit(100)),
  );
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ContactTicket);
};

export const listTicketReplies = async (ticketId: string) => {
  const snapshot = await getDocs(
    query(collection(firebaseDb, 'tickets', ticketId, 'replies'), orderBy('createdAt', 'asc')),
  );
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as TicketReply);
};

export const loadHomepageAnnouncement = async (): Promise<HomepageAnnouncement | null> => {
  const snapshot = await getDoc(doc(firebaseDb, 'announcements', 'homepage'));
  return snapshot.exists() ? (snapshot.data() as HomepageAnnouncement) : null;
};

export const saveHomepageAnnouncement = async (announcement: HomepageAnnouncement) => {
  await setDoc(
    doc(firebaseDb, 'announcements', 'homepage'),
    { ...announcement, updatedAt: serverTimestamp() },
    { merge: true },
  );
};
