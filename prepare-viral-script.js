#!/usr/bin/env node

/**
 * Prepara un script viral específico para ser generado
 * Actualiza synced-data.json con el contenido correcto
 */

const fs = require('fs');
const path = require('path');

// Cargar scripts virales
const viralScripts = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data/viral-scripts.json'), 'utf-8')
);

// Mostrar opciones
console.log('\n🔥 SCRIPTS VIRALES DISPONIBLES:\n');

console.log('CANAL 1 - PSICOLOGÍA:');
viralScripts.channel1_psychology.forEach((script, i) => {
  console.log(`  ${i + 1}. ${script.title}`);
});

console.log('\nCANAL 2 - HORROR:');
viralScripts.channel2_horror.forEach((script, i) => {
  console.log(`  ${i + 6}. ${script.title}`);
});

// Obtener selección del argumento
const selection = parseInt(process.argv[2]);

if (!selection || selection < 1 || selection > 10) {
  console.log('\n❌ Uso: node prepare-viral-script.js [1-10]');
  process.exit(1);
}

// Seleccionar script
let selectedScript;
if (selection <= 5) {
  selectedScript = viralScripts.channel1_psychology[selection - 1];
} else {
  selectedScript = viralScripts.channel2_horror[selection - 6];
}

console.log(`\n✅ Seleccionado: ${selectedScript.title}`);
console.log(`📊 Views esperadas: ${selectedScript.expectedViews}`);
console.log(`⏱️ Duración: ${selectedScript.duration}s`);

// Mapear estilos
const styleMap = {
  'modern_gradient': 2,
  'minimalist': 4,
  'neon_cyberpunk': 3,
  'dynamic': 6,
  'dark_horror': 3,
  'glitch_tech': 6,
  'hospital_horror': 3,
  'professional': 4
};

const videoStyle = styleMap[selectedScript.style] || 3;

// Dividir script en segmentos
const words = selectedScript.script.split(' ');
const segmentCount = 5;
const wordsPerSegment = Math.ceil(words.length / segmentCount);
const segments = [];

for (let i = 0; i < segmentCount; i++) {
  const segmentWords = words.slice(i * wordsPerSegment, (i + 1) * wordsPerSegment);
  if (segmentWords.length > 0) {
    segments.push(segmentWords.join(' '));
  }
}

// Crear estructura synced-data
const syncedData = {
  title: selectedScript.title,
  segments: segments.map((text, i) => ({
    text: text,
    audioFile: `/tmp/segment_${i}.wav`,
    duration: selectedScript.duration / segments.length,
    startTime: (selectedScript.duration / segments.length) * i,
    endTime: (selectedScript.duration / segments.length) * (i + 1),
    wordTimings: [],
    captions: []
  })),
  totalDuration: selectedScript.duration,
  videoStyle: videoStyle,
  brollVideos: [],
  metadata: {
    scriptId: selectedScript.id,
    expectedViews: selectedScript.expectedViews,
    tags: selectedScript.tags,
    originalStyle: selectedScript.style
  }
};

// Guardar en synced-data.json
const outputPath = path.join(__dirname, 'src/remotion/synced-data.json');
fs.writeFileSync(outputPath, JSON.stringify(syncedData, null, 2));

console.log(`\n✅ Script viral preparado en: ${outputPath}`);
console.log('\n🚀 Ahora ejecuta:');
console.log(`   python3 generate.py`);
console.log(`   Selecciona opción 5 (Custom) y pon ${selectedScript.duration} segundos`);
console.log(`   Estilo: ${videoStyle}\n`);

// Guardar también información para referencia
const infoPath = path.join(__dirname, 'output/current-viral-script.json');
fs.writeFileSync(infoPath, JSON.stringify({
  script: selectedScript,
  syncedData: syncedData,
  preparedAt: new Date().toISOString()
}, null, 2));

console.log(`📝 Info guardada en: ${infoPath}\n`);