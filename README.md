# Blossom & Oud — Wedding invitations

A local recreation of the supplied invitation, with the reference artwork, animated envelope and palace, Arabic editor, and English, Arabic and French guest pages.

## Start

Requires Node.js 20 or newer. There are no packages to install.

```powershell
npm start
```

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
npm test
```

`server.mjs` is the Node HTTP server. `public/admin.*` contains the editor. `public/invitation.*` contains the guest experience. `public/shared.mjs` contains translations and formatting helpers. Tests use temporary storage and do not change your invitations.

## Reference assets

The supplied reference was https://wedding-invitations-psi-seven.vercel.app/i/gUaJb2s. Its public artwork and media were saved locally to reproduce the requested design. Artwork source URLs are recorded in `public/assets/sources.json`; media and font source URLs are in `scripts/download-media.mjs`. Higgsfield generation was unnecessary because the original artwork was available. No original website scripts, analytics, or remote RSVP endpoints are executed.
