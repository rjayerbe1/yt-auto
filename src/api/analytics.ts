import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';

export function analyticsRouter(prisma: PrismaClient) {
  const router = Router();
  const logger = createLogger('AnalyticsAPI');

  // Get analytics dashboard
  router.get('/dashboard', async (req, res) => {
    try {
      const [
        totalVideos,
        totalViews,
        avgEngagement,
        topVideos,
        recentAnalytics,
      ] = await Promise.all([
        prisma.video.count({ where: { status: 'PUBLISHED' } }),
        prisma.analytics.aggregate({ _sum: { views: true } }),
        prisma.analytics.aggregate({
          _avg: {
            likes: true,
            comments: true,
            shares: true,
            averageViewPercentage: true,
          },
        }),
        prisma.video.findMany({
          where: { status: 'PUBLISHED' },
          orderBy: { analytics: { _count: 'desc' } },
          take: 10,
          include: { analytics: true },
        }),
        prisma.analytics.findMany({
          orderBy: { updatedAt: 'desc' },
          take: 20,
          include: { video: true },
        }),
      ]);

      res.json({
        totalVideos,
        totalViews: totalViews._sum.views || 0,
        avgEngagement,
        topVideos,
        recentAnalytics,
      });
    } catch (error) {
      logger.error('Error fetching dashboard:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
  });

  // Get analytics for specific video
  router.get('/video/:videoId', async (req, res) => {
    try {
      const analytics = await prisma.analytics.findMany({
        where: { videoId: req.params.videoId },
        orderBy: { createdAt: 'desc' },
      });

      res.json(analytics);
    } catch (error) {
      logger.error('Error fetching video analytics:', error);
      res.status(500).json({ error: 'Failed to fetch video analytics' });
    }
  });

  return router;
}