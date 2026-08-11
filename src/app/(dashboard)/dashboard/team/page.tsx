'use client';

import { useState, useEffect } from 'react';
import { Users, UserPlus, ShieldCheck, Mail, Copy, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { OrgRole } from '@/lib/auth/permissions';

interface MemberItem {
  id: string;
  user_id?: string;
  email: string;
  full_name: string;
  role: OrgRole;
  created_at: string;
}

interface InvitationItem {
  id: string;
  email: string;
  role: OrgRole;
  status: string;
  expires_at: string;
  created_at: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [currentRole, setCurrentRole] = useState<OrgRole>('MEMBER');
  const [canInvite, setCanInvite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('MEMBER');
  const [inviting, setInviting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchTeamData();
  }, []);

  async function fetchTeamData() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/team/invitations');
      const json = await res.json();

      if (json.success && json.data) {
        setMembers(json.data.members || []);
        setInvitations(json.data.invitations || []);
        setCurrentRole(json.data.currentRole || 'MEMBER');
        setCanInvite(json.data.canInvite || false);
      } else {
        setError(json.error?.message || 'Failed to load team data');
      }
    } catch {
      setError('Network connection error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setInviting(true);
      setError(null);

      const res = await fetch('/api/team/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        setGeneratedCode(json.data.invitationCode);
        fetchTeamData();
      } else {
        setError(json.error?.message || 'Failed to send invitation');
      }
    } catch {
      setError('Network connection error');
    } finally {
      setInviting(false);
    }
  }

  function handleCopyToken() {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black pb-6">
        <div>
          <div className="inline-flex items-center gap-2 border-sharp bg-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest mb-2">
            <span className="w-2 h-2 rounded-full bg-[#12B76A]" />
            RBAC Authorization
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight">TEAM & SECURITY</h1>
          <p className="text-sm font-medium text-black/70 mt-1">
            Manage organization team members, role-based access, and invitations.
          </p>
        </div>

        {canInvite && (
          <button
            onClick={() => {
              setShowInviteModal(true);
              setGeneratedCode(null);
            }}
            className="btn-pill-primary text-xs uppercase tracking-wider self-start sm:self-center shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Invite Member
          </button>
        )}
      </div>

      {error && (
        <div className="border-sharp bg-red-50 p-4 text-xs font-bold text-red-700">
          {error}
        </div>
      )}

      {/* Role Banner */}
      <div className="border-sharp bg-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[#12B76A]" />
          <div>
            <span className="text-xs font-bold uppercase text-black">Your Current Role: </span>
            <span className="bg-black text-white text-xs font-mono font-extrabold px-2 py-0.5 ml-1">
              {currentRole}
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono text-black/50 uppercase">
          {canInvite ? 'Full Access' : 'Read-Only Access'}
        </span>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="border-sharp bg-white p-8 text-center space-y-3 animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-black" />
          <span className="text-xs font-bold uppercase">Loading Team Roster...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Members Table */}
          <div className="border-sharp bg-white overflow-hidden space-y-4">
            <div className="p-4 border-b border-black flex items-center justify-between">
              <h3 className="font-extrabold text-sm uppercase tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4" /> Active Organization Members ({members.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-black/20 bg-[#F1F2F3] uppercase text-[10px] font-extrabold tracking-wider">
                    <th className="p-3">Member Name</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-black/5 font-medium">
                      <td className="p-3 font-extrabold uppercase">{m.full_name}</td>
                      <td className="p-3 font-mono text-black/80">{m.email}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-black uppercase font-mono ${
                            m.role === 'OWNER'
                              ? 'bg-black text-white'
                              : m.role === 'ADMIN'
                              ? 'bg-[#20C8E8] text-black'
                              : m.role === 'SALES'
                              ? 'bg-[#F4B62A] text-black'
                              : 'bg-slate-200 text-black'
                          }`}
                        >
                          {m.role}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-black/60">
                        {new Date(m.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Invitations Section */}
          {invitations.length > 0 && (
            <div className="border-sharp bg-white p-6 space-y-4">
              <h3 className="font-extrabold text-sm uppercase tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F4B62A]" /> Pending Organization Invitations ({invitations.length})
              </h3>

              <div className="space-y-2">
                {invitations.map((inv) => (
                  <div key={inv.id} className="border-sharp bg-[#F1F2F3] p-3 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-black/60" />
                      <span>{inv.email}</span>
                      <span className="bg-black/10 text-black px-1.5 py-0.5 text-[10px] font-bold">
                        {inv.role}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 font-bold uppercase">
                        {inv.status}
                      </span>
                      <span className="text-[10px] text-black/50">
                        Expires {new Date(inv.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full border-sharp bg-white p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-black pb-3">
              <h3 className="font-extrabold text-sm uppercase">Invite New Team Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-xs font-bold uppercase text-black/50 hover:text-black"
              >
                ✕
              </button>
            </div>

            {generatedCode ? (
              <div className="space-y-4 bg-[#F1F2F3] border-sharp p-4">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#123B2D] uppercase">
                  <CheckCircle2 className="w-4 h-4 text-[#12B76A]" /> Invitation Generated!
                </div>
                <p className="text-xs text-black/70 font-medium">
                  Share this invitation code with <span className="font-bold">{inviteEmail}</span> to join the workspace:
                </p>
                <div className="bg-white border-sharp p-3 flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-black select-all truncate">{generatedCode}</span>
                  <button
                    onClick={handleCopyToken}
                    className="btn-editorial-secondary py-1 px-2 text-[10px] uppercase flex items-center gap-1 shrink-0 ml-2"
                  >
                    <Copy className="w-3 h-3" /> {copied ? 'COPIED' : 'COPY'}
                  </button>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="w-full btn-pill-primary py-2 text-xs uppercase mt-2"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-black">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full p-2.5 text-xs font-semibold bg-[#F1F2F3] border-sharp focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-black">
                    Assign Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as OrgRole)}
                    className="w-full p-2.5 text-xs font-semibold bg-[#F1F2F3] border-sharp focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="MEMBER">MEMBER (Basic workspace access)</option>
                    <option value="SALES">SALES (Leads & conversations access)</option>
                    <option value="ADMIN">ADMIN (Full management access)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 border-t border-black/10 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="btn-editorial-secondary py-2 px-4 text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="btn-pill-primary py-2 px-6 text-xs uppercase"
                  >
                    {inviting ? 'Generating...' : 'Generate Invite Code'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
