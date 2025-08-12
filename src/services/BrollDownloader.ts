import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  duration: number;
  video_files: Array<{
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }>;
}

interface PixabayVideo {
  id: number;
  videos: {
    large?: { url: string; width: number; height: number };
    medium?: { url: string; width: number; height: number };
    small?: { url: string; width: number; height: number };
  };
  duration: number;
}

export class BrollDownloader {
  private pexelsApiKey: string;
  private pixabayApiKey: string;
  private outputDir: string;

  constructor() {
    this.pexelsApiKey = process.env.PEXELS_API_KEY || '';
    this.pixabayApiKey = process.env.PIXABAY_API_KEY || '';
    this.outputDir = path.join(process.cwd(), 'output', 'broll');
  }

  /**
   * Download relevant B-roll videos based on the script content
   */
  async downloadBrollForScript(scriptText: string, duration: number): Promise<string[]> {
    // Extract keywords from script
    const keywords = this.extractKeywords(scriptText);
    logger.info(`🔍 Searching for B-roll with keywords: ${keywords.join(', ')}`);

    const videoUrls: string[] = [];
    const neededVideos = Math.max(3, Math.ceil(duration / 5));
    
    // Search Pexels and Pixabay in parallel
    const searchPromises: Promise<string[]>[] = [];
    
    if (this.pexelsApiKey) {
      searchPromises.push(
        this.searchPexels(keywords, duration).catch(err => {
          logger.error('Pexels search failed:', err);
          return [];
        })
      );
    }
    
    if (this.pixabayApiKey) {
      searchPromises.push(
        this.searchPixabay(keywords, duration).catch(err => {
          logger.error('Pixabay search failed:', err);
          return [];
        })
      );
    }
    
    // Wait for all searches to complete
    logger.info('🔄 Searching multiple sources in parallel...');
    const searchResults = await Promise.all(searchPromises);
    videoUrls.push(...searchResults.flat());
    
    // If no videos found, use existing
    if (videoUrls.length === 0) {
      logger.warn('⚠️ No B-roll found, using existing videos');
      const existingVideos = await this.getExistingBroll();
      return existingVideos.slice(0, neededVideos);
    }
    
    // Download all videos in parallel
    logger.info(`⬇️ Downloading ${Math.min(videoUrls.length, neededVideos)} videos in parallel...`);
    
    const downloadPromises = videoUrls.slice(0, neededVideos).map((url, index) =>
      this.downloadAndProcessVideo(url, duration / neededVideos)
        .then(path => {
          if (path) {
            logger.info(`✅ Downloaded video ${index + 1}/${neededVideos}`);
          }
          return path;
        })
        .catch(err => {
          logger.error(`Download failed for video ${index + 1}:`, err);
          return null;
        })
    );
    
    const downloadResults = await Promise.all(downloadPromises);
    const videos = downloadResults.filter(path => path !== null) as string[];
    
    logger.info(`✅ Successfully downloaded ${videos.length} B-roll videos`);
    return videos;
  }

  /**
   * Extract relevant keywords from script text
   */
  private extractKeywords(text: string): string[] {
    // Remove common words and extract meaningful keywords
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'about', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just']);
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
    
    // Get unique words and sort by frequency
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
    
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
  }

