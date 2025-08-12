import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

interface BrollCategory {
  keywords: string[];
  searchTerms: string[];
  atmosphere: string;
  visualStyle: string;
}

export class ViralBrollFinder {
  private outputDir: string;
  private stockFootageDir: string;
  
  // Categorías específicas para cada nicho
  private psychologyBroll: BrollCategory = {
    keywords: ['brain', 'mind', 'neural', 'psychology', 'thinking', 'emotion', 'mental'],
    searchTerms: [
      'brain scan animation',
      'neural network visualization',
      'abstract mind',
      'human silhouette thinking',
      'meditation brain',
      'psychology abstract',
      'mental health visualization',
      'cognitive process',
      'consciousness abstract',
      'memory visualization'
    ],
    atmosphere: 'scientific',
    visualStyle: 'modern_abstract'
  };
  
  private horrorBroll: BrollCategory = {
    keywords: ['dark', 'scary', 'horror', 'creepy', 'shadow', 'night', 'fear'],
    searchTerms: [
      'dark corridor hospital',
      'abandoned house interior',
      'creepy basement',
      'shadow figure hallway',
      'old house at night',
      'empty room dark',
      'flickering lights horror',
      'foggy forest night',
      'abandoned hospital corridor',
      'creepy doll room'
    ],
    atmosphere: 'horror',
    visualStyle: 'dark_atmospheric'
  };
  
  private dramaBroll: BrollCategory = {
    keywords: ['relationship', 'couple', 'emotion', 'drama', 'conflict', 'love'],
    searchTerms: [
      'couple arguing silhouette',
      'person crying alone',
      'broken heart animation',
      'relationship conflict',
      'emotional breakdown',
      'couple separation',
      'loneliness portrait',
      'depression visualization',
      'anxiety abstract',
      'emotional turmoil'
    ],
    atmosphere: 'emotional',
    visualStyle: 'cinematic'
  };

  constructor() {
    this.outputDir = path.join(process.cwd(), 'output', 'broll');
    this.stockFootageDir = path.join(process.cwd(), 'assets', 'stock-footage');
  }

  /**
   * Find B-roll for viral content based on script analysis
   */
  async findViralBroll(scriptText: string, duration: number, tags: string[], customSearchTerms?: string[]): Promise<string[]> {
    logger.info('🎯 Finding viral-specific B-roll...');
    
    // Detect content type from tags and text
    const contentType = this.detectContentType(scriptText, tags);
    logger.info(`📊 Detected content type: ${contentType}`);
    
    // Get category-specific B-roll or use custom search terms
    let category = this.getCategoryBroll(contentType);
    
    // If custom search terms provided, use them instead
    if (customSearchTerms && customSearchTerms.length > 0) {
      logger.info(`🔍 Using ${customSearchTerms.length} custom search terms from script`);
      category = {
        ...category,
        searchTerms: customSearchTerms
      };
    }
    
    // Create output directory
    await fs.mkdir(this.outputDir, { recursive: true });
    
    const videos: string[] = [];
    // Calculate needed videos based on average change interval of 3.5 seconds
    // Add extra videos for variety and to ensure full coverage
    const baseNeeded = Math.ceil(duration / 3.5); // Change every ~3.5 seconds on average
    const neededVideos = Math.max(8, baseNeeded + 2); // Minimum 8, plus 2 extra for variety
    
    // 1. First try to download from Pexels if API key exists
    if (process.env.PEXELS_API_KEY) {
      logger.info(`🔍 Attempting to download ${neededVideos} B-roll videos from Pexels...`);
      const downloadedVideos = await this.downloadSpecificBroll(
        category,
        neededVideos
      );
      videos.push(...downloadedVideos);
      logger.info(`📹 Downloaded ${downloadedVideos.length} videos from Pexels`);
    }
    
    // 2. Try to use pre-downloaded stock footage if needed
    if (videos.length < neededVideos) {
      const stockVideos = await this.getStockFootage(contentType, neededVideos - videos.length);
      videos.push(...stockVideos);
    }
    
    // 3. Generate procedural videos only as last resort
    if (videos.length < neededVideos) {
      logger.info(`⚠️ Generating ${neededVideos - videos.length} procedural videos as fallback`);
      const generatedVideos = await this.generateProceduralVideos(
        category,
        neededVideos - videos.length,
        duration / neededVideos
      );
      videos.push(...generatedVideos);
    }
    
    logger.info(`✅ Found ${videos.length} B-roll videos for ${contentType} content`);
    return videos;
  }
  
