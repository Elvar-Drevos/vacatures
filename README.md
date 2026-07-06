# Vacatures — persoonlijk job search dashboard

Dark-themed dashboard voor het volgen van vacatures, sollicitaties en
verbeterpunten (CV, LinkedIn, portfolio).

- **Frontend**: Next.js + Tailwind CSS v4 (statisch exporteerbaar → GitHub Pages), in [web/](web/)
- **Backend**: Cloudflare Worker + D1 (SQLite), in [worker/](worker/)
- **Login**: één passcode → sessie-token (30 dagen geldig)

## Lokaal draaien

Node.js staat (portable) in `C:\Users\miste\tools\node`. Voeg die map toe aan je
PATH, of gebruik de volledige paden.

**Terminal 1 — backend (API op http://127.0.0.1:8787):**
```
cd worker
npx wrangler dev --port 8787
```

**Terminal 2 — frontend (app op http://localhost:3000):**
```
cd web
npm run dev
```

Open http://localhost:3000 en log in met de passcode uit
[worker/.dev.vars](worker/.dev.vars) (standaard: `vacatures2026` — pas dit aan!).

### Database

De lokale database leeft in `worker/.wrangler/state/`. Migraties draaien:
```
cd worker
npm run db:migrate:local
```

## Structuur

| Wat | Waar |
|---|---|
| Pagina's (feed, tracker, checklist, login) | [web/app/](web/app/) |
| Herbruikbare UI (Card, Button, Badge, nav) | [web/components/](web/components/) |
| API-client + types + fases/statussen | [web/lib/](web/lib/) |
| Kleuren & fonts (accent, dark theme) | [web/app/globals.css](web/app/globals.css) (`@theme` blok) |
| API-routes | [worker/src/routes/](worker/src/routes/) |
| Database-schema | [worker/migrations/0001_init.sql](worker/migrations/0001_init.sql) |

Sollicitatie-fases: interesse → gesolliciteerd → eerste gesprek → tweede gesprek → aanbod.
Status (los van fase): actief / aangenomen / afgewezen / ingetrokken.
Fases/statussen aanpassen: [web/lib/constants.ts](web/lib/constants.ts) + [worker/src/types.ts](worker/src/types.ts).

## Nog te doen (volgende stappen)

- [ ] RSS-import (feeds beheren, preview, importeren) — schema is er al (`rss_feeds`)
- [ ] Deploy: Worker naar Cloudflare (`wrangler d1 create vacatures-db`, id in
      `wrangler.toml` zetten, `wrangler secret put PASSCODE`, `npm run db:migrate:remote`,
      `npx wrangler deploy`)
- [ ] Deploy: frontend naar GitHub Pages (GitHub Actions workflow, `NEXT_PUBLIC_BASE_PATH`
      en `NEXT_PUBLIC_API_BASE_URL` instellen, `ALLOWED_ORIGIN` in wrangler.toml aanpassen)
- [ ] PWA (manifest + iconen) zodat de app op je telefoon installeerbaar is
