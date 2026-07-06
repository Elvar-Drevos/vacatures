import { getToken, clearToken, setToken } from './auth';
import type { Vacature, Sollicitatie, ChecklistItem, Taak, Zoekprofiel, RssFeed, ZoekRunResultaat } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && path !== '/api/auth/login') {
    clearToken();
    window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/login/`;
    throw new ApiError('niet ingelogd', 401);
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(body?.error ?? `fout ${res.status}`, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// --- Auth ---
export async function login(passcode: string): Promise<void> {
  const { token } = await apiFetch<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ passcode }),
  });
  setToken(token);
}

export function checkAuth(): Promise<{ ok: boolean }> {
  return apiFetch('/api/auth/check');
}

// --- Vacatures ---
export function listVacatures(opties: { archief?: boolean; alles?: boolean } = {}): Promise<Vacature[]> {
  return apiFetch(`/api/vacatures?archief=${opties.archief ? 1 : 0}&alles=${opties.alles ? 1 : 0}`);
}

export function getVacature(id: number): Promise<Vacature> {
  return apiFetch(`/api/vacatures/${id}`);
}

export function createVacature(data: Partial<Vacature>): Promise<Vacature> {
  return apiFetch('/api/vacatures', { method: 'POST', body: JSON.stringify(data) });
}

export function updateVacature(id: number, data: Partial<Vacature>): Promise<Vacature> {
  return apiFetch(`/api/vacatures/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function deleteVacature(id: number): Promise<void> {
  return apiFetch(`/api/vacatures/${id}`, { method: 'DELETE' });
}

// --- Sollicitaties ---
export function listSollicitaties(): Promise<Sollicitatie[]> {
  return apiFetch('/api/sollicitaties');
}

export function getSollicitatie(id: number): Promise<Sollicitatie> {
  return apiFetch(`/api/sollicitaties/${id}`);
}

export function createSollicitatie(vacatureId: number): Promise<Sollicitatie> {
  return apiFetch('/api/sollicitaties', { method: 'POST', body: JSON.stringify({ vacatureId }) });
}

export function updateSollicitatie(
  id: number,
  data: { stage?: string; status?: string; notities?: string; volgendeActieOp?: string | null }
): Promise<Sollicitatie> {
  return apiFetch(`/api/sollicitaties/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function deleteSollicitatie(id: number): Promise<void> {
  return apiFetch(`/api/sollicitaties/${id}`, { method: 'DELETE' });
}

// --- Checklist ---
export function listChecklist(): Promise<ChecklistItem[]> {
  return apiFetch('/api/checklist');
}

export function createChecklistItem(categorie: string, tekst: string, herhaling = 'geen'): Promise<ChecklistItem> {
  return apiFetch('/api/checklist', { method: 'POST', body: JSON.stringify({ categorie, tekst, herhaling }) });
}

export function updateChecklistItem(id: number, data: Partial<ChecklistItem>): Promise<ChecklistItem> {
  return apiFetch(`/api/checklist/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function deleteChecklistItem(id: number): Promise<void> {
  return apiFetch(`/api/checklist/${id}`, { method: 'DELETE' });
}

// --- Taken ---
export function listTaken(sollicitatieId?: number): Promise<Taak[]> {
  return apiFetch(`/api/taken${sollicitatieId ? `?sollicitatieId=${sollicitatieId}` : ''}`);
}

export function createTaak(sollicitatieId: number, tekst: string, deadline?: string): Promise<Taak> {
  return apiFetch('/api/taken', {
    method: 'POST',
    body: JSON.stringify({ sollicitatieId, tekst, deadline: deadline || null }),
  });
}

export function updateTaak(id: number, data: { tekst?: string; deadline?: string | null; klaar?: boolean }): Promise<Taak> {
  return apiFetch(`/api/taken/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function deleteTaak(id: number): Promise<void> {
  return apiFetch(`/api/taken/${id}`, { method: 'DELETE' });
}

// --- Zoekprofiel ---
export function getZoekprofiel(): Promise<Zoekprofiel> {
  return apiFetch('/api/zoekprofiel');
}

export function updateZoekprofiel(data: {
  functie?: string;
  functieActief?: boolean;
  locatie?: string;
  locatieActief?: boolean;
}): Promise<Zoekprofiel> {
  return apiFetch('/api/zoekprofiel', { method: 'PATCH', body: JSON.stringify(data) });
}

// --- RSS-feeds & zoeken ---
export function listFeeds(): Promise<RssFeed[]> {
  return apiFetch('/api/feeds');
}

export function createFeed(naam: string, url: string): Promise<RssFeed> {
  return apiFetch('/api/feeds', { method: 'POST', body: JSON.stringify({ naam, url }) });
}

export function deleteFeed(id: number): Promise<void> {
  return apiFetch(`/api/feeds/${id}`, { method: 'DELETE' });
}

export function runZoeken(): Promise<ZoekRunResultaat[]> {
  return apiFetch('/api/zoeken/run', { method: 'POST' });
}
