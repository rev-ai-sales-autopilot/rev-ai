const OLLAMA_BASE_URL = 'http://localhost:11434';

async function testKeepAlive() {
  console.log('=== TESTING OLLAMA keep_alive: "24h" ===\n');

  // Test 1: Send request with keep_alive: "24h"
  console.log('--- Request 1 (Ensuring model loaded & set keep_alive: "24h") ---');
  const t0 = Date.now();
  const res1 = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen3.5:latest',
      prompt: 'Return exactly: OK',
      stream: false,
      think: false,
      keep_alive: '24h',
    }),
  });
  const d1 = Date.now() - t0;
  const data1 = await res1.json();
  console.log(`Duration: ${d1} ms (${(d1 / 1000).toFixed(2)}s)`);
  console.log(`Load duration: ${data1.load_duration ? (data1.load_duration / 1e9).toFixed(2) + 's' : '0s'}`);
  console.log(`Response: ${data1.response}`);

  // Test 2: Immediately send Lead Intelligence structured query (Warm Start)
  console.log('\n--- Request 2: Lead Intelligence Query (Warm Model) ---');
  const t1 = Date.now();
  const res2 = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen3.5:latest',
      system: '/no_think\nYou are a lead scoring AI. Output only valid JSON.',
      prompt: 'Analyze lead: Rahul Sharma, TechNova Solutions, Budget: 200000, Requirement: Sales automation. Return JSON: {"score":85,"classification":"HOT","intent":"Sales automation","urgency":"MEDIUM","buying_signals":["budget"],"risks":[],"recommended_action":"SCHEDULE_DEMO","confidence":0.9}',
      stream: false,
      think: false,
      keep_alive: '24h',
    }),
  });
  const d2 = Date.now() - t1;
  const data2 = await res2.json();
  console.log(`Warm Inference Duration: ${d2} ms (${(d2 / 1000).toFixed(2)}s)`);
  console.log(`Load duration: ${data2.load_duration ? (data2.load_duration / 1e9).toFixed(2) + 's' : '0s'}`);
  console.log(`Response: ${data2.response}`);
}

testKeepAlive().catch(console.error);
