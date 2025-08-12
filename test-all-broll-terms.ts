#!/usr/bin/env ts-node

import fs from 'fs';
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
 * Analiza todos los términos de búsqueda de b-roll en viral-scripts.json
 */
async function analyzeAllBrollTerms() {
  console.log(`${colors.magenta}${'🔍'.repeat(30)}${colors.reset}`);
  console.log(`${colors.bright}${colors.white}   ANÁLISIS DE TODOS LOS TÉRMINOS DE B-ROLL${colors.reset}`);
  console.log(`${colors.magenta}${'🔍'.repeat(30)}${colors.reset}\n`);
  
  // Cargar scripts virales
  const scriptsPath = path.join(process.cwd(), 'data', 'viral-scripts.json');
  const scriptsData = JSON.parse(fs.readFileSync(scriptsPath, 'utf-8'));
  
  // Combinar todos los scripts
  const allScripts = [
    ...scriptsData.channel1_psychology.map((s: any) => ({ ...s, channel: 'Psychology' })),
    ...scriptsData.channel2_horror.map((s: any) => ({ ...s, channel: 'Horror' }))
  ];
  
  console.log(`${colors.cyan}Total de scripts: ${allScripts.length}${colors.reset}\n`);
  
  // Análisis de términos
  const termAnalysis: any = {
    totalScripts: allScripts.length,
    scriptsWithTerms: 0,
    totalTerms: 0,
    averageTermsPerScript: 0,
    termsByLength: {
      oneWord: [],
      twoWords: [],
      threeOrMore: []
    },
    commonWords: {},
    scriptDetails: []
  };
  
  // Analizar cada script
  for (const script of allScripts) {
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}📹 ${script.id}: ${script.title}${colors.reset}`);
    console.log(`${colors.blue}Canal: ${script.channel} | Duración: ${script.duration}s | Views: ${script.expectedViews}${colors.reset}`);
    
    if (script.brollSearchTerms && script.brollSearchTerms.length > 0) {
      termAnalysis.scriptsWithTerms++;
      termAnalysis.totalTerms += script.brollSearchTerms.length;
      
      console.log(`${colors.green}✅ Tiene ${script.brollSearchTerms.length} términos de búsqueda:${colors.reset}`);
      
      const scriptTermAnalysis = {
        id: script.id,
        title: script.title,
        terms: script.brollSearchTerms,
        analysis: {
          oneWord: 0,
          twoWords: 0,
          threeOrMore: 0,
          quality: 'unknown'
        }
      };
      
      script.brollSearchTerms.forEach((term: string, index: number) => {
        const wordCount = term.split(' ').length;
        
        // Clasificar por longitud
        if (wordCount === 1) {
          termAnalysis.termsByLength.oneWord.push(term);
          scriptTermAnalysis.analysis.oneWord++;
        } else if (wordCount === 2) {
          termAnalysis.termsByLength.twoWords.push(term);
          scriptTermAnalysis.analysis.twoWords++;
        } else {
          termAnalysis.termsByLength.threeOrMore.push(term);
          scriptTermAnalysis.analysis.threeOrMore++;
        }
        
        // Contar palabras comunes
        term.split(' ').forEach(word => {
          word = word.toLowerCase();
          termAnalysis.commonWords[word] = (termAnalysis.commonWords[word] || 0) + 1;
        });
        
        // Mostrar término con indicador de calidad
        let quality = '';
        let qualityColor = '';
        
        if (wordCount === 1) {
          quality = '⭐⭐⭐';
          qualityColor = colors.green;
        } else if (wordCount === 2) {
          quality = '⭐⭐';
          qualityColor = colors.yellow;
        } else {
          quality = '⭐';
          qualityColor = colors.red;
        }
        
        console.log(`   ${index + 1}. "${term}" ${qualityColor}${quality}${colors.reset} (${wordCount} palabra${wordCount > 1 ? 's' : ''})`);
      });
      
      // Evaluar calidad general
      if (scriptTermAnalysis.analysis.threeOrMore === 0 && scriptTermAnalysis.analysis.oneWord >= 3) {
        scriptTermAnalysis.analysis.quality = 'Excelente';
        console.log(`${colors.green}📊 Calidad: EXCELENTE${colors.reset}`);
      } else if (scriptTermAnalysis.analysis.threeOrMore <= 1) {
        scriptTermAnalysis.analysis.quality = 'Buena';
        console.log(`${colors.yellow}📊 Calidad: BUENA${colors.reset}`);
      } else {
        scriptTermAnalysis.analysis.quality = 'Mejorable';
        console.log(`${colors.red}📊 Calidad: MEJORABLE${colors.reset}`);
      }
      
      termAnalysis.scriptDetails.push(scriptTermAnalysis);
      
    } else {
      console.log(`${colors.red}❌ NO tiene términos de búsqueda${colors.reset}`);
    }
    
    console.log('');
  }
  
  // Calcular promedios
  termAnalysis.averageTermsPerScript = termAnalysis.totalTerms / termAnalysis.scriptsWithTerms;
  
  // Resumen final
  console.log(`${colors.bright}${colors.green}${'✨'.repeat(30)}${colors.reset}`);
  console.log(`${colors.bright}${colors.white}   RESUMEN DEL ANÁLISIS${colors.reset}`);
  console.log(`${colors.bright}${colors.green}${'✨'.repeat(30)}${colors.reset}\n`);
  
  console.log(`${colors.cyan}📊 ESTADÍSTICAS GENERALES:${colors.reset}`);
  console.log(`   • Scripts totales: ${termAnalysis.totalScripts}`);
  console.log(`   • Scripts con términos: ${termAnalysis.scriptsWithTerms} (${(termAnalysis.scriptsWithTerms/termAnalysis.totalScripts*100).toFixed(0)}%)`);
  console.log(`   • Total de términos: ${termAnalysis.totalTerms}`);
  console.log(`   • Promedio por script: ${termAnalysis.averageTermsPerScript.toFixed(1)}`);
  
  console.log(`\n${colors.cyan}📏 DISTRIBUCIÓN POR LONGITUD:${colors.reset}`);
  console.log(`   • 1 palabra: ${termAnalysis.termsByLength.oneWord.length} términos (${(termAnalysis.termsByLength.oneWord.length/termAnalysis.totalTerms*100).toFixed(0)}%)`);
  console.log(`   • 2 palabras: ${termAnalysis.termsByLength.twoWords.length} términos (${(termAnalysis.termsByLength.twoWords.length/termAnalysis.totalTerms*100).toFixed(0)}%)`);
  console.log(`   • 3+ palabras: ${termAnalysis.termsByLength.threeOrMore.length} términos (${(termAnalysis.termsByLength.threeOrMore.length/termAnalysis.totalTerms*100).toFixed(0)}%)`);
  
  // Top palabras más comunes
  const sortedWords = Object.entries(termAnalysis.commonWords)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 10);
  
  console.log(`\n${colors.cyan}🔝 TOP 10 PALABRAS MÁS USADAS:${colors.reset}`);
  sortedWords.forEach(([word, count], index) => {
    console.log(`   ${index + 1}. "${word}" - ${count} veces`);
  });
  
  // Evaluación de calidad
  const excellentScripts = termAnalysis.scriptDetails.filter((s: any) => s.analysis.quality === 'Excelente').length;
  const goodScripts = termAnalysis.scriptDetails.filter((s: any) => s.analysis.quality === 'Buena').length;
  const improvableScripts = termAnalysis.scriptDetails.filter((s: any) => s.analysis.quality === 'Mejorable').length;
  
  console.log(`\n${colors.cyan}⭐ CALIDAD DE TÉRMINOS:${colors.reset}`);
  console.log(`   ${colors.green}• Excelente: ${excellentScripts} scripts${colors.reset}`);
  console.log(`   ${colors.yellow}• Buena: ${goodScripts} scripts${colors.reset}`);
  console.log(`   ${colors.red}• Mejorable: ${improvableScripts} scripts${colors.reset}`);
  
  // Recomendaciones
  console.log(`\n${colors.bright}${colors.cyan}💡 RECOMENDACIONES:${colors.reset}`);
  
  const oneWordPercentage = (termAnalysis.termsByLength.oneWord.length/termAnalysis.totalTerms*100);
  if (oneWordPercentage < 30) {
    console.log(`   ${colors.yellow}⚠️  Solo ${oneWordPercentage.toFixed(0)}% son términos de 1 palabra. Objetivo: 40%+${colors.reset}`);
    console.log(`      Simplifica términos como:`);
    termAnalysis.termsByLength.threeOrMore.slice(0, 3).forEach((term: string) => {
      const simplified = term.split(' ')[0];
      console.log(`      • "${term}" → "${simplified}"`);
    });
  } else {
    console.log(`   ${colors.green}✅ Buen balance de términos simples (${oneWordPercentage.toFixed(0)}%)${colors.reset}`);
  }
  
  if (termAnalysis.termsByLength.threeOrMore.length > 0) {
    console.log(`\n   ${colors.red}⚠️  Términos muy largos que deberían simplificarse:${colors.reset}`);
    termAnalysis.termsByLength.threeOrMore.slice(0, 5).forEach((term: string) => {
      console.log(`      • "${term}"`);
    });
  }
  
  // Guardar reporte
  const reportPath = path.join(process.cwd(), 'output', 'broll-analysis-report.json');
  await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.promises.writeFile(reportPath, JSON.stringify(termAnalysis, null, 2));
  
  console.log(`\n${colors.yellow}📄 Reporte completo guardado en: ${reportPath}${colors.reset}`);
  
  // Calificación final
  const finalScore = (excellentScripts * 3 + goodScripts * 2 + improvableScripts * 1) / (termAnalysis.scriptsWithTerms * 3) * 100;
  
  console.log(`\n${colors.bright}${colors.white}🏆 CALIFICACIÓN FINAL: ${finalScore.toFixed(0)}%${colors.reset}`);
  
  if (finalScore >= 80) {
    console.log(`${colors.green}¡Excelente configuración de términos de búsqueda!${colors.reset}`);
  } else if (finalScore >= 60) {
    console.log(`${colors.yellow}Buena configuración, pero hay margen de mejora${colors.reset}`);
  } else {
    console.log(`${colors.red}Los términos necesitan optimización significativa${colors.reset}`);
  }
}

// Ejecutar el análisis
if (require.main === module) {
  analyzeAllBrollTerms()
    .then(() => {
      console.log(`\n${colors.green}✅ Análisis completado!${colors.reset}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`\n${colors.red}❌ Error:${colors.reset}`, error);
      process.exit(1);
    });
}

export { analyzeAllBrollTerms };