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

const SCRAPERS = [indeed, nationalevacaturebank, werkzoeken];

interface ZoekResultaat {
  bron: string;
  gevonden: number;
  nieuw: number;
  fout?: string;
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
        const toegevoegd = await insertAlsNieuw(
          env,
          { titel: item.titel, bedrijf: 'Onbekend', locatie: null, url: item.url, omschrijving: item.samenvatting },
          'rss',
          feed.id
        );
        if (toegevoegd) nieuw++;
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

  // --- Scrapers (alleen als er een actief zoekcriterium is, anders is de zoekvraag te breed) ---
  const heeftCriteria =
    (profiel.functie_actief && profiel.functie) || (profiel.locatie_actief && profiel.locatie);
  if (heeftCriteria) {
    for (const scraper of SCRAPERS) {
      try {
        const items = await scraper.zoek(profiel);
        let nieuw = 0;
        for (const item of items) {
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
