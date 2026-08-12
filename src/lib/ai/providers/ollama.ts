import { AICompletionOptions, AIProviderResponse } from '@/types/ai';

export interface OllamaHealthStatus {
  status: 'healthy' | 'unavailable' | 'model_not_found' | 'error';
  provider: 'ollama';
  model: string;
  baseUrl: string;
  latencyMs?: number;
  availableModels?: string[];
  error?: string;
}

export class OllamaProvider {
  private get baseUrl(): string {
    return (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '');
  }

  private get defaultModel(): string {
    return process.env.OLLAMA_MODEL || 'qwen3.5:latest';
  }

  private get timeoutMs(): number {
    const parsed = parseInt(process.env.OLLAMA_TIMEOUT_MS || '180000', 10);
    return isNaN(parsed) || parsed < 5000 ? 180000 : parsed;
  }

  /**
   * Generates completion using Ollama native HTTP API (qwen3.5:latest)
   */
  async generateCompletion(
    prompt: string,
    options?: AICompletionOptions
  ): Promise<AIProviderResponse> {
    const startTime = Date.now();
    const model = options?.model || this.defaultModel;
    const url = `${this.baseUrl}/api/generate`;
    const timeoutMs = this.timeoutMs;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt,
          system: options?.systemPrompt,
          stream: false,
          // Disable Qwen3 extended thinking/reasoning chain.
          // By default qwen3.5:latest runs in "think" mode which generates
          // hundreds of internal CoT tokens before answering — causing 90s+ inference.
          // Setting think: false forces direct structured JSON output, reducing
          // inference time from ~90s to ~2-5s for typical lead intelligence payloads.
          think: options?.think ?? false,
          options: {
            temperature: options?.temperature ?? 0.2,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `Ollama API error (HTTP ${response.status}): ${errorText || response.statusText}`
        );
      }

      const data = await response.json();
      const executionTimeMs = Date.now() - startTime;

      const content = data.response || '';
      const promptTokens = data.prompt_eval_count || Math.ceil(prompt.length / 4);
      const completionTokens = data.eval_count || Math.ceil(content.length / 4);
      const totalTokens = promptTokens + completionTokens;

      return {
        content,
        model: data.model || model,
        promptTokens,
        completionTokens,
        totalTokens,
        executionTimeMs,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Ollama request timed out after ${timeoutMs / 1000} seconds (model: ${model}, duration: ${durationSeconds}s)`);
      }
      const message = err instanceof Error ? err.message : 'Unknown Ollama provider failure';
      throw new Error(`Ollama Provider Execution Failed: ${message}`);
    }
  }

  /**
   * Server-side health check for Ollama and configured qwen3.5:latest model
   */
  async checkHealth(): Promise<OllamaHealthStatus> {
    const startTime = Date.now();
    const configuredModel = this.defaultModel;
    const baseUrl = this.baseUrl;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${baseUrl}/api/tags`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        return {
          status: 'unavailable',
          provider: 'ollama',
          model: configuredModel,
          baseUrl,
          latencyMs,
          error: `Ollama returned HTTP status ${response.status}`,
        };
      }

      const data = await response.json();
      const modelsList: string[] = Array.isArray(data?.models)
        ? data.models.map((m: { name?: string; model?: string }) => m.name || m.model || '').filter(Boolean)
        : [];

      // Check if configured model or prefix matches (e.g. qwen3.5:latest or qwen3.5)
      const modelExists = modelsList.some(
        (m) =>
          m.toLowerCase() === configuredModel.toLowerCase() ||
          m.toLowerCase().startsWith(configuredModel.toLowerCase().split(':')[0])
      );

      if (!modelExists) {
        return {
          status: 'model_not_found',
          provider: 'ollama',
          model: configuredModel,
          baseUrl,
          latencyMs,
          availableModels: modelsList,
          error: `Model '${configuredModel}' not found in Ollama library. Installed: ${modelsList.join(', ') || 'None'}`,
        };
      }

      return {
        status: 'healthy',
        provider: 'ollama',
        model: configuredModel,
        baseUrl,
        latencyMs,
        availableModels: modelsList,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;
      const message = err instanceof Error ? err.message : 'Connection failed';
      return {
        status: 'unavailable',
        provider: 'ollama',
        model: configuredModel,
        baseUrl,
        latencyMs,
        error: `Ollama server unreachable at ${baseUrl}: ${message}`,
      };
    }
  }
}

export const ollamaProvider = new OllamaProvider();
