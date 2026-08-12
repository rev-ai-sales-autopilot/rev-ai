# 🤖 Rev AI Qwen Sales Intelligence Engine & Agent Architecture

> **Location:** `src/lib/ai/`  
> **Primary Provider Engine:** Ollama (`qwen3.5:latest`)  
> **Provider Abstraction:** Agnostic provider client (`src/lib/ai/client.ts`) supporting Ollama, OpenAI, Anthropic, Gemini  
> **Validation & Security:** Strict Zod schema parsing & Multi-tenant organization isolation  
> **Observability:** Audit logging via `public.ai_runs`

---

## 🏛️ Core Architectural Principle

> **"AI recommends and classifies; the workflow engine validates and executes."**

- **Qwen 3.5 is the BRAIN:** It processes inbound lead context, extracts signals, calculates qualification scores, and produces structured decisions.
- **Workflow Engine is the EXECUTOR:** AI outputs are UNTRUSTED DATA until validated by Zod and evaluated by the workflow engine. Qwen NEVER directly executes database mutations, email sends, messaging, shell commands, or permissions changes.

---

## 1. Overview & Provider Abstraction

Rev AI insulates application business logic from specific LLM vendors through a clean provider abstraction interface (`src/lib/ai/client.ts`).

### Architecture Diagram

```text
Application Event / Webhook / API (`POST /api/ai/lead-intelligence`)
           │
           ▼
  Multi-Tenant Auth & Membership Verification (`organization_members`)
           │
           ▼
  Lead Intelligence Agent (`src/lib/ai/agents/lead-intelligence.ts`)
           │
           ├── Grounding Context (Business Profile, Services, FAQs)
           ├── System Prompt (`src/lib/ai/prompts/lead-intelligence.ts`)
           └── Zod JSON Schema (`src/lib/ai/schemas/lead-intelligence.ts`)
           │
           ▼
  AI Client Abstraction (`src/lib/ai/client.ts`)
           │
           ▼
  Ollama Provider (`src/lib/ai/providers/ollama.ts`)
           │
           ▼
  Ollama Server (`http://localhost:11434` / `qwen3.5:latest`)
           │
           ▼
  JSON Extraction & Zod Schema Validation
           │
           ▼
  Execution Audit Logger (`src/lib/ai/utils/logger.ts`) -> `public.ai_runs`
           │
           ▼
  Structured Decision Returned to Workflow Engine
```

---

## 2. Lead Intelligence Agent Specification

### Purpose
Analyzes unformatted inbound lead text/forms against organization business context to produce structured qualification decisions, heat level (`COLD`, `WARM`, `HOT`), buying signals, risks, and recommended actions.

### Inbound Payload (`LeadIntelligenceInputPayload`)
```json
{
  "name": "Rahul Sharma",
  "company": "Example Technologies",
  "industry": "SaaS",
  "budget": 200000,
  "requirement": "Sales automation",
  "source": "Website",
  "message": "We urgently need to automate our sales process."
}
```

### Zod Validated Output Schema (`LeadIntelligenceSchema`)
```typescript
{
  score: number; // 0 - 100
  classification: 'HOT' | 'WARM' | 'COLD';
  intent: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  buying_signals: string[];
  risks: string[];
  recommended_action: string;
  confidence: number; // 0.0 - 1.0
}
```

---

## 3. AI Run Tracking & Observability (`public.ai_runs`)

Every LLM execution is wrapped with an audit logging function (`logAIRun`):

```sql
SELECT id, organization_id, agent_type, model, prompt_tokens, completion_tokens,
       total_tokens, status, execution_time_ms, created_at
FROM public.ai_runs
ORDER BY created_at DESC;
```

---

## 4. Multi-Tenant Security & Isolation Boundary

1. **No direct browser calls:** The browser NEVER communicates directly with `http://localhost:11434`. All LLM calls execute server-side.
2. **Authorized Organization Context:** The server verifies `organization_members` before retrieving business profiles or lead data.
3. **Payload Sanitization:** Passwords, API keys, cookies, and tokens are redacted before logging to `public.ai_runs`.
