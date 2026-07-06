-- Migration number: 0001 	 init

CREATE TABLE rss_feeds (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  naam                TEXT NOT NULL,
  url                 TEXT NOT NULL UNIQUE,
  laatst_opgehaald_op TEXT,
  aangemaakt_op       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE vacatures (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  titel         TEXT NOT NULL,
  bedrijf       TEXT NOT NULL,
  locatie       TEXT,
  url           TEXT,
  bron          TEXT NOT NULL DEFAULT 'handmatig',   -- 'handmatig' | 'rss'
  feed_id       INTEGER REFERENCES rss_feeds(id) ON DELETE SET NULL,
  omschrijving  TEXT,
  salaris       TEXT,
  tags          TEXT,
  gearchiveerd  INTEGER NOT NULL DEFAULT 0,
  aangemaakt_op TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  bijgewerkt_op TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE sollicitaties (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  vacature_id       INTEGER NOT NULL REFERENCES vacatures(id) ON DELETE CASCADE,
  stage             TEXT NOT NULL DEFAULT 'interesse',
                    -- interesse | gesolliciteerd | eerste_gesprek | tweede_gesprek | aanbod
  status            TEXT NOT NULL DEFAULT 'actief',
                    -- actief | aangenomen | afgewezen | ingetrokken
  notities          TEXT,
  gesolliciteerd_op TEXT,
  volgende_actie_op TEXT,
  aangemaakt_op     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  bijgewerkt_op     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE checklist_items (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  categorie     TEXT NOT NULL,
  tekst         TEXT NOT NULL,
  klaar         INTEGER NOT NULL DEFAULT 0,
  volgorde      INTEGER NOT NULL DEFAULT 0,
  aangemaakt_op TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE sessions (
  token         TEXT PRIMARY KEY,
  aangemaakt_op TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  verloopt_op   TEXT NOT NULL
);

CREATE INDEX idx_sollicitaties_vacature ON sollicitaties(vacature_id);
CREATE INDEX idx_sollicitaties_status   ON sollicitaties(status);
CREATE INDEX idx_vacatures_archief      ON vacatures(gearchiveerd);

-- Standaard checklist-items om mee te beginnen
INSERT INTO checklist_items (categorie, tekst, volgorde) VALUES
  ('CV', 'CV bijwerken met recente ervaring', 0),
  ('CV', 'CV laten nakijken door iemand anders', 1),
  ('LinkedIn', 'Profielfoto en headline verbeteren', 0),
  ('LinkedIn', 'Samenvatting (About) herschrijven', 1),
  ('Portfolio', 'Portfolio-site online zetten of updaten', 0);
