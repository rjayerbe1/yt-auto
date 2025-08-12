import { Request, Response, Router } from 'express';
import { ViralVideoProcessorQuick } from '../video/ViralVideoProcessorQuick';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/viral-quick/generate
 * Genera un video viral usando audios existentes (para debug rápido)
 * USA EL PROCESO EXACTO DEL ORIGINAL pero con audios existentes
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { script } = req.body;
    
    if (!script) {
      return res.status(400).json({ error: 'script object is required' });
    }
    
    logger.info(`🚀 [QUICK MODE] Starting viral video generation: ${script.title}`);
    logger.info(`   This will use existing audio from output/audio/`);
    
    // Set up SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    
    req.setTimeout(0);
    res.setTimeout(0);
    
    // Send initial message
    res.write(`data: ${JSON.stringify({
      type: 'start',
      message: `🚀 [QUICK MODE] Generating viral video with existing audio: ${script.title}`,
      script: script
    })}\n\n`);
    
    // Create quick processor
    const processor = new ViralVideoProcessorQuick();
    
    // Listen for progress
    processor.on('progress', (data) => {
      res.write(`data: ${JSON.stringify({
        type: 'progress',
        ...data
      })}\n\n`);
    });
    
    // Process video with existing audio
    const videoPath = await processor.processViralScript(script);
    
    // Send completion
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      videoPath,
      message: '✅ [QUICK] Viral video generated successfully!',
      metadata: {
        scriptId: script.id,
        title: script.title,
        duration: script.duration,
        quickMode: true
      }
    })}\n\n`);
    
    res.end();
    
  } catch (error) {
    logger.error('[QUICK] Error in viral video generation:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: (error as Error).message
    })}\n\n`);
    res.end();
  }
});

export default router;