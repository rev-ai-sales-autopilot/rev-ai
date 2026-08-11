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

## 5. Workflow Node Graph & Status Lifecycle

Rev AI workflows are defined as node graphs linking Triggers, AI Operations, Conditions, Actions, and Delays:

```text
┌─────────────────────────────────┐
│ TRIGGER: LEAD_CREATED           │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ AI: ANALYZE_LEAD                │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ CONDITION: score > 80           │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ ACTION: ASSIGN_LEAD             │
└─────────────────────────────────┘
```

### Workflow Status Lifecycle
- **DRAFT:** Workflow is currently being designed and configured in the builder.
- **ACTIVE:** Workflow is published and enabled for future execution triggering.
- **PAUSED:** Workflow execution triggers are temporarily suspended.

### Observability Entities
- `public.workflow_runs`: High-level run audit recording workflow execution status (`RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`).
- `public.workflow_run_steps`: Granular node-by-node execution log recording node input, output, duration, and error tracebacks.

