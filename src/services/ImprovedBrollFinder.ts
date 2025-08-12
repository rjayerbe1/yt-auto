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

// Topic categories with associated search terms
const TOPIC_KEYWORDS = {
  technology: ['iphone', 'apple', 'smartphone', 'mobile', 'app', 'ios', 'tech', 'phone', 'device', 'gadget', 'screen', 'touch', 'swipe', 'digital', 'computer', 'laptop', 'coding', 'innovation'],
  food: ['cooking', 'kitchen', 'chef', 'restaurant', 'meal', 'eating', 'ingredients', 'recipe', 'food preparation', 'mcdonalds', 'burger', 'fast food'],
  business: ['office', 'meeting', 'teamwork', 'success', 'growth', 'charts', 'presentation', 'professional', 'corporate', 'money', 'hustle', 'entrepreneur'],
  lifestyle: ['home', 'family', 'relaxing', 'morning', 'routine', 'wellness', 'happiness', 'modern living', 'daily', 'life hack', 'tips', 'tricks'],
  nature: ['landscape', 'mountains', 'ocean', 'forest', 'sunset', 'sunrise', 'outdoor', 'adventure'],
  fitness: ['workout', 'gym', 'exercise', 'running', 'yoga', 'health', 'training', 'sports', 'abs', 'fitness', 'body'],
  education: ['studying', 'books', 'classroom', 'learning', 'students', 'teacher', 'school', 'knowledge'],
  travel: ['vacation', 'tourism', 'destination', 'exploring', 'journey', 'adventure', 'culture'],
  science: ['laboratory', 'research', 'experiment', 'discovery', 'microscope', 'innovation', 'medical'],
  motivation: ['success', 'achievement', 'inspiration', 'goals', 'winning', 'celebration', 'progress', 'determination']
};

// Visual mood keywords for better matches
const VISUAL_MOODS = {
  energetic: ['fast motion', 'dynamic', 'action', 'movement', 'speed'],
  calm: ['peaceful', 'serene', 'slow motion', 'relaxing', 'gentle'],
  professional: ['business', 'corporate', 'clean', 'modern', 'minimal'],
  dramatic: ['cinematic', 'epic', 'powerful', 'intense', 'dramatic lighting'],
  happy: ['bright', 'colorful', 'cheerful', 'fun', 'positive'],
  mysterious: ['dark', 'moody', 'mysterious', 'shadow', 'silhouette']
};

export class ImprovedBrollFinder {
  private pexelsApiKey: string;
  private outputDir: string;
  private downloadedCache: Map<string, string> = new Map();

  constructor() {
    this.pexelsApiKey = process.env.PEXELS_API_KEY || '';
    this.outputDir = path.join(process.cwd(), 'output', 'broll');
  }

