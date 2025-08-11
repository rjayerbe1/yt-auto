import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import { logger } from '../utils/logger';
import { VideoScript } from '../types';
import { ChatterboxLocal } from '../services/ChatterboxLocal';
import fs from 'fs/promises';

export class IntegratedVideoProducer {
  private outputDir: string;
  private tts: ChatterboxLocal;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'output');
    this.tts = new ChatterboxLocal();
  }

  async generateFullVideo(script: VideoScript): Promise<string> {
    try {
      logger.info('🎬 Iniciando generación completa de video');

      // 1. Generar audio con Chatterbox TTS
      logger.info('🎤 Generando audio con Chatterbox TTS');
      const audioPath = await this.generateAudioForScript(script);

      // 2. Preparar escenas para el video
      const scenes = await this.prepareScenes(script);

      // 3. Bundle del proyecto de Remotion
      logger.info('📦 Preparando Remotion bundle');
      const bundleLocation = await bundle({
        entryPoint: path.join(process.cwd(), 'src/remotion/index.tsx'),
        onProgress: (progress) => {
          if (progress % 0.1 === 0) {
            logger.info(`Bundling: ${Math.round(progress * 100)}%`);
          }
        },
      });

      // 4. Configurar las props del video sin audio por ahora
      // Remotion no puede usar file:// URLs, necesita staticFile o URLs http
      const inputProps = {
        title: script.title,
        hook: script.hook,
        content: script.content,
        scenes: scenes,
        // audioUrl se manejará diferente en el componente
      };

      // 5. Seleccionar la composición dinámica
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: 'DynamicVideo',
        inputProps,
      });

      // 6. Nombre único para el video
      const timestamp = new Date().getTime();
      const outputPath = path.join(this.outputDir, `viral-short-${timestamp}.mp4`);

      // 7. Renderizar el video con audio
      logger.info('🎥 Renderizando video con Remotion');
      await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps,
        onProgress: ({ progress }) => {
          const percentage = Math.round(progress * 100);
          if (percentage % 10 === 0) {
            logger.info(`Renderizando: ${percentage}%`);
          }
        },
        // Configuración optimizada para YouTube Shorts
        crf: 18, // Alta calidad (usar CRF o videoBitrate, no ambos)
        audioBitrate: '320k',
        pixelFormat: 'yuv420p',
      });

      logger.info(`✅ Video viral generado exitosamente: ${outputPath}`);
      
      // 8. Generar metadata para el video
      await this.generateVideoMetadata(outputPath, script);

      return outputPath;

    } catch (error) {
      logger.error('Error generando video completo:', error);
      throw error;
    }
  }

  private async generateAudioForScript(script: VideoScript): Promise<string | null> {
    try {
      // Crear texto completo para narración
      const narrationText = this.createNarrationText(script);
      
      if (!narrationText) {
        logger.warn('No hay texto para narración');
        return null;
      }

      // Generar audio con voz viral
      const audioPath = path.join(
        this.outputDir,
        'audio',
        `narration-${Date.now()}.mp3`
      );

      await this.tts.generateSpeech(
        narrationText,
        {
          voiceId: 'alex', // Voz energética por defecto
          speed: 1.05, // Ligeramente más rápido para mantener atención
          pitch: 1.0,
          volume: 1.0,
        },
        audioPath
      );

      return audioPath;
    } catch (error) {
      logger.error('Error generando audio:', error);
      // Continuar sin audio si falla
      return null;
    }
  }

  private createNarrationText(script: VideoScript): string {
    const parts: string[] = [];

    // Hook inicial
    if (script.hook) {
      parts.push(script.hook);
      parts.push(''); // Pausa
    }

    // Contenido principal
    if (script.content) {
      parts.push(script.content);
    }

    // Escenas con narración
    if (script.scenes) {
      script.scenes.forEach(scene => {
        if (scene.type === 'text' && scene.content) {
          parts.push(scene.content);
        }
      });
    }

    // Call to action
    if (script.callToAction) {
      parts.push(''); // Pausa antes del CTA
      parts.push(script.callToAction);
    }

    return parts.filter(p => p !== undefined).join('. ');
  }

  private async prepareScenes(script: VideoScript): Promise<any[]> {
    const scenes: any[] = [];

    // Escena de hook
    if (script.hook) {
      scenes.push({
        type: 'text',
        content: script.hook,
        duration: 2,
        style: {
          fontSize: 80,
          color: '#FFE66D',
          fontWeight: 'bold',
        }
      });
    }

    // Escenas del contenido
    if (script.scenes && script.scenes.length > 0) {
      scenes.push(...script.scenes);
    } else {
      // Crear escenas automáticas desde el contenido
      const contentParts = this.splitContent(script.content);
      contentParts.forEach((part, index) => {
        scenes.push({
          type: 'text',
          content: part,
          duration: Math.min(3, Math.max(1, part.length / 50)), // Duración basada en longitud
          style: {
            fontSize: 60,
            color: index % 2 === 0 ? 'white' : '#FFE66D',
          }
        });
      });
    }

    // Escena de CTA
    if (script.callToAction) {
      scenes.push({
        type: 'text',
        content: script.callToAction,
        duration: 2,
        style: {
          fontSize: 70,
          color: 'white',
          background: '#FF006E',
          padding: '20px',
          borderRadius: '50px',
        }
      });
    }

    return scenes;
  }

  private splitContent(content: string | any): string[] {
    // Asegurar que content es string
    const contentStr = typeof content === 'string' 
      ? content 
      : (content?.toString() || JSON.stringify(content) || '');
    
    // Dividir contenido en partes manejables para las escenas
    const sentences = contentStr.split(/[.!?]+/).filter(s => s.trim());
    const parts: string[] = [];
    
    let currentPart = '';
    for (const sentence of sentences) {
      if ((currentPart + sentence).length > 100) {
        if (currentPart) parts.push(currentPart.trim());
        currentPart = sentence;
      } else {
        currentPart += (currentPart ? '. ' : '') + sentence;
      }
    }
    
    if (currentPart) {
      parts.push(currentPart.trim());
    }

    return parts;
  }

  private async generateVideoMetadata(videoPath: string, script: VideoScript): Promise<void> {
    const metadataPath = videoPath.replace('.mp4', '.metadata.json');
    
    const metadata = {
      title: script.title,
      description: this.generateDescription(script),
      tags: this.generateTags(script),
      category: 'Entertainment',
      language: 'es',
      thumbnail: null, // Se puede generar después
      createdAt: new Date().toISOString(),
      duration: script.duration,
      script: {
        hook: script.hook,
        content: script.content,
        callToAction: script.callToAction,
      }
    };

    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    logger.info(`📝 Metadata guardada: ${metadataPath}`);
  }

  private generateDescription(script: VideoScript): string {
    const lines: string[] = [];
    
    lines.push(script.hook || script.title);
    lines.push('');
    lines.push('📱 No olvides seguirme para más contenido viral!');
    lines.push('');
    lines.push('#Shorts #Viral #Trending');
    
    return lines.join('\n');
  }

  private generateTags(script: VideoScript): string[] {
    const tags = [
      'shorts',
      'viral',
      'trending',
      'youtubeshorts',
      'fyp',
      'parati',
    ];

    // Agregar tags específicos del contenido
    if (script.tags) {
      tags.push(...script.tags);
    }

    return tags;
  }
}