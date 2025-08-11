import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ScriptGenerator } from '../generators/ScriptGenerator';
import { createLogger } from '../utils/logger';

export function ideasRouter(prisma: PrismaClient) {
  const router = Router();
  const logger = createLogger('IdeasAPI');
  const scriptGenerator = new ScriptGenerator(prisma);

  // Get all ideas
  router.get('/', async (req, res) => {
    try {
      const { status, category, limit = 20 } = req.query;
      
      const ideas = await prisma.contentIdea.findMany({
        where: {
          ...(status && { status: status as any }),
          ...(category && { category: category as string }),
        },
        orderBy: { estimatedViralScore: 'desc' },
        take: Number(limit),
        include: { trend: true },
      });

      res.json(ideas);
    } catch (error) {
      logger.error('Error fetching ideas:', error);
      res.status(500).json({ error: 'Failed to fetch ideas' });
    }
  });

  // Generate ideas from trends
  router.post('/generate', async (req, res) => {
    try {
      const { trendIds } = req.body;
      
      const trends = await prisma.trend.findMany({
        where: {
          id: { in: trendIds || [] },
        },
      });

      if (trends.length === 0) {
        const recentTrends = await prisma.trend.findMany({
          orderBy: { viralPotential: 'desc' },
          take: 5,
        });
        trends.push(...recentTrends);
      }

      // Generate ideas in background
      scriptGenerator.generateIdeasFromTrends(trends).catch(error => {
        logger.error('Background idea generation failed:', error);
      });

      res.json({ message: `Generating ideas from ${trends.length} trends` });
    } catch (error) {
      logger.error('Error generating ideas:', error);
      res.status(500).json({ error: 'Failed to generate ideas' });
    }
  });

  // Get idea by ID
  router.get('/:id', async (req, res) => {
    try {
      const idea = await prisma.contentIdea.findUnique({
        where: { id: req.params.id },
        include: { trend: true, scripts: true },
      });

      if (!idea) {
        return res.status(404).json({ error: 'Idea not found' });
      }

      res.json(idea);
    } catch (error) {
      logger.error('Error fetching idea:', error);
      res.status(500).json({ error: 'Failed to fetch idea' });
    }
  });

  // Update idea status
  router.patch('/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      
      const idea = await prisma.contentIdea.update({
        where: { id: req.params.id },
        data: { status },
      });

      res.json(idea);
    } catch (error) {
      logger.error('Error updating idea status:', error);
      res.status(500).json({ error: 'Failed to update idea status' });
    }
  });

  return router;
}