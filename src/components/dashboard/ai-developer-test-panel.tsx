'use client';

import { useState } from 'react';
import {
  Cpu,
  Flame,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Code,
  Loader2,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { LeadIntelligence } from '@/lib/ai/schemas/lead-intelligence';


export default function AIDeveloperTestPanel() {
  const [formData, setFormData] = useState({
    name: 'Rahul Sharma',
    company: 'Example Technologies',
    industry: 'SaaS',
    budget: '200000',
    requirement: 'Sales automation & lead qualification workflow',
    source: 'Website',
    message: 'We urgently need to automate our sales process to qualify leads faster.',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    intelligence: LeadIntelligence;
    runId: string;
    executionTimeMs: number;
    model: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/ai/lead-intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadData: {
            name: formData.name,
            company: formData.company,
            industry: formData.industry,
            budget: formData.budget ? Number(formData.budget) || formData.budget : undefined,
            requirement: formData.requirement,
            source: formData.source,
            message: formData.message,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Lead intelligence analysis failed');
      }

      setResult({
        intelligence: data.intelligence,
        runId: data.runId,
        executionTimeMs: data.executionTimeMs,
        model: data.model,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const classificationColor =
    result?.intelligence.classification === 'HOT'
      ? 'bg-[#12B76A] text-black'
      : result?.intelligence.classification === 'WARM'
      ? 'bg-[#F4B62A] text-black'
      : 'bg-[#20C8E8] text-black';

  const urgencyColor =
    result?.intelligence.urgency === 'HIGH'
      ? 'bg-red-600 text-white'
      : result?.intelligence.urgency === 'MEDIUM'
      ? 'bg-amber-500 text-black'
      : 'bg-gray-700 text-white';

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="border-sharp bg-white p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-full bg-block-pink opacity-80 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-black text-white text-[10px] font-black px-2.5 py-1 uppercase tracking-widest mb-3">
              <Cpu className="w-3.5 h-3.5 text-[#12B76A]" /> DEVELOPER INTELLIGENCE TEST PANEL
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black flex items-center gap-3">
              Qwen 3.5 Lead Intelligence Agent
            </h1>
            <p className="text-xs font-bold text-black/60 uppercase tracking-widest mt-1">
              Internal decision engine • Structured JSON validation • Server-side Ollama
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#F1F2F3] border-sharp px-4 py-2 text-xs font-mono text-black font-bold">
            <ShieldCheck className="w-4 h-4 text-[#12B76A]" /> Model: qwen3.5:latest
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Input Form */}
        <div className="border-sharp bg-white p-8 space-y-6">
          <div className="border-b border-black pb-4">
            <h2 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#12B76A]" /> Inbound Lead Sample Data
            </h2>
            <p className="text-xs font-bold text-black/60 uppercase tracking-widest mt-1">
              Simulate unformatted incoming lead submission payload
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                  Contact Name
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
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full border-sharp bg-[#F1F2F3] px-3 py-2 text-xs font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#12B76A]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                  Industry Sector
                </label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full border-sharp bg-[#F1F2F3] px-3 py-2 text-xs font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#12B76A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                  Estimated Budget (₹)
                </label>
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full border-sharp bg-[#F1F2F3] px-3 py-2 text-xs font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#12B76A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                Stated Requirement
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
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                Inbound Message / Customer Query
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

            <button
              type="submit"
              disabled={loading}
              className="btn-pill-primary w-full justify-center py-3.5 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> ANALYZING WITH QWEN 3.5...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  RUN LEAD INTELLIGENCE AGENT <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Output Results */}
        <div className="border-sharp bg-white p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-black pb-4">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#12B76A]" /> Intelligence Decisions
              </h2>
              <p className="text-xs font-bold text-black/60 uppercase tracking-widest mt-1">
                Zod Validated Output • Audit Logged in public.ai_runs
              </p>
            </div>

            {result && (
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="inline-flex items-center gap-1 text-xs font-extrabold uppercase bg-black text-white px-2.5 py-1 hover:bg-black/80 transition-colors"
              >
                <Code className="w-3.5 h-3.5" /> {showRawJson ? 'Structured UI' : 'Raw JSON'}
              </button>
            )}
          </div>

          {error && (
            <div className="p-4 border-sharp bg-red-50 text-red-700 flex items-start gap-3 text-xs font-bold uppercase">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <span>Analysis Failed:</span>
                <p className="font-medium normal-case mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="border-sharp bg-[#F1F2F3] p-12 text-center text-black/50 space-y-3">
              <Cpu className="w-10 h-10 mx-auto text-black/30" />
              <p className="text-xs font-bold uppercase tracking-wider">
                Click &quot;Run Lead Intelligence Agent&quot; to execute Qwen 3.5 analysis.
              </p>
            </div>
          )}

          {loading && (
            <div className="border-sharp bg-[#F1F2F3] p-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#12B76A]" />
              <p className="text-xs font-extrabold uppercase tracking-wider text-black">
                Qwen 3.5 is analyzing lead signals...
              </p>
              <p className="text-[10px] text-black/60 uppercase font-mono">
                Model: qwen3.5:latest • Processing JSON schema
              </p>
            </div>
          )}

          {result && showRawJson && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-mono text-black/60 uppercase">
                <span>Run ID: {result.runId || 'N/A'}</span>
                <span>Latency: {result.executionTimeMs}ms</span>
              </div>
              <pre className="border-sharp bg-black text-[#12B76A] p-4 text-xs font-mono overflow-x-auto leading-relaxed max-h-96">
                {JSON.stringify(result.intelligence, null, 2)}
              </pre>
            </div>
          )}

          {result && !showRawJson && (
            <div className="space-y-6">
              {/* Score & Heat Level Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="border-sharp bg-[#F1F2F3] p-4 text-center">
                  <span className="text-[10px] font-extrabold uppercase text-black/60 block mb-1">
                    AI Lead Score
                  </span>
                  <span className="text-4xl font-black text-black tracking-tight">
                    {result.intelligence.score}
                  </span>
                  <span className="text-[10px] font-bold text-black/50 block mt-1 uppercase">
                    Scale 0 - 100
                  </span>
                </div>

                <div className="border-sharp bg-[#F1F2F3] p-4 text-center">
                  <span className="text-[10px] font-extrabold uppercase text-black/60 block mb-1">
                    Classification
                  </span>
                  <span
                    className={`inline-block text-sm font-black uppercase px-3 py-1 mt-1 ${classificationColor}`}
                  >
                    <Flame className="w-3.5 h-3.5 inline mr-1" />
                    {result.intelligence.classification}
                  </span>
                  <span className="text-[10px] font-bold text-black/50 block mt-1 uppercase">
                    Heat Level
                  </span>
                </div>

                <div className="border-sharp bg-[#F1F2F3] p-4 text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-extrabold uppercase text-black/60 block mb-1">
                    Urgency
                  </span>
                  <span
                    className={`inline-block text-xs font-black uppercase px-2.5 py-1 mt-1 ${urgencyColor}`}
                  >
                    {result.intelligence.urgency}
                  </span>
                  <span className="text-[10px] font-bold text-black/50 block mt-1 uppercase">
                    Confidence: {(result.intelligence.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Recommended Action & Intent */}
              <div className="border-sharp bg-[#12B76A]/10 border-[#12B76A] p-4 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-black/70 block">
                  Recommended Workflow Action
                </span>
                <div className="text-sm font-black text-black uppercase flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#12B76A]" />
                  {result.intelligence.recommended_action}
                </div>
                <p className="text-xs text-black/80 font-medium pt-1 border-t border-[#12B76A]/20">
                  <strong className="uppercase text-[10px]">Detected Intent:</strong> {result.intelligence.intent}
                </p>
              </div>

              {/* Buying Signals */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-black mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#12B76A]" /> Positive Buying Signals
                </h4>
                <ul className="space-y-1.5">
                  {result.intelligence.buying_signals.map((signal, idx) => (
                    <li
                      key={idx}
                      className="text-xs font-medium text-black bg-[#F1F2F3] px-3 py-1.5 border-l-2 border-[#12B76A]"
                    >
                      {signal}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risks */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-black mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Identified Risks & Friction Points
                </h4>
                <ul className="space-y-1.5">
                  {result.intelligence.risks.map((risk, idx) => (
                    <li
                      key={idx}
                      className="text-xs font-medium text-black bg-[#F1F2F3] px-3 py-1.5 border-l-2 border-amber-500"
                    >
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Metadata Footer */}
              <div className="pt-4 border-t border-black/10 flex items-center justify-between text-[10px] font-mono text-black/50 uppercase">
                <span>Model: {result.model}</span>
                <span>Latency: {result.executionTimeMs}ms</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
