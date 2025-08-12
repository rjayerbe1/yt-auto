import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';
import { ViralBrollFinder } from '../services/ViralBrollFinder';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ViralScript {
  id: string;
  title: string;
  hook: string;
  script: string;
  duration: number;
  style: string;
  tags: string[];
  expectedViews: string;
  cta?: string;
  brollSearchTerms?: string[];
}

/**
 * Version de debug que usa audios existentes para pruebas rápidas
 */
export class ViralVideoProcessorDebug extends EventEmitter {
  private outputDir: string;
  
  constructor() {
    super();
    this.outputDir = path.join(process.cwd(), 'output');
  }

  /**
   * Process viral script usando audios existentes (para debug)
   */
  async processViralScriptWithExistingAudio(viralScript: ViralScript): Promise<string> {
    try {
      logger.info(`🔧 [DEBUG MODE] Processing viral video: ${viralScript.title}`);
      
      this.emit('progress', {
        progress: 10,
        message: '🔍 Verificando audios existentes...'
      });
      
      // Verificar que exista el audio combinado
      const audioDir = path.join(this.outputDir, 'audio');
      const audioFiles = await fs.readdir(audioDir);
      const combinedAudio = audioFiles.find(f => f.includes('combined') && f.endsWith('.wav'));
      
      if (!combinedAudio) {
        throw new Error('No se encontró audio combinado en output/audio/');
      }
      
      const audioPath = path.join(audioDir, combinedAudio);
      logger.info(`✅ Usando audio existente: ${combinedAudio}`);
      
      this.emit('progress', {
        progress: 20,
        message: '🎵 Audio encontrado, preparando B-roll...'
      });
      
      // Paso 1: Buscar/generar B-roll
      const viralFinder = new ViralBrollFinder();
      const fullText = viralScript.hook + ' ' + viralScript.script + ' ' + (viralScript.cta || '');
      
      logger.info(`🎯 Buscando B-roll con ${viralScript.brollSearchTerms?.length || 0} términos personalizados`);
      
      const brollVideos = await viralFinder.findViralBroll(
        fullText,
        viralScript.duration,
        viralScript.tags,
        viralScript.brollSearchTerms
      );
      
      this.emit('progress', {
        progress: 40,
        message: `📹 ${brollVideos.length} videos de B-roll encontrados`
      });
      
      // Paso 2: Copiar B-roll a public para Remotion
      const publicBrollDir = path.join(process.cwd(), 'public', 'broll');
      await fs.mkdir(publicBrollDir, { recursive: true });
      
      // Limpiar archivos antiguos
      const existingFiles = await fs.readdir(publicBrollDir);
      for (const file of existingFiles) {
        await fs.unlink(path.join(publicBrollDir, file)).catch(() => {});
      }
      
      // Copiar nuevos archivos
      const brollPaths = [];
      for (const video of brollVideos) {
        const filename = path.basename(video);
        const destPath = path.join(publicBrollDir, filename);
        await fs.copyFile(video, destPath);
        brollPaths.push(`/broll/${filename}`);
      }
      
      logger.info(`✅ B-roll copiado a public/broll: ${brollPaths.length} archivos`);
      
      this.emit('progress', {
        progress: 50,
        message: '📝 Preparando datos de sincronización...'
      });
      
      // Paso 3: Crear datos de sincronización desde los JSONs existentes
      const syncedData = await this.createSyncedDataFromExisting(viralScript, audioPath, brollPaths);
      
      // Guardar datos para Remotion
      const syncDataPath = path.join(process.cwd(), 'src', 'remotion', 'synced-data.json');
      await fs.writeFile(syncDataPath, JSON.stringify(syncedData, null, 2));
      
      logger.info('✅ Datos de sincronización guardados');
      
      this.emit('progress', {
        progress: 60,
        message: '🎬 Renderizando video con Remotion...'
      });
      
      // Paso 4: Renderizar con Remotion (SIN audio)
      const tempVideoPath = path.join(this.outputDir, `temp_video_${Date.now()}.mp4`);
      
      const command = `npx remotion render src/remotion/index.tsx WordByWordFinal "${tempVideoPath}" --props='${JSON.stringify({
        style: 3 // Neon style para debug
      })}'`;
      
      logger.info(`🎬 Ejecutando: ${command}`);
      
      try {
        const { stdout, stderr } = await execAsync(command, {
          cwd: process.cwd(),
          maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });
        
        if (stderr && !stderr.includes('warning')) {
          logger.warn(`Remotion stderr: ${stderr}`);
        }
        
        logger.info(`Remotion stdout: ${stdout.slice(-500)}`); // Log last 500 chars
      } catch (execError: any) {
        logger.error(`Remotion execution failed:`, execError);
        throw new Error(`Failed to render video: ${execError.message}`);
      }
      
      this.emit('progress', {
        progress: 80,
        message: '🎵 Combinando audio con video...'
      });
      
      // Paso 5: Merge audio con video usando ffmpeg
      const finalVideoPath = path.join(this.outputDir, `viral_debug_${viralScript.id}_${Date.now()}.mp4`);
      
      const mergeCommand = `ffmpeg -i "${tempVideoPath}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -ar 44100 -ac 2 -map 0:v:0 -map 1:a:0 -shortest "${finalVideoPath}" -y`;
      
      logger.info(`🎵 Merging audio: ${mergeCommand}`);
      
      try {
        await execAsync(mergeCommand);
        logger.info(`✅ Audio merged successfully`);
        
        // Eliminar video temporal
        await fs.unlink(tempVideoPath).catch(() => {});
      } catch (mergeError: any) {
        logger.error(`Audio merge failed:`, mergeError);
        // Si falla el merge, usar el video sin audio
        await fs.rename(tempVideoPath, finalVideoPath);
        logger.warn('Using video without audio due to merge failure');
      }
      
      this.emit('progress', {
        progress: 90,
        message: '✅ Video renderizado exitosamente'
      });
      
      // Verificar que el archivo existe
      await fs.access(finalVideoPath);
      
      logger.info(`✅ Video generado: ${finalVideoPath}`);
      
      this.emit('progress', {
        progress: 100,
        message: '🎉 Video completado!'
      });
      
      return finalVideoPath;
      
    } catch (error) {
      logger.error('[DEBUG] Error processing viral video:', error);
      throw error;
    }
  }
  