  /**
   * Search Pexels for videos
   */
  private async searchPexels(keywords: string[], duration: number): Promise<string[]> {
    const urls: string[] = [];
    
    try {
      for (const keyword of keywords.slice(0, 2)) { // Limit to 2 searches
        const response = await axios.get('https://api.pexels.com/videos/search', {
          headers: {
            Authorization: this.pexelsApiKey,
          },
          params: {
            query: keyword,
            per_page: 3,
            orientation: 'portrait', // Vertical for shorts
            size: 'medium',
          },
        });

        if (response.data && response.data.videos) {
          for (const video of response.data.videos as PexelsVideo[]) {
            // Find best quality vertical video
            const verticalVideo = video.video_files
              .filter(f => f.height > f.width) // Portrait orientation
              .sort((a, b) => b.height - a.height)[0]; // Highest quality
            
            if (verticalVideo) {
              urls.push(verticalVideo.link);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Pexels search error:', error);
    }

    return urls;
  }

  /**
   * Search Pixabay for videos
   */
  private async searchPixabay(keywords: string[], duration: number): Promise<string[]> {
    const urls: string[] = [];
    
    try {
      for (const keyword of keywords.slice(0, 2)) {
        const response = await axios.get('https://pixabay.com/api/videos/', {
          params: {
            key: this.pixabayApiKey,
            q: keyword,
            per_page: 3,
            video_type: 'all',
          },
        });

        if (response.data && response.data.hits) {
          for (const video of response.data.hits as PixabayVideo[]) {
            const videoUrl = video.videos.large?.url || video.videos.medium?.url;
            if (videoUrl) {
              urls.push(videoUrl);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Pixabay search error:', error);
    }

    return urls;
  }

  /**
   * Download and process video (crop to vertical, trim duration)
   */
  private async downloadAndProcessVideo(url: string, targetDuration: number): Promise<string | null> {
    try {
      // Create output directory
      await fs.mkdir(this.outputDir, { recursive: true });
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.floor(Math.random() * 1000000);
      const tempFile = path.join(this.outputDir, `temp_${timestamp}_${randomId}.mp4`);
      const outputFile = path.join(this.outputDir, `broll-${timestamp}-${randomId}.mp4`);

      // Download video
      logger.info(`⬇️ Downloading B-roll from: ${url.substring(0, 50)}...`);
      const response = await axios.get(url, { responseType: 'stream' });
      const writer = (await import('fs')).createWriteStream(tempFile);
      response.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Process video with ffmpeg:
      // 1. Crop to 9:16 aspect ratio (vertical)
      // 2. Scale to 1080x1920
      // 3. Trim/loop to target duration
      // 4. Remove audio
      const processCommand = `ffmpeg -i "${tempFile}" \
        -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1" \
        -t ${targetDuration} \
        -an \
        -c:v libx264 \
        -preset fast \
        -crf 23 \
        "${outputFile}" -y`;

      await execAsync(processCommand);

      // Clean up temp file
      await fs.unlink(tempFile);

      // Copy video to public/broll for Remotion to access
      // Using actual copy instead of symlink for better compatibility
      const publicBrollDir = path.join(process.cwd(), 'public', 'broll');
      await fs.mkdir(publicBrollDir, { recursive: true });
      const publicPath = path.join(publicBrollDir, path.basename(outputFile));
      
      try {
        // Copy the file to public directory
        await fs.copyFile(outputFile, publicPath);
        logger.info(`📁 Copied to public: ${path.basename(outputFile)}`);
        
        // Return the public path for Remotion to use
        return publicPath;
      } catch (error) {
        logger.warn(`Could not copy to public: ${error}`);
        return outputFile;
      }

    } catch (error) {
      logger.error('Error downloading/processing B-roll:', error);
      return null;
    }
  }

  /**
   * Get existing B-roll videos
   */
  private async getExistingBroll(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.outputDir);
      return files
        .filter(f => f.startsWith('broll-') && f.endsWith('.mp4'))
        .map(f => path.join(this.outputDir, f));
    } catch {
      return [];
    }
  }

  /**
   * Create a looped version of video for longer duration
   */
  async loopVideo(videoPath: string, targetDuration: number): Promise<string> {
    const outputPath = videoPath.replace('.mp4', '_looped.mp4');
    
    // Get video duration
    const durationCommand = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
    const videoDuration = parseFloat(await execAsync(durationCommand));
    
    if (videoDuration >= targetDuration) {
      // Video is long enough, just trim it
      await execAsync(`ffmpeg -i "${videoPath}" -t ${targetDuration} -c copy "${outputPath}" -y`);
    } else {
      // Loop video to reach target duration
      const loops = Math.ceil(targetDuration / videoDuration);
      const loopFilter = `loop=${loops}:size=1:start=0`;
      await execAsync(`ffmpeg -stream_loop ${loops} -i "${videoPath}" -t ${targetDuration} -c:v libx264 -preset fast "${outputPath}" -y`);
    }
    
    return outputPath;
  }
}