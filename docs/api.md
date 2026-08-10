# Rev AI — API & Endpoint Architecture

## Overview

The API layer is implemented via Next.js Route Handlers (`src/app/api/...`) and Server Actions.

All endpoints strictly validate request payloads using **Zod** schemas, check session authentication via Supabase Auth, and restrict operations to the authenticated user's organization scope.

---

## Endpoint Standards

### Standard JSON Response Format

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### Standard Error Response Format

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED | BAD_REQUEST | NOT_FOUND | INTERNAL_ERROR",
    "message": "Human readable error description",
    "details": []
  }
}
```

---

## Phase 1 Planned Endpoints

### 1. Authentication & Tenant Workspace
- `POST /api/auth/signup` — Create user account via Supabase Auth
- `POST /api/auth/login` — Authenticate session
- `POST /api/organizations` — Create a new Organization workspace & assign `OWNER` role

### 2. Business Onboarding & Knowledge Configuration
- `POST /api/business/profile` — Upsert Organization Business Profile
- `GET /api/business/profile` — Retrieve Organization Business Profile
- `POST /api/business/services` — Add a new Service offering
- `GET /api/business/services` — List Organization Services
- `POST /api/business/faqs` — Create a Business FAQ
- `GET /api/business/faqs` — Retrieve Organization FAQs

### 3. CRM & Leads
- `GET /api/leads` — List leads for authenticated organization
- `POST /api/leads` — Create lead manually or via form submission
- `GET /api/dashboard/stats` — Aggregate metrics (Total Leads, Hot Leads, Meetings, Conversions)

### 4. Automation Webhooks
- `POST /api/webhooks/n8n` — Inbound trigger endpoint for n8n workflow execution (HMAC signed)
