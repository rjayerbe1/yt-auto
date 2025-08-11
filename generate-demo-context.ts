import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

// Generate 5 demo videos with different styles to show the context system
const demoStyles = [
  { number: 1, name: 'KaraokeBottomBar' },
  { number: 2, name: 'TikTokStyle' },
  { number: 3, name: 'NeonGlow' },
  { number: 8, name: 'YouTubeSubtitle' },
  { number: 15, name: 'BubbleStyle' },
];

async function generateDemoVideos() {
  console.log('🎬 Generating 5 demo videos with context display...\n');
  
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
    
    // Create demo output directory
    const demoDir = path.join(process.cwd(), 'output', 'demo-context');
    await fs.mkdir(demoDir, { recursive: true });
    
    for (const style of demoStyles) {
      console.log(`\n📹 Generating demo ${style.number}: ${style.name}`);
      
      // Update the style number in the context component
      const componentPath = path.join(process.cwd(), 'src', 'remotion', 'WordByWordVideoContext.tsx');
      let componentContent = await fs.readFile(componentPath, 'utf-8');
      componentContent = componentContent.replace(
        /const SELECTED_STYLE = \d+;/,
        `const SELECTED_STYLE = ${style.number};`
      );
      await fs.writeFile(componentPath, componentContent);
      
      // Bundle Remotion project
      console.log('   📦 Bundling...');
      const bundleLocation = await bundle({
        entryPoint: path.join(process.cwd(), 'src', 'remotion', 'index.tsx'),
        webpackOverride: (config) => config,
      });

      // Get composition
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: 'WordByWordVideoContext',
        inputProps: syncedData,
      });

      // Calculate total frames
      const fps = 30;
      const durationInFrames = Math.ceil(syncedData.totalDuration * fps);

      // Render the video
      const videoPath = path.join(demoDir, `demo-${style.name}-video.mp4`);
      
      console.log('   🎬 Rendering...');
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
          process.stdout.write(`\r   Progress: ${Math.round(progress * 100)}%`);
        },
      });
      
      console.log('\n   ✅ Video rendered');
      
      // Merge with audio
      console.log('   🎬 Adding audio...');
      const finalPath = path.join(demoDir, `demo-${style.name}.mp4`);
      
      const mergeCommand = `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -ar 44100 -ac 2 -map 0:v:0 -map 1:a:0 -shortest "${finalPath}" -y -loglevel error`;
      
      await execAsync(mergeCommand);
      
      // Delete intermediate video
      await fs.unlink(videoPath);
      
      console.log(`   ✅ Complete: ${style.name}`);
    }
    
    console.log('\n\n🎉 Demo videos generated successfully!');
    console.log(`📁 Videos saved in: ${demoDir}\n`);
    console.log('Videos generated:');
    for (const style of demoStyles) {
      console.log(`  ✅ demo-${style.name}.mp4`);
    }
    console.log('\nThese videos show the context system where:');
    console.log('- The full phrase or context is visible');
    console.log('- The current word is highlighted');
    console.log('- No rapid flashing for short words');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generateDemoVideos();