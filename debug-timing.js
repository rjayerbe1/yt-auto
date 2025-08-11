const fs = require('fs');

// Leer el archivo synced-data.json
const data = JSON.parse(fs.readFileSync('src/remotion/synced-data.json', 'utf8'));

console.log('=== ANÁLISIS DE TIMING ===\n');
console.log('Total duration:', data.totalDuration);
console.log('Segments:', data.segments.length);

data.segments.forEach((segment, i) => {
  console.log(`\nSegmento ${i + 1}:`);
  console.log('  Text:', segment.text);
  console.log('  Duration:', segment.duration);
  console.log('  Start/End:', segment.startTime, '-', segment.endTime);
  console.log('  Word timings:', segment.wordTimings?.length || 0);
  
  if (segment.wordTimings && segment.wordTimings.length > 0) {
    const firstWord = segment.wordTimings[0];
    console.log('  Primer word:');
    console.log('    word:', firstWord.word);
    console.log('    startTime:', firstWord.startTime);
    console.log('    endTime:', firstWord.endTime);
  }
  
  if (segment.captions && segment.captions.length > 0) {
    const firstCaption = segment.captions[0];
    console.log('  Primer caption:');
    console.log('    text:', firstCaption.text);
    console.log('    startMs:', firstCaption.startMs);
    console.log('    endMs:', firstCaption.endMs);
  }
});

console.log('\n=== PROBLEMA DETECTADO ===');
console.log('Los timestamps son null, lo que indica que:');
console.log('1. Whisper está fallando (no devuelve segments)');
console.log('2. El fallback no está asignando valores correctamente');