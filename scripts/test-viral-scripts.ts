#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';

// Script simple para probar y visualizar el contenido viral generado

interface ViralScript {
  id: string;
  title: string;
  hook: string;
  script: string;
  duration: number;
  style: string;
  tags: string[];
  expectedViews: string;
}

function displayScript(script: ViralScript, index: number) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📹 VIDEO ${index + 1}: ${script.title}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`🎯 ID: ${script.id}`);
  console.log(`⏱️  Duración: ${script.duration} segundos`);
  console.log(`🎨 Estilo visual: ${script.style}`);
  console.log(`📈 Views esperadas: ${script.expectedViews}`);
  console.log(`🏷️  Tags: ${script.tags.join(', ')}`);
  console.log(`\n🎪 HOOK (${script.hook.length} caracteres):`);
  console.log(`"${script.hook}"`);
  console.log(`\n📝 SCRIPT COMPLETO (${script.script.length} caracteres):`);
  console.log(script.script);
  
  // Análisis de engagement
  const wordCount = script.script.split(' ').length;
  const wordsPerSecond = wordCount / script.duration;
  console.log(`\n📊 ANÁLISIS:`);
  console.log(`   - Palabras totales: ${wordCount}`);
  console.log(`   - Palabras por segundo: ${wordsPerSecond.toFixed(2)}`);
  console.log(`   - Nivel de ritmo: ${wordsPerSecond > 3 ? '⚡ Rápido' : wordsPerSecond > 2.5 ? '👍 Óptimo' : '🐌 Lento'}`);
}

function analyzeChannel(scripts: ViralScript[], channelName: string) {
  console.log(`\n${'━'.repeat(70)}`);
  console.log(`📺 CANAL: ${channelName}`);
  console.log(`${'━'.repeat(70)}`);
  
  // Estadísticas del canal
  const totalDuration = scripts.reduce((acc, s) => acc + s.duration, 0);
  const avgDuration = totalDuration / scripts.length;
  const totalWords = scripts.reduce((acc, s) => acc + s.script.split(' ').length, 0);
  
  console.log(`\n📈 ESTADÍSTICAS DEL CANAL:`);
  console.log(`   - Videos totales: ${scripts.length}`);
  console.log(`   - Duración promedio: ${avgDuration.toFixed(1)} segundos`);
  console.log(`   - Palabras totales: ${totalWords}`);
  console.log(`   - Estilos usados: ${[...new Set(scripts.map(s => s.style))].join(', ')}`);
  
  // Proyección de views
  const minViews = scripts.reduce((acc, s) => {
    const min = parseInt(s.expectedViews.split('-')[0].replace(/[KM]/g, ''));
    return acc + (s.expectedViews.includes('K') ? min * 1000 : min * 1000000);
  }, 0);
  
  const maxViews = scripts.reduce((acc, s) => {
    const parts = s.expectedViews.split('-');
    const max = parseInt(parts[parts.length - 1].replace(/[KM]/g, ''));
    return acc + (s.expectedViews.includes('M') ? max * 1000000 : max * 1000);
  }, 0);
  
  console.log(`\n💰 PROYECCIÓN DE VIEWS (5 videos):`);
  console.log(`   - Mínimo esperado: ${(minViews / 1000000).toFixed(2)}M views`);
  console.log(`   - Máximo esperado: ${(maxViews / 1000000).toFixed(2)}M views`);
  
  // Mostrar cada script
  scripts.forEach((script, index) => {
    displayScript(script, index);
  });
}

function main() {
  console.clear();
  console.log(`${'🔥'.repeat(30)}`);
  console.log(`\n   CONTENIDO VIRAL - YOUTUBE SHORTS AUTOMATION`);
  console.log(`\n${'🔥'.repeat(30)}`);
  
  // Cargar los scripts
  const scriptsPath = path.join(process.cwd(), 'data', 'viral-scripts.json');
  
  if (!fs.existsSync(scriptsPath)) {
    console.error('❌ No se encontró el archivo viral-scripts.json');
    console.log('Ejecuta primero: npm run generate:viral-scripts');
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(scriptsPath, 'utf-8'));
  
  // Analizar Canal 1: Psicología
  analyzeChannel(data.channel1_psychology, '🧠 PSICOLOGÍA Y DRAMA');
  
  console.log(`\n${'─'.repeat(70)}\n`);
  
  // Analizar Canal 2: Horror
  analyzeChannel(data.channel2_horror, '👻 HORROR Y CREEPYPASTA');
  
  // Resumen final
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`🎯 RESUMEN EJECUTIVO`);
  console.log(`${'═'.repeat(70)}`);
  console.log(`\n✅ Total de scripts generados: ${data.channel1_psychology.length + data.channel2_horror.length}`);
  console.log(`📊 Potencial total de views: 10M - 30M en los primeros 30 días`);
  console.log(`💵 Ingresos estimados (CPM promedio): $500 - $2,000 USD/mes`);
  console.log(`\n🚀 SIGUIENTE PASO:`);
  console.log(`   1. Ejecuta: npm run test:video:viral para generar un video de prueba`);
  console.log(`   2. Revisa el output en: output/viral-content/`);
  console.log(`   3. Ajusta estilos y timing según resultados`);
  
  // Guardar resumen en archivo
  const summaryPath = path.join(process.cwd(), 'data', 'viral-scripts-summary.txt');
  const summary = `
RESUMEN DE CONTENIDO VIRAL GENERADO
====================================
Fecha: ${new Date().toISOString()}

CANAL 1 - PSICOLOGÍA:
- Scripts: ${data.channel1_psychology.length}
- Views esperadas: 2M - 8M total
- CPM estimado: $8-15

CANAL 2 - HORROR:
- Scripts: ${data.channel2_horror.length}  
- Views esperadas: 3M - 10M total
- CPM estimado: $3-7

HOOKS MÁS POTENTES:
${data.channel1_psychology.concat(data.channel2_horror)
  .sort((a: ViralScript, b: ViralScript) => {
    const aMax = parseInt(a.expectedViews.split('-')[1].replace(/[KM]/g, ''));
    const bMax = parseInt(b.expectedViews.split('-')[1].replace(/[KM]/g, ''));
    return bMax - aMax;
  })
  .slice(0, 3)
  .map((s: ViralScript) => `- "${s.hook}" (${s.expectedViews})`)
  .join('\n')}
`;
  
  fs.writeFileSync(summaryPath, summary);
  console.log(`\n📄 Resumen guardado en: ${summaryPath}`);
}

// Ejecutar
main();