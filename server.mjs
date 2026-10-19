import http from 'node:http';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { defaults } from './shared/invitation.mjs';
const root = path.dirname(fileURLToPath(import.meta.url));
const distRoot = path.join(root, 'dist');
const pageRoutes = new Set(['/', '/preview', '/admin', '/create/blossom-oud']);
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};
export function validateInvitation(input) {
  if (!input || typeof input !== 'object') throw Error('Invalid invitation');
  const c = {};
  for (const [k, v] of Object.entries(defaults)) {
    if (typeof v === 'boolean') {
      if (typeof input[k] !== 'boolean') throw Error('Invalid setting: ' + k);
      c[k] = input[k];
    } else {
      if (typeof input[k] !== 'string' || input[k].length > 1000)
        throw Error('Invalid field: ' + k);
      c[k] = input[k].trim();
    }
  }
  if (!['ar', 'en', 'fr'].includes(c.language) || !['wedding', 'engagement'].includes(c.eventType))
    throw Error('Invalid language or event');
  for (const k of ['groom', 'bride', 'venue', 'city'])
    if (!c[k] || c[k].length > 150) throw Error('Please fill in ' + k);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(c.date) ||
    !Number.isFinite(Date.parse(c.date)) ||
    new Date(c.date).toISOString().slice(0, 10) !== c.date
  )
    throw Error('Please choose a valid date');
  for (const k of ['reception', 'ceremony', 'dinner', 'party'])
    if (!/^([01]\d|2[0-3]):00$/.test(c[k])) throw Error('Choose a whole hour');
  try {
    new Intl.DateTimeFormat('en', { timeZone: c.timezone });
  } catch {
    throw Error('Invalid time zone');
  }
  if (c.map && /^[a-z][a-z\d+.-]*:/i.test(c.map) && !/^https?:\/\//i.test(c.map))
    throw Error('Use a valid map address or https link');
  return c;
}
export async function createServer({
  dataFile = path.join(root, 'data/store.json'),
  frontend,
} = {}) {
  let db;
  try {
    db = JSON.parse(await fs.readFile(dataFile, 'utf8'));
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    db = {
      invitations: { demo: { id: 'demo', ...defaults, createdAt: new Date().toISOString() } },
      responses: {},
    };
  }
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  let queue = Promise.resolve();
  const save = () => {
    const snapshot = JSON.stringify(db, null, 2);
    queue = queue
      .catch(() => {})
      .then(async () => {
        await fs.writeFile(dataFile + '.tmp', snapshot);
        await fs.rename(dataFile + '.tmp', dataFile);
      });
    return queue;
  };
  await save();
  const rates = new Map();
  return http.createServer(async (req, res) => {
    const json = (status, value) => {
      res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(JSON.stringify(value));
    };
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    try {
      if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host || ''))
        return json(403, { error: 'This app is available on localhost only.' });
      const url = new URL(req.url, 'http://' + req.headers.host),
        p = url.pathname;
      if (!['GET', 'HEAD'].includes(req.method)) {
        if (req.headers.origin !== url.origin)
          return json(403, { error: 'Cross-origin requests are not allowed.' });
        if (!req.headers['content-type']?.startsWith('application/json'))
          return json(415, { error: 'JSON required' });
      }
      const body = async () => {
        let text = '';
        for await (const chunk of req) {
          text += chunk;
          if (Buffer.byteLength(text) > 20000) throw Error('Request too large');
        }
        return JSON.parse(text);
      };
      if (p === '/api/invitations' && req.method === 'GET')
        return json(
          200,
          Object.values(db.invitations).map(
            ({ id, groom, bride, groomAr, brideAr, date, language }) => ({
              id,
              groom,
              bride,
              groomAr,
              brideAr,
              date,
              language,
            }),
          ),
        );
      if (p === '/api/invitations' && req.method === 'POST') {
        const c = validateInvitation(await body()),
          id = randomUUID().slice(0, 8);
        db.invitations[id] = { id, ...c, createdAt: new Date().toISOString() };
        await save();
        return json(201, db.invitations[id]);
      }
      const match = p.match(/^\/api\/invitations\/([a-zA-Z0-9-]+)(\/responses)?$/);
      if (match) {
        const id = match[1] === 'gUaJb2s' ? 'demo' : match[1],
          inv = db.invitations[id];
        if (!inv) return json(404, { error: 'Invitation not found' });
        if (!match[2]) {
          if (req.method === 'GET') return json(200, inv);
          if (req.method === 'PUT') {
            db.invitations[id] = { ...inv, ...validateInvitation(await body()) };
            await save();
            return json(200, db.invitations[id]);
          }
        } else {
          if (req.method === 'GET') return json(200, db.responses[id] || []);
          if (req.method === 'POST') {
            if (!inv.rsvp) return json(409, { error: 'RSVP is disabled for this invitation.' });
            const b = await body();
            if (
              typeof b.name !== 'string' ||
              !b.name.trim() ||
              b.name.length > 150 ||
              !['yes', 'no'].includes(b.attendance) ||
              typeof b.note !== 'string' ||
              b.note.length > 1000 ||
              !Number.isInteger(b.guests) ||
              b.guests < 1 ||
              b.guests > 10 ||
              !/^[a-zA-Z0-9-]{16,64}$/.test(b.visitor || '')
            )
              throw Error('Please check your response details.');
            const key = id + ':' + b.visitor,
              now = Date.now(),
              rate = rates.get(key) || [];
            const recent = rate.filter((t) => now - t < 60000);
            if (recent.length >= 10)
              return json(429, { error: 'Please wait a minute before trying again.' });
            rates.set(key, [...recent, now]);
            const row = {
              name: b.name.trim(),
              attendance: b.attendance,
              note: b.note.trim(),
              guests: b.attendance === 'yes' ? b.guests : 0,
              visitor: b.visitor,
              updatedAt: new Date().toISOString(),
            };
            const rows = (db.responses[id] ||= []);
            const existing = rows.findIndex((r) => r.visitor === b.visitor);
            if (existing >= 0) rows[existing] = row;
            else rows.push(row);
            await save();
            return json(200, { ok: true });
          }
        }
        return json(405, { error: 'Method not allowed' });
      }
      if (p.startsWith('/api/')) return json(404, { error: 'Not found' });
      if (!['GET', 'HEAD'].includes(req.method)) return json(405, { error: 'Method not allowed' });
      if (frontend) return frontend(req, res);
      const route =
        pageRoutes.has(p) || /^\/i\/[a-zA-Z0-9-]+$/.test(p)
          ? 'index.html'
          : decodeURIComponent(p).replace(/^\//, '');
      const file = path.resolve(distRoot, route);
      if (!file.startsWith(distRoot + path.sep)) return json(403, { error: 'Forbidden' });
      let stat;
      try {
        stat = await fs.stat(file);
      } catch {
        return json(404, { error: 'Not found' });
      }
      if (!stat.isFile()) return json(404, { error: 'Not found' });
      res.setHeader('Content-Type', mimeTypes[path.extname(file)] || 'application/octet-stream');
      res.setHeader(
        'Cache-Control',
        p.startsWith('/assets/') ? 'public, max-age=86400' : 'no-cache',
      );
      let start = 0,
        end = stat.size - 1;
      if (req.headers.range) {
        const m = req.headers.range.match(/^bytes=(\d+)-(\d*)$/);
        if (!m || Number(m[1]) >= stat.size) {
          res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
          return res.end();
        }
        start = Number(m[1]);
        end = m[2] ? Math.min(Number(m[2]), end) : end;
        if (end < start) {
          res.writeHead(416);
          return res.end();
        }
        res.statusCode = 206;
        res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
      }
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', end - start + 1);
      if (req.method === 'HEAD') return res.end();
      createReadStream(file, { start, end })
        .on('error', () => res.destroy())
        .pipe(res);
    } catch (e) {
      if (
        e instanceof SyntaxError ||
        /Invalid|Please|Choose|Use a valid|Request too large/.test(e.message)
      )
        json(400, { error: e.message });
      else {
        console.error(e);
        json(500, { error: 'Unable to save or load data. Please try again.' });
      }
    }
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = await createServer();
  const port = Number(process.env.PORT) || 3000;
  server.listen(port, '127.0.0.1', () =>
    console.log(`Invitation: http://localhost:${port}\nEditor: http://localhost:${port}/admin`),
  );
}
