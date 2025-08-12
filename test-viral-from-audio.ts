#!/usr/bin/env ts-node

import { ViralVideoProcessorFixed } from './src/video/ViralVideoProcessorFixed';
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

async function testViralFromAudio() {
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}🎬 PRUEBA VIRAL CON AUDIOS EXISTENTES${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

  try {
    // Cargar el script viral
    const scriptsPath = path.join(process.cwd(), 'data', 'viral-scripts.json');
    const scriptsData = JSON.parse(await fs.readFile(scriptsPath, 'utf-8'));
    
    // Usar el primer script de psicología
    const viralScript = scriptsData.channel1_psychology[0];
    
    console.log(`${colors.green}✅ Script cargado: ${viralScript.title}${colors.reset}`);
    console.log(`   Duración: ${viralScript.duration}s`);
    console.log(`   B-roll términos: ${viralScript.brollSearchTerms?.length || 0}`);
    
    // Verificar que existan los audios
    const audioDir = path.join(process.cwd(), 'output', 'audio');
    const audioFiles = await fs.readdir(audioDir);
    const combinedAudio = audioFiles.find(f => f.includes('combined') && f.endsWith('.wav'));
    
    if (!combinedAudio) {
      console.log(`${colors.red}❌ No se encontró audio combinado${colors.reset}`);
      return;
    }
    
    console.log(`${colors.green}✅ Audio encontrado: ${combinedAudio}${colors.reset}`);
    
    // Crear el procesador (el mismo que usa el script original)
    const processor = new ViralVideoProcessorFixed();
    
    // Escuchar eventos de progreso
    processor.on('progress', (data) => {
      console.log(`${colors.cyan}   [${data.progress}%] ${data.message}${colors.reset}`);
    });
    
    console.log(`\n${colors.yellow}🚀 Iniciando generación de video...${colors.reset}`);
    console.log(`${colors.yellow}   NOTA: Esto usará el proceso EXACTO del script original${colors.reset}\n`);
    
    // HACK: Modificar temporalmente el processor para que no regenere audio
    const originalMethod = processor['processViralScript'];
    processor['processViralScript'] = async function(script: any) {
      console.log(`${colors.blue}🔧 Interceptando para usar audio existente...${colors.reset}`);
      
      // Copiar el audio existente a donde el processor espera encontrarlo
      const expectedAudioPath = path.join(process.cwd(), 'output', 'temp', 'combined_audio.wav');
      const tempDir = path.join(process.cwd(), 'output', 'temp');
      await fs.mkdir(tempDir, { recursive: true });
      
      const sourcePath = path.join(audioDir, combinedAudio);
      await fs.copyFile(sourcePath, expectedAudioPath);
      
      console.log(`${colors.green}✅ Audio copiado a ubicación esperada${colors.reset}`);
      
      // Ahora llamar al método original (pero sin regenerar audio)
      // El SyncedVideoGenerator interno detectará el audio existente
      return originalMethod.call(this, script);
    };
    
    // Procesar el video
    const videoPath = await processor.processViralScript(viralScript);
    
    console.log(`\n${colors.green}${'✨'.repeat(30)}${colors.reset}`);
    console.log(`${colors.bright}${colors.green}✅ VIDEO GENERADO EXITOSAMENTE${colors.reset}`);
    console.log(`${colors.green}${'✨'.repeat(30)}${colors.reset}\n`);
    console.log(`📹 Ubicación: ${videoPath}`);
    console.log(`\n${colors.cyan}Puedes ver el video con:${colors.reset}`);
    console.log(`${colors.bright}open "${videoPath}"${colors.reset}\n`);
    
  } catch (error) {
    console.error(`${colors.red}❌ Error:${colors.reset}`, error);
  }
}

// Ejecutar
if (require.main === module) {
  testViralFromAudio()
    .then(() => {
      console.log(`${colors.green}✅ Proceso completado${colors.reset}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`${colors.red}❌ Error fatal:${colors.reset}`, error);
      process.exit(1);
    });
}

export { testViralFromAudio };