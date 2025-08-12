import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';
import { SyncedVideoGenerator } from '../video/SyncedVideoGenerator';
import { EventEmitter } from 'events';

// Esta clase extiende SyncedVideoGenerator pero usa contenido existente
class ViralContentGenerator extends SyncedVideoGenerator {
  private viralContent: any;
  
  constructor(content: any) {
    const duration = content.totalDuration || 30;
    const style = content.videoStyle || 1;
    super(duration, style);
    this.viralContent = content;
  }
  
  // Sobrescribir el método para usar contenido viral en lugar de generar aleatorio
  async generateSyncedVideo(): Promise<string> {
    try {
      logger.info('🔥 Starting VIRAL video generation with existing content...');
      logger.info(`📺 Title: ${this.viralContent.title}`);
      
      // Guardar el contenido en synced-data.json para que Remotion lo use
      const dataPath = path.join(process.cwd(), 'src', 'remotion', 'synced-data.json');
      await fs.writeFile(dataPath, JSON.stringify(this.viralContent, null, 2));
      
      // Ahora llamar al método padre pero sin generar script nuevo
      // Esto es un hack: vamos a simular que ya tenemos el script
      
      // Por ahora, usar el método original
      // TODO: Refactorizar para separar generación de script del renderizado
      return await super.generateSyncedVideo();
    } catch (error) {
      logger.error('Error in viral video generation:', error);
      throw error;
    }
  }
}

/**
 * Endpoint para generar videos virales con contenido específico
 */
export async function generateViralVideo(req: Request, res: Response) {
  try {
    // Leer el contenido actual de synced-data.json
    const syncedDataPath = path.join(process.cwd(), 'src', 'remotion', 'synced-data.json');
    const syncedContent = await fs.readFile(syncedDataPath, 'utf-8');
    const viralData = JSON.parse(syncedContent);
    
    logger.info(`🔥 Generating viral video: ${viralData.title}`);
    
    // Set up SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    
    // Disable timeout
    req.setTimeout(0);
    res.setTimeout(0);
    
    // Send initial message
    res.write(`data: ${JSON.stringify({ 
      type: 'start', 
      message: `🔥 Starting viral video generation: ${viralData.title}` 
    })}\n\n`);
    
    // Create generator with viral content
    const generator = new ViralContentGenerator(viralData);
    
    // Listen for progress updates
    generator.on('progress', (data) => {
      res.write(`data: ${JSON.stringify({ 
        type: 'progress', 
        ...data 
      })}\n\n`);
    });
    
    // Generate video
    const videoPath = await generator.generateSyncedVideo();
    
    res.write(`data: ${JSON.stringify({ 
      type: 'complete', 
      videoPath,
      message: `🔥 Viral video generated successfully!` 
    })}\n\n`);
    
    res.end();
    
  } catch (error) {
    logger.error('Error in viral video endpoint:', error);
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      error: (error as Error).message 
    })}\n\n`);
    res.end();
  }
}