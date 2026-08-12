const OLLAMA_BASE_URL = 'http://localhost:11434';

async function testOllamaNative() {
  console.log('=== STEP 3 & 4: TESTING NATIVE OLLAMA API ===');

  // Check /api/ps (running models)
  const psRes = await fetch(`${OLLAMA_BASE_URL}/api/ps`);
  const psData = await psRes.json();
  console.log('\nRunning Models (/api/ps):', psData);

  // Check /api/tags (available models)
  const tagsRes = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
  const tagsData = await tagsRes.json();
  console.log('\nInstalled Models (/api/tags):', tagsData.models?.map((m) => m.name));

  // Run warm start HTTP test with minimal payload
  console.log('\n--- Running Warm Start HTTP Request (stream: false) ---');
  const startTime = Date.now();
  const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen3.5:latest',
      prompt: 'Return exactly: OK',
      stream: false,
    }),
  });

  const durationMs = Date.now() - startTime;
  const data = await res.json();

  console.log(`\nStatus: ${res.status}`);
  console.log(`Response text: ${JSON.stringify(data.response)}`);
  console.log(`Total Duration: ${durationMs} ms (${(durationMs / 1000).toFixed(2)} seconds)`);
  console.log(`Eval count (tokens): ${data.eval_count}`);
  console.log(`Eval duration: ${data.eval_duration ? (data.eval_duration / 1e9).toFixed(2) + 's' : 'N/A'}`);
  console.log(`Load duration: ${data.load_duration ? (data.load_duration / 1e9).toFixed(2) + 's' : 'N/A'}`);
}

testOllamaNative().catch(console.error);
