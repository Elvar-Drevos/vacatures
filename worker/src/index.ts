import { Env, error, json } from './types';
import * as auth from './auth';
import * as vacatures from './routes/vacatures';
import * as sollicitaties from './routes/sollicitaties';
import * as checklist from './routes/checklist';
import * as taken from './routes/taken';
import * as zoekprofiel from './routes/zoekprofiel';
import * as feeds from './routes/feeds';
import { zoekAlleBronnen } from './zoeken';

function corsHeaders(env: Env): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

async function route(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const method = req.method;
  const path = url.pathname.replace(/\/$/, '');

  // --- Auth (geen token vereist voor login) ---
  if (method === 'POST' && path === '/api/auth/login') return auth.login(req, env);

  if (!(await auth.isAuthenticated(req, env))) return error('niet ingelogd', 401);

  if (method === 'POST' && path === '/api/auth/logout') return auth.logout(req, env);
  if (method === 'GET' && path === '/api/auth/check') return auth.check(req, env);

  // --- Vacatures ---
  let m = path.match(/^\/api\/vacatures(?:\/(\d+))?$/);
  if (m) {
    const id = m[1] ? Number(m[1]) : null;
    if (!id) {
      if (method === 'GET') return vacatures.list(req, env);
      if (method === 'POST') return vacatures.create(req, env);
    } else {
      if (method === 'GET') return vacatures.get(env, id);
      if (method === 'PATCH') return vacatures.update(req, env, id);
      if (method === 'DELETE') return vacatures.remove(env, id);
    }
  }

  // --- Sollicitaties ---
  m = path.match(/^\/api\/sollicitaties(?:\/(\d+))?$/);
  if (m) {
    const id = m[1] ? Number(m[1]) : null;
    if (!id) {
      if (method === 'GET') return sollicitaties.list(req, env);
      if (method === 'POST') return sollicitaties.create(req, env);
    } else {
      if (method === 'GET') return sollicitaties.get(env, id);
      if (method === 'PATCH') return sollicitaties.update(req, env, id);
      if (method === 'DELETE') return sollicitaties.remove(env, id);
    }
  }

  // --- Checklist ---
  m = path.match(/^\/api\/checklist(?:\/(\d+))?$/);
  if (m) {
    const id = m[1] ? Number(m[1]) : null;
    if (!id) {
      if (method === 'GET') return checklist.list(env);
      if (method === 'POST') return checklist.create(req, env);
    } else {
      if (method === 'PATCH') return checklist.update(req, env, id);
      if (method === 'DELETE') return checklist.remove(env, id);
    }
  }

  // --- Taken ---
  m = path.match(/^\/api\/taken(?:\/(\d+))?$/);
  if (m) {
    const id = m[1] ? Number(m[1]) : null;
    if (!id) {
      if (method === 'GET') return taken.list(req, env);
      if (method === 'POST') return taken.create(req, env);
    } else {
      if (method === 'PATCH') return taken.update(req, env, id);
      if (method === 'DELETE') return taken.remove(env, id);
    }
  }

  // --- Zoekprofiel ---
  if (path === '/api/zoekprofiel') {
    if (method === 'GET') return zoekprofiel.get(env);
    if (method === 'PATCH') return zoekprofiel.update(req, env);
  }

  // --- RSS-feeds ---
  m = path.match(/^\/api\/feeds(?:\/(\d+))?(\/preview)?$/);
  if (m) {
    const id = m[1] ? Number(m[1]) : null;
    if (!id) {
      if (method === 'GET') return feeds.list(env);
      if (method === 'POST') return feeds.create(req, env);
    } else if (m[2]) {
      if (method === 'POST') return feeds.preview(env, id);
    } else {
      if (method === 'DELETE') return feeds.remove(env, id);
    }
  }

  // --- Handmatig een zoekrun starten ("Zoek nu") ---
  if (method === 'POST' && path === '/api/zoeken/run') {
    return json(await zoekAlleBronnen(env));
  }

  return error('niet gevonden', 404);
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    let response: Response;
    try {
      response = await route(req, env);
    } catch (err) {
      console.error(err);
      response = error('interne fout', 500);
    }

    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders(env))) {
      headers.set(key, value);
    }
    return new Response(response.body, { status: response.status, headers });
  },

  // Dagelijkse cron: haalt alle RSS-feeds en scrapers op
  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    const resultaten = await zoekAlleBronnen(env);
    console.log('zoekrun klaar:', JSON.stringify(resultaten));
  },
} satisfies ExportedHandler<Env>;
