import { KandidaatVacature, haalHtml, extraheerJsonLdVacatures, extraheerLinks, stripHtml } from './common';
import type { Zoekprofiel } from '../routes/zoekprofiel';

// Indeed embedt zoekresultaten als JSON in window.mosaic.providerData.
// Let op: Indeed heeft agressieve bot-detectie; als de pagina niet ophaalbaar
// is (403/CAPTCHA) geeft deze scraper gewoon een lege lijst terug.

export const naam = 'indeed';

export async function zoek(profiel: Zoekprofiel): Promise<KandidaatVacature[]> {
  const params = new URLSearchParams();
  if (profiel.functie_actief && profiel.functie) params.set('q', profiel.functie);
  if (profiel.locatie_actief && profiel.locatie) params.set('l', profiel.locatie);
  const url = `https://nl.indeed.com/jobs?${params}`;

  const html = await haalHtml(url);
  if (!html) return [];

  // 1) Embedded jobcards-JSON (bevat titel/bedrijf/locatie per resultaat)
  const mosaicMatch = html.match(/"jobcards"\s*:\s*(\{[\s\S]*?"results"\s*:\s*\[[\s\S]*?\])/);
  if (mosaicMatch) {
    try {
      const resultsMatch = mosaicMatch[1].match(/"results"\s*:\s*(\[[\s\S]*)/);
      if (resultsMatch) {
        const results = JSON.parse(balanceerArray(resultsMatch[1])) as Array<Record<string, unknown>>;
        const items: KandidaatVacature[] = [];
        for (const r of results) {
          const titel = r.title ?? r.displayTitle;
          const jk = r.jobkey;
          if (typeof titel !== 'string' || typeof jk !== 'string') continue;
          items.push({
            titel: stripHtml(titel),
            bedrijf: typeof r.company === 'string' ? r.company : 'Onbekend',
            locatie: typeof r.formattedLocation === 'string' ? r.formattedLocation : null,
            url: `https://nl.indeed.com/viewjob?jk=${jk}`,
            omschrijving: null,
          });
        }
        if (items.length > 0) return items;
      }
    } catch {
      // val terug op de generieke extractie hieronder
    }
  }

  // 2) JSON-LD, dan 3) losse vacature-links
  const jsonLd = extraheerJsonLdVacatures(html, url);
  if (jsonLd.length > 0) return jsonLd;
  return extraheerLinks(html, /\/(viewjob|rc\/clk|pagead\/clk)/, url);
}

// Knip een JSON-array-string af op de sluitende ']' van het eerste array.
function balanceerArray(tekst: string): string {
  let diepte = 0;
  let inString = false;
  for (let i = 0; i < tekst.length; i++) {
    const c = tekst[i];
    if (inString) {
      if (c === '\\') i++;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === '[' || c === '{') diepte++;
    else if (c === ']' || c === '}') {
      diepte--;
      if (diepte === 0) return tekst.slice(0, i + 1);
    }
  }
  return tekst;
}
