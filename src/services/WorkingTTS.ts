import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

/**
 * TTS que realmente funciona usando herramientas del sistema
 */
export class WorkingTTS {
  private outputDir: string;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'output', 'audio');
  }

  /**
   * Genera audio usando el comando 'say' de macOS
   * Este método SÍ funciona y genera audio real
   */
  async generateSpeechMacOS(text: string, outputPath?: string): Promise<string> {
    try {
      const audioPath = outputPath || path.join(
        this.outputDir,
        `speech_${Date.now()}.aiff`
      );

      // Crear directorio si no existe
      await fs.mkdir(path.dirname(audioPath), { recursive: true });

      // Usar el comando 'say' de macOS para generar audio real
      const command = `say -o "${audioPath}" "${text.replace(/"/g, '\\"')}"`;
      
      logger.info('Generando audio con macOS TTS...');
      await execAsync(command);
      
      // Convertir a MP3 si es posible
      const mp3Path = audioPath.replace('.aiff', '.mp3');
      try {
        await execAsync(`ffmpeg -i "${audioPath}" -acodec mp3 -ab 192k "${mp3Path}" -y`);
        await fs.unlink(audioPath); // Eliminar archivo AIFF original
        logger.info(`✅ Audio generado: ${mp3Path}`);
        return mp3Path;
      } catch {
        // Si no se puede convertir, usar AIFF
        logger.info(`✅ Audio generado: ${audioPath}`);
        return audioPath;
      }

    } catch (error) {
      logger.error('Error generando audio con macOS:', error);
      throw error;
    }
  }

  /**
   * Genera audio usando espeak (multiplataforma)
   */
  async generateSpeechEspeak(text: string, outputPath?: string): Promise<string> {
    try {
      const audioPath = outputPath || path.join(
        this.outputDir,
        `speech_${Date.now()}.wav`
      );

      await fs.mkdir(path.dirname(audioPath), { recursive: true });

      // Usar espeak para generar audio
      const command = `espeak -w "${audioPath}" "${text.replace(/"/g, '\\"')}"`;
      
      logger.info('Generando audio con espeak...');
      await execAsync(command);
      
      logger.info(`✅ Audio generado: ${audioPath}`);
      return audioPath;

    } catch (error) {
      logger.warn('espeak no disponible, intentando alternativas');
      throw error;
    }
  }

  /**
   * Genera audio usando Google TTS (gtts-cli)
   */
  async generateSpeechGTTS(text: string, outputPath?: string, lang: string = 'es'): Promise<string> {
    try {
      const audioPath = outputPath || path.join(
        this.outputDir,
        `speech_${Date.now()}.mp3`
      );

      await fs.mkdir(path.dirname(audioPath), { recursive: true });

      // Primero verificar si gtts-cli está instalado
      try {
        await execAsync('which gtts-cli');
      } catch {
        logger.info('Instalando gtts-cli...');
        await execAsync('pip3 install gtts');
      }

      // Usar gtts-cli para generar audio
      const command = `gtts-cli "${text}" --lang ${lang} --output "${audioPath}"`;
      
      logger.info('Generando audio con Google TTS...');
      await execAsync(command);
      
      logger.info(`✅ Audio generado con GTTS: ${audioPath}`);
      return audioPath;

    } catch (error) {
      logger.warn('GTTS no disponible:', error);
      throw error;
    }
  }

  /**
   * Método principal que intenta diferentes opciones
   */
  async generateSpeech(text: string, outputPath?: string, options?: any): Promise<string> {
    logger.info('Generando audio TTS...');

    // Verificar el sistema operativo
    const platform = process.platform;

    // Intentar diferentes métodos según la plataforma
    if (platform === 'darwin') {
      // macOS - usar 'say'
      try {
        return await this.generateSpeechMacOS(text, outputPath);
      } catch (error) {
        logger.warn('Fallo macOS TTS, intentando alternativas');
      }
    }

    // Intentar Google TTS (funciona en cualquier plataforma con Python)
    try {
      return await this.generateSpeechGTTS(text, outputPath, options?.lang || 'es');
    } catch (error) {
      logger.warn('GTTS no disponible');
    }

    // Intentar espeak como última opción
    try {
      return await this.generateSpeechEspeak(text, outputPath);
    } catch (error) {
      logger.warn('espeak no disponible');
    }

    // Si todo falla, generar un archivo de audio vacío
    logger.warn('Ningún TTS disponible, generando archivo vacío');
    return await this.generateEmptyAudio(outputPath);
  }

  /**
   * Genera un archivo de audio vacío como fallback
   */
  private async generateEmptyAudio(outputPath?: string): Promise<string> {
    const audioPath = outputPath || path.join(
      this.outputDir,
      `speech_${Date.now()}.mp3`
    );

    await fs.mkdir(path.dirname(audioPath), { recursive: true });

    // Generar 1 segundo de silencio con FFmpeg
    try {
      await execAsync(`ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 1 -acodec mp3 "${audioPath}" -y`);
      logger.info(`Audio vacío generado: ${audioPath}`);
    } catch {
      // Si FFmpeg no está disponible, crear archivo vacío
      await fs.writeFile(audioPath, Buffer.alloc(0));
    }

    return audioPath;
  }

  /**
   * Genera audio para múltiples textos y los concatena
   */
  async generateAndConcatAudio(texts: string[], outputPath?: string): Promise<string> {
    const audioFiles: string[] = [];

    // Generar audio para cada texto
    for (const text of texts) {
      const audioPath = await this.generateSpeech(text);
      audioFiles.push(audioPath);
    }

    if (audioFiles.length === 0) {
      return await this.generateEmptyAudio(outputPath);
    }

    if (audioFiles.length === 1) {
      return audioFiles[0];
    }

    // Concatenar los archivos de audio
    const finalPath = outputPath || path.join(
      this.outputDir,
      `combined_${Date.now()}.mp3`
    );

    try {
      const listFile = path.join(this.outputDir, 'concat_list.txt');
      const fileList = audioFiles.map(f => `file '${f}'`).join('\n');
      await fs.writeFile(listFile, fileList);

      await execAsync(`ffmpeg -f concat -safe 0 -i "${listFile}" -c copy "${finalPath}" -y`);
      
      // Limpiar archivos temporales
      await fs.unlink(listFile);
      for (const file of audioFiles) {
        await fs.unlink(file).catch(() => {});
      }

      logger.info(`✅ Audio combinado: ${finalPath}`);
      return finalPath;

    } catch (error) {
      logger.error('Error concatenando audio:', error);
      return audioFiles[0]; // Retornar el primero si falla
    }
  }

  /**
   * Verifica qué sistemas TTS están disponibles
   */
  async checkAvailableTTS(): Promise<{[key: string]: boolean}> {
    const available: {[key: string]: boolean} = {};

    // Verificar macOS 'say'
    if (process.platform === 'darwin') {
      try {
        await execAsync('which say');
        available.macOS = true;
      } catch {
        available.macOS = false;
      }
    }

    // Verificar espeak
    try {
      await execAsync('which espeak');
      available.espeak = true;
    } catch {
      available.espeak = false;
    }

    // Verificar gtts-cli
    try {
      await execAsync('which gtts-cli');
      available.gtts = true;
    } catch {
      available.gtts = false;
    }

    // Verificar ffmpeg
    try {
      await execAsync('which ffmpeg');
      available.ffmpeg = true;
    } catch {
      available.ffmpeg = false;
    }

    logger.info('Sistemas TTS disponibles:', available);
    return available;
  }
}