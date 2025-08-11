import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';
import { VideoScript, VoiceSettings } from '../types';

/**
 * Implementación real de Chatterbox TTS de Resemble AI
 */
export class RealChatterbox {
  private pythonPath: string;
  private scriptsDir: string;
  private outputDir: string;
  private isInstalled: boolean = false;

  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.scriptsDir = path.join(process.cwd(), 'scripts');
    this.outputDir = path.join(process.cwd(), 'output', 'audio');
  }

  async initialize(): Promise<void> {
    try {
      // Crear directorios necesarios
      await fs.mkdir(this.scriptsDir, { recursive: true });
      await fs.mkdir(this.outputDir, { recursive: true });

      // Crear script de Python para Chatterbox
      await this.createChatterboxScript();

      // Verificar si Chatterbox está instalado
      this.isInstalled = await this.checkChatterboxInstalled();
      
      if (this.isInstalled) {
        logger.info('✅ Chatterbox TTS está instalado y listo');
      } else {
        logger.warn('⚠️ Chatterbox no está instalado. Instálalo con: pip install chatterbox-tts');
      }
    } catch (error) {
      logger.error('Error inicializando Chatterbox:', error);
    }
  }

  private async createChatterboxScript(): Promise<void> {
    const scriptContent = `#!/usr/bin/env python3
"""
Script para generar audio con Chatterbox TTS de Resemble AI
"""

import sys
import json
import argparse
from pathlib import Path

def generate_with_chatterbox(text, output_path, voice_ref=None):
    """Genera audio usando Chatterbox TTS"""
    try:
        import torch
        import torchaudio as ta
        from chatterbox.tts import ChatterboxTTS
        
        # Detectar dispositivo disponible
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Usando dispositivo: {device}", file=sys.stderr)
        
        # Cargar modelo
        print("Cargando modelo Chatterbox...", file=sys.stderr)
        model = ChatterboxTTS.from_pretrained(device=device)
        
        # Generar audio
        print(f"Generando audio...", file=sys.stderr)
        
        if voice_ref and Path(voice_ref).exists():
            # Usar voz de referencia para clonación
            wav = model.generate(text, audio_prompt_path=voice_ref)
        else:
            # Usar voz por defecto
            wav = model.generate(text)
        
        # Guardar audio
        ta.save(output_path, wav, model.sr)
        
        return {
            "status": "success",
            "output": output_path,
            "sample_rate": model.sr,
            "device": device,
            "model": "chatterbox"
        }
        
    except ImportError as e:
        print(f"Chatterbox no está instalado: {e}", file=sys.stderr)
        return {
            "status": "error",
            "error": "Chatterbox no está instalado. Instala con: pip install chatterbox-tts"
        }
    except Exception as e:
        print(f"Error generando audio: {e}", file=sys.stderr)
        return {
            "status": "error",
            "error": str(e)
        }

def generate_fallback(text, output_path):
    """Genera audio fallback si Chatterbox no está disponible"""
    try:
        # Intentar con gTTS como alternativa
        from gtts import gTTS
        
        # Detectar idioma
        lang = 'es' if any(c in text for c in 'áéíóúñ¿¡') else 'en'
        
        tts = gTTS(text=text, lang=lang, slow=False)
        tts.save(output_path)
        
        return {
            "status": "success",
            "output": output_path,
            "model": "gtts",
            "language": lang
        }
        
    except ImportError:
        # Si gTTS tampoco está disponible, usar pyttsx3
        try:
            import pyttsx3
            
            engine = pyttsx3.init()
            engine.save_to_file(text, output_path)
            engine.runAndWait()
            
            return {
                "status": "success",
                "output": output_path,
                "model": "pyttsx3"
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": f"No hay TTS disponible: {e}"
            }

def main():
    parser = argparse.ArgumentParser(description='Generar audio con Chatterbox TTS')
    parser.add_argument('--text', required=True, help='Texto a convertir')
    parser.add_argument('--output', required=True, help='Archivo de salida')
    parser.add_argument('--voice', help='Archivo de audio de referencia para clonar voz')
    parser.add_argument('--fallback', action='store_true', help='Usar fallback si Chatterbox falla')
    
    args = parser.parse_args()
    
    # Intentar con Chatterbox primero
    result = generate_with_chatterbox(args.text, args.output, args.voice)
    
    # Si falla y se permite fallback, usar alternativa
    if result['status'] == 'error' and args.fallback:
        print("Usando TTS alternativo...", file=sys.stderr)
        result = generate_fallback(args.text, args.output)
    
    # Imprimir resultado como JSON
    print(json.dumps(result))
    
    # Retornar código de salida apropiado
    sys.exit(0 if result['status'] == 'success' else 1)

if __name__ == "__main__":
    main()
`;

    const scriptPath = path.join(this.scriptsDir, 'chatterbox_tts.py');
    await fs.writeFile(scriptPath, scriptContent);
    await fs.chmod(scriptPath, '755');
  }

  private async checkChatterboxInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
      const python = spawn(this.pythonPath, [
        '-c',
        'from chatterbox.tts import ChatterboxTTS; print("OK")'
      ]);

      let output = '';
      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.on('close', (code) => {
        resolve(code === 0 && output.includes('OK'));
      });

      python.on('error', () => {
        resolve(false);
      });
    });
  }

  async generateSpeech(
    text: string,
    outputPath?: string,
    voiceRef?: string,
    useFallback: boolean = true
  ): Promise<string> {
    const audioPath = outputPath || path.join(
      this.outputDir,
      `speech_${Date.now()}.wav`
    );

    // Asegurar que el directorio existe
    await fs.mkdir(path.dirname(audioPath), { recursive: true });

    return new Promise((resolve, reject) => {
      const scriptPath = path.join(this.scriptsDir, 'chatterbox_tts.py');
      
      const args = [
        scriptPath,
        '--text', text,
        '--output', audioPath
      ];

      if (voiceRef) {
        args.push('--voice', voiceRef);
      }

      if (useFallback) {
        args.push('--fallback');
      }

      logger.info('Generando audio con Chatterbox TTS...');

      const python = spawn(this.pythonPath, args);
      
      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
        // Log mensajes de progreso
        if (stderr.includes('Usando dispositivo:') || 
            stderr.includes('Cargando modelo:') ||
            stderr.includes('Generando audio:')) {
          logger.info(data.toString().trim());
        }
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            if (result.status === 'success') {
              logger.info(`✅ Audio generado con ${result.model}: ${result.output}`);
              resolve(audioPath);
            } else {
              logger.error('Error en generación:', result.error);
              reject(new Error(result.error));
            }
          } catch (error) {
            logger.error('Error parseando resultado:', error);
            reject(error);
          }
        } else {
          logger.error(`Proceso terminó con código ${code}`);
          logger.error('stderr:', stderr);
          reject(new Error(`Fallo en generación de audio: ${stderr}`));
        }
      });

      python.on('error', (error) => {
        logger.error('Error ejecutando script:', error);
        reject(error);
      });
    });
  }

  async generateScriptAudio(script: VideoScript): Promise<string[]> {
    const audioPaths: string[] = [];

    try {
      // Inicializar si no está listo
      if (!this.isInstalled) {
        await this.initialize();
      }

      // Generar audio para el hook
      if (script.hook) {
        logger.info('Generando audio para hook...');
        const hookPath = await this.generateSpeech(
          script.hook,
          path.join(this.outputDir, `hook_${Date.now()}.wav`)
        );
        audioPaths.push(hookPath);
      }

      // Generar audio para el contenido principal
      if (script.content) {
        const contentText = typeof script.content === 'string' 
          ? script.content 
          : JSON.stringify(script.content);

        logger.info('Generando audio para contenido...');
        const contentPath = await this.generateSpeech(
          contentText,
          path.join(this.outputDir, `content_${Date.now()}.wav`)
        );
        audioPaths.push(contentPath);
      }

      // Generar audio para call to action
      if (script.callToAction) {
        logger.info('Generando audio para CTA...');
        const ctaPath = await this.generateSpeech(
          script.callToAction,
          path.join(this.outputDir, `cta_${Date.now()}.wav`)
        );
        audioPaths.push(ctaPath);
      }

      logger.info(`✅ ${audioPaths.length} archivos de audio generados`);
      return audioPaths;

    } catch (error) {
      logger.error('Error generando audio del script:', error);
      return audioPaths;
    }
  }

  async installChatterbox(): Promise<void> {
    logger.info('📦 Instalando Chatterbox TTS...');

    return new Promise((resolve, reject) => {
      const pip = spawn(this.pythonPath, [
        '-m', 'pip', 'install', 'chatterbox-tts'
      ]);

      pip.stdout.on('data', (data) => {
        logger.info(data.toString());
      });

      pip.stderr.on('data', (data) => {
        logger.warn(data.toString());
      });

      pip.on('close', (code) => {
        if (code === 0) {
          logger.info('✅ Chatterbox instalado correctamente');
          this.isInstalled = true;
          resolve();
        } else {
          logger.error('Error instalando Chatterbox');
          reject(new Error('Fallo la instalación de Chatterbox'));
        }
      });
    });
  }
}