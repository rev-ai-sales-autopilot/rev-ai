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
```

---

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
