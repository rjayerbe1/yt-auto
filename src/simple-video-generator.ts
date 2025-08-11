import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import { createLogger } from './utils/logger';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const logger = createLogger('SimpleVideoGenerator');

export class SimpleVideoGenerator {
  
  async generateTestVideo(): Promise<string> {
    const outputPath = path.join(process.cwd(), 'output', 'test-video.mp4');
    
    logger.info('Generando video de prueba con FFmpeg...');
    
    return new Promise((resolve, reject) => {
      ffmpeg()
        // Crear un video de color sólido con texto
        .input('color=c=black:s=1080x1920:d=5')
        .inputFormat('lavfi')
        
        // Añadir filtros de texto
        .videoFilters([
          {
            filter: 'drawtext',
            options: {
              text: 'YouTube Shorts',
              fontsize: 80,
              fontcolor: 'white',
              x: '(w-text_w)/2',
              y: '(h-text_h)/2-100',
              fontfile: '/System/Library/Fonts/Helvetica.ttc'
            }
          },
          {
            filter: 'drawtext',
            options: {
              text: 'Sistema de Automatización',
              fontsize: 40,
              fontcolor: 'red',
              x: '(w-text_w)/2',
              y: '(h-text_h)/2',
              fontfile: '/System/Library/Fonts/Helvetica.ttc'
            }
          },
          {
            filter: 'drawtext',
            options: {
              text: '¡Funcionando!',
              fontsize: 60,
              fontcolor: 'yellow',
              x: '(w-text_w)/2',
              y: '(h-text_h)/2+100',
              fontfile: '/System/Library/Fonts/Helvetica.ttc'
            }
          }
        ])
        
        // Configuración de salida
        .outputOptions([
          '-c:v libx264',
          '-preset fast',
          '-crf 23',
          '-pix_fmt yuv420p',
          '-movflags +faststart'
        ])
        
        .on('start', (command) => {
          logger.info('Comando FFmpeg:', command);
        })
        
        .on('progress', (progress) => {
          logger.info(`Progreso: ${progress.percent?.toFixed(2)}%`);
        })
        
        .on('error', (err) => {
          logger.error('Error generando video:', err);
          reject(err);
        })
        
        .on('end', () => {
          logger.info(`Video generado exitosamente: ${outputPath}`);
          resolve(outputPath);
        })
        
        .save(outputPath);
    });
  }
  
  async generateFromScript(script: any): Promise<string> {
    const outputPath = path.join(process.cwd(), 'output', `video-${Date.now()}.mp4`);
    
    logger.info('Generando video desde script...');
    
    // Crear directorio si no existe
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    return new Promise((resolve, reject) => {
      const duration = script.duration || 30;
      const title = script.title || 'Video Demo';
      const hook = script.hook || 'Hook del video';
      
      ffmpeg()
        // Video base con gradiente
        .input(`color=c=black:s=1080x1920:d=${duration}`)
        .inputFormat('lavfi')
        
        // Filtros complejos para animación
        .complexFilter([
          // Fondo con gradiente
          `[0:v]drawbox=x=0:y=0:w=1080:h=1920:color=black@1:t=fill[bg]`,
          
          // Título principal
          `[bg]drawtext=text='${title.replace(/'/g, "\\'")}':fontsize=70:fontcolor=white:x=(w-text_w)/2:y=200:fontfile=/System/Library/Fonts/Helvetica.ttc[v1]`,
          
          // Hook
          `[v1]drawtext=text='${hook.replace(/'/g, "\\'")}':fontsize=50:fontcolor=yellow:x=(w-text_w)/2:y=400:fontfile=/System/Library/Fonts/Helvetica.ttc[v2]`,
          
          // Contenido principal (simulado)
          `[v2]drawtext=text='Contenido del Video':fontsize=40:fontcolor=white:x=(w-text_w)/2:y=h/2:fontfile=/System/Library/Fonts/Helvetica.ttc[v3]`,
          
          // Call to action
          `[v3]drawtext=text='¡Sígueme para más!':fontsize=45:fontcolor=red:x=(w-text_w)/2:y=h-300:fontfile=/System/Library/Fonts/Helvetica.ttc[vout]`
        ])
        .outputOptions(['-map', '[vout]'])
        
        // Configuración de video
        .videoCodec('libx264')
        .outputOptions([
          '-preset fast',
          '-crf 23',
          '-pix_fmt yuv420p',
          '-movflags +faststart'
        ])
        
        .on('start', (command) => {
          logger.info('Iniciando generación de video...');
        })
        
        .on('progress', (progress) => {
          if (progress.percent) {
            logger.info(`Progreso: ${progress.percent.toFixed(2)}%`);
          }
        })
        
        .on('error', (err) => {
          logger.error('Error:', err);
          reject(err);
        })
        
        .on('end', () => {
          logger.info(`✅ Video generado: ${outputPath}`);
          resolve(outputPath);
        })
        
        .save(outputPath);
    });
  }
}