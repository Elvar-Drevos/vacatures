import { Env, json, error } from '../types';

export interface Zoekprofiel {
  id: 1;
  functie: string | null;
  functie_actief: 0 | 1;
  locatie: string | null;
  locatie_actief: 0 | 1;
  alleen_nederland: 0 | 1;
  bijgewerkt_op: string;
}

export async function getProfiel(env: Env): Promise<Zoekprofiel> {
  return (await env.DB.prepare('SELECT * FROM zoekprofiel WHERE id = 1').first()) as unknown as Zoekprofiel;
}

export async function get(env: Env): Promise<Response> {
  return json(await getProfiel(env));
}

export async function update(req: Request, env: Env): Promise<Response> {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return error('ongeldige body', 400);

  const sets: string[] = [];
  const values: unknown[] = [];
  if ('functie' in b) {
    sets.push('functie = ?');
    values.push((b.functie as string) || null);
  }
  if ('functieActief' in b) {
    sets.push('functie_actief = ?');
    values.push(b.functieActief ? 1 : 0);
  }
  if ('locatie' in b) {
    sets.push('locatie = ?');
    values.push((b.locatie as string) || null);
  }
  if ('locatieActief' in b) {
    sets.push('locatie_actief = ?');
    values.push(b.locatieActief ? 1 : 0);
  }
  if ('alleenNederland' in b) {
    sets.push('alleen_nederland = ?');
    values.push(b.alleenNederland ? 1 : 0);
  }
  if (sets.length === 0) return error('geen velden om bij te werken', 400);

  sets.push("bijgewerkt_op = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
  const row = await env.DB.prepare(`UPDATE zoekprofiel SET ${sets.join(', ')} WHERE id = 1 RETURNING *`)
    .bind(...values)
    .first();
  return json(row);
}
