import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

interface SceneAnalysis {
  scenes: string[];
  objects: string[];
  emotions: string[];
  locations: string[];
  actions: string[];
  searchQueries: string[];
}

export class SmartBrollAnalyzer {
  private outputDir: string;
  private pexelsApiKey: string;
  private pixabayApiKey: string;
  
  // Mapeo de conceptos a búsquedas visuales
  private conceptMappings: Record<string, string[]> = {
    // Psychology concepts
    'brain': ['neural network', 'brain scan', 'neurons firing', 'synapses', 'mind visualization'],
    'memory': ['memories fading', 'photo album', 'old photographs', 'nostalgia', 'flashback effect'],
    'psychology': ['therapy session', 'mental health', 'mindfulness', 'meditation', 'brain activity'],
    'emotional': ['facial expressions', 'tears', 'smile fading', 'emotional reactions', 'mood changes'],
    'relationship': ['couple silhouette', 'holding hands', 'breakup', 'lonely person', 'text messages'],
    'ex': ['walking away', 'deleted photos', 'empty bed', 'blocked number', 'moving boxes'],
    
    // Horror concepts
    'ghost': ['shadow figure', 'paranormal activity', 'haunted', 'spirit', 'apparition'],
    'scary': ['dark hallway', 'creepy atmosphere', 'horror scene', 'frightening', 'jumpscare'],
    'night': ['darkness', '3am clock', 'moonlight', 'nighttime', 'insomnia'],
    'hospital': ['empty corridor', 'medical equipment', 'abandoned hospital', 'emergency room', 'flickering lights'],
    'basement': ['dark stairs', 'underground', 'cellar', 'storage room', 'cobwebs'],
    'mirror': ['reflection', 'broken mirror', 'bathroom mirror', 'looking glass', 'distorted reflection'],
    'dog': ['dog barking', 'scared dog', 'pet at night', 'animal behavior', 'guard dog'],
    'room': ['empty room', 'bedroom at night', 'closed door', 'dark corner', 'abandoned room'],
    
    // Time references
    '3am': ['digital clock 3am', 'middle of night', 'witching hour', 'sleepless', 'alarm clock'],
    'midnight': ['clock striking twelve', '12am', 'midnight hour', 'late night', 'darkness falls'],
    
    // Emotions/States
    'fear': ['scared face', 'terror', 'frightened', 'panic', 'anxiety attack'],
    'alone': ['isolation', 'solitude', 'loneliness', 'empty house', 'single person'],
    'sleep': ['insomnia', 'nightmare', 'bed', 'restless', 'sleeping person'],
  };

  constructor() {
    this.outputDir = path.join(process.cwd(), 'output', 'broll');
    this.pexelsApiKey = process.env.PEXELS_API_KEY || '';
    this.pixabayApiKey = process.env.PIXABAY_API_KEY || '';
  }

  /**
   * Analyze script and find relevant B-roll
   */
  async findSmartBroll(scriptText: string, duration: number, tags: string[]): Promise<string[]> {
    logger.info('🧠 Smart B-roll Analysis Starting...');
    
    // Step 1: Analyze the script content
    const analysis = this.analyzeScript(scriptText, tags);
    logger.info(`📊 Analysis complete: ${analysis.scenes.length} scenes, ${analysis.searchQueries.length} queries`);
    
    // Step 2: Create output directory
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Step 3: Search and download relevant videos
    const videos = await this.searchAndDownload(analysis, duration);
    
    // Step 4: If not enough videos, generate abstract ones
    if (videos.length < 5) {
      const generated = await this.generateAbstractBroll(analysis, 5 - videos.length, duration / 5);
      videos.push(...generated);
    }
    
    logger.info(`✅ Smart B-roll: Found ${videos.length} relevant videos`);
    return videos;
  }