  /**
   * Detect content type from script and tags
   */
  private detectContentType(text: string, tags: string[]): string {
    const lowerText = text.toLowerCase();
    const lowerTags = tags.map(t => t.toLowerCase());
    
    // Check for horror content
    if (
      lowerTags.includes('horror') ||
      lowerTags.includes('creepy') ||
      lowerTags.includes('paranormal') ||
      lowerText.includes('ghost') ||
      lowerText.includes('haunted') ||
      lowerText.includes('scary') ||
      lowerText.includes('3:33 am') ||
      lowerText.includes('night shift')
    ) {
      return 'horror';
    }
    
    // Check for psychology content
    if (
      lowerTags.includes('psychology') ||
      lowerTags.includes('neuroscience') ||
      lowerText.includes('brain') ||
      lowerText.includes('psychological') ||
      lowerText.includes('cognitive') ||
      lowerText.includes('mental')
    ) {
      return 'psychology';
    }
    
    // Check for relationship/drama content
    if (
      lowerTags.includes('relationships') ||
      lowerText.includes('ex') ||
      lowerText.includes('relationship') ||
      lowerText.includes('love') ||
      lowerText.includes('breakup')
    ) {
      return 'drama';
    }
    
    return 'general';
  }
  
  /**
   * Get category-specific B-roll configuration
   */
  private getCategoryBroll(contentType: string): BrollCategory {
    switch (contentType) {
      case 'horror':
        return this.horrorBroll;
      case 'psychology':
        return this.psychologyBroll;
      case 'drama':
        return this.dramaBroll;
      default:
        return this.psychologyBroll; // Default to psychology
    }
  }
  
  /**
   * Get pre-downloaded stock footage
   */
  private async getStockFootage(contentType: string, needed: number): Promise<string[]> {
    const stockDir = path.join(this.stockFootageDir, contentType);
    
    try {
      await fs.access(stockDir);
      const files = await fs.readdir(stockDir);
      const videoFiles = files
        .filter(f => f.endsWith('.mp4') || f.endsWith('.mov'))
        .map(f => path.join(stockDir, f));
      
      if (videoFiles.length > 0) {
        logger.info(`📦 Found ${videoFiles.length} stock footage files for ${contentType}`);
        return videoFiles.slice(0, needed);
      }
    } catch {
      logger.info(`📦 No stock footage found for ${contentType}`);
    }
    
    return [];
  }
  
  /**
   * Generate procedural videos using FFmpeg
   */
  private async generateProceduralVideos(
    category: BrollCategory,
    count: number,
    segmentDuration: number
  ): Promise<string[]> {
    logger.info(`🎨 Generating ${count} procedural B-roll videos...`);
    const videos: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const outputPath = path.join(this.outputDir, `generated_${category.atmosphere}_${Date.now()}_${i}.mp4`);
      
      try {
        if (category.atmosphere === 'horror') {
          // Generate dark, atmospheric video
          await this.generateHorrorVideo(outputPath, segmentDuration);
        } else if (category.atmosphere === 'scientific') {
          // Generate abstract neural/brain visualization
          await this.generatePsychologyVideo(outputPath, segmentDuration);
        } else {
          // Generate emotional/cinematic video
          await this.generateDramaVideo(outputPath, segmentDuration);
        }
        
        videos.push(outputPath);
        logger.info(`✅ Generated procedural video ${i + 1}/${count}`);
      } catch (error) {
        logger.error(`Failed to generate procedural video ${i + 1}:`, error);
      }
    }
    
