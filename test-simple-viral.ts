#!/usr/bin/env ts-node

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ViralBrollFinder } from './src/services/ViralBrollFinder';

const execAsync = promisify(exec);

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

async function testSimpleViral() {
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}🎬 GENERACIÓN SIMPLE CON AUDIOS EXISTENTES${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

  try {
    // 1. Cargar el script viral
    const scriptsPath = path.join(process.cwd(), 'data', 'viral-scripts.json');
    const scriptsData = JSON.parse(await fs.readFile(scriptsPath, 'utf-8'));
    const viralScript = scriptsData.channel1_psychology[0];
    
    console.log(`${colors.green}✅ Script: ${viralScript.title}${colors.reset}`);
    console.log(`   Duración: ${viralScript.duration}s`);
    
    // 2. Verificar audio existente
    const audioDir = path.join(process.cwd(), 'output', 'audio');
    const audioFiles = await fs.readdir(audioDir);
    const combinedAudio = audioFiles.find(f => f.includes('combined') && f.endsWith('.wav'));
    
    if (!combinedAudio) {
      console.log(`${colors.red}❌ No se encontró audio combinado${colors.reset}`);
      return;
    }
    
    const audioPath = path.join(audioDir, combinedAudio);
    console.log(`${colors.green}✅ Audio: ${combinedAudio}${colors.reset}`);
    
    // 3. Buscar/descargar B-roll
    console.log(`\n${colors.yellow}🔍 Buscando B-roll...${colors.reset}`);
    const viralFinder = new ViralBrollFinder();
    const fullText = viralScript.hook + ' ' + viralScript.script + ' ' + (viralScript.cta || '');
    
    const brollVideos = await viralFinder.findViralBroll(
      fullText,
      viralScript.duration,
      viralScript.tags,
      viralScript.brollSearchTerms
    );
    
    console.log(`${colors.green}✅ B-roll encontrados: ${brollVideos.length} videos${colors.reset}`);
    
    // 4. Copiar B-roll a public
    const publicBrollDir = path.join(process.cwd(), 'public', 'broll');
    await fs.mkdir(publicBrollDir, { recursive: true });
    
    // Limpiar archivos antiguos
    const existingFiles = await fs.readdir(publicBrollDir).catch(() => []);
    for (const file of existingFiles) {
      await fs.unlink(path.join(publicBrollDir, file)).catch(() => {});
    }
    
    // Copiar nuevos
    const brollPaths = [];
    for (const video of brollVideos) {
      const filename = path.basename(video);
      const destPath = path.join(publicBrollDir, filename);
      await fs.copyFile(video, destPath);
      brollPaths.push(`/broll/${filename}`);
    }
    
    // 5. Crear datos de sincronización desde los JSONs existentes
    console.log(`\n${colors.yellow}📝 Creando datos de sincronización...${colors.reset}`);
    
    const segmentFiles = ['hook', 'segment_0', 'segment_1', 'segment_2', 'segment_3', 'segment_4', 'cta'];
    let currentTime = 0;
    const allWords = [];
    
    for (const segmentFile of segmentFiles) {
      const jsonPath = path.join(audioDir, `${segmentFile}.json`);
      
      try {
        const content = await fs.readFile(jsonPath, 'utf-8');
        const data = JSON.parse(content);
        
        if (data.transcription && Array.isArray(data.transcription)) {
          for (const segment of data.transcription) {
            if (segment.text && segment.text.trim()) {
              const word = segment.text.trim();
              const startTime = parseTimestamp(segment.timestamps.from);
              const endTime = parseTimestamp(segment.timestamps.to);
              
              allWords.push({
                word: word,
                start: startTime + currentTime,
                end: endTime + currentTime,
                confidence: 1.0
              });
            }
          }
          
          // Actualizar tiempo actual
          if (data.transcription.length > 0) {
            const lastSegment = data.transcription[data.transcription.length - 1];
            const lastTime = parseTimestamp(lastSegment.timestamps.to);
            currentTime = Math.max(currentTime, lastTime);
          }
        }
      } catch (error) {
        console.log(`${colors.yellow}   No se pudo leer ${segmentFile}.json${colors.reset}`);
      }
    }
    
    console.log(`${colors.green}✅ Palabras sincronizadas: ${allWords.length}${colors.reset}`);
    
    // 6. Guardar datos para Remotion
    const syncedData = {
      title: viralScript.title,
      duration: viralScript.duration,
      words: allWords,
      audioPath: `/audio/${combinedAudio}`,
      brollVideos: brollPaths,
      style: 3, // Neon style
    };
    
    const syncDataPath = path.join(process.cwd(), 'src', 'remotion', 'synced-data.json');
    await fs.writeFile(syncDataPath, JSON.stringify(syncedData, null, 2));
    
    // 7. Renderizar video con Remotion (SIN audio)
    console.log(`\n${colors.yellow}🎬 Renderizando video con Remotion...${colors.reset}`);
    const tempVideoPath = path.join(process.cwd(), 'output', `temp_viral_${Date.now()}.mp4`);
    
    const renderCommand = `npx remotion render src/remotion/index.tsx WordByWordFinal "${tempVideoPath}"`;
    console.log(`   Comando: ${renderCommand}`);
    
    const { stderr } = await execAsync(renderCommand, {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 * 10
    });
    
    if (stderr && !stderr.includes('warning')) {
      console.log(`${colors.yellow}Stderr: ${stderr}${colors.reset}`);
    }
    
    console.log(`${colors.green}✅ Video renderizado${colors.reset}`);
    
    // 8. Combinar con audio usando ffmpeg
    console.log(`\n${colors.yellow}🎵 Combinando con audio...${colors.reset}`);
    const finalVideoPath = path.join(process.cwd(), 'output', `viral_simple_${viralScript.id}_${Date.now()}.mp4`);
    
    const mergeCommand = `ffmpeg -i "${tempVideoPath}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -ar 44100 -ac 2 -map 0:v:0 -map 1:a:0 -shortest "${finalVideoPath}" -y`;
    
    await execAsync(mergeCommand);
    
    // Limpiar video temporal
    await fs.unlink(tempVideoPath).catch(() => {});
    
    console.log(`\n${colors.green}${'✨'.repeat(30)}${colors.reset}`);
    console.log(`${colors.bright}${colors.green}✅ VIDEO GENERADO EXITOSAMENTE${colors.reset}`);
    console.log(`${colors.green}${'✨'.repeat(30)}${colors.reset}\n`);
    console.log(`📹 Ubicación: ${finalVideoPath}`);
    console.log(`\n${colors.cyan}Para ver el video:${colors.reset}`);
    console.log(`${colors.bright}open "${finalVideoPath}"${colors.reset}\n`);
    
  } catch (error) {
    console.error(`${colors.red}❌ Error:${colors.reset}`, error);
  }
}

function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const secondsParts = parts[2].split(',');
  const seconds = parseInt(secondsParts[0], 10);
  const milliseconds = parseInt(secondsParts[1], 10);
  
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

// Ejecutar
if (require.main === module) {
  testSimpleViral()
    .then(() => {
      console.log(`${colors.green}✅ Proceso completado${colors.reset}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`${colors.red}❌ Error fatal:${colors.reset}`, error);
      process.exit(1);
    });
}

export { testSimpleViral };