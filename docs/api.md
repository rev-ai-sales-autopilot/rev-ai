# 🌐 Rev AI API Specification & Route Handlers

> **Framework:** Next.js Route Handlers & Server Actions  
> **Auth:** Supabase Auth JWT Session Validation  
> **Security:** Mandatory Server-Side Organization Membership Verification

---

## 1. Overview & Security Rules

All Next.js API endpoints (`src/app/api/...`) operate under strict authorization guidelines:

1. **Authentication:** Incoming requests must present a valid Supabase Auth JWT cookie or session token.
2. **Tenant Scoping:** Client requests **must never** pass arbitrary `organization_id` values without the server validating that the authenticated user belongs to that organization.
3. **Error Handling:** Standardized JSON error responses without exposing raw database tracebacks or internal secrets.

---

## 2. API Endpoint Structure

### Auth & User Endpoints

| Endpoint | Method | Purpose | Auth Required |
|---|---|---|---|
| `/api/auth/callback` | GET | Supabase OAuth & Magic link authentication callback handler | No |
| `/api/auth/me` | GET | Fetch current authenticated user profile & active org memberships | Yes |

### Organization Management

| Endpoint | Method | Purpose | Auth Required |
|---|---|---|---|
| `/api/organizations` | GET | List user's accessible organizations | Yes |
| `/api/organizations` | POST | Create new organization & assign current user as `OWNER` | Yes |
| `/api/organizations/[orgId]` | GET | Fetch organization details | Yes (Member) |
| `/api/organizations/[orgId]` | PATCH | Update organization settings | Yes (Owner/Admin) |
| `/api/organizations/[orgId]/members` | GET | List organization members & roles | Yes (Member) |
| `/api/organizations/[orgId]/members` | POST | Invite / add new team member | Yes (Owner/Admin) |

### Business Knowledge & Onboarding

| Endpoint | Method | Purpose | Auth Required |
|---|---|---|---|
| `/api/business/profile` | GET / POST / PATCH | Read/save organization business profile & policies | Yes (Member) |
| `/api/business/services` | GET / POST | List or create organization services | Yes (Member) |
| `/api/business/services/[serviceId]` | PATCH / DELETE | Update or soft-delete service | Yes (Admin) |
| `/api/business/faqs` | GET / POST / DELETE | Manage FAQs for AI agent grounding | Yes (Member) |

### CRM & Lead Operations

| Endpoint | Method | Purpose | Auth Required |
|---|---|---|---|
| `/api/leads` | GET / POST | List or manually ingest lead | Yes (Member) |
| `/api/leads/[leadId]` | GET / PATCH | Detailed lead view & heat level update | Yes (Member) |
| `/api/conversations/[convId]` | GET / POST | View message history or send message | Yes (Member) |
| `/api/meetings` | GET / POST | Schedule or view booked meetings | Yes (Member) |

### AI Engine & Observability

| Endpoint | Method | Purpose | Auth Required |
|---|---|---|---|
| `/api/ai/analyze-lead` | POST | Trigger Lead Intelligence Agent for scoring | Yes (Server/Webhook) |
| `/api/ai/generate-reply` | POST | Trigger Sales Agent for context-aware customer reply | Yes (Server/Webhook) |
| `/api/ai/runs` | GET | Fetch `ai_runs` history for token cost tracking & debugging | Yes (Admin) |

### Automation & Webhooks

| Endpoint | Method | Purpose | Auth Required |
|---|---|---|---|
| `/api/webhooks/n8n` | POST | Inbound webhook receiver from n8n workflows | Secret Signature |
| `/api/webhooks/lead-capture` | POST | Public lead ingestion form webhook | API Key / Token |
| `/api/automation/runs` | GET | Fetch `automation_runs` status & workflow logs | Yes (Admin) |

---

## 3. Standard JSON Response Formats

### Success Response Format
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Acme Corp",
    "createdAt": "2026-08-10T12:00:00Z"
  },
  "message": "Organization created successfully"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED_TENANT_ACCESS",
    "message": "User does not belong to the specified organization."
  }
}
```
