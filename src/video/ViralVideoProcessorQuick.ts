import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';
import { SyncedVideoGeneratorQuick } from './SyncedVideoGeneratorQuick';
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

/**
 * Procesador rápido que usa audios existentes para debug
 */
export class ViralVideoProcessorQuick extends EventEmitter {
  private syncedGenerator: SyncedVideoGeneratorQuick;
  private demoGenerator: DemoGenerator;
  
  constructor() {
    super();
    this.demoGenerator = new DemoGenerator();
  }

  /**
   * Process a viral script using existing audio (for quick debugging)
   */
  async processViralScript(viralScript: ViralScript): Promise<string> {
    try {
      logger.info(`🚀 [QUICK MODE] Processing viral video: ${viralScript.title}`);
      logger.info(`   Using existing audio from output/audio/`);
      
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
      
      // Create a new SyncedVideoGeneratorQuick (que usa audios existentes)
      this.syncedGenerator = new SyncedVideoGeneratorQuick(viralScript.duration, videoStyle);
      
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
          brollSearchTerms: viralScript.brollSearchTerms
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
        logger.info(`🔍 [QUICK] Using ${viralScript.brollSearchTerms.length} custom B-roll search terms`);
        
        const originalMethod = this.syncedGenerator['findAndDownloadBroll'];
        this.syncedGenerator['findAndDownloadBroll'] = async (syncedScript: any) => {
          logger.info('🎯 [QUICK] Intercepting B-roll search with custom terms...');
          
          const viralFinder = new ViralBrollFinder();
          const fullText = viralScript.hook + ' ' + viralScript.script + ' ' + (viralScript.cta || '');
          
          const brollVideos = await viralFinder.findViralBroll(
            fullText,
            viralScript.duration,
            viralScript.tags,
            viralScript.brollSearchTerms
          );
          
          const brollRelativePaths = brollVideos.map(videoPath => {
            const filename = path.basename(videoPath);
            return `broll/${filename}`;
          });
          
          logger.info(`✅ [QUICK] Found ${brollRelativePaths.length} B-roll videos`);
          
          return brollRelativePaths;
        };
      }
      
      // Generate the video using SyncedVideoGeneratorQuick
      const videoPath = await this.syncedGenerator.generateSyncedVideo();
      
      // Rename the output file to include the viral script ID
      const finalPath = path.join(
        path.dirname(videoPath),
        `viral_quick_${viralScript.id}_${Date.now()}.mp4`
      );
      await fs.rename(videoPath, finalPath);
      
      logger.info(`✅ [QUICK] Viral video generated: ${finalPath}`);
      return finalPath;
      
    } catch (error) {
      logger.error('[QUICK] Error processing viral video:', error);
      throw error;
    }
  }
  
  /**
   * Split script into segments for better processing
   */
  private splitScriptIntoSegments(script: string): string[] {
    const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];
    
    const segments: string[] = [];
    let currentSegment = '';
    let sentenceCount = 0;
    
    for (const sentence of sentences) {
      currentSegment += sentence.trim() + ' ';
      sentenceCount++;
      
      if (sentenceCount >= 2 || sentences.indexOf(sentence) === sentences.length - 1) {
        segments.push(currentSegment.trim());
        currentSegment = '';
        sentenceCount = 0;
      }
    }
    
    return segments.filter(s => s.length > 0);
  }
}