import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import { logger } from '../utils/logger';
import { VideoScript } from '../types';
import fs from 'fs/promises';

/**
 * Productor simplificado de videos con Remotion
 * Funciona sin audio externo para evitar problemas con file:// URLs
 */
export class SimpleRemotionProducer {
  private outputDir: string;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'output');
  }

  async generateVideo(script: VideoScript): Promise<string> {
    try {
      logger.info('🎬 Generando video con Remotion (simplificado)');

      // Asegurar que el directorio de salida existe
      await fs.mkdir(this.outputDir, { recursive: true });

      // Bundle del proyecto de Remotion
      const bundleLocation = await bundle({
        entryPoint: path.join(process.cwd(), 'src/remotion/index.tsx'),
        onProgress: (progress) => {
          const percentage = Math.round(progress * 100);
          if (percentage % 20 === 0) {
            logger.info(`Bundling: ${percentage}%`);
          }
        },
      });

      // Preparar escenas dinámicas
      const scenes = this.prepareScenes(script);

      // Configurar las props del video
      const inputProps = {
        title: script.title || 'YouTube Short',
        hook: script.hook || 'Check this out!',
        content: this.formatContent(script.content),
        scenes: scenes,
      };

      // Seleccionar la composición
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: 'DynamicVideo',
        inputProps,
      });

      // Nombre único para el video
      const timestamp = new Date().getTime();
      const outputPath = path.join(this.outputDir, `short-${timestamp}.mp4`);

      // Renderizar el video
      logger.info('🎥 Renderizando video...');
      await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps,
        onProgress: ({ progress }) => {
          const percentage = Math.round(progress * 100);
          if (percentage % 10 === 0) {
            logger.info(`Progreso: ${percentage}%`);
          }
        },
        // Configuración optimizada para YouTube Shorts
        crf: 23, // Buena calidad con tamaño razonable
        pixelFormat: 'yuv420p',
      });

      logger.info(`✅ Video generado: ${outputPath}`);
      
      // Generar metadata
      await this.saveMetadata(outputPath, script);

      return outputPath;

    } catch (error) {
      logger.error('Error generando video:', error);
      throw error;
    }
  }

  private prepareScenes(script: VideoScript): any[] {
    const scenes: any[] = [];

    // Escena 1: Hook inicial (impactante)
    if (script.hook) {
      scenes.push({
        type: 'text',
        content: script.hook,
        duration: 2,
        style: {
          fontSize: 90,
          color: '#FFE66D',
          fontWeight: 'bold',
          animation: 'bounce',
        }
      });
    }

    // Escena 2: Título principal
    scenes.push({
      type: 'text',
      content: script.title,
      duration: 3,
      style: {
        fontSize: 70,
        color: 'white',
        fontWeight: 'bold',
      }
    });

    // Escenas 3-5: Contenido dividido
    const contentParts = this.splitContent(script.content);
    contentParts.slice(0, 3).forEach((part, index) => {
      scenes.push({
        type: 'text',
        content: part,
        duration: 2,
        style: {
          fontSize: 60,
          color: index % 2 === 0 ? 'white' : '#8338EC',
        }
      });
    });

    // Escena final: Call to Action
    scenes.push({
      type: 'text',
      content: script.callToAction || 'Follow for more!',
      duration: 2,
      style: {
        fontSize: 70,
        color: 'white',
        background: '#FF006E',
        padding: '20px',
        borderRadius: '50px',
        animation: 'pulse',
      }
    });

    return scenes;
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

  private splitContent(content: any): string[] {
    const contentStr = this.formatContent(content);
    
    // Dividir en oraciones
    const sentences = contentStr.split(/[.!?]+/).filter(s => s.trim());
    
    // Agrupar en chunks de tamaño apropiado
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if ((currentChunk + trimmed).length > 80) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = trimmed;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + trimmed;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    // Si no hay chunks, crear uno por defecto
    if (chunks.length === 0) {
      chunks.push('Amazing content');
    }

    return chunks;
  }

  private async saveMetadata(videoPath: string, script: VideoScript): Promise<void> {
    const metadataPath = videoPath.replace('.mp4', '.json');
    
    const metadata = {
      title: script.title,
      description: this.generateDescription(script),
      tags: this.generateTags(script),
      duration: script.duration || 15,
      createdAt: new Date().toISOString(),
      script: {
        hook: script.hook,
        content: this.formatContent(script.content),
        callToAction: script.callToAction,
      }
    };

    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    logger.info(`📝 Metadata guardada: ${metadataPath}`);
  }

  private generateDescription(script: VideoScript): string {
    return [
      script.hook || script.title,
      '',
      '👉 Follow me for more viral content',
      '',
      '#Shorts #Viral #YouTubeShorts #ParaTi',
    ].join('\n');
  }

  private generateTags(script: VideoScript): string[] {
    const baseTags = [
      'shorts',
      'viral',
      'youtubeshorts',
      'fyp',
      'parati',
      'trending',
    ];

    if (script.tags) {
      return [...baseTags, ...script.tags];
    }

    return baseTags;
  }
}