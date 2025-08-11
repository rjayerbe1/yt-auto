import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { createLogger } from '../utils/logger';
import { Script, VoiceSettings } from '../types';

export interface ChatterboxVoice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  style: 'conversational' | 'narrative' | 'energetic' | 'calm';
}

export class ChatterboxTTS {
  private logger = createLogger('ChatterboxTTS');
  private apiUrl = 'https://api.chatterbox.ai/v1'; // Replace with actual API
  private apiKey: string;
  
  // Popular voices for viral content
  private readonly viralVoices: ChatterboxVoice[] = [
    { id: 'alex', name: 'Alex', language: 'en', gender: 'male', style: 'energetic' },
    { id: 'emma', name: 'Emma', language: 'en', gender: 'female', style: 'conversational' },
    { id: 'jake', name: 'Jake', language: 'en', gender: 'male', style: 'narrative' },
    { id: 'sophia', name: 'Sophia', language: 'en', gender: 'female', style: 'energetic' },
    { id: 'carlos', name: 'Carlos', language: 'es', gender: 'male', style: 'conversational' },
    { id: 'luna', name: 'Luna', language: 'es', gender: 'female', style: 'calm' },
  ];

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.CHATTERBOX_API_KEY || '';
    if (!this.apiKey) {
      this.logger.warn('Chatterbox API key not configured, using fallback TTS');
    }
  }

  async generateSpeech(
    text: string, 
    voiceSettings?: VoiceSettings,
    outputPath?: string
  ): Promise<string> {
    try {
      const voice = this.selectVoice(voiceSettings);
      const audioPath = outputPath || path.join(
        process.cwd(), 
        'output', 
        'audio', 
        `speech_${Date.now()}.mp3`
      );

      // Ensure output directory exists
      await fs.mkdir(path.dirname(audioPath), { recursive: true });

      if (this.apiKey) {
        // Use Chatterbox API
        await this.generateWithChatterbox(text, voice, audioPath, voiceSettings);
      } else {
        // Fallback to local TTS or mock
        await this.generateFallbackAudio(text, audioPath);
      }

      this.logger.info(`Generated audio: ${audioPath}`);
      return audioPath;
    } catch (error) {
      this.logger.error('Error generating speech:', error);
      throw error;
    }
  }

  private async generateWithChatterbox(
    text: string,
    voice: ChatterboxVoice,
    outputPath: string,
    settings?: VoiceSettings
  ): Promise<void> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/synthesize`,
        {
          text: this.preprocessText(text),
          voice_id: voice.id,
          model: 'chatterbox-turbo', // High quality model
          settings: {
            speed: settings?.speed || 1.0,
            pitch: settings?.pitch || 1.0,
            volume: settings?.volume || 1.0,
            emphasis: this.calculateEmphasis(text),
            emotion: this.detectEmotion(text),
          },
          output_format: 'mp3',
          sample_rate: 44100,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        }
      );

      await fs.writeFile(outputPath, response.data);
    } catch (error) {
      this.logger.error('Chatterbox API error:', error);
      throw error;
    }
  }

  private async generateFallbackAudio(text: string, outputPath: string): Promise<void> {
    // Fallback implementation using system TTS or creating a silent audio file
    // This is a placeholder - in production you'd use an alternative TTS service
    
    this.logger.warn('Using fallback TTS (mock implementation)');
    
    // Create a mock audio file
    const mockAudioData = Buffer.from('mock audio data');
    await fs.writeFile(outputPath, mockAudioData);
  }

  async generateScriptAudio(script: Script): Promise<string[]> {
    const audioPaths: string[] = [];
    
    try {
      // Generate audio for each segment
      for (const segment of script.content) {
        if (segment.type === 'narration') {
          const audioPath = path.join(
            process.cwd(),
            'output',
            'audio',
            script.id,
            `segment_${segment.startTime}.mp3`
          );
          
          await this.generateSpeech(
            segment.content,
            script.voiceSettings,
            audioPath
          );
          
          audioPaths.push(audioPath);
        }
      }

      // Generate hook audio separately for emphasis
      if (script.hook) {
        const hookPath = path.join(
          process.cwd(),
          'output',
          'audio',
          script.id,
          'hook.mp3'
        );
        
        await this.generateSpeech(
          script.hook,
          {
            ...script.voiceSettings,
            speed: 0.95, // Slightly slower for impact
            pitch: 1.05, // Slightly higher for attention
          },
          hookPath
        );
        
        audioPaths.unshift(hookPath);
      }

      // Generate CTA audio
      if (script.callToAction) {
        const ctaPath = path.join(
          process.cwd(),
          'output',
          'audio',
          script.id,
          'cta.mp3'
        );
        
        await this.generateSpeech(
          script.callToAction,
          {
            ...script.voiceSettings,
            speed: 1.05, // Slightly faster for urgency
          },
          ctaPath
        );
        
        audioPaths.push(ctaPath);
      }

      return audioPaths;
    } catch (error) {
      this.logger.error('Error generating script audio:', error);
      throw error;
    }
  }

  private selectVoice(settings?: VoiceSettings): ChatterboxVoice {
    if (settings?.voiceId) {
      const voice = this.viralVoices.find(v => v.id === settings.voiceId);
      if (voice) return voice;
    }
    
    // Default to energetic voice for viral content
    return this.viralVoices.find(v => v.style === 'energetic') || this.viralVoices[0];
  }

  private preprocessText(text: string): string {
    // Clean and optimize text for TTS
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/([.!?])\s*/g, '$1 ') // Add space after punctuation
      .replace(/\b(\w+)\b\s+\1\b/gi, '$1') // Remove duplicate words
      .trim();
  }

  private calculateEmphasis(text: string): string[] {
    // Identify words to emphasize
    const emphasisWords: string[] = [];
    
    // Emphasize numbers and statistics
    const numbers = text.match(/\b\d+\b/g) || [];
    emphasisWords.push(...numbers);
    
    // Emphasize superlatives
    const superlatives = text.match(/\b(best|worst|most|least|first|last|only)\b/gi) || [];
    emphasisWords.push(...superlatives);
    
    // Emphasize action words in all caps
    const capsWords = text.match(/\b[A-Z]{2,}\b/g) || [];
    emphasisWords.push(...capsWords);
    
    return emphasisWords;
  }

  private detectEmotion(text: string): string {
    // Simple emotion detection based on keywords
    const emotions = {
      excited: /amazing|incredible|unbelievable|wow|omg/i,
      curious: /did you know|ever wonder|what if|imagine/i,
      urgent: /now|today|hurry|quick|fast|immediately/i,
      surprising: /shocking|surprise|unexpected|never knew/i,
      informative: /fact|study|research|science|data/i,
    };

    for (const [emotion, pattern] of Object.entries(emotions)) {
      if (pattern.test(text)) {
        return emotion;
      }
    }

    return 'neutral';
  }

  async batchGenerateAudio(texts: string[], voiceSettings?: VoiceSettings): Promise<string[]> {
    const audioPaths: string[] = [];
    
    // Process in parallel but limit concurrency
    const batchSize = 3;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPaths = await Promise.all(
        batch.map((text, index) => 
          this.generateSpeech(text, voiceSettings)
        )
      );
      audioPaths.push(...batchPaths);
    }

    return audioPaths;
  }

  async cloneVoice(sampleAudioPath: string, voiceName: string): Promise<string> {
    // Voice cloning functionality for custom voices
    if (!this.apiKey) {
      throw new Error('Voice cloning requires Chatterbox API key');
    }

    try {
      const audioData = await fs.readFile(sampleAudioPath);
      
      const response = await axios.post(
        `${this.apiUrl}/voice-clone`,
        {
          audio_sample: audioData.toString('base64'),
          voice_name: voiceName,
          language: 'en',
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const voiceId = response.data.voice_id;
      this.logger.info(`Voice cloned successfully: ${voiceId}`);
      
      return voiceId;
    } catch (error) {
      this.logger.error('Error cloning voice:', error);
      throw error;
    }
  }
}