  /**
   * Analyze script to extract scenes and concepts
   */
  private analyzeScript(text: string, tags: string[]): SceneAnalysis {
    const analysis: SceneAnalysis = {
      scenes: [],
      objects: [],
      emotions: [],
      locations: [],
      actions: [],
      searchQueries: []
    };
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const words = text.toLowerCase().split(/\s+/);
    
    // Extract key concepts from each sentence
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      
      // Look for locations
      if (lowerSentence.includes('room') || lowerSentence.includes('house')) {
        analysis.locations.push('indoor residential');
        analysis.scenes.push('house interior');
      }
      if (lowerSentence.includes('hospital')) {
        analysis.locations.push('hospital');
        analysis.scenes.push('medical facility');
      }
      if (lowerSentence.includes('basement') || lowerSentence.includes('cellar')) {
        analysis.locations.push('basement');
        analysis.scenes.push('underground room');
      }
      if (lowerSentence.includes('corner') || lowerSentence.includes('wall')) {
        analysis.scenes.push('room corner');
      }
      
      // Look for time references
      if (lowerSentence.match(/\d+:\d+\s*(am|pm)?/) || lowerSentence.includes('night')) {
        analysis.scenes.push('nighttime scene');
      }
      
      // Look for objects
      if (lowerSentence.includes('mirror')) {
        analysis.objects.push('mirror');
        analysis.scenes.push('reflection scene');
      }
      if (lowerSentence.includes('door')) {
        analysis.objects.push('door');
        analysis.scenes.push('doorway');
      }
      if (lowerSentence.includes('photo')) {
        analysis.objects.push('photograph');
        analysis.scenes.push('old photos');
      }
      
      // Look for emotions/states
      if (lowerSentence.includes('scar') || lowerSentence.includes('afraid')) {
        analysis.emotions.push('fear');
        analysis.scenes.push('scary moment');
      }
      if (lowerSentence.includes('alone') || lowerSentence.includes('lonely')) {
        analysis.emotions.push('loneliness');
        analysis.scenes.push('isolation');
      }
      
      // Look for actions
      if (lowerSentence.includes('stare') || lowerSentence.includes('look')) {
        analysis.actions.push('staring');
      }
      if (lowerSentence.includes('growl') || lowerSentence.includes('bark')) {
        analysis.actions.push('aggressive behavior');
      }
    }
    
    // Generate smart search queries based on concepts found
    for (const [concept, mappings] of Object.entries(this.conceptMappings)) {
      if (text.toLowerCase().includes(concept)) {
        // Add relevant visual searches for this concept
        analysis.searchQueries.push(...mappings.slice(0, 2));
      }
    }
    
    // Add tag-based searches
    if (tags.includes('horror') || tags.includes('creepy')) {
      analysis.searchQueries.push('horror atmosphere', 'dark scene', 'creepy ambient');
    }
    if (tags.includes('psychology') || tags.includes('neuroscience')) {
      analysis.searchQueries.push('brain visualization', 'mental process', 'psychology abstract');
    }
    if (tags.includes('relationships')) {
      analysis.searchQueries.push('couple drama', 'relationship problems', 'emotional moment');
    }
    
    // Create unique search queries from analysis
    const uniqueQueries = new Set(analysis.searchQueries);
    
    // Add scene-based queries
    for (const scene of analysis.scenes.slice(0, 3)) {
      uniqueQueries.add(scene);
    }
    
    // Add location-based queries
    for (const location of analysis.locations.slice(0, 2)) {
      uniqueQueries.add(location + ' stock footage');
    }
    
    analysis.searchQueries = Array.from(uniqueQueries);
    
