// Automatisch vacatures vinden: RSS-feeds + site-scrapers.
// Wordt aangeroepen door de dagelijkse cron (scheduled) én handmatig
// via POST /api/zoeken/run ("Zoek nu"-knop in de feed).

import { Env } from './types';
import { fetchFeed } from './rss/parse';
import { getProfiel } from './routes/zoekprofiel';
import type { KandidaatVacature } from './scrapers/common';
import * as indeed from './scrapers/indeed';
import * as nationalevacaturebank from './scrapers/nationalevacaturebank';
import * as werkzoeken from './scrapers/werkzoeken';
import * as adzuna from './bronnen/adzuna';
import * as arbeitnow from './bronnen/arbeitnow';

const SCRAPERS = [indeed, nationalevacaturebank, werkzoeken];

interface ZoekResultaat {
  bron: string;
  gevonden: number;
  nieuw: number;
  fout?: string;
}

// Herkent of een vacaturetekst op Nederland duidt. Internationale (remote-)feeds
// vermelden de vereiste locatie vrijwel altijd in de titel of omschrijving.
const NL_PATROON = new RegExp(
  [
    'nederland', 'netherlands', 'dutch', 'benelux', 'holland',
    'amsterdam', 'rotterdam', 'den haag', 'the hague', 'utrecht', 'eindhoven',
    'groningen', 'tilburg', 'almere', 'breda', 'nijmegen', 'arnhem', 'haarlem',
    'zaanstad', 'amersfoort', 'apeldoorn', 'enschede', 'zwolle', 'leiden',
    'maastricht', 'dordrecht', 'zoetermeer', 'deventer', 'delft', 'leeuwarden',
  ].join('|'),
  'i'
);

function isNederlands(item: KandidaatVacature): boolean {
  const tekst = `${item.titel} ${item.bedrijf} ${item.locatie ?? ''} ${item.omschrijving ?? ''}`;
  return NL_PATROON.test(tekst);
}

// Importfilter: past de actieve zoekprofiel-criteria toe op binnenkomende items,
// zodat de feed niet volloopt met irrelevante (buitenlandse) vacatures.
function magImporteren(
  item: KandidaatVacature,
  profiel: { functie: string | null; functie_actief: number; alleen_nederland: number },
  bronIsNederlands = false
): boolean {
  // Scrapers halen al van Nederlandse sites; alleen RSS-items NL-checken
  if (profiel.alleen_nederland && !bronIsNederlands && !isNederlands(item)) return false;
  if (profiel.functie_actief && profiel.functie) {
    const tekst = `${item.titel} ${item.omschrijving ?? ''}`.toLowerCase();
    if (!tekst.includes(profiel.functie.toLowerCase())) return false;
  }
  return true;
}

async function insertAlsNieuw(
  env: Env,
  item: KandidaatVacature,
  bron: string,
  feedId: number | null
): Promise<boolean> {
  const bestaand = await env.DB.prepare('SELECT id FROM vacatures WHERE url = ?').bind(item.url).first();
  if (bestaand) return false;
  await env.DB.prepare(
    `INSERT INTO vacatures (titel, bedrijf, locatie, url, bron, feed_id, omschrijving)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(item.titel, item.bedrijf || 'Onbekend', item.locatie, item.url, bron, feedId, item.omschrijving)
    .run();
  return true;
}

export async function zoekAlleBronnen(env: Env): Promise<ZoekResultaat[]> {
  const resultaten: ZoekResultaat[] = [];
  const profiel = await getProfiel(env);

  // --- RSS-feeds ---
  const { results: feeds } = await env.DB.prepare('SELECT * FROM rss_feeds').all();
  for (const feed of feeds as Array<{ id: number; naam: string; url: string }>) {
    try {
      const items = await fetchFeed(feed.url);
      let nieuw = 0;
      for (const item of items) {
        const kandidaat: KandidaatVacature = {
          titel: item.titel,
          bedrijf: 'Onbekend',
          locatie: null,
          url: item.url,
          omschrijving: item.samenvatting,
        };
        if (!magImporteren(kandidaat, profiel)) continue;
        if (await insertAlsNieuw(env, kandidaat, 'rss', feed.id)) nieuw++;
      }
      await env.DB.prepare(
        "UPDATE rss_feeds SET laatst_opgehaald_op = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?"
      )
        .bind(feed.id)
        .run();
      resultaten.push({ bron: `rss: ${feed.naam}`, gevonden: items.length, nieuw });
    } catch (err) {
      resultaten.push({ bron: `rss: ${feed.naam}`, gevonden: 0, nieuw: 0, fout: String(err) });
    }
  }

  // --- API-bronnen (officieel, betrouwbaarder dan scrapen) ---

  // Adzuna: aggregeert Nederlandse jobboards; vereist gratis API-sleutels
  if (env.ADZUNA_APP_ID && env.ADZUNA_APP_KEY) {
    try {
      const items = await adzuna.zoek(profiel, env.ADZUNA_APP_ID, env.ADZUNA_APP_KEY);
      let nieuw = 0;
      for (const item of items) {
        // Adzuna/nl levert al uitsluitend Nederlandse vacatures
        if (!magImporteren(item, profiel, true)) continue;
        if (await insertAlsNieuw(env, item, 'api:adzuna', null)) nieuw++;
      }
      resultaten.push({ bron: 'adzuna', gevonden: items.length, nieuw });
    } catch (err) {
      resultaten.push({ bron: 'adzuna', gevonden: 0, nieuw: 0, fout: String(err) });
    }
  }

  // Arbeitnow: gratis zonder sleutel; NL-filter houdt niet-Nederlandse items tegen
  try {
    const items = await arbeitnow.zoek();
    let nieuw = 0;
    for (const item of items) {
      if (!magImporteren(item, profiel)) continue;
      if (await insertAlsNieuw(env, item, 'api:arbeitnow', null)) nieuw++;
    }
    resultaten.push({ bron: 'arbeitnow', gevonden: items.length, nieuw });
  } catch (err) {
    resultaten.push({ bron: 'arbeitnow', gevonden: 0, nieuw: 0, fout: String(err) });
  }

  // --- Scrapers (alleen als er een actief zoekcriterium is, anders is de zoekvraag te breed) ---
  const heeftCriteria =
    (profiel.functie_actief && profiel.functie) || (profiel.locatie_actief && profiel.locatie);
  if (heeftCriteria) {
    for (const scraper of SCRAPERS) {
      try {
        const items = await scraper.zoek(profiel);
        let nieuw = 0;
        for (const item of items) {
          if (!magImporteren(item, profiel, true)) continue;
          if (await insertAlsNieuw(env, item, `scrape:${scraper.naam}`, null)) nieuw++;
        }
        resultaten.push({ bron: scraper.naam, gevonden: items.length, nieuw });
      } catch (err) {
        resultaten.push({ bron: scraper.naam, gevonden: 0, nieuw: 0, fout: String(err) });
      }
    }
  }

  return resultaten;
}
