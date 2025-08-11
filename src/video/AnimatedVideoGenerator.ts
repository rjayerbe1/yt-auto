import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { DemoGenerator } from '../demo/demo-generator';
import { EventEmitter } from 'events';
import { HardwareAcceleratedGenerator } from './HardwareAcceleratedGenerator';
import { FileCleanup } from '../utils/cleanup';

const execAsync = promisify(exec);

interface AudioSegment {
  text: string;
  audioFile: string;
  duration: number;
  startTime: number;
  endTime: number;
}

interface AnimatedScript {
  title: string;
  segments: AudioSegment[];
  totalDuration: number;
}

export class AnimatedVideoGenerator extends EventEmitter {
  private outputDir: string;
  private audioDir: string;
  private demoGen: DemoGenerator;
  private hwAccel: HardwareAcceleratedGenerator;
  private totalSteps: number = 0;
  private currentStep: number = 0;

  constructor() {
    super();
    this.outputDir = path.join(process.cwd(), 'output', 'videos');
    this.audioDir = path.join(process.cwd(), 'output', 'audio');
    this.demoGen = new DemoGenerator();
    this.hwAccel = new HardwareAcceleratedGenerator();
    
    // Listen for hardware acceleration progress
    this.hwAccel.on('progress', (data) => {
      this.emit('progress', {
        ...data,
        gpu: true
      });
    });
  }

  private emitProgress(message: string, details?: any) {
    this.currentStep++;
    const progress = this.totalSteps > 0 
      ? Math.round((this.currentStep / this.totalSteps) * 100)
      : 0;
    
    // Add animated indicators to progress messages
    const animationFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    const frameIndex = this.currentStep % animationFrames.length;
    const animatedMessage = `${animationFrames[frameIndex]} ${message}`;
    
    logger.info(`[${progress}%] ${animatedMessage}`);
    
    this.emit('progress', {
      step: this.currentStep,
      totalSteps: this.totalSteps,
      progress,
      message: animatedMessage,
      details,
      animation: {
        frame: animationFrames[frameIndex],
        type: this.getAnimationType(message)
      }
    });
  }

  private getAnimationType(message: string): string {
    if (message.includes('audio')) return 'audio';
    if (message.includes('video')) return 'video';
    if (message.includes('script')) return 'text';
    if (message.includes('render')) return 'render';
    return 'default';
  }

  async generateAnimatedVideo(): Promise<string> {
    try {
      logger.info('🎬 Starting ANIMATED video generation with visual effects...');

      // Initialize with animation
      this.currentStep = 0;
      this.totalSteps = 10;
      
      // 1. Generate script with animation
      this.emitProgress('🎨 Creating animated script content...', {
        stage: 'script',
        animation: 'typewriter'
      });
      
      const idea = await this.demoGen.generateDemoIdea();
      const script = await this.demoGen.generateDemoScript(idea);

      // Recalculate steps
      const totalSegments = 1 + script.content.length + 1;
      this.totalSteps = totalSegments + 5;
      this.currentStep = 1;

      // 2. Setup directories
      await fs.mkdir(this.audioDir, { recursive: true });
      await fs.mkdir(this.outputDir, { recursive: true });

      // 3. Generate audio with visual feedback
      const segments: AudioSegment[] = [];
      let currentTime = 0;
      let segmentIndex = 0;

      // Process hook with animation
      if (script.hook) {
        this.emitProgress(`🎤 Recording hook audio (1/${totalSegments})...`, {
          segment: 'hook',
          text: script.hook.substring(0, 50) + '...',
          waveform: true
        });
        
        const hookAudio = await this.generateAudioWithAnimation(script.hook, 'hook.wav');
        segments.push({
          text: script.hook,
          audioFile: hookAudio.file,
          duration: hookAudio.duration,
          startTime: currentTime,
          endTime: currentTime + hookAudio.duration
        });
        currentTime += hookAudio.duration;
        segmentIndex++;
      }

      // Process content segments with animation
      for (let i = 0; i < script.content.length; i++) {
        const segment = script.content[i];
        const text = typeof segment === 'string' ? segment : segment.content;
        
        this.emitProgress(`🎵 Creating audio segment ${i+1}/${script.content.length}...`, {
          segment: `content_${i}`,
          text: text.substring(0, 50) + '...',
          waveform: true,
          pulse: true
        });
        
        const audioData = await this.generateAudioWithAnimation(text, `segment_${i}.wav`);
        
        segments.push({
          text: text,
          audioFile: audioData.file,
          duration: audioData.duration,
          startTime: currentTime,
          endTime: currentTime + audioData.duration
        });
        currentTime += audioData.duration;
        segmentIndex++;
      }

      // Process CTA with animation
      if (script.callToAction) {
        this.emitProgress(`🎯 Finalizing call-to-action (${segmentIndex+1}/${totalSegments})...`, {
          segment: 'cta',
          text: script.callToAction,
          sparkle: true
        });
        
        const ctaAudio = await this.generateAudioWithAnimation(script.callToAction, 'cta.wav');
        segments.push({
          text: script.callToAction,
          audioFile: ctaAudio.file,
          duration: ctaAudio.duration,
          startTime: currentTime,
          endTime: currentTime + ctaAudio.duration
        });
        currentTime += ctaAudio.duration;
      }

      // 4. Create animated timing file
      const animatedScript: AnimatedScript = {
        title: script.title,
        segments: segments,
        totalDuration: currentTime
      };

      const timingFile = path.join(this.outputDir, `animated_timing_${Date.now()}.json`);
      await fs.writeFile(timingFile, JSON.stringify(animatedScript, null, 2));

      // 5. Combine audio with effects
      this.emitProgress('🎧 Mixing audio tracks with effects...', {
        totalFiles: segments.length,
        duration: animatedScript.totalDuration,
        mixing: true
      });
      const combinedAudio = await this.combineAudioWithEffects(segments.map(s => s.audioFile));

      // 6. Generate animated video
      this.emitProgress('✨ Rendering animated video with visual effects...', {
        duration: animatedScript.totalDuration,
        effects: ['particles', 'waves', 'glow'],
        rendering: true
      });
      const videoPath = await this.generateAnimatedRemotionVideo(animatedScript);

      // 7. Final merge with polish
      this.emitProgress('🎬 Applying final polish and effects...', {
        finalStep: true,
        polish: true
      });
      const finalVideo = await this.mergeWithEffects(videoPath, combinedAudio);
      
      this.emitProgress('🎉 Animated video complete!', {
        videoPath: finalVideo,
        celebration: true
      });
      
      // Clean up intermediate files
      this.emitProgress('🧹 Cleaning up temporary files...', {
        cleanup: true
      });
      
      // Collect all intermediate files to delete
      const filesToDelete: string[] = [];
      
      // Add individual audio segment files
      segments.forEach(segment => {
        filesToDelete.push(segment.audioFile);
      });
      
      // Add combined audio (if different from final)
      if (combinedAudio && combinedAudio !== finalVideo) {
        filesToDelete.push(combinedAudio);
      }
      
      // Add intermediate video (if different from final)
      if (videoPath && videoPath !== finalVideo) {
        filesToDelete.push(videoPath);
      }
      
      // Add timing file
      if (timingFile) {
        filesToDelete.push(timingFile);
      }
      
      // Add processed video if it exists
      const processedVideo = finalVideo.replace('.mp4', '_processed.mp4');
      try {
        await fs.access(processedVideo);
        if (processedVideo !== finalVideo) {
          filesToDelete.push(processedVideo);
        }
      } catch {
        // File doesn't exist, skip
      }
      
      // Clean up the files
      await FileCleanup.cleanupIntermediateFiles(filesToDelete, finalVideo);
      
      // Clean up temp files in directories
      await FileCleanup.cleanupTempFiles(this.audioDir);
      await FileCleanup.cleanupTempFiles(this.outputDir);
      
      // Log directory sizes
      const audioSize = await FileCleanup.getDirectorySize(this.audioDir);
      const videoSize = await FileCleanup.getDirectorySize(this.outputDir);
      logger.info(`📊 Storage: Audio dir: ${audioSize.toFixed(2)}MB, Video dir: ${videoSize.toFixed(2)}MB`);
      
      logger.info(`✅ ANIMATED video with effects complete: ${finalVideo}`);
      return finalVideo;

    } catch (error) {
      logger.error('Error in animated video generation:', error);
      throw error;
    }
  }

