import { whisperTranscriber } from './src/services/WhisperTranscriber';
import fs from 'fs/promises';
import path from 'path';

/**
 * Test script to verify word alignment works correctly
 */
async function testWordAlignment() {
  try {
    console.log('🧪 Testing Word Alignment System');
    console.log('================================\n');
    
    // Test text with potential problematic words
    const testText = "The unconscious mind controls our emotional responses. " +
                    "Prefrontal cortex regulates decision-making. " +
                    "Neuroscience reveals how we can't ignore certain signals. " +
                    "This won't be easy, but it's worth understanding.";
    
    console.log('📝 Original Text:');
    console.log(testText);
    console.log('\n');
    
    // Find an existing audio file to test
    const audioDir = path.join(process.cwd(), 'output', 'audio');
    const audioFiles = await fs.readdir(audioDir);
    const wavFiles = audioFiles.filter(f => f.endsWith('.wav'));
    
    if (wavFiles.length === 0) {
      console.error('❌ No audio files found in output/audio/');
      console.log('Please generate a video first to create test audio files');
      return;
    }
    
    const testAudioPath = path.join(audioDir, wavFiles[0]);
    console.log(`🎵 Using audio file: ${wavFiles[0]}\n`);
    
    // Test 1: Regular Whisper transcription (might have split words)
    console.log('Test 1: Regular Whisper Transcription');
    console.log('--------------------------------------');
    const regularCaptions = await whisperTranscriber.transcribeWithTimestamps(testAudioPath);
    console.log(`Words detected: ${regularCaptions.length}`);
    console.log('First 10 words:');
    regularCaptions.slice(0, 10).forEach((caption, i) => {
      console.log(`  ${i+1}. "${caption.text}" [${caption.startMs}-${caption.endMs}ms]`);
    });
    console.log('\n');
    
    // Test 2: Aligned transcription (uses original text)
    console.log('Test 2: Aligned Transcription (with original text)');
    console.log('--------------------------------------------------');
    const alignedCaptions = await whisperTranscriber.transcribeWithOriginalText(
      testAudioPath,
      testText
    );
    console.log(`Words detected: ${alignedCaptions.length}`);
    console.log('First 10 words:');
    alignedCaptions.slice(0, 10).forEach((caption, i) => {
      console.log(`  ${i+1}. "${caption.text}" [${caption.startMs}-${caption.endMs}ms]`);
    });
    console.log('\n');
    
    // Compare results
    console.log('📊 Comparison:');
    console.log('-------------');
    console.log(`Regular: ${regularCaptions.length} words`);
    console.log(`Aligned: ${alignedCaptions.length} words`);
    
    // Check for problematic words
    const problematicWords = ['unconscious', 'emotional', 'prefrontal', 'neuroscience', "won't", "can't", "it's"];
    console.log('\n🔍 Checking problematic words:');
    
    for (const word of problematicWords) {
      const regularHas = regularCaptions.some(c => c.text.toLowerCase() === word.toLowerCase());
      const alignedHas = alignedCaptions.some(c => c.text.toLowerCase() === word.toLowerCase());
      
      // Check if word was split in regular
      const regularSplit = !regularHas && (
        (word === 'unconscious' && regularCaptions.some(c => c.text.toLowerCase() === 'un')) ||
        (word === 'emotional' && regularCaptions.some(c => c.text.toLowerCase() === 'em')) ||
        (word === 'prefrontal' && regularCaptions.some(c => c.text.toLowerCase() === 'pre'))
      );
      
      console.log(`  "${word}": Regular=${regularHas ? '✅' : regularSplit ? '❌ (split)' : '❌'}, Aligned=${alignedHas ? '✅' : '❌'}`);
    }
    
    console.log('\n✨ Test complete!');
    
    // Save results for debugging
    const resultsPath = path.join(process.cwd(), 'output', 'word-alignment-test.json');
    await fs.writeFile(resultsPath, JSON.stringify({
      originalText: testText,
      regularCaptions,
      alignedCaptions,
      comparison: {
        regularCount: regularCaptions.length,
        alignedCount: alignedCaptions.length,
        originalWordCount: testText.split(/\s+/).length
      }
    }, null, 2));
    
    console.log(`\n💾 Results saved to: ${resultsPath}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testWordAlignment().catch(console.error);