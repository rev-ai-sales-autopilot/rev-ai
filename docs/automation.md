# ⚡ Rev AI Event & Automation Architecture

> **Location:** `src/lib/automation/`  
> **Integrations:** n8n Workflow Automation, Webhooks & Internal Pub/Sub Event Bus  
> **Observability:** Audit logging via `public.automation_runs`

---

## 1. Overview & Event Architecture

Rev AI uses an event-driven pattern where business actions emit internal events. These events are dispatched to webhook handlers and n8n workflow triggers.

```text
[ Business Action ] (e.g. Lead Ingested via API)
         │
         ▼
[ Internal Event Bus ] (`src/lib/automation/events.ts`)
         │
         ├── Emit: `LEAD_CREATED`
         │
         ├──► Local Handler: Record Activity Log
         ├──► AI Handler: Trigger Lead Intelligence Agent
         └──► Webhook Dispatcher: POST Payload to n8n Webhook Endpoint
                                           │
                                           ▼
                                  [ n8n Workflow Engine ]
                                           │
                                           ▼
                                  Execute Multi-channel Action
                                  (Slack Alert, Email, CRM Update)
                                           │
                                           ▼
                                  Log to `public.automation_runs`
```

---

## 2. Core Internal Event Types

```typescript
export enum SystemEventType {
  LEAD_CREATED = 'LEAD_CREATED',
  LEAD_UPDATED = 'LEAD_UPDATED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  LEAD_BECAME_HOT = 'LEAD_BECAME_HOT',
  FOLLOWUP_DUE = 'FOLLOWUP_DUE',
  MEETING_BOOKED = 'MEETING_BOOKED',
}

export interface SystemEventPayload<T = any> {
  eventId: string;
  eventType: SystemEventType;
  organizationId: string;
  timestamp: string;
  data: T;
}
```

---

## 3. n8n Webhook Integration & Authentication

### Security Verification
Incoming webhooks from n8n to Rev AI (`/api/webhooks/n8n`) must verify HMAC signature or shared secret header:

```typescript
// Header: x-rev-ai-signature
// Secret: process.env.N8N_WEBHOOK_SECRET
```

---

## 4. Automation Runs Tracking (`automation_runs`)

Every webhook or workflow trigger execution logs an entry to `public.automation_runs`:

```typescript
export interface AutomationRunRecord {
  id?: string;
  organization_id: string;
  workflow_name: string;
  trigger_event: SystemEventType;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING';
  input_payload?: Record<string, any>;
  output_payload?: Record<string, any>;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}
```
