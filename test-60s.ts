import { SyncedVideoGenerator } from './src/video/SyncedVideoGenerator';
import { logger } from './src/utils/logger';

async function test60SecondVideo() {
  try {
    logger.info('🎬 Testing 60-second video generation...');
    
    // Create generator with 60 second duration
    const generator = new SyncedVideoGenerator(60, 1);
    
    // Generate the video
    const videoPath = await generator.generateSyncedVideo();
    
    logger.info(`✅ 60-second video generated: ${videoPath}`);
    
    // Open the video
    const { exec } = require('child_process');
    exec(`open "${videoPath}"`, (error: any) => {
      if (error) {
        logger.error('Could not open video:', error);
      }
    });
    
  } catch (error) {
    logger.error('Error generating 60-second video:', error);
    process.exit(1);
  }
}

test60SecondVideo();