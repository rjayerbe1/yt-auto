#!/usr/bin/env ts-node

import { whisperTranscriber } from './src/services/WhisperTranscriber';
import path from 'path';
import { logger } from './src/utils/logger';

async function testWhisper() {
  try {
    logger.info('🧪 Testing Whisper transcription...');
    
    // Use the JFK sample from whisper
    const jfkPath = path.join(process.cwd(), 'whisper.cpp', 'samples', 'jfk.wav');
    
    logger.info('Testing with JFK sample audio...');
    const captions = await whisperTranscriber.transcribeWithTimestamps(jfkPath);
    
    logger.info(`\n📝 Transcription results:`);
    logger.info(`Total words: ${captions.length}`);
    
    // Show first 10 words with timings
    logger.info('\nFirst 10 words with timings:');
    captions.slice(0, 10).forEach((caption, index) => {
      logger.info(`  ${index + 1}. "${caption.text}" - ${caption.startMs}ms to ${caption.endMs}ms (confidence: ${caption.confidence?.toFixed(2) || 'N/A'})`);
    });
    
    // Test with segments
    logger.info('\n🎯 Testing segment transcription...');
    const segments = await whisperTranscriber.transcribeSegments(jfkPath);
    
    logger.info(`Total segments: ${segments.length}`);
    segments.forEach((segment, index) => {
      logger.info(`  Segment ${index + 1}: "${segment.text.substring(0, 50)}..." (${segment.start.toFixed(2)}s - ${segment.end.toFixed(2)}s)`);
    });
    
    logger.info('\n✅ Whisper test complete!');
    
  } catch (error) {
    logger.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testWhisper();