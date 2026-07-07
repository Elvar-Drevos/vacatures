export interface Env {
  DB: D1Database;
  PASSCODE: string;
  ALLOWED_ORIGIN: string;
  // Optioneel: Adzuna API-sleutels (wrangler secret put ADZUNA_APP_ID / ADZUNA_APP_KEY)
  ADZUNA_APP_ID?: string;
  ADZUNA_APP_KEY?: string;
  // Workers AI (vertaling Duits → Nederlands)
  AI?: Ai;
}

export const STAGES = [
  'interesse',
  'gesolliciteerd',
  'eerste_gesprek',
  'tweede_gesprek',
  'aanbod',
] as const;

export const STATUSES = ['actief', 'aangenomen', 'afgewezen', 'ingetrokken'] as const;

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function error(message: string, status: number): Response {
  return json({ error: message }, status);
}
