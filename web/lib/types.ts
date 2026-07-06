export interface Vacature {
  id: number;
  titel: string;
  bedrijf: string;
  locatie: string | null;
  url: string | null;
  bron: 'handmatig' | 'rss';
  feed_id: number | null;
  omschrijving: string | null;
  salaris: string | null;
  tags: string | null;
  gearchiveerd: 0 | 1;
  aangemaakt_op: string;
  bijgewerkt_op: string;
}

export type Stage = 'interesse' | 'gesolliciteerd' | 'eerste_gesprek' | 'tweede_gesprek' | 'aanbod';
export type Status = 'actief' | 'aangenomen' | 'afgewezen' | 'ingetrokken';

export interface Sollicitatie {
  id: number;
  vacature_id: number;
  stage: Stage;
  status: Status;
  notities: string | null;
  gesolliciteerd_op: string | null;
  volgende_actie_op: string | null;
  aangemaakt_op: string;
  bijgewerkt_op: string;
  // Meegejoind door de API
  vacature_titel: string;
  vacature_bedrijf: string;
  vacature_url: string | null;
  vacature_locatie: string | null;
}

export type Herhaling = 'geen' | 'dagelijks' | 'wekelijks';

export interface ChecklistItem {
  id: number;
  categorie: string;
  tekst: string;
  klaar: 0 | 1;
  volgorde: number;
  herhaling: Herhaling;
  laatst_afgevinkt_op: string | null;
  aangemaakt_op: string;
}

export interface Taak {
  id: number;
  sollicitatie_id: number;
  tekst: string;
  deadline: string | null;
  klaar: 0 | 1;
  aangemaakt_op: string;
  // Meegejoind door de API
  vacature_titel: string;
  vacature_bedrijf: string;
}

export interface Zoekprofiel {
  id: 1;
  functie: string | null;
  functie_actief: 0 | 1;
  locatie: string | null;
  locatie_actief: 0 | 1;
  alleen_nederland: 0 | 1;
  bijgewerkt_op: string;
}

export interface RssFeed {
  id: number;
  naam: string;
  url: string;
  laatst_opgehaald_op: string | null;
  aangemaakt_op: string;
}

export interface ZoekRunResultaat {
  bron: string;
  gevonden: number;
  nieuw: number;
  fout?: string;
}
