import { Env, json, error } from './types';

const SESSION_DAYS = 30;

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function login(req: Request, env: Env): Promise<Response> {
  const body = (await req.json().catch(() => null)) as { passcode?: string } | null;
  if (!body?.passcode) return error('passcode is verplicht', 400);

  if (body.passcode !== env.PASSCODE) return error('ongeldige passcode', 401);

  const token = randomToken();
  const verlooptOp = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare('INSERT INTO sessions (token, verloopt_op) VALUES (?, ?)')
    .bind(token, verlooptOp)
    .run();

  return json({ token, verlooptOp });
}

export async function logout(req: Request, env: Env): Promise<Response> {
  const token = bearerToken(req);
  if (token) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  }
  return new Response(null, { status: 204 });
}

export async function check(req: Request, env: Env): Promise<Response> {
  const ok = await isAuthenticated(req, env);
  return ok ? json({ ok: true }) : error('niet ingelogd', 401);
}

function bearerToken(req: Request): string | null {
  const header = req.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length);
}

export async function isAuthenticated(req: Request, env: Env): Promise<boolean> {
  const token = bearerToken(req);
  if (!token) return false;
  const row = await env.DB.prepare(
    "SELECT token FROM sessions WHERE token = ? AND verloopt_op > strftime('%Y-%m-%dT%H:%M:%fZ','now')"
  )
    .bind(token)
    .first();
  return row !== null;
}
