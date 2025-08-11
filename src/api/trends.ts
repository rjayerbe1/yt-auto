import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { RedditScraper } from '../scrapers/RedditScraper';
import { createLogger } from '../utils/logger';

export function trendsRouter(prisma: PrismaClient) {
  const router = Router();
  const logger = createLogger('TrendsAPI');
  const redditScraper = new RedditScraper(prisma, logger);

  // Get all trends
  router.get('/', async (req, res) => {
    try {
      const { source, category, limit = 20, minScore = 0 } = req.query;
      
      const trends = await prisma.trend.findMany({
        where: {
          ...(source && { source: source as string }),
          ...(category && { category: category as string }),
          viralPotential: { gte: Number(minScore) },
        },
        orderBy: { viralPotential: 'desc' },
        take: Number(limit),
      });

      res.json(trends);
    } catch (error) {
      logger.error('Error fetching trends:', error);
      res.status(500).json({ error: 'Failed to fetch trends' });
    }
  });

  // Trigger trend analysis
  router.post('/analyze', async (req, res) => {
    try {
      // Start analysis in background
      redditScraper.getTrendingTopics().catch(error => {
        logger.error('Background trend analysis failed:', error);
      });

      res.json({ message: 'Trend analysis started' });
    } catch (error) {
      logger.error('Error starting trend analysis:', error);
      res.status(500).json({ error: 'Failed to start trend analysis' });
    }
  });

  // Get trend by ID
  router.get('/:id', async (req, res) => {
    try {
      const trend = await prisma.trend.findUnique({
        where: { id: req.params.id },
        include: { ideas: true },
      });

      if (!trend) {
        return res.status(404).json({ error: 'Trend not found' });
      }

      res.json(trend);
    } catch (error) {
      logger.error('Error fetching trend:', error);
      res.status(500).json({ error: 'Failed to fetch trend' });
    }
  });

  return router;
}