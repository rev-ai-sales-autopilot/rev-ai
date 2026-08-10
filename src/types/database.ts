export type OrgRole = 'OWNER' | 'ADMIN' | 'SALES' | 'MEMBER';
export type LeadHeat = 'COLD' | 'WARM' | 'HOT';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'WON' | 'LOST';
export type AIRunStatus = 'SUCCESS' | 'FAILED' | 'RUNNING';
export type AutomationRunStatus = 'SUCCESS' | 'FAILED' | 'RUNNING';

export interface UserProfile {
  id: string;
  auth_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  website?: string;
  description?: string;
  logo_url?: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
  updated_at: string;
  user?: UserProfile;
  organization?: Organization;
}

export interface BusinessProfile {
  id: string;
  organization_id: string;
  business_name: string;
  industry: string;
  website?: string;
  business_description: string;
  business_email: string;
  business_phone?: string;
  working_hours?: string;
  payment_terms?: string;
  refund_policy?: string;
  service_areas?: string;
  target_customers?: string;
  typical_budget?: string;
  common_requirements?: string;
  common_questions?: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  starting_price: string;
  delivery_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessFAQ {
  id: string;
  organization_id: string;
  question: string;
  answer: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  organization_id: string;
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  company_name?: string;
  job_title?: string;
  source: string;
  status: LeadStatus;
  heat_level: LeadHeat;
  qualification_score: number;
  summary?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  organization_id: string;
  lead_id: string;
  channel: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  organization_id: string;
  conversation_id: string;
  sender_type: 'LEAD' | 'AI_AGENT' | 'HUMAN_USER';
  sender_id?: string;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Activity {
  id: string;
  organization_id: string;
  lead_id: string;
  type: string;
  title: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface Followup {
  id: string;
  organization_id: string;
  lead_id: string;
  scheduled_at: string;
  channel: string;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  organization_id: string;
  lead_id: string;
  title: string;
  start_time: string;
  end_time: string;
  meeting_link?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
}

export interface AIRunRecord {
  id?: string;
  organization_id: string;
  agent_type: 'LEAD_INTELLIGENCE' | 'SALES_AGENT' | 'FOLLOWUP_AGENT' | 'SALES_ANALYST';
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  input_payload: Record<string, unknown>;
  output_payload?: Record<string, unknown>;
  status: AIRunStatus;
  error_message?: string;
  execution_time_ms: number;
  created_at?: string;
}

export interface AutomationRunRecord {
  id?: string;
  organization_id: string;
  workflow_name: string;
  trigger_event: string;
  status: AutomationRunStatus;
  input_payload?: Record<string, unknown>;
  output_payload?: Record<string, unknown>;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}