  /**
   * Main method to find and download B-roll based on script
   */
  async findBrollForScript(scriptText: string, duration: number): Promise<string[]> {
    // 1. Analyze the script to determine topic and mood
    const analysis = this.analyzeScript(scriptText);
    logger.info(`📊 Script Analysis:`, analysis);

    // 2. Generate search queries based on analysis
    const searchQueries = this.generateSearchQueries(analysis);
    logger.info(`🔍 Search queries: ${searchQueries.join(', ')}`);

    // 3. Search for videos in parallel
    // For dynamic content, we want MORE videos with SHORTER durations
    // This creates more visual variety and engagement
    
    // Estimate based on ~2-4 seconds per B-roll change for maximum engagement
    const minChangeDuration = 2; // Minimum seconds before changing B-roll
    const maxChangeDuration = 5; // Maximum seconds before changing B-roll
    
    // Calculate needed videos for dynamic changes
    let neededVideos;
    if (duration <= 15) {
      neededVideos = 4; // Even short videos need variety (3-4 second chunks)
    } else if (duration <= 30) {
      neededVideos = 6; // 30s = 6 videos for testing (was 8)
    } else if (duration <= 60) {
      neededVideos = 10; // 60s = 10 videos for testing (was 15)
    } else {
      neededVideos = Math.min(12, Math.ceil(duration / 4)); // Cap at 12 for testing
    }
    
    // We'll download extra videos to have variety
    const extraVideos = Math.ceil(neededVideos * 0.3); // 30% extra for variety (was 50%)
    const totalVideosToDownload = Math.min(10, neededVideos + extraVideos); // Cap at 10 for testing
    
    // Each video should be at least 10 seconds so we can use different parts
    const videoDuration = 15; // Download 15-second clips for flexibility
    
    logger.info(`🔄 Searching for ${totalVideosToDownload} videos (${neededVideos} needed + ${extraVideos} extra for variety)...`);
    
    // Search all queries in parallel
    const searchPromises = searchQueries.map(query => 
      this.searchPexelsWithQuery(query).catch(err => {
        logger.error(`Search failed for "${query}":`, err);
        return [];
      })
    );
    
    const searchResults = await Promise.all(searchPromises);
    const allVideoUrls = searchResults.flat();
    
    // 4. If not enough results, add fallback searches in parallel
    if (allVideoUrls.length < totalVideosToDownload) {
      logger.info('📦 Adding fallback searches...');
      const fallbackQueries = this.getFallbackQueries(analysis.topic);
      
      const fallbackPromises = fallbackQueries.slice(0, 5).map(query =>
        this.searchPexelsWithQuery(query).catch(err => {
          logger.error(`Fallback search failed for "${query}":`, err);
          return [];
        })
      );
      
      const fallbackResults = await Promise.all(fallbackPromises);
      allVideoUrls.push(...fallbackResults.flat());
    }
    
    // 5. Remove duplicates and limit to what we need
    const uniqueUrls = [...new Set(allVideoUrls)].slice(0, totalVideosToDownload * 2); // Get extra in case some fail
    
    if (uniqueUrls.length === 0) {
      logger.warn('⚠️ No B-roll videos found from search');
      return [];
    }
    
    // 6. Download videos in parallel (with concurrency limit)
    logger.info(`⬇️ Downloading ${Math.min(uniqueUrls.length, totalVideosToDownload)} videos in parallel...`);
    
    const downloadPromises = uniqueUrls.slice(0, totalVideosToDownload).map((url, index) => 
      this.downloadAndProcessVideo(url, videoDuration)
        .then(path => {
          if (path) {
            logger.info(`✅ Downloaded video ${index + 1}/${totalVideosToDownload}`);
          }
          return path;
        })
        .catch(err => {
          logger.error(`Download failed for video ${index + 1}:`, err);
          return null;
        })
    );
    
    // Wait for all downloads to complete
    const downloadResults = await Promise.all(downloadPromises);
    
    // Filter out failed downloads
    const videos = downloadResults.filter(path => path !== null) as string[];
    
    // Return all successfully downloaded videos for maximum variety
    logger.info(`✅ Successfully downloaded ${videos.length} B-roll videos for dynamic editing`);
    return videos;
  }

  /**
   * Analyze script to extract topic, mood, and key concepts
   */
  private analyzeScript(text: string): ScriptAnalysis {
    const lowerText = text.toLowerCase();
    
    // Detect main topic
    let mainTopic = 'general';
    let maxScore = 0;
    
    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      const score = keywords.filter(kw => lowerText.includes(kw)).length;
      if (score > maxScore) {
        maxScore = score;
        mainTopic = topic;
      }
    }

    // Detect mood
    let mood = 'neutral';
    for (const [moodName, keywords] of Object.entries(VISUAL_MOODS)) {
      if (keywords.some(kw => lowerText.includes(kw))) {
        mood = moodName;
        break;
      }
    }

    // Extract key concepts (nouns and important phrases)
    const concepts = this.extractKeyConcepts(text);

    // Detect if it's a tutorial/how-to
    const isTutorial = /how to|tutorial|guide|tips|tricks|steps|learn/i.test(text);
    
    // Detect if it mentions specific items/products
    const specificItems = this.extractSpecificItems(text);

