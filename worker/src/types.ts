export interface Env {
  DB: D1Database;
  PASSCODE: string;
  ALLOWED_ORIGIN: string;
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
