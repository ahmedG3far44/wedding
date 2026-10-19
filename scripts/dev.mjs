import { createServer as createViteServer } from 'vite';
import { createServer } from '../server.mjs';

// Vite and the existing API share one origin, including the preview iframe.
let vite;
const server = await createServer({ frontend: (req, res) => vite.middlewares(req, res) });
vite = await createViteServer({
  server: { middlewareMode: true, hmr: { server } },
  appType: 'spa',
});
const port = Number(process.env.PORT) || 3000;
server.on('error', async (error) => {
  console.error(error.message);
  await vite.close();
  process.exit(1);
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Invitation: http://localhost:${port}\nEditor: http://localhost:${port}/admin`);
});
let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  await vite.close();
  server.closeAllConnections();
  server.close(() => process.exit(0));
}
process.on('SIGINT', close);
process.on('SIGTERM', close);
