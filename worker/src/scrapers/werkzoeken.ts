import { KandidaatVacature, haalHtml, extraheerJsonLdVacatures, extraheerLinks } from './common';
import type { Zoekprofiel } from '../routes/zoekprofiel';

export const naam = 'werkzoeken';

export async function zoek(profiel: Zoekprofiel): Promise<KandidaatVacature[]> {
  const params = new URLSearchParams();
  if (profiel.functie_actief && profiel.functie) params.set('zoek', profiel.functie);
  if (profiel.locatie_actief && profiel.locatie) params.set('locatie', profiel.locatie);
  const url = `https://www.werkzoeken.nl/vacatures/?${params}`;

  const html = await haalHtml(url);
  if (!html) return [];

  const jsonLd = extraheerJsonLdVacatures(html, url);
  if (jsonLd.length > 0) return jsonLd;
  return extraheerLinks(html, /\/vacature\//, url);
}
