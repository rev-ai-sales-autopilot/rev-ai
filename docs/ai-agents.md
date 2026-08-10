<<<<<<< HEAD
# Rev AI — AI Engine & Agent Capabilities Architecture

## Overview

The AI Engine in Rev AI is built with provider-agnostic abstractions located in `src/lib/ai/`.

Business applications do not make raw fetch calls to OpenAI or Anthropic directly; all requests flow through centralized client wrappers that enforce prompt formatting, schema validation, and audit tracking in `ai_runs`.

---

## Centralized Abstraction Layer (`src/lib/ai/`)

```text
src/lib/ai/
├── client.ts         -- Abstract AIProvider interface & OpenAI provider implementation
├── prompts/          -- Structured, version-controlled prompt templates
├── agents/           -- Specialized agent wrappers
├── schemas/          -- Zod schemas for structured JSON output enforcement
└── utils/            -- Token estimation and payload sanitization
=======
# 🤖 Rev AI Agent Architecture & Observability

> **Location:** `src/lib/ai/`  
> **Provider Abstraction:** OpenAI / Anthropic / Custom Provider Agnostic Core  
> **Observability:** Audit logging via `public.ai_runs`

---

## 1. Overview & Provider Abstraction

Rev AI insulates application business logic from specific LLM vendors through a provider abstraction interface (`src/lib/ai/client.ts`).

### Architecture Diagram

```text
Application API / Events
           │
           ▼
  AI Agent Service (`src/lib/ai/agents/`)
           │
           ├── Grounding Context (Business Profile, Services, FAQs)
           ├── System Prompt (`src/lib/ai/prompts/`)
           └── Output JSON Schema (`src/lib/ai/schemas/`)
           │
           ▼
  LLM Provider Client Abstraction (`src/lib/ai/client.ts`)
           │
           ├── OpenAI API / Anthropic API / Ollama
           │
           ▼
  Execution Logger (`src/lib/ai/utils/logger.ts`)
           │
           ▼
  Write to `public.ai_runs` (Tokens, Latency, Cost, Status, Input/Output)
>>>>>>> faa4a56 (feat: initialize Day 1 project architecture, documentation, and Next.js foundation)
```

---

<<<<<<< HEAD
## Planned AI Agents

### 1. Lead Intelligence Agent
- **Purpose**: Automatic entity extraction, intent classification, and lead qualification scoring.
- **Trigger**: `LEAD_CREATED` event.
- **Input**: Raw lead text, form submissions, email body.
- **Output**: JSON payload with `extractedCompany`, `budgetRange`, `purchaseIntent`, and `score` (0-100).
- **Execution Log**: Saved to `ai_runs` table with type `lead_scoring`.

### 2. Sales Agent
- **Purpose**: Autonomous, natural customer dialog grounded in the Organization Knowledge Base.
- **Trigger**: `MESSAGE_RECEIVED` event.
- **Grounding**: Queries `business_profiles`, `services`, and `business_faqs` for the specific `organization_id`.
- **Output**: Contextually accurate response text and optional call-to-action (e.g., booking link).

### 3. Follow-up Agent
- **Purpose**: Contextual follow-up generation for stalled or nurturing leads.
- **Trigger**: `FOLLOWUP_DUE` event.
- **Output**: Customized email/message follow-up draft based on prior interactions.

### 4. Sales Analyst Agent
- **Purpose**: Aggregates interaction history across leads to produce high-level sales performance insights.
- **Output**: Conversion velocity metrics, common customer objections, and recommendations.

---

## AI Observability (`ai_runs`)

Every AI invocation creates a record in `ai_runs`:
- `organization_id`
- `type`
- `input`
- `output`
- `model`
- `tokens`
- `status` (`SUCCESS` / `FAILED`)
- `error`
=======
## 2. Specialized AI Agents Specifications

### 1. Lead Intelligence Agent (`lead-intelligence.ts`)
- **Purpose:** Analyzes unformatted inbound lead text/forms to extract metadata and calculate lead heat score (`COLD`, `WARM`, `HOT`).
- **Input:** Raw form submission, email, or webhook JSON payload.
- **Output Schema:**
  ```json
  {
    "extractedName": "Jane Doe",
    "company": "Acme Inc",
    "budgetEstimate": "$10,000 - $25,000",
    "qualificationScore": 85,
    "heatLevel": "HOT",
    "keyRequirements": ["CRM Integration", "Automated Followups"],
    "summary": "High-intent lead with enterprise budget requiring rapid follow-up."
  }
  ```

### 2. Sales Agent (`sales-agent.ts`)
- **Purpose:** Handles interactive multi-channel dialog with prospects.
- **Grounding Context:** Injects Organization Business Profile, Active Services, Pricing, Working Hours, and FAQs into system prompt.
- **Goal:** Answer prospect queries accurately without hallucination and convert prospect to book a meeting.

### 3. Follow-up Agent (`followup-agent.ts`)
- **Purpose:** Monitors stale leads and follow-up schedules to compose hyper-personalized re-engagement messages.
- **Trigger:** `FOLLOWUP_DUE` event.
- **Output:** Tailored email / SMS / WhatsApp text based on prior conversation history.

### 4. Sales Analyst Agent (`sales-analyst.ts`)
- **Purpose:** Evaluates lead pipelines, agent performance, conversion rates, and objections.
- **Output:** Executive summary and strategic recommendations for sales management.

---

## 3. AI Run Tracking & Observability (`ai_runs`)

Every LLM call is wrapped with an execution audit wrapper:

```typescript
export interface AIRunRecord {
  id?: string;
  organization_id: string;
  agent_type: 'LEAD_INTELLIGENCE' | 'SALES_AGENT' | 'FOLLOWUP_AGENT' | 'SALES_ANALYST';
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  input_payload: Record<string, any>;
  output_payload?: Record<string, any>;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING';
  error_message?: string;
  execution_time_ms: number;
}
```
>>>>>>> faa4a56 (feat: initialize Day 1 project architecture, documentation, and Next.js foundation)
