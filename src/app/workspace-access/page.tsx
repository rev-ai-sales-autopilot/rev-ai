'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { logoutAction } from '../auth/actions';
import { ShieldAlert, ArrowRight, LogOut, PlusCircle, KeyRound, Send, CheckCircle2 } from 'lucide-react';

export default function WorkspaceAccessPage() {
  const router = useRouter();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleAcceptInvitation(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    try {
      setAccepting(true);
      setError(null);
      const res = await fetch('/api/team/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteCode.trim() }),
      });

      const json = await res.json();

      if (json.success) {
        setSuccess('Invitation accepted! Redirecting to workspace...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setError(json.error?.message || 'Invalid or expired invitation token.');
        setAccepting(false);
      }
    } catch {
      setError('Network connection error.');
      setAccepting(false);
    }
  }

  function handleRequestAccess(e: React.FormEvent) {
    e.preventDefault();
    setRequestSent(true);
    setTimeout(() => {
      setShowRequestModal(false);
      setRequestSent(false);
    }, 2500);
  }

  return (
    <div className="min-h-screen bg-swiss-grid text-black flex flex-col justify-between selection:bg-[#12B76A]">
      {/* Header */}
      <header className="border-b border-black bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black text-white font-black text-xs flex items-center justify-center">
              RA
            </div>
            <span className="font-extrabold text-lg uppercase tracking-tight">REV AI</span>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="btn-editorial-secondary py-1.5 px-3 text-xs uppercase flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Main Access Card Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full border-sharp bg-white p-8 space-y-6 text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-[#F4B62A]" />

          <div className="w-12 h-12 bg-black text-white flex items-center justify-center mx-auto font-bold">
            <ShieldAlert className="w-6 h-6 text-[#F4B62A]" />
          </div>

          <div className="space-y-2">
            <div className="inline-block bg-[#F4B62A]/20 border border-[#F4B62A] text-black text-[10px] font-extrabold px-2.5 py-0.5 uppercase tracking-widest">
              Access Restricted
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-black">
              WORKSPACE ACCESS REQUIRED
            </h1>
            <p className="text-xs font-medium text-black/70 leading-relaxed">
              Your account is not currently connected to a Rev AI workspace. To continue, ask your organization owner or administrator to invite you.
            </p>
          </div>

          {error && (
            <div className="border-sharp bg-red-50 p-3 text-xs font-bold text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="border-sharp bg-[#12B76A]/20 border-[#12B76A] p-3 text-xs font-bold text-[#123B2D] flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#12B76A]" /> {success}
            </div>
          )}

          {/* Action Buttons Stack */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => setShowInviteModal(true)}
              className="w-full btn-pill-primary py-3 px-6 text-xs uppercase flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" /> ACCEPT INVITATION
            </button>

            <button
              onClick={() => setShowRequestModal(true)}
              className="w-full btn-editorial-secondary py-3 px-6 text-xs uppercase flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> REQUEST ACCESS
            </button>

            <Link
              href="/onboarding"
              className="w-full btn-editorial-secondary py-3 px-6 text-xs uppercase flex items-center justify-center gap-2 border-black/40 text-black/80 hover:border-black hover:text-black"
            >
              <PlusCircle className="w-4 h-4" /> CREATE NEW WORKSPACE <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="border-t border-black/10 pt-4 flex justify-center">
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-[11px] font-bold text-black/50 hover:text-black uppercase tracking-wider flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" /> Sign Out
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Accept Invitation Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-sm w-full border-sharp bg-white p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-black pb-3">
              <h3 className="font-extrabold text-sm uppercase">Enter Invitation Token</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-xs font-bold uppercase text-black/50 hover:text-black"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAcceptInvitation} className="space-y-4">
              <input
                type="text"
                required
                placeholder="Paste invitation code / token..."
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full p-3 text-xs font-mono font-semibold bg-[#F1F2F3] border-sharp focus:outline-none focus:ring-2 focus:ring-black"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="btn-editorial-secondary py-1.5 px-3 text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={accepting}
                  className="btn-pill-primary py-1.5 px-4 text-xs uppercase"
                >
                  {accepting ? 'Verifying...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Access Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-sm w-full border-sharp bg-white p-6 space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-black pb-3">
              <h3 className="font-extrabold text-sm uppercase">Request Workspace Access</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-xs font-bold uppercase text-black/50 hover:text-black"
              >
                ✕
              </button>
            </div>

            {requestSent ? (
              <div className="py-4 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#12B76A] mx-auto" />
                <p className="text-xs font-bold uppercase">Request Notification Sent</p>
                <p className="text-[11px] text-black/60">An administrator will be notified of your access request.</p>
              </div>
            ) : (
              <form onSubmit={handleRequestAccess} className="space-y-4 text-left">
                <p className="text-xs text-black/70 font-medium">
                  Send an access request notification to organization administrators.
                </p>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="btn-editorial-secondary py-1.5 px-3 text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-pill-primary py-1.5 px-4 text-xs uppercase"
                  >
                    Send Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-black bg-white py-4 px-6 text-center text-xs text-black/60 font-medium">
        Rev AI Multi-Tenant SaaS Workspace Authorization Model.
      </footer>
    </div>
  );
}
