import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().optional().default('postgresql://postgres:postgres@localhost:5432/ytauto?schema=public'),
  
  // Redis
  REDIS_URL: z.string().url().optional().default('redis://localhost:6379'),
  
  // API Keys
  OPENAI_API_KEY: z.string().optional().default('sk-dummy-key'),
  ELEVENLABS_API_KEY: z.string().optional(),
  
  // YouTube OAuth
  YOUTUBE_CLIENT_ID: z.string().optional(),
  YOUTUBE_CLIENT_SECRET: z.string().optional(),
  YOUTUBE_REDIRECT_URI: z.string().url().optional(),
  
  // Reddit API
  REDDIT_CLIENT_ID: z.string().optional(),
  REDDIT_CLIENT_SECRET: z.string().optional(),
  REDDIT_USER_AGENT: z.string().default('YTAutoBot/1.0.0'),
  
  // Server
  PORT: z.string().transform(Number).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Security
  JWT_SECRET: z.string().min(32).optional(),
  ENCRYPTION_KEY: z.string().length(32).optional(),
  
  // Storage
  STORAGE_PATH: z.string().default('./output'),
  TEMP_PATH: z.string().default('./output/temp'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_DIR: z.string().default('./logs'),
});

export const config = envSchema.parse(process.env);

export const videoConfig = {
  formats: {
    resolution: '1080x1920',
    fps: 30,
    codec: 'h264',
    bitrate: '8M',
    audioCodec: 'aac',
    audioBitrate: '128k',
  },
  duration: {
    min: 15,
    max: 60,
    optimal: 45,
  },
  thumbnail: {
    width: 1280,
    height: 720,
  },
};

export const contentConfig = {
  categories: [
    'technology',
    'science',
    'psychology',
    'lifehacks',
    'finance',
    'health',
    'education',
    'entertainment',
  ],
  
  languages: ['en', 'es', 'pt'],
  
  trendSources: {
    reddit: {
      subreddits: [
        'todayilearned',
        'explainlikeimfive',
        'askreddit',
        'showerthoughts',
        'lifeprotips',
        'youshouldknow',
        'interestingasfuck',
        'damnthatsinteresting',
      ],
      minScore: 1000,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    
    youtube: {
      categories: ['28', '27', '24', '22', '25'], // Tech, Education, Entertainment, People, News
      maxResults: 50,
    },
  },
  
  viralScoreThreshold: 75,
  minEngagementRate: 0.05,
};

export const schedulingConfig = {
  uploadTimes: [
    { hour: 9, minute: 0 },
    { hour: 13, minute: 0 },
    { hour: 18, minute: 0 },
    { hour: 21, minute: 0 },
  ],
  
  batchSize: 5,
  maxDailyUploads: 10,
  
  retryAttempts: 3,
  retryDelay: 5000,
};