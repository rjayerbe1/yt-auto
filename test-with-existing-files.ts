#!/usr/bin/env ts-node

import fs from 'fs/promises';
import path from 'path';

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

async function testWithExistingFiles() {
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}🎬 PRUEBA CON ARCHIVOS EXISTENTES${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

  try {
    // Verificar archivos existentes
    console.log(`${colors.yellow}📁 Verificando archivos existentes...${colors.reset}`);
    
    // Verificar audio combinado
    const audioPath = path.join(process.cwd(), 'output', 'audio', 'combined_1754976372888.wav');
    const audioExists = await fs.access(audioPath).then(() => true).catch(() => false);
    
    if (!audioExists) {
      console.log(`${colors.red}❌ No se encontró el audio combinado${colors.reset}`);
      console.log(`   Esperado en: ${audioPath}`);
      return;
    }
    console.log(`${colors.green}✅ Audio encontrado: combined_1754976372888.wav${colors.reset}`);
    
    // Verificar b-roll
    const brollDir = path.join(process.cwd(), 'public', 'broll');
    const brollFiles = await fs.readdir(brollDir);
    console.log(`${colors.green}✅ B-roll encontrados: ${brollFiles.length} archivos${colors.reset}`);
    brollFiles.forEach((file, i) => {
      console.log(`   ${i + 1}. ${file}`);
    });
    
    // Leer datos de sincronización si existen
    const syncDataPath = path.join(process.cwd(), 'src', 'remotion', 'synced-data.json');
    let syncedData: any = null;
    
    try {
      const syncContent = await fs.readFile(syncDataPath, 'utf-8');
      syncedData = JSON.parse(syncContent);
      console.log(`${colors.green}✅ Datos de sincronización encontrados${colors.reset}`);
      console.log(`   Duración total: ${syncedData.duration}s`);
      console.log(`   Palabras sincronizadas: ${syncedData.words?.length || 0}`);
    } catch (error) {
      console.log(`${colors.yellow}⚠️ No se encontraron datos de sincronización previos${colors.reset}`);
    }
    
    // Crear datos para el video si no existen
    if (!syncedData || !syncedData.words || syncedData.words.length === 0) {
      console.log(`\n${colors.yellow}🔧 Generando datos de sincronización...${colors.reset}`);
      
      // Usar los archivos JSON de transcripción
      const segmentFiles = ['hook', 'segment_0', 'segment_1', 'segment_2', 'segment_3', 'segment_4', 'cta'];
      
      let currentTime = 0;
      const allWords = [];
      
      for (const segmentFile of segmentFiles) {
        const jsonPath = path.join(process.cwd(), 'output', 'audio', `${segmentFile}.json`);
        try {
          const content = await fs.readFile(jsonPath, 'utf-8');
          const data = JSON.parse(content);
          
          if (data.transcription?.words) {
            // Ajustar tiempos relativos al tiempo actual
            const words = data.transcription.words.map((word: any) => ({
              ...word,
              start: word.start + currentTime,
              end: word.end + currentTime
            }));
            allWords.push(...words);
            
            // Actualizar tiempo actual con la duración del segmento
            const segmentDuration = data.transcription.words[data.transcription.words.length - 1]?.end || 0;
            currentTime += segmentDuration;
          }
        } catch (error) {
          console.log(`${colors.yellow}   No se pudo leer ${segmentFile}.json${colors.reset}`);
        }
      }
      
      syncedData = {
        title: "Video de Prueba con Archivos Existentes",
        duration: currentTime || 60,
        words: allWords,
        audioPath: '/audio/combined_1754976372888.wav',
        brollVideos: brollFiles.map(file => `/broll/${file}`),
        style: 1, // Estilo clásico
      };
      
      console.log(`${colors.green}✅ Datos generados: ${allWords.length} palabras, ${currentTime}s duración${colors.reset}`);
    }
    
    // Guardar datos actualizados
    console.log(`\n${colors.yellow}💾 Guardando datos de sincronización...${colors.reset}`);
    await fs.writeFile(syncDataPath, JSON.stringify(syncedData, null, 2));
    console.log(`${colors.green}✅ Datos guardados en synced-data.json${colors.reset}`);
    
    // Información sobre el video
    console.log(`\n${colors.cyan}📊 RESUMEN DEL VIDEO:${colors.reset}`);
    console.log(`   • Título: ${syncedData.title}`);
    console.log(`   • Duración: ${syncedData.duration}s`);
    console.log(`   • Palabras: ${syncedData.words?.length || 0}`);
    console.log(`   • B-roll: ${syncedData.brollVideos?.length || 0} videos`);
    console.log(`   • Estilo: ${syncedData.style}`);
    
    // Renderizar video con Remotion
    console.log(`\n${colors.yellow}🎬 Renderizando video con Remotion...${colors.reset}`);
    console.log(`${colors.cyan}Ejecuta este comando para renderizar:${colors.reset}`);
    console.log(`\n${colors.bright}npm run remotion:render src/remotion/index.tsx WordByWordWithBroll output/test-existing-files.mp4${colors.reset}\n`);
    
    console.log(`${colors.yellow}O para preview en el navegador:${colors.reset}`);
    console.log(`\n${colors.bright}npm run remotion:preview${colors.reset}\n`);
    
    // Verificar si necesitamos más b-roll
    const recommendedBroll = Math.ceil(syncedData.duration / 6);
    if (brollFiles.length < recommendedBroll) {
      console.log(`\n${colors.yellow}⚠️ RECOMENDACIÓN:${colors.reset}`);
      console.log(`   Se recomienda tener al menos ${recommendedBroll} videos de b-roll`);
      console.log(`   Actualmente tienes: ${brollFiles.length}`);
      console.log(`   Faltan: ${recommendedBroll - brollFiles.length} videos más`);
    }
    
  } catch (error) {
    console.error(`${colors.red}❌ Error:${colors.reset}`, error);
  }
}

// Ejecutar
if (require.main === module) {
  testWithExistingFiles()
    .then(() => {
      console.log(`\n${colors.green}✅ Preparación completada${colors.reset}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`\n${colors.red}❌ Error fatal:${colors.reset}`, error);
      process.exit(1);
    });
}

export { testWithExistingFiles };