#!/usr/bin/env ts-node

import { BrollDownloader } from './src/services/BrollDownloader';
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

/**
 * Descarga B-roll para todos los scripts y los organiza en carpetas
 */
async function downloadAllBrollOrganized() {
  console.log(`${colors.magenta}${'🎬'.repeat(30)}${colors.reset}`);
  console.log(`${colors.bright}${colors.white}   DESCARGANDO B-ROLL PARA TODOS LOS SCRIPTS${colors.reset}`);
  console.log(`${colors.magenta}${'🎬'.repeat(30)}${colors.reset}\n`);
  
  // Cargar scripts virales
  const scriptsPath = path.join(process.cwd(), 'data', 'viral-scripts.json');
  const scriptsData = JSON.parse(await fs.readFile(scriptsPath, 'utf-8'));
  
  // Combinar todos los scripts
  const allScripts = [
    ...scriptsData.channel1_psychology.map((s: any) => ({ ...s, channel: 'psychology' })),
    ...scriptsData.channel2_horror.map((s: any) => ({ ...s, channel: 'horror' }))
  ];
  
  console.log(`${colors.cyan}📊 Total de scripts a procesar: ${allScripts.length}${colors.reset}\n`);
  
  // Crear directorio base para análisis
  const baseOutputDir = path.join(process.cwd(), 'output', 'broll-analysis');
  await fs.mkdir(baseOutputDir, { recursive: true });
  
  // Crear downloader
  const brollDownloader = new BrollDownloader();
  
  // Estadísticas
  const stats = {
    totalScripts: allScripts.length,
    successful: 0,
    failed: 0,
    totalVideos: 0,
    scriptResults: [] as any[]
  };
  
  // Procesar cada script
  for (let i = 0; i < allScripts.length; i++) {
    const script = allScripts[i];
    
    console.log(`${colors.yellow}${'═'.repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}[${i + 1}/${allScripts.length}] ${script.id}: ${script.title}${colors.reset}`);
    console.log(`${colors.blue}Canal: ${script.channel} | Duración: ${script.duration}s${colors.reset}`);
    
    // Crear carpeta específica para este script
    const scriptDir = path.join(baseOutputDir, `${script.id}_${script.channel}`);
    await fs.mkdir(scriptDir, { recursive: true });
    
    // Crear archivo de información del script
    const infoPath = path.join(scriptDir, 'script-info.json');
    await fs.writeFile(infoPath, JSON.stringify({
      id: script.id,
      title: script.title,
      channel: script.channel,
      duration: script.duration,
      expectedViews: script.expectedViews,
      hook: script.hook,
      script: script.script,
      tags: script.tags,
      brollSearchTerms: script.brollSearchTerms
    }, null, 2));
    
    console.log(`${colors.cyan}📁 Carpeta creada: ${scriptDir}${colors.reset}`);
    console.log(`${colors.cyan}🔍 Términos de búsqueda: ${script.brollSearchTerms?.length || 0}${colors.reset}`);
    
    // Preparar texto completo
    const fullText = `${script.hook} ${script.script} ${script.cta || ''}`;
    
    try {
      let downloadedVideos: string[] = [];
      
      if (script.brollSearchTerms && script.brollSearchTerms.length > 0) {
        console.log(`${colors.green}🎯 Usando términos personalizados...${colors.reset}`);
        
        // Descargar usando términos personalizados
        for (let j = 0; j < Math.min(script.brollSearchTerms.length, 5); j++) {
          const searchTerm = script.brollSearchTerms[j];
          console.log(`   ${j + 1}. Buscando: "${searchTerm}"`);
          
          try {
            // Intentar descargar un video para este término
            const videos = await downloadSingleBroll(searchTerm, scriptDir, `${script.id}_${j + 1}`);
            if (videos.length > 0) {
              downloadedVideos.push(...videos);
              console.log(`      ✅ Descargado: ${path.basename(videos[0])}`);
            } else {
              console.log(`      ❌ No se encontró B-roll para: "${searchTerm}"`);
            }
          } catch (error) {
            console.log(`      ⚠️  Error descargando: "${searchTerm}"`);
          }
          
          // Pequeña pausa entre descargas
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        console.log(`${colors.yellow}⚠️  No hay términos personalizados, usando búsqueda genérica...${colors.reset}`);
        
        // Usar el finder básico
        downloadedVideos = await brollDownloader.downloadBrollForScript(
          fullText,
          script.duration
        );
        
        // Copiar videos a la carpeta del script
        for (const video of downloadedVideos) {
          const filename = path.basename(video);
          const destination = path.join(scriptDir, filename);
          await fs.copyFile(video, destination);
        }
      }
      
      // Crear resumen de descargas
      const summaryPath = path.join(scriptDir, 'download-summary.txt');
      const summary = `Script: ${script.id} - ${script.title}
Canal: ${script.channel}
Duración: ${script.duration}s
Videos descargados: ${downloadedVideos.length}

Términos de búsqueda usados:
${script.brollSearchTerms?.map((t: string, i: number) => `  ${i + 1}. ${t}`).join('\n') || 'Ninguno (búsqueda genérica)'}

Videos descargados:
${downloadedVideos.map((v, i) => `  ${i + 1}. ${path.basename(v)}`).join('\n') || 'Ninguno'}

Fecha de descarga: ${new Date().toISOString()}
`;
      await fs.writeFile(summaryPath, summary);
      
      console.log(`${colors.green}✅ Completado: ${downloadedVideos.length} videos descargados${colors.reset}`);
      
      stats.successful++;
      stats.totalVideos += downloadedVideos.length;
      stats.scriptResults.push({
        id: script.id,
        title: script.title,
        success: true,
        videosDownloaded: downloadedVideos.length,
        folder: scriptDir
      });
      
    } catch (error) {
      console.log(`${colors.red}❌ Error procesando script ${script.id}:${colors.reset}`, error);
      stats.failed++;
      stats.scriptResults.push({
        id: script.id,
        title: script.title,
        success: false,
        error: (error as Error).message
      });
    }
    
    console.log('');
  }
  
  // Resumen final
  console.log(`${colors.bright}${colors.green}${'✨'.repeat(30)}${colors.reset}`);
  console.log(`${colors.bright}${colors.white}   RESUMEN DE DESCARGAS${colors.reset}`);
  console.log(`${colors.bright}${colors.green}${'✨'.repeat(30)}${colors.reset}\n`);
  
  console.log(`${colors.cyan}📊 ESTADÍSTICAS:${colors.reset}`);
  console.log(`   • Scripts procesados: ${stats.totalScripts}`);
  console.log(`   • Exitosos: ${colors.green}${stats.successful}${colors.reset}`);
  console.log(`   • Fallidos: ${colors.red}${stats.failed}${colors.reset}`);
  console.log(`   • Total de videos: ${stats.totalVideos}`);
  console.log(`   • Promedio por script: ${(stats.totalVideos / stats.successful).toFixed(1)}`);
  
  console.log(`\n${colors.cyan}📁 CARPETAS CREADAS:${colors.reset}`);
  stats.scriptResults.forEach(result => {
    if (result.success) {
      console.log(`   ✅ ${result.id}: ${result.videosDownloaded} videos`);
      console.log(`      ${colors.yellow}${result.folder}${colors.reset}`);
    } else {
      console.log(`   ❌ ${result.id}: Error`);
    }
  });
  
  // Guardar reporte final
  const reportPath = path.join(baseOutputDir, 'download-report.json');
  await fs.writeFile(reportPath, JSON.stringify(stats, null, 2));
  
  console.log(`\n${colors.yellow}📄 Reporte guardado en: ${reportPath}${colors.reset}`);
  console.log(`${colors.green}📁 Todos los B-rolls en: ${baseOutputDir}${colors.reset}`);
  
  // Instrucciones para analizar
  console.log(`\n${colors.bright}${colors.cyan}💡 PARA ANALIZAR LOS B-ROLLS:${colors.reset}`);
  console.log(`   1. Abre la carpeta: ${baseOutputDir}`);
  console.log(`   2. Cada script tiene su propia carpeta con:`);
  console.log(`      • script-info.json - Información del script`);
  console.log(`      • download-summary.txt - Resumen de descargas`);
  console.log(`      • Videos .mp4 descargados`);
  console.log(`   3. Revisa si los videos coinciden con el contenido del script`);
}

/**
 * Descarga un solo B-roll basado en término de búsqueda
 */
async function downloadSingleBroll(searchTerm: string, outputDir: string, prefix: string): Promise<string[]> {
  // Simular descarga (aquí deberías implementar la descarga real con Pexels o tu API)
  const outputFile = path.join(outputDir, `${prefix}_${searchTerm.replace(/\s+/g, '_')}.mp4`);
  
  // Por ahora, crear un archivo vacío como placeholder
  // En producción, aquí descargarías el video real
  try {
    // Si tienes PEXELS_API_KEY configurada, intenta descargar
    if (process.env.PEXELS_API_KEY) {
      // Aquí iría el código real de descarga con Pexels
      // Por ahora solo creamos un placeholder
      await fs.writeFile(outputFile + '.placeholder', `Video placeholder for: ${searchTerm}\nReplace with actual download from Pexels API`);
      return [outputFile + '.placeholder'];
    } else {
      // Crear placeholder si no hay API key
      await fs.writeFile(outputFile + '.placeholder', `Placeholder for: ${searchTerm}\nConfigure PEXELS_API_KEY to download real videos`);
      return [outputFile + '.placeholder'];
    }
  } catch (error) {
    console.error(`Error downloading for term "${searchTerm}":`, error);
    return [];
  }
}

// Ejecutar
if (require.main === module) {
  downloadAllBrollOrganized()
    .then(() => {
      console.log(`\n${colors.green}✅ Descarga completada!${colors.reset}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`\n${colors.red}❌ Error fatal:${colors.reset}`, error);
      process.exit(1);
    });
}

export { downloadAllBrollOrganized };