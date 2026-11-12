// src/app/pages/auth/Signup.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Scissors, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { UserRole } from '../../context/AppContext';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F', bg: '#F5F0E8' };

export default function Signup() {
  const navigate = useNavigate();
  const { userRole } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const role = (userRole || 'customer') as UserRole;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      // FORCE write to Firestore
      await setDoc(doc(db, 'users', userCred.user.uid), {
        uid: userCred.user.uid,
        name,
        email,
        phone,
        role,
        status: role === 'customer' ? 'approved' : 'pending',
        emailVerified: false,
        createdAt: new Date(),
      });
      if (role === 'customer') {
        navigate('/auth/verify-otp', { replace: true });
        return;
      }
      // Vendors wait for admin approval, so don't keep them signed in.
      await signOut(auth);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in instead.');
      } else {
        setError(err.message || 'Signup failed. Please try again.');
      }
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#E8F9F0' }}>
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl mb-2" style={{ color: C.dark, fontFamily: "'Playfair Display', serif" }}>Application Submitted</h2>
          <p className="text-sm text-gray-500">
            Your account is pending admin approval. You can sign in once a SewsEra admin reviews your documents.
          </p>
          <button onClick={() => navigate('/auth/login')} className="mt-5 px-4 py-2.5 rounded-xl text-white text-sm" style={{ background: C.primary }}>
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate('/onboarding')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft size={15} /> Back
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.primary }}>
              <Scissors size={14} className="text-white" />
            </div>
            <span style={{ color: C.dark, fontFamily: "'Playfair Display', serif" }}>SewsEra</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: C.primary + '15' }}>
          <div className="w-2 h-2 rounded-full" style={{ background: C.primary }} />
          <span className="text-xs" style={{ color: C.primary }}>Signing up as {role === 'customer' ? 'Customer' : role === 'tailor' ? 'Tailor' : 'Fabric Seller'}</span>
        </div>

        <h2 className="text-2xl mb-1" style={{ color: C.dark, fontFamily: "'Playfair Display', serif" }}>Create Account</h2>
        <p className="text-sm text-gray-500 mb-7">Join SewsEra and start your journey.</p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1.5">Full Name</label>
            <input
              type="text"
              placeholder="Maria Santos"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none transition-all"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1.5">Email Address</label>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none transition-all"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1.5">Mobile Number</label>
            <div className="flex gap-2">
              <div className="px-3 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-500 flex-shrink-0">+63</div>
              <input
                type="tel"
                placeholder="9XX XXX XXXX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none transition-all"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-xs text-blue-700">
              By signing up, you agree to SewsEra's Terms of Service and Privacy Policy. Your data is protected under the Philippine Data Privacy Act.
            </p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-white text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ background: C.primary }}
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Creating Account...</> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <button onClick={() => navigate('/auth/login')} className="hover:underline" style={{ color: C.primary }}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}