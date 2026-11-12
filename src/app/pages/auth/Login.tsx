// src/app/pages/auth/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Scissors, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { auth, db, googleProvider } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserRole } from '../../context/AppContext';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F', bg: '#F5F0E8' };

export default function Login() {
  const navigate = useNavigate();
  const { setIsAuthenticated, setUserRole } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper: get role from Firestore or create default customer doc
  const handleRedirect = async (uid: string, email: string | null, displayName?: string | null) => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    let role: UserRole = 'customer';
    let status = 'approved';
    
    if (!userSnap.exists()) {
      // FORCE create a document for Google/email login if missing
      await setDoc(userRef, {
        uid,
        email: email || '',
        name: displayName || '',
        role: 'customer',
        status: 'approved',
        createdAt: new Date(),
      });
    } else {
      const data = userSnap.data();
      role = data.role as UserRole;
      status = data.status || (role === 'tailor' || role === 'seller' ? 'pending' : 'approved');
    }

    // Tailors / sellers only get in after an admin approves their documents.
    if ((role === 'tailor' || role === 'seller') && status !== 'approved') {
      await signOut(auth);
      setError(
        status === 'rejected'
          ? 'Your application was not approved. Please contact SewsEra support.'
          : 'Your account is awaiting admin approval. Please try again once approved.',
      );
      return;
    }
    
    setUserRole(role);
    setIsAuthenticated(true);
    navigate(`/${role}`);
  };

  // Email/Password Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      await handleRedirect(userCred.user.uid, userCred.user.email);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up first.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Try again.');
      } else {
        setError('Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Google Login (FORCES Firestore doc creation if new user)
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await handleRedirect(user.uid, user.email, user.displayName);
    } catch (err: any) {
      console.error(err);
      setError('Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* LEFT PANEL - UNCHANGED */}
      <div className="hidden md:flex w-1/2 flex-col justify-between p-12 text-white" style={{ background: C.dark }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: C.primary }}>
            <Scissors size={18} className="text-white" />
          </div>
          <span className="text-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>SewsEra</span>
        </div>
        <div>
          <blockquote className="text-3xl leading-snug mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            "Where Filipino craftsmanship meets modern convenience."
          </blockquote>
          <p className="text-white/50 text-sm">Join thousands of customers, tailors, and sellers on SewsEra.</p>
        </div>
        <div className="flex gap-4">
          {[
            { n: '500+', l: 'Tailors' },
            { n: '2K+', l: 'Customers' },
            { n: '120+', l: 'Sellers' },
          ].map(s => (
            <div key={s.l} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <p className="text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>{s.n}</p>
              <p className="text-xs text-white/40">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL - UNCHANGED */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12" style={{ background: C.bg }}>
        <div className="md:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.primary }}>
            <Scissors size={16} className="text-white" />
          </div>
          <span className="text-xl" style={{ color: C.dark, fontFamily: "'Playfair Display', serif" }}>SewsEra</span>
        </div>

        <div className="w-full max-w-sm">
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm text-gray-500 mb-6 hover:text-gray-700 transition-colors">
            <ArrowLeft size={15} /> Back
          </button>

          <h2 className="text-2xl mb-1" style={{ color: C.dark, fontFamily: "'Playfair Display', serif" }}>Welcome Back</h2>
          <p className="text-sm text-gray-500 mb-7">Sign in to your SewsEra account.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 block mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': C.primary } as React.CSSProperties}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm text-gray-600">Password</label>
                <a href="#" className="text-xs" style={{ color: C.primary }}>Forgot password?</a>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ background: C.primary }}
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Signing In...</> : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or continue with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl border border-gray-300 bg-white text-gray-700 text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <button onClick={() => navigate('/onboarding')} className="hover:underline" style={{ color: C.primary }}>
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}