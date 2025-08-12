#!/usr/bin/env ts-node
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testVideoGeneration() {
  console.log('🎬 Test Video Generation - Using existing audio');
  
  try {
    // 1. Read existing synced data
    const dataPath = path.join(process.cwd(), 'src', 'remotion', 'synced-data.json');
    const syncedData = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
    
    console.log(`✅ Loaded synced data with ${syncedData.segments.length} segments`);
    console.log(`📊 Total duration: ${syncedData.totalDuration}s`);
    console.log(`🎨 Video style: ${syncedData.videoStyle}`);
    console.log(`🎬 B-roll videos: ${syncedData.brollVideos?.length || 0}`);
    
    // 2. Verify B-roll files exist
    if (syncedData.brollVideos && syncedData.brollVideos.length > 0) {
      console.log('\n📁 Checking B-roll files...');
      for (const brollPath of syncedData.brollVideos) {
        const fullPath = path.join(process.cwd(), 'public', brollPath);
        try {
          await fs.access(fullPath);
          console.log(`  ✅ ${brollPath}`);
        } catch {
          console.log(`  ❌ Missing: ${brollPath}`);
          
          // Try to find it in output/broll and copy it
          const outputPath = path.join(process.cwd(), 'output', 'broll', path.basename(brollPath));
          try {
            await fs.access(outputPath);
            await fs.copyFile(outputPath, fullPath);
            console.log(`    📋 Copied from output/broll`);
          } catch {
            console.log(`    ⚠️ Not found in output/broll either`);
          }
        }
      }
    }
    
    // 3. Bundle Remotion project
    console.log('\n📦 Bundling Remotion project...');
    const bundleLocation = await bundle({
      entryPoint: path.join(process.cwd(), 'src', 'remotion', 'index.tsx'),
      webpackOverride: (config) => config,
    });
    
    // 4. Select composition
    console.log('🎭 Selecting composition...');
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'WordByWordFinal',
      inputProps: syncedData,
    });
    
    // 5. Calculate frames
    const fps = 30;
    const durationInFrames = Math.ceil(syncedData.totalDuration * fps);
    
    console.log(`🎥 Rendering ${durationInFrames} frames at ${fps} fps...`);
    
    // 6. Render video (without audio)
    const outputPath = path.join(process.cwd(), 'output', 'videos', `test_${Date.now()}.mp4`);
    
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
    
    console.log(`\n✅ Video rendered: ${outputPath}`);
    
    // 7. Find the combined audio file
    console.log('\n🎵 Looking for combined audio...');
    const audioDir = path.join(process.cwd(), 'output', 'audio');
    const audioFiles = await fs.readdir(audioDir);
    const combinedAudio = audioFiles.find(f => f.startsWith('combined_') && f.endsWith('.wav'));
    
    if (combinedAudio) {
      const audioPath = path.join(audioDir, combinedAudio);
      console.log(`✅ Found audio: ${combinedAudio}`);
      
      // 8. Merge audio with video
      const finalPath = path.join(process.cwd(), 'output', 'videos', `test_final_${Date.now()}.mp4`);
      const mergeCommand = `ffmpeg -i "${outputPath}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -ar 44100 -ac 2 -map 0:v:0 -map 1:a:0 -shortest "${finalPath}" -y`;
      
      console.log('\n🎬 Merging audio and video...');
      await execAsync(mergeCommand);
      
      console.log(`✅ Final video with audio: ${finalPath}`);
      
      // Open the video
      console.log('\n🎥 Opening video...');
      await execAsync(`open "${finalPath}"`);
    } else {
      console.log('⚠️ No combined audio found, video has no audio');
      console.log('\n🎥 Opening video without audio...');
      await execAsync(`open "${outputPath}"`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the test
testVideoGeneration();