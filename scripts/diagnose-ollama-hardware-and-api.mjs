import { execSync } from 'child_process';

const OLLAMA_BASE_URL = 'http://localhost:11434';

async function diagnoseAll() {
  console.log('=== STEP 1, 3, 4, 5, 6: SYSTEM & OLLAMA DIAGNOSTICS ===');

  // 1. Ollama Version
  try {
    const ver = execSync('ollama --version').toString().trim();
    console.log(`Ollama Version: ${ver}`);
  } catch (e) {
    console.error('Failed to get ollama version:', e.message);
  }

  // 2. Ollama List
  try {
    const list = execSync('ollama list').toString().trim();
    console.log(`\nOllama Installed Models:\n${list}`);
  } catch (e) {
    console.error('Failed to get ollama list:', e.message);
  }

  // 3. Ollama ps (currently loaded models)
  try {
    const psRes = await fetch(`${OLLAMA_BASE_URL}/api/ps`);
    const psData = await psRes.json();
    console.log('\nOllama Loaded Models (/api/ps):', JSON.stringify(psData, null, 2));
  } catch (e) {
    console.error('Failed /api/ps check:', e.message);
  }

  // 4. Test Native Ollama HTTP API with think: false
  console.log('\n=== STEP 2: NATIVE OLLAMA HTTP API TEST (think: false) ===');
  const t0 = Date.now();
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3.5:latest',
        prompt: 'Return exactly: OK',
        stream: false,
        think: false,
      }),
    });

    const duration = Date.now() - t0;
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Duration: ${duration} ms (${(duration / 1000).toFixed(2)}s)`);
    console.log(`Response text: ${JSON.stringify(data.response)}`);
    console.log(`Eval count (tokens): ${data.eval_count}`);
    console.log(`Load duration: ${data.load_duration ? (data.load_duration / 1e9).toFixed(2) + 's' : 'N/A'}`);
    console.log(`Prompt eval duration: ${data.prompt_eval_duration ? (data.prompt_eval_duration / 1e9).toFixed(2) + 's' : 'N/A'}`);
    console.log(`Eval duration: ${data.eval_duration ? (data.eval_duration / 1e9).toFixed(2) + 's' : 'N/A'}`);
  } catch (e) {
    console.error('Native HTTP test error:', e);
  }
}

diagnoseAll().catch(console.error);
