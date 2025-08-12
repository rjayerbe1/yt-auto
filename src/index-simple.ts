import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import { config } from './config';
import { logger } from './utils/logger';
import viralVideosRouter from './api/viral-videos';
import viralDebugRouter from './api/viral-debug';
import viralQuickRouter from './api/viral-quick';

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Basic API endpoints
app.get('/api/v1/status', (req, res) => {
  res.json({
    message: 'YouTube Shorts Automation System',
    version: '1.0.0',
    environment: config.NODE_ENV,
    features: {
      remotion: true,
      chatterbox: true,
      ffmpeg: true,
    },
  });
});

// Viral videos API routes
app.use('/api/viral', viralVideosRouter);
app.use('/api/viral-debug', viralDebugRouter);
app.use('/api/viral-quick', viralQuickRouter);

// Demo endpoints
import { DemoGenerator } from './demo/demo-generator';
const demoGen = new DemoGenerator();

app.get('/api/demo/idea', async (req, res) => {
  try {
    const idea = await demoGen.generateDemoIdea();
    res.json(idea);
  } catch (error) {
    logger.error('Error generando idea:', error);
    res.status(500).json({ error: 'Error generando idea' });
  }
});

app.post('/api/demo/script', async (req, res) => {
  try {
    const idea = await demoGen.generateDemoIdea();
    const script = await demoGen.generateDemoScript(idea);
    res.json(script);
  } catch (error) {
    logger.error('Error generando script:', error);
    res.status(500).json({ error: 'Error generando script' });
  }
});

app.post('/api/demo/video', async (req, res) => {
  try {
    const idea = await demoGen.generateDemoIdea();
    const script = await demoGen.generateDemoScript(idea);
    const videoPath = await demoGen.createDemoVideo(script);
    res.json({ 
      success: true, 
      videoDataPath: videoPath,
      message: 'Datos de video generados. Ejecuta: npm run remotion:preview' 
    });
  } catch (error) {
    logger.error('Error generando video:', error);
    res.status(500).json({ error: 'Error generando video' });
  }
});

app.get('/api/demo/run', async (req, res) => {
  try {
    await demoGen.runFullDemo();
    res.json({ 
      success: true, 
      message: 'Demo completado! Revisa los logs para más detalles.' 
    });
  } catch (error) {
    logger.error('Error ejecutando demo:', error);
    res.status(500).json({ error: 'Error ejecutando demo' });
  }
});

// Simple video generation with FFmpeg
import { SimpleVideoGenerator } from './simple-video-generator';
const videoGen = new SimpleVideoGenerator();

// Remotion video generation
import { RemotionVideoProducer } from './video/RemotionVideoProducer';
const remotionProducer = new RemotionVideoProducer();

app.post('/api/video/generate-simple', async (req, res) => {
  try {
    const videoPath = await videoGen.generateTestVideo();
    res.json({ 
      success: true, 
      videoPath,
      message: 'Video generado con FFmpeg!' 
    });
  } catch (error) {
    logger.error('Error generando video simple:', error);
    res.status(500).json({ error: 'Error generando video simple' });
  }
});

app.post('/api/video/generate-from-script', async (req, res) => {
  try {
    const idea = await demoGen.generateDemoIdea();
    const script = await demoGen.generateDemoScript(idea);
    const videoPath = await videoGen.generateFromScript(script);
    res.json({ 
      success: true, 
      videoPath,
      script: {
        title: script.title,
        hook: script.hook,
        duration: script.duration
      },
      message: 'Video generado desde script!' 
    });
  } catch (error) {
    logger.error('Error generando video desde script:', error);
    res.status(500).json({ error: 'Error generando video desde script' });
  }
});

// Remotion endpoints
app.post('/api/video/generate-remotion', async (req, res) => {
  try {
    const idea = await demoGen.generateDemoIdea();
    const script = await demoGen.generateDemoScript(idea);
    const videoPath = await remotionProducer.generateVideo(script);
    res.json({ 
      success: true, 
      videoPath,
      script: {
        title: script.title,
        hook: script.hook,
        duration: script.duration
      },
      message: 'Video generado con Remotion!' 
    });
  } catch (error) {
    logger.error('Error generando video con Remotion:', error);
    res.status(500).json({ error: 'Error generando video con Remotion' });
  }
});

// Integrated video generation with Remotion + Chatterbox TTS
import { IntegratedVideoProducer } from './video/IntegratedVideoProducer';
const integratedProducer = new IntegratedVideoProducer();

// Simple Remotion producer (más estable)
import { SimpleRemotionProducer } from './video/SimpleRemotionProducer';
const simpleRemotionProducer = new SimpleRemotionProducer();

