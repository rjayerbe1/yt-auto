#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execAsync = promisify(exec);

async function testWhisper() {
  try {
    console.log('🧪 Testing Whisper transcription...');
    
    const whisperPath = path.join(process.cwd(), 'whisper.cpp', 'build', 'bin', 'whisper-cli');
    const modelPath = path.join(process.cwd(), 'whisper.cpp', 'models', 'ggml-base.bin');
    const jfkPath = path.join(process.cwd(), 'whisper.cpp', 'samples', 'jfk.wav');
    
    // Check files exist
    try {
      await fs.access(whisperPath);
      console.log('✅ Whisper binary found');
    } catch {
      console.error('❌ Whisper binary not found at:', whisperPath);
      process.exit(1);
    }
    
    try {
      await fs.access(modelPath);
      console.log('✅ Model found');
    } catch {
      console.error('❌ Model not found at:', modelPath);
      process.exit(1);
    }
    
    try {
      await fs.access(jfkPath);
      console.log('✅ Audio file found');
    } catch {
      console.error('❌ Audio file not found at:', jfkPath);
      process.exit(1);
    }
    
    // Run whisper with word-level timestamps
    const outputPath = '/tmp/test-whisper';
    const command = `"${whisperPath}" \
      --model "${modelPath}" \
      --file "${jfkPath}" \
      --output-json \
      --output-file "${outputPath}" \
      --max-len 1 \
      --language en \
      --print-progress`;
    
    console.log('\n🎙️ Running Whisper...');
    console.log('Command:', command);
    
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 1024 * 1024 * 10,
    });
    
    // Read the JSON output
    const jsonPath = `${outputPath}.json`;
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const whisperOutput = JSON.parse(jsonContent);
    
    console.log('\n📝 Transcription results:');
    console.log('Text:', whisperOutput.text);
    console.log('Language:', whisperOutput.language);
    console.log('Duration:', whisperOutput.duration, 'seconds');
    console.log('Segments:', whisperOutput.segments.length);
    
    // Show word timings
    console.log('\n⏱️ Word timings:');
    for (const segment of whisperOutput.segments.slice(0, 3)) {
      console.log(`\nSegment: "${segment.text}"`);
      console.log(`  Time: ${segment.start.toFixed(2)}s - ${segment.end.toFixed(2)}s`);
      
      if (segment.words) {
        console.log('  Words:');
        for (const word of segment.words) {
          console.log(`    "${word.word}" - ${word.start.toFixed(2)}s to ${word.end.toFixed(2)}s (confidence: ${word.probability.toFixed(2)})`);
        }
      }
    }
    
    // Clean up
    await fs.unlink(jsonPath).catch(() => {});
    
    console.log('\n✅ Test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testWhisper();