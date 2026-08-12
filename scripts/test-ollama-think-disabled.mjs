const OLLAMA_BASE_URL = 'http://localhost:11434';

async function testOllamaWithThinkDisabled() {
  console.log('=== STEP 6: TESTING NATIVE OLLAMA WITH think: false ===\n');

  const tests = [
    {
      label: 'Test A: Simple OK (think: false)',
      body: { model: 'qwen3.5:latest', prompt: 'Return exactly: OK', stream: false, think: false },
    },
    {
      label: 'Test B: Structured JSON (think: false)',
      body: {
        model: 'qwen3.5:latest',
        prompt: 'Return exactly this JSON object:\n{"status":"ok"}\nNothing else.',
        stream: false,
        think: false,
        options: { temperature: 0.1 },
      },
    },
    {
      label: 'Test C: Lead Intelligence Structured JSON (think: false)',
      body: {
        model: 'qwen3.5:latest',
        system: '/no_think\nYou are a lead scoring AI. Output only valid JSON.',
        prompt: `Analyze this lead and return JSON:
Lead: Rahul Sharma, TechNova Solutions, Budget: 200000, Requirement: Sales automation

Output ONLY this JSON (no markdown, no explanation):
{"score":0-100,"classification":"HOT|WARM|COLD","intent":"text","urgency":"LOW|MEDIUM|HIGH","buying_signals":[],"risks":[],"recommended_action":"text","confidence":0.0-1.0}`,
        stream: false,
        think: false,
        options: { temperature: 0.2 },
      },
    },
  ];

  for (const test of tests) {
    console.log(`--- ${test.label} ---`);
    const t0 = Date.now();
    try {
      const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.body),
      });
      const durationMs = Date.now() - t0;
      const data = await res.json();
      console.log(`Status: ${res.status}`);
      console.log(`Duration: ${durationMs} ms (${(durationMs / 1000).toFixed(2)}s)`);
      console.log(`Tokens (eval_count): ${data.eval_count}`);
      console.log(`Thinking tokens (thinking_token_count): ${data.thinking_token_count ?? 'N/A'}`);
      console.log(`Response: ${JSON.stringify(data.response?.slice(0, 300))}`);
      console.log('');
    } catch (e) {
      const durationMs = Date.now() - t0;
      console.error(`FAILED after ${durationMs}ms:`, e.message);
      console.log('');
    }
  }
}

testOllamaWithThinkDisabled().catch(console.error);
