import { Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { config, schedulingConfig } from '../config';
import { createLogger } from '../utils/logger';

const logger = createLogger('Scheduler');

export async function initializeScheduler(prisma: PrismaClient) {
  const redis = new Redis(config.REDIS_URL);
  
  // Create queues
  const trendsQueue = new Queue('trends', { connection: redis });
  const scriptsQueue = new Queue('scripts', { connection: redis });
  const videosQueue = new Queue('videos', { connection: redis });

  // Schedule trend analysis every 4 hours
  await trendsQueue.add(
    'analyze-trends',
    {},
    {
      repeat: {
        pattern: '0 */4 * * *', // Every 4 hours
      },
    }
  );
  logger.info('Scheduled trend analysis every 4 hours');

  // Schedule script generation for approved ideas
  setInterval(async () => {
    try {
      const approvedIdeas = await prisma.contentIdea.findMany({
        where: { 
          status: 'APPROVED',
          scripts: { none: {} }, // Ideas without scripts
        },
        take: schedulingConfig.batchSize,
      });

      for (const idea of approvedIdeas) {
        await scriptsQueue.add('generate-script', { ideaId: idea.id });
        logger.info(`Queued script generation for idea: ${idea.id}`);
      }
    } catch (error) {
      logger.error('Error scheduling script generation:', error);
    }
  }, 30 * 60 * 1000); // Check every 30 minutes

  // Schedule video creation for completed scripts
  setInterval(async () => {
    try {
      const scriptsWithoutVideos = await prisma.script.findMany({
        where: {
          videos: { none: {} }, // Scripts without videos
        },
        take: schedulingConfig.batchSize,
      });

      for (const script of scriptsWithoutVideos) {
        await videosQueue.add('create-video', { scriptId: script.id });
        logger.info(`Queued video creation for script: ${script.id}`);
      }
    } catch (error) {
      logger.error('Error scheduling video creation:', error);
    }
  }, 20 * 60 * 1000); // Check every 20 minutes

  // Schedule uploads at optimal times
  for (const time of schedulingConfig.uploadTimes) {
    const pattern = `${time.minute} ${time.hour} * * *`;
    
    await videosQueue.add(
      'upload-video',
      {},
      {
        repeat: { pattern },
      }
    );
    logger.info(`Scheduled video upload at ${time.hour}:${time.minute.toString().padStart(2, '0')}`);
  }

  // Clean up old jobs
  setInterval(async () => {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      await prisma.job.deleteMany({
        where: {
          createdAt: { lt: oneWeekAgo },
          status: { in: ['COMPLETED', 'FAILED'] },
        },
      });
      
      logger.info('Cleaned up old job records');
    } catch (error) {
      logger.error('Error cleaning up jobs:', error);
    }
  }, 24 * 60 * 60 * 1000); // Daily cleanup

  logger.info('Scheduler initialized successfully');
}