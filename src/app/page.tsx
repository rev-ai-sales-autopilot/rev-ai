import Link from 'next/link';
import { ArrowRight, Bot, Zap, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-swiss-grid text-black flex flex-col justify-between selection:bg-[#12B76A] selection:text-black">
      {/* Navigation Bar */}
      <header className="border-b border-black bg-white/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-black flex items-center justify-center font-black text-white text-xs tracking-tighter group-hover:bg-[#12B76A] group-hover:text-black transition-colors">
              RA
            </div>
            <span className="font-extrabold text-xl tracking-tight uppercase">Rev AI</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wide uppercase">
            <Link href="#features" className="hover:text-[#12B76A] transition-colors">Capabilities</Link>
            <Link href="#architecture" className="hover:text-[#12B76A] transition-colors">Architecture</Link>
            <Link href="#stats" className="hover:text-[#12B76A] transition-colors">Impact</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-bold uppercase tracking-wider px-4 py-2 hover:text-[#12B76A] transition-colors">
              Login
            </Link>
            <Link href="/auth/signup" className="btn-pill-primary text-xs uppercase tracking-wider">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1">
        <section className="relative pt-16 pb-24 px-6 max-w-7xl mx-auto overflow-hidden">
          {/* Geometric Background Accent Blocks */}
          <div className="absolute top-12 left-10 w-72 h-32 bg-block-green opacity-90 -z-10 transform -rotate-1 pointer-events-none" />
          <div className="absolute top-48 right-16 w-80 h-28 bg-block-cyan opacity-80 -z-10 pointer-events-none" />
          <div className="absolute bottom-20 left-1/3 w-64 h-24 bg-block-pink opacity-70 -z-10 pointer-events-none" />

          <div className="flex flex-col items-start gap-6">
            <div className="inline-flex items-center gap-2 border-sharp bg-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-[#12B76A] animate-pulse" />
              Your AI-Powered Sales & Automation Team
            </div>

            {/* Oversized Headline */}
            <div className="relative my-4">
              <h1 className="text-hero-display">
                REV AI
              </h1>
              <div className="text-hero-display text-[#123B2D] -mt-2 md:-mt-6">
                SALES AUTOPILOT
              </div>
            </div>

            {/* Subtitle & Value Proposition */}
            <p className="max-w-2xl text-xl font-medium leading-relaxed text-black/90">
              An event-driven, multi-tenant B2B SaaS platform that automatically captures, qualifies, nurtures, and schedules meetings with prospects using specialized AI agents.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link href="/auth/signup" className="btn-pill-primary text-sm py-4 px-8">
                Start Automating Now <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/auth/login" className="btn-editorial-secondary text-sm py-4 px-8">
                Enter Dashboard
              </Link>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section id="stats" className="border-y border-black bg-white">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black">
            <div className="p-10 flex flex-col gap-2">
              <span className="text-6xl font-black tracking-tighter">10x</span>
              <span className="text-xs font-bold tracking-widest uppercase text-black/70">Faster Lead Response</span>
            </div>
            <div className="p-10 flex flex-col gap-2">
              <span className="text-6xl font-black tracking-tighter">24/7</span>
              <span className="text-xs font-bold tracking-widest uppercase text-black/70">Autonomous AI Coverage</span>
            </div>
            <div className="p-10 flex flex-col gap-2">
              <span className="text-6xl font-black tracking-tighter">100%</span>
              <span className="text-xs font-bold tracking-widest uppercase text-black/70">Multi-Tenant Isolated</span>
            </div>
          </div>
        </section>

        {/* Dark Green Storytelling Narrative Block */}
        <section className="bg-dark-green-grid text-white py-28 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col gap-6">
              <div className="inline-block bg-[#12B76A] text-black font-extrabold text-xs px-3 py-1 uppercase tracking-widest w-fit">
                AI + AUTOMATION ENGINE
              </div>
              <h2 className="text-section-display leading-none text-white">
                YOUR SALES PIPELINE IS ALWAYS MOVING.
              </h2>
              <p className="text-lg text-white/80 leading-relaxed font-normal">
                Grounded in your business-specific knowledge base, Rev AI automatically qualifies inbound prospects, calculates intent heat scores, triggers n8n workflow automations, and schedules demo meetings.
              </p>
              <div className="pt-4 flex flex-col gap-4">
                <div className="flex items-start gap-4 p-4 border-sharp-dark bg-white/5">
                  <Bot className="w-6 h-6 text-[#12B76A] shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-white uppercase text-sm">Lead Intelligence Agent</h4>
                    <p className="text-xs text-white/70">Parses raw submissions, extracts intent, and computes lead heat levels (COLD, WARM, HOT).</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 border-sharp-dark bg-white/5">
                  <Zap className="w-6 h-6 text-[#20C8E8] shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-white uppercase text-sm">Event-Driven Automation</h4>
                    <p className="text-xs text-white/70">Pub/Sub architecture dispatching LEAD_CREATED and LEAD_BECAME_HOT triggers straight to n8n webhooks.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 border-sharp-dark bg-white/5">
                  <Shield className="w-6 h-6 text-[#F5A7D7] shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-white uppercase text-sm">Enforced RLS Security</h4>
                    <p className="text-xs text-white/70">Database-level Row-Level Security ensuring strict organization data boundary isolation.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Geometric Chart Container */}
            <div className="border-sharp-dark bg-black p-8 relative overflow-hidden flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-white/20 pb-4">
                <span className="font-mono text-xs text-[#12B76A] tracking-wider uppercase">● LIVE PIPELINE FEED</span>
                <span className="font-mono text-xs text-white/50">TENANT_ID: Isolated</span>
              </div>
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-white/10 border-l-4 border-[#12B76A] flex justify-between items-center">
                  <span>[EVENT] LEAD_CREATED</span>
                  <span className="text-[#12B76A]">Score: 92 (HOT)</span>
                </div>
                <div className="p-3 bg-white/10 border-l-4 border-[#20C8E8] flex justify-between items-center">
                  <span>[AI AGENT] Analyzed Requirement</span>
                  <span className="text-[#20C8E8]">Intent: Enterprise</span>
                </div>
                <div className="p-3 bg-white/10 border-l-4 border-[#F4B62A] flex justify-between items-center">
                  <span>[AUTOMATION] n8n Webhook Fired</span>
                  <span className="text-[#F4B62A]">Status: 200 OK</span>
                </div>
              </div>
              <div className="h-28 bg-[#123B2D] border-sharp-dark flex items-end p-4 gap-2">
                <div className="w-1/6 bg-[#12B76A] h-1/3" />
                <div className="w-1/6 bg-[#12B76A] h-1/2" />
                <div className="w-1/6 bg-[#20C8E8] h-3/4" />
                <div className="w-1/6 bg-[#F5A7D7] h-2/3" />
                <div className="w-1/6 bg-[#F4B62A] h-5/6" />
                <div className="w-1/6 bg-[#12B76A] h-full" />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-black bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-black text-white text-xs font-black flex items-center justify-center">RA</div>
            <span className="font-extrabold text-sm uppercase tracking-tight">REV AI — AI SALES AUTOPILOT</span>
          </div>
          <p className="text-xs text-black/60 font-medium">
            © 2026 Rev AI. Multi-Tenant Enterprise Sales Automation SaaS.
          </p>
        </div>
      </footer>
    </div>
  );
}
