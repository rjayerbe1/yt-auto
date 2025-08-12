#!/usr/bin/env ts-node

import axios from 'axios';
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
  white: '\x1b[37m'
};

interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  duration: number;
  video_files: Array<{
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }>;
}

/**
 * Descarga videos reales de B-roll desde Pexels
 */
async function downloadRealBroll() {
  console.log(`${colors.magenta}${'🎬'.repeat(30)}${colors.reset}`);
  console.log(`${colors.bright}${colors.white}   DESCARGANDO B-ROLL REAL DE PEXELS${colors.reset}`);
  console.log(`${colors.magenta}${'🎬'.repeat(30)}${colors.reset}\n`);
  
  // Verificar API key
  const pexelsApiKey = process.env.PEXELS_API_KEY;
  if (!pexelsApiKey) {
    console.log(`${colors.yellow}⚠️  No se encontró PEXELS_API_KEY en las variables de entorno${colors.reset}`);
    console.log(`${colors.cyan}Usando descarga simulada para demostración...${colors.reset}\n`);
  }
  
  // Cargar scripts virales
  const scriptsPath = path.join(process.cwd(), 'data', 'viral-scripts.json');
  const scriptsData = JSON.parse(await fs.readFile(scriptsPath, 'utf-8'));
  
  // Combinar todos los scripts
  const allScripts = [
    ...scriptsData.channel1_psychology.map((s: any) => ({ ...s, channel: 'psychology' })),
    ...scriptsData.channel2_horror.map((s: any) => ({ ...s, channel: 'horror' }))
  ];
  
  console.log(`${colors.cyan}📊 Total de scripts: ${allScripts.length}${colors.reset}\n`);
  
  // Crear directorio base
  const baseDir = path.join(process.cwd(), 'output', 'broll-downloads');
  await fs.mkdir(baseDir, { recursive: true });
  
  // Estadísticas
  let totalVideosDownloaded = 0;
  let totalTermsSearched = 0;
  
  // Procesar cada script
  for (let i = 0; i < allScripts.length; i++) {
    const script = allScripts[i];
    
    console.log(`${colors.yellow}${'═'.repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}[${i + 1}/${allScripts.length}] ${script.id}: ${script.title}${colors.reset}`);
    console.log(`${colors.blue}Canal: ${script.channel} | Duración: ${script.duration}s${colors.reset}`);
    
    // Crear carpeta para el script
    const scriptDir = path.join(baseDir, `${i + 1}_${script.id}`);
    await fs.mkdir(scriptDir, { recursive: true });
    
    // Guardar información del script
    const infoPath = path.join(scriptDir, 'script-info.json');
    await fs.writeFile(infoPath, JSON.stringify({
      id: script.id,
      title: script.title,
      channel: script.channel,
      duration: script.duration,
      brollSearchTerms: script.brollSearchTerms,
      hook: script.hook,
      script: script.script
    }, null, 2));
    
    if (script.brollSearchTerms && script.brollSearchTerms.length > 0) {
      console.log(`${colors.green}🔍 Buscando ${script.brollSearchTerms.length} términos:${colors.reset}`);
      
      // Buscar y descargar videos para cada término
      let videosForScript = 0;
      for (let j = 0; j < Math.min(script.brollSearchTerms.length, 5); j++) {
        const searchTerm = script.brollSearchTerms[j];
        console.log(`   ${j + 1}. Buscando: "${searchTerm}"`);
        totalTermsSearched++;
        
        try {
          if (pexelsApiKey) {
            // Búsqueda real en Pexels
            const videoUrl = await searchPexelsForVideo(searchTerm, pexelsApiKey);
            
            if (videoUrl) {
              const outputFile = path.join(scriptDir, `${j + 1}_${searchTerm.replace(/\s+/g, '_')}.mp4`);
              const success = await downloadVideo(videoUrl, outputFile);
              
              if (success) {
                console.log(`      ${colors.green}✅ Descargado exitosamente${colors.reset}`);
                videosForScript++;
                totalVideosDownloaded++;
              } else {
                console.log(`      ${colors.red}❌ Error al descargar${colors.reset}`);
              }
            } else {
              console.log(`      ${colors.yellow}⚠️  No se encontraron videos${colors.reset}`);
            }
          } else {
            // Crear archivo placeholder para demostración
            const placeholderFile = path.join(scriptDir, `${j + 1}_${searchTerm.replace(/\s+/g, '_')}.txt`);
            await fs.writeFile(placeholderFile, `Placeholder para: "${searchTerm}"\nConfigura PEXELS_API_KEY para descargar videos reales\n\nBuscar en: https://www.pexels.com/search/videos/${encodeURIComponent(searchTerm)}/`);
            console.log(`      ${colors.cyan}📝 Placeholder creado${colors.reset}`);
          }
        } catch (error) {
          console.log(`      ${colors.red}❌ Error: ${error}${colors.reset}`);
        }
        
        // Pequeña pausa entre búsquedas
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`${colors.green}📦 Videos descargados para este script: ${videosForScript}${colors.reset}`);
      
    } else {
      console.log(`${colors.red}❌ No hay términos de búsqueda definidos${colors.reset}`);
    }
    
    // Crear resumen para el script
    const summaryPath = path.join(scriptDir, 'download-summary.txt');
    const summary = `RESUMEN DE DESCARGA
═══════════════════════════════════════════════════

Script: ${script.id} - ${script.title}
Canal: ${script.channel}
Duración: ${script.duration}s

TÉRMINOS DE BÚSQUEDA:
${script.brollSearchTerms?.map((term: string, idx: number) => 
  `  ${idx + 1}. "${term}"`
).join('\n') || 'Ninguno'}

ARCHIVOS EN ESTA CARPETA:
- script-info.json: Información completa del script
- Videos .mp4 o placeholders .txt para cada término

Fecha: ${new Date().toLocaleString()}
═══════════════════════════════════════════════════
`;
    await fs.writeFile(summaryPath, summary);
    
    console.log('');
  }
  
  // Resumen final
  console.log(`${colors.bright}${colors.green}${'✨'.repeat(30)}${colors.reset}`);
  console.log(`${colors.bright}${colors.white}   RESUMEN DE DESCARGAS${colors.reset}`);
  console.log(`${colors.bright}${colors.green}${'✨'.repeat(30)}${colors.reset}\n`);
  
  console.log(`${colors.cyan}📊 ESTADÍSTICAS:${colors.reset}`);
  console.log(`   • Scripts procesados: ${allScripts.length}`);
  console.log(`   • Términos buscados: ${totalTermsSearched}`);
  if (pexelsApiKey) {
    console.log(`   • Videos descargados: ${colors.green}${totalVideosDownloaded}${colors.reset}`);
  } else {
    console.log(`   • Placeholders creados: ${colors.yellow}${totalTermsSearched}${colors.reset}`);
  }
  
  console.log(`\n${colors.cyan}📁 UBICACIÓN:${colors.reset}`);
  console.log(`   ${baseDir}`);
  
  console.log(`\n${colors.yellow}📋 ESTRUCTURA DE CARPETAS:${colors.reset}`);
  console.log(`   output/broll-downloads/`);
  console.log(`   ├── 1_psych_001/`);
  console.log(`   │   ├── script-info.json`);
  console.log(`   │   ├── download-summary.txt`);
  console.log(`   │   └── [videos o placeholders]`);
  console.log(`   ├── 2_psych_002/`);
  console.log(`   └── ... (10 carpetas en total)`);
  
  if (!pexelsApiKey) {
    console.log(`\n${colors.bright}${colors.yellow}⚠️  IMPORTANTE:${colors.reset}`);
    console.log(`   Para descargar videos reales, configura PEXELS_API_KEY:`);
    console.log(`   ${colors.cyan}export PEXELS_API_KEY="tu_api_key_aqui"${colors.reset}`);
    console.log(`   Obtén una API key gratis en: https://www.pexels.com/api/`);
  }
}

