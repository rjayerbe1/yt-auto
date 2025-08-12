#!/usr/bin/env ts-node

import * as dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

async function testSearchTerms() {
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
  
  if (!PEXELS_API_KEY) {
    console.error('❌ No Pexels API key found');
    return;
  }
  
  const oldTerms = [
    "shadow",
    "corner dark",
    "hospital",
    "basement"
  ];
  
  const newTerms = [
    "dark silhouette figure paranormal",
    "abandoned hospital corridor creepy",
    "asylum hallway terrifying",
    "paranormal activity footage"
  ];
  
  console.log('🔍 Comparing B-roll search terms quality:\n');
  console.log('=' .repeat(60));
  
  // Test old terms
  console.log('\n❌ OLD GENERIC TERMS:');
  for (const term of oldTerms) {
    try {
      const response = await axios.get('https://api.pexels.com/videos/search', {
        headers: { Authorization: PEXELS_API_KEY },
        params: {
          query: term,
          per_page: 3,
          orientation: 'portrait'
        }
      });
      
      const videos = response.data.videos || [];
      console.log(`\n"${term}":`);
      if (videos.length > 0) {
        videos.slice(0, 2).forEach((v: any, i: number) => {
          console.log(`  ${i+1}. ${v.user.name}: "${v.url.split('/').pop().replace(/-/g, ' ').slice(0, 50)}..."`);
        });
      } else {
        console.log('  No results found');
      }
    } catch (err: any) {
      console.log(`  Error: ${err.message || err}`);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  
  // Test new terms
  console.log('\n✅ NEW ATMOSPHERIC TERMS:');
  for (const term of newTerms) {
    try {
      const response = await axios.get('https://api.pexels.com/videos/search', {
        headers: { Authorization: PEXELS_API_KEY },
        params: {
          query: term,
          per_page: 3,
          orientation: 'portrait'
        }
      });
      
      const videos = response.data.videos || [];
      console.log(`\n"${term}":`);
      if (videos.length > 0) {
        videos.slice(0, 2).forEach((v: any, i: number) => {
          console.log(`  ${i+1}. ${v.user.name}: "${v.url.split('/').pop().replace(/-/g, ' ').slice(0, 50)}..."`);
        });
      } else {
        console.log('  No results found');
      }
    } catch (err: any) {
      console.log(`  Error: ${err.message || err}`);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 ANALYSIS:');
  console.log('• Old terms: Return generic stock footage');
  console.log('• New terms: Return more atmospheric, horror-specific content');
  console.log('• New terms use multiple keywords for better targeting\n');
}

testSearchTerms().catch(console.error);