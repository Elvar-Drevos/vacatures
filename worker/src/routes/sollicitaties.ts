import { Env, json, error, STAGES, STATUSES } from '../types';

const SELECT_JOINED = `
  SELECT s.*, v.titel AS vacature_titel, v.bedrijf AS vacature_bedrijf, v.url AS vacature_url, v.locatie AS vacature_locatie
  FROM sollicitaties s
  JOIN vacatures v ON v.id = s.vacature_id
`;

export async function list(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  let query = SELECT_JOINED;
  const binds: unknown[] = [];
  if (status) {
    query += ' WHERE s.status = ?';
    binds.push(status);
  }
  query += ' ORDER BY s.bijgewerkt_op DESC';
  const { results } = await env.DB.prepare(query).bind(...binds).all();
  return json(results);
}

export async function get(env: Env, id: number): Promise<Response> {
  const row = await env.DB.prepare(`${SELECT_JOINED} WHERE s.id = ?`).bind(id).first();
  return row ? json(row) : error('sollicitatie niet gevonden', 404);
}

export async function create(req: Request, env: Env): Promise<Response> {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const vacatureId = Number(b?.vacatureId);
  if (!vacatureId) return error('vacatureId is verplicht', 400);

  const vacature = await env.DB.prepare('SELECT id FROM vacatures WHERE id = ?').bind(vacatureId).first();
  if (!vacature) return error('vacature niet gevonden', 404);

  const stage = typeof b?.stage === 'string' && (STAGES as readonly string[]).includes(b.stage) ? b.stage : 'interesse';
  const row = await env.DB.prepare(
    'INSERT INTO sollicitaties (vacature_id, stage, notities) VALUES (?, ?, ?) RETURNING *'
  )
    .bind(vacatureId, stage, (b?.notities as string) || null)
    .first();
  return json(row, 201);
}

export async function update(req: Request, env: Env, id: number): Promise<Response> {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return error('ongeldige body', 400);

  const sets: string[] = [];
  const values: unknown[] = [];

  if ('stage' in b) {
    if (!(STAGES as readonly string[]).includes(b.stage as string)) return error('ongeldige stage', 400);
    sets.push('stage = ?');
    values.push(b.stage);
    // Datum van solliciteren automatisch vastleggen bij de overgang naar 'gesolliciteerd'
    if (b.stage === 'gesolliciteerd') {
      sets.push("gesolliciteerd_op = COALESCE(gesolliciteerd_op, strftime('%Y-%m-%dT%H:%M:%fZ','now'))");
    }
  }
  if ('status' in b) {
    if (!(STATUSES as readonly string[]).includes(b.status as string)) return error('ongeldige status', 400);
    sets.push('status = ?');
    values.push(b.status);
  }
  if ('notities' in b) {
    sets.push('notities = ?');
    values.push((b.notities as string) || null);
  }
  if ('volgendeActieOp' in b) {
    sets.push('volgende_actie_op = ?');
    values.push((b.volgendeActieOp as string) || null);
  }
  if (sets.length === 0) return error('geen velden om bij te werken', 400);

  sets.push("bijgewerkt_op = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
  const result = await env.DB.prepare(`UPDATE sollicitaties SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...values, id)
    .run();
  if (result.meta.changes === 0) return error('sollicitatie niet gevonden', 404);

  const row = await env.DB.prepare(`${SELECT_JOINED} WHERE s.id = ?`).bind(id).first();
  return json(row);
}

export async function remove(env: Env, id: number): Promise<Response> {
  const result = await env.DB.prepare('DELETE FROM sollicitaties WHERE id = ?').bind(id).run();
  return result.meta.changes > 0 ? new Response(null, { status: 204 }) : error('sollicitatie niet gevonden', 404);
}
