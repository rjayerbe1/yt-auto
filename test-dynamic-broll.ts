import { ImprovedBrollFinder } from './src/services/ImprovedBrollFinder';
import { logger } from './src/utils/logger';
import { getViralContent } from './src/demo/viral-content';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testDynamicBroll() {
  try {
    logger.info('\n🎬 Testing DYNAMIC B-roll for 30-second video...');
    
    // Get viral content for 30s
    const viralContent = getViralContent(30);
    
    // Combine all text
    const allText = [
      viralContent.hook,
      ...viralContent.content,
      viralContent.cta || ''
    ].join(' ');
    
    logger.info(`📝 Content: ${viralContent.topic}`);
    logger.info(`⏱️ Video duration: 30 seconds`);
    
    // Create B-roll finder
    const finder = new ImprovedBrollFinder();
    
    logger.info(`\n🔍 Downloading B-roll videos with DYNAMIC strategy...`);
    const brollVideos = await finder.findBrollForScript(allText, 30);
    
    logger.info(`\n✅ Results:`);
    logger.info(`Downloaded ${brollVideos.length} B-roll videos for dynamic editing`);
    
    // Check the actual downloaded files
    if (brollVideos.length > 0) {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      logger.info(`\n📹 Video inventory for dynamic cuts:`);
      
      // Calculate ideal cut points
      const cutPattern = [2.5, 4, 3, 4.5, 2, 3.5, 5, 2.5, 3, 4];
      let totalTime = 0;
      let cutNumber = 0;
      
      logger.info(`\n🎬 Planned dynamic cuts (every 2-5 seconds):`);
      while (totalTime < 30) {
        const cutDuration = cutPattern[cutNumber % cutPattern.length];
        const videoIndex = cutNumber % brollVideos.length;
        logger.info(`  Cut ${cutNumber + 1}: ${totalTime.toFixed(1)}s - ${(totalTime + cutDuration).toFixed(1)}s (Video ${videoIndex + 1}, ${cutDuration}s)`);
        totalTime += cutDuration;
        cutNumber++;
      }
      
      logger.info(`\n📊 Summary:`);
      logger.info(`  Total cuts: ${cutNumber}`);
      logger.info(`  Average cut duration: ${(30 / cutNumber).toFixed(1)}s`);
      logger.info(`  Videos available: ${brollVideos.length}`);
    }
    
    logger.info(`\n✅ Dynamic B-roll test complete!`);
    
  } catch (error) {
    logger.error('Error in dynamic B-roll test:', error);
    process.exit(1);
  }
}

testDynamicBroll();