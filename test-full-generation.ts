import { SyncedVideoGenerator } from './src/video/SyncedVideoGenerator';
import { logger } from './src/utils/logger';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testFullGeneration() {
  try {
    logger.info('\n🎬 Testing complete 30-second video generation with viral content...');
    
    // Create generator with 30 second duration and style 1
    const generator = new SyncedVideoGenerator(30, 1);
    
    // Generate the video
    generator.on('progress', (data) => {
      logger.info(`Progress: Step ${data.step}/${data.totalSteps} - ${data.message}`);
    });
    
    const videoPath = await generator.generateSyncedVideo();
    
    logger.info(`\n✅ Video generation complete!`);
    logger.info(`📹 Video saved to: ${videoPath}`);
    
  } catch (error) {
    logger.error('Error in full generation test:', error);
    process.exit(1);
  }
}

testFullGeneration();