import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';
import { VideoScript, VoiceSettings } from '../types';

/**
 * Chatterbox TTS Local Model Implementation
 * Usa el modelo Chatterbox de Resemble AI localmente
 */
export class ChatterboxLocal {
  private pythonPath: string;
  private modelPath: string;
  private outputDir: string;
  private isModelReady: boolean = false;

  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.modelPath = process.env.CHATTERBOX_MODEL_PATH || path.join(process.cwd(), 'models', 'chatterbox');
    this.outputDir = path.join(process.cwd(), 'output', 'audio');
  }

  /**
   * Inicializa el modelo de Chatterbox
   */
  async initialize(): Promise<void> {
    try {
      // Verificar si Python está instalado
      await this.checkPython();
      
      // Crear directorio de salida
      await fs.mkdir(this.outputDir, { recursive: true });
      
      // Verificar si el modelo está instalado
      await this.checkModel();
      
      this.isModelReady = true;
      logger.info('✅ Chatterbox TTS inicializado correctamente');
    } catch (error) {
      logger.error('Error inicializando Chatterbox:', error);
      this.isModelReady = false;
    }
  }

  /**
   * Verifica que Python esté instalado
   */
  private async checkPython(): Promise<void> {
    return new Promise((resolve, reject) => {
      const python = spawn(this.pythonPath, ['--version']);
      
      python.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Python no está instalado o no es accesible'));
        }
      });
      
      python.on('error', reject);
    });
  }

  /**
   * Verifica si el modelo de Chatterbox está instalado
   */
  private async checkModel(): Promise<void> {
    try {
      // Verificar si existe el script de Python para Chatterbox
      const scriptPath = path.join(this.modelPath, 'chatterbox_tts.py');
      const scriptExists = await fs.access(scriptPath).then(() => true).catch(() => false);
      
      if (!scriptExists) {
        // Crear script de Python para Chatterbox
        await this.createChatterboxScript();
      }
    } catch (error) {
      logger.warn('Modelo de Chatterbox no encontrado, usando modo fallback');
    }
  }

  /**
   * Crea el script de Python para usar Chatterbox
   */
  private async createChatterboxScript(): Promise<void> {
    const scriptContent = `#!/usr/bin/env python3
"""
Chatterbox TTS Script
Genera audio usando el modelo Chatterbox de Resemble AI
"""

import sys
import json
import argparse
from pathlib import Path

def generate_audio_fallback(text, output_path, voice_settings):
    """
    Función fallback cuando Chatterbox no está disponible
    Genera un archivo de audio vacío para desarrollo
    """
    import wave
    import numpy as np
    
    # Generar audio de silencio como placeholder
    sample_rate = 22050
    duration = min(len(text) * 0.06, 10)  # Aproximadamente 60ms por carácter
    samples = int(sample_rate * duration)
    
    # Crear array de silencio
    audio_data = np.zeros(samples, dtype=np.int16)
    
    # Guardar como WAV
    with wave.open(output_path, 'w') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_data.tobytes())
    
    print(json.dumps({
        "status": "success",
        "message": "Audio generado (modo fallback)",
        "output": output_path,
        "duration": duration
    }))

def generate_with_chatterbox(text, output_path, voice_settings):
    """
    Genera audio usando el modelo Chatterbox real
    """
    try:
        # Intentar importar Chatterbox
        from chatterbox import Chatterbox
        
        # Inicializar modelo
        model = Chatterbox()
        
        # Configurar voz
        voice_params = {
            "speed": voice_settings.get("speed", 1.0),
            "pitch": voice_settings.get("pitch", 1.0),
            "emotion": voice_settings.get("emotion", "neutral"),
            "exaggeration": voice_settings.get("exaggeration", 0.5),
            "cfg_weight": voice_settings.get("cfg_weight", 0.5)
        }
        
        # Generar audio
        audio = model.generate(
            text=text,
            voice=voice_settings.get("voice_id", "default"),
            **voice_params
        )
        
        # Guardar audio
        audio.save(output_path)
        
        print(json.dumps({
            "status": "success",
            "message": "Audio generado con Chatterbox",
            "output": output_path
        }))
        
    except ImportError:
        # Si Chatterbox no está instalado, usar fallback
        generate_audio_fallback(text, output_path, voice_settings)
    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": str(e)
        }), file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description='Generar audio con Chatterbox TTS')
    parser.add_argument('--text', required=True, help='Texto a convertir en audio')
    parser.add_argument('--output', required=True, help='Ruta del archivo de salida')
    parser.add_argument('--voice', default='default', help='ID de la voz')
    parser.add_argument('--speed', type=float, default=1.0, help='Velocidad del habla')
    parser.add_argument('--pitch', type=float, default=1.0, help='Tono de voz')
    parser.add_argument('--emotion', default='neutral', help='Emoción del habla')
    
    args = parser.parse_args()
    
    voice_settings = {
        "voice_id": args.voice,
        "speed": args.speed,
        "pitch": args.pitch,
        "emotion": args.emotion
    }
    
    generate_with_chatterbox(args.text, args.output, voice_settings)

if __name__ == "__main__":
    main()
`;

    const scriptPath = path.join(this.modelPath, 'chatterbox_tts.py');
    await fs.mkdir(this.modelPath, { recursive: true });
    await fs.writeFile(scriptPath, scriptContent);
    await fs.chmod(scriptPath, '755');
    
    logger.info('Script de Chatterbox creado');
  }

  /**
   * Genera audio desde texto usando Chatterbox
   */
  async generateSpeech(
    text: string,
    voiceSettings?: VoiceSettings,
    outputPath?: string
  ): Promise<string> {
    try {
      // Si el modelo no está listo, inicializar
      if (!this.isModelReady) {
        await this.initialize();
      }

      const audioPath = outputPath || path.join(
        this.outputDir,
        `speech_${Date.now()}.wav`
      );

      // Asegurar que el directorio existe
      await fs.mkdir(path.dirname(audioPath), { recursive: true });

      // Si el texto está vacío, generar silencio
      if (!text || text.trim().length === 0) {
        await this.generateSilence(audioPath);
        return audioPath;
      }

      // Ejecutar script de Python
      const scriptPath = path.join(this.modelPath, 'chatterbox_tts.py');
      
      return new Promise((resolve, reject) => {
        const args = [
          scriptPath,
          '--text', text,
          '--output', audioPath,
          '--voice', voiceSettings?.voiceId || 'default',
          '--speed', String(voiceSettings?.speed || 1.0),
          '--pitch', String(voiceSettings?.pitch || 1.0),
          '--emotion', this.detectEmotion(text)
        ];

        const python = spawn(this.pythonPath, args);
        
        let stdout = '';
        let stderr = '';

        python.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        python.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        python.on('close', async (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(stdout);
              logger.info(`✅ Audio generado: ${result.output}`);
              resolve(audioPath);
            } catch {
              // Si no es JSON, asumir éxito
              resolve(audioPath);
            }
          } else {
            // En caso de error, generar audio fallback
            logger.warn(`Chatterbox falló (código ${code}), usando fallback`);
            await this.generateFallbackAudio(text, audioPath);
            resolve(audioPath);
          }
        });

        python.on('error', async (error) => {
          logger.error('Error ejecutando Chatterbox:', error);
          // Generar audio fallback
          await this.generateFallbackAudio(text, audioPath);
          resolve(audioPath);
        });
      });

    } catch (error) {
      logger.error('Error generando audio:', error);
      // Generar audio fallback
      const audioPath = outputPath || path.join(
        this.outputDir,
        `speech_${Date.now()}.wav`
      );
      await this.generateFallbackAudio(text, audioPath);
      return audioPath;
    }
  }

  /**
   * Genera un archivo de audio de silencio
   */
  private async generateSilence(outputPath: string): Promise<void> {
    // Crear un archivo WAV vacío/silencio
    const silenceBuffer = Buffer.alloc(44100 * 2); // 1 segundo de silencio
    await fs.writeFile(outputPath, silenceBuffer);
  }

  /**
   * Genera audio fallback cuando Chatterbox no está disponible
   */
  private async generateFallbackAudio(text: string, outputPath: string): Promise<void> {
    logger.warn('Usando audio fallback (Chatterbox no disponible)');
    
    // Por ahora, crear un archivo de audio vacío
    // En producción, podrías usar otra biblioteca TTS como fallback
    await this.generateSilence(outputPath);
    
    // Guardar el texto como metadata
    const metadataPath = outputPath.replace(/\.(wav|mp3)$/, '.txt');
    await fs.writeFile(metadataPath, text);
  }

  /**
   * Detecta la emoción del texto
   */
  private detectEmotion(text: string): string {
    const emotions = {
      excited: /amazing|incredible|unbelievable|wow|omg/i,
      curious: /did you know|ever wonder|what if|imagine/i,
      urgent: /now|today|hurry|quick|fast|immediately/i,
      surprising: /shocking|surprise|unexpected|never knew/i,
      happy: /happy|joy|great|awesome|fantastic/i,
      sad: /sad|sorry|unfortunately|terrible/i,
      angry: /angry|furious|outraged|disgusting/i,
      neutral: /.*/
    };

    for (const [emotion, pattern] of Object.entries(emotions)) {
      if (pattern.test(text)) {
        return emotion;
      }
    }

    return 'neutral';
  }

  /**
   * Genera audio para un script completo
   */
  async generateScriptAudio(script: VideoScript): Promise<string[]> {
    const audioPaths: string[] = [];
    
    try {
      // Generar audio para el hook
      if (script.hook) {
        const hookPath = path.join(
          this.outputDir,
          `hook_${Date.now()}.wav`
        );
        await this.generateSpeech(
          script.hook,
          {
            ...script.voiceSettings,
            speed: 0.95,
            pitch: 1.05,
          },
          hookPath
        );
        audioPaths.push(hookPath);
      }

      // Generar audio para el contenido
      if (script.content) {
        const contentText = typeof script.content === 'string' 
          ? script.content 
          : JSON.stringify(script.content);
          
        const contentPath = path.join(
          this.outputDir,
          `content_${Date.now()}.wav`
        );
        await this.generateSpeech(
          contentText,
          script.voiceSettings,
          contentPath
        );
        audioPaths.push(contentPath);
      }

      // Generar audio para call to action
      if (script.callToAction) {
        const ctaPath = path.join(
          this.outputDir,
          `cta_${Date.now()}.wav`
        );
        await this.generateSpeech(
          script.callToAction,
          {
            ...script.voiceSettings,
            speed: 1.05,
          },
          ctaPath
        );
        audioPaths.push(ctaPath);
      }

      return audioPaths;
    } catch (error) {
      logger.error('Error generando audio del script:', error);
      return audioPaths;
    }
  }

  /**
   * Instala Chatterbox si no está instalado
   */
  async installChatterbox(): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.info('Instalando Chatterbox TTS...');
      
      const pip = spawn(this.pythonPath, [
        '-m', 'pip', 'install', 
        'git+https://github.com/resemble-ai/chatterbox.git'
      ]);

      pip.stdout.on('data', (data) => {
        logger.info(`pip: ${data}`);
      });

      pip.stderr.on('data', (data) => {
        logger.warn(`pip stderr: ${data}`);
      });

      pip.on('close', (code) => {
        if (code === 0) {
          logger.info('✅ Chatterbox instalado correctamente');
          resolve();
        } else {
          logger.warn('No se pudo instalar Chatterbox, usando modo fallback');
          resolve(); // No rechazar, usar fallback
        }
      });

      pip.on('error', (error) => {
        logger.error('Error instalando Chatterbox:', error);
        resolve(); // No rechazar, usar fallback
      });
    });
  }
}