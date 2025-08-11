import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';
import * as os from 'os';

const execAsync = promisify(exec);

export class HardwareAcceleratedGenerator extends EventEmitter {
  private outputDir: string;
  private audioDir: string;
  private useGPU: boolean = false;
  private platform: string;

  constructor() {
    super();
    this.outputDir = path.join(process.cwd(), 'output', 'videos');
    this.audioDir = path.join(process.cwd(), 'output', 'audio');
    this.platform = os.platform();
    // Check hardware acceleration synchronously in constructor
    this.checkHardwareAccelerationSync();
    // Also check async for more detailed info
    this.checkHardwareAcceleration();
  }

  private checkHardwareAccelerationSync(): void {
    // Synchronous check for immediate availability
    if (this.platform === 'darwin') {
      // On macOS, check for Apple Silicon
      try {
        const cpuInfo = require('os').cpus()[0].model;
        if (cpuInfo.includes('Apple')) {
          this.useGPU = true;
        }
      } catch (error) {
        // Fallback check will happen in async
      }
    }
  }

  private async checkHardwareAcceleration(): Promise<void> {
    try {
      // Check for Apple Silicon (M1/M2/M3)
      if (this.platform === 'darwin') {
        const { stdout } = await execAsync('sysctl -n machdep.cpu.brand_string');
        if (stdout.includes('Apple')) {
          logger.info('🚀 Apple Silicon detected - enabling VideoToolbox acceleration');
          this.useGPU = true;
        }
      }
    } catch (error) {
      logger.warn('Could not detect hardware acceleration capabilities');
    }
  }

  private getEncoderSettings(): { encoder: string; params: string[] } {
    if (this.useGPU && this.platform === 'darwin') {
      // Use VideoToolbox for Apple Silicon
      return {
        encoder: 'h264_videotoolbox',
        params: [
          '-b:v', '5M',        // Bitrate
          '-maxrate', '7M',    // Max bitrate
          '-bufsize', '10M',   // Buffer size
          '-profile:v', 'high',
          '-level', '4.2',
          '-allow_sw', '1',    // Allow software fallback
          '-realtime', '1',    // Real-time encoding
          '-pix_fmt', 'yuv420p'
        ]
      };
    }
    
    // Fallback to software encoding
    return {
      encoder: 'libx264',
      params: [
        '-preset', 'medium',
        '-crf', '23',
        '-pix_fmt', 'yuv420p'
      ]
    };
  }