  /**
   * Crear datos de sincronización desde archivos existentes
   */
  private async createSyncedDataFromExisting(
    viralScript: ViralScript,
    audioPath: string,
    brollPaths: string[]
  ): Promise<any> {
    
    const audioDir = path.join(this.outputDir, 'audio');
    const segmentFiles = ['hook', 'segment_0', 'segment_1', 'segment_2', 'segment_3', 'segment_4', 'cta'];
    
    let currentTime = 0;
    const allWords = [];
    const allText = [];
    
    // Leer todas las transcripciones
    for (const segmentFile of segmentFiles) {
      const jsonPath = path.join(audioDir, `${segmentFile}.json`);
      
      try {
        const content = await fs.readFile(jsonPath, 'utf-8');
        const data = JSON.parse(content);
        
        if (data.transcription && Array.isArray(data.transcription)) {
          // Convertir formato de transcripción a palabras
          for (const segment of data.transcription) {
            if (segment.text && segment.text.trim()) {
              const word = segment.text.trim();
              const startTime = this.parseTimestamp(segment.timestamps.from);
              const endTime = this.parseTimestamp(segment.timestamps.to);
              
              allWords.push({
                word: word,
                start: startTime + currentTime,
                end: endTime + currentTime,
                confidence: 1.0
              });
              
              allText.push(word);
            }
          }
          
          // Actualizar tiempo actual
          if (data.transcription.length > 0) {
            const lastSegment = data.transcription[data.transcription.length - 1];
            const lastTime = this.parseTimestamp(lastSegment.timestamps.to);
            currentTime = Math.max(currentTime, lastTime);
          }
        }
      } catch (error) {
        logger.warn(`No se pudo leer ${segmentFile}.json:`, error);
      }
    }
    
    // Si no hay palabras, crear datos falsos para prueba
    if (allWords.length === 0) {
      logger.warn('⚠️ No se encontraron transcripciones, creando datos de prueba...');
      
      const fullText = viralScript.hook + ' ' + viralScript.script + ' ' + (viralScript.cta || '');
      const words = fullText.split(/\s+/);
      const timePerWord = viralScript.duration / words.length;
      
      for (let i = 0; i < words.length; i++) {
        allWords.push({
          word: words[i],
          start: i * timePerWord,
          end: (i + 1) * timePerWord,
          confidence: 1.0
        });
      }
    }
    
    return {
      title: viralScript.title,
      duration: viralScript.duration,
      words: allWords,
      text: allText.join(' '),
      audioPath: `/audio/${path.basename(audioPath)}`,
      brollVideos: brollPaths,
      style: 3, // Neon style para debug
      metadata: {
        scriptId: viralScript.id,
        tags: viralScript.tags,
        debugMode: true,
        generatedAt: new Date().toISOString()
      }
    };
  }
  
  /**
   * Parse timestamp format "00:00:00,000" to seconds
   */
  private parseTimestamp(timestamp: string): number {
    const parts = timestamp.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const secondsParts = parts[2].split(',');
    const seconds = parseInt(secondsParts[0], 10);
    const milliseconds = parseInt(secondsParts[1], 10);
    
    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
  }
}