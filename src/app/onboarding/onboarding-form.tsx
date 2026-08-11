'use client';

import { useState } from 'react';
import { ArrowRight, Building2, Globe, FileText, Briefcase, AlertCircle, Loader2 } from 'lucide-react';

interface OnboardingFormProps {
  initialError?: string;
  action: (formData: FormData) => Promise<void>;
}

export default function OnboardingForm({ initialError, action }: OnboardingFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = (formData.get('name') as string || '').trim();
    const industry = (formData.get('industry') as string || '').trim();

    if (!name) {
      setError('BUSINESS NAME IS REQUIRED');
      return;
    }

    if (!industry) {
      setError('INDUSTRY IS REQUIRED');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await action(formData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'WORKSPACE CREATION FAILED';
      // Next.js redirect throws a digest error which is expected during navigation
      if (typeof msg === 'string' && msg.includes('NEXT_REDIRECT')) {
        return;
      }
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {(error || initialError) && (
        <div className="p-4 border-sharp bg-red-50 text-red-700 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span className="text-xs font-bold uppercase tracking-wider leading-relaxed">
            {error || initialError}
          </span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
          Company / Business Name *
        </label>
        <div className="relative">
          <input
            type="text"
            name="name"
            required
            disabled={loading}
            placeholder="e.g. Acme Automation Labs"
            className="w-full border-sharp bg-[#F1F2F3] px-4 py-3 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-[#12B76A] transition-all font-medium disabled:opacity-60"
          />
          <Building2 className="absolute right-3 top-3.5 w-4 h-4 text-black/40" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
          Industry Sector *
        </label>
        <div className="relative">
          <select
            name="industry"
            required
            disabled={loading}
            className="w-full border-sharp bg-[#F1F2F3] px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#12B76A] transition-all font-medium appearance-none disabled:opacity-60"
          >
            <option value="">Select Primary Industry</option>
            <option value="B2B Software & SaaS">B2B Software & SaaS</option>
            <option value="AI & Automation Services">AI & Automation Services</option>
            <option value="Marketing & Digital Agency">Marketing & Digital Agency</option>
            <option value="E-commerce & Retail">E-commerce & Retail</option>
            <option value="Financial & Legal Services">Financial & Legal Services</option>
            <option value="Healthcare & Tech">Healthcare & Tech</option>
            <option value="Other Business Services">Other Business Services</option>
          </select>
          <Briefcase className="absolute right-3 top-3.5 w-4 h-4 text-black/40 pointer-events-none" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
          Company Website <span className="text-black/40 font-normal">(Optional)</span>
        </label>
        <div className="relative">
          <input
            type="url"
            name="website"
            disabled={loading}
            placeholder="https://company.com"
            className="w-full border-sharp bg-[#F1F2F3] px-4 py-3 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-[#12B76A] transition-all font-medium disabled:opacity-60"
          />
          <Globe className="absolute right-3 top-3.5 w-4 h-4 text-black/40" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
          Short Business Description <span className="text-black/40 font-normal">(Optional)</span>
        </label>
        <div className="relative">
          <textarea
            name="description"
            rows={3}
            disabled={loading}
            placeholder="Describe your primary services, core products, and customer target market..."
            className="w-full border-sharp bg-[#F1F2F3] px-4 py-3 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-[#12B76A] transition-all font-medium resize-none disabled:opacity-60"
          />
          <FileText className="absolute right-3 top-3.5 w-4 h-4 text-black/40" />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-pill-primary w-full justify-center py-4 text-sm uppercase tracking-wider mt-4 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-black" /> CREATING WORKSPACE...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            LAUNCH WORKSPACE & ENTER DASHBOARD <ArrowRight className="w-5 h-5" />
          </span>
        )}
      </button>
    </form>
  );
}
