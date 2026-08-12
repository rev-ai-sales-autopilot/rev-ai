'use client';

import { useEffect, useState } from 'react';
import { Cpu, AlertTriangle, RefreshCw, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface AIHealthData {
  success: boolean;
  provider: string;
  model: string;
  status: 'healthy' | 'unavailable' | 'model_not_found' | 'error';
  latencyMs?: number;
  error?: string;
  stats?: {
    runsToday: number;
    successCount: number;
    successRate: string;
  };
}

export default function AIIntelligenceStatusCard() {
  const [health, setHealth] = useState<AIHealthData | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    let isMounted = true;

    async function loadHealth() {
      try {
        const res = await fetch('/api/ai/health');
        const data = await res.json();
        if (isMounted) {
          setHealth(data);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setHealth({
            success: false,
            provider: 'ollama',
            model: 'qwen3.5:latest',
            status: 'error',
            error: 'Failed to connect to health endpoint',
          });
          setLoading(false);
        }
      }
    }

    loadHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  async function refreshHealth() {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/health');
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth({
        success: false,
        provider: 'ollama',
        model: 'qwen3.5:latest',
        status: 'error',
        error: 'Failed to connect to health endpoint',
      });
    } finally {
      setLoading(false);
    }
  }

  const isOnline = health?.status === 'healthy';

  return (
    <div className="border-sharp bg-white p-8 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-black pb-4 mb-6 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-black text-white text-[10px] font-black px-2.5 py-0.5 uppercase tracking-widest mb-2">
            <Cpu className="w-3.5 h-3.5 text-[#12B76A]" /> REVA AI INTELLIGENCE ENGINE
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            Qwen 3.5 Sales Intelligence
          </h2>
          <p className="text-xs font-bold text-black/60 uppercase tracking-widest mt-0.5">
            Internal decision engine powered by Ollama server-side execution
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshHealth}
            disabled={loading}
            className="p-2 border-sharp bg-[#F1F2F3] hover:bg-black/10 transition-colors text-black disabled:opacity-50"
            title="Refresh AI Status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/dashboard/ai-test"
            className="btn-pill-primary text-xs uppercase px-4 py-2 flex items-center gap-2"
          >
            Launch Test Panel <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Grid Status Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border-sharp bg-[#F1F2F3] p-4">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-black/60 block mb-1">
            Provider Engine
          </span>
          <span className="text-lg font-black uppercase text-black flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#12B76A]" /> {health?.provider?.toUpperCase() || 'OLLAMA'}
          </span>
          <p className="text-[10px] font-bold text-black/50 uppercase mt-1">Server-Side Local Node</p>
        </div>

        <div className="border-sharp bg-[#F1F2F3] p-4">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-black/60 block mb-1">
            Active Model
          </span>
          <span className="text-lg font-black text-black truncate block font-mono">
            {health?.model || 'qwen3.5:latest'}
          </span>
          <p className="text-[10px] font-bold text-black/50 uppercase mt-1">Qwen 3.5 Sales Brain</p>
        </div>

        <div className="border-sharp bg-[#F1F2F3] p-4">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-black/60 block mb-1">
            Engine Status
          </span>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-[#12B76A] animate-pulse" />
                <span className="text-lg font-black text-[#12B76A] uppercase">ONLINE</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <span className="text-lg font-black text-red-600 uppercase">
                  {health?.status === 'model_not_found' ? 'MODEL MISSING' : 'OFFLINE'}
                </span>
              </>
            )}
          </div>
          <p className="text-[10px] font-bold text-black/50 uppercase mt-1">
            {health?.latencyMs ? `Latency: ${health.latencyMs}ms` : health?.error || 'Local Ollama node'}
          </p>
        </div>

        <div className="border-sharp bg-[#F1F2F3] p-4">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-black/60 block mb-1">
            AI Runs Today
          </span>
          <span className="text-lg font-black text-black">
            {health?.stats?.runsToday ?? 0} <span className="text-xs font-bold text-black/50">({health?.stats?.successRate ?? '100%'})</span>
          </span>
          <p className="text-[10px] font-bold text-black/50 uppercase mt-1">Audit Logged (ai_runs)</p>
        </div>
      </div>

      {/* Warning banner if offline */}
      {!isOnline && !loading && (
        <div className="mt-4 p-4 border-sharp bg-amber-50 border-amber-300 text-amber-900 flex items-start gap-3 text-xs font-bold uppercase">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span>Ollama Server / Model Notice:</span>
            <p className="font-medium normal-case mt-0.5 text-black/80">
              {health?.error || 'Ensure Ollama is running (`ollama serve`) and `qwen3.5:latest` is installed (`ollama pull qwen3.5:latest`).'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
