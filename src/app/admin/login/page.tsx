'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, KeyRound, ArrowRight, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password || !accessCode.trim()) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          accessCode: accessCode.trim(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const json = await res.json();

      if (json.success) {
        // Keep loading while redirecting
        router.push(json.redirectUrl || '/admin');
        return; // loading stays true intentionally during navigation
      } else {
        setError(json.error?.message || 'INVALID ADMIN CREDENTIALS');
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const name = err instanceof Error ? err.name : '';
      if (name === 'AbortError') {
        setError('ADMIN AUTHENTICATION TIMED OUT. Please try again.');
      } else {
        setError('ADMIN AUTHENTICATION SERVICE UNAVAILABLE. Check your network connection.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-swiss-grid text-black flex flex-col justify-between selection:bg-black selection:text-white">
      {/* Header */}
      <header className="border-b border-black bg-black text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-black font-black text-xs flex items-center justify-center">
              RA
            </div>
            <div>
              <span className="font-extrabold text-lg uppercase tracking-tight">REV AI</span>
              <span className="ml-2 bg-[#12B76A] text-black text-[10px] font-black px-2 py-0.5 uppercase tracking-widest">
                SUPER ADMIN
              </span>
            </div>
          </div>
          <Link
            href="/auth/login"
            className="text-xs font-mono text-white/80 hover:text-[#12B76A] font-bold uppercase flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> User Sign In
          </Link>
        </div>
      </header>

      {/* Main Admin Login Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full border-sharp bg-white p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-black" />

          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-black text-white text-[10px] font-black px-3 py-1 uppercase tracking-widest mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#12B76A]" /> INTERNAL SYSTEM ACCESS
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black">
              PLATFORM ADMIN LOGIN
            </h1>
            <p className="text-xs font-bold text-black/60 uppercase tracking-widest">
              REV AI MASTER CONTROL PANEL AUTHENTICATION
            </p>
          </div>

          {error && (
            <div className="border-sharp bg-red-50 p-3 text-xs font-bold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-black">
                Administrator Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="admin@revai.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 text-xs font-semibold bg-[#F1F2F3] border-sharp focus:outline-none focus:ring-2 focus:ring-black"
                />
                <Mail className="absolute right-3 top-3.5 w-4 h-4 text-black/40" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-black">
                Administrator Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 text-xs font-semibold bg-[#F1F2F3] border-sharp focus:outline-none focus:ring-2 focus:ring-black"
                />
                <Lock className="absolute right-3 top-3.5 w-4 h-4 text-black/40" />
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-black/10">
              <label className="block text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#12B76A]" /> Admin Access Code <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="Enter Admin Access Code (e.g. rev9422)"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full p-3 text-xs font-mono font-bold bg-[#F1F2F3] border-sharp focus:outline-none focus:ring-2 focus:ring-black"
              />
              <p className="text-[10px] text-black/50 font-medium">
                Internal system authorization credential.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-pill-primary w-full justify-center py-3.5 text-xs uppercase tracking-wider mt-4 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Authenticating Admin...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  AUTHENTICATE & ENTER CONTROL PANEL <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          {/* Return to Normal User Login */}
          <div className="pt-4 border-t border-black/10 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-xs font-extrabold uppercase text-black/70 hover:text-black tracking-wider transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to User Sign In
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-black bg-white py-4 px-6 text-center text-xs text-black/60 font-medium">
        Rev AI Master Platform Control System • Confidential Internal Interface
      </footer>
    </div>
  );
}
