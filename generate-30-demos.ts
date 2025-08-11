import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

// Style names for reference
const styleNames = [
  '01-CleanModern',
  '02-TikTokStyle', 
  '03-NeonCyan',
  '04-Minimal',
  '05-GradientTropical',
  '06-InstagramStories',
  '07-YouTubeClassic',
  '08-RetroWave',
  '09-MatrixGreen',
  '10-FireOrange',
  '11-IceBlue',
  '12-PurpleDream',
  '13-GoldLuxury',
  '14-PinkNeon',
  '15-OceanDeep',
  '16-Sunset',
  '17-ForestGreen',
  '18-ElectricPurple',
  '19-CoralReef',
  '20-DarkMode',
  '21-MintFresh',
  '22-CherryBlossom',
  '23-Arctic',
  '24-Lava',
  '25-Pastel',
  '26-CyberYellow',
  '27-RoyalBlue',
  '28-Vintage',
  '29-NeonGreen',
  '30-Cosmic',
];

async function generate30Demos() {
  console.log('🎬 Generating 30 demo videos with all styles...\n');
  console.log('Features: No flicker, punctuation merged, 6-word cycles\n');
  
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
    
    // Create output directory
    const outputDir = path.join(process.cwd(), 'output', '30-styles-final');
    await fs.mkdir(outputDir, { recursive: true });
    
    const successfulStyles: string[] = [];
    const failedStyles: number[] = [];
    
    // Generate videos in batches to avoid memory issues
    for (let batch = 0; batch < 6; batch++) {
      const start = batch * 5 + 1;
      const end = Math.min((batch + 1) * 5, 30);
      
      console.log(`\n🎯 Batch ${batch + 1}: Generating styles ${start}-${end}\n`);
      
      for (let styleNumber = start; styleNumber <= end; styleNumber++) {
        const styleName = styleNames[styleNumber - 1];
        console.log(`📹 [${styleNumber}/30] Generating: ${styleName}`);
        
        try {
          // Update the style number
          const componentPath = path.join(process.cwd(), 'src', 'remotion', 'WordByWordAccumulator30Styles.tsx');
          let componentContent = await fs.readFile(componentPath, 'utf-8');
          componentContent = componentContent.replace(
            /const SELECTED_STYLE = \d+;/,
            `const SELECTED_STYLE = ${styleNumber};`
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
            id: 'WordByWordAccumulator30',
            inputProps: syncedData,
          });

          // Calculate total frames
          const fps = 30;
          const durationInFrames = Math.ceil(syncedData.totalDuration * fps);

          // Render the video
          const videoPath = path.join(outputDir, `${styleName}-video.mp4`);
          
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
            concurrency: 2, // Reduced for stability
            imageFormat: 'jpeg',
            jpegQuality: 95,
            onProgress: ({ progress }) => {
              process.stdout.write(`\r   Progress: ${Math.round(progress * 100)}%`);
            },
          });
          
          console.log('\n   ✅ Video rendered');
          
          // Merge with audio
          console.log('   🎬 Adding audio...');
          const finalPath = path.join(outputDir, `${styleName}.mp4`);
          
          const mergeCommand = `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -ar 44100 -ac 2 -map 0:v:0 -map 1:a:0 -shortest "${finalPath}" -y -loglevel error`;
          
          await execAsync(mergeCommand);
          
          // Delete intermediate video
          await fs.unlink(videoPath);
          
          console.log(`   ✅ Complete: ${styleName}`);
          successfulStyles.push(styleName);
          
        } catch (error) {
          console.error(`   ❌ Failed: ${styleName}`, error);
          failedStyles.push(styleNumber);
        }
        
        // Small delay between styles
        if (styleNumber < end) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Longer delay between batches
      if (batch < 5) {
        console.log('\n⏳ Pausing before next batch...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log('\n\n🎉 Generation complete!');
    console.log(`✅ Successfully generated: ${successfulStyles.length}/30 styles`);
    
    if (failedStyles.length > 0) {
      console.log(`❌ Failed styles: ${failedStyles.join(', ')}`);
    }
    
    console.log(`\n📁 Videos saved in: ${outputDir}\n`);
    console.log('Videos generated:');
    successfulStyles.forEach(name => {
      console.log(`  ✅ ${name}.mp4`);
    });
    
    console.log('\n📋 Style descriptions:');
    console.log('  1. Clean Modern - Purple gradient with gold text');
    console.log('  2. TikTok Style - Black with white bold text');
    console.log('  3. Neon Cyan - Dark with cyan glow');
    console.log('  4. Minimal - White background, simple black text');
    console.log('  5. Gradient Tropical - Coral to teal gradient');
    console.log('  6. Instagram Stories - Instagram gradient');
    console.log('  7. YouTube Classic - Dark grey YouTube style');
    console.log('  8. Retro Wave - Purple synthwave style');
    console.log('  9. Matrix Green - Terminal green on black');
    console.log('  10. Fire Orange - Glowing orange on dark');
    console.log('  ... and 20 more unique styles!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generate30Demos();