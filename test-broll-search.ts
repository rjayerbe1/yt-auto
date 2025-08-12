import { ImprovedBrollFinder } from './src/services/ImprovedBrollFinder';
import { logger } from './src/utils/logger';
import { getViralContent } from './src/demo/viral-content';

async function testBrollSearch() {
  try {
    // Test with 30-second iPhone content specifically
    logger.info(`\n🎬 Testing B-roll search for 30-second iPhone video...`);
    
    // Get viral content for 30s - should get iPhone content
    const viralContent = getViralContent(30);
    
    // Combine all text like the video generator does
    const allText = [
      viralContent.hook,
      ...viralContent.content,
      viralContent.cta || ''
    ].join(' ');
    
    logger.info(`📝 Content topic: ${viralContent.topic}`);
    logger.info(`🎯 Hook: ${viralContent.hook}`);
    logger.info(`📖 First segment: ${viralContent.content[0]}`);
    logger.info(`🔤 Full text for B-roll analysis:`);
    logger.info(`   "${allText}"`);
    
    // Create B-roll finder and search
    const finder = new ImprovedBrollFinder();
    
    logger.info(`\n🔍 Starting B-roll search...`);
    const brollVideos = await finder.findBrollForScript(allText, 30);
    
    logger.info(`\n✅ Found ${brollVideos.length} B-roll videos`);
    
    // Show the video paths (just filenames)
    brollVideos.forEach((video, index) => {
      const filename = video.split('/').pop();
      logger.info(`  ${index + 1}. ${filename}`);
    });
    
    logger.info('\n✅ B-roll search test complete!');
    
  } catch (error) {
    logger.error('Error testing B-roll search:', error);
    process.exit(1);
  }
}

testBrollSearch();