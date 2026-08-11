import { AICompletionOptions, AIProviderResponse } from '@/types/ai';

export class AIProviderClient {
  private defaultModel: string;

  constructor(defaultModel = 'gpt-4o') {
    this.defaultModel = defaultModel;
  }

  async generateCompletion(
    prompt: string,
    options?: AICompletionOptions
  ): Promise<AIProviderResponse> {
    const startTime = Date.now();
    const model = options?.model || this.defaultModel;

    const mockContent = `[AI Provider Response Placeholder for: ${prompt.slice(0, 50)}...]`;
    const executionTimeMs = Date.now() - startTime;

    return {
      content: mockContent,
      model,
      promptTokens: Math.ceil(prompt.length / 4),
      completionTokens: Math.ceil(mockContent.length / 4),
      totalTokens: Math.ceil((prompt.length + mockContent.length) / 4),
      executionTimeMs,
    };
  }
}

export const aiClient = new AIProviderClient();
