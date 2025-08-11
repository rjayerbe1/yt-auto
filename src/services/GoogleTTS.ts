import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

/**
 * Google Cloud Text-to-Speech
 * Rápido, barato y con excelente calidad
 */
export class GoogleTTS {
  private client: TextToSpeechClient;
  private outputDir: string;

  constructor() {
    this.client = new TextToSpeechClient();
    this.outputDir = path.join(process.cwd(), 'output', 'audio');
  }

  async generateSpeech(
    text: string,
    options?: {
      voice?: string;
      languageCode?: string;
      speakingRate?: number;
      pitch?: number;
    }
  ): Promise<string> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });

      const request = {
        input: { text },
        voice: {
          languageCode: options?.languageCode || 'es-US',
          name: options?.voice || 'es-US-Neural2-B', // Voz neural masculina
          ssmlGender: 'MALE' as const,
        },
        audioConfig: {
          audioEncoding: 'MP3' as const,
          speakingRate: options?.speakingRate || 1.1, // Un poco más rápido para shorts
          pitch: options?.pitch || 0,
          effectsProfileId: ['headphone-class-device'], // Optimizado para móviles
        },
      };

      // Llamar a Google Cloud TTS
      const [response] = await this.client.synthesizeSpeech(request);
      
      // Guardar audio
      const outputPath = path.join(
        this.outputDir,
        `google_tts_${Date.now()}.mp3`
      );
      
      await fs.writeFile(outputPath, response.audioContent as Buffer);
      
      logger.info(`✅ Audio generado con Google TTS: ${outputPath}`);
      return outputPath;

    } catch (error) {
      logger.error('Error con Google TTS:', error);
      throw error;
    }
  }

  /**
   * Voces recomendadas para YouTube Shorts
   */
  getRecommendedVoices() {
    return {
      spanish: {
        male: [
          'es-US-Neural2-B', // Mejor calidad, natural
          'es-US-Neural2-C', // Más grave
          'es-US-Studio-B',  // Calidad studio
        ],
        female: [
          'es-US-Neural2-A', // Mejor calidad
          'es-US-Studio-A',  // Calidad studio
        ]
      },
      english: {
        male: [
          'en-US-Neural2-D', // Natural
          'en-US-Neural2-J', // Conversacional
          'en-US-Studio-M',  // Calidad studio
        ],
        female: [
          'en-US-Neural2-C', // Natural
          'en-US-Neural2-F', // Joven
          'en-US-Studio-O',  // Calidad studio
        ]
      }
    };
  }

  /**
   * Genera audio para un script completo
   */
  async generateScriptAudio(script: any): Promise<string[]> {
    const audioPaths: string[] = [];

    // Hook - más energético
    if (script.hook) {
      const hookAudio = await this.generateSpeech(script.hook, {
        speakingRate: 1.15,
        pitch: 1,
      });
      audioPaths.push(hookAudio);
    }

    // Contenido principal
    if (script.content) {
      const content = Array.isArray(script.content) 
        ? script.content.join('. ')
        : script.content;
      
      const contentAudio = await this.generateSpeech(content, {
        speakingRate: 1.1,
      });
      audioPaths.push(contentAudio);
    }

    // Call to action - urgente
    if (script.callToAction) {
      const ctaAudio = await this.generateSpeech(script.callToAction, {
        speakingRate: 1.2,
        pitch: 2,
      });
      audioPaths.push(ctaAudio);
    }

    return audioPaths;
  }
}