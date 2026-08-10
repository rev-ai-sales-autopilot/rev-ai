<<<<<<< HEAD
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
=======
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert h-5 w-[100px]"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the{" "}
            <code className="rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/[.08]">
              page.tsx
            </code>{" "}
            file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert h-[14px] w-4"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={14}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
>>>>>>> faa4a56 (feat: initialize Day 1 project architecture, documentation, and Next.js foundation)
  );
}
