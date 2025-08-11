import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import { logger } from '../utils/logger';
import { VideoScript } from '../types';
import { RealChatterbox } from '../services/RealChatterbox';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Productor de videos con audio real de Chatterbox
 */
export class VideoWithAudio {
  private outputDir: string;
  private audioDir: string;
  private chatterbox: RealChatterbox;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'output', 'videos');
    this.audioDir = path.join(process.cwd(), 'output', 'audio');
    this.chatterbox = new RealChatterbox();
  }

  async generateCompleteVideo(script: VideoScript): Promise<string> {
    try {
      logger.info('🎬 Iniciando generación de video con audio real');

      // Asegurar directorios
      await fs.mkdir(this.outputDir, { recursive: true });
      await fs.mkdir(this.audioDir, { recursive: true });

      // 1. Generar todos los audios con Chatterbox
      logger.info('🎤 Generando audio con Chatterbox TTS...');
      const audioFiles = await this.generateAllAudio(script);
      
      // 2. Combinar audios en uno solo
      logger.info('🎵 Combinando archivos de audio...');
      const combinedAudio = await this.combineAudioFiles(audioFiles);

      // 3. Generar video con Remotion (sin audio)
      logger.info('🎥 Generando video con Remotion...');
      const videoPath = await this.generateVideoOnly(script);

      // 4. Combinar video con audio usando FFmpeg
      logger.info('🔧 Combinando video y audio...');
      const finalVideoPath = await this.mergeVideoAndAudio(videoPath, combinedAudio);

      logger.info(`✅ Video completo generado: ${finalVideoPath}`);
      
      // 5. Limpiar archivos temporales
      await this.cleanup(audioFiles, videoPath, combinedAudio);

      return finalVideoPath;

    } catch (error) {
      logger.error('Error generando video con audio:', error);
      throw error;
    }
  }

  private async generateAllAudio(script: VideoScript): Promise<string[]> {
    const audioFiles: string[] = [];

    try {
      // Inicializar Chatterbox
      await this.chatterbox.initialize();

      // 1. Audio del hook
      if (script.hook) {
        logger.info('  Generando audio del hook...');
        const hookAudio = path.join(this.audioDir, `hook_${Date.now()}.wav`);
        await this.chatterbox.generateSpeech(script.hook, hookAudio);
        audioFiles.push(hookAudio);
      }

      // 2. Audio del contenido
      if (script.content) {
        const content = this.formatContent(script.content);
        
        // Si el contenido es muy largo, dividirlo
        const contentParts = this.splitContent(content);
        
        for (let i = 0; i < contentParts.length; i++) {
          logger.info(`  Generando audio del contenido ${i + 1}/${contentParts.length}...`);
          const contentAudio = path.join(this.audioDir, `content_${i}_${Date.now()}.wav`);
          await this.chatterbox.generateSpeech(contentParts[i], contentAudio);
          audioFiles.push(contentAudio);
        }
      }

      // 3. Audio del call to action
      if (script.callToAction) {
        logger.info('  Generando audio del CTA...');
        const ctaAudio = path.join(this.audioDir, `cta_${Date.now()}.wav`);
        await this.chatterbox.generateSpeech(script.callToAction, ctaAudio);
        audioFiles.push(ctaAudio);
      }

      logger.info(`  ✅ ${audioFiles.length} archivos de audio generados`);
      return audioFiles;

    } catch (error) {
      logger.error('Error generando audios:', error);
      // Si falla, retornar los que se hayan generado
      return audioFiles;
    }
  }

  private async combineAudioFiles(audioFiles: string[]): Promise<string> {
    if (audioFiles.length === 0) {
      throw new Error('No hay archivos de audio para combinar');
    }

    if (audioFiles.length === 1) {
      return audioFiles[0];
    }

    const outputPath = path.join(this.audioDir, `combined_${Date.now()}.wav`);
    
    // Crear archivo de lista para FFmpeg
    const listFile = path.join(this.audioDir, 'concat_list.txt');
    const fileList = audioFiles.map(f => `file '${f}'`).join('\n');
    await fs.writeFile(listFile, fileList);

    // Combinar con FFmpeg
    const command = `ffmpeg -f concat -safe 0 -i "${listFile}" -c copy "${outputPath}" -y`;
    await execAsync(command);

    // Limpiar archivo de lista
    await fs.unlink(listFile);

    return outputPath;
  }

  private async generateVideoOnly(script: VideoScript): Promise<string> {
    // Bundle del proyecto de Remotion
    const bundleLocation = await bundle({
      entryPoint: path.join(process.cwd(), 'src/remotion/index.tsx'),
      onProgress: (progress) => {
        if (Math.round(progress * 100) % 20 === 0) {
          logger.info(`  Bundling: ${Math.round(progress * 100)}%`);
        }
      },
    });

    // Preparar las props del video
    const inputProps = {
      title: script.title,
      hook: script.hook,
      content: this.formatContent(script.content),
      scenes: this.prepareScenes(script),
    };

    // Seleccionar la composición
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'DynamicVideo',
      inputProps,
    });

    // Renderizar video sin audio
    const videoPath = path.join(this.outputDir, `video_noaudio_${Date.now()}.mp4`);
    
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: videoPath,
      inputProps,
      onProgress: ({ progress }) => {
        if (Math.round(progress * 100) % 10 === 0) {
          logger.info(`  Renderizando: ${Math.round(progress * 100)}%`);
        }
      },
      crf: 23,
      pixelFormat: 'yuv420p',
    });

    return videoPath;
  }

  private async mergeVideoAndAudio(videoPath: string, audioPath: string): Promise<string> {
    const outputPath = path.join(this.outputDir, `final_${Date.now()}.mp4`);
    
    // Obtener duración del audio
    const audioDurationCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`;
    const audioDuration = parseFloat(await execAsync(audioDurationCmd).then(r => r.stdout.trim()));
    
    // Combinar video y audio, ajustando la duración del video al audio
    const command = `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -t ${audioDuration} -y "${outputPath}"`;
    
    await execAsync(command);
    
    return outputPath;
  }

  private formatContent(content: any): string {
    if (typeof content === 'string') {
      return content;
    }
    if (Array.isArray(content)) {
      return content.map(item => 
        typeof item === 'string' ? item : item.content || ''
      ).join('. ');
    }
    if (content && typeof content === 'object') {
      return JSON.stringify(content);
    }
    return '';
  }

  private splitContent(content: string): string[] {
    const maxLength = 200; // Máximo de caracteres por parte
    const parts: string[] = [];
    
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    let currentPart = '';
    
    for (const sentence of sentences) {
      if ((currentPart + sentence).length > maxLength) {
        if (currentPart) parts.push(currentPart.trim());
        currentPart = sentence;
      } else {
        currentPart += (currentPart ? '. ' : '') + sentence;
      }
    }
    
    if (currentPart) {
      parts.push(currentPart.trim());
    }

    return parts.length > 0 ? parts : [content];
  }

  private prepareScenes(script: VideoScript): any[] {
    const scenes: any[] = [];

    // Hook
    if (script.hook) {
      scenes.push({
        type: 'text',
        content: script.hook,
        duration: 3,
        style: { fontSize: 80, color: '#FFE66D', fontWeight: 'bold' }
      });
    }

    // Contenido
    const contentParts = this.splitContent(this.formatContent(script.content));
    contentParts.forEach((part, i) => {
      scenes.push({
        type: 'text',
        content: part,
        duration: Math.max(2, Math.min(5, part.length / 30)),
        style: { fontSize: 60, color: i % 2 === 0 ? 'white' : '#8338EC' }
      });
    });

    // CTA
    if (script.callToAction) {
      scenes.push({
        type: 'text',
        content: script.callToAction,
        duration: 3,
        style: { 
          fontSize: 70, 
          color: 'white', 
          background: '#FF006E',
          padding: '20px',
          borderRadius: '50px'
        }
      });
    }

    return scenes;
  }

  private async cleanup(audioFiles: string[], videoPath: string, combinedAudio: string): Promise<void> {
    try {
      // Eliminar archivos de audio individuales
      for (const file of audioFiles) {
        await fs.unlink(file).catch(() => {});
      }
      
      // Eliminar video sin audio
      await fs.unlink(videoPath).catch(() => {});
      
      // Eliminar audio combinado
      await fs.unlink(combinedAudio).catch(() => {});
      
      logger.info('  🧹 Archivos temporales eliminados');
    } catch (error) {
      logger.warn('No se pudieron eliminar algunos archivos temporales');
    }
  }
}