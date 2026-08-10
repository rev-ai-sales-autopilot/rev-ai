# Rev AI — Product & System Architecture

## Overview

**Rev AI — AI Sales Autopilot** is a production-oriented, multi-tenant B2B SaaS platform designed to capture leads, score and qualify them using AI, automate follow-up workflows, manage customer conversations, and operate an autonomous sales pipeline.

## Architectural Layers

The system is structured around five cleanly decoupled layers:

```text
┌─────────────────────────────┐
│        FRONTEND             │  Next.js 15 (App Router) + Tailwind CSS + shadcn/ui
│       UI / Client           │  Responsive B2B Dashboard & Workspaces
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│       APPLICATION API       │  Next.js Server Actions & Route Handlers
│     Backend Business Logic  │  Zod Input Validation & Auth Guarding
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│         AI ENGINE           │  Centralized LLM Provider Abstraction
│   Prompts + Agent Orchestr. │  Lead Intelligence, Sales, & Analyst Agents
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│      AUTOMATION ENGINE      │  n8n Integration + Webhooks
│    Internal Event Bus       │  Event Dispatcher (LEAD_CREATED, etc.)
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│        DATA LAYER           │  Supabase PostgreSQL with Row-Level Security (RLS)
│      Storage & Auth         │  Strict Multi-Tenant Isolation
└─────────────────────────────┘
```

## Core Execution Principle

```text
EVENT ──► TRIGGER ──► AUTOMATION ──► AI AGENT ──► ACTION ──► DATABASE
```

### Execution Example

```text
LEAD_CREATED Event
      │
      ▼
Automation Trigger (n8n Webhook)
      │
      ▼
AI Lead Intelligence Agent
      │
      ▼
Extract Metadata + Calculate Lead Score
      │
      ▼
Update CRM (Database & Lead Status)
      │
      ▼
Notify Sales Team
```

## Multi-Tenant Architecture & Data Hierarchy

Rev AI is designed as a multi-tenant SaaS from day one.

```text
User (Supabase Auth Identity)
  └─► Belongs to one or more Organizations
        └─► Organization Members (OWNER, ADMIN, SALES, MEMBER)
              └─► Organization-Owned Entities (business_profiles, services, faqs, leads, conversations, messages, activities, followups, meetings, ai_runs, automation_runs)
```

Every organization-owned table contains `organization_id` as a non-nullable foreign key protected by PostgreSQL Row Level Security (RLS) policies. Client applications can never bypass tenant isolation.

## Security Principles

1. **Database Row Level Security (RLS)**: Mandatory on all organization tables.
2. **Server-Side Secrets**: Service-role keys, OpenAI keys, and webhook secrets reside exclusively in server environments.
3. **No Client Trust**: Organization IDs and user roles are verified server-side via Supabase Auth JWT token inspection.
