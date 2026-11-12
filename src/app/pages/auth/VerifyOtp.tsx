// src/app/pages/auth/VerifyOtp.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useApp } from '../../context/AppContext';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../../components/ui/input-otp';
import { emailConfigured, sendOtpEmail } from '../../email';
import { generateOtp, saveOtp, verifyOtp } from '../../otp';

const C = { primary: '#C4623F', dark: '#1A2B3C', bg: '#F5F0E8' };
const RESEND_SECONDS = 60;

interface Account {
  uid: string;
  email: string;
  name: string;
  role: string;
  status: string;
}

const ERRORS: Record<string, string> = {
  missing: 'No code found. Tap "Resend code".',
  expired: 'That code expired. Tap "Resend code".',
  invalid: 'Incorrect code. Try again.',
  locked: 'Too many attempts. Tap "Resend code".',
};

const maskEmail = (email: string) => {
  const [name, domain] = email.split('@');
  return `${name.slice(0, 1)}***@${domain}`;
};

export default function VerifyOtp() {
  const navigate = useNavigate();
  const { setIsAuthenticated, setUserRole } = useApp();
  const [account, setAccount] = useState<Account | null>(null);
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const current = auth.currentUser;
    if (!current) {
      navigate('/auth/login', { replace: true });
      return;
    }
    getDoc(doc(db, 'users', current.uid))
      .then(snap => {
        const data = snap.data() || {};
        if (data.emailVerified !== false) {
          navigate(`/${data.role || 'customer'}`, { replace: true });
          return;
        }
        setAccount({
          uid: current.uid,
          email: current.email || '',
          name: data.name || '',
          role: data.role || 'customer',
          status: data.status || 'approved',
        });
      })
      .catch(error => {
        console.error('Error loading account:', error);
        setError('Could not load your account. Please sign in again.');
      });
  }, [navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendCode = async (resend: boolean) => {
    if (!account || sending) return;
    setError('');
    setNotice('');
    setSending(true);
    try {
      const otp = generateOtp();
      await saveOtp(account.uid, otp);
      await sendOtpEmail(account.email, account.name, otp);
      setNotice(resend ? 'A new code was sent to your email.' : 'We sent a 6-digit code to your email.');
      setCooldown(RESEND_SECONDS);
    } catch (err: any) {
      setError(err?.message || 'Could not send the code. Please try again.');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (account) sendCode(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    if (code.length !== 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    setError('');
    setVerifying(true);
    try {
      const result = await verifyOtp(account.uid, code);
      if (result !== 'ok') {
        setError(ERRORS[result]);
        setVerifying(false);
        return;
      }
      await updateDoc(doc(db, 'users', account.uid), { emailVerified: true });
      if (account.role === 'customer' || account.status === 'approved') {
        setIsAuthenticated(true);
        setUserRole(account.role as any);
        navigate(`/${account.role}`, { replace: true });
      } else {
        await signOut(auth);
        navigate('/auth/login', { replace: true });
      }
    } catch (err) {
      console.error('Error verifying code:', err);
      setError('Could not verify the code. Please try again.');
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-sm">
        <button onClick={() => navigate('/auth/login')} className="flex items-center gap-1.5 text-sm text-gray-500 mb-8 hover:text-gray-700 transition-colors">
          <ArrowLeft size={15} /> Back to sign in
        </button>

        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: C.primary + '15' }}>
          <MailCheck size={26} style={{ color: C.primary }} />
        </div>

        <h2 className="text-2xl mb-1" style={{ color: C.dark, fontFamily: "'Playfair Display', serif" }}>Verify Your Email</h2>
        <p className="text-sm text-gray-500 mb-7">
          {account ? <>Enter the 6-digit code sent to <span className="text-gray-700">{maskEmail(account.email)}</span>.</> : 'Loading your account…'}
        </p>

        <form onSubmit={submit} className="space-y-5">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            inputMode="numeric"
            pattern="[0-9]*"
            containerClassName="justify-center"
            disabled={!account || verifying}
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map(i => (
                <InputOTPSlot key={i} index={i} className="h-12 w-11 text-lg" />
              ))}
            </InputOTPGroup>
          </InputOTP>

          {notice && <p className="text-xs text-green-600 text-center">{notice}</p>}
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          {!emailConfigured && (
            <p className="text-xs text-amber-600 text-center">
              Email sending is not configured yet. Add the VITE_EMAILJS_* keys to .env.local.
            </p>
          )}

          <button
            type="submit"
            disabled={!account || verifying || code.length !== 6}
            className="w-full py-3.5 rounded-xl text-white text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ background: C.primary }}
          >
            {verifying ? <><Loader2 size={16} className="animate-spin" /> Verifying…</> : 'Verify Code'}
          </button>

          <button
            type="button"
            onClick={() => sendCode(true)}
            disabled={!account || sending || cooldown > 0}
            className="w-full text-sm text-center disabled:text-gray-300 hover:underline"
            style={{ color: cooldown > 0 ? undefined : C.primary }}
          >
            {sending ? 'Sending…' : cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </button>
        </form>
      </div>
    </div>
  );
}
