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
  white: '\x1b[37m'
};

/**
 * Descarga B-roll simulado para todos los scripts
 */
async function downloadAllBrollSimple() {
  console.log(`${colors.magenta}${'🎬'.repeat(30)}${colors.reset}`);
  console.log(`${colors.bright}${colors.white}   PREPARANDO B-ROLL PARA ANÁLISIS${colors.reset}`);
  console.log(`${colors.magenta}${'🎬'.repeat(30)}${colors.reset}\n`);
  
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
  const baseDir = path.join(process.cwd(), 'output', 'broll-analysis-manual');
  await fs.mkdir(baseDir, { recursive: true });
  
  // Procesar cada script
  for (let i = 0; i < allScripts.length; i++) {
    const script = allScripts[i];
    
    console.log(`${colors.yellow}${'═'.repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}[${i + 1}/${allScripts.length}] ${script.id}: ${script.title}${colors.reset}`);
    
    // Crear carpeta para el script
    const scriptDir = path.join(baseDir, `${i + 1}_${script.id}`);
    await fs.mkdir(scriptDir, { recursive: true });
    
    // Guardar información del script
    const infoContent = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCRIPT: ${script.id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📹 TÍTULO: ${script.title}
📺 CANAL: ${script.channel}
⏱️  DURACIÓN: ${script.duration} segundos
👁️  VIEWS ESPERADAS: ${script.expectedViews}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENIDO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎪 HOOK:
"${script.hook}"

📝 SCRIPT:
"${script.script}"

🎯 CTA:
"${script.cta || 'N/A'}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TÉRMINOS DE BÚSQUEDA DE B-ROLL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${script.brollSearchTerms?.map((term: string, index: number) => 
  `${index + 1}. "${term}"`
).join('\n') || 'No hay términos definidos'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUCCIONES PARA DESCARGAR B-ROLL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Ve a https://www.pexels.com/videos/
2. Busca cada uno de estos términos:
${script.brollSearchTerms?.map((term: string) => 
  `   • ${term}`
).join('\n') || '   • Usa términos genéricos relacionados con el contenido'}

3. Descarga 1 video por cada término (5-10 segundos de duración)
4. Guarda los videos en esta carpeta con nombres descriptivos
5. Anota cuál término usaste para cada video

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANÁLISIS A REALIZAR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

☐ ¿Los videos coinciden con el contenido del script?
☐ ¿Los términos de búsqueda son efectivos?
☐ ¿Qué términos no encontraron buenos resultados?
☐ ¿Qué términos alternativos funcionarían mejor?
☐ ¿El B-roll ayuda a contar la historia?
☐ ¿Falta algún tipo de B-roll importante?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    
    await fs.writeFile(
      path.join(scriptDir, `README_${script.id}.txt`),
      infoContent
    );
    
    // Crear archivo de búsqueda rápida para Pexels
    const searchUrls = script.brollSearchTerms?.map((term: string) => 
      `https://www.pexels.com/search/videos/${encodeURIComponent(term)}/`
    ) || [];
    
    const urlsContent = `URLs DE BÚSQUEDA DIRECTA EN PEXELS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${searchUrls.map((url: string, idx: number) => 
  `${idx + 1}. ${script.brollSearchTerms[idx]}:\n   ${url}\n`
).join('\n')}

INSTRUCCIONES:
1. Ctrl+Click en cada URL para abrir en el navegador
2. Descarga el primer video relevante que encuentres
3. Si no hay resultados, prueba términos más simples
`;
    
    await fs.writeFile(
      path.join(scriptDir, `SEARCH_URLS.txt`),
      urlsContent
    );
    
    // Crear plantilla de análisis
    const analysisTemplate = `ANÁLISIS DE B-ROLL - ${script.id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fecha de análisis: ${new Date().toLocaleDateString()}
Analizado por: [TU NOMBRE]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESULTADOS DE BÚSQUEDA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${script.brollSearchTerms?.map((term: string, idx: number) => 
  `${idx + 1}. "${term}"
   ☐ Encontrado
   ☐ No encontrado
   ☐ Encontrado pero no relevante
   Notas: _______________________
`
).join('\n') || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EVALUACIÓN GENERAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Calidad de términos: ☐ Excelente ☐ Buena ☐ Regular ☐ Mala

Relevancia del B-roll: ☐ Muy relevante ☐ Relevante ☐ Poco relevante

Cobertura del contenido: _____%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TÉRMINOS MEJORADOS SUGERIDOS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. En lugar de: _____________ → Usar: _____________
2. En lugar de: _____________ → Usar: _____________
3. En lugar de: _____________ → Usar: _____________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOTAS ADICIONALES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━




━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    
    await fs.writeFile(
      path.join(scriptDir, `ANALYSIS_TEMPLATE.txt`),
      analysisTemplate
    );
    
    console.log(`${colors.green}✅ Carpeta creada: ${scriptDir}${colors.reset}`);
    console.log(`   • README con información del script`);
    console.log(`   • URLs directas de búsqueda en Pexels`);
    console.log(`   • Plantilla de análisis`);
  }
  
  // Crear archivo índice principal
  const indexContent = `ÍNDICE DE SCRIPTS PARA ANÁLISIS DE B-ROLL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${allScripts.map((script: any, idx: number) => 
  `${idx + 1}. ${script.id} - ${script.title}
   Canal: ${script.channel} | Duración: ${script.duration}s
   Carpeta: ${idx + 1}_${script.id}/
`
).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSTRUCCIONES GENERALES:
1. Abre cada carpeta numerada
2. Lee el README para entender el script
3. Usa los URLs en SEARCH_URLS.txt para buscar en Pexels
4. Descarga los videos relevantes
5. Completa el ANALYSIS_TEMPLATE.txt con tus observaciones

OBJETIVO:
Determinar qué términos de búsqueda funcionan mejor para encontrar
B-roll relevante para cada tipo de contenido.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  
  await fs.writeFile(
    path.join(baseDir, 'INDEX.txt'),
    indexContent
  );
  
  // Resumen final
  console.log(`\n${colors.bright}${colors.green}${'✨'.repeat(30)}${colors.reset}`);
  console.log(`${colors.bright}${colors.white}   CARPETAS CREADAS EXITOSAMENTE${colors.reset}`);
  console.log(`${colors.bright}${colors.green}${'✨'.repeat(30)}${colors.reset}\n`);
  
  console.log(`${colors.cyan}📁 UBICACIÓN:${colors.reset}`);
  console.log(`   ${baseDir}`);
  
  console.log(`\n${colors.cyan}📊 CONTENIDO CREADO:${colors.reset}`);
  console.log(`   • 10 carpetas (una por script)`);
  console.log(`   • README con información de cada script`);
  console.log(`   • URLs directas de búsqueda en Pexels`);
  console.log(`   • Plantillas de análisis`);
  console.log(`   • Índice general`);
  
  console.log(`\n${colors.bright}${colors.yellow}📋 PRÓXIMOS PASOS:${colors.reset}`);
  console.log(`   1. Abre la carpeta: ${colors.cyan}${baseDir}${colors.reset}`);
  console.log(`   2. Ve a cada subcarpeta numerada (1_psych_001, 2_psych_002, etc.)`);
  console.log(`   3. Abre SEARCH_URLS.txt y haz click en cada URL`);
  console.log(`   4. Descarga 1 video por cada término de búsqueda`);
  console.log(`   5. Guarda los videos en la misma carpeta`);
  console.log(`   6. Completa ANALYSIS_TEMPLATE.txt con tus observaciones`);
  
  console.log(`\n${colors.bright}${colors.magenta}💡 TIPS PARA EL ANÁLISIS:${colors.reset}`);
  console.log(`   • Si un término no da resultados, prueba simplificarlo`);
  console.log(`   • Anota qué términos funcionan mejor`);
  console.log(`   • Observa si el B-roll coincide con el tono del script`);
  console.log(`   • Sugiere términos alternativos que darían mejores resultados`);
}

// Ejecutar
if (require.main === module) {
  downloadAllBrollSimple()
    .then(() => {
      console.log(`\n${colors.green}✅ ¡Listo para análisis manual!${colors.reset}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`\n${colors.red}❌ Error:${colors.reset}`, error);
      process.exit(1);
    });
}

export { downloadAllBrollSimple };