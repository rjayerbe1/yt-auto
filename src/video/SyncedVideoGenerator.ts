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
import { ttsClient } from '../services/TTSClient';
import { whisperTranscriber } from '../services/WhisperTranscriber';
// import { createTikTokStyleCaptions } from '@remotion/captions';
import { BrollDownloader } from '../services/BrollDownloader';
import { ImprovedBrollFinder } from '../services/ImprovedBrollFinder';
import { ViralBrollFinder } from '../services/ViralBrollFinder';

const execAsync = promisify(exec);

interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
  startFrame: number;
  endFrame: number;
}

interface Caption {
  text: string;
  startMs: number;
  endMs: number;
  timestampMs: number;
  confidence: number | null;
}

interface AudioSegment {
  text: string;
  audioFile: string;
  duration: number;
  startTime: number;
  endTime: number;
  wordTimings?: WordTiming[];
  captions?: Caption[];  // New: actual word timestamps from Whisper
}

interface SyncedScript {
  title: string;
  segments: AudioSegment[];
  totalDuration: number;
}

export class SyncedVideoGenerator extends EventEmitter {
  private outputDir: string;
  private audioDir: string;
  private demoGen: DemoGenerator;
  private hwAccel: HardwareAcceleratedGenerator;
  private totalSteps: number = 0;
  private currentStep: number = 0;
  private targetDuration: number;
  private videoStyle: number;

  constructor(duration: number = 30, style: number = 1) {
    super();
    this.outputDir = path.join(process.cwd(), 'output', 'videos');
    this.audioDir = path.join(process.cwd(), 'output', 'audio');
    this.demoGen = new DemoGenerator();
    this.hwAccel = new HardwareAcceleratedGenerator();
    this.targetDuration = duration; // Store target duration in seconds
    this.videoStyle = style; // Store selected style (1-6)
    
    // Log hardware acceleration status
    const sysInfo = this.hwAccel.getSystemInfo();
    logger.info(`🖥️ System: ${sysInfo.platform}, GPU: ${sysInfo.gpu ? 'Yes' : 'No'}, Encoder: ${sysInfo.encoder}`);
  }

  private emitProgress(message: string, details?: any, incrementStep: boolean = true) {
    if (incrementStep) {
      this.currentStep++;
    }
    
    const progress = this.totalSteps > 0 
      ? Math.min(100, Math.round((this.currentStep / this.totalSteps) * 100))  // Limitar a 100%
      : 0;
    
    logger.info(`[Step ${this.currentStep}/${this.totalSteps}] [${progress}%] ${message}`);
    
    this.emit('progress', {
      step: this.currentStep,
      totalSteps: this.totalSteps,
      progress: Math.min(100, progress),  // Asegurar que nunca pase de 100
      message,
      details
    });
  }
  
  private emitAudioProgress(message: string, audioIndex: number, totalAudios: number, details?: any) {
    // Calculate audio generation progress as part of the overall progress
    // We're in step 2 of 5 total steps
    // Step 1 is complete (20%), step 2 goes from 20% to 40%
    
    // Progress within the audio generation step (0 to 1)
    const audioStepProgress = (audioIndex - 1) / totalAudios; // -1 because index starts at 1
    
    // Overall progress calculation:
    // - Step 1 complete = 20%
    // - Step 2 progress = 20% + (20% * audioStepProgress)
    const stepSize = 100 / this.totalSteps; // 20% per step
    const completedSteps = 1; // Step 1 (script) is complete
    const baseProgress = completedSteps * stepSize; // 20%
    const currentStepProgress = stepSize * audioStepProgress; // 0-20%
    const overallProgress = baseProgress + currentStepProgress; // 20-40%
    
    logger.info(`[Audio ${audioIndex}/${totalAudios}] [${Math.round(overallProgress)}%] ${message}`);
    
    this.emit('progress', {
      step: this.currentStep,
      totalSteps: this.totalSteps,
      progress: Math.min(100, Math.round(overallProgress)),
      message,
      details: {
        ...details,
        audioIndex,
        totalAudios,
        audioProgress: Math.round(audioStepProgress * 100)
      }
    });
  }

