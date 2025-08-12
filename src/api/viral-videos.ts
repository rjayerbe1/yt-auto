import { Request, Response, Router } from 'express';
import { ViralVideoProcessorFixed } from '../video/ViralVideoProcessorFixed';
import { logger } from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

/**
 * GET /api/viral/scripts
 * Lista todos los scripts virales disponibles
 */
router.get('/scripts', async (_req: Request, res: Response) => {
  try {
    const scriptsPath = path.join(process.cwd(), 'data', 'viral-scripts.json');
    const scriptsData = JSON.parse(await fs.readFile(scriptsPath, 'utf-8'));
    
    // Format response
    const response = {
      channel1_psychology: scriptsData.channel1_psychology.map((s: any) => ({
        id: s.id,
        title: s.title,
        duration: s.duration,
        expectedViews: s.expectedViews,
        tags: s.tags
      })),
      channel2_horror: scriptsData.channel2_horror.map((s: any) => ({
        id: s.id,
        title: s.title,
        duration: s.duration,
        expectedViews: s.expectedViews,
        tags: s.tags
      }))
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Error loading viral scripts:', error);
    res.status(500).json({ error: 'Failed to load viral scripts' });
  }
});

/**
 * GET /api/viral/script/:id
 * Obtiene un script viral específico
 */
router.get('/script/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const scriptsPath = path.join(process.cwd(), 'data', 'viral-scripts.json');
    const scriptsData = JSON.parse(await fs.readFile(scriptsPath, 'utf-8'));
    
    // Find script
    let script = null;
    for (const s of [...scriptsData.channel1_psychology, ...scriptsData.channel2_horror]) {
      if (s.id === id) {
        script = s;
        break;
      }
    }
    
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    res.json(script);
  } catch (error) {
    logger.error('Error loading viral script:', error);
    res.status(500).json({ error: 'Failed to load viral script' });
  }
});

/**
 * POST /api/viral/generate
 * Genera un video viral con el script especificado
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { scriptId, script } = req.body;
    
    if (!scriptId && !script) {
      return res.status(400).json({ error: 'Either scriptId or script object required' });
    }
    
    // Set up SSE for progress
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    
    // Disable timeout
    req.setTimeout(0);
    res.setTimeout(0);
    
    // Create processor
    const processor = new ViralVideoProcessorFixed();
    
    // Listen for progress
    processor.on('progress', (data) => {
      res.write(`data: ${JSON.stringify({
        type: 'progress',
        ...data
      })}\n\n`);
    });
    
    // Send start message
    res.write(`data: ${JSON.stringify({
      type: 'start',
      message: scriptId ? 
        `Starting viral video generation for script: ${scriptId}` :
        `Starting viral video generation: ${script.title}`
    })}\n\n`);
    
    let videoPath: string;
    
    if (scriptId) {
      // Generate from script ID
      videoPath = await processor.processViralFromFile(scriptId);
    } else {
      // Generate from provided script object
      videoPath = await processor.processViralScript(script);
    }
    
    // Send completion
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      videoPath,
      message: 'Viral video generated successfully!'
    })}\n\n`);
    
    res.end();
    
  } catch (error) {
    logger.error('Error generating viral video:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: (error as Error).message
    })}\n\n`);
    res.end();
  }
});

/**
 * GET /api/viral/generate/:id
 * Genera un video viral usando SSE para progreso
 */
router.get('/generate/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Load script
    const scriptsPath = path.join(process.cwd(), 'data', 'viral-scripts.json');
    const scriptsData = JSON.parse(await fs.readFile(scriptsPath, 'utf-8'));
    
    let viralScript = null;
    for (const s of [...scriptsData.channel1_psychology, ...scriptsData.channel2_horror]) {
      if (s.id === id) {
        viralScript = s;
        break;
      }
    }
    
    if (!viralScript) {
      res.status(404).json({ error: 'Script not found' });
      return;
    }
    
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
      message: `🔥 Generating viral video: ${viralScript.title}`,
      script: viralScript
    })}\n\n`);
    
    // Create processor
    const processor = new ViralVideoProcessorFixed();
    
    // Listen for progress
    processor.on('progress', (data) => {
      res.write(`data: ${JSON.stringify({
        type: 'progress',
        ...data
      })}\n\n`);
    });
    
    // Process video
    const videoPath = await processor.processViralScript(viralScript);
    
    // Send completion
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      videoPath,
      message: '✅ Viral video generated successfully!',
      metadata: {
        scriptId: viralScript.id,
        title: viralScript.title,
        duration: viralScript.duration,
        expectedViews: viralScript.expectedViews
      }
    })}\n\n`);
    
    res.end();
    
  } catch (error) {
    logger.error('Error in viral video generation:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: (error as Error).message
    })}\n\n`);
    res.end();
  }
});

export default router;