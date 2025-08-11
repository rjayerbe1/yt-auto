import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { trendsRouter } from './trends';
import { ideasRouter } from './ideas';
import { scriptsRouter } from './scripts';
import { videosRouter } from './videos';
import { analyticsRouter } from './analytics';

export function setupRoutes(app: Express, prisma: PrismaClient) {
  // API v1 routes
  app.use('/api/v1/trends', trendsRouter(prisma));
  app.use('/api/v1/ideas', ideasRouter(prisma));
  app.use('/api/v1/scripts', scriptsRouter(prisma));
  app.use('/api/v1/videos', videosRouter(prisma));
  app.use('/api/v1/analytics', analyticsRouter(prisma));
}