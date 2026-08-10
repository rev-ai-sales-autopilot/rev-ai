# Rev AI — Development Rules & Best Practices

## Core Mandates

### Rule 1 — Do Not Create Disconnected Features
Every feature, UI component, or API endpoint must fit cleanly into the established 5-layer architecture. Do not build orphaned prototype pages.

### Rule 2 — Multi-Tenancy is Mandatory
Never query organization-owned data without verifying the `organization_id` context. All database queries must be scoped to the authenticated tenant.

### Rule 3 — Row Level Security (RLS) is Mandatory
Supabase RLS policies must protect every organization-owned table. Never rely solely on client-side authorization checks.

### Rule 4 — Server-Side Secrets Only
Never expose secret keys (`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `N8N_WEBHOOK_SECRET`, `INTERNAL_EVENT_SECRET`) to the browser or in client components.

### Rule 5 — TypeScript Strictness
Avoid arbitrary `any`. Define explicit interfaces, types, and schema validations using Zod.

### Rule 6 — Input Validation
Validate all API request parameters, route inputs, and form bodies using Zod schemas before processing.

### Rule 7 — Structured Error Handling
Do not silently swallow errors. Log failures with context and return structured JSON error payloads.

### Rule 8 — Reusable UI & Logic
Use Tailwind CSS design tokens and shadcn/ui component abstractions. Avoid duplicating business logic or component templates.

### Rule 9 — No Fake Functionality
Do not hard-code fake analytics, dummy AI responses, or mock active statuses that pretend to be functional. Unconfigured features must be clearly marked as unavailable.

### Rule 10 — Do Not Over-Engineer
Build clean, extensible foundations for Phase 1 without implementing unnecessary complexity ahead of schedule.

---

## Two-Developer Responsibility Matrix

### Developer 1 — AI / Backend / Automation Engine
- Database schema & RLS migrations
- Supabase Auth & Organization membership logic
- Server Actions & Route Handlers
- Centralized LLM abstraction layer & Agent logic
- Event Bus & n8n webhook handlers
- Security & compliance auditing

### Developer 2 — Frontend / UX Product Engineer
- Tailwind CSS & shadcn/ui design system
- Authentication pages (Signup / Login UI)
- Business onboarding wizard UI
- SaaS Dashboard layout & responsive navigation
- Leads & CRM data display components
- Empty states & UX micro-interactions
