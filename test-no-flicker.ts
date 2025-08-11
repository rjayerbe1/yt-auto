import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

async function testNoFlicker() {
  console.log('🎬 Testing video without flicker...\n');
  
  try {
    // Check if synced-data.json exists
    const dataPath = path.join(process.cwd(), 'src', 'remotion', 'synced-data.json');
    const syncedData = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
    
    console.log(`📊 Using existing timing data: ${syncedData.totalDuration}s video\n`);
    
    // Check for combined audio
    const audioFiles = await fs.readdir(path.join(process.cwd(), 'output', 'audio'));
    const combinedAudio = audioFiles.find(f => f.startsWith('combined_'));
    
    if (!combinedAudio) {
      console.error('❌ No combined audio found.');
      process.exit(1);
    }
    
    const audioPath = path.join(process.cwd(), 'output', 'audio', combinedAudio);
    
    // Bundle Remotion project
    console.log('📦 Bundling...');
    const bundleLocation = await bundle({
      entryPoint: path.join(process.cwd(), 'src', 'remotion', 'index.tsx'),
      webpackOverride: (config) => config,
    });

    // Get composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'WordByWordAccumulator',
      inputProps: syncedData,
    });

    // Calculate total frames
    const fps = 30;
    const durationInFrames = Math.ceil(syncedData.totalDuration * fps);

    // Render the video
    const videoPath = path.join(process.cwd(), 'output', 'no-flicker-video.mp4');
    
    console.log('🎬 Rendering video without flicker...');
    await renderMedia({
      composition: {
        ...composition,
        durationInFrames,
        fps,
      },
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: videoPath,
      inputProps: syncedData,
      audioCodec: null,
      concurrency: 4,
      imageFormat: 'jpeg',
      jpegQuality: 95,
      onProgress: ({ progress }) => {
        process.stdout.write(`\rProgress: ${Math.round(progress * 100)}%`);
      },
    });
    
    console.log('\n✅ Video rendered');
    
    // Merge with audio
    console.log('🎬 Adding audio...');
    const finalPath = path.join(process.cwd(), 'output', 'no-flicker-final.mp4');
    
    const mergeCommand = `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -ar 44100 -ac 2 -map 0:v:0 -map 1:a:0 -shortest "${finalPath}" -y -loglevel error`;
    
    await execAsync(mergeCommand);
    
    // Delete intermediate video
    await fs.unlink(videoPath);
    
    console.log(`\n✅ Video without flicker completed!`);
    console.log(`📁 Final video: ${finalPath}\n`);
    console.log('Changes made:');
    console.log('  ✅ Removed all opacity animations');
    console.log('  ✅ Simplified transitions to only color change');
    console.log('  ✅ No scale or fade effects');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testNoFlicker();