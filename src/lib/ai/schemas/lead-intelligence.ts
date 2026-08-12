import { z } from 'zod';

export const LeadIntelligenceSchema = z.object({
  score: z.number().min(0).max(100),
  classification: z.enum(['HOT', 'WARM', 'COLD']),
  intent: z.string(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  buying_signals: z.array(z.string()),
  risks: z.array(z.string()),
  recommended_action: z.string(),
  confidence: z.number().min(0).max(1),
});

export type LeadIntelligence = z.infer<typeof LeadIntelligenceSchema>;

export interface LeadIntelligenceInputPayload {
  name?: string;
  company?: string;
  industry?: string;
  budget?: number | string;
  requirement?: string;
  source?: string;
  message?: string;
  website_activity?: string;
  previous_interactions?: string;
  metadata?: Record<string, unknown>;
}