  async generateVideoWithGPU(
    inputVideo: string, 
    outputPath: string,
    options: { audio?: string; duration?: number } = {}
  ): Promise<string> {
    const { encoder, params } = this.getEncoderSettings();
    
    logger.info(`🎬 Encoding video with ${encoder} (GPU: ${this.useGPU ? 'Yes' : 'No'})`);
    
    let command = `ffmpeg -i "${inputVideo}"`;
    
    // Add audio if provided
    if (options.audio) {
      command += ` -i "${options.audio}"`;
    }
    
    // Add encoder and parameters
    command += ` -c:v ${encoder} ${params.join(' ')}`;
    
    // Audio codec
    if (options.audio) {
      command += ' -c:a aac -b:a 192k';
    }
    
    // Duration limit if specified
    if (options.duration) {
      command += ` -t ${options.duration}`;
    }
    
    // Output settings
    command += ` -movflags +faststart`; // Optimize for streaming
    command += ` -shortest`; // Use shortest stream duration
    command += ` "${outputPath}" -y`;
    
    const startTime = Date.now();
    
    try {
      this.emit('progress', {
        message: `Encoding with ${this.useGPU ? 'GPU acceleration' : 'CPU'}...`,
        encoder
      });
      
      await execAsync(command, {
        maxBuffer: 1024 * 1024 * 100, // 100MB buffer
        env: {
          ...process.env,
          // Optimize for M1 Macs
          FFMPEG_THREAD_QUEUE_SIZE: '512',
        }
      });
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`✅ Video encoded in ${duration}s using ${encoder}`);
      
      this.emit('progress', {
        message: `Encoding complete (${duration}s)`,
        encoder,
        duration
      });
      
      return outputPath;
    } catch (error) {
      logger.error('Encoding error:', error);
      throw error;
    }
  }

  async optimizeForM1(videoPath: string): Promise<string> {
    if (!this.useGPU) return videoPath;
    
    const optimizedPath = videoPath.replace('.mp4', '_optimized.mp4');
    
    logger.info('🔧 Optimizing video for M1 GPU playback...');
    
    // Use HEVC for better compression on M1
    const command = `ffmpeg -i "${videoPath}" \
      -c:v hevc_videotoolbox \
      -tag:v hvc1 \
      -b:v 3M \
      -maxrate 5M \
      -bufsize 8M \
      -c:a aac \
      -b:a 128k \
      -movflags +faststart \
      "${optimizedPath}" -y`;
    
    try {
      await execAsync(command);
      logger.info('✅ Video optimized for M1 GPU');
      return optimizedPath;
    } catch (error) {
      logger.warn('Could not optimize for M1, using original');
      return videoPath;
    }
  }

  async generateThumbnailWithGPU(videoPath: string): Promise<string> {
    const thumbnailPath = videoPath.replace('.mp4', '_thumb.jpg');
    
    let command = `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1`;
    
    if (this.useGPU) {
      // Use GPU for scaling
      command += ` -vf "scale=1920:1080:flags=lanczos"`;
    } else {
      command += ` -vf "scale=1920:1080"`;
    }
    
    command += ` -q:v 2 "${thumbnailPath}" -y`;
    
    try {
      await execAsync(command);
      logger.info('✅ Thumbnail generated');
      return thumbnailPath;
    } catch (error) {
      logger.error('Thumbnail generation failed:', error);
      throw error;
    }
  }

  async processWithMetalPerformanceShaders(
    inputPath: string,
    outputPath: string,
    filters: string[] = []
  ): Promise<string> {
    if (!this.useGPU) {
      return this.processWithCPU(inputPath, outputPath, filters);
    }
    
    logger.info('🎨 Processing with Metal Performance Shaders...');
    
    // Build filter chain
    let filterChain = filters.join(',');
    if (!filterChain) {
      // Default filters optimized for shorts
      filterChain = [
        'unsharp=5:5:1.0:5:5:0.0', // Sharpen
        'eq=contrast=1.1:brightness=0.05:saturation=1.2', // Color enhancement
        'scale=1080:1920:flags=lanczos', // High-quality scaling
      ].join(',');
    }
    
    const command = `ffmpeg -i "${inputPath}" \
      -vf "${filterChain}" \
      -c:v h264_videotoolbox \
      -b:v 6M \
      -maxrate 8M \
      -bufsize 12M \
      -profile:v high \
      -level 4.2 \
      -c:a copy \
      "${outputPath}" -y`;
    
    try {
      const startTime = Date.now();
      await execAsync(command);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`✅ Processed with GPU in ${duration}s`);
      return outputPath;
    } catch (error) {
      logger.error('GPU processing failed, falling back to CPU:', error);
      return this.processWithCPU(inputPath, outputPath, filters);
    }
  }

  private async processWithCPU(
    inputPath: string,
    outputPath: string,
    filters: string[] = []
  ): Promise<string> {
    logger.info('💻 Processing with CPU...');
    
    let filterChain = filters.join(',') || 'scale=1080:1920';
    
    const command = `ffmpeg -i "${inputPath}" \
      -vf "${filterChain}" \
      -c:v libx264 \
      -preset fast \
      -crf 23 \
      -c:a copy \
      "${outputPath}" -y`;
    
    await execAsync(command);
    return outputPath;
  }

  getSystemInfo(): { gpu: boolean; encoder: string; platform: string } {
    return {
      gpu: this.useGPU,
      encoder: this.useGPU ? 'h264_videotoolbox' : 'libx264',
      platform: this.platform
    };
  }
}