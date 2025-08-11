import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

// Test 3 different styles with the accumulator
const testStyles = [1, 2, 3];

async function testAccumulator() {
  console.log('🎬 Testing Word Accumulator (6-word cycles, 2 lines)...\n');
  
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
    const outputDir = path.join(process.cwd(), 'output', 'accumulator-demo');
    await fs.mkdir(outputDir, { recursive: true });
    
    for (const styleNum of testStyles) {
      console.log(`\n📹 Generating Style ${styleNum}...`);
      
      // Update the style number
      const componentPath = path.join(process.cwd(), 'src', 'remotion', 'WordByWordAccumulator.tsx');
      let componentContent = await fs.readFile(componentPath, 'utf-8');
      componentContent = componentContent.replace(
        /const SELECTED_STYLE = \d+;/,
        `const SELECTED_STYLE = ${styleNum};`
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
        id: 'WordByWordAccumulator',
        inputProps: syncedData,
      });

      // Calculate total frames
      const fps = 30;
      const durationInFrames = Math.ceil(syncedData.totalDuration * fps);

      // Render the video
      const videoPath = path.join(outputDir, `accumulator-style${styleNum}-video.mp4`);
      
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
      const finalPath = path.join(outputDir, `accumulator-style${styleNum}.mp4`);
      
      const mergeCommand = `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -ar 44100 -ac 2 -map 0:v:0 -map 1:a:0 -shortest "${finalPath}" -y -loglevel error`;
      
      await execAsync(mergeCommand);
      
      // Delete intermediate video
      await fs.unlink(videoPath);
      
      console.log(`   ✅ Complete: Style ${styleNum}`);
    }
    
    console.log('\n\n🎉 Accumulator demos generated successfully!');
    console.log(`📁 Videos saved in: ${outputDir}\n`);
    console.log('Sistema de acumulador:');
    console.log('  ✅ Las palabras aparecen una por una');
    console.log('  ✅ Se acumulan hasta 6 palabras');
    console.log('  ✅ Divididas en 2 líneas (3 arriba, 3 abajo)');
    console.log('  ✅ Al llegar a la palabra 7, se borran TODAS');
    console.log('  ✅ Empieza un nuevo ciclo con la palabra 7');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAccumulator();