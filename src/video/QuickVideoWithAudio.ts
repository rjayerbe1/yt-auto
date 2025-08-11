import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';
import { SimpleRemotionProducer } from './SimpleRemotionProducer';
import { DemoGenerator } from '../demo/demo-generator';

const execAsync = promisify(exec);

export class QuickVideoWithAudio {
  private outputDir: string;
  private audioDir: string;
  private remotionProducer: SimpleRemotionProducer;
  private demoGen: DemoGenerator;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'output', 'videos');
    this.audioDir = path.join(process.cwd(), 'output', 'audio');
    this.remotionProducer = new SimpleRemotionProducer();
    this.demoGen = new DemoGenerator();
  }

  async generateCompleteVideo(): Promise<string> {
    try {
      logger.info('🎬 Starting complete video generation with audio...');

      // 1. Generate demo content
      const idea = await this.demoGen.generateDemoIdea();
      const script = await this.demoGen.generateDemoScript(idea);
      
      logger.info(`📝 Script: ${script.title}`);

      // 2. Generate audio for each part
      await fs.mkdir(this.audioDir, { recursive: true });
      
      const audioFiles: string[] = [];
      
      // Generate audio for hook
      if (script.hook) {
        const hookAudio = await this.generateAudio(script.hook, 'hook.wav');
        audioFiles.push(hookAudio);
      }

      // Generate audio for main content
      const contentText = script.content.map(segment => 
        typeof segment === 'string' ? segment : segment.content
      ).join('. ');
      
      const contentAudio = await this.generateAudio(contentText, 'content.wav');
      audioFiles.push(contentAudio);

      // Generate audio for CTA
      if (script.callToAction) {
        const ctaAudio = await this.generateAudio(script.callToAction, 'cta.wav');
        audioFiles.push(ctaAudio);
      }

      // 3. Combine audio files
      const combinedAudio = await this.combineAudioFiles(audioFiles);
      logger.info(`🎵 Audio combined: ${combinedAudio}`);

      // 4. Generate video with Remotion
      const videoPath = await this.remotionProducer.generateVideo(script);
      logger.info(`🎥 Video generated: ${videoPath}`);

      // 5. Merge audio with video
      const finalVideo = await this.mergeAudioVideo(videoPath, combinedAudio);
      logger.info(`✅ Final video with audio: ${finalVideo}`);

      return finalVideo;

    } catch (error) {
      logger.error('Error generating complete video:', error);
      throw error;
    }
  }

  private async generateAudio(text: string, filename: string): Promise<string> {
    const outputPath = path.join(this.audioDir, filename);
    const scriptPath = path.join(process.cwd(), 'scripts', 'simple_tts.py');
    
    // Escape text for shell
    const escapedText = text.replace(/'/g, "'\\''");
    
    const command = `python3 "${scriptPath}" '${escapedText}' "${outputPath}"`;
    
    logger.info(`🎤 Generating audio: ${filename}`);
    logger.info(`   Text length: ${text.length} characters`);
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 1024 * 1024 * 10,
        timeout: 120000 // 2 minute timeout per audio file
      });
      
      // Parse JSON from output to verify success
      try {
        const lines = stdout.trim().split('\n');
        const jsonLine = lines.find(line => line.startsWith('{'));
        if (jsonLine) {
          const result = JSON.parse(jsonLine);
          if (!result.success) {
            throw new Error(result.error || 'Audio generation failed');
          }
        }
      } catch (e) {
        // Continue if parsing fails but file exists
      }
      
      // Check if file was created
      await fs.access(outputPath);
      logger.info(`✅ Audio saved: ${outputPath}`);
      return outputPath;
      
    } catch (error) {
      logger.error(`Failed to generate audio for: ${filename}`, error);
      throw error;
    }
  }

  private async combineAudioFiles(audioFiles: string[]): Promise<string> {
    if (audioFiles.length === 0) {
      throw new Error('No audio files to combine');
    }

    if (audioFiles.length === 1) {
      return audioFiles[0];
    }

    const outputPath = path.join(this.audioDir, `combined_${Date.now()}.wav`);
    
    // Create file list for ffmpeg
    const listPath = path.join(this.audioDir, 'audio_list.txt');
    const listContent = audioFiles.map(f => `file '${f}'`).join('\n');
    await fs.writeFile(listPath, listContent);

    // Combine with ffmpeg
    const command = `ffmpeg -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}" -y`;
    
    logger.info('🎵 Combining audio files...');
    await execAsync(command);
    
    // Clean up list file
    await fs.unlink(listPath);
    
    return outputPath;
  }

  private async mergeAudioVideo(videoPath: string, audioPath: string): Promise<string> {
    const outputPath = path.join(this.outputDir, `final_${Date.now()}.mp4`);
    
    // First, get audio duration
    const { stdout: durationOutput } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
    );
    const audioDuration = parseFloat(durationOutput.trim());
    logger.info(`Audio duration: ${audioDuration} seconds`);
    
    // Loop video to match audio duration
    const command = `ffmpeg -stream_loop -1 -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -t ${audioDuration} "${outputPath}" -y`;
    
    logger.info('🎬 Merging audio with video (looping video to match audio)...');
    await execAsync(command);
    
    return outputPath;
  }
}