import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

export class SimpleTTS {
  private scriptPath: string;
  private outputDir: string;

  constructor() {
    this.scriptPath = path.join(process.cwd(), 'scripts', 'simple_tts.py');
    this.outputDir = path.join(process.cwd(), 'output', 'audio');
  }

  async initialize(): Promise<void> {
    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });
    logger.info('SimpleTTS initialized');
  }

  async generateSpeech(text: string, outputFileName?: string): Promise<string> {
    try {
      // Generate unique filename if not provided
      const filename = outputFileName || `audio_${Date.now()}.wav`;
      const outputPath = path.join(this.outputDir, filename);

      // Escape text for shell
      const escapedText = text.replace(/'/g, "'\\''");

      // Run Python script
      const command = `python3 "${this.scriptPath}" '${escapedText}' "${outputPath}"`;
      
      logger.info('Running Chatterbox TTS...');
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      if (stderr && !stderr.includes('Loading') && !stderr.includes('Sampling')) {
        logger.warn('TTS stderr:', stderr);
      }

      // Parse result - extract JSON from output
      try {
        // Find the JSON in the output (it should be the first line now)
        const lines = stdout.trim().split('\n');
        const jsonLine = lines.find(line => line.startsWith('{'));
        
        if (!jsonLine) {
          throw new Error('No JSON output from TTS script');
        }
        
        const result = JSON.parse(jsonLine);
        if (result.success) {
          logger.info(`Audio generated: ${result.output}`);
          return result.output;
        } else {
          throw new Error(result.error || 'Unknown error');
        }
      } catch (parseError) {
        logger.error('Failed to parse TTS output:', stdout);
        throw parseError;
      }

    } catch (error) {
      logger.error('TTS generation failed:', error);
      throw error;
    }
  }

  async testGeneration(): Promise<string> {
    const testText = "Hello! This is a test of Chatterbox TTS working correctly with English text.";
    return this.generateSpeech(testText, 'test_english.wav');
  }
}