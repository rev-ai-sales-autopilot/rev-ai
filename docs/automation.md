<<<<<<< HEAD
# Rev AI — Automation & Event Architecture Specification

## Overview

Rev AI uses an internal pub/sub event architecture coupled with **n8n** and secure webhooks to trigger asynchronous workflows without blocking application response times.

---

## Folder Structure (`src/lib/automation/`)

```text
src/lib/automation/
├── events.ts       -- Event types, SystemEvent payload interface, & EventBus dispatcher
├── webhooks.ts     -- Webhook signing verification & n8n request dispatchers
└── workflows.ts    -- Pre-built internal workflow definitions
=======
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
>>>>>>> faa4a56 (feat: initialize Day 1 project architecture, documentation, and Next.js foundation)
```

---

<<<<<<< HEAD
## Core System Event Types

| Event Type | Description | Trigger Context |
|---|---|---|
| `LEAD_CREATED` | New lead ingested into CRM | Webhook, public form, or manual entry |
| `LEAD_UPDATED` | Lead profile or status changed | Sales rep update or system scoring |
| `MESSAGE_RECEIVED` | New inbound customer message | WhatsApp, Email, or Webchat webhook |
| `LEAD_BECAME_HOT` | Lead qualification score exceeds threshold | Lead Intelligence Agent |
| `FOLLOWUP_DUE` | Scheduled follow-up timestamp reached | Cron timer / background trigger |
| `MEETING_BOOKED` | Prospect completes calendar reservation | Cal.com / Google Calendar webhook |

---

## n8n Integration Architecture

1. **Outbound Trigger**: When an event occurs, the system dispatches an HTTP POST request to configured n8n webhooks with payload:
   ```json
   {
     "eventId": "uuid",
     "eventType": "LEAD_CREATED",
     "organizationId": "uuid",
     "timestamp": "2026-08-10T22:00:00Z",
     "payload": { ... }
   }
   ```
2. **Signature Verification**: Webhooks include `x-revai-signature` computed via HMAC SHA256 using `N8N_WEBHOOK_SECRET`.
3. **Inbound Callback**: n8n workflows return results via `/api/webhooks/n8n`.

---

## Automation Observability (`automation_runs`)

All execution attempts log entries into `automation_runs`:
- `organization_id`
- `workflow`
- `trigger`
- `status` (`PENDING` / `SUCCESS` / `FAILED`)
- `error`
- `started_at` / `completed_at`
=======
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
>>>>>>> faa4a56 (feat: initialize Day 1 project architecture, documentation, and Next.js foundation)
