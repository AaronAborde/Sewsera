// src/app/otp.ts
import { deleteDoc, doc, getDoc, increment, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

const TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export type OtpResult = 'ok' | 'missing' | 'expired' | 'invalid' | 'locked';

export function generateOtp() {
  return String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
}

async function hashOtp(uid: string, code: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${uid}:${code}`));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function saveOtp(uid: string, code: string) {
  await setDoc(doc(db, 'emailOtps', uid), {
    codeHash: await hashOtp(uid, code),
    expiresAt: Timestamp.fromMillis(Date.now() + TTL_MS),
    attempts: 0,
    createdAt: Timestamp.now(),
  });
}

export async function verifyOtp(uid: string, code: string): Promise<OtpResult> {
  const ref = doc(db, 'emailOtps', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return 'missing';
  const data = snap.data();
  if ((data.attempts || 0) >= MAX_ATTEMPTS) return 'locked';
  if (!data.expiresAt || data.expiresAt.toMillis() < Date.now()) return 'expired';
  if ((await hashOtp(uid, code)) !== data.codeHash) {
    await updateDoc(ref, { attempts: increment(1) });
    return 'invalid';
  }
  await deleteDoc(ref);
  return 'ok';
}
