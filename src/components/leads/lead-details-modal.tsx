'use client';

import { useState } from 'react';
import {
  X,
  User,
  Building,
  Cpu,
  Flame,
  Loader2,
  Sparkles,
  TrendingUp,
  Clock,
  Edit2,
  Trash2,
} from 'lucide-react';
import { LeadRecord } from '@/types/lead';

interface LeadDetailsModalProps {
  lead: LeadRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (lead: LeadRecord) => void;
  onDelete: (lead: LeadRecord) => void;
  onUpdate: () => void;
}

export default function LeadDetailsModal({
  lead,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onUpdate,
}: LeadDetailsModalProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  if (!isOpen || !lead) return null;

  const hasAIAnalysis =
    lead.ai_score !== undefined && lead.ai_score !== null && lead.ai_classification;

  const classificationColor =
    lead.ai_classification === 'HOT'
      ? 'bg-[#12B76A] text-black'
      : lead.ai_classification === 'WARM'
      ? 'bg-[#F4B62A] text-black'
      : 'bg-[#20C8E8] text-black';

  const urgencyColor =
    lead.ai_urgency === 'HIGH'
      ? 'bg-red-600 text-white'
      : lead.ai_urgency === 'MEDIUM'
      ? 'bg-amber-500 text-black'
      : 'bg-gray-700 text-white';

  async function handleAnalyzeWithAI() {
    if (!lead) return;
    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch('/api/ai/lead-intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: lead.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'AI lead analysis failed');
      }

      // Update lead in database with AI analysis decisions
      const patchRes = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: lead.status === 'NEW' ? 'QUALIFIED' : lead.status,
        }),
      });

      if (!patchRes.ok) {
        console.warn('Failed to update lead status after AI analysis');
      }

      onUpdate();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI Analysis execution failed';
      setAnalysisError(msg);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="border-sharp bg-white w-full max-w-3xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="bg-black text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#12B76A] text-black font-black flex items-center justify-center text-sm">
              RA
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                {lead.name}
              </h2>
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest">
                Company: {lead.company || 'N/A'} • Source: {lead.source || 'Website'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Action Bar */}
          <div className="flex items-center justify-between border-b border-black pb-4">
            <div className="flex items-center gap-2">
              <span className="bg-black text-white text-xs font-extrabold px-3 py-1 uppercase">
                STATUS: {lead.status}
              </span>
              <span className="bg-[#F1F2F3] text-black text-xs font-extrabold border-sharp px-3 py-1 uppercase">
                PRIORITY: {lead.priority}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onEdit(lead);
                }}
                className="btn-editorial-secondary py-1.5 px-3 text-xs uppercase flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={() => {
                  onClose();
                  onDelete(lead);
                }}
                className="bg-red-600 text-white font-extrabold text-xs px-3 py-1.5 uppercase hover:bg-red-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>

          {/* AI Intelligence Card */}
          <div className="border-sharp bg-[#F1F2F3] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#12B76A]" /> Qwen 3.5 AI Sales Intelligence
              </h3>

              {!hasAIAnalysis && (
                <button
                  onClick={handleAnalyzeWithAI}
                  disabled={analyzing}
                  className="btn-pill-primary text-xs uppercase px-4 py-1.5 cursor-pointer disabled:opacity-50"
                >
                  {analyzing ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> ANALYZING WITH QWEN...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#12B76A]" /> ANALYZE WITH AI
                    </span>
                  )}
                </button>
              )}
            </div>

            {analysisError && (
              <div className="p-3 bg-red-600 text-white text-xs font-bold uppercase tracking-wider">
                {analysisError}
              </div>
            )}

            {!hasAIAnalysis && !analyzing && (
              <div className="border-sharp bg-white p-4 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-black/60 block">
                  AI INTELLIGENCE: NOT ANALYZED
                </span>
                <p className="text-xs text-black/70 mt-1">
                  Click &quot;ANALYZE WITH AI&quot; to run Qwen 3.5 intelligence engine on this lead.
                </p>
              </div>
            )}

            {hasAIAnalysis && (
              <div className="space-y-4 bg-white p-4 border-sharp">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="border-sharp bg-[#F1F2F3] p-3 text-center">
                    <span className="text-[10px] font-extrabold uppercase text-black/60 block mb-0.5">
                      AI Score
                    </span>
                    <span className="text-3xl font-black text-black tracking-tight">
                      {lead.ai_score}
                    </span>
                  </div>

                  <div className="border-sharp bg-[#F1F2F3] p-3 text-center">
                    <span className="text-[10px] font-extrabold uppercase text-black/60 block mb-0.5">
                      Classification
                    </span>
                    <span
                      className={`inline-block text-xs font-black uppercase px-2.5 py-1 mt-1 ${classificationColor}`}
                    >
                      <Flame className="w-3 h-3 inline mr-1" />
                      {lead.ai_classification}
                    </span>
                  </div>

                  <div className="border-sharp bg-[#F1F2F3] p-3 text-center col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-extrabold uppercase text-black/60 block mb-0.5">
                      Urgency
                    </span>
                    <span
                      className={`inline-block text-xs font-black uppercase px-2.5 py-1 mt-1 ${urgencyColor}`}
                    >
                      {lead.ai_urgency || 'MEDIUM'}
                    </span>
                  </div>
                </div>

                {lead.ai_recommended_action && (
                  <div className="border-sharp bg-[#12B76A]/10 border-[#12B76A] p-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-black/70 block mb-1">
                      Recommended Action
                    </span>
                    <div className="text-xs font-black text-black uppercase flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[#12B76A]" />
                      {lead.ai_recommended_action}
                    </div>
                  </div>
                )}

                {lead.ai_intent && (
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-black/60 block mb-0.5">
                      Stated Intent
                    </span>
                    <p className="text-xs font-medium text-black bg-[#F1F2F3] p-2 border-l-2 border-black">
                      {lead.ai_intent}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Contact & Business Info Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="border-sharp bg-white p-4 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-black border-b border-black pb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#12B76A]" /> Contact Information
              </h4>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-black/50 font-bold uppercase block text-[10px]">Name</span>
                  <span className="font-extrabold text-black">{lead.name}</span>
                </div>
                <div>
                  <span className="text-black/50 font-bold uppercase block text-[10px]">Email</span>
                  <span className="font-mono text-black">{lead.email}</span>
                </div>
                <div>
                  <span className="text-black/50 font-bold uppercase block text-[10px]">Phone</span>
                  <span className="font-mono text-black">{lead.phone || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="border-sharp bg-white p-4 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-black border-b border-black pb-2 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#12B76A]" /> Business Information
              </h4>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-black/50 font-bold uppercase block text-[10px]">Company</span>
                  <span className="font-extrabold text-black">{lead.company || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-black/50 font-bold uppercase block text-[10px]">Industry</span>
                  <span className="font-bold text-black">{lead.industry || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-black/50 font-bold uppercase block text-[10px]">Budget</span>
                  <span className="font-mono font-bold text-black">
                    {lead.budget ? `₹${Number(lead.budget).toLocaleString()}` : 'Not specified'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stated Requirement & Inbound Message */}
          <div className="border-sharp bg-white p-4 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-black border-b border-black pb-2">
              Requirements & Notes
            </h4>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-black/50 font-bold uppercase block text-[10px]">Requirement</span>
                <p className="font-medium text-black">{lead.requirement || 'No specific requirement stated'}</p>
              </div>
              {lead.message && (
                <div>
                  <span className="text-black/50 font-bold uppercase block text-[10px]">Inbound Message</span>
                  <p className="font-medium text-black bg-[#F1F2F3] p-3 border-sharp">
                    {lead.message}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps Footer */}
          <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-black/50 uppercase border-t border-black/10">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> Created: {new Date(lead.created_at).toLocaleString()}
            </span>
            <span>ID: {lead.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
