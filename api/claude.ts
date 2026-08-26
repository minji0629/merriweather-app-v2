import type { IncomingMessage, ServerResponse } from 'node:http';

type NextApiRequest = IncomingMessage & { body?: any; query?: any };
type NextApiResponse = ServerResponse & {
  status(code: number): this;
  json(body: any): void;
};

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1000;

function sendJson(res: NextApiResponse, status: number, body: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function readBody(req: NextApiRequest): Promise<any> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const body = await readBody(req);
  const prompt: string | undefined = body?.prompt;
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return sendJson(res, 400, { error: "Missing or invalid 'prompt' field" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[api/claude] ANTHROPIC_API_KEY env var not set');
    return sendJson(res, 500, { error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const apiRes = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('[api/claude] Anthropic API error:', apiRes.status, errText);
      return sendJson(res, 502, {
        error: `Claude API error (${apiRes.status})`,
        detail: errText,
      });
    }

    const data = await apiRes.json();
    const text: string | undefined = data?.content?.[0]?.text;
    if (typeof text !== 'string') {
      console.error('[api/claude] Unexpected response shape:', JSON.stringify(data));
      return sendJson(res, 502, { error: 'Unexpected response from Claude' });
    }

    return sendJson(res, 200, { text: text.trim() });
  } catch (err) {
    console.error('[api/claude] Request failed:', err);
    return sendJson(res, 500, {
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
