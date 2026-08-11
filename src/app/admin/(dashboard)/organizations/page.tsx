'use client';

import { useState, useEffect } from 'react';
import { Building2, Loader2, Users, Zap } from 'lucide-react';

interface OrgItem {
  id: string;
  name: string;
  slug: string;
  industry: string;
  created_at: string;
  member_count: number;
  workflow_count: number;
  owner_name: string;
  owner_email: string;
}

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<OrgItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      try {
        const res = await fetch('/api/admin/organizations');
        const json = await res.json();

        if (!isCancelled) {
          if (json.success && json.data) {
            setOrgs(json.data);
          } else {
            setError(json.error?.message || 'Failed to load organizations');
          }
          setLoading(false);
        }
      } catch {
        if (!isCancelled) {
          setError('Network connection error');
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-black pb-4">
        <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
          <Building2 className="w-7 h-7" /> PLATFORM ORGANIZATIONS ({orgs.length})
        </h1>
        <p className="text-xs font-bold text-black/60 uppercase tracking-widest mt-1">
          Master roster of all multi-tenant workspaces in Rev AI
        </p>
      </div>

      {error && (
        <div className="border-sharp bg-red-50 p-4 text-xs font-bold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="border-sharp bg-white p-8 text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-black" />
          <span className="text-xs font-bold uppercase">Loading Platform Organizations...</span>
        </div>
      ) : (
        <div className="border-sharp bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-black bg-[#F1F2F3] uppercase text-[10px] font-black tracking-wider">
                  <th className="p-3">Organization Name</th>
                  <th className="p-3">Owner Contact</th>
                  <th className="p-3">Industry</th>
                  <th className="p-3">Members</th>
                  <th className="p-3">Workflows</th>
                  <th className="p-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 font-medium">
                {orgs.map((o) => (
                  <tr key={o.id} className="hover:bg-black/5">
                    <td className="p-3">
                      <div className="font-extrabold uppercase text-black">{o.name}</div>
                      <div className="text-[10px] font-mono text-black/50">{o.slug}</div>
                    </td>
                    <td className="p-3 font-mono">
                      <div className="font-bold text-black">{o.owner_name}</div>
                      <div className="text-black/60">{o.owner_email}</div>
                    </td>
                    <td className="p-3 text-black/80">{o.industry}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 font-bold">
                        <Users className="w-3 h-3" /> {o.member_count}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 font-bold text-[#F4B62A]">
                        <Zap className="w-3 h-3" /> {o.workflow_count}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-black/60">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
