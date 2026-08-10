export enum SystemEventType {
  LEAD_CREATED = 'LEAD_CREATED',
  LEAD_UPDATED = 'LEAD_UPDATED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  LEAD_BECAME_HOT = 'LEAD_BECAME_HOT',
  FOLLOWUP_DUE = 'FOLLOWUP_DUE',
  MEETING_BOOKED = 'MEETING_BOOKED',
}

export interface SystemEventPayload<T = unknown> {
  eventId: string;
  eventType: SystemEventType;
  organizationId: string;
  timestamp: string;
  data: T;
}

export interface WebhookDeliveryOptions {
  targetUrl: string;
  secretHeader?: string;
  signatureHeader?: string;
  timeoutMs?: number;
}

export interface AutomationTriggerResult {
  runId: string;
  workflowName: string;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING';
  statusCode?: number;
  responseBody?: unknown;
  error?: string;
}
