import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';
import { SyncedVideoGenerator } from './SyncedVideoGenerator';

/**
 * Version rápida de SyncedVideoGenerator que usa audios existentes
 */
export class SyncedVideoGeneratorQuick extends SyncedVideoGenerator {
  
  constructor(videoDuration: number = 30, videoStyle: number = 1) {
    super(videoDuration, videoStyle);
  }

  /**
   * Override para usar audios existentes en lugar de generar nuevos
   */
  async generateSyncedVideo(): Promise<string> {
    try {
      logger.info('🚀 [QUICK MODE] Starting synced video generation with existing audio...');
      
      // Verificar si existen audios en output/audio
      const audioDir = path.join(process.cwd(), 'output', 'audio');
      const tempDir = path.join(process.cwd(), 'output', 'temp');
      
      try {
        const audioFiles = await fs.readdir(audioDir);
        const combinedAudio = audioFiles.find(f => f.includes('combined') && f.endsWith('.wav'));
        
        if (combinedAudio) {
          logger.info(`✅ [QUICK] Found existing audio: ${combinedAudio}`);
          
          // Crear directorio temp si no existe
          await fs.mkdir(tempDir, { recursive: true });
          
          // Copiar el audio existente a donde el proceso lo espera
          const sourcePath = path.join(audioDir, combinedAudio);
          const destPath = path.join(tempDir, 'combined_audio.wav');
          
          await fs.copyFile(sourcePath, destPath);
          logger.info(`✅ [QUICK] Audio copied to expected location`);
          
          // También copiar los archivos JSON de transcripción si existen
          const jsonFiles = audioFiles.filter(f => f.endsWith('.json'));
          for (const jsonFile of jsonFiles) {
            const sourceJson = path.join(audioDir, jsonFile);
            const destJson = path.join(tempDir, jsonFile);
            await fs.copyFile(sourceJson, destJson);
          }
          logger.info(`✅ [QUICK] Copied ${jsonFiles.length} transcription files`);
          
          // Marcar que ya tenemos audio para saltar ese paso
          this['audioAlreadyExists'] = true;
        }
      } catch (error) {
        logger.warn('[QUICK] No existing audio found, will generate new');
      }
      
      // Llamar al método original
      return super.generateSyncedVideo();
      
    } catch (error) {
      logger.error('[QUICK] Error in quick generation:', error);
      throw error;
    }
  }
  
  /**
   * Override el método que genera audio para saltarlo si ya existe
   */
  private async generateAudioWithDuration(text: string, filename: string): Promise<{ file: string; duration: number }> {
    if (this['audioAlreadyExists']) {
      logger.info(`⏭️ [QUICK] Skipping audio generation for ${filename} - using existing`);
      
      // Buscar el archivo de audio existente
      const tempDir = path.join(process.cwd(), 'output', 'temp');
      const audioDir = path.join(process.cwd(), 'output', 'audio');
      
      // Primero buscar en temp
      let audioPath = path.join(tempDir, `${filename}.wav`);
      
      try {
        await fs.access(audioPath);
        logger.info(`✅ [QUICK] Found audio in temp: ${filename}.wav`);
      } catch {
        // Si no está en temp, buscar en audio
        audioPath = path.join(audioDir, `${filename}.wav`);
        
        try {
          await fs.access(audioPath);
          logger.info(`✅ [QUICK] Found audio in audio dir: ${filename}.wav`);
        } catch {
          // Si no existe el segmento específico, usar el audio combinado
          const combinedPath = path.join(tempDir, 'combined_audio.wav');
          try {
            await fs.access(combinedPath);
            audioPath = combinedPath;
            logger.info(`✅ [QUICK] Using combined audio as fallback`);
          } catch {
            // Última opción: buscar cualquier audio combinado
            const audioFiles = await fs.readdir(audioDir);
            const combined = audioFiles.find(f => f.includes('combined') && f.endsWith('.wav'));
            if (combined) {
              audioPath = path.join(audioDir, combined);
              logger.info(`✅ [QUICK] Using existing combined audio: ${combined}`);
            } else {
              throw new Error('No audio files found');
            }
          }
        }
      }
      
      // Obtener duración del audio
      let duration = 5; // Default
      try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`;
        const { stdout } = await execAsync(command);
        duration = parseFloat(stdout.trim());
      } catch {
        logger.warn(`[QUICK] Could not get duration for ${filename}, using default`);
      }
      
      return { file: audioPath, duration };
    }
    
    // Si no hay audio existente, generar normalmente
    return super['generateAudioWithDuration'](text, filename);
  }
}