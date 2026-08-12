const SUPABASE_URL = 'https://nuyszoevzldbtzuydgdp.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function inspectFullLeadsSchema() {
  console.log('=== STEP 1 & 3: INSPECTING CONNECTED SUPABASE PROJECT SCHEMA ===');
  console.log('Project URL:', SUPABASE_URL);

  // 1. Fetch OpenAPI spec to check what PostgREST / Supabase Data API currently exposes
  const specRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Accept': 'application/openapi+json',
    },
  });

  if (!specRes.ok) {
    console.error('Failed to fetch OpenAPI spec:', specRes.status, await specRes.text());
    return;
  }

  const spec = await specRes.json();
  const leadsProps = spec.definitions?.leads?.properties || {};

  console.log('\n--- Columns Exposed by Supabase Data API (PostgREST) ---');
  console.table(
    Object.entries(leadsProps).map(([col, def]) => ({
      column_name: col,
      type: def.type || 'unknown',
      format: def.format || 'none',
      default: def.default ?? null,
    }))
  );

  console.log('\nDoes "budget" exist in PostgREST OpenAPI spec?:', 'budget' in leadsProps);
  console.log('Does "name" exist in PostgREST OpenAPI spec?:', 'name' in leadsProps);
  console.log('Does "priority" exist in PostgREST OpenAPI spec?:', 'priority' in leadsProps);
  console.log('Does "ai_score" exist in PostgREST OpenAPI spec?:', 'ai_score' in leadsProps);
}

inspectFullLeadsSchema().catch(console.error);
