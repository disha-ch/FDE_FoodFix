import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, LogIn, UserPlus, Sparkles, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

type AuthTab = 'signin' | 'signup' | 'magiclink';

export const LoginPage = () => {
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Constructs a valid redirect URI that perfectly aligns with configured whitelist URLs in Supabase
  const getRedirectUrl = () => {
    const defaultRegisteredUrl = 'https://ai.studio/apps/8afc0d51-d25e-4304-8bd4-0e2a4d01525d';
    try {
      const currentOrigin = window.location.origin;
      // If the current origin matches standard development or preview, we keep it as fallback, 
      // but if we are inside the production frame, we return the explicit registered Google/OTP whitelist target
      if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
        return currentOrigin;
      }
    } catch (e) {
      // Ignored
    }
    return defaultRegisteredUrl;
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Email address is required.' });
      setLoading(false);
      return;
    }

    try {
      if (activeTab === 'signin') {
        if (!password) {
          setMessage({ type: 'error', text: 'Password is required.' });
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Logged in successfully!' });
      } else if (activeTab === 'signup') {
        if (password.length < 6) {
          setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: getRedirectUrl(),
          },
        });
        if (error) throw error;

        // In Supabase, if confirming email is active, users receive an email.
        const confirmationSent = data.user && data.session === null;
        if (confirmationSent) {
          setMessage({
            type: 'success',
            text: 'Sign up successful! Please check your email inbox to verify your account.',
          });
        } else {
          setMessage({ type: 'success', text: 'Account registered and logged in!' });
        }
      } else if (activeTab === 'magiclink') {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: getRedirectUrl(),
          },
        });
        if (error) throw error;
        setMessage({
          type: 'success',
          text: 'Magic login link sent! Check your inbox to sign in instantly.',
        });
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setMessage({ type: 'error', text: err.message || 'An unexpected authentication error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectUrl(),
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('OAuth error:', err);
      setMessage({
        type: 'error',
        text: 'Google login failed: ' + (err.message || 'Verify your Supabase Redirect URIs.'),
      });
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4 py-12">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-orange-500 tracking-tight flex items-center justify-center gap-1">
          Food<span className="text-slate-800 font-extrabold font-sans">Fix</span>
        </h1>
        <p className="text-slate-500 text-sm mt-2 font-medium">Quick, delicious, and powered by Supabase</p>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 p-8">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 mb-6">
          <button
            onClick={() => { setActiveTab('signin'); setMessage(null); }}
            className={`flex-1 pb-3 text-sm font-bold border-b-2 transition ${
              activeTab === 'signin'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('signup'); setMessage(null); }}
            className={`flex-1 pb-3 text-sm font-bold border-b-2 transition ${
              activeTab === 'signup'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Register
          </button>
          <button
            onClick={() => { setActiveTab('magiclink'); setMessage(null); }}
            className={`flex-1 pb-3 text-xs md:text-sm font-bold border-b-2 transition ${
              activeTab === 'magiclink'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Magic Link
          </button>
        </div>

        {/* Feedback Messages */}
        {message && (
          <div
            className={`p-4 rounded-2xl mb-6 text-xs font-semibold leading-relaxed flex gap-2.5 items-start ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                : 'bg-red-50 text-red-800 border border-red-100'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{message.text}</span>
          </div>
        )}

        {/* Auth Inputs Form */}
        <form onSubmit={handleAuthAction} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm transition text-slate-800 placeholder:text-slate-400"
              />
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {activeTab !== 'magiclink' && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm transition text-slate-800 placeholder:text-slate-400"
                />
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 font-bold transition shadow-lg shadow-orange-500/15 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : activeTab === 'signin' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            ) : activeTab === 'signup' ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Send Magic Link</span>
              </>
            )}
          </button>
        </form>

        {/* Separator Divider */}
        <div className="relative my-6 flex items-center">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-400 tracking-widest">or continue with</span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        {/* OAuth Social login */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-bold text-sm transition disabled:opacity-50"
        >
          {/* Custom vector Google Icon */}
          <svg className="w-4 h-4" viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.927h6.6c-.29 1.5-.14 3.01.69 4.08l3.11-2.42c1.8-1.66 3.345-4.2 3.345-7.517z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.11-2.42c-1.12.75-2.58 1.21-4.85 1.21-4.82 0-7.46-3.25-8.15-7.41H.73v2.85C2.71 18.59 7.74 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M3.85 12.47c-.24-.71-.38-1.48-.38-2.27s.14-1.56.38-2.27V5.08H.73C-.06 6.64-.5 8.44-.5 10.2s.44 3.56 1.23 5.12l3.12-2.85z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0 7.74 0 2.71 5.41.73 10.2l3.12 2.85c.69-4.16 3.33-7.41 8.15-7.41z"
            />
          </svg>
          <span className="font-bold">Google Authentication</span>
        </button>
      </div>
    </div>
  );
};

