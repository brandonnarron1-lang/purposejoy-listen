interface Env {
  DB: D1Database;
  BUTTONDOWN_API_KEY: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_SOURCES = ['modal', 'footer', 'other'] as const;
type Source = typeof ALLOWED_SOURCES[number];

async function hashIp(ip: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(ip + 'purposejoy-salt')
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://listen.purposejoy.org',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://listen.purposejoy.org',
    'Content-Type': 'application/json',
  };

  const ok = (msg: string) =>
    new Response(JSON.stringify({ success: true, message: msg }), {
      status: 200,
      headers: corsHeaders,
    });

  const err = (msg: string, status = 400) =>
    new Response(JSON.stringify({ success: false, error: msg }), {
      status,
      headers: corsHeaders,
    });

  // Parse body
  let body: { email?: string; source?: string };
  try {
    body = await request.json();
  } catch {
    return err('Invalid JSON');
  }

  const email = (body.email ?? '').trim().toLowerCase();
  const source = (body.source ?? 'other') as Source;

  if (!EMAIL_RE.test(email)) return err('Invalid email address');
  if (!ALLOWED_SOURCES.includes(source)) return err('Invalid source');

  // Rate limit: 1 subscribe attempt per minute per IP-hash
  const rawIp =
    request.headers.get('CF-Connecting-IP') ??
    request.headers.get('X-Forwarded-For') ??
    'unknown';
  const ipHash = await hashIp(rawIp);

  const recent = await env.DB.prepare(
    `SELECT COUNT(*) as cnt FROM subscribers
     WHERE ip_hash = ? AND subscribed_at > datetime('now', '-1 minute')`
  )
    .bind(ipHash)
    .first<{ cnt: number }>();

  if ((recent?.cnt ?? 0) > 0) {
    return err('Too many requests — please wait a moment', 429);
  }

  // Check for existing subscriber
  const existing = await env.DB.prepare(
    'SELECT id, buttondown_status FROM subscribers WHERE email = ?'
  )
    .bind(email)
    .first<{ id: number; buttondown_status: string }>();

  if (existing) {
    return ok("You're already on the list — check your inbox to confirm!");
  }

  // Call Buttondown
  let buttondownId: string | null = null;
  let buttondownStatus = 'pending';

  try {
    const bdRes = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Token ${env.BUTTONDOWN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        tags: [`source:${source}`, 'purposejoy-listen'],
      }),
    });

    if (bdRes.ok) {
      const bdData = (await bdRes.json()) as { id?: string; status?: string };
      buttondownId = bdData.id ?? null;
      buttondownStatus = bdData.status ?? 'subscribed';
    } else {
      // Buttondown returned error — still mirror to D1 as pending
      buttondownStatus = 'buttondown_error';
    }
  } catch {
    buttondownStatus = 'buttondown_unreachable';
  }

  // Mirror to D1
  const ua = request.headers.get('User-Agent') ?? null;
  await env.DB.prepare(
    `INSERT INTO subscribers (email, source, ip_hash, user_agent, buttondown_id, buttondown_status)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET
       buttondown_id = excluded.buttondown_id,
       buttondown_status = excluded.buttondown_status`
  )
    .bind(email, source, ipHash, ua, buttondownId, buttondownStatus)
    .run();

  return ok("Check your inbox to confirm — and thanks for being here 🙏");
};