    return videos;
  }
  
  /**
   * Generate horror-themed video
   */
  private async generateHorrorVideo(outputPath: string, duration: number): Promise<void> {
    // Dark video with subtle movement and grain
    const command = `ffmpeg -f lavfi -i "color=c=black:s=1080x1920:d=${duration}" \
      -filter_complex "\
        [0]noise=alls=20:allf=t+u,\
        fade=in:0:30,\
        vignette=PI/4,\
        colorlevels=rimin=0.0:gimin=0.0:bimin=0.0:rimax=0.1:gimax=0.1:bimax=0.1\
      " \
      -c:v libx264 -pix_fmt yuv420p -preset ultrafast "${outputPath}" -y`;
    
    await execAsync(command);
  }
  
  /**
   * Generate psychology-themed video
   */
  private async generatePsychologyVideo(outputPath: string, duration: number): Promise<void> {
    // Abstract neural network visualization
    const command = `ffmpeg -f lavfi -i "life=s=1080x1920:mold=10:r=30:ratio=0.1:death_color=#00000000:life_color=#4B0082" \
      -t ${duration} \
      -filter_complex "\
        [0]colorkey=0x000000:0.01:0.1,\
        format=yuva420p,\
        rotate=PI/4*sin(t),\
        scale=1080:1920,\
        fade=in:0:30\
      " \
      -c:v libx264 -pix_fmt yuv420p -preset ultrafast "${outputPath}" -y`;
    
    await execAsync(command);
  }
  
  /**
   * Generate drama/emotional video
   */
  private async generateDramaVideo(outputPath: string, duration: number): Promise<void> {
    // Soft gradient with slow movement
    const command = `ffmpeg -f lavfi -i "gradients=s=1080x1920:c0=0x1a1a2e:c1=0x16213e" \
      -t ${duration} \
      -filter_complex "\
        [0]fade=in:0:30,\
        gblur=sigma=50,\
        vignette\
      " \
      -c:v libx264 -pix_fmt yuv420p -preset ultrafast "${outputPath}" -y`;
    
    await execAsync(command);
  }
  
  /**
   * Download specific B-roll from APIs
   */
  private async downloadSpecificBroll(category: BrollCategory, needed: number): Promise<string[]> {
    logger.info(`⬇️ Downloading ${needed} specific B-roll videos in parallel...`);
    
    if (!process.env.PEXELS_API_KEY) {
      logger.warn('⚠️ No Pexels API key, skipping download');
      return [];
    }
    
    try {
      // Calculate how many videos per search term we need
      const videosPerTerm = Math.max(1, Math.ceil(needed / category.searchTerms.length));
      const downloadPromises: Promise<string | null>[] = [];
      
      // Create download promises for parallel execution
      for (let termIndex = 0; termIndex < category.searchTerms.length; termIndex++) {
        const searchTerm = category.searchTerms[termIndex];
        
        // Get multiple videos per term if needed
        for (let videoNum = 0; videoNum < videosPerTerm && downloadPromises.length < needed; videoNum++) {
          const promise = (async () => {
            try {
              const response = await axios.get('https://api.pexels.com/videos/search', {
                headers: {
                  Authorization: process.env.PEXELS_API_KEY,
                },
                params: {
                  query: searchTerm,
                  per_page: videosPerTerm,
                  page: videoNum + 1,
                  orientation: 'portrait',
                  size: 'medium',
                },
              });
              
              if (response.data?.videos?.[videoNum]) {
                const video = response.data.videos[videoNum];
                const videoFile = video.video_files
                  .filter((f: any) => f.height > f.width)
                  .sort((a: any, b: any) => b.height - a.height)[0];
                
                if (videoFile) {
                  const outputPath = path.join(
                    this.outputDir,
                    `${category.atmosphere}_${Date.now()}_${termIndex}_${videoNum}.mp4`
                  );
                  
                  // Download video
                  const downloadCommand = `curl -L "${videoFile.link}" -o "${outputPath}"`;
                  await execAsync(downloadCommand);
                  
                  // Process to vertical format
                  const processedPath = await this.processToVertical(outputPath);
                  
                  logger.info(`✅ Downloaded: ${searchTerm} (video ${videoNum + 1})`);
                  return processedPath;
                }
              }
              return null;
            } catch (error) {
              logger.warn(`⚠️ Failed to download ${searchTerm} (video ${videoNum + 1}):`, error);
              return null;
            }
          })();
          
          downloadPromises.push(promise);
        }
      }
      
      // Execute all downloads in parallel
      const results = await Promise.all(downloadPromises);
      
      // Filter out nulls and return successful downloads
      return results.filter((video): video is string => video !== null);
      
    } catch (error) {
      logger.error('Error downloading specific B-roll:', error);
      return [];
    }
  }
  
  /**
   * Process video to vertical format
   */
  private async processToVertical(inputPath: string): Promise<string> {
    const outputPath = inputPath.replace('.mp4', '_vertical.mp4');
    
    const command = `ffmpeg -i "${inputPath}" \
      -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" \
      -c:v libx264 -preset ultrafast \
      "${outputPath}" -y`;
    
    try {
      await execAsync(command);
      await fs.unlink(inputPath); // Remove original
      return outputPath;
    } catch {
      return inputPath; // Return original if processing fails
    }
  }
}