import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs/promises';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';
import { Script, Video } from '../types';
import { ChatterboxTTS } from '../services/ChatterboxTTS';
import { SubtitleGenerator } from './SubtitleGenerator';
import { videoConfig } from '../config';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export class VideoProducer {
  private prisma: PrismaClient;
  private logger = createLogger('VideoProducer');
  private tts: ChatterboxTTS;
  private subtitleGen: SubtitleGenerator;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.tts = new ChatterboxTTS();
    this.subtitleGen = new SubtitleGenerator();
  }

  async createVideo(script: Script): Promise<Video> {
    try {
      this.logger.info(`Starting video production for script: ${script.id}`);

      // 1. Generate audio from script
      const audioPath = await this.generateAudio(script);
      
      // 2. Generate subtitles
      const subtitlesPath = await this.subtitleGen.generate(script, audioPath);
      
      // 3. Prepare assets
      const assets = await this.prepareAssets(script);
      
      // 4. Render video with Remotion
      const rawVideoPath = await this.renderRemotionVideo(script, audioPath, assets);
      
      // 5. Post-process with FFmpeg
      const finalVideoPath = await this.postProcessVideo(
        rawVideoPath, 
        audioPath, 
        subtitlesPath
      );
      
      // 6. Generate thumbnail
      const thumbnailPath = await this.generateThumbnail(finalVideoPath, script);
      
      // 7. Save to database
      const video = await this.saveVideo(script, finalVideoPath, thumbnailPath);
      
      this.logger.info(`Video created successfully: ${video.id}`);
      return video;
    } catch (error) {
      this.logger.error('Error creating video:', error);
      throw error;
    }
  }

  private async generateAudio(script: Script): Promise<string> {
    this.logger.info('Generating audio with Chatterbox TTS');
    
    const audioSegments = await this.tts.generateScriptAudio(script);
    
    // Combine audio segments
    const outputPath = path.join(
      process.cwd(),
      'output',
      'audio',
      `${script.id}_combined.mp3`
    );

    await this.combineAudioFiles(audioSegments, outputPath);
    
    return outputPath;
  }

  private async renderRemotionVideo(
    script: Script,
    audioPath: string,
    assets: any
  ): Promise<string> {
    this.logger.info('Rendering video with Remotion');

    const bundleLocation = await bundle({
      entryPoint: path.join(__dirname, 'remotion', 'index.ts'),
      webpackOverride: (config) => config,
    });

    const outputPath = path.join(
      process.cwd(),
      'output',
      'videos',
      `${script.id}_raw.mp4`
    );

    await renderMedia({
      composition: {
        id: 'YouTubeShort',
        durationInFrames: Math.floor(script.duration * 30), // 30 fps
        fps: 30,
        width: 1080,
        height: 1920,
      },
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: {
        script: {
          title: script.title,
          hook: script.hook,
          segments: script.content,
          callToAction: script.callToAction,
        },
        template: this.selectTemplate(script),
        audioUrl: audioPath,
        backgroundMusic: 'energetic',
        subtitlesEnabled: true,
      },
      imageFormat: 'jpeg',
      pixelFormat: 'yuv420p',
      crf: 18, // Quality: lower = better (18 is visually lossless)
      videoBitrate: '8M',
      audioBitrate: '320k',
      numberOfGifLoops: 0,
      everyNthFrame: 1,
      concurrency: 1,
      onProgress: ({ progress }) => {
        this.logger.info(`Rendering progress: ${(progress * 100).toFixed(2)}%`);
      },
    });

    return outputPath;
  }

  private async postProcessVideo(
    videoPath: string,
    audioPath: string,
    subtitlesPath: string
  ): Promise<string> {
    this.logger.info('Post-processing video with FFmpeg');

    const outputPath = path.join(
      process.cwd(),
      'output',
      'videos',
      `${path.basename(videoPath, '_raw.mp4')}_final.mp4`
    );

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        // Add audio track
        .input(audioPath)
        .audioCodec('aac')
        .audioBitrate('128k')
        
        // Add subtitles
        .videoFilters([
          {
            filter: 'subtitles',
            options: {
              filename: subtitlesPath,
              force_style: 'FontName=Montserrat,FontSize=24,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,BackColour=&H80000000&,Outline=2,Shadow=1,MarginV=50',
            },
          },
          // Add slight vignette effect
          {
            filter: 'vignette',
            options: {
              angle: 'PI/4',
              x0: 'w/2',
              y0: 'h/2',
              mode: 'backward',
            },
          },
          // Color correction
          {
            filter: 'eq',
            options: {
              contrast: 1.1,
              brightness: 0.05,
              saturation: 1.2,
            },
          },
        ])
        
        // Video settings
        .videoCodec('libx264')
        .outputOptions([
          '-preset fast',
          '-crf 23',
          '-movflags +faststart', // Optimize for streaming
          '-pix_fmt yuv420p',
        ])
        
        // Audio mixing (background music + voiceover)
        .complexFilter([
          '[0:a][1:a]amix=inputs=2:duration=shortest:dropout_transition=2[aout]',
        ])
        .outputOptions(['-map', '0:v', '-map', '[aout]'])
        
        .on('start', (command) => {
          this.logger.debug('FFmpeg command:', command);
        })
        .on('progress', (progress) => {
          this.logger.info(`Processing: ${progress.percent?.toFixed(2)}% done`);
        })
        .on('error', (err) => {
          this.logger.error('FFmpeg error:', err);
          reject(err);
        })
        .on('end', () => {
          this.logger.info('Video processing completed');
          resolve(outputPath);
        })
        .save(outputPath);
    });
  }

  private async combineAudioFiles(audioPaths: string[], outputPath: string): Promise<void> {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    return new Promise((resolve, reject) => {
      const command = ffmpeg();
      
      // Add all input files
      audioPaths.forEach(path => {
        command.input(path);
      });

      command
        .on('error', reject)
        .on('end', resolve)
        .mergeToFile(outputPath, path.dirname(outputPath));
    });
  }

  private async generateThumbnail(videoPath: string, script: Script): Promise<string> {
    const outputPath = path.join(
      process.cwd(),
      'output',
      'thumbnails',
      `${script.id}.jpg`
    );

    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['50%'], // Middle of video
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '1280x720',
        })
        .on('error', reject)
        .on('end', () => {
          // Enhance thumbnail with text overlay
          this.enhanceThumbnail(outputPath, script.title)
            .then(() => resolve(outputPath))
            .catch(reject);
        });
    });
  }

  private async enhanceThumbnail(imagePath: string, title: string): Promise<void> {
    // Add text overlay to thumbnail
    return new Promise((resolve, reject) => {
      ffmpeg(imagePath)
        .videoFilters([
          {
            filter: 'drawtext',
            options: {
              text: title,
              fontfile: '/System/Library/Fonts/Helvetica.ttc',
              fontsize: 72,
              fontcolor: 'white',
              borderw: 3,
              bordercolor: 'black',
              x: '(w-text_w)/2',
              y: 'h-100',
            },
          },
        ])
        .on('error', reject)
        .on('end', resolve)
        .save(imagePath.replace('.jpg', '_enhanced.jpg'));
    });
  }

  private selectTemplate(script: Script): string {
    // Select template based on category and tone
    const categoryTemplates: Record<string, string> = {
      education: 'facts',
      entertainment: 'storytime',
      lifehacks: 'lifehacks',
      technology: 'trending',
      science: 'facts',
    };

    return categoryTemplates[script.idea?.category || 'entertainment'] || 'trending';
  }

  private async prepareAssets(script: Script): Promise<any> {
    // Prepare visual assets for video
    const assets = {
      images: [],
      videos: [],
      icons: [],
      backgroundMusic: await this.selectBackgroundMusic(script),
    };

    // Download or generate images based on script content
    // This would integrate with image generation APIs or stock photo services
    
    return assets;
  }

  private async selectBackgroundMusic(script: Script): Promise<string> {
    // Select appropriate background music based on tone
    const musicMap: Record<string, string> = {
      educational: 'calm',
      entertaining: 'upbeat',
      informative: 'mysterious',
      humorous: 'energetic',
      inspirational: 'upbeat',
    };

    const musicType = musicMap[script.idea?.tone || 'entertaining'];
    
    // Return path to background music file
    return path.join(process.cwd(), 'assets', 'music', `${musicType}.mp3`);
  }

  private async saveVideo(
    script: Script,
    videoPath: string,
    thumbnailPath: string
  ): Promise<Video> {
    const stats = await fs.stat(videoPath);
    
    const video = await this.prisma.video.create({
      data: {
        scriptId: script.id,
        title: script.title,
        description: script.idea?.description || '',
        filePath: videoPath,
        thumbnailPath,
        duration: script.duration,
        resolution: videoConfig.formats.resolution,
        fileSize: BigInt(stats.size),
        status: 'COMPLETED',
        metadata: {
          title: script.title,
          description: script.idea?.description || '',
          tags: script.idea?.keyPoints || [],
          categoryId: '28',
          language: script.language,
          hashtags: this.generateHashtags(script),
          timestamps: this.generateTimestamps(script),
        },
      },
    });

    return video as Video;
  }

  private generateHashtags(script: Script): string[] {
    const hashtags = [
      '#shorts',
      '#youtubeshorts',
      '#viral',
      '#trending',
    ];

    // Add category-specific hashtags
    if (script.idea?.category) {
      hashtags.push(`#${script.idea.category}`);
    }

    // Add key points as hashtags
    if (script.idea?.keyPoints) {
      script.idea.keyPoints.forEach(point => {
        hashtags.push(`#${point.replace(/\s+/g, '').toLowerCase()}`);
      });
    }

    return hashtags.slice(0, 10); // YouTube allows max 15 hashtags
  }

  private generateTimestamps(script: Script): Array<{ time: string; label: string }> {
    const timestamps: Array<{ time: string; label: string }> = [];
    
    script.content.forEach(segment => {
      if (segment.type === 'narration' && segment.visualDescription) {
        const minutes = Math.floor(segment.startTime / 60);
        const seconds = Math.floor(segment.startTime % 60);
        timestamps.push({
          time: `${minutes}:${seconds.toString().padStart(2, '0')}`,
          label: segment.visualDescription.substring(0, 50),
        });
      }
    });

    return timestamps;
  }
}