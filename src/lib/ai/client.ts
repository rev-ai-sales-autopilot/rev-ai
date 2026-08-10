/**
 * Centralized LLM Provider Abstraction Layer
 * Keeps AI provider logic separate from business logic.
 */

export interface LLMRequestPayload {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponsePayload {
  text: string;
  model: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export abstract class AIProvider {
  abstract generateCompletion(
    payload: LLMRequestPayload
  ): Promise<LLMResponsePayload>;
}

export class OpenAIProvider extends AIProvider {
  async generateCompletion(
    payload: LLMRequestPayload
  ): Promise<LLMResponsePayload> {
    // Placeholder implementation for Phase 1 architecture setup
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    return {
      text: `[AI Provider Response Placeholder] Input: ${payload.prompt.substring(0, 50)}...`,
      model: payload.model || "gpt-4o",
      tokensUsed: { prompt: 10, completion: 20, total: 30 },
    };
  }
}

export function getAIProvider(): AIProvider {
  return new OpenAIProvider();
}
