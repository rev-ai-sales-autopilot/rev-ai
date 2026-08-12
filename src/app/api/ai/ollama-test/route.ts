import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ollamaProvider } from '@/lib/ai/providers/ollama';

/**
 * Diagnostic Endpoint (Development Only)
 * Tests raw Ollama + qwen3.5:latest completion end-to-end with minimal prompt payload
 */
export async function POST() {
  // Enforce Development / Authenticated Access
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  const startTime = Date.now();
  const testPrompt = 'Return exactly this JSON:\n{"status":"ok"}\nNothing else.';

  try {
    const result = await ollamaProvider.generateCompletion(testPrompt, {
      temperature: 0.1,
    });

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      provider: 'ollama',
      model: result.model,
      durationMs,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      response: result.content.trim(),
    });
  } catch (err: unknown) {
    const durationMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : 'Ollama test failed';
    return NextResponse.json(
      {
        success: false,
        provider: 'ollama',
        durationMs,
        error: message,
      },
      { status: 500 }
    );
  }
}
