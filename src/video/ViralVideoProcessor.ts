import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { whisperTranscriber } from '../services/WhisperTranscriber';
import { HardwareAcceleratedGenerator } from './HardwareAcceleratedGenerator';
import { FileCleanup } from '../utils/cleanup';
import { SmartBrollAnalyzer } from '../services/SmartBrollAnalyzer';
import { ViralBrollFinder } from '../services/ViralBrollFinder';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ViralScript {
  id: string;
  title: string;
  hook: string;
  script: string;
  duration: number;
  style: string;
  tags: string[];
  expectedViews: string;
  cta?: string; // Call to action opcional
}

interface AudioSegment {
  text: string;
  audioFile: string;
  duration: number;
  startTime: number;
  endTime: number;
  wordTimings?: any[];
  captions?: any[];
}

interface ProcessedVideo {
  title: string;
  segments: AudioSegment[];
  totalDuration: number;
  videoStyle: number;
  metadata: {
    scriptId: string;
    expectedViews: string;
    tags: string[];
  };
}

/**
 * Procesador dedicado para videos virales
 * Maneja todo el flujo desde script hasta video final
 */
export class ViralVideoProcessor extends EventEmitter {
  private outputDir: string;
  private audioDir: string;
  private hwAccel: HardwareAcceleratedGenerator;
  private cleanup: FileCleanup;
  private totalSteps: number = 0;
  private currentStep: number = 0;

  constructor() {
    super();
    this.outputDir = path.join(process.cwd(), 'output', 'videos');
    this.audioDir = path.join(process.cwd(), 'output', 'audio');
    this.hwAccel = new HardwareAcceleratedGenerator();
    this.cleanup = new FileCleanup();
    
    // Log hardware status
    const sysInfo = this.hwAccel.getSystemInfo();
    logger.info(`🖥️ Viral Processor - System: ${sysInfo.platform}, GPU: ${sysInfo.gpu ? 'Yes' : 'No'}`);
  }

  private emitProgress(message: string, details?: any) {
    this.currentStep++;
    const progress = this.totalSteps > 0 
      ? Math.min(100, Math.round((this.currentStep / this.totalSteps) * 100))
      : 0;
    
    logger.info(`[Viral ${this.currentStep}/${this.totalSteps}] [${progress}%] ${message}`);
    
    this.emit('progress', {
      step: this.currentStep,
      totalSteps: this.totalSteps,
      progress,
      message,
      details
    });
  }

  /**
   * Procesa un script viral completo y genera el video
   */
  async processViralScript(viralScript: ViralScript): Promise<string> {
    try {
      logger.info(`🔥 Processing viral video: ${viralScript.title}`);
      logger.info(`📊 Expected views: ${viralScript.expectedViews}`);
      logger.info(`⏱️ Duration: ${viralScript.duration}s`);
      
      // Initialize progress
      this.currentStep = 0;
      this.totalSteps = 8; // Prepare, Audio, Combine, Transcribe, Broll, Render, Merge, Finalize
      
      // Step 1: Prepare content
      this.emitProgress('Preparing viral content...', { title: viralScript.title });
      const processedContent = await this.prepareViralContent(viralScript);
      
      // Step 2: Generate audio for all segments
      this.emitProgress('Generating audio segments...', { segments: processedContent.segments.length });
      await this.generateAudioSegments(processedContent);
      
      // Step 3: Combine audio files into one
      this.emitProgress('Combining audio files...');
      const combinedAudio = await this.combineAudioFiles(
        processedContent.segments.map(s => s.audioFile)
      );
      
      // Step 4: Transcribe for word-level sync
      this.emitProgress('Transcribing for synchronization...');
      await this.transcribeSegments(processedContent);
      
      // Step 5: Download B-roll videos
      this.emitProgress('Finding and downloading B-roll videos...');
      const brollVideos = await this.downloadBrollVideos(processedContent, viralScript);
      
      // Step 6: Save processed data for Remotion
      this.emitProgress('Preparing video data...');
      await this.saveProcessedData(processedContent, brollVideos);
      
      // Step 7: Render video with Remotion (without audio)
      this.emitProgress('Rendering viral video...');
      const videoPath = await this.renderVideo(processedContent);
      
      // Step 8: Merge audio with video
      this.emitProgress('Merging audio with video...');
      const finalVideo = await this.mergeAudioVideo(videoPath, combinedAudio);
      
      logger.info(`✅ Viral video generated: ${finalVideo}`);
      return finalVideo;
      
    } catch (error) {
      logger.error('Error processing viral video:', error);
      throw error;
    }
  }

