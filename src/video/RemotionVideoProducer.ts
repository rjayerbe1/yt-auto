import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import { logger } from '../utils/logger';
import { VideoScript } from '../types';
import fs from 'fs/promises';

export class RemotionVideoProducer {
  private outputDir: string;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'output');
  }

  async generateVideo(script: VideoScript): Promise<string> {
    try {
      logger.info('🎬 Iniciando generación de video con Remotion');

      // Asegurar que el directorio de salida existe
      await fs.mkdir(this.outputDir, { recursive: true });

      // Bundle del proyecto de Remotion
      const bundleLocation = await bundle({
        entryPoint: path.join(process.cwd(), 'src/remotion/index.tsx'),
        onProgress: (progress) => {
          logger.info(`Bundling: ${Math.round(progress * 100)}%`);
        },
      });

      // Configurar las props del video
      const inputProps = {
        title: script.title,
        hook: script.hook,
        content: script.content,
        scenes: script.scenes || [],
      };

      // Seleccionar la composición
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: 'MyVideo',
        inputProps,
      });

      // Nombre único para el video
      const timestamp = new Date().getTime();
      const outputPath = path.join(this.outputDir, `video-${timestamp}.mp4`);

      // Renderizar el video
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
      });

      logger.info(`✅ Video generado exitosamente: ${outputPath}`);
      return outputPath;

    } catch (error) {
      logger.error('Error generando video con Remotion:', error);
      throw error;
    }
  }

  async generateFromIdea(idea: any): Promise<string> {
    const script: VideoScript = {
      title: idea.title || 'YouTube Short',
      hook: idea.hook || 'Mira esto!',
      content: idea.content || idea.description || '',
      duration: 5,
      scenes: idea.scenes || [
        {
          type: 'text',
          content: idea.title || 'YouTube Short',
          duration: 2
        },
        {
          type: 'text',
          content: idea.hook || 'Contenido increíble',
          duration: 3
        }
      ],
      music: idea.music,
      voiceover: idea.voiceover,
      effects: idea.effects || []
    };

    return this.generateVideo(script);
  }
}