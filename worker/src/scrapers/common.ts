// Gedeelde helpers voor de site-scrapers.
//
// Strategie per site: eerst JSON-LD (schema.org JobPosting) uit de zoekpagina
// halen — veel jobboards embedden dat en het is veel stabieler dan CSS-selectors.
// Lukt dat niet, dan een simpele link-extractie als fallback.
// Sites veranderen soms hun structuur; elke scraper faalt daarom stil
// (lege lijst) in plaats van de hele zoekrun te breken.

export interface KandidaatVacature {
  titel: string;
  bedrijf: string;
  locatie: string | null;
  url: string;
  omschrijving: string | null;
}

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'nl-NL,nl;q=0.9',
};

export async function haalHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&');
}

export function stripHtml(value: string): string {
  return decodeEntities(value.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

interface JsonLdJobPosting {
  '@type'?: string | string[];
  title?: string;
  description?: string;
  url?: string;
  hiringOrganization?: { name?: string } | string;
  jobLocation?: { address?: { addressLocality?: string } } | Array<{ address?: { addressLocality?: string } }>;
}

function naarKandidaat(job: JsonLdJobPosting, paginaUrl: string): KandidaatVacature | null {
  if (!job.title) return null;
  const org = job.hiringOrganization;
  const bedrijf = (typeof org === 'string' ? org : org?.name) ?? 'Onbekend';
  const loc = Array.isArray(job.jobLocation) ? job.jobLocation[0] : job.jobLocation;
  return {
    titel: stripHtml(job.title),
    bedrijf: stripHtml(bedrijf),
    locatie: loc?.address?.addressLocality ? stripHtml(loc.address.addressLocality) : null,
    url: job.url ? new URL(job.url, paginaUrl).href : paginaUrl,
    omschrijving: job.description ? stripHtml(job.description).slice(0, 500) : null,
  };
}

export function extraheerJsonLdVacatures(html: string, paginaUrl: string): KandidaatVacature[] {
  const resultaten: KandidaatVacature[] = [];
  const scripts = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) ?? [];

  for (const script of scripts) {
    const inhoud = script.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '');
    let data: unknown;
    try {
      data = JSON.parse(inhoud);
    } catch {
      continue;
    }
    // Kan een enkel object, een array, of een ItemList met itemListElement zijn
    const kandidaten: JsonLdJobPosting[] = [];
    const verzamel = (node: unknown) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        node.forEach(verzamel);
        return;
      }
      const obj = node as Record<string, unknown>;
      const type = obj['@type'];
      if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) {
        kandidaten.push(obj as JsonLdJobPosting);
      }
      if (Array.isArray(obj.itemListElement)) {
        for (const el of obj.itemListElement) {
          verzamel((el as Record<string, unknown>).item ?? el);
        }
      }
      if (obj['@graph']) verzamel(obj['@graph']);
    };
    verzamel(data);

    for (const job of kandidaten) {
      const kandidaat = naarKandidaat(job, paginaUrl);
      if (kandidaat) resultaten.push(kandidaat);
    }
  }
  return resultaten;
}

// Fallback: zoek anchors waarvan de href op een vacature-detailpagina lijkt.
export function extraheerLinks(
  html: string,
  hrefPatroon: RegExp,
  basisUrl: string,
  maxItems = 25
): KandidaatVacature[] {
  const resultaten: KandidaatVacature[] = [];
  const gezien = new Set<string>();
  const anchors = html.match(/<a\s[^>]*href="[^"]+"[^>]*>[\s\S]*?<\/a>/gi) ?? [];

  for (const anchor of anchors) {
    const hrefMatch = anchor.match(/href="([^"]+)"/i);
    if (!hrefMatch || !hrefPatroon.test(hrefMatch[1])) continue;
    const titel = stripHtml(anchor);
    if (titel.length < 5 || titel.length > 150) continue;

    let url: string;
    try {
      url = new URL(decodeEntities(hrefMatch[1]), basisUrl).href;
    } catch {
      continue;
    }
    if (gezien.has(url)) continue;
    gezien.add(url);

    resultaten.push({ titel, bedrijf: 'Onbekend', locatie: null, url, omschrijving: null });
    if (resultaten.length >= maxItems) break;
  }
  return resultaten;
}
