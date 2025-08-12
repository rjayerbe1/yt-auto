import { SyncedVideoGenerator } from './src/video/SyncedVideoGenerator';
import { logger } from './src/utils/logger';

async function testViralContent() {
  try {
    const durations = [15, 30, 60];
    
    for (const duration of durations) {
      logger.info(`\n🎬 Testing ${duration}-second viral video...`);
      
      // Create generator with specified duration
      const generator = new SyncedVideoGenerator(duration, 1);
      
      // Generate just the script to test content
      const demoGen = (generator as any).demoGen;
      const idea = await demoGen.generateDemoIdea();
      const script = await demoGen.generateDemoScript(idea, duration);
      
      logger.info(`📝 Topic: ${script.title}`);
      logger.info(`🎯 Hook: ${script.hook}`);
      logger.info(`📊 Segments: ${script.content.length}`);
      logger.info(`🔤 Total words: ${script.wordCount}`);
      logger.info(`⏱️ Expected duration: ${duration}s`);
      logger.info(`📈 Words per second: ${(script.wordCount / duration).toFixed(1)}`);
      
      // Show first 2 segments as sample
      logger.info(`\n📖 Sample content:`);
      script.content.slice(0, 2).forEach((segment: any, i: number) => {
        logger.info(`  Segment ${i + 1}: "${segment.content.substring(0, 50)}..."`);
      });
    }
    
    logger.info('\n✅ Content generation test complete!');
    
  } catch (error) {
    logger.error('Error testing viral content:', error);
    process.exit(1);
  }
}

testViralContent();