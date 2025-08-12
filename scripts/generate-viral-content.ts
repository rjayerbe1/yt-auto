import fs from 'fs';
import path from 'path';
import { VideoGenerator } from '../src/video/VideoGenerator';
import { SyncedVideoGenerator } from '../src/video/SyncedVideoGenerator';

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

interface ViralScriptsData {
  channel1_psychology: ViralScript[];
  channel2_horror: ViralScript[];
}

async function generateViralVideo(script: ViralScript, channelType: 'psychology' | 'horror') {
  console.log(`\n🎬 Generando video: ${script.title}`);
  console.log(`📊 Views esperadas: ${script.expectedViews}`);
  console.log(`🎨 Estilo: ${script.style}`);
  
  const generator = new SyncedVideoGenerator();
  
  // Mapear estilos a números (del 1 al 6)
  const styleMap: Record<string, number> = {
    'modern_gradient': 2,
    'minimalist': 4,
    'neon_cyberpunk': 3,
    'dynamic': 6,
    'dark_horror': 3,
    'glitch_tech': 6,
    'hospital_horror': 3,
    'professional': 4
  };
  
  const videoStyle = styleMap[script.style] || 1;
  
  try {
    // Crear directorio de salida si no existe
    const outputDir = path.join(process.cwd(), 'output', 'viral-content', channelType);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, `${script.id}.mp4`);
    
    // Generar el video
    await generator.generateVideo({
      topic: script.title,
      script: script.script,
      style: videoStyle,
      outputPath,
      voice: channelType === 'psychology' ? 'professional' : 'dramatic'
    });
    
    console.log(`✅ Video generado: ${outputPath}`);
    
    // Guardar metadata
    const metadataPath = path.join(outputDir, `${script.id}_metadata.json`);
    fs.writeFileSync(metadataPath, JSON.stringify({
      ...script,
      videoPath: outputPath,
      generatedAt: new Date().toISOString(),
      videoStyle
    }, null, 2));
    
  } catch (error) {
    console.error(`❌ Error generando video ${script.id}:`, error);
  }
}

async function main() {
  // Cargar scripts virales
  const scriptsPath = path.join(process.cwd(), 'data', 'viral-scripts.json');
  const scriptsData: ViralScriptsData = JSON.parse(fs.readFileSync(scriptsPath, 'utf-8'));
  
  console.log('🚀 Iniciando generación de contenido viral\n');
  
  // Preguntar qué canal generar
  const args = process.argv.slice(2);
  const channel = args[0] || 'both';
  const limit = parseInt(args[1]) || 2; // Límite de videos por canal
  
  if (channel === 'psychology' || channel === 'both') {
    console.log('\n📚 CANAL 1: PSICOLOGÍA Y DRAMA\n');
    const psychScripts = scriptsData.channel1_psychology.slice(0, limit);
    
    for (const script of psychScripts) {
      await generateViralVideo(script, 'psychology');
    }
  }
  
  if (channel === 'horror' || channel === 'both') {
    console.log('\n👻 CANAL 2: HORROR Y CREEPYPASTA\n');
    const horrorScripts = scriptsData.channel2_horror.slice(0, limit);
    
    for (const script of horrorScripts) {
      await generateViralVideo(script, 'horror');
    }
  }
  
  console.log('\n✨ Generación completada!');
  console.log('📁 Videos guardados en: output/viral-content/');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

export { generateViralVideo };