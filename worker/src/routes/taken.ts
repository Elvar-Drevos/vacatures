import { Env, json, error } from '../types';

const SELECT_JOINED = `
  SELECT t.*, v.titel AS vacature_titel, v.bedrijf AS vacature_bedrijf, s.id AS sollicitatie_id
  FROM taken t
  JOIN sollicitaties s ON s.id = t.sollicitatie_id
  JOIN vacatures v ON v.id = s.vacature_id
`;

export async function list(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const sollicitatieId = url.searchParams.get('sollicitatieId');
  let query = SELECT_JOINED;
  const binds: unknown[] = [];
  if (sollicitatieId) {
    query += ' WHERE t.sollicitatie_id = ?';
    binds.push(Number(sollicitatieId));
  }
  query += ' ORDER BY t.klaar, t.deadline IS NULL, t.deadline, t.id';
  const { results } = await env.DB.prepare(query).bind(...binds).all();
  return json(results);
}

export async function create(req: Request, env: Env): Promise<Response> {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const sollicitatieId = Number(b?.sollicitatieId);
  if (!sollicitatieId) return error('sollicitatieId is verplicht', 400);
  if (typeof b?.tekst !== 'string' || !b.tekst.trim()) return error('tekst is verplicht', 400);

  const sollicitatie = await env.DB.prepare('SELECT id FROM sollicitaties WHERE id = ?')
    .bind(sollicitatieId)
    .first();
  if (!sollicitatie) return error('sollicitatie niet gevonden', 404);

  const row = await env.DB.prepare(
    'INSERT INTO taken (sollicitatie_id, tekst, deadline) VALUES (?, ?, ?) RETURNING *'
  )
    .bind(sollicitatieId, b.tekst.trim(), (b.deadline as string) || null)
    .first();
  return json(row, 201);
}

export async function update(req: Request, env: Env, id: number): Promise<Response> {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return error('ongeldige body', 400);

  const sets: string[] = [];
  const values: unknown[] = [];
  if ('tekst' in b) {
    sets.push('tekst = ?');
    values.push(b.tekst);
  }
  if ('deadline' in b) {
    sets.push('deadline = ?');
    values.push((b.deadline as string) || null);
  }
  if ('klaar' in b) {
    sets.push('klaar = ?');
    values.push(b.klaar ? 1 : 0);
  }
  if (sets.length === 0) return error('geen velden om bij te werken', 400);

  const row = await env.DB.prepare(`UPDATE taken SET ${sets.join(', ')} WHERE id = ? RETURNING *`)
    .bind(...values, id)
    .first();
  return row ? json(row) : error('taak niet gevonden', 404);
}

export async function remove(env: Env, id: number): Promise<Response> {
  const result = await env.DB.prepare('DELETE FROM taken WHERE id = ?').bind(id).run();
  return result.meta.changes > 0 ? new Response(null, { status: 204 }) : error('taak niet gevonden', 404);
}
