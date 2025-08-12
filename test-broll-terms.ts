#!/usr/bin/env ts-node

import * as dotenv from 'dotenv';
dotenv.config();

import { ViralBrollFinder } from './src/services/ViralBrollFinder';
import * as fs from 'fs/promises';
import * as path from 'path';

async function testBrollTerms() {
  console.log('🔍 Testing B-roll search terms for horror content...\n');
  
  const finder = new ViralBrollFinder();
  
  // Test con los nuevos términos mejorados
  const horrorTerms = [
    "abandoned hospital corridor creepy",
    "hospital morgue dark", 
    "medical facility horror night",
    "asylum hallway terrifying",
    "paranormal activity footage",
    "dark silhouette figure",
    "haunted room atmosphere",
    "security camera glitch horror"
  ];
  
  console.log('📋 Testing these search terms:');
  horrorTerms.forEach((term, i) => {
    console.log(`  ${i + 1}. ${term}`);
  });
  console.log('');
  
  try {
    // Simular una búsqueda de 30 segundos de video
    const duration = 30;
    const scriptText = "Horror hospital story with paranormal activity";
    const tags = ["horror", "hospital", "supernatural"];
    
    console.log('⏳ Searching and downloading B-roll videos...\n');
    
    const videos = await finder.findViralBroll(
      scriptText,
      duration,
      tags,
      horrorTerms
    );
    
    console.log(`\n✅ Downloaded ${videos.length} videos:`);
    
    for (const video of videos) {
      const filename = path.basename(video);
      const stats = await fs.stat(video).catch(() => null);
      const sizeMB = stats ? (stats.size / 1024 / 1024).toFixed(2) : 'N/A';
      console.log(`  📹 ${filename} (${sizeMB} MB)`);
    }
    
    console.log('\n🎬 Test complete! Check the output/broll folder to review the videos.');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Run the test
testBrollTerms().catch(console.error);