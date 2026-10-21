# Blossom & Oud — Wedding invitations

A React 19 invitation with an ivory satin and gold-edged glass theme, a monogram-first animated story inspired by the supplied video, an Arabic editor, and English, Arabic and French guest pages. Vite builds the frontend; the Node server stores invitations and RSVPs.

## Start

Requires Node.js 22.12 or newer. Open a terminal in this folder and install dependencies once:

```powershell
npm install
```

Start the application:

```powershell
npm start
```

`npm start` builds the React app and starts the local server. For development with automatic React updates, use `npm run dev` instead. Run only one of these commands at a time on port 3000. Press Ctrl+C to stop it.

- Invitation: http://localhost:3000
- Editor and RSVP dashboard: http://localhost:3000/admin
- Screenshot-compatible editor route: http://localhost:3000/create/blossom-oud
- Reference-compatible sample: http://localhost:3000/i/gUaJb2s

The editor supports creating multiple invitations, editing saved invitations, live preview, wedding or engagement, three languages, names, venue, date, hour-and-minute schedule, event timezone, optional sections, custom greeting and dress-code text. The ceremony time is optional; leave it blank for a three-event schedule. Save an invitation to obtain its individual `/i/:id` URL. Use **دعواتي** to open earlier invitations and their responses.

Guest pages include animated envelope opening, six scenes with staggered text reveals and fades, pause/previous/next/replay controls, music playback, countdown, calendar download, schedule, dress code, Google Maps and RSVP. The final scene stays visible. A details link leads directly to the full readable invitation and guest actions without waiting for the story. Reduced motion disables autoplay and decorative animation; the scene controls remain available. Responses persist on the server; the same browser can update its response. The dashboard totals attending guests and exports CSV.

New invitations default to المهندس أسامة and الدكتورة صفاء, 14 November 2026, قصر بصمات للاحتفالات in Riyadh, with reception at 20:30, dinner at 21:30, and celebration at 22:30 in `Asia/Riyadh`. Saved invitations retain their own details.

## Storage and scope

All invitations and RSVP records are stored in `data/store.json`. Keep that file to retain your data. Local browser storage holds only a random visitor ID for response updates. It is not used as an invitation database.

This is a **local application**, bound to `127.0.0.1`. Local links are not accessible to guests on other devices. The editor has no production authentication because the app runs only on your machine. Public hosting requires adding owner authentication, a production database, and an appropriate hosting configuration. Do not expose this local server directly to the internet.

Map embeds and directions need internet access; all invitation artwork, fonts, animation and music are stored locally. A pasted Google Maps URL is used for the directions button; the embedded map searches the venue and city. A typed address is used directly in both. Music starts after a guest opens the envelope and can be paused. Reduced motion preferences disable decorative animation.

## Deployment on Vercel

`vercel.json` describes the build and every route. Vite builds the frontend into `dist/`, and `api/[...path].mjs` is the serverless function that answers the API.

| Route | Handled by |
| --- | --- |
| `/` | `dist/index.html` |
| `/preview`, `/admin`, `/create/blossom-oud` | rewrite to `dist/index.html` |
| `/i/:id` | rewrite to `dist/index.html` |
| `/api/invitations` | `api/[...path].mjs` (GET, POST) |
| `/api/invitations/:id` | `api/[...path].mjs` (GET, PUT) |
| `/api/invitations/:id/responses` | `api/[...path].mjs` (GET, POST) |
| `/assets/*` | `dist/assets/` |

Deploy with the Vercel CLI from this folder:

```powershell
npx vercel --prod
```

Two limits of the local build apply to a public deployment:

- **Storage is temporary.** The function writes the store to `/tmp/wedding/store.json` on the instance, so records disappear when the instance is recycled. Set `DATA_FILE` to a mounted persistent path, or replace `createStore` in `server.mjs` with a database client, before relying on it for real invitations.
- **The editor is open.** `/admin` has no authentication, so anyone with the link can create and edit invitations. Add owner authentication before sharing the deployment.

## Development and verification

```powershell
npm run dev
npm run build
npm test
```

Both development and the built application use the same URLs and API. The development server serves Vite and the Node API on port 3000, so the editor's preview iframe and RSVP requests stay on the same origin. `npm test` builds first, then tests validation, timezone handling, exports, API persistence, and the built routes using temporary storage. It does not change your invitations.

- `src/main.jsx`: React entry point; separately loads the editor or invitation and their styles.
- `src/admin/`: controlled editor form, live preview, invitation manager, RSVP dashboard.
- `src/invitation/`: envelope, media, countdown, guest sections, RSVP form.
- `src/styles/`: separate editor and invitation styles.
- `src/lib/`: API and browser download helpers.
- `shared/invitation.mjs`: existing defaults, translations, names, timezone and map helpers, shared with the server.
- `shared/exports.mjs`: calendar and RSVP CSV generation.
- `public/assets/`: original artwork, fonts, music and videos.
- `server.mjs`: local storage, invitation and RSVP APIs, and static file serving from `dist/`.
- `api/[...path].mjs`: Vercel serverless function that reuses the same API handlers.
- `vercel.json`: Vercel build, function, route, and header configuration.
- `scripts/dev.mjs`: Vite middleware and the API on one local server.

Existing `data/store.json` records and `/i/:id` links remain compatible. `dist/` is generated and should not be edited or committed. The lockfile pins the tested dependency versions; use `npm ci` for a repeatable install.

## Reference assets

The supplied reference was https://wedding-invitations-psi-seven.vercel.app/i/gUaJb2s. Its public artwork and media were saved locally to reproduce the requested design. Source URLs for the retained assets are recorded in [docs/asset-sources.json](docs/asset-sources.json). No original website scripts, analytics, or remote RSVP endpoints are executed.

The updated design follows `public/assets/reference video.mp4` after its opening. The monogram uses `public/assets/monogram-gold-hq.png`, a 1024 × 1536 transparent gold restoration based on the original `logo.jpeg`, which is retained. Its prompt is documented in [docs/monogram-artwork.md](docs/monogram-artwork.md). The background and its generation prompt are documented in [docs/ivory-glass-artwork.md](docs/ivory-glass-artwork.md).
