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
```

---

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
