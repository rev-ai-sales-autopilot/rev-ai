import Link from 'next/link';
import { signUpAction } from '../actions';
import { ArrowRight, KeyRound, Mail, User } from 'lucide-react';

export default function SignUpPage() {
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

          {/* Form */}
          <form action={signUpAction} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="Jane Doe"
                  className="w-full border-sharp bg-[#F1F2F3] px-4 py-3 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-[#12B76A] transition-all font-medium"
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
                  required
                  placeholder="jane@company.com"
                  className="w-full border-sharp bg-[#F1F2F3] px-4 py-3 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-[#12B76A] transition-all font-medium"
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
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  className="w-full border-sharp bg-[#F1F2F3] px-4 py-3 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-[#12B76A] transition-all font-medium"
                />
                <KeyRound className="absolute right-3 top-3.5 w-4 h-4 text-black/40" />
              </div>
            </div>

            <button type="submit" className="btn-pill-primary w-full justify-center py-3.5 text-sm uppercase tracking-wider mt-2">
              Create SaaS Account <ArrowRight className="w-4 h-4" />
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
