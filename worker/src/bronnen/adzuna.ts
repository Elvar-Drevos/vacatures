// Adzuna: officiële gratis vacature-API die veel Nederlandse jobboards
// aggregeert (developer.adzuna.com). Werkt alleen als de secrets
// ADZUNA_APP_ID en ADZUNA_APP_KEY zijn ingesteld; anders wordt deze bron
// stilletjes overgeslagen.

import type { KandidaatVacature } from '../scrapers/common';
import { stripHtml } from '../scrapers/common';
import type { Zoekprofiel } from '../routes/zoekprofiel';

export const naam = 'adzuna';

interface AdzunaResult {
  title?: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  redirect_url?: string;
  description?: string;
}

export async function zoek(
  profiel: Zoekprofiel,
  appId: string,
  appKey: string
): Promise<KandidaatVacature[]> {
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: '50',
    sort_by: 'date',
    max_days_old: '14',
  });
  if (profiel.functie_actief && profiel.functie) params.set('what', profiel.functie);
  if (profiel.locatie_actief && profiel.locatie) params.set('where', profiel.locatie);

  const res = await fetch(`https://api.adzuna.com/v1/api/jobs/nl/search/1?${params}`);
  if (!res.ok) throw new Error(`adzuna gaf status ${res.status}`);
  const data = (await res.json()) as { results?: AdzunaResult[] };

  const items: KandidaatVacature[] = [];
  for (const r of data.results ?? []) {
    if (!r.title || !r.redirect_url) continue;
    items.push({
      titel: stripHtml(r.title),
      bedrijf: r.company?.display_name ?? 'Onbekend',
      locatie: r.location?.display_name ?? null,
      url: r.redirect_url,
      omschrijving: r.description ? stripHtml(r.description).slice(0, 500) : null,
    });
  }
  return items;
}
