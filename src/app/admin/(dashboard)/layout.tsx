import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getPlatformAdminSession, ADMIN_COOKIE_NAME } from '@/lib/auth/admin-auth';
import { cookies } from 'next/headers';
import { LayoutDashboard, Building2, Users, Zap, ShieldCheck, FileText, LogOut } from 'lucide-react';

async function adminLogoutAction() {
  'use server';
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  return redirect('/admin/login');
}

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { isAdmin, user } = await getPlatformAdminSession(supabase);

  if (!isAdmin || !user) {
    return redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-swiss-grid text-black flex flex-col font-sans selection:bg-black selection:text-white">
      {/* Platform Admin Master Header */}
      <header className="border-b border-black bg-black text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-black font-black text-xs flex items-center justify-center">
              RA
            </div>
            <div>
              <span className="font-extrabold text-lg uppercase tracking-tight">REV AI</span>
              <span className="ml-2 bg-[#12B76A] text-black text-[10px] font-black px-2 py-0.5 uppercase tracking-widest">
                PLATFORM ADMIN
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[10px] text-white/50 uppercase font-mono">Authenticated Admin</span>
              <span className="text-xs font-mono font-bold text-[#12B76A]">{user.email}</span>
            </div>

            <form action={adminLogoutAction}>
              <button
                type="submit"
                className="bg-white/10 hover:bg-white/20 text-white py-1.5 px-3 text-xs uppercase font-extrabold flex items-center gap-1.5 border border-white/20 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Admin Body Container */}
      <div className="max-w-7xl mx-auto px-6 py-8 w-full flex-1 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Admin Navigation Sidebar */}
        <aside className="md:col-span-3 space-y-6">
          <div className="border-sharp bg-white p-4 space-y-4 shadow-sm">
            <div className="text-[10px] font-black text-black/40 uppercase tracking-widest px-2 border-b border-black pb-2">
              System Control Navigation
            </div>

            <nav className="space-y-1">
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3 py-2.5 text-xs font-extrabold uppercase bg-black text-white hover:bg-[#12B76A] hover:text-black transition-colors border-sharp"
              >
                <LayoutDashboard className="w-4 h-4 text-[#12B76A]" /> System Overview
              </Link>

              <Link
                href="/admin/organizations"
                className="flex items-center gap-3 px-3 py-2.5 text-xs font-extrabold uppercase bg-[#F1F2F3] text-black hover:bg-black hover:text-white transition-colors border-sharp"
              >
                <Building2 className="w-4 h-4" /> Organizations
              </Link>

              <Link
                href="/admin/users"
                className="flex items-center gap-3 px-3 py-2.5 text-xs font-extrabold uppercase bg-[#F1F2F3] text-black hover:bg-black hover:text-white transition-colors border-sharp"
              >
                <Users className="w-4 h-4" /> Platform Users
              </Link>

              <Link
                href="/admin/workflows"
                className="flex items-center gap-3 px-3 py-2.5 text-xs font-extrabold uppercase bg-[#F1F2F3] text-black hover:bg-black hover:text-white transition-colors border-sharp"
              >
                <Zap className="w-4 h-4 text-[#F4B62A]" /> Platform Workflows
              </Link>

              <Link
                href="/admin/audit-logs"
                className="flex items-center gap-3 px-3 py-2.5 text-xs font-extrabold uppercase bg-[#F1F2F3] text-black hover:bg-black hover:text-white transition-colors border-sharp"
              >
                <FileText className="w-4 h-4" /> Audit Logs
              </Link>
            </nav>

            <div className="border-t border-black/10 pt-3 text-[10px] font-mono text-black/50 space-y-1">
              <div>Bypasses Tenant RLS Isolation</div>
              <div className="flex items-center gap-1 font-bold text-[#123B2D]">
                <ShieldCheck className="w-3 h-3 text-[#12B76A]" /> Super Admin Session Active
              </div>
            </div>
          </div>
        </aside>

        {/* Main Control Panel View */}
        <main className="md:col-span-9 space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