  /**
   * Prepara el contenido viral dividiendo el script en segmentos
   */
  private async prepareViralContent(viralScript: ViralScript): Promise<ProcessedVideo> {
    // Map style names to numbers
    const styleMap: Record<string, number> = {
      'modern_gradient': 2,
      'minimalist': 4,
      'neon_cyberpunk': 3,
      'dynamic': 6,
      'dark_horror': 3,
      'glitch_tech': 6,
      'hospital_horror': 3,
      'professional': 4
    };
    
    const videoStyle = styleMap[viralScript.style] || 3;
    
    const segments: AudioSegment[] = [];
    let segmentIndex = 0;
    let currentTime = 0;
    
    // 1. Add HOOK as first segment (always)
    if (viralScript.hook) {
      const hookDuration = 3; // Hook duration ~3 seconds
      segments.push({
        text: viralScript.hook,
        audioFile: path.join(this.audioDir, `viral_segment_${segmentIndex}.wav`),
        duration: hookDuration,
        startTime: currentTime,
        endTime: currentTime + hookDuration,
        wordTimings: [],
        captions: []
      });
      segmentIndex++;
      currentTime += hookDuration;
    }
    
    // 2. Split main script into segments
    const words = viralScript.script.split(' ');
    const mainDuration = viralScript.duration - (viralScript.hook ? 3 : 0) - (viralScript.cta ? 2 : 0);
    const targetSegments = Math.min(6, Math.max(3, Math.ceil(mainDuration / 8)));
    const wordsPerSegment = Math.ceil(words.length / targetSegments);
    const segmentDuration = mainDuration / targetSegments;
    
    for (let i = 0; i < targetSegments; i++) {
      const startIdx = i * wordsPerSegment;
      const endIdx = Math.min(startIdx + wordsPerSegment, words.length);
      const segmentText = words.slice(startIdx, endIdx).join(' ');
      
      if (segmentText.trim()) {
        segments.push({
          text: segmentText,
          audioFile: path.join(this.audioDir, `viral_segment_${segmentIndex}.wav`),
          duration: segmentDuration,
          startTime: currentTime,
          endTime: currentTime + segmentDuration,
          wordTimings: [],
          captions: []
        });
        segmentIndex++;
        currentTime += segmentDuration;
      }
    }
    
    // 3. Add CTA as last segment (if exists)
    if (viralScript.cta) {
      const ctaDuration = 2; // CTA duration ~2 seconds
      segments.push({
        text: viralScript.cta,
        audioFile: path.join(this.audioDir, `viral_segment_${segmentIndex}.wav`),
        duration: ctaDuration,
        startTime: currentTime,
        endTime: currentTime + ctaDuration,
        wordTimings: [],
        captions: []
      });
      currentTime += ctaDuration;
    }
    
    return {
      title: viralScript.title,
      segments,
      totalDuration: currentTime,
      videoStyle,
      metadata: {
        scriptId: viralScript.id,
        expectedViews: viralScript.expectedViews,
        tags: viralScript.tags
      }
    };
  }

