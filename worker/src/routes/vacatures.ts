import { Env, json, error } from '../types';
import { getProfiel } from './zoekprofiel';

export async function list(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const archief = url.searchParams.get('archief') === '1' ? 1 : 0;
  const alles = url.searchParams.get('alles') === '1';

  let query = 'SELECT * FROM vacatures WHERE gearchiveerd = ?';
  const binds: unknown[] = [archief];

  // Actieve zoekprofiel-criteria filteren de weergave, tenzij ?alles=1
  if (!alles) {
    const profiel = await getProfiel(env);
    if (profiel.functie_actief && profiel.functie) {
      query += ' AND (titel LIKE ? OR omschrijving LIKE ?)';
      binds.push(`%${profiel.functie}%`, `%${profiel.functie}%`);
    }
    if (profiel.locatie_actief && profiel.locatie) {
      query += ' AND locatie LIKE ?';
      binds.push(`%${profiel.locatie}%`);
    }
  }

  query += ' ORDER BY aangemaakt_op DESC';
  const { results } = await env.DB.prepare(query).bind(...binds).all();
  return json(results);
}

export async function get(env: Env, id: number): Promise<Response> {
  const row = await env.DB.prepare('SELECT * FROM vacatures WHERE id = ?').bind(id).first();
  return row ? json(row) : error('vacature niet gevonden', 404);
}

export async function create(req: Request, env: Env): Promise<Response> {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b || typeof b.titel !== 'string' || !b.titel.trim()) return error('titel is verplicht', 400);
  if (typeof b.bedrijf !== 'string' || !b.bedrijf.trim()) return error('bedrijf is verplicht', 400);

  const result = await env.DB.prepare(
    `INSERT INTO vacatures (titel, bedrijf, locatie, url, omschrijving, salaris, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`
  )
    .bind(
      b.titel.trim(),
      b.bedrijf.trim(),
      (b.locatie as string) || null,
      (b.url as string) || null,
      (b.omschrijving as string) || null,
      (b.salaris as string) || null,
      (b.tags as string) || null
    )
    .first();
  return json(result, 201);
}

const PATCH_FIELDS = ['titel', 'bedrijf', 'locatie', 'url', 'omschrijving', 'salaris', 'tags', 'gearchiveerd'];

export async function update(req: Request, env: Env, id: number): Promise<Response> {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return error('ongeldige body', 400);

  const sets: string[] = [];
  const values: unknown[] = [];
  for (const field of PATCH_FIELDS) {
    if (field in b) {
      sets.push(`${field} = ?`);
      values.push(field === 'gearchiveerd' ? (b[field] ? 1 : 0) : b[field]);
    }
  }
  if (sets.length === 0) return error('geen velden om bij te werken', 400);

  sets.push("bijgewerkt_op = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
  const row = await env.DB.prepare(`UPDATE vacatures SET ${sets.join(', ')} WHERE id = ? RETURNING *`)
    .bind(...values, id)
    .first();
  return row ? json(row) : error('vacature niet gevonden', 404);
}

export async function remove(env: Env, id: number): Promise<Response> {
  await env.DB.prepare('DELETE FROM sollicitaties WHERE vacature_id = ?').bind(id).run();
  const result = await env.DB.prepare('DELETE FROM vacatures WHERE id = ?').bind(id).run();
  return result.meta.changes > 0 ? new Response(null, { status: 204 }) : error('vacature niet gevonden', 404);
}
