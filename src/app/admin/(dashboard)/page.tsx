'use client';

import { useState, useEffect } from 'react';
import { Building2, Users, Zap, Play, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';

interface StatsData {
  totalOrganizations: number;
  totalUsers: number;
  totalWorkflows: number;
  totalWorkflowRuns: number;
  totalPlatformAdmins: number;
  systemStatus: string;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchStats() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/stats');
      const json = await res.json();

      if (json.success && json.data) {
        setStats(json.data);
      } else {
        setError(json.error?.message || 'Failed to load system stats');
      }
    } catch {
      setError('Network connection error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isCancelled = false;

    async function loadStats() {
      try {
        const res = await fetch('/api/admin/stats');
        const json = await res.json();

        if (!isCancelled) {
          if (json.success && json.data) {
            setStats(json.data);
          } else {
            setError(json.error?.message || 'Failed to load system stats');
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

    loadStats();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="border-sharp bg-black text-white p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#12B76A] text-black text-[10px] font-black px-2.5 py-1 uppercase tracking-widest mb-3">
              <ShieldAlert className="w-3.5 h-3.5" /> MASTER SYSTEM OVERVIEW
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight">
              REV AI CONTROL PANEL
            </h1>
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-1">
              Cross-Tenant Platform Architecture Metrics & Audit Log System
            </p>
          </div>

          <button
            onClick={fetchStats}
            className="bg-white text-black font-extrabold text-xs px-4 py-2 uppercase border-sharp hover:bg-[#12B76A] transition-colors flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Metrics
          </button>
        </div>
      </div>

      {error && (
        <div className="border-sharp bg-red-50 p-4 text-xs font-bold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="border-sharp bg-white p-8 text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-black" />
          <span className="text-xs font-bold uppercase">Loading Platform Metrics...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Real Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border-sharp bg-white p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-black/60">Organizations</span>
                <Building2 className="w-4 h-4 text-black" />
              </div>
              <div className="mt-4">
                <span className="text-4xl font-black tracking-tight">{stats?.totalOrganizations}</span>
                <p className="text-[10px] font-bold text-black/50 uppercase mt-1">Active Multi-Tenant Workspaces</p>
              </div>
            </div>

            <div className="border-sharp bg-white p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-black/60">Total Users</span>
                <Users className="w-4 h-4 text-[#12B76A]" />
              </div>
              <div className="mt-4">
                <span className="text-4xl font-black tracking-tight text-[#12B76A]">{stats?.totalUsers}</span>
                <p className="text-[10px] font-bold text-black/50 uppercase mt-1">Platform Accounts</p>
              </div>
            </div>

            <div className="border-sharp bg-white p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-black/60">Active Workflows</span>
                <Zap className="w-4 h-4 text-[#F4B62A]" />
              </div>
              <div className="mt-4">
                <span className="text-4xl font-black tracking-tight">{stats?.totalWorkflows}</span>
                <p className="text-[10px] font-bold text-black/50 uppercase mt-1">Automation Pipelines</p>
              </div>
            </div>

            <div className="border-sharp bg-white p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-black/60">Workflow Runs</span>
                <Play className="w-4 h-4 text-[#20C8E8]" />
              </div>
              <div className="mt-4">
                <span className="text-4xl font-black tracking-tight">{stats?.totalWorkflowRuns}</span>
                <p className="text-[10px] font-bold text-black/50 uppercase mt-1">Total Executed Runs</p>
              </div>
            </div>
          </div>

          {/* System Operations Status */}
          <div className="border-sharp bg-white p-6 space-y-4">
            <h3 className="font-extrabold text-sm uppercase tracking-tight border-b border-black pb-3">
              Platform Architecture Status
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-sharp bg-[#F1F2F3] p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-xs uppercase">Platform Authorization Layer</h4>
                  <p className="text-[11px] text-black/60">Independent of organization_members</p>
                </div>
                <span className="bg-[#12B76A] text-black text-[10px] font-extrabold px-2 py-0.5 uppercase">
                  Active
                </span>
              </div>

              <div className="border-sharp bg-[#F1F2F3] p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-xs uppercase">Tenant RLS Security</h4>
                  <p className="text-[11px] text-black/60">PostgreSQL Row-Level Security</p>
                </div>
                <span className="bg-[#12B76A] text-black text-[10px] font-extrabold px-2 py-0.5 uppercase">
                  Enforced
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