  /**
   * Genera audio para todos los segmentos
   */
  private async generateAudioSegments(content: ProcessedVideo): Promise<void> {
    // Create audio directory
    await fs.mkdir(this.audioDir, { recursive: true });
    
    logger.info(`🎤 Generating ${content.segments.length} audio segments for viral video...`);
    
    // Generate audio for each segment using Python script (like SyncedVideoGenerator does)
    for (let i = 0; i < content.segments.length; i++) {
      const segment = content.segments[i];
      
      logger.info(`Generating audio ${i+1}/${content.segments.length}...`);
      
      // Emit progress
      this.emit('progress', {
        step: this.currentStep,
        totalSteps: this.totalSteps,
        progress: Math.round((this.currentStep / this.totalSteps) * 100),
        message: `Generating audio ${i+1}/${content.segments.length}...`,
        details: {
          segment: `segment_${i}`,
          text: segment.text.substring(0, 50) + '...'
        }
      });
      
      try {
        // Generate audio using Python script
        const audioData = await this.generateAudioWithDuration(
          segment.text,
          path.basename(segment.audioFile)
        );
        
        segment.audioFile = audioData.file;
        segment.duration = audioData.duration;
        
        logger.info(`✅ Audio segment ${i+1} generated: ${audioData.duration.toFixed(2)}s`);
        
      } catch (error) {
        logger.error(`Failed to generate audio for segment ${i}:`, error);
        throw error;
      }
    }
    
    logger.info('✅ All audio segments generated successfully');
  }

  /**
   * Transcribe segments for word-level synchronization
   */
  private async transcribeSegments(content: ProcessedVideo): Promise<void> {
    for (const segment of content.segments) {
      try {
        const transcription = await whisperTranscriber.transcribeWithTimestamps(
          segment.audioFile,
          30 // FPS
        );
        
        if (transcription && transcription.captions) {
          segment.captions = transcription.captions;
          // Convert captions to word timings if needed
          segment.wordTimings = transcription.captions.map((caption: any) => ({
            word: caption.text,
            startTime: caption.startMs / 1000,
            endTime: caption.endMs / 1000,
            startFrame: Math.floor(caption.startMs * 30 / 1000),
            endFrame: Math.floor(caption.endMs * 30 / 1000)
          }));
        }
      } catch (error) {
        logger.warn(`Transcription failed for segment, using estimated timings`, error);
      }
    }
  }

  /**
   * Combine audio files into one
   */
  private async combineAudioFiles(audioFiles: string[]): Promise<string> {
    if (audioFiles.length === 0) return '';
    if (audioFiles.length === 1) return audioFiles[0];

    const outputPath = path.join(this.audioDir, `combined_${Date.now()}.wav`);
    const listPath = path.join(this.audioDir, 'audio_list.txt');
    const listContent = audioFiles.map(f => `file '${f}'`).join('\n');
    await fs.writeFile(listPath, listContent);

    // Use copy codec for compatibility
    const command = `ffmpeg -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}" -y`;
    
    try {
      await execAsync(command);
    } catch (error) {
      // If copy fails, try re-encoding
      logger.warn('Copy codec failed, re-encoding audio');
      const fallbackCommand = `ffmpeg -f concat -safe 0 -i "${listPath}" -ar 44100 -ac 2 "${outputPath}" -y`;
      await execAsync(fallbackCommand);
    }
    
    await fs.unlink(listPath);
    logger.info(`✅ Combined ${audioFiles.length} audio files into one`);
    return outputPath;
  }

  /**
   * Download B-roll videos
   */
  private async downloadBrollVideos(content: ProcessedVideo, viralScript: ViralScript): Promise<string[]> {
    logger.info('🎬 Using Smart B-roll Analyzer for intelligent content matching...');
    
    // Check if script has custom B-roll search terms
    if ((viralScript as any).brollSearchTerms && (viralScript as any).brollSearchTerms.length > 0) {
      logger.info(`🔍 Using ${(viralScript as any).brollSearchTerms.length} custom search terms from script`);
      
      // Use the viral B-roll finder with custom search terms
      const viralFinder = new ViralBrollFinder();
      const brollVideos = await viralFinder.findViralBroll(
        [viralScript.hook, viralScript.script, viralScript.cta || ''].join(' '),
        content.totalDuration,
        viralScript.tags,
        (viralScript as any).brollSearchTerms
      );
      
      logger.info(`✅ Found ${brollVideos.length} B-roll videos using custom search terms`);
      return brollVideos;
    }
    
    // Fallback to smart analyzer if no custom terms
    const smartAnalyzer = new SmartBrollAnalyzer();
    
    // Combine all text from segments for full context analysis
    const fullScript = [
      viralScript.hook,
      ...content.segments.map(s => s.text),
      viralScript.cta || ''
    ].filter(Boolean).join(' ');
    
    // Let the smart analyzer find relevant B-roll based on content analysis
    const brollVideos = await smartAnalyzer.findSmartBroll(
      fullScript,
      content.totalDuration,
      viralScript.tags
    );
    
    logger.info(`✅ Smart analyzer found ${brollVideos.length} relevant B-roll videos`);
    return brollVideos;
  }

