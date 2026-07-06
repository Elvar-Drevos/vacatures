-- Migration number: 0003 	 alleen-Nederland importfilter

ALTER TABLE zoekprofiel ADD COLUMN alleen_nederland INTEGER NOT NULL DEFAULT 1;
