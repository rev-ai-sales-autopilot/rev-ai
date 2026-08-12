'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import { LeadRecord } from '@/types/lead';

interface DeleteLeadDialogProps {
  lead: LeadRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteLeadDialog({ lead, isOpen, onClose, onSuccess }: DeleteLeadDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !lead) return null;

  async function handleDelete() {
    if (!lead) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to delete lead');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete lead failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="border-sharp bg-white w-full max-w-md overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        {/* Top Danger Header */}
        <div className="bg-red-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-white shrink-0" />
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-white">DELETE LEAD?</h2>
              <p className="text-xs font-bold text-white/80 uppercase tracking-widest">
                Permanent database removal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white/80 hover:text-white p-1 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3 bg-black text-red-500 text-xs font-bold uppercase tracking-wider">
            {error}
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-black font-medium uppercase tracking-wide">
            This will permanently remove <strong className="text-black font-extrabold">&quot;{lead.name}&quot;</strong> ({lead.company || lead.email}) and associated lead data from your organization workspace.
          </p>
          <p className="text-[10px] text-red-600 font-extrabold uppercase tracking-widest bg-red-50 p-2.5 border-l-2 border-red-600">
            This action cannot be undone. RLS security prevents cross-organization deletion.
          </p>
        </div>

        {/* Actions */}
        <div className="bg-[#F1F2F3] p-4 flex items-center justify-end gap-3 border-t border-black">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-editorial-secondary text-xs uppercase py-2 px-4 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 text-white font-extrabold text-xs px-5 py-2 uppercase hover:bg-red-700 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin" /> DELETING...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" /> DELETE PERMANENTLY
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