  /**
   * Save processed data for Remotion
   */
  private async saveProcessedData(content: ProcessedVideo, brollVideos: string[]): Promise<void> {
    const dataPath = path.join(process.cwd(), 'src', 'remotion', 'synced-data.json');
    
    // Convert B-roll paths to relative paths for Remotion
    const brollRelativePaths = brollVideos.map(videoPath => {
      const filename = path.basename(videoPath);
      return `broll/${filename}`;
    });
    
    // Add all necessary data for Remotion
    const dataForRemotion = {
      ...content,
      videoStyle: content.videoStyle,
      brollVideos: brollRelativePaths,
      isViralContent: true,
      generatedAt: new Date().toISOString()
    };
    
    await fs.writeFile(dataPath, JSON.stringify(dataForRemotion, null, 2));
    logger.info('📝 Viral data saved for Remotion rendering');
  }

  /**
   * Render video using Remotion
   */
  private async renderVideo(content: ProcessedVideo): Promise<string> {
    const outputPath = path.join(this.outputDir, `viral_${content.metadata.scriptId}_${Date.now()}.mp4`);
    
    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });
    
    try {
      // Bundle Remotion project
      const bundleLocation = await bundle({
        entryPoint: path.join(process.cwd(), 'src', 'remotion', 'index.tsx'),
        webpackOverride: (config) => config,
      });

      // Select composition
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: 'WordByWordFinal',
        inputProps: {},
      });

      // Calculate total frames
      const fps = 30;
      const durationInFrames = Math.ceil(content.totalDuration * fps);

      // Render video without audio (we'll add it later)
      await renderMedia({
        composition: {
          ...composition,
          durationInFrames,
          fps,
        },
        serveUrl: bundleLocation,
        codec: 'h264',
        outputLocation: outputPath,
        audioCodec: null, // Don't render audio, we'll merge it later
        // Enable GPU acceleration
        concurrency: 4,
        imageFormat: 'jpeg',
        jpegQuality: 95,
        chromiumOptions: {
          gl: 'angle',
          enableMultiProcessOnLinux: true,
          disableWebSecurity: false,
        },
        onProgress: ({ progress }) => {
          logger.info(`Rendering: ${Math.round(progress * 100)}%`);
          this.emitProgress(`Rendering video: ${Math.round(progress * 100)}%`, {
            progress: Math.round(progress * 100)
          }, false); // Don't increment step
        },
      });
      
      logger.info(`✅ Video rendered: ${outputPath}`);
      return outputPath;
      
    } catch (error) {
      logger.error('Remotion render error:', error);
      throw error;
    }
  }

  /**
   * Merge audio with video
   */
  private async mergeAudioVideo(videoPath: string, audioPath: string): Promise<string> {
    if (!audioPath) return videoPath;
    
    const outputPath = path.join(this.outputDir, `final_viral_${Date.now()}.mp4`);
    
    logger.info('🎬 Merging audio with video...');
    logger.info(`  Video: ${videoPath}`);
    logger.info(`  Audio: ${audioPath}`);
    
    // Verify files exist
    try {
      await fs.access(videoPath);
      await fs.access(audioPath);
    } catch (error) {
      logger.error('Files not found for merging:', error);
      throw new Error('Video or audio file not found for merging');
    }
    
    // Use FFmpeg with good audio quality
    const command = `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -ar 44100 -ac 2 -map 0:v:0 -map 1:a:0 -shortest "${outputPath}" -y`;
    
    logger.info('Running merge command:', command);
    
    try {
      await execAsync(command);
      logger.info('✅ Merge complete:', outputPath);
      
      // Verify output exists
      await fs.access(outputPath);
      
      return outputPath;
    } catch (error) {
      logger.error('Error merging audio and video:', error);
      
      // Try with re-encoding as fallback
      logger.info('Trying alternative merge with re-encoding...');
      const fallbackCommand = `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v libx264 -preset fast -c:a aac -b:a 192k -ar 44100 -ac 2 -map 0:v:0 -map 1:a:0 -shortest "${outputPath}" -y`;
      
      await execAsync(fallbackCommand);
      return outputPath;
    }
  }

  /**
   * Generate audio with duration (same as SyncedVideoGenerator)
   */
  private async generateAudioWithDuration(text: string, filename: string): Promise<{ file: string; duration: number }> {
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
    
    logger.info(`🎤 Generating audio: ${filename}`);
    
    // Try multiple times with Chatterbox before falling back
    const maxRetries = 3;
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`🔄 Attempt ${attempt}/${maxRetries} with Chatterbox...`);
        
        // Try to generate with Chatterbox (with timeout)
        await execAsync(command, {
          maxBuffer: 1024 * 1024 * 10,
          timeout: 1800000 // 30 minutes timeout per segment (GPU processing is slower)
        });
        
        // Get duration
        const duration = await this.getAudioDuration(outputPath);
        logger.info(`✅ Audio generated: ${filename} (${duration.toFixed(2)}s) on attempt ${attempt}`);
        
        return { file: outputPath, duration };
        
      } catch (error) {
        lastError = error;
        logger.warn(`❌ Chatterbox attempt ${attempt} failed for ${filename}:`, error);
        
        if (attempt < maxRetries) {
          // Wait a bit before retrying (exponential backoff)
          const waitTime = attempt * 2000; // 2s, 4s, 6s
          logger.info(`⏳ Waiting ${waitTime/1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // All retries failed, throw error
    logger.error(`❌ All ${maxRetries} Chatterbox attempts failed for ${filename}`);
    logger.error('Last error:', lastError);
    
    throw new Error(`Failed to generate audio with Chatterbox after ${maxRetries} attempts. Please try again or check your Chatterbox API configuration.`);
  }

  /**
   * Estimate text duration
   */
  private estimateTextDuration(text: string): number {
    // Estimate ~150 words per minute
    const words = text.split(' ').length;
    const duration = (words / 150) * 60;
    return Math.max(1, Math.min(duration, 10)); // Between 1-10 seconds
  }

  /**
   * Create silent audio
   */
  private async createSilentAudio(duration: number, outputPath: string): Promise<void> {
    const command = `ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t ${duration} "${outputPath}" -y`;
    await execAsync(command);
  }

  /**
   * Get audio duration
   */
  private async getAudioDuration(audioPath: string): Promise<number> {
    try {
      const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`;
      const { stdout } = await execAsync(command);
      return parseFloat(stdout.trim()) || 1;
    } catch {
      // Estimate based on text length if ffprobe fails
      return 3;
    }
  }

  /**
   * Process viral script from JSON file
   */
  async processViralFromFile(scriptId: string): Promise<string> {
    // Load viral scripts
    const scriptsPath = path.join(process.cwd(), 'data', 'viral-scripts.json');
    const scriptsData = JSON.parse(await fs.readFile(scriptsPath, 'utf-8'));
    
    // Find script by ID
    let viralScript: ViralScript | null = null;
    
    for (const script of [...scriptsData.channel1_psychology, ...scriptsData.channel2_horror]) {
      if (script.id === scriptId) {
        viralScript = script;
        break;
      }
    }
    
    if (!viralScript) {
      throw new Error(`Script with ID ${scriptId} not found`);
    }
    
    return this.processViralScript(viralScript);
  }
}