/**
 * Busca un video en Pexels
 */
async function searchPexelsForVideo(searchTerm: string, apiKey: string): Promise<string | null> {
  try {
    const response = await axios.get('https://api.pexels.com/videos/search', {
      headers: {
        Authorization: apiKey,
      },
      params: {
        query: searchTerm,
        per_page: 1,
        orientation: 'portrait',
        size: 'medium',
      },
    });

    if (response.data && response.data.videos && response.data.videos.length > 0) {
      const video = response.data.videos[0] as PexelsVideo;
      
      // Buscar video en orientación vertical o el de mejor calidad
      const videoFile = video.video_files
        .sort((a, b) => {
          // Priorizar videos verticales
          const aIsVertical = a.height > a.width;
          const bIsVertical = b.height > b.width;
          if (aIsVertical && !bIsVertical) return -1;
          if (!aIsVertical && bIsVertical) return 1;
          // Si ambos son iguales, ordenar por calidad
          return b.height - a.height;
        })[0];
      
      return videoFile ? videoFile.link : null;
    }
    
    return null;
  } catch (error) {
    console.error(`Error buscando en Pexels: ${error}`);
    return null;
  }
}

/**
 * Descarga un video desde una URL
 */
async function downloadVideo(url: string, outputPath: string): Promise<boolean> {
  try {
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 30000, // 30 segundos timeout
    });
    
    const writer = (await import('fs')).createWriteStream(outputPath);
    response.data.pipe(writer);
    
    return new Promise((resolve) => {
      writer.on('finish', () => resolve(true));
      writer.on('error', () => resolve(false));
    });
  } catch (error) {
    console.error(`Error descargando video: ${error}`);
    return false;
  }
}


// Ejecutar
if (require.main === module) {
  downloadRealBroll()
    .then(() => {
      console.log(`\n${colors.green}✅ ¡Proceso completado!${colors.reset}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`\n${colors.red}❌ Error fatal:${colors.reset}`, error);
      process.exit(1);
    });
}

export { downloadRealBroll };