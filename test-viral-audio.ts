import { ViralVideoProcessor } from './src/video/ViralVideoProcessor';
import { logger } from './src/utils/logger';

async function testViralAudio() {
  console.log('🧪 Testing viral audio generation...\n');
  
  // Create a simple test script
  const testScript = {
    id: 'test_001',
    title: 'Test Viral Script',
    hook: 'This is a test hook',
    script: 'Este es un script de prueba para verificar que el audio se genera correctamente. Debería funcionar sin problemas y generar múltiples segmentos de audio.',
    duration: 15,
    style: 'neon_cyberpunk',
    tags: ['test'],
    expectedViews: '100K-200K'
  };
  
  console.log('📝 Test script:', testScript);
  
  try {
    // Create processor
    const processor = new ViralVideoProcessor();
    
    // Listen for progress
    processor.on('progress', (data) => {
      console.log(`[${data.progress}%] ${data.message}`);
      if (data.details) {
        console.log('  Details:', data.details);
      }
    });
    
    // Process the script
    console.log('\n🚀 Starting processing...\n');
    const videoPath = await processor.processViralScript(testScript);
    
    console.log('\n✅ Success! Video generated at:', videoPath);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    logger.error('Test failed:', error);
  }
}

// Run the test
testViralAudio().catch(console.error);