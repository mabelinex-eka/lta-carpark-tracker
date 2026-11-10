import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import healthHandler from './api/health.ts';
import carparkAvailabilityHandler from './api/carparkavailability.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Mount serverless /api handlers
  app.get('/api/health', (req, res) => healthHandler(req, res));
  app.all('/api/health.ts', (req, res) => healthHandler(req, res));

  app.get('/api/carparkavailability', (req, res) => carparkAvailabilityHandler(req, res));
  app.all('/api/carparkavailability.ts', (req, res) => carparkAvailabilityHandler(req, res));

  // In production, serve static files from dist; in development, mount Vite middleware
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LTA CarPark Tracker] Server running on port ${PORT}`);
    console.log(`- Health Check: http://localhost:${PORT}/api/health`);
    console.log(`- LTA DataMall Proxy: http://localhost:${PORT}/api/carparkavailability`);
  });
}

startServer();
