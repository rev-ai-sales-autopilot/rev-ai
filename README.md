# AI Sales Autopilot

> **Your AI-Powered Sales & Automation Team**

A production-oriented, multi-tenant B2B SaaS platform designed to capture leads, understand and score them using AI, automate personalized follow-ups, manage multi-channel customer conversations, schedule meetings, and operate an autonomous sales pipeline.

---

## 📋 Table of Contents

- [1. Project Title](#1-project-title)
- [2. One-Line Description](#2-one-line-description)
- [3. Problem Statement](#3-problem-statement)
- [4. Project Goal](#4-project-goal)
- [5. Key Features](#5-key-features)
- [6. Planned Technology Stack](#6-planned-technology-stack)
- [7. Project Architecture & Workflow](#7-project-architecture--workflow)
- [8. AI Agent Capabilities](#8-ai-agent-capabilities)
- [9. Automation Capabilities](#9-automation-capabilities)
- [10. Team Collaboration](#10-team-collaboration)
- [11. Current Development Status](#11-current-development-status)
- [12. Future Improvements](#12-future-improvements)
- [13. Setup Instructions](#13-setup-instructions)
- [14. Contributors](#14-contributors)

---

## 1. Project Title

**AI Sales Autopilot**

---

## 2. One-Line Description

**Your AI-Powered Sales & Automation Team** — An event-driven, multi-tenant B2B SaaS that automates lead qualification, engagement, follow-ups, and meeting scheduling using specialized AI agents and workflow automation.

---

## 3. Problem Statement

Modern B2B sales teams face critical operational bottlenecks when scaling revenue efficiently:

1. **Slow Lead Response Times**: High-intent leads cool off rapidly when initial response times stretch into hours or days instead of seconds.
2. **Inconsistent Lead Scoring & Qualification**: Manual lead qualification causes sales teams to waste time on low-fit leads while high-value opportunities slip through the cracks.
3. **Fragmented Follow-Ups**: Sales representatives struggle with disciplined, multi-touch follow-ups across different communication channels, leading to deal slippage.
4. **Siloed Tool Stack**: CRMs, messaging platforms, scheduling tools, and AI software operate independently without unified business knowledge or real-time event-driven automation.

---

## 4. Project Goal

The primary goal of **AI Sales Autopilot** is to build a modern, multi-tenant B2B SaaS platform that operates as an autonomous sales team. Grounded in business-specific knowledge and orchestrated by an event-driven automation framework, the platform automatically captures, qualifies, nurtures, and schedules meetings with prospects while maintaining strict data isolation, complete auditability, and human oversight.

---

## 5. Key Features

- 🏢 **Multi-Tenant Architecture**: Robust organization-level data isolation utilizing Supabase PostgreSQL and Row-Level Security (RLS).
- 🧠 **AI Lead Intelligence & Scoring**: Automatic entity extraction, intent analysis, and dynamic lead scoring.
- 🤖 **Specialized AI Agents**: Modular agents tailored for lead qualification, interactive customer dialog, scheduled follow-ups, and sales analytics.
- ⚡ **Event-Driven Automation Engine**: Event dispatcher (`LEAD_CREATED`, `LEAD_BECAME_HOT`, `FOLLOWUP_DUE`, etc.) triggering automated workflows via n8n and webhooks.
- 📚 **Centralized Business Knowledge Base**: Dynamic business profiles, service catalogs, and FAQ repositories providing domain context to AI agents.
- 📥 **Unified CRM & Conversation Hub**: Comprehensive workspace for lead tracking, chat histories, activity timelines, follow-up tasks, and calendar bookings.
- 📊 **AI & Automation Observability**: Full execution auditing (`ai_runs`, `automation_runs`) for token usage, latency tracking, workflow monitoring, and operational metrics.

---

## 6. Planned Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | Next.js (App Router) | Server-rendered React application framework |
| **Language** | TypeScript | Strict type safety and schema validation across the stack |
| **Styling & UI** | Tailwind CSS + shadcn/ui | Modern, responsive, accessible component system |
| **Backend API** | Next.js Route Handlers & Server Actions | Scalable API endpoints and server-side execution |
| **Database** | Supabase PostgreSQL | Relational database engine with Row-Level Security (RLS) |
| **Authentication** | Supabase Auth | Identity management, multi-tenant session control, RBAC |
| **AI Abstraction** | Centralized LLM Provider Layer | Provider-agnostic AI agent integration (OpenAI, Anthropic, etc.) |
| **Automation Engine** | n8n + Webhooks | Visual workflow orchestration and event handling |
| **Deployment** | Vercel | Cloud platform hosting and global edge execution |
| **Version Control** | GitHub | Source control repository and collaboration workflow |
| **Development Environment** | Antigravity | AI-native IDE environment |

---

## 7. Project Architecture & Workflow

### System Architecture Flow

```
USER
  │
AUTHENTICATION
  │
ORGANIZATION
  │
BUSINESS PROFILE ──► BUSINESS KNOWLEDGE
  │
LEADS / CRM
  │
EVENT SYSTEM
  │
AUTOMATION ENGINE (n8n)
  │
AI AGENTS
  │
ACTIONS (Notifications, Messaging, CRM Updates)
  │
ANALYTICS & OBSERVABILITY
```

### Core Execution Flow

```
EVENT ──► TRIGGER ──► AUTOMATION ──► AI AGENT ──► ACTION ──► DATABASE
```

#### Example Workflow Execution

```
LEAD_CREATED Event
      │
      ▼
Automation Trigger (n8n Webhook)
      │
      ▼
AI Lead Intelligence Agent
      │
      ▼
Extract Entities & Compute Lead Score
      │
      ▼
Update CRM (Database Record & Lead Heat Level)
      │
      ▼
Notify Sales Team & Trigger Automated Follow-Up Workflow
```

### Multi-Tenant Hierarchy

```
User
  └─► Belongs to one or more Organizations
        └─► Organization Members (Role-Based Access Control)
              └─► Organization-Owned Data (Profiles, Services, FAQs, Leads, Conversations, AI Runs, Automations)
```

---

## 8. AI Agent Capabilities

The platform features an extensible architecture supporting specialized AI Agents:

1. 🔍 **Lead Intelligence Agent**
   - Parses raw incoming lead data from forms, emails, and webhooks.
   - Extracts key prospect information (company size, budget, decision-maker role, pain points).
   - Calculates real-time lead qualification scores and assigns heat levels (`HOT`, `WARM`, `COLD`).

2. 💬 **Sales Agent**
   - Conducts intelligent, natural customer conversations across multi-channel interfaces.
   - Leverages the Organization Knowledge Base (Services, FAQs, Business Profile) to deliver accurate, grounded responses.
   - Nurtures qualified leads toward setting up live meetings or product demonstrations.

3. ⏰ **Follow-up Agent**
   - Continuously monitors scheduled follow-ups and due actions.
   - Synthesizes conversation history to generate contextual, personalized follow-up messages.
   - Alerts sales team members when high-priority human intervention is required.

4. 📈 **Sales Analyst Agent**
   - Analyzes conversation flows, drop-off rates, and objection patterns.
   - Evaluates agent response effectiveness and lead conversion speeds.
   - Generates tactical insights and recommendations for sales leadership.

---

## 9. Automation Capabilities

- **Internal Event Architecture**: Pub/Sub style event dispatcher supporting core pipeline triggers:
  - `LEAD_CREATED`: New lead ingested into the CRM.
  - `LEAD_UPDATED`: Lead metadata or status modified.
  - `MESSAGE_RECEIVED`: New incoming customer communication.
  - `LEAD_BECAME_HOT`: Lead score crosses high-intent threshold.
  - `FOLLOWUP_DUE`: Scheduled follow-up trigger time reached.
  - `MEETING_BOOKED`: Prospect successfully completes calendar booking.
- **n8n Webhook Integration**: Secure, signed webhook endpoints enabling seamless workflow execution in n8n.
- **Workflow Observability**: Dedicated `automation_runs` tracking framework recording workflow name, trigger events, execution status (`success`, `failed`, `pending`), timestamps, and error logs.

---

## 10. Team Collaboration

Designed to empower sales organizations with granular multi-user governance:

### Role-Based Access Control (RBAC)

- **OWNER**: Complete administrative authority over organization settings, subscription billing, integration secrets, and team membership.
- **ADMIN**: Configures business profiles, knowledge bases, AI agent rules, and automation triggers.
- **SALES**: Manages assigned leads, handles conversations, executes follow-up actions, and oversees scheduled meetings.
- **MEMBER**: Read and write permissions strictly scoped to assigned leads and tasks.

### Workspace & Security

- Team member invitation flows with role assignment.
- Activity audit logging tracking human and AI agent actions.
- Enforced Row-Level Security (RLS) ensuring strict multi-tenant data boundaries.

---

## 11. Current Development Status

### Phase 1 — Foundation & Architecture Setup (Active)

- [x] Project architecture & repository initialization
- [x] Comprehensive technical documentation suite (`/docs`)
- [x] Clean modular project structure (`app/`, `components/`, `lib/`, `types/`, `docs/`)
- [x] Database schema & multi-tenant RLS design (Supabase PostgreSQL)
- [ ] Supabase Authentication & Organization onboarding flow
- [ ] Business Knowledge Base configuration interface
- [ ] Unified Dashboard & CRM workspace foundation
- [ ] AI provider abstraction layer (`lib/ai/`)
- [ ] Event architecture foundation (`lib/automation/`)
- [ ] n8n Webhook endpoints & agent testing

---

## 12. Future Improvements

- 📱 **Multi-Channel Communication**: Native integrations for WhatsApp Business, Email (Resend/SendGrid), SMS (Twilio), and LinkedIn.
- 📆 **Bi-Directional Calendar Sync**: Seamless booking integration with Google Calendar, Outlook, and Cal.com.
- 📞 **Voice AI Agents**: Inbound and outbound AI voice qualification callers.
- 🧠 **Advanced AI Analytics**: Token cost tracking, latency monitoring, sentiment analytics, and deal forecasting.
- 🔌 **CRM Connectors**: Pre-built integration bridges for Salesforce, HubSpot, and Pipedrive.

---

## 13. Setup Instructions

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm / pnpm / yarn**: Node package manager
- **Supabase Account**: Managed PostgreSQL & Authentication project
- **n8n Instance** *(optional for local testing)*: Self-hosted or n8n Cloud

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/rev-ai.git
   cd rev-ai
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

   # AI Provider API Keys
   OPENAI_API_KEY=your-openai-api-key

   # Automation & Webhooks
   N8N_WEBHOOK_SECRET=your-n8n-webhook-secret
   INTERNAL_EVENT_SECRET=your-internal-event-secret
   ```

4. **Database Setup**
   Execute the schema SQL definitions located in `/docs/database.md` within your Supabase SQL Query Editor to set up tables, indexes, and Row-Level Security policies.

5. **Run Development Server**
   ```bash
   npm run dev
   ```
   Access the application at [http://localhost:3000](http://localhost:3000).

---

## 14. Contributors

- **Sanika Wazarkar** — AI Automation / Full-Stack Development
- **Sufiyan Shah** — AI Automation / Full-Stack Development

---