import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';
import { SimpleRemotionProducer } from './SimpleRemotionProducer';

const execAsync = promisify(exec);

export class QuickTestVideo {
  private outputDir: string;
  private audioDir: string;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'output', 'videos');
    this.audioDir = path.join(process.cwd(), 'output', 'audio');
  }

  async generateQuickTest(): Promise<string> {
    try {
      logger.info('🚀 Quick 2-second test starting...');

      // 1. Create directories
      await fs.mkdir(this.audioDir, { recursive: true });
      await fs.mkdir(this.outputDir, { recursive: true });

      // 2. Generate SHORT audio (2 seconds)
      const testText = "Hello! This is a quick test.";
      const audioPath = await this.generateAudio(testText, 'test_2sec.wav');
      logger.info(`✅ Audio generated: ${audioPath}`);

      // 3. Generate SHORT video (2 seconds at 30fps = 60 frames)
      const videoPath = await this.generateShortVideo();
      logger.info(`✅ Video generated: ${videoPath}`);

      // 4. Merge audio with video
      const finalPath = await this.mergeAudioVideo(videoPath, audioPath);
      logger.info(`🎉 Final video created: ${finalPath}`);

      return finalPath;

    } catch (error) {
      logger.error('Quick test failed:', error);
      throw error;
    }
  }

  private async generateAudio(text: string, filename: string): Promise<string> {
    const outputPath = path.join(this.audioDir, filename);
    const scriptPath = path.join(process.cwd(), 'scripts', 'simple_tts.py');
    
    const escapedText = text.replace(/'/g, "'\\''");
    const command = `python3 "${scriptPath}" '${escapedText}' "${outputPath}"`;
    
    logger.info('🎤 Generating test audio...');
    
    const { stdout } = await execAsync(command, {
      maxBuffer: 1024 * 1024 * 10
    });
    
    await fs.access(outputPath);
    return outputPath;
  }

  private async generateShortVideo(): Promise<string> {
    const outputPath = path.join(this.outputDir, `test_video_${Date.now()}.mp4`);
    
    // Generate a simple 2-second test video with FFmpeg (solid color)
    const command = `ffmpeg -f lavfi -i color=c=blue:s=1080x1920:d=2 -vf "drawtext=text='TEST VIDEO':fontcolor=white:fontsize=100:x=(w-text_w)/2:y=(h-text_h)/2" -c:v libx264 -t 2 "${outputPath}" -y`;
    
    logger.info('🎥 Generating 2-second test video...');
    await execAsync(command);
    
    return outputPath;
  }

  private async mergeAudioVideo(videoPath: string, audioPath: string): Promise<string> {
    const outputPath = path.join(this.outputDir, `final_test_${Date.now()}.mp4`);
    
    // Get audio duration
    const { stdout: durationOutput } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
    );
    const audioDuration = parseFloat(durationOutput.trim());
    
    // Merge with audio duration
    const command = `ffmpeg -i "${videoPath}" -i "${audioPath}" -map 0:v -map 1:a -c:v copy -c:a aac -t ${audioDuration} "${outputPath}" -y`;
    
    logger.info('🎬 Merging audio with video...');
    await execAsync(command);
    
    return outputPath;
  }
}