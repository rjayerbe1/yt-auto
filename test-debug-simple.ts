import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs/promises';

async function testDebugVideo() {
  console.log('🔍 Testing debug video...\n');
  
  try {
    // Read the synced data
    const dataPath = path.join(process.cwd(), 'src', 'remotion', 'synced-data.json');
    const syncedData = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
    
    console.log('📊 Data loaded');
    console.log(`  Total duration: ${syncedData.totalDuration}s`);
    console.log(`  Total segments: ${syncedData.segments.length}`);
    
    // Bundle
    console.log('\n📦 Bundling...');
    const bundleLocation = await bundle({
      entryPoint: path.join(process.cwd(), 'src', 'remotion', 'index.tsx'),
      webpackOverride: (config) => config,
    });

    // Debug composition
    console.log('🎬 Rendering debug video...');
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'DebugSubtitles',
      inputProps: syncedData,
    });

    const outputPath = path.join(process.cwd(), 'output', 'debug-test.mp4');
    
    await renderMedia({
      composition: {
        ...composition,
        durationInFrames: 150, // 5 seconds at 30fps
        fps: 30,
      },
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: syncedData,
      audioCodec: null,
      concurrency: 2,
      imageFormat: 'jpeg',
      jpegQuality: 95,
      onProgress: ({ progress }) => {
        process.stdout.write(`\rProgress: ${Math.round(progress * 100)}%`);
      },
    });
    
    console.log('\n✅ Debug video created: output/debug-test.mp4');
    
    // Now test the actual WordByWordFinal
    console.log('\n🎬 Rendering actual subtitle video...');
    const finalComposition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'WordByWordFinal',
      inputProps: syncedData,
    });

    const finalPath = path.join(process.cwd(), 'output', 'subtitle-test.mp4');
    
    await renderMedia({
      composition: {
        ...finalComposition,
        durationInFrames: 150, // 5 seconds at 30fps
        fps: 30,
      },
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: finalPath,
      inputProps: syncedData,
      audioCodec: null,
      concurrency: 2,
      imageFormat: 'jpeg',
      jpegQuality: 95,
      onProgress: ({ progress }) => {
        process.stdout.write(`\rProgress: ${Math.round(progress * 100)}%`);
      },
    });
    
    console.log('\n✅ Subtitle video created: output/subtitle-test.mp4');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testDebugVideo();