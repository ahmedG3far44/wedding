import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaults } from '../shared/invitation.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const config = JSON.parse(await fs.readFile(path.join(root, 'vercel.json'), 'utf8'));

// Vercel matches rewrite sources with path-to-regexp. Only `:name` and `:name*`
// segments are used here, so a plain matcher is enough to prove the routes.
function toRegExp(source) {
  const pattern = source
    .split('/')
    .map((segment) => {
      if (!segment.startsWith(':')) return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (segment.endsWith('*')) return '([^/]+(?:/[^/]+)*)?';
      return '([^/]+)';
    })
    .join('/');
  return new RegExp('^' + pattern + '$');
}

function matchRewrite(urlPath) {
  for (const rewrite of config.rewrites) {
    const matched = toRegExp(rewrite.source).exec(urlPath);
    if (matched) return { rewrite, matched };
  }
  return null;
}

function mockResponse() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
    },
    writeHead(status, headers = {}) {
      this.statusCode = status;
      for (const [key, value] of Object.entries(headers)) this.setHeader(key, value);
    },
    end(chunk = '') {
      this.body += chunk;
    },
  };
}

async function callApi(method, urlPath, body) {
  const { default: api } = await import('../api/[...path].mjs');
  const req = {
    method,
    url: urlPath,
    headers: {
      host: 'wedding.vercel.app',
      'x-forwarded-proto': 'https',
      origin: 'https://wedding.vercel.app',
      'content-type': 'application/json',
    },
    query: { path: urlPath.replace(/^\/api\//, '').split('/') },
    body,
  };
  const res = mockResponse();
  await api(req, res);
  return res;
}

test('vercel.json declares the build, the API function, and every app route', async () => {
  assert.equal(config.framework, null);
  assert.equal(config.buildCommand, 'npm run build');
  assert.equal(config.outputDirectory, 'dist');
  assert.ok(config.functions['api/[...path].mjs'], 'the API function is configured');
  await fs.access(path.join(root, 'api', '[...path].mjs'));

  for (const route of ['/preview', '/admin', '/create/blossom-oud', '/i/abc123']) {
    const matched = matchRewrite(route);
    assert.ok(matched, route + ' is rewritten');
    assert.equal(matched.rewrite.destination, '/index.html');
  }
  for (const route of [
    '/api/invitations',
    '/api/invitations/abc123',
    '/api/invitations/abc123/responses',
  ]) {
    const matched = matchRewrite(route);
    assert.ok(matched, route + ' reaches the function');
    assert.equal(matched.rewrite.destination, '/api/[...path]');
  }
  assert.equal(matchRewrite('/assets/index-abc.js'), null, 'assets are left to the filesystem');
});

test('data/store.json ships every invitation with the full default content', async () => {
  const store = JSON.parse(await fs.readFile(path.join(root, 'data', 'store.json'), 'utf8'));
  const ids = Object.keys(store.invitations);
  assert.ok(ids.includes('demo'), 'the demo invitation exists');
  for (const id of ids) {
    for (const key of Object.keys(defaults)) {
      assert.ok(key in store.invitations[id], id + ' includes ' + key);
    }
  }
});

test('the Vercel function answers the invitation and RSVP routes', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wedding-vercel-'));
  process.env.DATA_FILE = path.join(dir, 'store.json');
  t.after(async () => {
    delete process.env.DATA_FILE;
    await fs.rm(dir, { recursive: true, force: true });
  });

  const list = await callApi('GET', '/api/invitations');
  assert.equal(list.statusCode, 200);
  assert.equal(list.headers['content-type'], 'application/json; charset=utf-8');
  const seeded = JSON.parse(list.body).map((invitation) => invitation.id);
  assert.ok(Array.isArray(seeded));
  assert.ok(seeded.includes('demo'), 'the bundled store seeds the function');
  const source = JSON.parse(await fs.readFile(path.join(root, 'data', 'store.json'), 'utf8'));
  for (const id of Object.keys(source.invitations))
    assert.ok(seeded.includes(id), id + ' is seeded');

  const created = await callApi('POST', '/api/invitations', { ...defaults, groom: 'Groom' });
  assert.equal(created.statusCode, 201);
  const id = JSON.parse(created.body).id;

  const read = await callApi('GET', '/api/invitations/' + id);
  assert.equal(read.statusCode, 200);
  assert.equal(JSON.parse(read.body).groom, 'Groom');

  const edited = await callApi('PUT', '/api/invitations/' + id, { ...defaults, language: 'fr' });
  assert.equal(edited.statusCode, 200);
  assert.equal(JSON.parse(edited.body).language, 'fr');

  const rsvp = {
    name: 'Guest',
    attendance: 'yes',
    guests: 2,
    note: '',
    visitor: 'test-visitor-123456789',
  };
  const accepted = await callApi('POST', '/api/invitations/' + id + '/responses', rsvp);
  assert.equal(accepted.statusCode, 200);
  const rows = await callApi('GET', '/api/invitations/' + id + '/responses');
  assert.equal(rows.statusCode, 200);
  assert.equal(JSON.parse(rows.body).length, 1);

  const missing = await callApi('GET', '/api/invitations/missing');
  assert.equal(missing.statusCode, 404);
});
