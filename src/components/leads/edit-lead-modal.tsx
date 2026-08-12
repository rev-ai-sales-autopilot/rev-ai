'use client';

import { useState } from 'react';
import { X, Save, Loader2, User, Building, Mail, Phone, Briefcase, DollarSign, FileText } from 'lucide-react';
import { LeadRecord, LeadStatus, LeadPriority } from '@/types/lead';

interface EditLeadModalProps {
  lead: LeadRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditLeadModal({ lead, isOpen, onClose, onSuccess }: EditLeadModalProps) {
  const [formData, setFormData] = useState(() => ({
    name: lead?.name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    company: lead?.company || '',
    industry: lead?.industry || '',
    source: lead?.source || 'Website',
    status: (lead?.status || 'NEW') as LeadStatus,
    priority: (lead?.priority || 'NORMAL') as LeadPriority,
    budget: lead?.budget !== undefined && lead?.budget !== null ? String(lead.budget) : '',
    requirement: lead?.requirement || '',
    message: lead?.message || '',
  }));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !lead) return null;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lead) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          budget: formData.budget ? Number(formData.budget) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to update lead');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update lead failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="border-sharp bg-white w-full max-w-2xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="bg-black text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#20C8E8] text-black font-black flex items-center justify-center text-sm">
              ✎
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-white">Edit Lead Details</h2>
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest font-mono">
                ID: {lead.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white/60 hover:text-white p-1 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-red-600 text-white text-xs font-bold uppercase tracking-wider">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-black mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#12B76A]" /> Lead Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full border-sharp bg-[#F1F2F3] px-3 py-2 text-xs font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#12B76A]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-black mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-black/60" /> Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className="w-full border-sharp bg-[#F1F2F3] px-3 py-2 text-xs font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#12B76A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-black mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-black/60" /> Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                className="w-full border-sharp bg-[#F1F2F3] px-3 py-2 text-xs font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#12B76A]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-black mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-black/60" /> Company Name
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                disabled={loading}
                className="w-full border-sharp bg-[#F1F2F3] px-3 py-2 text-xs font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#12B76A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-black mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-black/60" /> Industry
              </label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                disabled={loading}
                className="w-full border-sharp bg-[#F1F2F3] px-3 py-2 text-xs font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#12B76A]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-black mb-1">
                Source
              </label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                disabled={loading}
                className="w-full border-sharp bg-[#F1F2F3] px-3 py-2 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#12B76A]"
              >
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Cold Outbound">Cold Outbound</option>
                <option value="Event">Event</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-black mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-black/60" /> Budget (₹)
              </label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                disabled={loading}
                className="w-full border-sharp bg-[#F1F2F3] px-3 py-2 text-xs font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#12B76A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-black mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={loading}
                className="w-full border-sharp bg-[#F1F2F3] px-3 py-2 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#12B76A]"
              >
                <option value="NEW">NEW</option>
                <option value="CONTACTED">CONTACTED</option>
                <option value="QUALIFIED">QUALIFIED</option>
                <option value="PROPOSAL">PROPOSAL</option>
                <option value="WON">WON</option>
                <option value="LOST">LOST</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-black mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                disabled={loading}
                className="w-full border-sharp bg-[#F1F2F3] px-3 py-2 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#12B76A]"
              >
                <option value="LOW">LOW</option>
                <option value="NORMAL">NORMAL</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-black mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-black/60" /> Stated Requirement
            </label>
            <input
              type="text"
              name="requirement"
              value={formData.requirement}
              onChange={handleChange}
              disabled={loading}
              className="w-full border-sharp bg-[#F1F2F3] px-3 py-2 text-xs font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#12B76A]"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-black mb-1">
              Inbound Inquiry Message / Notes
            </label>
            <textarea
              name="message"
              rows={3}
              value={formData.message}
              onChange={handleChange}
              disabled={loading}
              className="w-full border-sharp bg-[#F1F2F3] px-3 py-2 text-xs font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#12B76A] resize-none"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-editorial-secondary text-xs uppercase py-2.5 px-5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-pill-primary text-xs uppercase py-2.5 px-6 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> SAVING...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" /> SAVE CHANGES
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
