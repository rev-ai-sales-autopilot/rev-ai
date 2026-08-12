import { aiClient } from '../client';
import {
  LeadIntelligence,
  LeadIntelligenceInputPayload,
  LeadIntelligenceSchema,
} from '../schemas/lead-intelligence';
import {
  buildLeadIntelligencePrompt,
  LEAD_INTELLIGENCE_SYSTEM_PROMPT,
} from '../prompts/lead-intelligence';
import { logAIRun } from '../utils/logger';

export interface LeadIntelligenceRequest {
  organizationId: string;
  leadPayload: LeadIntelligenceInputPayload;
  businessContext?: {
    business_name?: string;
    industry?: string;
    target_customers?: string;
    typical_budget?: string;
    business_description?: string;
  };
}

export interface LeadIntelligenceResult {
  success: boolean;
  intelligence: LeadIntelligence;
  runId: string | null;
  executionTimeMs: number;
}

/**
 * Lead Intelligence Agent
 * 
 * Analyzes unformatted inbound lead information against organization business context using Qwen 3.5.
 * Returns Zod-validated structured intelligence and records execution in public.ai_runs audit log.
 */
export async function analyzeLeadIntelligence(
  req: LeadIntelligenceRequest
): Promise<LeadIntelligenceResult> {
  const startTime = Date.now();
  const prompt = buildLeadIntelligencePrompt(req.leadPayload, req.businessContext);
  const modelName = process.env.OLLAMA_MODEL || 'qwen3.5:latest';

  try {
    const { data: intelligence, rawResponse } = await aiClient.analyze(
      prompt,
      LeadIntelligenceSchema,
      {
        systemPrompt: LEAD_INTELLIGENCE_SYSTEM_PROMPT,
        temperature: 0.2,
      }
    );

    const executionTimeMs = Date.now() - startTime;

    // Audit log success run to database (public.ai_runs)
    const runId = await logAIRun({
      organizationId: req.organizationId,
      agentType: 'LEAD_INTELLIGENCE',
      model: rawResponse.model || modelName,
      promptTokens: rawResponse.promptTokens,
      completionTokens: rawResponse.completionTokens,
      totalTokens: rawResponse.totalTokens,
      inputPayload: req.leadPayload as unknown as Record<string, unknown>,
      outputPayload: intelligence as unknown as Record<string, unknown>,
      status: 'SUCCESS',
      executionTimeMs,
    });

    return {
      success: true,
      intelligence,
      runId,
      executionTimeMs,
    };
  } catch (err: unknown) {
    const executionTimeMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : 'Lead intelligence agent analysis failed';

    // Audit log failed run to database (public.ai_runs)
    const runId = await logAIRun({
      organizationId: req.organizationId,
      agentType: 'LEAD_INTELLIGENCE',
      model: modelName,
      inputPayload: req.leadPayload as unknown as Record<string, unknown>,
      status: 'FAILED',
      errorMessage,
      executionTimeMs,
    });

    throw new Error(`Lead Intelligence Agent Error (Run ID: ${runId || 'N/A'}): ${errorMessage}`);
  }
}
