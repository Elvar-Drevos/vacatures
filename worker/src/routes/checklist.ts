import { Env, json, error } from '../types';

const HERHALINGEN = ['geen', 'dagelijks', 'wekelijks'];

// Zet herhalende items die in een vorige dag/week zijn afgevinkt weer open.
// Lazy reset bij elk ophalen: geen aparte cron nodig.
async function resetHerhalendeItems(env: Env): Promise<void> {
  // Dagelijks: laatst afgevinkt vóór vandaag (UTC-dag)
  await env.DB.prepare(
    `UPDATE checklist_items SET klaar = 0
     WHERE herhaling = 'dagelijks' AND klaar = 1
       AND date(laatst_afgevinkt_op) < date('now')`
  ).run();
  // Wekelijks: laatst afgevinkt vóór maandag van deze week
  await env.DB.prepare(
    `UPDATE checklist_items SET klaar = 0
     WHERE herhaling = 'wekelijks' AND klaar = 1
       AND date(laatst_afgevinkt_op) < date('now', 'weekday 0', '-6 days')`
  ).run();
}

export async function list(env: Env): Promise<Response> {
  await resetHerhalendeItems(env);
  const { results } = await env.DB.prepare(
    'SELECT * FROM checklist_items ORDER BY categorie, volgorde, id'
  ).all();
  return json(results);
}

export async function create(req: Request, env: Env): Promise<Response> {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b || typeof b.categorie !== 'string' || !b.categorie.trim()) return error('categorie is verplicht', 400);
  if (typeof b.tekst !== 'string' || !b.tekst.trim()) return error('tekst is verplicht', 400);
  const herhaling = typeof b.herhaling === 'string' && HERHALINGEN.includes(b.herhaling) ? b.herhaling : 'geen';

  const row = await env.DB.prepare(
    `INSERT INTO checklist_items (categorie, tekst, herhaling, volgorde)
     VALUES (?, ?, ?, COALESCE((SELECT MAX(volgorde) + 1 FROM checklist_items WHERE categorie = ?), 0))
     RETURNING *`
  )
    .bind(b.categorie.trim(), b.tekst.trim(), herhaling, b.categorie.trim())
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
  if ('categorie' in b) {
    sets.push('categorie = ?');
    values.push(b.categorie);
  }
  if ('herhaling' in b) {
    if (!HERHALINGEN.includes(b.herhaling as string)) return error('ongeldige herhaling', 400);
    sets.push('herhaling = ?');
    values.push(b.herhaling);
  }
  if ('klaar' in b) {
    sets.push('klaar = ?');
    values.push(b.klaar ? 1 : 0);
    if (b.klaar) {
      sets.push("laatst_afgevinkt_op = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
    }
  }
  if ('volgorde' in b) {
    sets.push('volgorde = ?');
    values.push(Number(b.volgorde) || 0);
  }
  if (sets.length === 0) return error('geen velden om bij te werken', 400);

  const row = await env.DB.prepare(`UPDATE checklist_items SET ${sets.join(', ')} WHERE id = ? RETURNING *`)
    .bind(...values, id)
    .first();
  return row ? json(row) : error('checklist-item niet gevonden', 404);
}

export async function remove(env: Env, id: number): Promise<Response> {
  const result = await env.DB.prepare('DELETE FROM checklist_items WHERE id = ?').bind(id).run();
  return result.meta.changes > 0 ? new Response(null, { status: 204 }) : error('checklist-item niet gevonden', 404);
}
