#!/usr/bin/env ts-node

import * as dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

async function testPsychologyTerms() {
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
  
  if (!PEXELS_API_KEY) {
    console.error('❌ No Pexels API key found');
    return;
  }
  
  console.log('🧠 Testing Psychology B-roll Search Terms\n');
  console.log('=' .repeat(60));
  
  // Old generic terms
  const oldTerms = [
    "brain",
    "CEO office", 
    "couple arguing",
    "anxiety",
    "workplace"
  ];
  
  // New improved terms
  const newTerms = [
    "neural network brain visualization",
    "executive boardroom luxury office",
    "couple silhouette dramatic breakup",
    "anxiety attack visualization abstract",
    "corporate workplace stress pressure"
  ];
  
  console.log('\n❌ OLD GENERIC TERMS:\n');
  
  for (const term of oldTerms) {
    try {
      const response = await axios.get('https://api.pexels.com/videos/search', {
        headers: { Authorization: PEXELS_API_KEY },
        params: {
          query: term,
          per_page: 2,
          orientation: 'portrait'
        }
      });
      
      const count = response.data.total_results || 0;
      console.log(`"${term}"`);
      console.log(`  📊 ${count} results found`);
      
      if (response.data.videos?.[0]) {
        const video = response.data.videos[0];
        console.log(`  📹 First result: "${video.url.split('/').pop().replace(/-/g, ' ').slice(0, 40)}..."`);
      }
      console.log('');
      
    } catch (err: any) {
      console.log(`  Error: ${err.message || err}\n`);
    }
  }
  
  console.log('=' .repeat(60));
  console.log('\n✅ NEW CINEMATIC TERMS:\n');
  
  for (const term of newTerms) {
    try {
      const response = await axios.get('https://api.pexels.com/videos/search', {
        headers: { Authorization: PEXELS_API_KEY },
        params: {
          query: term,
          per_page: 2,
          orientation: 'portrait'
        }
      });
      
      const count = response.data.total_results || 0;
      console.log(`"${term}"`);
      console.log(`  📊 ${count} results found`);
      
      if (response.data.videos?.[0]) {
        const video = response.data.videos[0];
        console.log(`  📹 First result: "${video.url.split('/').pop().replace(/-/g, ' ').slice(0, 40)}..."`);
      }
      console.log('');
      
    } catch (err: any) {
      console.log(`  Error: ${err.message || err}\n`);
    }
  }
  
  console.log('=' .repeat(60));
  console.log('\n📊 ANALYSIS:\n');
  console.log('• Old terms: Too generic, return basic stock footage');
  console.log('• New terms: More specific and cinematic');
  console.log('• New terms combine multiple concepts for better targeting');
  console.log('• Better for abstract psychology concepts\n');
  
  // Test downloading with new terms
  console.log('🎬 Testing actual download with improved terms...\n');
  
  const { ViralBrollFinder } = await import('./src/services/ViralBrollFinder');
  const finder = new ViralBrollFinder();
  
  const psychTerms = [
    "neural network brain visualization",
    "executive boardroom luxury office",
    "meditation mindfulness zen peaceful",
    "emotional intelligence concept abstract",
    "mind psychology concept art",
    "neuroscience laboratory research"
  ];
  
  const videos = await finder.findViralBroll(
    "Psychology of success and emotional intelligence",
    30,
    ["psychology", "success", "neuroscience"],
    psychTerms
  );
  
  console.log(`✅ Downloaded ${videos.length} videos for psychology content`);
  console.log('Check output/broll folder for results\n');
}

testPsychologyTerms().catch(console.error);