app.post('/api/video/generate-viral', async (req, res) => {
  try {
    logger.info('🚀 Generando video viral con Remotion');
    const idea = await demoGen.generateDemoIdea();
    const script = await demoGen.generateDemoScript(idea);
    
    // Usar el productor simplificado que funciona mejor
    const videoPath = await simpleRemotionProducer.generateVideo(script);
    
    res.json({ 
      success: true, 
      videoPath,
      script: {
        title: script.title,
        hook: script.hook,
        duration: script.duration,
        callToAction: script.callToAction
      },
      message: '🎬 Video viral generado con Remotion!' 
    });
  } catch (error) {
    logger.error('Error generando video viral:', error);
    res.status(500).json({ error: 'Error generando video viral' });
  }
});

// Endpoint alternativo con audio integrado (experimental)
app.post('/api/video/generate-with-audio', async (req, res) => {
  try {
    logger.info('🚀 Generando video con audio integrado');
    const idea = await demoGen.generateDemoIdea();
    const script = await demoGen.generateDemoScript(idea);
    const videoPath = await integratedProducer.generateFullVideo(script);
    
    res.json({ 
      success: true, 
      videoPath,
      script: {
        title: script.title,
        hook: script.hook,
        duration: script.duration,
        callToAction: script.callToAction
      },
      message: '🎬 Video con audio generado!' 
    });
  } catch (error) {
    logger.error('Error generando video con audio:', error);
    res.status(500).json({ error: 'Error generando video con audio' });
  }
});

// Chatterbox TTS real
import { RealChatterbox } from './services/RealChatterbox';
import { SimpleTTS } from './services/SimpleTTS';
const chatterbox = new RealChatterbox();
const simpleTTS = new SimpleTTS();

// Test de Chatterbox TTS
app.post('/api/tts/test', async (req, res) => {
  try {
    const { text = 'Hello, this is a test of Chatterbox TTS' } = req.body;
    
    logger.info('🎤 Testing Chatterbox TTS...');
    await simpleTTS.initialize();
    
    const audioPath = await simpleTTS.generateSpeech(text);
    
    res.json({
      success: true,
      audioPath,
      message: '✅ Audio generated with Chatterbox TTS'
    });
  } catch (error) {
    logger.error('Error en TTS:', error);
    res.status(500).json({ error: 'Error generating audio' });
  }
});

// Instalar Chatterbox
app.post('/api/tts/install', async (req, res) => {
  try {
    logger.info('📦 Instalando Chatterbox TTS...');
    await chatterbox.installChatterbox();
    
    res.json({
      success: true,
      message: '✅ Chatterbox TTS instalado correctamente'
    });
  } catch (error) {
    logger.error('Error instalando Chatterbox:', error);
    res.status(500).json({ error: 'Error instalando Chatterbox' });
  }
});

// Video con audio real de Chatterbox
import { VideoWithAudio } from './video/VideoWithAudio';
const videoWithAudio = new VideoWithAudio();

// Import QuickVideoWithAudio at the top
import { QuickVideoWithAudio } from './video/QuickVideoWithAudio';
import { QuickTestVideo } from './video/QuickTestVideo';
import { OptimizedVideoGenerator } from './video/OptimizedVideoGenerator';
import { VideoWithProgress } from './video/VideoWithProgress';
import { SyncedVideoGenerator } from './video/SyncedVideoGenerator';
const quickVideo = new QuickVideoWithAudio();
const quickTest = new QuickTestVideo();
const optimizedGen = new OptimizedVideoGenerator();
const progressVideo = new VideoWithProgress();
const syncedVideo = new SyncedVideoGenerator();

// Test rápido de 2 segundos
app.post('/api/test/quick-video', async (req, res) => {
  try {
    logger.info('🧪 Running 2-second quick test...');
    
    const videoPath = await quickTest.generateQuickTest();
    
    res.json({
      success: true,
      videoPath,
      message: '✅ Quick test completed! Video with audio generated.'
    });
  } catch (error) {
    logger.error('Quick test error:', error);
    res.status(500).json({ error: 'Quick test failed' });
  }
});

// Optimized 10-second test
app.post('/api/test/optimized-video', async (req, res) => {
  try {
    const { duration = 10 } = req.body;
    logger.info(`🚀 Generating optimized ${duration}-second video...`);
    
    const videoPath = await optimizedGen.generateOptimizedVideo(duration);
    
    res.json({
      success: true,
      videoPath,
      duration,
      message: `✅ Optimized ${duration}-second video generated!`
    });
  } catch (error) {
    logger.error('Optimized video error:', error);
    res.status(500).json({ error: 'Optimized video generation failed' });
  }
});

// Generar video completo con audio real
app.post('/api/video/generate-complete', async (req, res) => {
  try {
    logger.info('🚀 Generating COMPLETE video with real Chatterbox audio');
    
    // Set a long timeout for this endpoint
    req.setTimeout(30 * 60 * 1000); // 30 minutes
    res.setTimeout(30 * 60 * 1000); // 30 minutes
    
    const videoPath = await quickVideo.generateCompleteVideo();
    
    res.json({
      success: true,
      videoPath,
      message: '🎬 Complete video with audio generated successfully!'
    });
  } catch (error) {
    logger.error('Error generando video completo:', error);
    res.status(500).json({ 
      error: 'Error generando video completo con audio',
      details: (error as Error).message 
    });
  }
});

