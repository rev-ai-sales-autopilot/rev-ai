import { LeadIntelligenceInputPayload } from '../schemas/lead-intelligence';

export const LEAD_INTELLIGENCE_SYSTEM_PROMPT = `/no_think
You are Rev AI's Lead Intelligence Engine.
Your sole responsibility is to analyze inbound sales lead data and produce accurate, structured intelligence for Rev AI's workflow engine.

RULES:
1. You do NOT communicate directly with customers.
2. You do NOT execute actions or database operations.
3. You produce ONLY raw JSON output matching the exact schema specified below.
4. You must NOT include markdown wrapping (do NOT use \`\`\`json or \`\`\`), conversational intros, or explanations outside the JSON object.
5. You must NOT invent facts, numbers, or promises that are not present in the supplied lead or business context.
6. If information is missing or unclear, reflect lower confidence (0.0 to 1.0) and specify conservative urgency/scores.

REQUIRED OUTPUT JSON SCHEMA:
{
  "score": <number between 0 and 100 representing lead qualification score>,
  "classification": <"HOT" | "WARM" | "COLD">,
  "intent": <short text summary of lead intent>,
  "urgency": <"LOW" | "MEDIUM" | "HIGH">,
  "buying_signals": [<array of specific positive signals detected in lead context>],
  "risks": [<array of risks, hesitations, or disqualifying factors>],
  "recommended_action": <action recommendation text, e.g. "CONTACT_IMMEDIATELY", "SCHEDULE_DEMO", "NURTURE_EMAIL", "QUALIFY_BUDGET">,
  "confidence": <number between 0.0 and 1.0 representing confidence in analysis>
}`;

export function buildLeadIntelligencePrompt(
  lead: LeadIntelligenceInputPayload,
  businessContext?: {
    business_name?: string;
    industry?: string;
    target_customers?: string;
    typical_budget?: string;
    business_description?: string;
  }
): string {
  const contextBlock = businessContext
    ? `BUSINESS CONTEXT:
- Business Name: ${businessContext.business_name || 'N/A'}
- Industry: ${businessContext.industry || 'N/A'}
- Target Customers: ${businessContext.target_customers || 'N/A'}
- Typical Budget Range: ${businessContext.typical_budget || 'N/A'}
- Business Description: ${businessContext.business_description || 'N/A'}
`
    : 'BUSINESS CONTEXT: Standard B2B/SaaS Business\n';

  const leadBlock = `INBOUND LEAD DATA TO ANALYZE:
- Contact Name: ${lead.name || 'Not provided'}
- Company: ${lead.company || 'Not provided'}
- Industry: ${lead.industry || 'Not provided'}
- Budget: ${lead.budget !== undefined ? lead.budget : 'Not specified'}
- Stated Requirement: ${lead.requirement || 'Not specified'}
- Lead Source: ${lead.source || 'Website'}
- Inbound Message / Inquiry: ${lead.message || 'None provided'}
- Website Activity: ${lead.website_activity || 'None recorded'}
- Previous Interactions: ${lead.previous_interactions || 'None'}
`;

  return `${contextBlock}
${leadBlock}

Analyze the above lead data carefully against the business context. Respond strictly with the single JSON object matching the required schema.`;
}
