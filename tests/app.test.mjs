import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createServer, validateInvitation } from '../server.mjs';
import { defaults, eventInstant, mapLinks } from '../shared/invitation.mjs';
test('Invitation validation and timezone conversion', () => {
  assert.equal(validateInvitation({ ...defaults }).bride, 'Amira');
  for (const changes of [
    { date: '2027-02-30' },
    { reception: '25:00' },
    { reception: '16:30' },
    { map: 'javascript:alert(1)' },
    { groom: '' },
    { language: 'xx' },
    { timezone: 'invalid' },
  ])
    assert.throws(() => validateInvitation({ ...defaults, ...changes }));
  assert.equal(eventInstant(defaults).toISOString(), '2027-02-19T14:00:00.000Z');
  assert.equal(
    eventInstant({ ...defaults, date: '2027-07-19' }).toISOString(),
    '2027-07-19T13:00:00.000Z',
  );
  assert.match(
    mapLinks({ ...defaults, map: 'https://maps.app.goo.gl/example' }).direct,
    /maps.app.goo.gl/,
  );
  assert.match(mapLinks({ ...defaults, map: 'Cairo Opera House' }).embed, /Cairo%20Opera%20House/);
});
test('Create, edit, RSVP, persistence, and request boundaries', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wedding-test-')),
    dataFile = path.join(dir, 'store.json');
  let server = await createServer({ dataFile });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  let base = 'http://127.0.0.1:' + server.address().port;
  t.after(async () => {
    await new Promise((r) => server.close(r));
    await fs.rm(dir, { recursive: true, force: true });
  });
  const write = (url, data, method = 'POST', origin = base) =>
    fetch(base + url, {
      method,
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  for (const route of ['/', '/admin', '/create/blossom-oud', '/preview', '/i/demo', '/i/gUaJb2s']) {
    const page = await fetch(base + route);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /<div id="root"><\/div>/);
    const script = html.match(/src="([^"]+\.js)"/);
    assert.ok(script, 'built React entry is present');
    const asset = await fetch(base + script[1]);
    assert.equal(asset.status, 200);
    assert.match(asset.headers.get('content-type'), /javascript/);
  }
  assert.equal((await fetch(base + '/api/invitations/missing')).status, 404);
  assert.equal(
    (await write('/api/invitations', defaults, 'POST', 'https://example.com')).status,
    403,
  );
  assert.equal((await write('/api/invitations', { ...defaults, date: '2027-02-31' })).status, 400);
  const created = await write('/api/invitations', { ...defaults, groom: 'Test groom' });
  assert.equal(created.status, 201);
  const inv = await created.json();
  assert.equal(
    (await write('/api/invitations/' + inv.id, { ...defaults, language: 'fr' }, 'PUT')).status,
    200,
  );
  const response = {
    name: 'Test Guest',
    attendance: 'yes',
    guests: 2,
    note: 'No nuts',
    visitor: 'test-visitor-123456789',
  };
  assert.equal((await write('/api/invitations/' + inv.id + '/responses', response)).status, 200);
  assert.equal(
    (await write('/api/invitations/' + inv.id + '/responses', { ...response, attendance: 'no' }))
      .status,
    200,
  );
  const rows = await (await fetch(base + '/api/invitations/' + inv.id + '/responses')).json();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].guests, 0);
  assert.equal(
    (await write('/api/invitations/' + inv.id + '/responses', { ...response, guests: 100 })).status,
    400,
  );
  await write('/api/invitations/' + inv.id, { ...defaults, rsvp: false }, 'PUT');
  assert.equal((await write('/api/invitations/' + inv.id + '/responses', response)).status, 409);
  const ranged = await fetch(base + '/assets/hero.mp4', { headers: { Range: 'bytes=0-99' } });
  assert.equal(ranged.status, 206);
  assert.equal((await ranged.arrayBuffer()).byteLength, 100);
  assert.equal((await fetch(base + '/data/store.json')).status, 404);
  await new Promise((r) => server.close(r));
  server = await createServer({ dataFile });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = 'http://127.0.0.1:' + server.address().port;
  assert.equal((await (await fetch(base + '/api/invitations/' + inv.id)).json()).rsvp, false);
  assert.equal(
    (await (await fetch(base + '/api/invitations/' + inv.id + '/responses')).json()).length,
    1,
  );
});
