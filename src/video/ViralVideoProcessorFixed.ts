import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';
import { SyncedVideoGenerator } from './SyncedVideoGenerator';
import { DemoGenerator } from '../demo/demo-generator';
import { ViralBrollFinder } from '../services/ViralBrollFinder';

interface ViralScript {
  id: string;
  title: string;
  hook: string;
  script: string;
  duration: number;
  style: string;
  tags: string[];
  expectedViews: string;
  cta?: string;
  brollSearchTerms?: string[];
}

export class ViralVideoProcessorFixed extends EventEmitter {
  private syncedGenerator: SyncedVideoGenerator;
  private demoGenerator: DemoGenerator;
  
  constructor() {
    super();
    this.demoGenerator = new DemoGenerator();
  }

  /**
   * Process a viral script and generate a video
   */
  async processViralScript(viralScript: ViralScript): Promise<string> {
    try {
      logger.info(`🔥 Processing viral video: ${viralScript.title}`);
      
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
      
      // Create a new SyncedVideoGenerator with the correct duration and style
      this.syncedGenerator = new SyncedVideoGenerator(viralScript.duration, videoStyle);
      
      // Forward progress events
      this.syncedGenerator.on('progress', (data) => {
        this.emit('progress', data);
      });
      
      // Prepare the script in the format SyncedVideoGenerator expects
      const formattedScript = {
        hook: viralScript.hook,
        content: this.splitScriptIntoSegments(viralScript.script),
        callToAction: viralScript.cta || '',
        metadata: {
          title: viralScript.title,
          tags: viralScript.tags,
          expectedViews: viralScript.expectedViews,
          scriptId: viralScript.id,
          brollSearchTerms: viralScript.brollSearchTerms // Pass the search terms
        }
      };
      
      // Override the demo generator to use our viral script
      this.syncedGenerator['demoGen'] = {
        generateDemoIdea: async () => ({
          title: viralScript.title,
          description: viralScript.hook,
          category: viralScript.tags[0] || 'viral',
          targetAudience: 'General',
          tone: 'Engaging',
          keyPoints: []
        }),
        generateDemoScript: async () => formattedScript
      };
      
      // Override the B-roll finding method if we have custom search terms
      if (viralScript.brollSearchTerms && viralScript.brollSearchTerms.length > 0) {
        logger.info(`🔍 Using ${viralScript.brollSearchTerms.length} custom B-roll search terms`);
        
        // Monkey-patch the findBrollForScript method to use our custom terms
        const originalMethod = this.syncedGenerator['findAndDownloadBroll'];
        this.syncedGenerator['findAndDownloadBroll'] = async (syncedScript: any) => {
          logger.info('🎯 Intercepting B-roll search with custom terms...');
          
          const viralFinder = new ViralBrollFinder();
          const fullText = viralScript.hook + ' ' + viralScript.script + ' ' + (viralScript.cta || '');
          
          // Use viral finder with custom search terms
          const brollVideos = await viralFinder.findViralBroll(
            fullText,
            viralScript.duration,
            viralScript.tags,
            viralScript.brollSearchTerms
          );
          
          // Convert to relative paths for Remotion
          const brollRelativePaths = brollVideos.map(videoPath => {
            const filename = path.basename(videoPath);
            return `broll/${filename}`;
          });
          
          logger.info(`✅ Found ${brollRelativePaths.length} B-roll videos using custom terms`);
          
          // Return in the format expected
          return brollRelativePaths;
        };
      }
      
      // Generate the video using SyncedVideoGenerator
      const videoPath = await this.syncedGenerator.generateSyncedVideo();
      
      // Rename the output file to include the viral script ID
      const finalPath = path.join(
        path.dirname(videoPath),
        `viral_${viralScript.id}_${Date.now()}.mp4`
      );
      await fs.rename(videoPath, finalPath);
      
      logger.info(`✅ Viral video generated: ${finalPath}`);
      return finalPath;
      
    } catch (error) {
      logger.error('Error processing viral video:', error);
      throw error;
    }
  }
  
  /**
   * Split script into segments for better processing
   */
  private splitScriptIntoSegments(script: string): string[] {
    // Split into sentences or logical segments
    const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];
    
    // Group sentences into segments of 2-3 sentences each
    const segments: string[] = [];
    let currentSegment = '';
    let sentenceCount = 0;
    
    for (const sentence of sentences) {
      currentSegment += sentence.trim() + ' ';
      sentenceCount++;
      
      if (sentenceCount >= 2 || sentence === sentences[sentences.length - 1]) {
        segments.push(currentSegment.trim());
        currentSegment = '';
        sentenceCount = 0;
      }
    }
    
    // If we have any remaining content, add it
    if (currentSegment.trim()) {
      segments.push(currentSegment.trim());
    }
    
    return segments;
  }
}