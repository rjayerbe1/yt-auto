import { DemoGenerator } from './src/demo/demo-generator';
import { logger } from './src/utils/logger';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testScriptGeneration() {
  try {
    logger.info('\n🎬 Testing script generation with viral content...');
    
    const demoGen = new DemoGenerator();
    
    // Test 30-second script
    const idea = await demoGen.generateDemoIdea();
    const script = await demoGen.generateDemoScript(idea, 30);
    
    logger.info(`\n📝 Generated Script:`);
    logger.info(`Title: ${script.title}`);
    logger.info(`Hook: ${script.hook}`);
    logger.info(`Content segments: ${script.content.length}`);
    logger.info(`Call to action: ${script.callToAction}`);
    logger.info(`Total word count: ${script.wordCount}`);
    
    // Show the actual content
    logger.info(`\n📖 Content:`);
    script.content.forEach((segment: any, i: number) => {
      logger.info(`Segment ${i + 1}: ${segment.content}`);
    });
    
    logger.info(`\n✅ Script generation test complete!`);
    
  } catch (error) {
    logger.error('Error in script generation test:', error);
    process.exit(1);
  }
}

testScriptGeneration();