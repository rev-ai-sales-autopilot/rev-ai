import { z } from 'zod';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'WON' | 'LOST';
export type LeadPriority = 'LOW' | 'NORMAL' | 'HIGH';
export type LeadAIClassification = 'HOT' | 'WARM' | 'COLD';

export interface LeadRecord {
  id: string;
  organization_id: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  phone?: string | null;
  company?: string | null;
  company_name?: string | null;
  industry?: string | null;
  job_title?: string | null;
  source: string;
  status: LeadStatus;
  priority: LeadPriority;
  heat_level?: string | null;
  qualification_score?: number | null;
  budget?: number | null;
  requirement?: string | null;
  message?: string | null;
  summary?: string | null;
  
  // AI Decision Fields
  ai_score?: number | null;
  ai_classification?: LeadAIClassification | null;
  ai_intent?: string | null;
  ai_urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  ai_confidence?: number | null;
  ai_recommended_action?: string | null;
  ai_analyzed_at?: string | null;
  
  created_at: string;
  updated_at: string;
}

export const CreateLeadSchema = z.object({
  name: z.string().min(1, 'Lead name is required'),
  email: z.string().email('Invalid email address').or(z.literal('')).optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  industry: z.string().optional(),
  source: z.string().default('Website'),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST']).default('NEW'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH']).default('NORMAL'),
  budget: z.union([z.number(), z.string().transform((val) => Number(val) || undefined)]).optional(),
  requirement: z.string().optional(),
  message: z.string().optional(),
});

export const UpdateLeadSchema = CreateLeadSchema.partial();

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;
