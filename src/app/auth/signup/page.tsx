'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { ArrowRight, KeyRound, Mail, User, AlertCircle, Loader2 } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setErrorMessage('All fields are required.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    if (!isSupabaseConfigured()) {
      setErrorMessage(
        'Supabase is not configured yet. Please update NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local with your Supabase credentials.'
      );
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        try {
          await supabase.from('users').upsert({
            auth_id: data.user.id,
            email,
            full_name: fullName,
          });
        } catch {
          // Fallback
        }

        router.push('/onboarding');
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('fetch') || msg.includes('placeholder')) {
        setErrorMessage(
          'Unable to register right now. Please verify your Supabase environment variables in .env.local.'
        );
      } else {
        setErrorMessage('An unexpected registration error occurred. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-swiss-grid flex items-center justify-center p-6 selection:bg-[#12B76A]">
      <div className="w-full max-w-md relative">
        {/* Background Geometric Accent Block */}
        <div className="absolute -top-6 -right-6 w-full h-full bg-block-cyan -z-10 transform rotate-1 pointer-events-none" />

        <div className="border-sharp bg-white p-8 md:p-10 shadow-2xl">
          {/* Header */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
              <div className="w-7 h-7 bg-black text-white text-xs font-black flex items-center justify-center group-hover:bg-[#12B76A] group-hover:text-black transition-colors">
                RA
              </div>
              <span className="font-extrabold text-sm uppercase tracking-wider">REV AI</span>
            </Link>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black">
              Create Account
            </h1>
            <p className="text-xs font-semibold text-black/60 uppercase tracking-widest mt-1">
              Start building your autonomous AI sales pipeline
            </p>
          </div>

          {/* Error Feedback Display */}
          {errorMessage && (
            <div className="mb-6 p-4 border-sharp bg-red-50 text-red-700 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span className="text-xs font-bold uppercase tracking-wider leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignUp} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Jane Doe"
                  className="w-full border-sharp bg-[#F1F2F3] px-4 py-3 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-[#12B76A] transition-all font-medium disabled:opacity-60"
                />
                <User className="absolute right-3 top-3.5 w-4 h-4 text-black/40" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                Work Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="jane@company.com"
                  className="w-full border-sharp bg-[#F1F2F3] px-4 py-3 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-[#12B76A] transition-all font-medium disabled:opacity-60"
                />
                <Mail className="absolute right-3 top-3.5 w-4 h-4 text-black/40" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                  placeholder="Minimum 8 characters"
                  className="w-full border-sharp bg-[#F1F2F3] px-4 py-3 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-[#12B76A] transition-all font-medium disabled:opacity-60"
                />
                <KeyRound className="absolute right-3 top-3.5 w-4 h-4 text-black/40" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-pill-primary w-full justify-center py-3.5 text-sm uppercase tracking-wider mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating Account...
                </>
              ) : (
                <>
                  Create SaaS Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-8 pt-6 border-t border-black/10 flex items-center justify-between text-xs">
            <span className="text-black/60 font-medium">Already registered?</span>
            <Link href="/auth/login" className="font-bold text-black uppercase tracking-wider hover:text-[#12B76A] underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
