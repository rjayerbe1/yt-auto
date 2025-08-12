import { SyncedVideoGenerator } from './SyncedVideoGenerator';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

/**
 * Generador de videos virales que usa el contenido de synced-data.json
 * en lugar de generar contenido aleatorio
 */
export class ViralVideoGenerator extends SyncedVideoGenerator {
  private syncedDataPath: string;

  constructor(duration: number = 30, style: number = 1) {
    super(duration, style);
    this.syncedDataPath = path.join(process.cwd(), 'src', 'remotion', 'synced-data.json');
  }

  /**
   * Genera un video usando el contenido viral de synced-data.json
   */
  async generateViralVideo(): Promise<string> {
    try {
      logger.info('🔥 Starting VIRAL video generation...');
      
      // Leer el contenido viral de synced-data.json
      const syncedDataContent = await fs.readFile(this.syncedDataPath, 'utf-8');
      const syncedData = JSON.parse(syncedDataContent);
      
      logger.info(`📺 Generating video: ${syncedData.title}`);
      logger.info(`⏱️ Duration: ${syncedData.totalDuration}s`);
      logger.info(`🎨 Style: ${syncedData.videoStyle}`);
      
      // Usar el método generateSyncedVideo pero con nuestro contenido
      // Necesitamos sobrescribir la generación de script
      return await this.generateViralFromData(syncedData);
    } catch (error) {
      logger.error('Error generating viral video:', error);
      throw error;
    }
  }

  /**
   * Genera video desde datos específicos (sin generar script aleatorio)
   */
  private async generateViralFromData(syncedData: any): Promise<string> {
    // Usar el contenido de syncedData directamente
    // En lugar de generar un script nuevo
    
    // El archivo ya está en synced-data.json, así que Remotion lo usará
    // Solo necesitamos llamar al renderizado
    
    logger.info('🎬 Using viral content from synced-data.json');
    
    // Llamar al método de renderizado directamente
    // (esto evita la generación de script aleatorio)
    const outputPath = path.join(
      process.cwd(), 
      'output', 
      'videos', 
      `viral_${Date.now()}.mp4`
    );
    
    // Aquí deberíamos renderizar directamente con Remotion
    // pero por ahora retornamos el path esperado
    logger.info('✅ Viral video prepared for rendering');
    
    return outputPath;
  }
}