'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, GitFork, ArrowRight, Loader2 } from 'lucide-react';
import { WorkflowTriggerType } from '@/types/workflow';

const TRIGGER_OPTIONS: { type: WorkflowTriggerType; label: string; description: string }[] = [
  {
    type: 'LEAD_CREATED',
    label: 'Lead Created',
    description: 'Triggers automatically whenever a new lead enters the CRM system.',
  },
  {
    type: 'LEAD_UPDATED',
    label: 'Lead Status Updated',
    description: 'Triggers when a lead status or qualification heat score changes.',
  },
  {
    type: 'FORM_SUBMITTED',
    label: 'Form Submitted',
    description: 'Triggers when a prospect submits a website lead capture form.',
  },
  {
    type: 'MESSAGE_RECEIVED',
    label: 'Message Received',
    description: 'Triggers when an inbound chat or email message arrives from a lead.',
  },
  {
    type: 'MEETING_COMPLETED',
    label: 'Meeting Completed',
    description: 'Triggers after a scheduled demo or discovery meeting finishes.',
  },
  {
    type: 'PAYMENT_RECEIVED',
    label: 'Payment Received',
    description: 'Triggers upon successful customer payment event.',
  },
  {
    type: 'WEBHOOK_RECEIVED',
    label: 'Inbound Webhook',
    description: 'Triggers when an external system sends a HTTP POST webhook payload.',
  },
  {
    type: 'SCHEDULED',
    label: 'Scheduled Cron Event',
    description: 'Triggers on a recurring interval or scheduled timer.',
  },
];

export default function CreateWorkflowPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<WorkflowTriggerType>('LEAD_CREATED');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter a workflow name.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          triggerType,
        }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        router.push(`/dashboard/workflows/${json.data.id}`);
      } else {
        setError(json.error?.message || 'Failed to create workflow');
        setSubmitting(false);
      }
    } catch {
      setError('Network connection error');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header with Back Button */}
      <div className="space-y-3 border-b border-black pb-6">
        <Link
          href="/dashboard/workflows"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-black/70 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Workflows
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">CREATE WORKFLOW</h1>
            <p className="text-xs font-medium text-black/70 mt-0.5">
              Define a new automated business process workflow for your organization.
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert Box */}
      {error && (
        <div className="border-sharp bg-red-50 p-4 text-xs font-bold text-red-700">
          {error}
        </div>
      )}

      {/* Workflow Creation Form */}
      <form onSubmit={handleSubmit} className="border-sharp bg-white p-8 space-y-8">
        {/* Name Input */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-black">
            Workflow Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Inbound Lead Qualification & Auto-Assign"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 text-xs font-semibold bg-[#F1F2F3] border-sharp focus:outline-none focus:ring-2 focus:ring-black placeholder:text-black/40"
          />
        </div>

        {/* Description Input */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-black">
            Description
          </label>
          <textarea
            rows={3}
            placeholder="Describe what this workflow automates..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 text-xs font-semibold bg-[#F1F2F3] border-sharp focus:outline-none focus:ring-2 focus:ring-black placeholder:text-black/40"
          />
        </div>

        {/* Trigger Selector Grid */}
        <div className="space-y-3">
          <label className="block text-xs font-black uppercase tracking-wider text-black">
            Select Initial Trigger <span className="text-red-500">*</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TRIGGER_OPTIONS.map((opt) => {
              const isSelected = triggerType === opt.type;
              return (
                <div
                  key={opt.type}
                  onClick={() => setTriggerType(opt.type)}
                  className={`border-sharp p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black hover:bg-[#F1F2F3]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs uppercase tracking-tight">
                      {opt.label}
                    </span>
                    <span
                      className={`w-3 h-3 rounded-full border ${
                        isSelected ? 'bg-[#12B76A] border-[#12B76A]' : 'border-black/40'
                      }`}
                    />
                  </div>
                  <p
                    className={`text-[11px] mt-2 font-medium leading-normal ${
                      isSelected ? 'text-white/80' : 'text-black/70'
                    }`}
                  >
                    {opt.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 border-t border-black/10 pt-6">
          <Link
            href="/dashboard/workflows"
            className="btn-editorial-secondary py-2.5 px-6 text-xs uppercase"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="btn-pill-primary text-xs uppercase tracking-wider disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> CREATING...
              </>
            ) : (
              <>
                CREATE WORKFLOW <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
