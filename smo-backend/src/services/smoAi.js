// HTTP wrapper for the smo-ai service.
// Every call is wrapped in try/catch — if the AI service is down,
// callers get null back and the main backend keeps working.
const BASE = process.env.SMO_AI_URL || 'http://localhost:3100';
const SECRET = process.env.SMO_AI_SECRET;

async function post(path, body, timeoutMs = 45000) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(SECRET && { 'x-internal-secret': SECRET }),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs), // Now waits up to 45 seconds
  });
  if (res.status === 429) {
    console.warn('[WARN] smo-ai rate limited (Groq 429)', { path }); // Modified
    return { rateLimited: true };
  }
  if (!res.ok) throw new Error(`smo-ai ${path} returned ${res.status}`);
  return res.json();
}

async function suggestTags(title) {
  try {
    return await post('/tags', { title });
  } catch (err) {
    console.error('[ERROR] smoAi.suggestTags failed', { error: err.message }); // Modified
    return null;
  }
}

async function health() {
  try {
    const res = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

module.exports = { suggestTags, health };