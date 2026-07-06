import { Env, json, error } from '../types';
import { fetchFeed } from '../rss/parse';

export async function list(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare('SELECT * FROM rss_feeds ORDER BY naam').all();
  return json(results);
}

export async function create(req: Request, env: Env): Promise<Response> {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b || typeof b.naam !== 'string' || !b.naam.trim()) return error('naam is verplicht', 400);
  if (typeof b.url !== 'string' || !b.url.trim()) return error('url is verplicht', 400);

  try {
    const row = await env.DB.prepare('INSERT INTO rss_feeds (naam, url) VALUES (?, ?) RETURNING *')
      .bind(b.naam.trim(), b.url.trim())
      .first();
    return json(row, 201);
  } catch {
    return error('deze feed-url bestaat al', 409);
  }
}

export async function remove(env: Env, id: number): Promise<Response> {
  const result = await env.DB.prepare('DELETE FROM rss_feeds WHERE id = ?').bind(id).run();
  return result.meta.changes > 0 ? new Response(null, { status: 204 }) : error('feed niet gevonden', 404);
}

// Haalt de feed server-side op (geen CORS-gedoe in de browser) en geeft de
// items terug zonder iets op te slaan, zodat je kunt controleren of de feed werkt.
export async function preview(env: Env, id: number): Promise<Response> {
  const feed = (await env.DB.prepare('SELECT * FROM rss_feeds WHERE id = ?').bind(id).first()) as {
    url: string;
  } | null;
  if (!feed) return error('feed niet gevonden', 404);

  try {
    const items = await fetchFeed(feed.url);
    return json({ items });
  } catch (err) {
    return error(`feed ophalen mislukt: ${String(err)}`, 502);
  }
}
