import { AICompletionOptions, AIProviderResponse } from '@/types/ai';
import { ollamaProvider, OllamaHealthStatus } from './providers/ollama';
import { z } from 'zod';

export class AIProviderClient {
  private defaultModel: string;

  constructor() {
    this.defaultModel = process.env.OLLAMA_MODEL || 'qwen3.5:latest';
  }

  /**
   * Primary completion entry point — delegates to Ollama (qwen3.5:latest)
   */
  async generateCompletion(
    prompt: string,
    options?: AICompletionOptions
  ): Promise<AIProviderResponse> {
    const model = options?.model || this.defaultModel;

    // Use Ollama Provider for execution
    return await ollamaProvider.generateCompletion(prompt, {
      ...options,
      model,
    });
  }

  /**
   * Task-oriented structured analysis:
   * Generates completion, parses JSON response, and enforces strict Zod validation.
   */
  async analyze<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options?: AICompletionOptions
  ): Promise<{ data: T; rawResponse: AIProviderResponse }> {
    const rawResponse = await this.generateCompletion(prompt, options);

    // Clean JSON response (strip markdown wrappers ```json ... ```)
    let cleanedContent = rawResponse.content.trim();
    cleanedContent = cleanedContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    
    // Extract first JSON object bounds if model output extra preamble
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedContent = jsonMatch[0];
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(cleanedContent);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON';
      throw new Error(`AI JSON Parsing Failed: ${msg}. Model Output: "${rawResponse.content.slice(0, 200)}..."`);
    }

    // Strict Zod schema validation
    const validationResult = schema.safeParse(parsedJson);

    if (!validationResult.success) {
      const formattedError = validationResult.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      throw new Error(`AI Structured Output Validation Failed: ${formattedError}`);
    }

    return {
      data: validationResult.data,
      rawResponse,
    };
  }

  /**
   * Task-oriented helpers for pipeline clarity
   */
  async classify<T>(prompt: string, schema: z.ZodType<T>, options?: AICompletionOptions) {
    return this.analyze<T>(prompt, schema, options);
  }

  async extract<T>(prompt: string, schema: z.ZodType<T>, options?: AICompletionOptions) {
    return this.analyze<T>(prompt, schema, options);
  }

  async score<T>(prompt: string, schema: z.ZodType<T>, options?: AICompletionOptions) {
    return this.analyze<T>(prompt, schema, options);
  }

  async decide<T>(prompt: string, schema: z.ZodType<T>, options?: AICompletionOptions) {
    return this.analyze<T>(prompt, schema, options);
  }

  /**
   * Provider health status
   */
  async checkHealth(): Promise<OllamaHealthStatus> {
    return ollamaProvider.checkHealth();
  }
}

export const aiClient = new AIProviderClient();
