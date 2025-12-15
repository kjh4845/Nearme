import express from 'express';
import cors from 'cors';
import { config } from './lib/env';
import { ensurePlacesIndex } from './lib/elasticsearch';
import authRoutes from './routes/auth';
import placeRoutes from './routes/places';

async function bootstrap() {
  await ensurePlacesIndex();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/places', placeRoutes);

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  });

  app.listen(config.port, () => {
    console.log(`Backend listening on port ${config.port}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
