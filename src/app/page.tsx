import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center bg-slate-950 text-slate-100">
      <div className="max-w-3xl space-y-6">
        <div className="inline-flex items-center rounded-full bg-blue-500/10 px-4 py-1.5 text-sm font-semibold text-blue-400 border border-blue-500/20">
          Rev AI — SaaS Foundation (Phase 1)
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Your AI-Powered Sales & Automation Team
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          An event-driven multi-tenant SaaS that automates lead capture, AI scoring, personalized follow-ups, and calendar booking.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left min-w-[200px]">
            <h3 className="font-bold text-slate-200">Multi-Tenant SaaS</h3>
            <p className="text-xs text-slate-400 mt-1">Supabase Auth & RLS isolated workspaces</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left min-w-[200px]">
            <h3 className="font-bold text-slate-200">AI Agents</h3>
            <p className="text-xs text-slate-400 mt-1">Lead intelligence, dialog & analyst agents</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left min-w-[200px]">
            <h3 className="font-bold text-slate-200">n8n Automation</h3>
            <p className="text-xs text-slate-400 mt-1">Event triggers & webhook execution</p>
          </div>
        </div>
        <div className="pt-6">
          <Link
            href="/docs/architecture"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow hover:bg-blue-500 transition-colors"
          >
            Explore System Architecture
          </Link>
        </div>
      </div>
    </main>
  );
}
