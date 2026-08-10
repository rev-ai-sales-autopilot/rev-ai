# Rev AI — Database Architecture & Schema Specification

## Overview

The Rev AI database layer uses **Supabase PostgreSQL** with Row-Level Security (RLS) to enforce strict multi-tenant data boundaries.

All tables use `uuid_generate_v4()` for primary keys, include `created_at` / `updated_at` timestamps, and enforce explicit foreign key cascades.

---

## Entity Relationship Blueprint

### 1. SaaS Authentication & Multi-Tenancy

#### `users`
- `id` (uuid, primary key, references auth.users)
- `email` (text, unique, not null)
- `name` (text)
- `created_at` (timestamptz, default now())

#### `organizations`
- `id` (uuid, primary key, default gen_random_uuid())
- `name` (text, not null)
- `industry` (text)
- `website` (text)
- `description` (text)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

#### `organization_members`
- `id` (uuid, primary key, default gen_random_uuid())
- `organization_id` (uuid, references organizations(id) on delete cascade, not null)
- `user_id` (uuid, references users(id) on delete cascade, not null)
- `role` (text, check role in ('OWNER', 'ADMIN', 'SALES', 'MEMBER'), not null)
- `created_at` (timestamptz, default now())
- Unique constraint: (`organization_id`, `user_id`)

---

### 2. Business Knowledge Base

#### `business_profiles`
- `id` (uuid, primary key, default gen_random_uuid())
- `organization_id` (uuid, references organizations(id) on delete cascade, unique, not null)
- `business_name` (text, not null)
- `industry` (text)
- `website` (text)
- `business_description` (text)
- `business_email` (text)
- `business_phone` (text)
- `working_hours` (text)
- `payment_terms` (text)
- `refund_policy` (text)
- `service_areas` (text)
- `target_customers` (text)
- `typical_budget` (text)
- `common_requirements` (text)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

#### `services`
- `id` (uuid, primary key, default gen_random_uuid())
- `organization_id` (uuid, references organizations(id) on delete cascade, not null)
- `service_name` (text, not null)
- `description` (text)
- `starting_price` (text)
- `delivery_time` (text)
- `created_at` (timestamptz, default now())

#### `business_faqs`
- `id` (uuid, primary key, default gen_random_uuid())
- `organization_id` (uuid, references organizations(id) on delete cascade, not null)
- `question` (text, not null)
- `answer` (text, not null)
- `category` (text)
- `created_at` (timestamptz, default now())

---

### 3. CRM & Lead Management

#### `leads`
- `id` (uuid, primary key, default gen_random_uuid())
- `organization_id` (uuid, references organizations(id) on delete cascade, not null)
- `name` (text, not null)
- `email` (text)
- `phone` (text)
- `company` (text)
- `status` (text, check status in ('NEW', 'QUALIFIED', 'HOT', 'NURTURING', 'CONVERTED', 'LOST'), default 'NEW')
- `score` (integer, default 0)
- `metadata` (jsonb, default '{}'::jsonb)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

#### `conversations` & `messages`
- Track multi-channel dialogs linked to `organization_id` and `lead_id`.

#### `activities`, `followups`, `meetings`
- Track tasks, reminders, activity logs, and calendar bookings linked to `organization_id`.

---

### 4. Observability & Auditing

#### `ai_runs`
- `id` (uuid, primary key, default gen_random_uuid())
- `organization_id` (uuid, references organizations(id) on delete cascade, not null)
- `type` (text, not null) -- e.g., 'lead_scoring', 'sales_dialog'
- `input` (jsonb, not null)
- `output` (jsonb)
- `model` (text, not null)
- `tokens` (integer)
- `status` (text, check status in ('PENDING', 'SUCCESS', 'FAILED'), not null)
- `error` (text)
- `created_at` (timestamptz, default now())

#### `automation_runs`
- `id` (uuid, primary key, default gen_random_uuid())
- `organization_id` (uuid, references organizations(id) on delete cascade, not null)
- `workflow` (text, not null) -- e.g., 'new_lead_analysis'
- `trigger` (text, not null) -- e.g., 'lead_created'
- `status` (text, check status in ('PENDING', 'SUCCESS', 'FAILED'), not null)
- `error` (text)
- `started_at` (timestamptz, default now())
- `completed_at` (timestamptz)

---

## Row-Level Security (RLS) Blueprint

```sql
-- Helper function to verify user membership in an organization
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example RLS Policy for leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access org leads" ON leads
  FOR ALL
  USING (is_org_member(organization_id));
```
