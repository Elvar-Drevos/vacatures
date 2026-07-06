# Vacatures — persoonlijk job search dashboard

Dark-themed dashboard voor het volgen van vacatures, sollicitaties, taken en
verbeterpunten (CV, LinkedIn, portfolio).

**Live**: https://elvar-drevos.github.io/vacatures/
**API**: https://vacatures-api.thomas-schorn-zwolle.workers.dev

- **Frontend**: Next.js + Tailwind CSS v4, statische export → GitHub Pages, in [web/](web/)
- **Backend**: Cloudflare Worker + D1 (SQLite), in [worker/](worker/)
- **Login**: één passcode → sessie-token (30 dagen geldig)
- **PWA**: installeerbaar op telefoon ("Toevoegen aan beginscherm")

## Features

- **Feed** — vacatures verzamelen: handmatig, via RSS-bronnen, en via een
  dagelijkse automatische zoekrun (cron om 06:00 UTC) die RSS-feeds ophaalt en
  Indeed/NationaleVacaturebank/Werkzoeken.nl doorzoekt op je zoekprofiel.
  Let op: die sites blokkeren geautomatiseerd ophalen regelmatig (403) — RSS is
  de betrouwbare route.
- **Zoekprofiel** — functie + locatie met elk een aan/uit-schakelaar; filtert de
  feed én stuurt de zoekrun. "Toon alles" negeert de filters.
- **Tracker** — sollicitaties per fase (interesse → gesolliciteerd → 1e gesprek
  → 2e gesprek → aanbod) met status (actief/aangenomen/afgewezen/ingetrokken),
  notities, taken en vacature-bewerking op de detailpagina.
- **Taken** — per sollicitatie, met deadline; centraal overzicht onder "Taken".
- **Checklist** — verbeterpunten per categorie, optioneel dagelijks/wekelijks
  terugkerend (herhalende items komen na middernacht/maandag automatisch terug).

## Lokaal draaien

Node.js staat (portable) in `C:\Users\miste\tools\node` — voeg toe aan PATH of
gebruik volledige paden.

**Terminal 1 — backend (http://127.0.0.1:8787):**
```
cd worker
npx wrangler dev --port 8787
```

**Terminal 2 — frontend (http://localhost:3000):**
```
cd web
npm run dev
```

Passcode voor lokaal staat in `worker/.dev.vars` (niet in git).

## Deploy

- **Worker**: `cd worker && npx wrangler deploy` (na `wrangler login`).
  Migraties naar productie: `npm run db:migrate:remote`.
  Passcode wijzigen: `npx wrangler secret put PASSCODE`.
- **Frontend**: push naar `main` — GitHub Actions bouwt en publiceert
  automatisch naar GitHub Pages ([.github/workflows/deploy-web.yml](.github/workflows/deploy-web.yml)).
  De API-URL staat als repo-variabele `API_BASE_URL`.

## Structuur & aanpassen

| Wat | Waar |
|---|---|
| Pagina's (feed, tracker, taken, checklist, login) | [web/app/](web/app/) |
| Herbruikbare UI (Card, Button, Toggle, nav) | [web/components/](web/components/) |
| API-client + types + fases/statussen | [web/lib/](web/lib/) |
| Kleuren & fonts (accent, dark theme) | [web/app/globals.css](web/app/globals.css) (`@theme` blok) |
| API-routes | [worker/src/routes/](worker/src/routes/) |
| Site-scrapers | [worker/src/scrapers/](worker/src/scrapers/) |
| Automatische zoekrun (RSS + scrapers) | [worker/src/zoeken.ts](worker/src/zoeken.ts) |
| Database-schema | [worker/migrations/](worker/migrations/) |

Fases/statussen aanpassen: [web/lib/constants.ts](web/lib/constants.ts) +
[worker/src/types.ts](worker/src/types.ts). PWA-iconen opnieuw genereren:
`cd web && node scripts/make-icons.mjs`.
