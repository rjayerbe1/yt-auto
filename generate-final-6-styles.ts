import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

// The 6 selected styles
const finalStyles = [
  { number: 1, name: '01-CleanModern', description: 'Purple gradient with gold text' },
  { number: 2, name: '02-Minimal', description: 'White background, black text' },
  { number: 3, name: '03-GradientTropical', description: 'Coral to teal gradient' },
  { number: 4, name: '04-MatrixGreen', description: 'Terminal green on black' },
  { number: 5, name: '05-GoldLuxury', description: 'Dark gradient with gold text' },
  { number: 6, name: '06-CherryBlossom', description: 'Soft peach gradient with red text' },
];

async function generateFinal6Styles() {
  console.log('🎬 Generating 6 final styles with closer lines...\n');
  console.log('Selected styles based on your preferences:\n');
  finalStyles.forEach(s => {
    console.log(`  ${s.number}. ${s.name} - ${s.description}`);
  });
  console.log('\nFeatures:');
  console.log('  ✅ Lines closer together (20px gap instead of 40px)');
  console.log('  ✅ No flicker or bounce effects');
  console.log('  ✅ Punctuation merged with words');
  console.log('  ✅ 6-word cycles (3 top, 3 bottom)\n');
  
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
    const outputDir = path.join(process.cwd(), 'output', 'final-6-styles');
    await fs.mkdir(outputDir, { recursive: true });
    
    for (const style of finalStyles) {
      console.log(`\n📹 Generating style ${style.number}: ${style.name}`);
      console.log(`   ${style.description}`);
      
      // Update the style number
      const componentPath = path.join(process.cwd(), 'src', 'remotion', 'WordByWordFinalStyles.tsx');
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
        id: 'WordByWordFinal',
        inputProps: syncedData,
      });

      // Calculate total frames
      const fps = 30;
      const durationInFrames = Math.ceil(syncedData.totalDuration * fps);

      // Render the video
      const videoPath = path.join(outputDir, `${style.name}-video.mp4`);
      
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
      const finalPath = path.join(outputDir, `${style.name}.mp4`);
      
      const mergeCommand = `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -ar 44100 -ac 2 -map 0:v:0 -map 1:a:0 -shortest "${finalPath}" -y -loglevel error`;
      
      await execAsync(mergeCommand);
      
      // Delete intermediate video
      await fs.unlink(videoPath);
      
      console.log(`   ✅ Complete: ${style.name}`);
    }
    
    console.log('\n\n🎉 Final 6 styles generated successfully!');
    console.log(`📁 Videos saved in: ${outputDir}\n`);
    console.log('Videos generated:');
    finalStyles.forEach(style => {
      console.log(`  ✅ ${style.name}.mp4 - ${style.description}`);
    });
    console.log('\n💡 These are your final style options for video generation!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generateFinal6Styles();