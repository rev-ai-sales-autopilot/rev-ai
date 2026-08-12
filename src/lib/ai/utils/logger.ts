import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface AIRunLogRecord {
  organizationId: string;
  agentType: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  inputPayload: Record<string, unknown>;
  outputPayload?: Record<string, unknown>;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING';
  errorMessage?: string;
  executionTimeMs?: number;
}

/**
 * Sanitizes input payloads to ensure credentials, tokens, or secrets are never logged.
 */

function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') return {};
  const sanitized: Record<string, unknown> = {};

  const sensitiveKeys = new Set([
    'password',
    'secret',
    'token',
    'apikey',
    'api_key',
    'authorization',
    'cookie',
    'service_role',
  ]);

  for (const [key, value] of Object.entries(payload)) {
    if (sensitiveKeys.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizePayload(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export async function logAIRun(record: AIRunLogRecord): Promise<string | null> {
  try {
    const supabase = await createServerSupabaseClient();

    const insertData = {
      organization_id: record.organizationId,
      agent_type: record.agentType,
      model: record.model,
      prompt_tokens: record.promptTokens || 0,
      completion_tokens: record.completionTokens || 0,
      total_tokens: record.totalTokens || 0,
      input_payload: sanitizePayload(record.inputPayload),
      output_payload: record.outputPayload ? sanitizePayload(record.outputPayload) : {},
      status: record.status,
      error_message: record.errorMessage || null,
      execution_time_ms: record.executionTimeMs || 0,
    };

    const { data, error } = await supabase
      .from('ai_runs')
      .insert(insertData)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[logAIRun] Error logging AI run to database:', error.message);
      return null;
    }

    return data?.id || null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown logger error';
    console.error('[logAIRun] Exception in AI audit logger:', msg);
    return null;
  }
}
