import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';
import { SimpleRemotionProducer } from './SimpleRemotionProducer';

const execAsync = promisify(exec);

export class OptimizedVideoGenerator {
  private outputDir: string;
  private audioDir: string;
  private remotionProducer: SimpleRemotionProducer;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'output', 'videos');
    this.audioDir = path.join(process.cwd(), 'output', 'audio');
    this.remotionProducer = new SimpleRemotionProducer();
  }

  async generateOptimizedVideo(durationSeconds: number = 10): Promise<string> {
    try {
      logger.info(`🚀 Generating optimized ${durationSeconds}-second video...`);

      // Create directories
      await fs.mkdir(this.audioDir, { recursive: true });
      await fs.mkdir(this.outputDir, { recursive: true });

      // Generate simple script
      const script = {
        title: 'Quick Tech Tips',
        hook: 'Amazing tech trick!',
        content: [
          { type: 'text', content: 'Step one', duration: 3 },
          { type: 'text', content: 'Step two', duration: 3 },
          { type: 'text', content: 'Step three', duration: 3 }
        ],
        callToAction: 'Follow for more!',
        duration: durationSeconds,
        topic: 'Tech',
        hashtags: ['tech', 'tips'],
        targetAudience: 'Tech enthusiasts'
      };

      // Generate audio parts in parallel
      const audioPromises = [
        this.generateQuickAudio(script.hook, 'hook_opt.wav'),
        this.generateQuickAudio('Step one. Step two. Step three.', 'content_opt.wav'),
        this.generateQuickAudio(script.callToAction, 'cta_opt.wav')
      ];

      logger.info('🎤 Generating audio files in parallel...');
      const audioFiles = await Promise.all(audioPromises);

      // Combine audio
      const combinedAudio = await this.combineAudioQuick(audioFiles);
      logger.info(`✅ Audio ready: ${combinedAudio}`);

      // Generate simple video
      const videoPath = await this.generateSimpleVideo(durationSeconds);
      logger.info(`✅ Video ready: ${videoPath}`);

      // Merge
      const finalPath = await this.mergeQuick(videoPath, combinedAudio);
      logger.info(`🎉 Optimized video complete: ${finalPath}`);

      return finalPath;

    } catch (error) {
      logger.error('Optimized generation failed:', error);
      throw error;
    }
  }

  private async generateQuickAudio(text: string, filename: string): Promise<string> {
    const outputPath = path.join(this.audioDir, filename);
    const scriptPath = path.join(process.cwd(), 'scripts', 'simple_tts.py');
    
    const escapedText = text.replace(/'/g, "'\\''");
    const command = `timeout 60 python3 "${scriptPath}" '${escapedText}' "${outputPath}"`;
    
    try {
      await execAsync(command, { maxBuffer: 1024 * 1024 * 10 });
      await fs.access(outputPath);
      return outputPath;
    } catch (error) {
      logger.warn(`Audio generation failed for ${filename}, using fallback`);
      // Create silent audio as fallback
      const silentCommand = `ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 1 "${outputPath}" -y`;
      await execAsync(silentCommand);
      return outputPath;
    }
  }

  private async generateSimpleVideo(duration: number): Promise<string> {
    const outputPath = path.join(this.outputDir, `optimized_${Date.now()}.mp4`);
    
    // Generate simple animated video
    const command = `ffmpeg -f lavfi -i color=c=black:s=1080x1920:d=${duration} \
      -vf "drawtext=text='VIRAL VIDEO':fontcolor=white:fontsize=80:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,0,${duration})'" \
      -c:v libx264 -pix_fmt yuv420p "${outputPath}" -y`;
    
    await execAsync(command);
    return outputPath;
  }

  private async combineAudioQuick(audioFiles: string[]): Promise<string> {
    if (audioFiles.length === 1) return audioFiles[0];

    const outputPath = path.join(this.audioDir, `combined_opt_${Date.now()}.wav`);
    const inputs = audioFiles.map(f => `-i "${f}"`).join(' ');
    const command = `ffmpeg ${inputs} -filter_complex concat=n=${audioFiles.length}:v=0:a=1 "${outputPath}" -y`;
    
    await execAsync(command);
    return outputPath;
  }

  private async mergeQuick(videoPath: string, audioPath: string): Promise<string> {
    const outputPath = path.join(this.outputDir, `final_opt_${Date.now()}.mp4`);
    
    // Get audio duration
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
    );
    const duration = parseFloat(stdout.trim());
    
    const command = `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -shortest "${outputPath}" -y`;
    await execAsync(command);
    
    return outputPath;
  }
}