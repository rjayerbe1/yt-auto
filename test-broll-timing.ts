import { ImprovedBrollFinder } from './src/services/ImprovedBrollFinder';
import { logger } from './src/utils/logger';
import { getViralContent } from './src/demo/viral-content';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testBrollTiming() {
  try {
    logger.info('\n🎬 Testing B-roll timing for 30-second video...');
    
    // Get viral content for 30s
    const viralContent = getViralContent(30);
    
    // Combine all text
    const allText = [
      viralContent.hook,
      ...viralContent.content,
      viralContent.cta || ''
    ].join(' ');
    
    // Count segments (rough estimate)
    const segmentCount = allText.split(/[.!?]+/).filter(s => s.trim()).length;
    
    logger.info(`📝 Content: ${viralContent.topic}`);
    logger.info(`📊 Estimated segments: ${segmentCount}`);
    logger.info(`⏱️ Video duration: 30 seconds`);
    
    // Create B-roll finder
    const finder = new ImprovedBrollFinder();
    
    logger.info(`\n🔍 Downloading B-roll videos...`);
    const brollVideos = await finder.findBrollForScript(allText, 30);
    
    logger.info(`\n✅ Results:`);
    logger.info(`Downloaded ${brollVideos.length} B-roll videos`);
    logger.info(`Average duration per video: ${(30 / brollVideos.length).toFixed(1)} seconds`);
    
    // Check the actual downloaded files
    if (brollVideos.length > 0) {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      logger.info(`\n📹 Video durations:`);
      for (let i = 0; i < brollVideos.length; i++) {
        try {
          const { stdout } = await execAsync(
            `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${brollVideos[i]}"`
          );
          const duration = parseFloat(stdout.trim());
          logger.info(`  Video ${i + 1}: ${duration.toFixed(1)}s - ${brollVideos[i].split('/').pop()}`);
        } catch (error) {
          logger.error(`  Could not get duration for video ${i + 1}`);
        }
      }
    }
    
    logger.info(`\n✅ B-roll timing test complete!`);
    
  } catch (error) {
    logger.error('Error in B-roll timing test:', error);
    process.exit(1);
  }
}

testBrollTiming();