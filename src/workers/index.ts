import { Queue, Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { config } from '../config';
import { createLogger } from '../utils/logger';
import { TrendAnalyzer } from './TrendAnalyzer';
import { ScriptProcessor } from './ScriptProcessor';
import { VideoProcessor } from './VideoProcessor';

const logger = createLogger('Workers');

export async function initializeWorkers(prisma: PrismaClient) {
  const redis = new Redis(config.REDIS_URL);
  
  // Create queues
  const queues = {
    trends: new Queue('trends', { connection: redis }),
    scripts: new Queue('scripts', { connection: redis }),
    videos: new Queue('videos', { connection: redis }),
    uploads: new Queue('uploads', { connection: redis }),
  };

  // Initialize processors
  const trendAnalyzer = new TrendAnalyzer(prisma);
  const scriptProcessor = new ScriptProcessor(prisma);
  const videoProcessor = new VideoProcessor(prisma);

  // Create workers
  const trendWorker = new Worker(
    'trends',
    async (job) => {
      logger.info(`Processing trend job: ${job.id}`);
      return await trendAnalyzer.process(job.data);
    },
    {
      connection: redis,
      concurrency: 2,
    }
  );

  const scriptWorker = new Worker(
    'scripts',
    async (job) => {
      logger.info(`Processing script job: ${job.id}`);
      return await scriptProcessor.process(job.data);
    },
    {
      connection: redis,
      concurrency: 3,
    }
  );

  const videoWorker = new Worker(
    'videos',
    async (job) => {
      logger.info(`Processing video job: ${job.id}`);
      return await videoProcessor.process(job.data);
    },
    {
      connection: redis,
      concurrency: 1, // Video processing is resource-intensive
    }
  );

  // Worker event handlers
  [trendWorker, scriptWorker, videoWorker].forEach((worker) => {
    worker.on('completed', (job) => {
      logger.info(`Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, error) => {
      logger.error(`Job ${job?.id} failed:`, error);
    });
  });

  logger.info('Workers initialized successfully');
  return queues;
}