    return {
      topic: mainTopic,
      mood: mood,
      concepts: concepts,
      isTutorial: isTutorial,
      specificItems: specificItems
    };
  }

  /**
   * Extract key concepts from text (improved version)
   */
  private extractKeyConcepts(text: string): string[] {
    const concepts: string[] = [];
    
    // Look for capitalized words (proper nouns, important terms)
    const capitalizedWords = text.match(/[A-Z][a-z]+/g) || [];
    concepts.push(...capitalizedWords.filter(w => w.length > 3));

    // Look for numbers with context (e.g., "5 tips", "10 minutes")
    const numberedPhrases = text.match(/\d+\s+\w+/g) || [];
    concepts.push(...numberedPhrases);

    // Extract action words (verbs in context)
    const actionPhrases = text.match(/(learn|discover|create|build|make|improve|master|achieve|transform|unlock)\s+\w+/gi) || [];
    concepts.push(...actionPhrases);

    // Remove duplicates and clean
    return [...new Set(concepts)]
      .map(c => c.toLowerCase())
      .filter(c => c.length > 3)
      .slice(0, 5);
  }

  /**
   * Extract specific items mentioned (products, tools, etc.)
   */
  private extractSpecificItems(text: string): string[] {
    const items: string[] = [];
    
    // Common product categories
    const productPatterns = [
      /iPhone|Android|smartphone/gi,
      /laptop|computer|PC|Mac/gi,
      /microwave|oven|kitchen/gi,
      /car|vehicle|driving/gi,
      /camera|photography|video/gi
    ];

    productPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        items.push(...matches);
      }
    });

    return [...new Set(items.map(i => i.toLowerCase()))];
  }

  /**
   * Generate smart search queries based on analysis
   */
  private generateSearchQueries(analysis: ScriptAnalysis): string[] {
    const queries: string[] = [];

    // 1. Specific items queries FIRST (most important)
    if (analysis.specificItems.length > 0) {
      // For iPhone content, prioritize iPhone-specific searches
      if (analysis.specificItems.some(item => item.toLowerCase().includes('iphone'))) {
        queries.push('iphone closeup', 'iphone hand', 'using iphone', 'iphone screen', 'apple phone');
      } else if (analysis.specificItems.some(item => item.toLowerCase().includes('mcdonalds'))) {
        queries.push('mcdonalds food', 'fast food', 'burger fries', 'restaurant');
      } else {
        queries.push(...analysis.specificItems.slice(0, 3));
      }
    }

    // 2. Topic-based queries with better keywords
    if (analysis.topic === 'technology') {
      // More specific tech queries
      queries.push('smartphone', 'mobile app', 'touchscreen', 'tech gadget');
    } else if (analysis.topic === 'food') {
      queries.push('fast food', 'restaurant', 'eating', 'cooking');
    } else if (analysis.topic === 'fitness') {
      queries.push('workout', 'exercise', 'gym', 'fitness');
    } else if (analysis.topic !== 'general') {
      const topicKeywords = TOPIC_KEYWORDS[analysis.topic as keyof typeof TOPIC_KEYWORDS];
      if (topicKeywords) {
        queries.push(...topicKeywords.slice(0, 2));
      }
    }

    // 3. Tutorial-specific queries
    if (analysis.isTutorial) {
      queries.push('tutorial hands', 'demonstration', 'how to', 'tips tricks');
    }

    // 4. Mood-based queries
    if (analysis.mood !== 'neutral') {
      const moodKeywords = VISUAL_MOODS[analysis.mood as keyof typeof VISUAL_MOODS];
      if (moodKeywords) {
        queries.push(moodKeywords[0]);
      }
    }

    // 5. Concept-based queries (but more refined)
    if (analysis.concepts.length > 0) {
      // Only use concepts that make sense as visual searches
      const visualConcepts = analysis.concepts.filter(c => 
        !c.match(/^\d+/) && // Not starting with numbers
        c.length > 4 // Meaningful length
      );
      queries.push(...visualConcepts.slice(0, 2));
    }

    // Remove duplicates and limit to 12 queries for more variety
    logger.info(`🔎 Generated search queries: ${[...new Set(queries)].join(', ')}`);
    return [...new Set(queries)].slice(0, 12);
  }

  /**
   * Get fallback queries if main searches don't return enough
   */
  private getFallbackQueries(topic: string): string[] {
    const fallbacks = [
      'abstract background',
      'modern lifestyle',
      'technology background',
      'business background',
      'creative workspace',
      'minimal design'
    ];

    // Add topic-specific fallbacks
    if (topic === 'technology') {
      fallbacks.unshift('coding screen', 'digital animation');
    } else if (topic === 'business') {
      fallbacks.unshift('office space', 'corporate building');
    } else if (topic === 'lifestyle') {
      fallbacks.unshift('modern home', 'daily routine');
    }

    return fallbacks;
  }

  /**
   * Search Pexels with a specific query
   */
  private async searchPexelsWithQuery(query: string): Promise<string[]> {
    const urls: string[] = [];
    
    try {
      logger.info(`🔎 Searching Pexels for: "${query}"`);
      
      const response = await axios.get('https://api.pexels.com/videos/search', {
        headers: {
          Authorization: this.pexelsApiKey,
        },
        params: {
          query: query,
          per_page: 5,
          orientation: 'portrait',
          size: 'medium',
          min_duration: 3,
          max_duration: 30
        },
      });

      if (response.data && response.data.videos) {
        for (const video of response.data.videos as PexelsVideo[]) {
          // Find vertical or square videos that work for shorts
          const suitableVideo = video.video_files
            .filter(f => {
              const aspectRatio = f.height / f.width;
              return aspectRatio >= 1; // Vertical or square
            })
            .sort((a, b) => b.height - a.height)[0];
          
          if (suitableVideo) {
            urls.push(suitableVideo.link);
          }
        }
      }
    } catch (error) {
      logger.error(`Pexels search error for "${query}":`, error);
    }

    return urls;
  }

  /**
   * Download and process video
   */
  private async downloadAndProcessVideo(url: string, targetDuration: number): Promise<string | null> {
    // Check cache first
    if (this.downloadedCache.has(url)) {
      return this.downloadedCache.get(url)!;
    }

    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      
      const timestamp = Date.now();
      const randomId = Math.floor(Math.random() * 1000000);
      const tempFile = path.join(this.outputDir, `temp_${timestamp}_${randomId}.mp4`);
      const outputFile = path.join(this.outputDir, `broll-${timestamp}-${randomId}.mp4`);

      logger.info(`⬇️ Downloading B-roll...`);
      const response = await axios.get(url, { responseType: 'stream' });
      const writer = (await import('fs')).createWriteStream(tempFile);
      response.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Process video - trim to target duration but allow longer videos for bigger segments
      // Don't artificially limit to 10 seconds
      const maxDuration = Math.min(targetDuration, 30); // Cap at 30 seconds per B-roll
      const processCommand = `ffmpeg -i "${tempFile}" \
        -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1" \
        -t ${maxDuration} \
        -an \
        -c:v libx264 \
        -preset fast \
        -crf 23 \
        "${outputFile}" -y`;

      await execAsync(processCommand);
      await fs.unlink(tempFile);

      // Copy to public directory
      const publicBrollDir = path.join(process.cwd(), 'public', 'broll');
      await fs.mkdir(publicBrollDir, { recursive: true });
      const publicPath = path.join(publicBrollDir, path.basename(outputFile));
      
      await fs.copyFile(outputFile, publicPath);
      logger.info(`✅ B-roll processed: ${path.basename(outputFile)}`);
      
      // Cache the result
      this.downloadedCache.set(url, publicPath);
      
      return publicPath;
    } catch (error) {
      logger.error('Error downloading/processing B-roll:', error);
      return null;
    }
  }
}

interface ScriptAnalysis {
  topic: string;
  mood: string;
  concepts: string[];
  isTutorial: boolean;
  specificItems: string[];
}