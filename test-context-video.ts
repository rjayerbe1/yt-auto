import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

async function testContextVideo() {
  console.log('🎬 Testing video with context display...\n');
  
  try {
    // Check if synced-data.json exists
    const dataPath = path.join(process.cwd(), 'src', 'remotion', 'synced-data.json');
    const syncedData = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
    
    console.log(`📊 Using existing timing data: ${syncedData.totalDuration}s video\n`);
    
    // Check for combined audio
    const audioFiles = await fs.readdir(path.join(process.cwd(), 'output', 'audio'));
    const combinedAudio = audioFiles.find(f => f.startsWith('combined_'));
    
    if (!combinedAudio) {
      console.error('❌ No combined audio found. Run full test first.');
      process.exit(1);
    }
    
    const audioPath = path.join(process.cwd(), 'output', 'audio', combinedAudio);
    console.log(`🎵 Using existing audio: ${combinedAudio}\n`);
    
    // Bundle Remotion project
    console.log('📦 Bundling Remotion project...');
    const bundleLocation = await bundle({
      entryPoint: path.join(process.cwd(), 'src', 'remotion', 'index.tsx'),
      webpackOverride: (config) => config,
    });

    // Get composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'WordByWordVideoContext', // Using the new context version
      inputProps: syncedData,
    });

    // Calculate total frames
    const fps = 30;
    const durationInFrames = Math.ceil(syncedData.totalDuration * fps);

    // Render the video
    const videoPath = path.join(process.cwd(), 'output', 'test-context-video.mp4');
    
    console.log('🎬 Rendering video with context display...');
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
      audioCodec: null, // No audio in video
      concurrency: 4,
      imageFormat: 'jpeg',
      jpegQuality: 95,
      onProgress: ({ progress }) => {
        process.stdout.write(`\rProgress: ${Math.round(progress * 100)}%`);
      },
    });
    
    console.log('\n✅ Video rendered successfully');
    
    // Merge with audio
    console.log('🎬 Adding audio...');
    const finalPath = path.join(process.cwd(), 'output', 'test-context-final.mp4');
    
    const mergeCommand = `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -ar 44100 -ac 2 -map 0:v:0 -map 1:a:0 -shortest "${finalPath}" -y -loglevel error`;
    
    await execAsync(mergeCommand);
    
    // Delete intermediate video
    await fs.unlink(videoPath);
    
    console.log(`\n✅ Video with context display completed!`);
    console.log(`📁 Final video: ${finalPath}\n`);
    console.log('The video now shows the full phrase with the current word highlighted.');
    console.log('This prevents the rapid flashing effect when there are short words.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testContextVideo();