  private async generateAudioWithAnimation(text: string, filename: string): Promise<{ file: string; duration: number }> {
    const outputPath = path.join(this.audioDir, filename);
    // Try GPU-accelerated script first, fallback to regular
    let scriptPath = path.join(process.cwd(), 'scripts', 'simple_tts_gpu.py');
    
    // Check if GPU script exists
    try {
      await fs.access(scriptPath);
      logger.info('🚀 Using GPU-accelerated TTS (Metal Performance Shaders)');
    } catch {
      // Fallback to regular script
      scriptPath = path.join(process.cwd(), 'scripts', 'simple_tts.py');
      logger.info('Using standard TTS (CPU)');
    }
    
    const escapedText = text.replace(/'/g, "'\\''");
    const command = `python3 "${scriptPath}" '${escapedText}' "${outputPath}"`;
    
    logger.info(`🎤 Generating audio with animation: ${filename}`);
    
    // Simulate waveform animation in logs
    const waveforms = ['▁▂▃▄▅▆▇█', '▂▃▄▅▆▇█▇', '▃▄▅▆▇█▇▆', '▄▅▆▇█▇▆▅'];
    for (let i = 0; i < waveforms.length; i++) {
      logger.info(`  ${waveforms[i]} Processing audio...`);
    }
    
    try {
      await execAsync(command, {
        maxBuffer: 1024 * 1024 * 10,
        timeout: 60000
      });
      
      const duration = await this.getAudioDuration(outputPath);
      logger.info(`✅ Audio generated with effects: ${filename} (${duration.toFixed(2)}s)`);
      
      return { file: outputPath, duration };
      
    } catch (error) {
      logger.warn(`Chatterbox failed for ${filename}, using fallback with effects`);
      
      const sayCommand = `say -o "${outputPath}" --data-format=LEF32@22050 "${text}"`;
      
      try {
        await execAsync(sayCommand);
      } catch {
        const estimatedDuration = this.estimateTextDuration(text);
        await this.createSilentAudio(estimatedDuration, outputPath);
      }
      
      const duration = await this.getAudioDuration(outputPath);
      return { file: outputPath, duration };
    }
  }

  private async getAudioDuration(audioPath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
      );
      return parseFloat(stdout.trim()) || 1;
    } catch {
      return 3;
    }
  }

  private estimateTextDuration(text: string): number {
    const words = text.split(' ').length;
    const duration = (words / 150) * 60;
    return Math.max(1, Math.min(duration, 10));
  }

  private async createSilentAudio(duration: number, outputPath: string): Promise<void> {
    const command = `ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t ${duration} "${outputPath}" -y`;
    await execAsync(command);
  }

  private async combineAudioWithEffects(audioFiles: string[]): Promise<string> {
    if (audioFiles.length === 0) return '';
    if (audioFiles.length === 1) return audioFiles[0];

    const outputPath = path.join(this.audioDir, `combined_animated_${Date.now()}.wav`);
    const listPath = path.join(this.audioDir, 'audio_list.txt');
    const listContent = audioFiles.map(f => `file '${f}'`).join('\n');
    await fs.writeFile(listPath, listContent);

    // Simple concat without crossfade (crossfade would need complex filter)
    const command = `ffmpeg -f concat -safe 0 -i "${listPath}" -c:a pcm_s16le "${outputPath}" -y`;
    
    try {
      await execAsync(command);
    } catch (error) {
      // Fallback to simple copy if PCM fails
      logger.warn('PCM concat failed, trying copy codec');
      const fallbackCommand = `ffmpeg -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}" -y`;
      await execAsync(fallbackCommand);
    }
    
    await fs.unlink(listPath);
    return outputPath;
  }

  private async generateAnimatedRemotionVideo(animatedScript: AnimatedScript): Promise<string> {
    logger.info('✨ Generating video with animated visual effects...');
    
    const dataPath = path.join(process.cwd(), 'src', 'remotion', 'animated-data.json');
    await fs.writeFile(dataPath, JSON.stringify(animatedScript, null, 2));
    
    const outputPath = path.join(this.outputDir, `animated_${Date.now()}.mp4`);
    
    try {
      const bundleLocation = await bundle({
        entryPoint: path.join(process.cwd(), 'src', 'remotion', 'index.tsx'),
        webpackOverride: (config) => config,
      });

      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: 'AnimatedSyncedVideo',
        inputProps: animatedScript,
      });

      const fps = 30;
      const durationInFrames = Math.ceil(animatedScript.totalDuration * fps);

      await renderMedia({
        composition: {
          ...composition,
          durationInFrames,
          fps,
        },
        serveUrl: bundleLocation,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps: animatedScript,
        onProgress: ({ progress }) => {
          const percentage = Math.round(progress * 100);
          const stars = '★'.repeat(Math.floor(percentage / 10)) + '☆'.repeat(10 - Math.floor(percentage / 10));
          logger.info(`Rendering: [${stars}] ${percentage}%`);
        },
      });

      logger.info(`✅ Animated video rendered: ${outputPath}`);
      return outputPath;

    } catch (error) {
      logger.error('Remotion error, using animated fallback:', error);
      return await this.generateAnimatedFallbackVideo(animatedScript);
    }
  }

  private async generateAnimatedFallbackVideo(animatedScript: AnimatedScript): Promise<string> {
    const outputPath = path.join(this.outputDir, `animated_fallback_${Date.now()}.mp4`);
    
    const duration = Math.ceil(animatedScript.totalDuration);
    // Create video with animated text overlay
    const command = `ffmpeg -f lavfi -i color=c=black:s=1080x1920:d=${duration} \
      -vf "drawtext=text='${animatedScript.title}':fontcolor=white:fontsize=60:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,0,${duration})':box=1:boxcolor=black@0.5:boxborderw=5" \
      -c:v libx264 -pix_fmt yuv420p "${outputPath}" -y`;
    
    await execAsync(command);
    return outputPath;
  }

  private async mergeWithEffects(videoPath: string, audioPath: string): Promise<string> {
    if (!audioPath) return videoPath;
    
    const outputPath = path.join(this.outputDir, `final_animated_${Date.now()}.mp4`);
    
    logger.info('🎬 Merging with GPU-accelerated effects and polish...');
    
    // Use hardware acceleration with effects
    const duration = await this.getVideoDuration(videoPath);
    const filters = [
      `fade=t=in:st=0:d=1,fade=t=out:st=${duration - 1}:d=1`,
      'unsharp=5:5:1.0:5:5:0.0', // Sharpen for better quality
      'eq=contrast=1.05:brightness=0.02:saturation=1.15' // Enhance colors
    ];
    
    // Process with GPU and apply effects
    const processedVideo = await this.hwAccel.processWithMetalPerformanceShaders(
      videoPath,
      outputPath.replace('.mp4', '_processed.mp4'),
      filters
    );
    
    // Merge with audio using GPU
    const finalVideo = await this.hwAccel.generateVideoWithGPU(
      processedVideo,
      outputPath,
      { audio: audioPath }
    );
    
    // Optimize for M1 playback
    const optimized = await this.hwAccel.optimizeForM1(finalVideo);
    
    return optimized;
  }

  private async getVideoDuration(videoPath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
      );
      return parseFloat(stdout.trim()) || 30;
    } catch {
      return 30;
    }
  }
}