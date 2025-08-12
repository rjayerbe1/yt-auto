#!/usr/bin/env ts-node

import { ViralVideoProcessor } from './src/video/ViralVideoProcessor';
import { logger } from './src/utils/logger';
import fs from 'fs';
import path from 'path';

/**
 * Test script to verify custom B-roll search terms functionality
 */
async function testCustomBrollTerms() {
  logger.info('🚀 Testing custom B-roll search terms feature...');
  
  // Load a script with custom B-roll terms
  const viralScriptsPath = path.join(process.cwd(), 'data', 'viral-scripts.json');
  const scriptsData = JSON.parse(fs.readFileSync(viralScriptsPath, 'utf-8'));
  
  // Get the first psychology script with custom B-roll terms
  const testScript = scriptsData.channel1_psychology[0];
  
  if (!testScript.brollSearchTerms) {
    logger.error('❌ No custom B-roll search terms found in script');
    return;
  }
  
  logger.info(`📝 Testing with script: ${testScript.title}`);
  logger.info(`🔍 Custom search terms: ${testScript.brollSearchTerms.join(', ')}`);
  
  // Create video processor
  const processor = new ViralVideoProcessor();
  
  // Set up progress listener
  processor.on('progress', (data) => {
    logger.info(`⏳ Progress: ${data.message}`, data.details || {});
  });
  
  try {
    // Process the video with custom B-roll terms
    const outputPath = await processor.processViralVideo(testScript);
    
    logger.info(`✅ Video generated successfully: ${outputPath}`);
    logger.info('✨ Custom B-roll search terms were used!');
    
  } catch (error) {
    logger.error('❌ Error testing custom B-roll:', error);
  }
}

// Run the test
if (require.main === module) {
  testCustomBrollTerms()
    .then(() => {
      logger.info('🎉 Test completed!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Fatal error:', error);
      process.exit(1);
    });
}

export { testCustomBrollTerms };