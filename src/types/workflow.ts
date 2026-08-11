// ============================================================================
// REV AI PHASE 2 WORKFLOW AUTOMATION TYPES
// ============================================================================

export type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED';

export type WorkflowNodeType = 'TRIGGER' | 'AI' | 'CONDITION' | 'ACTION' | 'DELAY';

export type WorkflowTriggerType =
  | 'LEAD_CREATED'
  | 'LEAD_UPDATED'
  | 'FORM_SUBMITTED'
  | 'MESSAGE_RECEIVED'
  | 'MEETING_COMPLETED'
  | 'PAYMENT_RECEIVED'
  | 'WEBHOOK_RECEIVED'
  | 'SCHEDULED';

export type AIOperationType =
  | 'ANALYZE'
  | 'CLASSIFY'
  | 'EXTRACT'
  | 'SUMMARIZE'
  | 'GENERATE'
  | 'SCORE';

export type ActionType =
  | 'UPDATE_LEAD'
  | 'ASSIGN_LEAD'
  | 'CREATE_TASK'
  | 'SEND_NOTIFICATION'
  | 'WEBHOOK';

export type ConditionOperator = '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains';

export type WorkflowRunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

// Node Configurations
export interface TriggerNodeConfig {
  triggerType: WorkflowTriggerType;
  customFilter?: Record<string, string>;
}

export interface AINodeConfig {
  operation: AIOperationType;
  promptTemplate?: string;
  targetField?: string;
}

export interface ConditionNodeConfig {
  field: string;
  operator: ConditionOperator;
  value: string;
}

export interface ActionNodeConfig {
  actionType: ActionType;
  payload?: Record<string, unknown>;
}

export interface DelayNodeConfig {
  delayMinutes: number;
}

export type NodeConfigMap = {
  TRIGGER: TriggerNodeConfig;
  AI: AINodeConfig;
  CONDITION: ConditionNodeConfig;
  ACTION: ActionNodeConfig;
  DELAY: DelayNodeConfig;
};

// Workflow Entities
export interface WorkflowNode {
  id: string;
  workflow_id: string;
  type: WorkflowNodeType;
  name: string;
  config: Record<string, unknown>;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowEdge {
  id: string;
  workflow_id: string;
  source_node_id: string;
  target_node_id: string;
  condition?: string;
  created_at: string;
}

export interface Workflow {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  version: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  execution_count?: number;
  last_run_at?: string;
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  organization_id: string;
  status: WorkflowRunStatus;
  trigger_type: string;
  started_at: string;
  completed_at?: string;
  error?: string;
  created_at: string;
}

export interface WorkflowRunStep {
  id: string;
  workflow_run_id: string;
  node_id: string;
  status: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  started_at: string;
  completed_at?: string;
}
