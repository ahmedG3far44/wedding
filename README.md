# Blossom & Oud — Wedding invitations

A React 19 recreation of the supplied invitation, with the reference artwork, animated envelope and palace, Arabic editor, and English, Arabic and French guest pages. Vite builds the frontend; the existing Node server stores invitations and RSVPs. The music control uses Lucide React's `Pause` component.

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

The editor supports creating multiple invitations, editing saved invitations, live preview, wedding or engagement, three languages, names, venue, date, whole-hour schedule, event timezone, optional sections, custom greeting and dress-code text. Save an invitation to obtain its individual `/i/:id` URL. Use **دعواتي** to open earlier invitations and their responses.

Guest pages include animated envelope opening, music playback, countdown, calendar download, schedule, venue artwork, dress code, Google Maps and RSVP. Responses persist on the server; the same browser can update its response. The dashboard totals attending guests and exports CSV.

## Storage and scope

All invitations and RSVP records are stored in `data/store.json`. Keep that file to retain your data. Local browser storage holds only a random visitor ID for response updates. It is not used as an invitation database.

This is a **local application**, bound to `127.0.0.1`. Local links are not accessible to guests on other devices. The editor has no production authentication because the app runs only on your machine. Public hosting requires adding owner authentication, a production database, and an appropriate hosting configuration. Do not expose this local server directly to the internet.

Map embeds and directions need internet access; all invitation artwork, fonts, animation and music are stored locally. A pasted Google Maps URL is used for the directions button; the embedded map searches the venue and city. A typed address is used directly in both. Music starts after a guest opens the envelope and can be paused. Reduced motion preferences disable decorative animation.

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
- `src/styles/`: editor and invitation CSS, formatted for readability with the original design preserved.
- `src/lib/`: API and browser download helpers.
- `shared/invitation.mjs`: existing defaults, translations, names, timezone and map helpers, shared with the server.
- `shared/exports.mjs`: calendar and RSVP CSV generation.
- `public/assets/`: original artwork, fonts, music and videos.
- `server.mjs`: local storage, invitation and RSVP APIs, and static file serving from `dist/`.
- `scripts/dev.mjs`: Vite middleware and the API on one local server.

Existing `data/store.json` records and `/i/:id` links remain compatible. `dist/` is generated and should not be edited or committed. The lockfile pins the tested dependency versions; use `npm ci` for a repeatable install.

## Reference assets

The supplied reference was https://wedding-invitations-psi-seven.vercel.app/i/gUaJb2s. Its public artwork and media were saved locally to reproduce the requested design. Source URLs for the retained assets are recorded in [docs/asset-sources.json](docs/asset-sources.json). No original website scripts, analytics, or remote RSVP endpoints are executed.