  private calculateWordTimings(text: string, segmentStartTime: number, segmentDuration: number): WordTiming[] {
    // Split text into words
    let words = text.split(/\s+/).filter(word => word.length > 0);
    
    // Merge currency symbols with following numbers
    const mergedWords: string[] = [];
    for (let i = 0; i < words.length; i++) {
      if (words[i] === '$' && i + 1 < words.length && /^\d/.test(words[i + 1])) {
        // Merge $ with the following number
        mergedWords.push(words[i] + words[i + 1]);
        i++; // Skip the next word
      } else if (/\$$/.test(words[i]) && i + 1 < words.length && /^\d/.test(words[i + 1])) {
        // Merge words ending with $ with following number
        mergedWords.push(words[i] + words[i + 1]);
        i++;
      } else {
        mergedWords.push(words[i]);
      }
    }
    words = mergedWords;
    
    if (words.length === 0) return [];
    
    // Calculate base time per word
    // const baseTimePerWord = segmentDuration / words.length;
    
    // Calculate weight for each word based on:
    // - Length (longer words take more time to say)
    // - Syllables (approximate)
    // - Common short words get less time
    const calculateWordWeight = (word: string): number => {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
      
      // Common short words that are said quickly
      const quickWords = ['a', 'an', 'the', 'is', 'it', 'to', 'of', 'in', 'on', 'at', 'for', 'and', 'or', 'but'];
      if (quickWords.includes(cleanWord)) {
        return 0.6; // 60% of normal time
      }
      
      // Estimate syllables (rough approximation)
      const vowels = cleanWord.match(/[aeiou]/gi) || [];
      const syllableCount = Math.max(1, vowels.length);
      
      // Weight based on syllables and length
      // 1 syllable = 0.8, 2 = 1.0, 3 = 1.2, 4+ = 1.4
      const syllableWeight = Math.min(1.4, 0.6 + (syllableCount * 0.2));
      
      // Also consider raw length
      const lengthWeight = Math.min(1.5, 0.5 + (cleanWord.length / 10));
      
      // Average the two weights
      return (syllableWeight + lengthWeight) / 2;
    };
    
    // Calculate weighted durations
    const weights = words.map(word => calculateWordWeight(word));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    // Build word timings
    const wordTimings: WordTiming[] = [];
    let currentTime = segmentStartTime;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const weight = weights[i];
      
      // Calculate this word's duration based on its weight
      const wordDuration = (weight / totalWeight) * segmentDuration;
      
      wordTimings.push({
        word,
        startTime: currentTime,
        endTime: currentTime + wordDuration,
        startFrame: Math.floor(currentTime * 30), // 30 fps
        endFrame: Math.floor((currentTime + wordDuration) * 30)
      });
      
      currentTime += wordDuration;
    }
    
    // Final adjustment to ensure we end exactly at segment end time
    const lastWord = wordTimings[wordTimings.length - 1];
    if (lastWord) {
      lastWord.endTime = segmentStartTime + segmentDuration;
      lastWord.endFrame = Math.floor(lastWord.endTime * 30);
    }
    
