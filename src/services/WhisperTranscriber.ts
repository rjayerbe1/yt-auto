import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

interface WhisperWord {
  word: string;
  start: number;  // Start time in seconds
  end: number;    // End time in seconds
  probability: number;
}

interface WhisperSegment {
  text: string;
  start: number;
  end: number;
  words?: WhisperWord[];
}

interface WhisperOutput {
  text: string;
  segments: WhisperSegment[];
  language: string;
  duration: number;
}

interface Caption {
  text: string;
  startMs: number;
  endMs: number;
  timestampMs: number;
  confidence: number | null;
}

export class WhisperTranscriber {
  private whisperPath: string;
  private modelPath: string;
  
  constructor() {
    // Path to whisper.cpp binary and model
    this.whisperPath = path.join(process.cwd(), 'whisper.cpp', 'build', 'bin', 'whisper-cli');
    this.modelPath = path.join(process.cwd(), 'whisper.cpp', 'models', 'ggml-base.bin');
  }
  
  /**
   * Transcribe audio file and get word-level timestamps
   */
  async transcribeWithTimestamps(audioPath: string): Promise<Caption[]> {
    try {
      logger.info(`🎙️ Transcribing audio with Whisper: ${audioPath}`);
      
      // Check if files exist
      await this.verifyFiles(audioPath);
      
      // Run whisper with word-level timestamps
      // --max-len 1 forces word-by-word output
      // --output-json gives us structured data
      const outputPath = audioPath.replace(/\.(wav|mp3|m4a)$/, '');
      const command = `"${this.whisperPath}" \
        --model "${this.modelPath}" \
        --file "${audioPath}" \
        --output-json \
        --output-file "${outputPath}" \
        --max-len 1 \
        --language auto \
        --print-progress`;
      
      logger.info('Running Whisper command...');
      await execAsync(command, {
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });
      
      // Read the JSON output
      const jsonPath = `${outputPath}.json`;
      const jsonContent = await fs.readFile(jsonPath, 'utf-8');
      const whisperOutput = JSON.parse(jsonContent) as WhisperOutput;
      
      // Convert to Caption format
      const captions = this.convertToCaptions(whisperOutput);
      
      // Clean up JSON file
      await fs.unlink(jsonPath).catch(() => {});
      
      logger.info(`✅ Transcription complete: ${captions.length} words detected`);
      return captions;
      
    } catch (error) {
      logger.error('Whisper transcription error:', error);
      throw error;
    }
  }
  
  /**
   * Transcribe and get segments with word timings
   */
  async transcribeSegments(audioPath: string): Promise<WhisperSegment[]> {
    try {
      logger.info(`🎙️ Transcribing segments with Whisper: ${audioPath}`);
      
      await this.verifyFiles(audioPath);
      
      // Run whisper with segment-level output
      const outputPath = audioPath.replace(/\.(wav|mp3|m4a)$/, '');
      const command = `"${this.whisperPath}" \
        --model "${this.modelPath}" \
        --file "${audioPath}" \
        --output-json \
        --output-file "${outputPath}" \
        --language auto \
        --print-progress`;
      
      await execAsync(command, {
        maxBuffer: 1024 * 1024 * 10,
      });
      
      // Read the JSON output
      const jsonPath = `${outputPath}.json`;
      const jsonContent = await fs.readFile(jsonPath, 'utf-8');
      const whisperOutput = JSON.parse(jsonContent) as WhisperOutput;
      
      // Clean up
      await fs.unlink(jsonPath).catch(() => {});
      
      logger.info(`✅ Transcription complete: ${whisperOutput.segments.length} segments`);
      return whisperOutput.segments;
      
    } catch (error) {
      logger.error('Whisper segment transcription error:', error);
      throw error;
    }
  }
  
  /**
   * Convert Whisper output to Caption format for Remotion
   */
  private convertToCaptions(whisperOutput: WhisperOutput): Caption[] {
    const captions: Caption[] = [];
    
    for (const segment of whisperOutput.segments) {
      if (segment.words && segment.words.length > 0) {
        // If we have word-level timestamps
        for (const word of segment.words) {
          captions.push({
            text: word.word,
            startMs: Math.round(word.start * 1000),
            endMs: Math.round(word.end * 1000),
            timestampMs: Math.round((word.start + word.end) * 500), // Middle point
            confidence: word.probability,
          });
        }
      } else {
        // Fallback: split segment text into words and estimate timing
        const words = segment.text.trim().split(/\s+/);
        const segmentDuration = segment.end - segment.start;
        const timePerWord = segmentDuration / words.length;
        
        words.forEach((word, index) => {
          const wordStart = segment.start + (index * timePerWord);
          const wordEnd = wordStart + timePerWord;
          
          captions.push({
            text: word,
            startMs: Math.round(wordStart * 1000),
            endMs: Math.round(wordEnd * 1000),
            timestampMs: Math.round((wordStart + wordEnd) * 500),
            confidence: null,
          });
        });
      }
    }
    
    return captions;
  }
  
  /**
   * Verify that whisper binary and model exist
   */
  private async verifyFiles(audioPath: string): Promise<void> {
    try {
      await fs.access(this.whisperPath);
    } catch {
      throw new Error(`Whisper binary not found at: ${this.whisperPath}. Run: cd whisper.cpp && make`);
    }
    
    try {
      await fs.access(this.modelPath);
    } catch {
      throw new Error(`Whisper model not found at: ${this.modelPath}. Run: cd whisper.cpp && ./models/download-ggml-model.sh base`);
    }
    
    try {
      await fs.access(audioPath);
    } catch {
      throw new Error(`Audio file not found: ${audioPath}`);
    }
  }
  
  /**
   * Get word-level timestamps for a specific text
   * This is useful when we already know the text but need accurate timings
   */
  async getTimestampsForText(audioPath: string, expectedText: string): Promise<Caption[]> {
    // Transcribe the audio
    const captions = await this.transcribeWithTimestamps(audioPath);
    
    // Try to match with expected text
    const expectedWords = expectedText.toLowerCase().split(/\s+/);
    const transcribedWords = captions.map(c => c.text.toLowerCase());
    
    // Simple alignment - this could be improved with dynamic programming
    if (expectedWords.length === transcribedWords.length) {
      // If word counts match, use the transcribed timings with expected text
      return captions.map((caption, index) => ({
        ...caption,
        text: expectedWords[index] || caption.text,
      }));
    }
    
    // Otherwise return as-is
    logger.warn('Word count mismatch between expected and transcribed text');
    return captions;
  }
}

// Export singleton instance
export const whisperTranscriber = new WhisperTranscriber();