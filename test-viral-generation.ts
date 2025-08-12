import { ViralVideoProcessor } from './src/video/ViralVideoProcessor';
import fs from 'fs/promises';
import path from 'path';

/**
 * Test viral video generation with the new word alignment system
 */
async function testViralGeneration() {
  try {
    console.log('🚀 Testing Viral Video Generation with Word Alignment');
    console.log('=====================================================\n');
    
    // Load the psychology script
    const viralScriptsPath = path.join(process.cwd(), 'data', 'viral-scripts.json');
    const viralData = JSON.parse(await fs.readFile(viralScriptsPath, 'utf-8'));
    const psychScript = viralData.channel1_psychology[0]; // The "ex comes back" script
    
    console.log('📝 Using script:', psychScript.title);
    console.log('Duration:', psychScript.duration, 'seconds');
    console.log('Style:', psychScript.style);
    console.log('\nText preview:');
    console.log(`Hook: "${psychScript.hook}"`);
    console.log(`Script: "${psychScript.script.substring(0, 100)}..."\n`);
    
    // Create processor
    const processor = new ViralVideoProcessor();
    
    // Listen for progress events
    processor.on('progress', (data) => {
      console.log(`📊 Progress: ${data.stage} - ${data.message}`);
    });
    
    console.log('🎬 Starting video generation...');
    console.log('This will:');
    console.log('1. Generate audio with TTS');
    console.log('2. Transcribe with Whisper');
    console.log('3. Align original text with timestamps');
    console.log('4. Generate video with proper word animations\n');
    
    const startTime = Date.now();
    
    // Process the script
    const videoPath = await processor.processViralScript(psychScript);
    
    const totalTime = Date.now() - startTime;
    
    console.log('\n✅ Video generated successfully!');
    console.log(`📍 Output: ${videoPath}`);
    console.log(`⏱️ Total time: ${(totalTime / 1000).toFixed(1)} seconds`);
    
    // Check the synced data to verify word alignment
    const syncedDataPath = path.join(process.cwd(), 'src', 'remotion', 'synced-data.json');
    const syncedData = JSON.parse(await fs.readFile(syncedDataPath, 'utf-8'));
    
    console.log('\n📊 Word Alignment Results:');
    console.log(`Total words in video: ${syncedData.wordTimings.length}`);
    
    // Check for problematic words that should NOT be split
    const problematicWords = ['unconscious', 'emotional', 'prefrontal', 'neuroscience'];
    console.log('\n🔍 Checking critical words:');
    
    for (const word of problematicWords) {
      const found = syncedData.wordTimings.find((w: any) => 
        w.word.toLowerCase() === word.toLowerCase()
      );
      
      if (found) {
        console.log(`✅ "${word}" - Found as complete word at ${found.startTime.toFixed(2)}s`);
      } else {
        // Check if it's in the script at all
        const inScript = psychScript.script.toLowerCase().includes(word.toLowerCase());
        if (inScript) {
          console.log(`❌ "${word}" - Not found (might be split)`);
        } else {
          console.log(`⚠️ "${word}" - Not in this script`);
        }
      }
    }
    
    console.log('\n✨ Test complete!');
    console.log('\nNext steps:');
    console.log('1. Preview the video to check word animations');
    console.log('2. Verify no words are incorrectly split');
    console.log('3. Confirm timing is accurate');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testViralGeneration().catch(console.error);