    return wordTimings;
  }

  async generateSyncedVideo(): Promise<string> {
    try {
      logger.info('🎬 Starting SYNCHRONIZED video generation...');

      // Initialize steps before any progress emission
      this.currentStep = 0;
      this.totalSteps = 5; // Total steps: script, audio, combine, video, merge
      
      // 1. Generate script (step 1)
      this.emitProgress(`Generating ${this.targetDuration}-second script content...`);
      const idea = await this.demoGen.generateDemoIdea();
      // Pass duration to script generator to adjust content length
      const script = await this.demoGen.generateDemoScript(idea, this.targetDuration);

      // currentStep is now 1 after script generation
      // const totalSegments = (script.hook ? 1 : 0) + script.content.length + (script.callToAction ? 1 : 0);

      // 2. Create directories
      await fs.mkdir(this.audioDir, { recursive: true });
      await fs.mkdir(this.outputDir, { recursive: true });

      // 3. Prepare all texts for batch generation (don't increment progress here)
      const batchItems = [];
      const textSegments = [];
      
      // Add hook
      if (script.hook) {
        batchItems.push({
          text: script.hook,
          output_path: path.join(this.audioDir, 'hook.wav')
        });
        textSegments.push({ type: 'hook', text: script.hook });
      }
      
      // Add content segments
      for (let i = 0; i < script.content.length; i++) {
        const segment = script.content[i];
        const text = typeof segment === 'string' ? segment : segment.content;
        batchItems.push({
          text: text,
          output_path: path.join(this.audioDir, `segment_${i}.wav`)
        });
        textSegments.push({ type: 'content', index: i, text: text });
      }
      
      // Add call to action
      if (script.callToAction) {
        batchItems.push({
          text: script.callToAction,
          output_path: path.join(this.audioDir, 'cta.wav')
        });
        textSegments.push({ type: 'cta', text: script.callToAction });
      }
      
      // 4. Generate all audio in batch (MUCH faster!)
      // We're still in step 1, about to move to step 2
      // Show initialization message without incrementing
      this.emit('progress', {
        step: this.currentStep,
        totalSteps: this.totalSteps,
        progress: Math.round((this.currentStep / this.totalSteps) * 100), // Should be 20%
        message: `Initializing batch audio generation (${batchItems.length} items)...`,
        details: {
          totalSegments: batchItems.length,
          mode: 'batch'
        }
      });
      
      // Now move to step 2 for actual audio generation
      this.currentStep = 2;
      
      let batchResult;
      try {
        // Use the streaming version for real-time progress
        batchResult = await ttsClient.generateBatchWithProgress(
          batchItems,
          (progressData) => {
            // Emit progress for each audio segment as it's generated
            if (progressData.type === 'progress') {
              this.emitAudioProgress(
                `Generating audio ${progressData.index}/${progressData.total}: ${progressData.segment}...`,
                progressData.index,
                progressData.total,
                {
                  segment: progressData.segment,
                  text: progressData.text
                }
              );
            } else if (progressData.type === 'item_complete') {
              this.emitAudioProgress(
                `Audio completed: ${progressData.index}/${progressData.total}`,
                progressData.index,
                progressData.total,
                {
                  completed: true
                }
              );
            }
          }
        );
        
        if (!batchResult.results || batchResult.results.length !== batchItems.length) {
          throw new Error('Batch audio generation failed');
        }
      } catch (error) {
        // Fallback to individual generation if batch fails
        logger.warn('Batch TTS failed, falling back to individual generation:', error);
        this.emitProgress('Batch generation failed, using individual generation...');
        
        const results = [];
        for (let i = 0; i < batchItems.length; i++) {
          const item = batchItems[i];
          const textSegment = textSegments[i];
          
          this.emitAudioProgress(
            `Generating audio ${i+1}/${batchItems.length}...`,
            i + 1,
            batchItems.length,
            {
              segment: textSegment.type,
              text: textSegment.text.substring(0, 50) + '...'
            }
          );
          
          const audioData = await this.generateAudioWithDuration(
            item.text, 
            path.basename(item.output_path)
          );
          
          results.push({
            success: true,
            output: audioData.file
          });
        }
        
        batchResult = { results };
      }
      
      // 5. Process results and create segments
      const segments: AudioSegment[] = [];
      let currentTime = 0;
      
      for (let i = 0; i < batchResult.results.length; i++) {
        const result = batchResult.results[i];
        const textSegment = textSegments[i];
        
        if (!result.success) {
          throw new Error(`Failed to generate audio for segment ${i}`);
        }
        
        // Get duration of generated audio
        const duration = await this.getAudioDuration(result.output);
        
        // Get accurate word timestamps using Whisper
        let wordTimings: WordTiming[] = [];
        let captions: Caption[] = [];
        
        try {
          // Transcribe to get accurate timestamps
          logger.info(`🎙️ Getting word timestamps for segment ${i+1}...`);
          const transcribedCaptions = await whisperTranscriber.getTimestampsForText(
            result.output,
            textSegment.text
          );
          
          // Convert captions to word timings (adjust to segment start time)
          // Check if captions have valid timestamps
          if (transcribedCaptions.length > 0 && transcribedCaptions[0].startMs !== null) {
            captions = transcribedCaptions.map(cap => ({
              ...cap,
              startMs: cap.startMs + (currentTime * 1000),
              endMs: cap.endMs + (currentTime * 1000),
              timestampMs: cap.timestampMs + (currentTime * 1000)
            }));
            
            // Convert to WordTiming format for backward compatibility
            wordTimings = captions.map(cap => ({
              word: cap.text,
              startTime: cap.startMs / 1000,
              endTime: cap.endMs / 1000,
              startFrame: Math.floor((cap.startMs / 1000) * 30),
              endFrame: Math.floor((cap.endMs / 1000) * 30)
            }));
          } else {
            // If captions don't have valid timestamps, throw error to trigger fallback
            throw new Error('Whisper returned captions without valid timestamps');
          }
          
          logger.info(`✅ Got ${captions.length} word timestamps from Whisper`);
          
        } catch (whisperError) {
          // Fallback to estimation if Whisper fails
          logger.warn('Whisper transcription failed, using estimation:', whisperError);
          wordTimings = this.calculateWordTimings(textSegment.text, currentTime, duration);
          
          // Debug: Log the calculated timings
          logger.info(`Calculated ${wordTimings.length} word timings for "${textSegment.text}"`);
          if (wordTimings.length > 0) {
            logger.info(`First word timing: ${JSON.stringify(wordTimings[0])}`);
          }
          
          // Also create captions from the calculated word timings
          // Fix: ensure proper timestamp calculation
          captions = wordTimings.map(wt => ({
            text: wt.word,
            startMs: Math.round(wt.startTime * 1000),
            endMs: Math.round(wt.endTime * 1000),
            timestampMs: Math.round(((wt.startTime + wt.endTime) / 2) * 1000), // Fix: divide by 2, not multiply by 500
            confidence: null
          }));
        }
        
        const segment: AudioSegment = {
          text: textSegment.text,
          audioFile: result.output,
          duration: duration,
          startTime: currentTime,
          endTime: currentTime + duration,
          wordTimings: wordTimings,
          captions: captions
        };
        
        segments.push(segment);
        currentTime += duration;
        
        logger.info(`✅ Segment ${i+1}/${batchItems.length}: ${duration.toFixed(2)}s`);
      }

      // 4. Create timing file for Remotion
      const syncedScript: SyncedScript = {
        title: script.title,
        segments: segments,
        totalDuration: currentTime
      };

      const timingFile = path.join(this.outputDir, `timing_${Date.now()}.json`);
      await fs.writeFile(timingFile, JSON.stringify(syncedScript, null, 2));
      logger.info(`📝 Timing file created: ${timingFile}`);

      // 5. Combine audio files
      this.emitProgress('Combining audio files...', {
        totalFiles: segments.length,
        duration: syncedScript.totalDuration
      });
      const combinedAudio = await this.combineAudioFiles(segments.map(s => s.audioFile));

      // 6. Generate video with synchronized subtitles
      this.emitProgress('Generating video with synchronized subtitles...', {
        duration: syncedScript.totalDuration
      });
      const videoPath = await this.generateSyncedRemotionVideo(syncedScript);

      // 7. Merge audio with video
      this.emitProgress('Merging audio with video...', {
        finalStep: true
      });
      const finalVideo = await this.mergeAudioVideo(videoPath, combinedAudio);
      
      // Don't emit extra progress - we're done at 100%
      logger.info('✅ Video generation complete!');
      
      // Clean up intermediate files (don't count as progress step)
      logger.info('🧹 Cleaning up temporary files...');
      
      // Collect all intermediate files to delete
      const filesToDelete: string[] = [];
      
      // NOTA: Temporalmente deshabilitado el borrado de archivos de audio
      // para asegurar que el audio se combine correctamente con el video
      
      // Add individual audio segment files - COMENTADO TEMPORALMENTE
      // segments.forEach(segment => {
      //   filesToDelete.push(segment.audioFile);
      // });
      
      // Add combined audio - COMENTADO TEMPORALMENTE
      // if (combinedAudio && combinedAudio !== finalVideo) {
      //   filesToDelete.push(combinedAudio);
      // }
      
      // Add intermediate video (if different from final)
      if (videoPath && videoPath !== finalVideo) {
        filesToDelete.push(videoPath);
      }
      
      // Add timing file - COMENTADO PARA NO BORRAR EL ARCHIVO DE TIMING
      // if (timingFile) {
      //   filesToDelete.push(timingFile);
      // }
      
      // Clean up the files (solo limpia video intermedio y timing file)
      if (filesToDelete.length > 0) {
        await FileCleanup.cleanupIntermediateFiles(filesToDelete, finalVideo);
      }
      
      // Clean up temp files in directories - COMENTADO TEMPORALMENTE
      // await FileCleanup.cleanupTempFiles(this.audioDir);
      // await FileCleanup.cleanupTempFiles(this.outputDir);
      
      // Log directory sizes
      const audioSize = await FileCleanup.getDirectorySize(this.audioDir);
      const videoSize = await FileCleanup.getDirectorySize(this.outputDir);
      logger.info(`📊 Storage: Audio dir: ${audioSize.toFixed(2)}MB, Video dir: ${videoSize.toFixed(2)}MB`);
      
      logger.info(`✅ SYNCHRONIZED video complete: ${finalVideo}`);
      return finalVideo;

    } catch (error) {
      logger.error('Error in synced video generation:', error);
      throw error;
    }
  }

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
    
    // Try multiple times with Chatterbox before failing
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

  private async getAudioDuration(audioPath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
      );
      return parseFloat(stdout.trim()) || 1;
    } catch {
      // Estimate based on text length if ffprobe fails
      return 3;
    }
  }

  private estimateTextDuration(text: string): number {
    // Estimate ~150 words per minute
    const words = text.split(' ').length;
    const duration = (words / 150) * 60;
    return Math.max(1, Math.min(duration, 10)); // Between 1-10 seconds
  }

  private async createSilentAudio(duration: number, outputPath: string): Promise<void> {
    const command = `ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t ${duration} "${outputPath}" -y`;
    await execAsync(command);
  }

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
    return outputPath;
  }

  private async generateSyncedRemotionVideo(syncedScript: SyncedScript): Promise<string> {
    logger.info(`🎥 Generating video with synchronized subtitles (Style ${this.videoStyle})...`);
    
    // Log the selected style name
    const styleNames = [
      'Clean Modern (Purple/Gold)',
      'Minimal (White/Black)',
      'Gradient Tropical (Coral/Teal)',
      'Matrix Green (Terminal)',
      'Gold Luxury (Dark/Gold)',
      'Cherry Blossom (Peach/Red)'
    ];
    logger.info(`🎨 Using style: ${styleNames[this.videoStyle - 1] || 'Default'}`);
    
    // Download B-roll videos based on script content
    logger.info('🎬 Finding relevant B-roll videos...');
    
    let brollVideos: string[] = [];
    const allText = syncedScript.segments.map(s => s.text).join(' ');
    
    // First check if we have custom B-roll search terms from viral scripts
    try {
      const viralScriptsPath = path.join(process.cwd(), 'data', 'viral-scripts.json');
      const viralScripts = JSON.parse(await fs.readFile(viralScriptsPath, 'utf-8'));
      
      // Try to find if current script matches a viral script with brollSearchTerms
      let customSearchTerms: string[] | undefined;
      
      // Check both channels for matching scripts
      const allScripts = [...viralScripts.channel1_psychology, ...viralScripts.channel2_horror];
      for (const script of allScripts) {
        // Check if the title or text matches
        if (syncedScript.title && script.title && 
            (syncedScript.title.includes(script.title) || script.title.includes(syncedScript.title))) {
          if (script.brollSearchTerms && script.brollSearchTerms.length > 0) {
            customSearchTerms = script.brollSearchTerms;
            logger.info(`🎯 Found matching viral script with ${customSearchTerms.length} custom B-roll terms`);
            break;
          }
        }
        // Also check if the text content matches
        if (allText.includes(script.hook) || allText.includes(script.script.substring(0, 50))) {
          if (script.brollSearchTerms && script.brollSearchTerms.length > 0) {
            customSearchTerms = script.brollSearchTerms;
            logger.info(`🎯 Found matching viral script by content with ${customSearchTerms.length} custom B-roll terms`);
            break;
          }
        }
      }
      
      // If we found custom search terms, use ViralBrollFinder
      if (customSearchTerms && customSearchTerms.length > 0) {
        logger.info(`🔍 Using ViralBrollFinder with ${customSearchTerms.length} custom search terms`);
        const viralFinder = new ViralBrollFinder();
        
        // Extract tags from title or use default
        const tags = syncedScript.title ? 
          syncedScript.title.toLowerCase().includes('psych') ? ['psychology'] : 
          syncedScript.title.toLowerCase().includes('horror') ? ['horror'] : 
          ['general'] : ['general'];
        
        brollVideos = await viralFinder.findViralBroll(
          allText,
          syncedScript.totalDuration,
          tags,
          customSearchTerms
        );
        
        logger.info(`✅ Found ${brollVideos.length} B-roll videos using custom search terms`);
      }
    } catch (error) {
      logger.debug('No viral scripts or custom terms found, using default finder');
    }
    
    // If no custom terms were found or used, fall back to normal finders
    if (brollVideos.length === 0) {
      const useImprovedFinder = process.env.USE_IMPROVED_BROLL !== 'false';
      
      if (useImprovedFinder) {
        logger.info('🧠 Using AI-enhanced B-roll finder...');
        const improvedFinder = new ImprovedBrollFinder();
        brollVideos = await improvedFinder.findBrollForScript(allText, syncedScript.totalDuration);
      } else {
        logger.info('📦 Using basic B-roll finder...');
        const brollDownloader = new BrollDownloader();
        brollVideos = await brollDownloader.downloadBrollForScript(allText, syncedScript.totalDuration);
      }
    }
    
    // Copy B-roll videos to public folder for Remotion to access
    const publicBrollDir = path.join(process.cwd(), 'public', 'broll');
    await fs.mkdir(publicBrollDir, { recursive: true });
    
    // Clean up old B-roll files (older than 1 hour)
    try {
      const existingFiles = await fs.readdir(publicBrollDir);
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      
      for (const file of existingFiles) {
        const filePath = path.join(publicBrollDir, file);
        const stats = await fs.stat(filePath);
        if (stats.mtimeMs < oneHourAgo) {
          await fs.unlink(filePath);
          logger.info(`🧹 Cleaned up old B-roll: ${file}`);
        }
      }
    } catch (error) {
      // Ignore cleanup errors
      logger.debug('B-roll cleanup error (non-critical):', error);
    }
    
    const brollRelativePaths = await Promise.all(brollVideos.map(async (videoPath) => {
      const filename = path.basename(videoPath);
      const publicPath = path.join(publicBrollDir, filename);
      
      // Copy the file to public/broll
      try {
        await fs.copyFile(videoPath, publicPath);
        logger.info(`📁 Copied B-roll to public: ${filename}`);
      } catch (error) {
        logger.error(`Failed to copy B-roll file: ${filename}`, error);
      }
      
      return `broll/${filename}`;
    }));
    
    logger.info(`✅ Downloaded and copied ${brollRelativePaths.length} B-roll videos to public folder`);
    
    // Add videoStyle and brollVideos to the synced script
    const syncedScriptWithStyle = {
      ...syncedScript,
      videoStyle: this.videoStyle,
      brollVideos: brollRelativePaths
    };
    
    // Save the synced script for Remotion to use
    const dataPath = path.join(process.cwd(), 'src', 'remotion', 'synced-data.json');
    await fs.writeFile(dataPath, JSON.stringify(syncedScriptWithStyle, null, 2));
    
    const outputPath = path.join(this.outputDir, `synced_${Date.now()}.mp4`);
    
    try {
      // Bundle the Remotion project
      const bundleLocation = await bundle({
        entryPoint: path.join(process.cwd(), 'src', 'remotion', 'index.tsx'),
        webpackOverride: (config) => config,
      });

      // Get composition - use WordByWordFinal for synchronized word display
      // We'll update it to support B-roll videos
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: 'WordByWordFinal',
        inputProps: syncedScriptWithStyle,
      });

      // Calculate total frames
      const fps = 30;
      const durationInFrames = Math.ceil(syncedScript.totalDuration * fps);

      // Render the video with GPU acceleration if available
      await renderMedia({
        composition: {
          ...composition,
          durationInFrames,
          fps,
        },
        serveUrl: bundleLocation,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps: syncedScriptWithStyle,
        audioCodec: null, // No renderizar audio, lo agregaremos después
        // Enable GPU acceleration for Remotion
        concurrency: 4, // Use multiple cores
        imageFormat: 'jpeg', // Faster than PNG
        jpegQuality: 95,
        everyNthFrame: 1,
        numberOfGifLoops: null,
        envVariables: {
          // Optimize for M1 Macs
          NODE_OPTIONS: '--max-old-space-size=8192'
        },
        chromiumOptions: {
          // Hardware acceleration flags for Chrome
          gl: 'angle',
          enableMultiProcessOnLinux: true,
          disableWebSecurity: false,
        },
        onProgress: ({ progress }) => {
          logger.info(`Rendering: ${Math.round(progress * 100)}%`);
          this.emitProgress(`Rendering video with GPU: ${Math.round(progress * 100)}%`, {
            gpu: true,
            progress: Math.round(progress * 100)
          }, false); // Don't increment step, we're still in the same step
        },
      });

      logger.info(`✅ Synced video generated: ${outputPath}`);
      return outputPath;

    } catch (error) {
      logger.error('Remotion error, using fallback:', error);
      // Fallback to simple video
      return await this.generateFallbackVideo(syncedScript);
    }
  }

  private async generateFallbackVideo(syncedScript: SyncedScript): Promise<string> {
    const outputPath = path.join(this.outputDir, `fallback_${Date.now()}.mp4`);
    
    // Create a simple video with text overlay
    const duration = Math.ceil(syncedScript.totalDuration);
    
    // Escape special characters for ffmpeg drawtext filter
    // Need to escape: : ' \ and other special characters
    const title = syncedScript.title || 'Synced Video';
    const escapedTitle = title
      .replace(/\\/g, '\\\\\\\\')  // Escape backslashes first
      .replace(/:/g, '\\:')         // Escape colons
      .replace(/'/g, "\\'")         // Escape single quotes
      .replace(/"/g, '\\"')         // Escape double quotes
      .replace(/\[/g, '\\[')        // Escape brackets
      .replace(/\]/g, '\\]')        // Escape brackets
      .replace(/,/g, '\\,')         // Escape commas
      .replace(/;/g, '\\;');        // Escape semicolons
    
    const command = `ffmpeg -f lavfi -i color=c=black:s=1080x1920:d=${duration} \
      -vf "drawtext=text='${escapedTitle}':fontcolor=white:fontsize=60:x=(w-text_w)/2:y=(h-text_h)/2" \
      -c:v libx264 -pix_fmt yuv420p "${outputPath}" -y`;
    
    await execAsync(command);
    return outputPath;
  }

  private async mergeAudioVideo(videoPath: string, audioPath: string): Promise<string> {
    if (!audioPath) return videoPath;
    
    const outputPath = path.join(this.outputDir, `final_synced_${Date.now()}.mp4`);
    
    logger.info('🎬 Merging synchronized audio with video...');
    logger.info(`  Video: ${videoPath}`);
    logger.info(`  Audio: ${audioPath}`);
    
    // Verificar que los archivos existen antes de combinar
    try {
      await fs.access(videoPath);
      await fs.access(audioPath);
    } catch (error) {
      logger.error('Files not found for merging:', error);
      throw new Error('Video or audio file not found for merging');
    }
    
    // Usar FFmpeg con mejor calidad de audio
    // -b:a 192k = bitrate de audio 192kbps (buena calidad)
    // -ar 44100 = sample rate 44.1kHz
    // -ac 2 = stereo
    const command = `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -ar 44100 -ac 2 -map 0:v:0 -map 1:a:0 -shortest "${outputPath}" -y`;
    
    logger.info('Running merge command:', command);
    
    try {
      await execAsync(command);
      logger.info('Merge complete:', outputPath);
      
      // Verificar que el archivo de salida existe y tiene audio
      await fs.access(outputPath);
      
      // Verificar que el audio está presente y con buena calidad
      const checkCommand = `ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,bit_rate,sample_rate -of json "${outputPath}"`;
      const { stdout: audioInfo } = await execAsync(checkCommand);
      logger.info('Output audio info:', audioInfo);
      
      return outputPath;
    } catch (error) {
      logger.error('Error merging audio and video:', error);
      
      // Si falla, intentar con re-encoding
      logger.info('Trying alternative merge with re-encoding...');
      const fallbackCommand = `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v libx264 -preset fast -c:a aac -b:a 192k -ar 44100 -ac 2 -map 0:v:0 -map 1:a:0 -shortest "${outputPath}" -y`;
      
      await execAsync(fallbackCommand);
      return outputPath;
    }
  }
}