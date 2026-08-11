'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, GitFork, ArrowRight, Play, Pause, FileText } from 'lucide-react';

interface WorkflowItem {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED';
  nodes_count: number;
  trigger_name: string;
  execution_count: number;
  last_run_at?: string | null;
  updated_at: string;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DRAFT' | 'PAUSED'>('ALL');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  async function fetchWorkflows() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/workflows');
      const json = await res.json();

      if (json.success) {
        setWorkflows(json.data || []);
      } else {
        setError(json.error?.message || 'Failed to load workflows');
      }
    } catch {
      setError('Network connection error');
    } finally {
      setLoading(false);
    }
  }

  const filteredWorkflows = workflows.filter((wf) => {
    const matchesSearch =
      wf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (wf.description && wf.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || wf.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black pb-6">
        <div>
          <div className="inline-flex items-center gap-2 border-sharp bg-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest mb-2">
            <span className="w-2 h-2 rounded-full bg-[#12B76A]" />
            Workflow Engine
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">WORKFLOWS</h1>
          <p className="text-sm font-medium text-black/70 mt-1">
            Automate repetitive business processes with AI-powered workflows.
          </p>
        </div>

        <Link
          href="/dashboard/workflows/new"
          className="btn-pill-primary text-xs uppercase tracking-wider self-start sm:self-center shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Workflow
        </Link>
      </div>

      {/* Error Alert Box */}
      {error && (
        <div className="border-sharp bg-red-50 p-4 text-xs font-bold text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchWorkflows} className="underline uppercase text-[10px]">
            Retry
          </button>
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-white border-sharp focus:outline-none focus:ring-2 focus:ring-black placeholder:text-black/40"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 border-sharp bg-white p-1 text-xs font-bold uppercase overflow-x-auto">
          {(['ALL', 'ACTIVE', 'DRAFT', 'PAUSED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 text-[11px] transition-colors ${
                statusFilter === status
                  ? 'bg-black text-white'
                  : 'text-black/70 hover:text-black hover:bg-black/5'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="border-sharp bg-white p-6 space-y-4 animate-pulse">
              <div className="h-4 bg-black/10 w-1/2" />
              <div className="h-3 bg-black/10 w-3/4" />
              <div className="h-8 bg-black/5 w-full" />
            </div>
          ))}
        </div>
      ) : filteredWorkflows.length === 0 ? (
        /* Empty State */
        <div className="border-sharp bg-white p-12 text-center flex flex-col items-center gap-4 my-8">
          <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-bold">
            <GitFork className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold uppercase tracking-tight">NO WORKFLOWS YET</h3>
          <p className="text-xs text-black/60 max-w-md">
            Create your first automated workflow to turn inbound triggers into autonomous AI operations and actions.
          </p>
          <Link href="/dashboard/workflows/new" className="btn-pill-primary text-xs uppercase tracking-wider mt-2">
            <Plus className="w-4 h-4" /> Create Workflow
          </Link>
        </div>
      ) : (
        /* Workflow Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredWorkflows.map((wf) => (
            <div
              key={wf.id}
              className="border-sharp bg-white p-6 flex flex-col justify-between gap-6 hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                {/* Status Badge & Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {wf.status === 'ACTIVE' && (
                      <span className="inline-flex items-center gap-1 bg-[#12B76A]/20 text-[#123B2D] border border-[#12B76A] px-2 py-0.5 text-[10px] font-extrabold uppercase">
                        <Play className="w-2.5 h-2.5 fill-current" /> Active
                      </span>
                    )}
                    {wf.status === 'DRAFT' && (
                      <span className="inline-flex items-center gap-1 bg-black/10 text-black border border-black/30 px-2 py-0.5 text-[10px] font-extrabold uppercase">
                        <FileText className="w-2.5 h-2.5" /> Draft
                      </span>
                    )}
                    {wf.status === 'PAUSED' && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-400 px-2 py-0.5 text-[10px] font-extrabold uppercase">
                        <Pause className="w-2.5 h-2.5" /> Paused
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-black/50">
                    Updated {new Date(wf.updated_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="font-extrabold text-base uppercase tracking-tight text-black">
                    {wf.name}
                  </h3>
                  <p className="text-xs text-black/70 line-clamp-2 mt-1 font-medium">
                    {wf.description || 'No description provided.'}
                  </p>
                </div>

                {/* Workflow Node Chain Preview */}
                <div className="bg-[#F1F2F3] border-sharp p-3 font-mono text-[11px] flex items-center gap-2 flex-wrap text-black/80">
                  <span className="font-bold text-black">{wf.trigger_name}</span>
                  <ArrowRight className="w-3 h-3 text-black/40" />
                  <span className="bg-black/10 px-1.5 py-0.5 text-black">
                    {wf.nodes_count > 1 ? `${wf.nodes_count - 1} Nodes` : 'No Nodes Added'}
                  </span>
                </div>
              </div>

              {/* Card Footer: Executions & Open Button */}
              <div className="flex items-center justify-between border-t border-black/10 pt-4 text-xs">
                <div className="font-mono text-[11px] text-black/60">
                  {wf.execution_count === 0 ? (
                    <span>0 executions</span>
                  ) : (
                    <span className="font-bold text-black">{wf.execution_count} executions</span>
                  )}
                </div>

                <Link
                  href={`/dashboard/workflows/${wf.id}`}
                  className="btn-editorial-secondary py-1.5 px-4 text-xs uppercase font-bold flex items-center gap-1"
                >
                  OPEN <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
