import { Request, Response, Router } from 'express';
import { ViralVideoProcessorDebug } from '../video/ViralVideoProcessorDebug';
import { logger } from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

/**
 * POST /api/viral-debug/generate
 * Genera un video viral usando audios existentes (para debug rápido)
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { viralScript } = req.body;
    
    if (!viralScript) {
      return res.status(400).json({ error: 'viralScript is required' });
    }
    
    logger.info(`🔧 [DEBUG] Starting viral video generation for: ${viralScript.title}`);
    
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
      message: `🔧 [DEBUG MODE] Generating viral video with existing audio: ${viralScript.title}`,
      script: viralScript
    })}\n\n`);
    
    // Create debug processor
    const processor = new ViralVideoProcessorDebug();
    
    // Listen for progress
    processor.on('progress', (data) => {
      res.write(`data: ${JSON.stringify({
        type: 'progress',
        ...data
      })}\n\n`);
    });
    
    // Process video with existing audio
    const videoPath = await processor.processViralScriptWithExistingAudio(viralScript);
    
    // Send completion
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      videoPath,
      message: '✅ [DEBUG] Viral video generated successfully!',
      metadata: {
        scriptId: viralScript.id,
        title: viralScript.title,
        duration: viralScript.duration,
        debugMode: true
      }
    })}\n\n`);
    
    res.end();
    
  } catch (error) {
    logger.error('[DEBUG] Error in viral video generation:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: (error as Error).message
    })}\n\n`);
    res.end();
  }
});

/**
 * GET /api/viral-debug/check-audio
 * Verifica si existen audios generados
 */
router.get('/check-audio', async (_req: Request, res: Response) => {
  try {
    const audioDir = path.join(process.cwd(), 'output', 'audio');
    const files = await fs.readdir(audioDir);
    
    const audioFiles = files.filter(f => f.endsWith('.wav'));
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    const combinedAudio = files.find(f => f.includes('combined') && f.endsWith('.wav'));
    
    res.json({
      hasAudio: !!combinedAudio,
      combinedAudio,
      audioFiles: audioFiles.length,
      transcriptionFiles: jsonFiles.length,
      files: {
        audio: audioFiles,
        json: jsonFiles
      }
    });
  } catch (error) {
    logger.error('Error checking audio:', error);
    res.status(500).json({ error: 'Failed to check audio files' });
  }
});

export default router;