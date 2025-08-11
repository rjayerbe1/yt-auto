import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ScriptGenerator } from '../generators/ScriptGenerator';
import { createLogger } from '../utils/logger';

export function scriptsRouter(prisma: PrismaClient) {
  const router = Router();
  const logger = createLogger('ScriptsAPI');
  const scriptGenerator = new ScriptGenerator(prisma);

  // Get all scripts
  router.get('/', async (req, res) => {
    try {
      const { limit = 20 } = req.query;
      
      const scripts = await prisma.script.findMany({
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        include: { idea: true },
      });

      res.json(scripts);
    } catch (error) {
      logger.error('Error fetching scripts:', error);
      res.status(500).json({ error: 'Failed to fetch scripts' });
    }
  });

  // Generate script from idea
  router.post('/generate/:ideaId', async (req, res) => {
    try {
      const idea = await prisma.contentIdea.findUnique({
        where: { id: req.params.ideaId },
      });

      if (!idea) {
        return res.status(404).json({ error: 'Idea not found' });
      }

      const script = await scriptGenerator.generateScript(idea as any);
      res.json(script);
    } catch (error) {
      logger.error('Error generating script:', error);
      res.status(500).json({ error: 'Failed to generate script' });
    }
  });

  // Get script by ID
  router.get('/:id', async (req, res) => {
    try {
      const script = await prisma.script.findUnique({
        where: { id: req.params.id },
        include: { idea: true, videos: true },
      });

      if (!script) {
        return res.status(404).json({ error: 'Script not found' });
      }

      res.json(script);
    } catch (error) {
      logger.error('Error fetching script:', error);
      res.status(500).json({ error: 'Failed to fetch script' });
    }
  });

  // Optimize existing script
  router.post('/:id/optimize', async (req, res) => {
    try {
      const script = await prisma.script.findUnique({
        where: { id: req.params.id },
      });

      if (!script) {
        return res.status(404).json({ error: 'Script not found' });
      }

      const optimized = await scriptGenerator.optimizeScript(script as any);
      res.json(optimized);
    } catch (error) {
      logger.error('Error optimizing script:', error);
      res.status(500).json({ error: 'Failed to optimize script' });
    }
  });

  return router;
}