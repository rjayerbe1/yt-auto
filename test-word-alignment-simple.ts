import { whisperTranscriber } from './src/services/WhisperTranscriber';
import { ChatterboxTTS } from './src/services/ChatterboxTTS';
import fs from 'fs/promises';
import path from 'path';

/**
 * Simple test to verify word alignment with generated audio
 */
async function testWordAlignmentSimple() {
  try {
    console.log('🧪 Testing Word Alignment System (Simple)');
    console.log('=========================================\n');
    
    // Test text with potentially problematic words
    const testText = "The unconscious mind controls our emotional responses.";
    
    console.log('📝 Original Text:');
    console.log(testText);
    console.log('\n');
    
    // Generate audio for testing
    console.log('🎤 Generating test audio...');
    const audioDir = path.join(process.cwd(), 'output', 'test-alignment');
    await fs.mkdir(audioDir, { recursive: true });
    
    const audioPath = path.join(audioDir, 'test-audio.wav');
    
    // Use ChatterboxTTS to generate audio
    const tts = new ChatterboxTTS();
    const audioResult = await tts.generateSpeech(testText, 'adam');
    
    if (!audioResult.success || !audioResult.output) {
      console.error('❌ Failed to generate audio');
      return;
    }
    
    // Copy generated audio to test location
    await fs.copyFile(audioResult.output, audioPath);
    console.log(`✅ Audio generated: ${audioPath}\n`);
    
    // Test 1: Regular Whisper transcription
    console.log('Test 1: Regular Whisper Transcription');
    console.log('--------------------------------------');
    const regularCaptions = await whisperTranscriber.transcribeWithTimestamps(audioPath);
    console.log(`Words detected: ${regularCaptions.length}`);
    console.log('Words:');
    regularCaptions.forEach((caption, i) => {
      console.log(`  ${i+1}. "${caption.text}" [${caption.startMs}-${caption.endMs}ms]`);
    });
    console.log('\n');
    
    // Test 2: Aligned transcription with original text
    console.log('Test 2: Aligned Transcription (Original Text)');
    console.log('---------------------------------------------');
    const alignedCaptions = await whisperTranscriber.transcribeWithOriginalText(
      audioPath,
      testText
    );
    console.log(`Words detected: ${alignedCaptions.length}`);
    console.log('Words:');
    alignedCaptions.forEach((caption, i) => {
      console.log(`  ${i+1}. "${caption.text}" [${caption.startMs}-${caption.endMs}ms]`);
    });
    console.log('\n');
    
    // Compare results
    console.log('📊 Comparison:');
    console.log('-------------');
    console.log(`Original text words: ${testText.split(/\s+/).length}`);
    console.log(`Regular Whisper: ${regularCaptions.length} words`);
    console.log(`Aligned: ${alignedCaptions.length} words`);
    
    // Check specific problematic words
    const checkWords = ['unconscious', 'emotional'];
    console.log('\n🔍 Checking problematic words:');
    
    for (const word of checkWords) {
      const regularFound = regularCaptions.find(c => 
        c.text.toLowerCase() === word.toLowerCase()
      );
      const alignedFound = alignedCaptions.find(c => 
        c.text.toLowerCase() === word.toLowerCase()
      );
      
      console.log(`\n  "${word}":`);
      if (regularFound) {
        console.log(`    Regular: ✅ Found as single word`);
      } else {
        // Check if split
        const parts = regularCaptions.filter(c => 
          word.toLowerCase().includes(c.text.toLowerCase()) && 
          c.text.length < word.length
        );
        if (parts.length > 0) {
          console.log(`    Regular: ❌ Split into: ${parts.map(p => `"${p.text}"`).join(', ')}`);
        } else {
          console.log(`    Regular: ❌ Not found`);
        }
      }
      
      if (alignedFound) {
        console.log(`    Aligned: ✅ Found as single word`);
      } else {
        console.log(`    Aligned: ❌ Not found`);
      }
    }
    
    console.log('\n✨ Test complete!');
    
    // Save results
    const resultsPath = path.join(audioDir, 'alignment-results.json');
    await fs.writeFile(resultsPath, JSON.stringify({
      originalText: testText,
      regularCaptions,
      alignedCaptions,
      comparison: {
        originalWords: testText.split(/\s+/).length,
        regularCount: regularCaptions.length,
        alignedCount: alignedCaptions.length
      }
    }, null, 2));
    
    console.log(`💾 Results saved to: ${resultsPath}\n`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testWordAlignmentSimple().catch(console.error);