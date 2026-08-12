'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Flame,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Database,
  RefreshCw,
} from 'lucide-react';
import { LeadRecord, LeadStatus, LeadPriority, LeadAIClassification } from '@/types/lead';
import CreateLeadModal from '@/components/leads/create-lead-modal';
import LeadDetailsModal from '@/components/leads/lead-details-modal';
import EditLeadModal from '@/components/leads/edit-lead-modal';
import DeleteLeadDialog from '@/components/leads/delete-lead-dialog';

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 25;

  // Filter & Search & Sort states
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [classificationFilter, setClassificationFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedLeadForDetails, setSelectedLeadForDetails] = useState<LeadRecord | null>(null);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<LeadRecord | null>(null);
  const [selectedLeadForDelete, setSelectedLeadForDelete] = useState<LeadRecord | null>(null);

  // Seeding state
  const [seeding, setSeeding] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Refresh trigger — increment to force re-fetch from event handlers
  const [refreshKey, setRefreshKey] = useState(0);

  function fetchLeads() {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadLeads() {
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          search: debouncedSearch,
          status: statusFilter,
          priority: priorityFilter,
          classification: classificationFilter,
          sortBy,
          sortOrder,
        });

        const res = await fetch(`/api/leads?${params.toString()}`);
        const data = await res.json();

        if (!isMounted) return;

        if (!res.ok || !data.success) {
          throw new Error(data.error?.message || 'Failed to fetch leads');
        }

        setLeads(data.leads || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.totalCount || 0);
        setError(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error loading leads';
        if (isMounted) setError(msg);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadLeads();

    return () => {
      isMounted = false;
    };
  }, [refreshKey, page, debouncedSearch, statusFilter, priorityFilter, classificationFilter, sortBy, sortOrder]);

  // Seed sample leads function for dev workspace
  async function handleSeedLeads() {
    setSeeding(true);
    try {
      const res = await fetch('/api/leads/seed', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Seed failed');
      }
      fetchLeads();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Seed failed');
    } finally {
      setSeeding(false);
    }
  }

  // Helper formatting badges
  function getStatusBadge(status: LeadStatus) {
    switch (status) {
      case 'NEW':
        return <span className="bg-[#20C8E8] text-black font-extrabold text-[10px] px-2 py-0.5 uppercase">NEW</span>;
      case 'CONTACTED':
        return <span className="bg-[#F4B62A] text-black font-extrabold text-[10px] px-2 py-0.5 uppercase">CONTACTED</span>;
      case 'QUALIFIED':
        return <span className="bg-[#12B76A] text-black font-extrabold text-[10px] px-2 py-0.5 uppercase">QUALIFIED</span>;
      case 'PROPOSAL':
        return <span className="bg-black text-white font-extrabold text-[10px] px-2 py-0.5 uppercase">PROPOSAL</span>;
      case 'WON':
        return <span className="bg-[#12B76A] text-black font-black text-[10px] px-2.5 py-0.5 uppercase border-sharp">WON</span>;
      case 'LOST':
        return <span className="bg-red-600 text-white font-extrabold text-[10px] px-2 py-0.5 uppercase">LOST</span>;
      default:
        return <span className="bg-black/10 text-black text-[10px] font-bold px-2 py-0.5 uppercase">{status}</span>;
    }
  }

  function getPriorityBadge(priority: LeadPriority) {
    switch (priority) {
      case 'HIGH':
        return <span className="text-red-600 font-extrabold text-xs uppercase">HIGH</span>;
      case 'NORMAL':
        return <span className="text-black/70 font-bold text-xs uppercase">NORMAL</span>;
      case 'LOW':
        return <span className="text-black/40 font-bold text-xs uppercase">LOW</span>;
      default:
        return <span className="text-black/60 font-bold text-xs uppercase">{priority}</span>;
    }
  }

  function getAIBadge(classification?: LeadAIClassification | null, score?: number | null) {
    if (!classification && (score === null || score === undefined)) {
      return <span className="text-[10px] font-extrabold text-black/40 uppercase tracking-wider">NOT ANALYZED</span>;
    }

    const heatColor =
      classification === 'HOT'
        ? 'bg-[#12B76A] text-black'
        : classification === 'WARM'
        ? 'bg-[#F4B62A] text-black'
        : 'bg-[#20C8E8] text-black';

    return (
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-black text-black font-mono">{score ?? 0}</span>
        {classification && (
          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 uppercase inline-flex items-center gap-0.5 ${heatColor}`}>
            <Flame className="w-3 h-3" /> {classification}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="border-sharp bg-white p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-full bg-block-green opacity-80 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-black text-white text-[10px] font-black px-2.5 py-1 uppercase tracking-widest mb-3">
              <Users className="w-3.5 h-3.5 text-[#12B76A]" /> MULTI-TENANT CRM LEADS PIPELINE
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black">
              Leads Management ({totalCount})
            </h1>
            <p className="text-xs font-bold text-black/60 uppercase tracking-widest mt-1">
              Real-time workspace leads • End-to-end multi-tenant security
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn-pill-primary text-xs uppercase px-5 py-3 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> CREATE NEW LEAD
            </button>
          </div>
        </div>
      </div>

      {/* Search, Filter & Controls Bar */}
      <div className="border-sharp bg-white p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads by name, email, or company..."
              className="w-full border-sharp bg-[#F1F2F3] pl-10 pr-4 py-2 text-xs font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#12B76A]"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchLeads}
            disabled={loading}
            className="btn-editorial-secondary py-2 px-3 text-xs uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh Leads"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Filter Dropdowns & Sorting Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-3 border-t border-black/10">
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-black/60 mb-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full border-sharp bg-[#F1F2F3] px-2.5 py-1.5 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#12B76A]"
            >
              <option value="ALL">ALL STATUSES</option>
              <option value="NEW">NEW</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="QUALIFIED">QUALIFIED</option>
              <option value="PROPOSAL">PROPOSAL</option>
              <option value="WON">WON</option>
              <option value="LOST">LOST</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-black/60 mb-1">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full border-sharp bg-[#F1F2F3] px-2.5 py-1.5 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#12B76A]"
            >
              <option value="ALL">ALL PRIORITIES</option>
              <option value="HIGH">HIGH</option>
              <option value="NORMAL">NORMAL</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-black/60 mb-1">
              AI Classification
            </label>
            <select
              value={classificationFilter}
              onChange={(e) => {
                setClassificationFilter(e.target.value);
                setPage(1);
              }}
              className="w-full border-sharp bg-[#F1F2F3] px-2.5 py-1.5 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#12B76A]"
            >
              <option value="ALL">ALL HEAT LEVELS</option>
              <option value="HOT">HOT</option>
              <option value="WARM">WARM</option>
              <option value="COLD">COLD</option>
              <option value="NOT_ANALYZED">NOT ANALYZED</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-black/60 mb-1">
              Sort Field
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border-sharp bg-[#F1F2F3] px-2.5 py-1.5 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#12B76A]"
            >
              <option value="created_at">CREATED DATE</option>
              <option value="ai_score">AI SCORE</option>
              <option value="priority">PRIORITY</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-black/60 mb-1">
              Sort Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full border-sharp bg-[#F1F2F3] px-2.5 py-1.5 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#12B76A]"
            >
              <option value="desc">DESCENDING</option>
              <option value="asc">ASCENDING</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error View */}
      {error && (
        <div className="border-sharp bg-white p-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-red-600 text-white text-xs font-extrabold px-3 py-1 uppercase">
            <AlertCircle className="w-4 h-4" /> COULD NOT LOAD LEADS
          </div>
          <p className="text-xs font-bold text-black/70 uppercase tracking-wide max-w-md mx-auto">
            Unable to retrieve your organization&apos;s leads from Supabase database.
          </p>
          <button
            onClick={fetchLeads}
            className="btn-pill-primary text-xs uppercase px-5 py-2 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !error && (
        <div className="border-sharp bg-white p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-black pb-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-black flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#12B76A]" /> LOADING WORKSPACE LEADS...
            </span>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-[#F1F2F3] animate-pulse border-sharp" />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && leads.length === 0 && (
        <div className="border-sharp bg-white p-12 text-center space-y-6">
          <div className="w-16 h-16 bg-[#F1F2F3] border-sharp mx-auto flex items-center justify-center">
            <Users className="w-8 h-8 text-black/40" />
          </div>

          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-black">NO LEADS YET</h2>
            <p className="text-xs font-bold text-black/60 uppercase tracking-widest mt-1">
              Start capturing your sales opportunities in this workspace.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn-pill-primary text-xs uppercase px-6 py-3 cursor-pointer"
            >
              + CREATE FIRST LEAD
            </button>
            <button
              onClick={handleSeedLeads}
              disabled={seeding}
              className="btn-editorial-secondary text-xs uppercase px-5 py-3 cursor-pointer disabled:opacity-50"
            >
              {seeding ? 'SEEDING...' : <><Database className="w-4 h-4" /> SEED DEMO LEADS</>}
            </button>
          </div>
        </div>
      )}

      {/* Main Leads Table */}
      {!loading && !error && leads.length > 0 && (
        <div className="border-sharp bg-white overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-white text-[10px] font-black uppercase tracking-wider border-b border-black">
                <th className="p-4">NAME & CONTACT</th>
                <th className="p-4">COMPANY & INDUSTRY</th>
                <th className="p-4">STATUS</th>
                <th className="p-4">PRIORITY</th>
                <th className="p-4">AI SCORE</th>
                <th className="p-4">SOURCE</th>
                <th className="p-4">CREATED</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 text-xs">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-[#F1F2F3]/60 transition-colors">
                  <td className="p-4 font-bold text-black">
                    <div className="font-extrabold text-sm">{lead.name}</div>
                    <div className="text-[10px] font-mono text-black/60">{lead.email}</div>
                    {lead.phone && <div className="text-[10px] font-mono text-black/50">{lead.phone}</div>}
                  </td>

                  <td className="p-4">
                    <div className="font-extrabold text-black">{lead.company || 'N/A'}</div>
                    <div className="text-[10px] font-bold text-black/60 uppercase">{lead.industry || 'N/A'}</div>
                  </td>

                  <td className="p-4 whitespace-nowrap">{getStatusBadge(lead.status)}</td>

                  <td className="p-4 whitespace-nowrap">{getPriorityBadge(lead.priority)}</td>

                  <td className="p-4 whitespace-nowrap">{getAIBadge(lead.ai_classification, lead.ai_score)}</td>

                  <td className="p-4 text-[10px] font-extrabold uppercase text-black/70">{lead.source}</td>

                  <td className="p-4 text-[10px] font-mono text-black/60 whitespace-nowrap">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>

                  <td className="p-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedLeadForDetails(lead)}
                        className="p-1.5 bg-[#F1F2F3] hover:bg-black hover:text-white transition-colors border-sharp"
                        title="View Lead Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedLeadForEdit(lead)}
                        className="p-1.5 bg-[#F1F2F3] hover:bg-black hover:text-white transition-colors border-sharp"
                        title="Edit Lead"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedLeadForDelete(lead)}
                        className="p-1.5 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-colors border-sharp"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls Footer */}
          <div className="p-4 bg-[#F1F2F3] border-t border-black flex items-center justify-between text-xs font-bold uppercase">
            <span className="text-black/60">
              Showing Page {page} of {totalPages} ({totalCount} Total Leads)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-editorial-secondary text-xs px-3 py-1 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 inline mr-1" /> Previous
              </button>

              <span className="font-mono text-xs px-2">{page} / {totalPages}</span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn-editorial-secondary text-xs px-3 py-1 disabled:opacity-40 cursor-pointer"
              >
                Next <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals & Dialogs */}
      <CreateLeadModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchLeads}
      />

      <LeadDetailsModal
        lead={selectedLeadForDetails}
        isOpen={!!selectedLeadForDetails}
        onClose={() => setSelectedLeadForDetails(null)}
        onEdit={(leadToEdit) => setSelectedLeadForEdit(leadToEdit)}
        onDelete={(leadToDelete) => setSelectedLeadForDelete(leadToDelete)}
        onUpdate={fetchLeads}
      />

      <EditLeadModal
        key={selectedLeadForEdit?.id ?? 'no-lead'}
        lead={selectedLeadForEdit}
        isOpen={!!selectedLeadForEdit}
        onClose={() => setSelectedLeadForEdit(null)}
        onSuccess={fetchLeads}
      />

      <DeleteLeadDialog
        lead={selectedLeadForDelete}
        isOpen={!!selectedLeadForDelete}
        onClose={() => setSelectedLeadForDelete(null)}
        onSuccess={fetchLeads}
      />
    </div>
  );
}
