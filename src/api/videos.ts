import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';

export function videosRouter(prisma: PrismaClient) {
  const router = Router();
  const logger = createLogger('VideosAPI');

  // Get all videos
  router.get('/', async (req, res) => {
    try {
      const { status, channelId, limit = 20 } = req.query;
      
      const videos = await prisma.video.findMany({
        where: {
          ...(status && { status: status as any }),
          ...(channelId && { channelId: channelId as string }),
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        include: { script: true, channel: true },
      });

      res.json(videos);
    } catch (error) {
      logger.error('Error fetching videos:', error);
      res.status(500).json({ error: 'Failed to fetch videos' });
    }
  });

  // Get video by ID
  router.get('/:id', async (req, res) => {
    try {
      const video = await prisma.video.findUnique({
        where: { id: req.params.id },
        include: { 
          script: { include: { idea: true } },
          channel: true,
          analytics: true 
        },
      });

      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }

      res.json(video);
    } catch (error) {
      logger.error('Error fetching video:', error);
      res.status(500).json({ error: 'Failed to fetch video' });
    }
  });

  // Update video status
  router.patch('/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      
      const video = await prisma.video.update({
        where: { id: req.params.id },
        data: { status },
      });

      res.json(video);
    } catch (error) {
      logger.error('Error updating video status:', error);
      res.status(500).json({ error: 'Failed to update video status' });
    }
  });

  return router;
}