// Generate SYNCHRONIZED video with perfect audio-text sync (with SSE progress)
app.get('/api/video/generate-synced', async (_req, res) => {
  // Get duration from query parameter (default to 30 seconds)
  const duration = parseInt(_req.query.duration as string) || 30;
  // Get style from query parameter (default to 1, range 1-6)
  const style = Math.min(6, Math.max(1, parseInt(_req.query.style as string) || 1));
  
  logger.info(`🎯 Starting SYNCHRONIZED video generation with progress (${duration} seconds, Style ${style})`);
  
  // Set up SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  
  // Disable timeout
  _req.setTimeout(0);
  res.setTimeout(0);
  
  // Send initial message
  res.write(`data: ${JSON.stringify({ 
    type: 'start', 
    message: `🎯 Starting ${duration}-second synchronized video generation (Style ${style})...` 
  })}\n\n`);
  
  // Create new instance with duration and style
  const syncGen = new SyncedVideoGenerator(duration, style);
  
  // Listen for progress updates
  syncGen.on('progress', (data) => {
    res.write(`data: ${JSON.stringify({ 
      type: 'progress', 
      ...data 
    })}\n\n`);
  });
  
  try {
    const videoPath = await syncGen.generateSyncedVideo();
    
    res.write(`data: ${JSON.stringify({ 
      type: 'complete', 
      videoPath,
      message: `🎯 ${duration}-second synchronized video generated successfully!` 
    })}\n\n`);
    
  } catch (error) {
    logger.error('Error in synced video generation:', error);
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      error: (error as Error).message 
    })}\n\n`);
  } finally {
    res.end();
  }
});

// Alternative POST endpoint for simple sync generation
app.post('/api/video/generate-synced', async (req, res) => {
  try {
    logger.info('🎯 Generating SYNCHRONIZED video (simple endpoint)');
    
    req.setTimeout(10 * 60 * 1000);
    res.setTimeout(10 * 60 * 1000);
    
    const videoPath = await syncedVideo.generateSyncedVideo();
    
    res.json({
      success: true,
      videoPath,
      message: '🎯 SYNCHRONIZED video generated successfully!'
    });
  } catch (error) {
    logger.error('Error generating synced video:', error);
    res.status(500).json({ 
      error: 'Error generating synchronized video',
      details: (error as Error).message 
    });
  }
});

// Endpoint para video animado eliminado - ahora solo usamos video sincronizado palabra por palabra

// Generate video with progress updates (Server-Sent Events)
app.get('/api/video/generate-with-progress', async (_req, res) => {
  logger.info('🚀 Starting video generation with progress tracking');
  
  // Set up SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  
  // Disable timeout
  _req.setTimeout(0);
  res.setTimeout(0);
  
  // Send initial message
  res.write(`data: ${JSON.stringify({ type: 'start', message: 'Starting video generation...' })}\n\n`);
  
  // Create new instance for this request
  const videoGen = new VideoWithProgress();
  
  // Listen for progress updates
  videoGen.on('progress', (data) => {
    res.write(`data: ${JSON.stringify({ type: 'progress', ...data })}\n\n`);
  });
  
  try {
    const videoPath = await videoGen.generateCompleteVideoWithProgress();
    
    // Send completion message
    res.write(`data: ${JSON.stringify({ 
      type: 'complete', 
      videoPath,
      message: 'Video generated successfully!' 
    })}\n\n`);
    
  } catch (error) {
    logger.error('Error in video generation:', error);
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      error: (error as Error).message 
    })}\n\n`);
  } finally {
    res.end();
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(config.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

async function startServer() {
  try {
    logger.info('Starting YouTube Shorts Automation System...');
    
    // Test database connection (optional - will work without it)
    try {
      await prisma.$connect();
      logger.info('Database connected successfully');
    } catch (dbError) {
      logger.warn('Database connection failed - running without database', dbError);
    }

    // Start server
    const port = config.PORT || 3000;
    app.listen(port, () => {
      logger.info(`🚀 Server running on http://localhost:${port}`);
      logger.info(`📝 Environment: ${config.NODE_ENV}`);
      logger.info(`🎬 Remotion ready for video generation`);
      logger.info(`🎤 Chatterbox TTS ready`);
      logger.info(`\n📚 API Documentation:`);
      logger.info(`   GET  /health - Health check`);
      logger.info(`   GET  /api/v1/status - System status`);
      logger.info(`\n💡 Tips:`);
      logger.info(`   - Configure your .env file with API keys`);
      logger.info(`   - Run 'npm run remotion:preview' to test video generation`);
      logger.info(`   - Check logs/ directory for detailed logs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();