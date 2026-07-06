-- Migration number: 0002 	 taken, herhaling, zoekprofiel

ALTER TABLE checklist_items ADD COLUMN herhaling TEXT NOT NULL DEFAULT 'geen';
  -- 'geen' | 'dagelijks' | 'wekelijks'
ALTER TABLE checklist_items ADD COLUMN laatst_afgevinkt_op TEXT;

CREATE TABLE taken (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  sollicitatie_id INTEGER NOT NULL REFERENCES sollicitaties(id) ON DELETE CASCADE,
  tekst           TEXT NOT NULL,
  deadline        TEXT,                 -- optionele datum (YYYY-MM-DD)
  klaar           INTEGER NOT NULL DEFAULT 0,
  aangemaakt_op   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_taken_sollicitatie ON taken(sollicitatie_id);
CREATE INDEX idx_taken_deadline ON taken(deadline);

-- Singleton-rij met zoekinstellingen; elk criterium heeft een waarde en een aan/uit-vlag
CREATE TABLE zoekprofiel (
  id             INTEGER PRIMARY KEY CHECK (id = 1),
  functie        TEXT,
  functie_actief INTEGER NOT NULL DEFAULT 0,
  locatie        TEXT,
  locatie_actief INTEGER NOT NULL DEFAULT 0,
  bijgewerkt_op  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
INSERT INTO zoekprofiel (id) VALUES (1);
