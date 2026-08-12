import { NextResponse } from 'next/server';
import { aiClient } from '@/lib/ai/client';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const health = await aiClient.checkHealth();

    // Query today's AI stats if database is accessible
    let runsToday = 0;
    let successCount = 0;
    let successRate = 'N/A';

    try {
      const supabase = await createServerSupabaseClient();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: runs, error } = await supabase
        .from('ai_runs')
        .select('id, status')
        .gte('created_at', todayStart.toISOString());

      if (!error && Array.isArray(runs)) {
        runsToday = runs.length;
        successCount = runs.filter((r) => r.status === 'SUCCESS').length;
        successRate = runsToday > 0 ? `${((successCount / runsToday) * 100).toFixed(1)}%` : '100%';
      }
    } catch {
      // Non-blocking fallback if DB unauthenticated/unreachable
    }

    return NextResponse.json({
      success: true,
      provider: health.provider,
      model: health.model,
      baseUrl: health.baseUrl,
      status: health.status,
      latencyMs: health.latencyMs,
      availableModels: health.availableModels || [],
      error: health.error || null,
      stats: {
        runsToday,
        successCount,
        successRate,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'AI Health Check Failed';
    return NextResponse.json(
      {
        success: false,
        provider: 'ollama',
        model: process.env.OLLAMA_MODEL || 'qwen3.5:latest',
        status: 'error',
        error: msg,
      },
      { status: 500 }
    );
  }
}
