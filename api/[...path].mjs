import fs from 'node:fs/promises';
import path from 'node:path';
import { createHandler, createStore } from '../server.mjs';
import seed from '../data/store.json' with { type: 'json' };

// The store lives on the writable temp volume of the function instance.
// Set DATA_FILE to a persistent path when a database or mounted volume is used.
const dataFile = process.env.DATA_FILE || '/tmp/wedding/store.json';

let handler;

async function seedStore() {
  try {
    await fs.access(dataFile);
  } catch {
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    await fs.writeFile(dataFile, JSON.stringify(seed, null, 2));
  }
}

async function getHandler() {
  if (!handler) {
    await seedStore();
    const { db, save, rates } = await createStore({ dataFile });
    handler = createHandler({ db, save, rates, localOnly: false });
  }
  return handler;
}

export default async function api(req, res) {
  // Vercel routes the catch-all segments separately; rebuild the original path.
  if (req.query?.path) req.url = '/api/' + [].concat(req.query.path).join('/');
  else if (req.url && !req.url.startsWith('/api/')) req.url = '/api/' + req.url.replace(/^\/+/, '');
  const handle = await getHandler();
  await handle(req, res);
}
