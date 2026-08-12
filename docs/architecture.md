# 🏗️ Rev AI Architecture Specification

> **Rev AI — AI Sales AutoPilot**  
> *Tagline:* Your AI-Powered Sales & Automation Team

---

## 1. Overview & Layered Architecture

Rev AI is a multi-tenant B2B SaaS platform designed to function as an autonomous sales team. The platform is organized around five core architectural layers:

```text
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                      │
│     Next.js 14+ (App Router) + TypeScript + Tailwind     │
│             shadcn/ui + Lucide Icons + React            │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                  APPLICATION API LAYER                  │
│       Next.js Route Handlers & Server Actions           │
│        Supabase Auth Middleware & RBAC Guards           │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌────────────────────────────┴────────────────────────────┐
│                    AI INTELLIGENCE ENGINE               │
│   Ollama Provider (qwen3.5:latest) + Agnostic AI Client │
│   Structured Decisions (Zod) + Lead Intelligence Agent  │
│   Principle: AI recommends; Workflow Engine executes    │
│      Prompt Templates + AI Agents + ai_runs Auditing    │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌────────────────────────────┴────────────────────────────┐
│                    AUTOMATION ENGINE                    │
│      Internal Event Bus (Pub/Sub) + n8n Webhooks        │
│       Webhook Authentication + automation_runs Audit    │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                       DATA LAYER                        │
│         Supabase PostgreSQL + Row-Level Security         │
│          Multi-Tenant Isolated Schema Strategy          │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Multi-Tenancy Architecture

Rev AI implements a **Logical Multi-Tenancy model** built on top of Supabase PostgreSQL and Row-Level Security (RLS).

### Data Isolation Hierarchy

```text
User (Supabase Auth `auth.users`)
  └── Organization Member (`public.organization_members`)
        └── Organization (`public.organizations`)
              ├── Workflows (`public.workflows`)
              │     ├── Workflow Nodes (`public.workflow_nodes`)
              │     ├── Workflow Edges (`public.workflow_edges`)
              │     ├── Workflow Runs (`public.workflow_runs`)
              │     └── Workflow Run Steps (`public.workflow_run_steps`)
              ├── Business Profile (`public.business_profiles`)
              ├── Services (`public.services`)
              ├── Business FAQs (`public.business_faqs`)
              ├── Leads (`public.leads`)
              ├── Conversations (`public.conversations`)
              ├── Messages (`public.messages`)
              ├── Meetings (`public.meetings`)
              ├── AI Runs (`public.ai_runs`)
              └── Automation Runs (`public.automation_runs`)
```

### Core Security Invariants
1. Every business data table **must** contain an `organization_id` foreign key referencing `public.organizations(id)`.
2. Row-Level Security (RLS) is **mandatory** on all tenant tables including workflows and workflow execution runs.
3. API routes and database queries **must never** accept `organization_id` directly from client inputs without server-side verification against the authenticated user's active membership in `organization_members`.

---

## 3. Workflow Automation Engine Architecture

Rev AI's core product is an **AI-Powered Business Workflow Automation Engine**. Workflows connect event triggers, AI intelligence operations, conditional logic branches, action handlers, and execution auditing.

```text
USER
 │
 ▼
WORKFLOW BUILDER UI (/dashboard/workflows)
 │
 ▼
PERSISTED WORKFLOW GRAPH (workflows, workflow_nodes, workflow_edges)
 │
 ▼
TRIGGER EVENT (e.g. LEAD_CREATED, WEBHOOK_RECEIVED)
 │
 ▼
NODE GRAPH PIPELINE (TRIGGER -> AI -> CONDITION -> ACTION -> DELAY)
 │
 ▼
EXECUTION ENGINE & AUDITING (workflow_runs & workflow_run_steps)
```


---

## 3. Two-Person Team Architecture

To ensure parallel development velocity without merge conflicts or tight coupling:

### Person 1 — AI / Backend / Automation Engineer
- **Responsibilities:**
  - Supabase database schema & RLS policies
  - Supabase Auth integration & RBAC middleware
  - Next.js API Route Handlers & Server Actions
  - AI Layer Abstraction (`src/lib/ai/`) & Agent Execution logic
  - Event Bus & Automation Layer (`src/lib/automation/`) & n8n integration
  - Security, rate limiting, and execution auditing (`ai_runs`, `automation_runs`)

### Person 2 — Frontend / Product / UX Engineer
- **Responsibilities:**
  - Modern design system & Tailwind/shadcn UI component library
  - User Authentication & Organization Onboarding UI
  - Business Knowledge Base management interface (Services, Policies, FAQs)
  - CRM Workspace UI (Leads, Conversations, Activities, Meetings)
  - SaaS Dashboard & AI/Automation Observability views
  - Responsive layouts, state management, and UX micro-interactions

---

## 4. Directory & Project Structure

All application code resides inside `src/`. Root level strictly contains configuration, documentation, and tooling.

```text
rev-ai/
├── docs/                      # Architectural & System Documentation
│   ├── architecture.md        # System & Multi-tenant Architecture
│   ├── database.md            # PostgreSQL SQL Schema & RLS Policies
│   ├── api.md                 # API Specs & Middleware
│   ├── ai-agents.md           # AI Abstraction & Agent Specs
│   ├── automation.md          # Event Architecture & n8n Specs
│   └── development-rules.md   # Quality, Security & Git Rules
├── public/                    # Static Assets
├── src/
│   ├── app/                   # Next.js App Router (Pages, Layouts, APIs)
│   │   ├── (auth)/            # Auth Route Group (login, signup)
│   │   ├── (dashboard)/       # Dashboard Route Group (protected)
│   │   ├── (onboarding)/      # Business Onboarding Wizard
│   │   ├── api/               # Server API Route Handlers
│   │   ├── layout.tsx         # Root Layout
│   │   └── page.tsx           # Landing / Redirect Page
│   ├── components/            # UI Components
│   │   ├── ui/                # shadcn/ui primitives
│   │   ├── dashboard/         # Dashboard Widgets & Layouts
│   │   ├── onboarding/        # Onboarding Flow Components
│   │   ├── shared/            # Common Navigation, Headers, Modals
│   │   └── providers/         # React Context Providers
│   ├── lib/                   # Core Business Logic & Clients
│   │   ├── ai/                # Centralized AI Engine & Agents
│   │   ├── automation/        # Event Bus & n8n Webhook Handlers
│   │   ├── supabase/          # Supabase Browser & Server Clients
│   │   └── utils/             # Helper Functions & Formatters
│   ├── types/                 # TypeScript Type Definitions
│   │   ├── database.ts        # Database Entity Types
│   │   ├── ai.ts              # AI Execution Types
│   │   ├── automation.ts      # Event & Automation Types
│   │   └── index.ts           # Barrel Export
│   └── middleware.ts          # Supabase Session & Auth Middleware
├── TASKS.md                   # Live Project Task Tracking
├── components.json            # shadcn/ui Configuration
├── next.config.mjs            # Next.js Configuration
├── package.json               # Package Manifest & Scripts
├── tsconfig.json              # TypeScript Strict Rules
├── tailwind.config.ts         # Design Tokens & Styling Rules
└── .env.local                 # Local Environment Secrets (Git Ignored)
```
