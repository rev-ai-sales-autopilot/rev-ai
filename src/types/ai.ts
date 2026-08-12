export type AIAgentType = 
  | 'LEAD_INTELLIGENCE'
  | 'SALES_AGENT'
  | 'FOLLOWUP_AGENT'
  | 'SALES_ANALYST';

export interface AICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  /**
   * Controls extended thinking / reasoning mode for Qwen3 family models.
   * Set to false to disable chain-of-thought reasoning and get faster responses.
   * Default: false (disabled for all Rev AI agents to prevent inference timeouts).
   */
  think?: boolean;
}

export interface AIProviderResponse {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  executionTimeMs: number;
}

export interface LeadIntelligenceInput {
  rawContent: string;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface LeadIntelligenceOutput {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  companyName?: string;
  jobTitle?: string;
  qualificationScore: number;
  heatLevel: 'COLD' | 'WARM' | 'HOT';
  summary: string;
  extractedRequirements: string[];
}

export interface SalesAgentInput {
  leadSummary: string;
  conversationHistory: { sender: string; text: string }[];
  incomingMessage: string;
  businessKnowledge: {
    businessName: string;
    description: string;
    services: { name: string; price: string; description: string }[];
    faqs: { question: string; answer: string }[];
  };
}

export interface SalesAgentOutput {
  replyText: string;
  intentDetected: string;
  shouldBookMeeting: boolean;
  suggestedFollowupHours?: number;
}