    return analysis;
  }

  /**
   * Search and download videos based on analysis
   */
  private async searchAndDownload(analysis: SceneAnalysis, duration: number): Promise<string[]> {
    const videos: string[] = [];
    const neededVideos = Math.max(5, Math.ceil(duration / 6));
    
    logger.info(`🔍 Searching for ${neededVideos} videos with ${analysis.searchQueries.length} queries`);
    
    // Try multiple search strategies in parallel
    const searchPromises: Promise<string | null>[] = [];
    
    for (const query of analysis.searchQueries.slice(0, neededVideos * 2)) {
      if (this.pexelsApiKey) {
        searchPromises.push(
          this.searchPexels(query, duration / neededVideos)
            .catch(err => {
              logger.debug(`Pexels search failed for "${query}":`, err);
              return null;
            })
        );
      }
      
      if (this.pixabayApiKey && searchPromises.length < neededVideos * 3) {
        searchPromises.push(
          this.searchPixabay(query, duration / neededVideos)
            .catch(err => {
              logger.debug(`Pixabay search failed for "${query}":`, err);
              return null;
            })
        );
      }
    }
    
    // Wait for all searches
    const results = await Promise.all(searchPromises);
    const validResults = results.filter(r => r !== null) as string[];
    
    // Take the needed amount
    videos.push(...validResults.slice(0, neededVideos));
    
    logger.info(`📹 Downloaded ${videos.length} relevant videos`);
    return videos;
  }

  /**
   * Search Pexels for specific content
   */
  private async searchPexels(query: string, duration: number): Promise<string | null> {
    try {
      const response = await axios.get('https://api.pexels.com/videos/search', {
        headers: {
          Authorization: this.pexelsApiKey,
        },
        params: {
          query: query,
          per_page: 1,
          orientation: 'portrait',
          size: 'medium',
          min_duration: Math.max(3, duration - 2),
          max_duration: duration + 5,
        },
        timeout: 5000,
      });

      if (response.data?.videos?.[0]) {
        const video = response.data.videos[0];
        const videoFile = video.video_files
          .filter((f: any) => f.height >= f.width) // Portrait or square
          .sort((a: any, b: any) => {
            // Prefer HD but not too large
            const aScore = Math.abs(a.height - 1920);
            const bScore = Math.abs(b.height - 1920);
            return aScore - bScore;
          })[0];
        
        if (videoFile) {
          const outputPath = path.join(
            this.outputDir,
            `pexels_${query.replace(/\s+/g, '_')}_${Date.now()}.mp4`
          );
          
          // Download video
          logger.debug(`⬇️ Downloading from Pexels: ${query}`);
          const downloadCmd = `curl -L "${videoFile.link}" -o "${outputPath}" --max-time 30`;
          await execAsync(downloadCmd);
          
          // Process to vertical if needed
          const processed = await this.ensureVerticalFormat(outputPath, duration);
          return processed;
        }
      }
    } catch (error) {
      logger.debug(`Pexels error for "${query}":`, error);
    }
    
    return null;
  }

  /**
   * Search Pixabay for specific content
   */
  private async searchPixabay(query: string, duration: number): Promise<string | null> {
    try {
      const response = await axios.get('https://pixabay.com/api/videos/', {
        params: {
          key: this.pixabayApiKey,
          q: query,
          per_page: 1,
          video_type: 'all',
          min_duration: Math.max(3, duration - 2),
          max_duration: duration + 10,
        },
        timeout: 5000,
      });

      if (response.data?.hits?.[0]) {
        const video = response.data.hits[0];
        const videoUrl = video.videos.large?.url || video.videos.medium?.url;
        
        if (videoUrl) {
          const outputPath = path.join(
            this.outputDir,
            `pixabay_${query.replace(/\s+/g, '_')}_${Date.now()}.mp4`
          );
          
          // Download video
          logger.debug(`⬇️ Downloading from Pixabay: ${query}`);
          const downloadCmd = `curl -L "${videoUrl}" -o "${outputPath}" --max-time 30`;
          await execAsync(downloadCmd);
          
          // Process to vertical if needed
          const processed = await this.ensureVerticalFormat(outputPath, duration);
          return processed;
        }
      }
    } catch (error) {
      logger.debug(`Pixabay error for "${query}":`, error);
    }
    
    return null;
  }

  /**
   * Ensure video is in vertical format
   */
  private async ensureVerticalFormat(inputPath: string, targetDuration: number): Promise<string> {
    const outputPath = inputPath.replace('.mp4', '_vertical.mp4');
    
    // Get video info
    try {
      const infoCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration -of json "${inputPath}"`;
      const { stdout } = await execAsync(infoCmd);
      const info = JSON.parse(stdout);
      const stream = info.streams[0];
      
      const width = stream.width;
      const height = stream.height;
      const duration = parseFloat(stream.duration);
      
      // Build filter based on aspect ratio
      let filter = '';
      if (width > height) {
        // Horizontal video - crop to vertical
        filter = 'scale=1920:1080,crop=1080:1920:420:0';
      } else if (width === height) {
        // Square video - add blur background
        filter = '[0:v]scale=1080:1080[scaled];[0:v]scale=1080:1920,boxblur=20[bg];[bg][scaled]overlay=(W-w)/2:(H-h)/2';
      } else {
        // Already vertical - just scale
        filter = 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2';
      }
      
      // Add duration limit if needed
      const durationOption = duration > targetDuration ? `-t ${targetDuration}` : '';
      
      const command = `ffmpeg -i "${inputPath}" -vf "${filter}" -c:v libx264 -preset fast -crf 23 ${durationOption} "${outputPath}" -y`;
      await execAsync(command);
      
      // Remove original
      await fs.unlink(inputPath);
      
      return outputPath;
    } catch (error) {
      logger.warn('Could not process video to vertical, using original');
      return inputPath;
    }
  }

  /**
   * Generate abstract B-roll when no suitable footage is found
   */
  private async generateAbstractBroll(analysis: SceneAnalysis, count: number, segmentDuration: number): Promise<string[]> {
    logger.info(`🎨 Generating ${count} abstract B-roll videos based on analysis`);
    const videos: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const outputPath = path.join(this.outputDir, `abstract_${Date.now()}_${i}.mp4`);
      
      try {
        // Choose style based on content analysis
        if (analysis.emotions.includes('fear') || analysis.searchQueries.some(q => q.includes('horror'))) {
          await this.generateDarkAbstract(outputPath, segmentDuration);
        } else if (analysis.searchQueries.some(q => q.includes('brain') || q.includes('neural'))) {
          await this.generateNeuralAbstract(outputPath, segmentDuration);
        } else if (analysis.emotions.includes('loneliness')) {
          await this.generateEmotionalAbstract(outputPath, segmentDuration);
        } else {
          await this.generateGenericAbstract(outputPath, segmentDuration);
        }
        
        videos.push(outputPath);
        logger.debug(`✅ Generated abstract video ${i + 1}/${count}`);
      } catch (error) {
        logger.error(`Failed to generate abstract video ${i + 1}:`, error);
      }
    }
    
    return videos;
  }

  private async generateDarkAbstract(output: string, duration: number): Promise<void> {
    const cmd = `ffmpeg -f lavfi -i "color=c=black:s=1080x1920:d=${duration}" \
      -filter_complex "\
        [0]noise=alls=20:allf=t+u,\
        curves=preset=darker,\
        vignette=angle=PI/3,\
        fade=in:0:30\
      " \
      -c:v libx264 -preset ultrafast -crf 23 "${output}" -y`;
    await execAsync(cmd);
  }

  private async generateNeuralAbstract(output: string, duration: number): Promise<void> {
    const cmd = `ffmpeg -f lavfi -i "life=s=1080x1920:mold=10:r=30:ratio=0.1:death_color=#00000000:life_color=#00FFFF" \
      -t ${duration} \
      -filter_complex "\
        [0]colorkey=0x000000:0.01:0.1,\
        format=yuva420p,\
        colorchannelmixer=.5:.4:.1:0:.1:.5:.4:0:.1:.4:.5:0:0:0:0:1,\
        fade=in:0:30\
      " \
      -c:v libx264 -preset ultrafast -crf 23 "${output}" -y`;
    await execAsync(cmd);
  }

  private async generateEmotionalAbstract(output: string, duration: number): Promise<void> {
    const cmd = `ffmpeg -f lavfi -i "gradients=s=1080x1920:c0=0x1e3c72:c1=0x2a5298" \
      -t ${duration} \
      -filter_complex "\
        [0]gblur=sigma=30:steps=2,\
        vignette,\
        fade=in:0:30\
      " \
      -c:v libx264 -preset ultrafast -crf 23 "${output}" -y`;
    await execAsync(cmd);
  }

  private async generateGenericAbstract(output: string, duration: number): Promise<void> {
    const cmd = `ffmpeg -f lavfi -i "testsrc2=s=1080x1920:d=${duration}" \
      -filter_complex "\
        [0]colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3:0:0:0:0:1,\
        boxblur=10:2,\
        fade=in:0:30\
      " \
      -c:v libx264 -preset ultrafast -crf 23 "${output}" -y`;
    await execAsync(cmd);
  }
}