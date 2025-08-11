import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

// All 30 style names for reference
const styleNames = [
  '01-KaraokeBottomBar',
  '02-TikTokStyle',
  '03-NeonGlow',
  '04-TypewriterEffect',
  '05-ComicBookStyle',
  '06-Minimalist',
  '07-InstagramStories',
  '08-YouTubeSubtitle',
  '09-GlitchEffect',
  '10-BouncingLetters',
  '11-GradientText',
  '12-Shadow3D',
  '13-OutlineOnly',
  '14-RetroWave',
  '15-BubbleStyle',
  '16-SplitColor',
  '17-MatrixStyle',
  '18-HandwrittenStyle',
  '19-FireText',
  '20-IceText',
  '21-StampEffect',
  '22-PixelatedStyle',
  '23-MetallicShine',
  '24-RainbowAnimation',
  '25-NewspaperHeadline',
  '26-EmojiBackground',
  '27-GraffitiStyle',
  '28-Glassmorphism',
  '29-SpotlightEffect',
  '30-Rotating3D',
];

async function generateAllStyles() {
  console.log('🎬 Generating 30 videos with different styles...\n');
  
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
    
    // Create styles output directory
    const stylesDir = path.join(process.cwd(), 'output', 'styles-preview');
    await fs.mkdir(stylesDir, { recursive: true });
    
    // Generate video for each style
    for (let styleNumber = 1; styleNumber <= 30; styleNumber++) {
      const styleName = styleNames[styleNumber - 1];
      console.log(`\n📹 [${styleNumber}/30] Generating style: ${styleName}`);
      
      // Update the style number in the component
      const componentPath = path.join(process.cwd(), 'src', 'remotion', 'WordByWordVideoWithStyles.tsx');
      let componentContent = await fs.readFile(componentPath, 'utf-8');
      componentContent = componentContent.replace(
        /const SELECTED_STYLE = \d+;/,
        `const SELECTED_STYLE = ${styleNumber};`
      );
      await fs.writeFile(componentPath, componentContent);
      
      // Bundle Remotion project
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
      const videoPath = path.join(stylesDir, `style-${styleName}-video.mp4`);
      
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
          process.stdout.write(`\r   Rendering: ${Math.round(progress * 100)}%`);
        },
      });
      
      console.log('\n   ✅ Video rendered');
      
      // Merge with audio
      console.log('   🎬 Adding audio...');
      const finalPath = path.join(stylesDir, `style-${styleName}.mp4`);
      
      const mergeCommand = `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -ar 44100 -ac 2 -map 0:v:0 -map 1:a:0 -shortest "${finalPath}" -y -loglevel error`;
      
      await execAsync(mergeCommand);
      
      // Delete intermediate video
      await fs.unlink(videoPath);
      
      console.log(`   ✅ Complete: ${styleName}`);
    }
    
    console.log('\n\n🎉 All 30 styles generated successfully!');
    console.log(`📁 Videos saved in: ${stylesDir}\n`);
    console.log('Videos generated:');
    styleNames.forEach((name, i) => {
      console.log(`  ${i + 1}. style-${name}.mp4`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generateAllStyles();