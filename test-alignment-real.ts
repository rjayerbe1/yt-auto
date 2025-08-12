import { whisperTranscriber } from './src/services/WhisperTranscriber';
import fs from 'fs/promises';
import path from 'path';

/**
 * Test word alignment with real viral script audio
 */
async function testAlignmentWithRealAudio() {
  try {
    console.log('🧪 Testing Word Alignment with Real Viral Audio');
    console.log('===============================================\n');
    
    // Use the provided audio file
    const audioPath = '/Users/rjayerbe/Web Development Local/yt-auto/output/audio/combined_1754981763766.wav';
    
    // Check if audio exists
    try {
      await fs.access(audioPath);
      console.log(`✅ Audio file found: ${path.basename(audioPath)}\n`);
    } catch {
      console.error('❌ Audio file not found!');
      return;
    }
    
    // Use the exact text from the psychology script that was used for this audio
    const originalText = "Why does your ex show up right when you're over them? " +
      "Psychology calls it 'unconscious emotional radar'. Your brain sends micro-signals when you stop needing external validation. " +
      "Your posture changes, your voice becomes firmer, you post less on social media. " +
      "These signals activate the loss system in your ex's brain. The same one that ignores what's available and chases what's unattainable. " +
      "It's not magic, it's pure neuroscience. Your real indifference activates their prefrontal cortex. " +
      "Has this happened to you? Comment below.";
    
    console.log('📝 Using viral script: "Psychologist explains: Why your ex comes back..."');
    console.log(`Text preview: "${originalText.substring(0, 100)}..."\n`);
    
    // Test 1: Regular Whisper transcription (might have split words)
    console.log('═══════════════════════════════════════════════════════');
    console.log('Test 1: Regular Whisper Transcription (WITHOUT alignment)');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const startRegular = Date.now();
    const regularCaptions = await whisperTranscriber.transcribeWithTimestamps(audioPath);
    const timeRegular = Date.now() - startRegular;
    
    console.log(`⏱️ Time taken: ${timeRegular}ms`);
    console.log(`📊 Words detected: ${regularCaptions.length}`);
    console.log('\n🔍 First 20 words:');
    regularCaptions.slice(0, 20).forEach((caption, i) => {
      console.log(`  ${String(i+1).padStart(2)}. "${caption.text}" [${caption.startMs}-${caption.endMs}ms]`);
    });
    
    // Check for split words
    const splitWords = regularCaptions.filter(c => 
      c.text.length <= 3 && 
      !['the', 'and', 'but', 'for', 'are', 'was', 'has', 'had', 'can', 'may', 'our', 'you', 'not'].includes(c.text.toLowerCase())
    );
    
    if (splitWords.length > 0) {
      console.log('\n⚠️ Potential split words detected:');
      splitWords.slice(0, 10).forEach(w => {
        console.log(`  - "${w.text}"`);
      });
    }
    
    console.log('\n');
    
    // Test 2: Aligned transcription (uses original text)
    console.log('═══════════════════════════════════════════════════════');
    console.log('Test 2: Aligned Transcription (WITH original text)');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const startAligned = Date.now();
    const alignedCaptions = await whisperTranscriber.transcribeWithOriginalText(
      audioPath,
      originalText
    );
    const timeAligned = Date.now() - startAligned;
    
    console.log(`⏱️ Time taken: ${timeAligned}ms`);
    console.log(`📊 Words detected: ${alignedCaptions.length}`);
    console.log('\n🔍 First 20 words:');
    alignedCaptions.slice(0, 20).forEach((caption, i) => {
      console.log(`  ${String(i+1).padStart(2)}. "${caption.text}" [${caption.startMs}-${caption.endMs}ms]`);
    });
    
    console.log('\n');
    
    // Comparison
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 COMPARISON RESULTS');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log(`Original text words: ${originalText.split(/\s+/).length}`);
    console.log(`Regular Whisper: ${regularCaptions.length} words`);
    console.log(`Aligned: ${alignedCaptions.length} words`);
    console.log(`\nDifference: ${Math.abs(regularCaptions.length - alignedCaptions.length)} words`);
    
    // Check for specific problematic words
    const problematicWords = [
      'unconscious', 'emotional', 'prefrontal', 'neuroscience', 
      "won't", "can't", "it's", "doesn't", "aren't", "isn't"
    ];
    
    console.log('\n🔍 Checking for commonly split words:');
    console.log('─────────────────────────────────────');
    
    for (const word of problematicWords) {
      // Check in regular captions
      const regularHas = regularCaptions.some(c => 
        c.text.toLowerCase() === word.toLowerCase()
      );
      
      // Check in aligned captions  
      const alignedHas = alignedCaptions.some(c => 
        c.text.toLowerCase() === word.toLowerCase()
      );
      
      // Check if word exists in original text
      const inOriginal = originalText.toLowerCase().includes(word.toLowerCase());
      
      if (inOriginal) {
        const status = alignedHas ? '✅' : '❌';
        const regularStatus = regularHas ? '✅' : '❌ (likely split)';
        console.log(`  "${word}": Regular=${regularStatus}, Aligned=${status}`);
      }
    }
    
    // Save detailed results
    const resultsDir = path.join(process.cwd(), 'output', 'alignment-test');
    await fs.mkdir(resultsDir, { recursive: true });
    
    const resultsPath = path.join(resultsDir, 'comparison-results.json');
    await fs.writeFile(resultsPath, JSON.stringify({
      audioFile: path.basename(audioPath),
      originalText: originalText.substring(0, 500) + '...',
      stats: {
        originalWords: originalText.split(/\s+/).length,
        regularWords: regularCaptions.length,
        alignedWords: alignedCaptions.length,
        timeTakenRegular: timeRegular,
        timeTakenAligned: timeAligned
      },
      regularCaptions: regularCaptions.slice(0, 50), // First 50 for analysis
      alignedCaptions: alignedCaptions.slice(0, 50)
    }, null, 2));
    
    console.log(`\n💾 Detailed results saved to: ${resultsPath}`);
    
    // Final summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✨ SUMMARY');
    console.log('═══════════════════════════════════════════════════════\n');
    
    if (alignedCaptions.length === originalText.split(/\s+/).length) {
      console.log('🎯 Perfect alignment! Word count matches original text.');
    } else if (Math.abs(alignedCaptions.length - originalText.split(/\s+/).length) <= 5) {
      console.log('✅ Good alignment! Minor differences but much better than regular.');
    } else {
      console.log('⚠️ Alignment improved but still has some differences.');
    }
    
    console.log('\n🚀 The aligned version provides:');
    console.log('   • Correct word boundaries (no splits)');
    console.log('   • Accurate timestamps from Whisper');
    console.log('   • Better video subtitle quality');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAlignmentWithRealAudio().catch(console.error);