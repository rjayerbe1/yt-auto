import { logger } from './src/utils/logger';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testSimpleBroll() {
  try {
    logger.info('\n🎬 Testing simple B-roll dynamic cuts simulation...');
    
    const duration = 30; // 30 second video
    const videoCount = 8; // Assume we have 8 B-roll videos
    
    // Dynamic cut pattern (varied intervals)
    const cutPattern = [2.5, 4, 3, 4.5, 2, 3.5, 5, 2.5, 3, 4];
    
    logger.info(`\n📊 Dynamic B-roll Strategy:`);
    logger.info(`  Video duration: ${duration}s`);
    logger.info(`  Available B-roll videos: ${videoCount}`);
    logger.info(`  Cut pattern: ${cutPattern.join(', ')} seconds`);
    
    // Simulate the cuts
    logger.info(`\n🎬 Dynamic cuts timeline:`);
    let currentTime = 0;
    let cutNumber = 0;
    const cuts = [];
    
    while (currentTime < duration) {
      const cutDuration = cutPattern[cutNumber % cutPattern.length];
      const actualDuration = Math.min(cutDuration, duration - currentTime);
      
      // Use a shuffle pattern for video selection
      const shufflePattern = [0, 5, 2, 7, 1, 4, 6, 3];
      const videoIndex = shufflePattern[cutNumber % shufflePattern.length] % videoCount;
      
      cuts.push({
        cut: cutNumber + 1,
        start: currentTime,
        end: currentTime + actualDuration,
        duration: actualDuration,
        videoIndex: videoIndex + 1
      });
      
      logger.info(`  Cut ${cutNumber + 1}: ${currentTime.toFixed(1)}s - ${(currentTime + actualDuration).toFixed(1)}s | Video ${videoIndex + 1} | ${actualDuration.toFixed(1)}s`);
      
      currentTime += actualDuration;
      cutNumber++;
    }
    
    logger.info(`\n📈 Statistics:`);
    logger.info(`  Total cuts: ${cuts.length}`);
    logger.info(`  Average cut duration: ${(duration / cuts.length).toFixed(2)}s`);
    logger.info(`  Shortest cut: ${Math.min(...cuts.map(c => c.duration)).toFixed(1)}s`);
    logger.info(`  Longest cut: ${Math.max(...cuts.map(c => c.duration)).toFixed(1)}s`);
    
    // Count video usage
    const videoUsage = {};
    cuts.forEach(cut => {
      videoUsage[cut.videoIndex] = (videoUsage[cut.videoIndex] || 0) + 1;
    });
    
    logger.info(`\n📹 Video usage distribution:`);
    Object.entries(videoUsage).sort(([a], [b]) => Number(a) - Number(b)).forEach(([video, count]) => {
      logger.info(`  Video ${video}: ${count} times`);
    });
    
    logger.info(`\n✅ This creates a dynamic, engaging video with:`);
    logger.info(`  - Varied cut lengths (2-5 seconds)`);
    logger.info(`  - No monotonous rhythm`);
    logger.info(`  - Good video variety`);
    logger.info(`  - Professional pacing similar to viral content`);
    
  } catch (error) {
    logger.error('Error in simple B-roll test:', error);
    process.exit(1);
  }
}

testSimpleBroll();