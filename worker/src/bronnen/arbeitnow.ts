// Arbeitnow: gratis openbare vacature-API zonder sleutel
// (www.arbeitnow.com/api/job-board-api). Vooral Europese/remote vacatures;
// het alleen-Nederland-importfilter houdt de rest buiten de deur.

import type { KandidaatVacature } from '../scrapers/common';
import { stripHtml } from '../scrapers/common';

export const naam = 'arbeitnow';

interface ArbeitnowJob {
  title?: string;
  company_name?: string;
  location?: string;
  url?: string;
  description?: string;
}

export async function zoek(): Promise<KandidaatVacature[]> {
  const res = await fetch('https://www.arbeitnow.com/api/job-board-api', {
    headers: { 'User-Agent': 'vacatures-dashboard/1.0 (persoonlijke vacaturezoeker)' },
  });
  if (!res.ok) throw new Error(`arbeitnow gaf status ${res.status}`);
  const data = (await res.json()) as { data?: ArbeitnowJob[] };

  const items: KandidaatVacature[] = [];
  for (const j of data.data ?? []) {
    if (!j.title || !j.url) continue;
    items.push({
      titel: stripHtml(j.title),
      bedrijf: j.company_name ?? 'Onbekend',
      locatie: j.location ?? null,
      url: j.url,
      omschrijving: j.description ? stripHtml(j.description).slice(0, 500) : null,
    });
  }
  return items;
}
