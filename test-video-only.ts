import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

async function testVideoOnly() {
  console.log('🎬 Regenerating video only (using existing audio and timing)...');
  
  try {
    // Check if synced-data.json exists
    const dataPath = path.join(process.cwd(), 'src', 'remotion', 'synced-data.json');
    const syncedData = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
    
    console.log(`📊 Using existing timing data: ${syncedData.totalDuration}s video`);
    
    // Check for combined audio
    const audioFiles = await fs.readdir(path.join(process.cwd(), 'output', 'audio'));
    const combinedAudio = audioFiles.find(f => f.startsWith('combined_'));
    
    if (!combinedAudio) {
      console.error('❌ No combined audio found. Run full test first.');
      process.exit(1);
    }
    
    const audioPath = path.join(process.cwd(), 'output', 'audio', combinedAudio);
    console.log(`🎵 Using existing audio: ${combinedAudio}`);
    
    // Generate video with Remotion
    console.log('🎥 Rendering video with Remotion...');
    const outputPath = path.join(process.cwd(), 'output', 'videos', `test_video_${Date.now()}.mp4`);
    
    // Bundle the Remotion project
    const bundleLocation = await bundle({
      entryPoint: path.join(process.cwd(), 'src', 'remotion', 'index.tsx'),
      webpackOverride: (config) => config,
    });

    // Get composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'WordByWordVideo',
      inputProps: syncedData,
    });

    // Calculate total frames
    const fps = 30;
    const durationInFrames = Math.ceil(syncedData.totalDuration * fps);

    // Render the video
    await renderMedia({
      composition: {
        ...composition,
        durationInFrames,
        fps,
      },
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: syncedData,
      audioCodec: null, // No audio in video
      concurrency: 4,
      imageFormat: 'jpeg',
      jpegQuality: 95,
      onProgress: ({ progress }) => {
        process.stdout.write(`\rRendering: ${Math.round(progress * 100)}%`);
      },
    });
    
    console.log('\n✅ Video rendered successfully');
    
    // Merge with existing audio
    console.log('🎬 Merging with existing audio...');
    const finalPath = path.join(process.cwd(), 'output', 'videos', `final_test_${Date.now()}.mp4`);
    
    const mergeCommand = `ffmpeg -i "${outputPath}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -ar 44100 -ac 2 -map 0:v:0 -map 1:a:0 -shortest "${finalPath}" -y`;
    
    await execAsync(mergeCommand);
    
    console.log(`✅ Final video ready: ${finalPath}`);
    
    // Clean up intermediate video
    await fs.unlink(outputPath);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testVideoOnly();