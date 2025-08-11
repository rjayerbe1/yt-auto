import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';
import { SimpleRemotionProducer } from './SimpleRemotionProducer';
import { DemoGenerator } from '../demo/demo-generator';
import { EventEmitter } from 'events';

const execAsync = promisify(exec);

export class VideoWithProgress extends EventEmitter {
  private outputDir: string;
  private audioDir: string;
  private remotionProducer: SimpleRemotionProducer;
  private demoGen: DemoGenerator;
  private totalSteps = 7;
  private currentStep = 0;

  constructor() {
    super();
    this.outputDir = path.join(process.cwd(), 'output', 'videos');
    this.audioDir = path.join(process.cwd(), 'output', 'audio');
    this.remotionProducer = new SimpleRemotionProducer();
    this.demoGen = new DemoGenerator();
  }

  private updateProgress(step: number, message: string) {
    this.currentStep = step;
    const progress = Math.round((step / this.totalSteps) * 100);
    
    logger.info(`[${progress}%] ${message}`);
    
    this.emit('progress', {
      step,
      totalSteps: this.totalSteps,
      progress,
      message
    });
  }

  async generateCompleteVideoWithProgress(): Promise<string> {
    try {
      this.updateProgress(1, 'Starting video generation...');

      // 1. Generate content
      this.updateProgress(2, 'Generating script content...');
      const idea = await this.demoGen.generateDemoIdea();
      const script = await this.demoGen.generateDemoScript(idea);
      
      logger.info(`📝 Script: ${script.title}`);

      // 2. Create directories
      await fs.mkdir(this.audioDir, { recursive: true });
      await fs.mkdir(this.outputDir, { recursive: true });
      
      // 3. Generate audio files
      const audioFiles: string[] = [];
      
      this.updateProgress(3, 'Generating audio for hook...');
      if (script.hook) {
        const hookAudio = await this.generateAudioWithTimeout(script.hook, 'hook.wav');
        if (hookAudio) audioFiles.push(hookAudio);
      }

      this.updateProgress(4, 'Generating audio for content...');
      const contentText = script.content.map(segment => 
        typeof segment === 'string' ? segment : segment.content
      ).join('. ');
      
      const contentAudio = await this.generateAudioWithTimeout(contentText, 'content.wav');
      if (contentAudio) audioFiles.push(contentAudio);

      this.updateProgress(5, 'Generating audio for call-to-action...');
      if (script.callToAction) {
        const ctaAudio = await this.generateAudioWithTimeout(script.callToAction, 'cta.wav');
        if (ctaAudio) audioFiles.push(ctaAudio);
      }

      // 4. Combine audio or create silent track
      this.updateProgress(6, 'Combining audio files...');
      let finalAudio: string;
      
      if (audioFiles.length > 0) {
        finalAudio = await this.combineAudioFiles(audioFiles);
      } else {
        // Create silent audio if generation failed
        finalAudio = await this.createSilentAudio(10);
      }

      // 5. Generate video
      this.updateProgress(7, 'Generating video with Remotion...');
      const videoPath = await this.remotionProducer.generateVideo(script);
      
      // 6. Merge audio with video
      this.updateProgress(7, 'Merging audio with video...');
      const finalVideo = await this.mergeAudioVideo(videoPath, finalAudio);
      
      this.updateProgress(7, 'Video generation complete!');
      return finalVideo;

    } catch (error) {
      logger.error('Error in video generation:', error);
      throw error;
    }
  }

  private async generateAudioWithTimeout(text: string, filename: string): Promise<string | null> {
    const outputPath = path.join(this.audioDir, filename);
    const scriptPath = path.join(process.cwd(), 'scripts', 'simple_tts.py');
    
    const escapedText = text.replace(/'/g, "'\\''");
    
    // Don't use timeout command (doesn't exist on macOS)
    const command = `python3 "${scriptPath}" '${escapedText}' "${outputPath}"`;
    
    logger.info(`🎤 Generating audio: ${filename} (max 5 minutes)`);
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 1024 * 1024 * 50, // 50MB buffer
        timeout: 310000 // 5 minutes + 10 seconds
      });
      
      // Check if file exists
      try {
        await fs.access(outputPath);
        logger.info(`✅ Audio generated: ${outputPath}`);
        return outputPath;
      } catch {
        logger.warn(`⚠️ Audio file not created for ${filename}`);
        return null;
      }
      
    } catch (error: any) {
      if (error.code === 124) {
        logger.warn(`⏱️ Audio generation timed out for ${filename}, using fallback`);
      } else {
        logger.error(`Failed to generate audio for ${filename}:`, error.message);
      }
      
      // Create silent audio as fallback
      return await this.createSilentAudio(3);
    }
  }

  private async createSilentAudio(duration: number): Promise<string> {
    const outputPath = path.join(this.audioDir, `silent_${Date.now()}.wav`);
    const command = `ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t ${duration} "${outputPath}" -y`;
    
    logger.info(`🔇 Creating ${duration}s silent audio as fallback`);
    await execAsync(command);
    
    return outputPath;
  }

  private async combineAudioFiles(audioFiles: string[]): Promise<string> {
    if (audioFiles.length === 0) {
      return await this.createSilentAudio(10);
    }

    if (audioFiles.length === 1) {
      return audioFiles[0];
    }

    const outputPath = path.join(this.audioDir, `combined_${Date.now()}.wav`);
    const listPath = path.join(this.audioDir, 'audio_list.txt');
    const listContent = audioFiles.map(f => `file '${f}'`).join('\n');
    await fs.writeFile(listPath, listContent);

    const command = `ffmpeg -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}" -y`;
    
    logger.info('🎵 Combining audio files...');
    await execAsync(command);
    
    await fs.unlink(listPath);
    return outputPath;
  }

  private async mergeAudioVideo(videoPath: string, audioPath: string): Promise<string> {
    const outputPath = path.join(this.outputDir, `final_${Date.now()}.mp4`);
    
    // Get audio duration
    const { stdout: durationOutput } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
    );
    const audioDuration = parseFloat(durationOutput.trim()) || 30;
    
    // Merge with audio
    const command = `ffmpeg -stream_loop -1 -i "${videoPath}" -i "${audioPath}" -map 0:v -map 1:a -c:v copy -c:a aac -t ${audioDuration} "${outputPath}" -y`;
    
    logger.info('🎬 Merging audio with video...');
    await execAsync(command);
    
    return outputPath;
  }
}