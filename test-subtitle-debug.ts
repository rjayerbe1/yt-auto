import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs/promises';

async function debugSubtitles() {
  console.log('🔍 Debugging subtitle generation...\n');
  
  try {
    // Read the synced data
    const dataPath = path.join(process.cwd(), 'src', 'remotion', 'synced-data.json');
    const syncedData = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
    
    console.log('📊 Synced data loaded:');
    console.log(`  - Total duration: ${syncedData.totalDuration}s`);
    console.log(`  - Segments: ${syncedData.segments.length}`);
    console.log(`  - Video style: ${syncedData.videoStyle || 'not set'}`);
    
    // Check word timings
    let totalWords = 0;
    syncedData.segments.forEach((segment: any, idx: number) => {
      const wordCount = segment.wordTimings?.length || 0;
      const captionCount = segment.captions?.length || 0;
      console.log(`  - Segment ${idx}: ${wordCount} wordTimings, ${captionCount} captions`);
      totalWords += wordCount;
    });
    console.log(`  - Total words: ${totalWords}\n`);
    
    // Print first few words with timing
    console.log('🕐 First 10 words with timing:');
    let wordIndex = 0;
    for (const segment of syncedData.segments) {
      if (segment.wordTimings) {
        for (const word of segment.wordTimings) {
          console.log(`  ${wordIndex}: "${word.word}" @ ${word.startTime.toFixed(2)}s - ${word.endTime.toFixed(2)}s`);
          wordIndex++;
          if (wordIndex >= 10) break;
        }
      }
      if (wordIndex >= 10) break;
    }
    
    // Check if audio files exist
    console.log('\n🎵 Checking audio files:');
    for (const segment of syncedData.segments) {
      const exists = await fs.access(segment.audioFile).then(() => true).catch(() => false);
      console.log(`  ${exists ? '✅' : '❌'} ${segment.audioFile}`);
    }
    
    // Bundle and render a short test
    console.log('\n🎬 Rendering 3-second test video...');
    
    const bundleLocation = await bundle({
      entryPoint: path.join(process.cwd(), 'src', 'remotion', 'index.tsx'),
      webpackOverride: (config) => config,
    });

    // Test data with only first 3 seconds
    const testData = {
      ...syncedData,
      totalDuration: 3,
      segments: syncedData.segments.filter((s: any) => s.startTime < 3),
      videoStyle: syncedData.videoStyle || 1
    };

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'WordByWordFinal',
      inputProps: testData,
    });

    const outputPath = path.join(process.cwd(), 'output', 'debug-subtitles.mp4');
    
    await renderMedia({
      composition: {
        ...composition,
        durationInFrames: 90, // 3 seconds at 30fps
        fps: 30,
      },
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: testData,
      audioCodec: null,
      concurrency: 2,
      imageFormat: 'jpeg',
      jpegQuality: 95,
      onProgress: ({ progress }) => {
        process.stdout.write(`\r  Progress: ${Math.round(progress * 100)}%`);
      },
    });
    
    console.log('\n\n✅ Debug video created: output/debug-subtitles.mp4');
    console.log('\n📝 What to check:');
    console.log('  1. Are words appearing one by one?');
    console.log('  2. Are they in 2 lines (3 words each)?');
    console.log('  3. Do they reset after 6 words?');
    console.log('  4. Is the timing correct?');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugSubtitles();