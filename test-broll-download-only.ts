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
 * Test diferentes estrategias de búsqueda de B-roll
 */
async function testBrollSearchStrategies() {
  console.log(`${colors.magenta}${'🔍'.repeat(30)}${colors.reset}`);
  console.log(`${colors.bright}${colors.white}   TEST DE BÚSQUEDA DE B-ROLL${colors.reset}`);
  console.log(`${colors.magenta}${'🔍'.repeat(30)}${colors.reset}\n`);
  
  // Cargar scripts virales para obtener los términos
  const scriptsPath = path.join(process.cwd(), 'data', 'viral-scripts.json');
  const scriptsData = JSON.parse(fs.readFileSync(scriptsPath, 'utf-8'));
  
  // Diferentes estrategias de búsqueda para probar
  const testCases = [
    {
      name: "Psicología - Ex vuelve",
      script: scriptsData.channel1_psychology[0],
      originalTerms: [
        "couple breaking up sad",
        "person walking away confident", 
        "brain scan neuroscience",
        "person looking at phone worried",
        "social media scrolling",
        "confident person posture",
        "neuron synapse animation"
      ],
      refinedTerms: [
        "couple arguing",
        "person walking alone",
        "brain MRI scan",
        "checking phone anxious",
        "scrolling instagram",
        "confident business person",
        "neural network visualization"
      ],
      simpleTerms: [
        "breakup",
        "walking",
        "brain",
        "phone",
        "social media",
        "confidence",
        "neurons"
      ]
    },
    {
      name: "Psicología - Gente exitosa",
      script: scriptsData.channel1_psychology[1],
      originalTerms: [
        "CEO business meeting",
        "brain prefrontal cortex",
        "harvard university study",
        "meditation businessman",
        "person writing journal",
        "brain scan activity",
        "successful entrepreneur working"
      ],
      refinedTerms: [
        "executive boardroom",
        "brain anatomy 3d",
        "university research lab",
        "meditation office",
        "journaling notebook",
        "fMRI brain imaging",
        "entrepreneur laptop"
      ],
      simpleTerms: [
        "CEO",
        "brain",
        "harvard",
        "meditation",
        "writing",
        "neuroscience",
        "success"
      ]
    },
    {
      name: "Psicología - Voz grabada",
      script: scriptsData.channel1_psychology[2],
      originalTerms: [
        "person recording voice microphone",
        "sound waves visualization",
        "skull bone structure xray",
        "person listening headphones shocked",
        "audio frequency graph",
        "brain anatomy illustration",
        "recording studio equipment"
      ],
      refinedTerms: [
        "recording microphone studio",
        "audio waveform animation",
        "skull xray medical",
        "headphones reaction surprised",
        "sound frequency spectrum",
        "brain cross section",
        "podcast recording setup"
      ],
      simpleTerms: [
        "microphone",
        "sound waves",
        "skull",
        "headphones",
        "audio",
        "brain",
        "studio"
      ]
    }
  ];
  
  // Crear directorio de salida para los tests
  const outputDir = path.join(process.cwd(), 'output', 'broll-test');
  await fs.promises.mkdir(outputDir, { recursive: true });
  
  // Resultados para comparación
  const results: any[] = [];
  
  for (const testCase of testCases) {
    console.log(`\n${colors.cyan}${'═'.repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}${colors.yellow}📹 ${testCase.name}${colors.reset}`);
    console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}\n`);
    
    // Test 1: Términos originales
    console.log(`${colors.blue}1️⃣ Probando términos ORIGINALES:${colors.reset}`);
    for (const term of testCase.originalTerms.slice(0, 3)) {
      console.log(`   • ${term}`);
    }
    
    const originalResults = await testSearchTerms(
      testCase.originalTerms,
      'original',
      testCase.name
    );
    
    // Test 2: Términos refinados
    console.log(`\n${colors.green}2️⃣ Probando términos REFINADOS:${colors.reset}`);
    for (const term of testCase.refinedTerms.slice(0, 3)) {
      console.log(`   • ${term}`);
    }
    
    const refinedResults = await testSearchTerms(
      testCase.refinedTerms,
      'refined',
      testCase.name
    );
    
    // Test 3: Términos simples
    console.log(`\n${colors.yellow}3️⃣ Probando términos SIMPLES:${colors.reset}`);
    for (const term of testCase.simpleTerms.slice(0, 3)) {
      console.log(`   • ${term}`);
    }
    
    const simpleResults = await testSearchTerms(
      testCase.simpleTerms,
      'simple',
      testCase.name
    );
    
    // Comparar resultados
    console.log(`\n${colors.magenta}📊 COMPARACIÓN DE RESULTADOS:${colors.reset}`);
    console.log(`   Original: ${originalResults.found}/${originalResults.total} encontrados`);
    console.log(`   Refinado: ${refinedResults.found}/${refinedResults.total} encontrados`);
    console.log(`   Simple:   ${simpleResults.found}/${simpleResults.total} encontrados`);
    
    results.push({
      script: testCase.name,
      original: originalResults,
      refined: refinedResults,
      simple: simpleResults
    });
  }
  
  // Resumen final
  console.log(`\n${colors.bright}${colors.green}${'✨'.repeat(30)}${colors.reset}`);
  console.log(`${colors.bright}${colors.white}   RESUMEN DE RESULTADOS${colors.reset}`);
  console.log(`${colors.bright}${colors.green}${'✨'.repeat(30)}${colors.reset}\n`);
  
  // Calcular totales
  let bestStrategy = { name: '', score: 0 };
  const strategies = ['original', 'refined', 'simple'];
  
  for (const strategy of strategies) {
    const total = results.reduce((sum, r) => sum + r[strategy].found, 0);
    const max = results.reduce((sum, r) => sum + r[strategy].total, 0);
    const percentage = (total / max * 100).toFixed(1);
    
    console.log(`${colors.cyan}${strategy.toUpperCase()}:${colors.reset} ${total}/${max} (${percentage}%)`);
    
    if (total > bestStrategy.score) {
      bestStrategy = { name: strategy, score: total };
    }
  }
  
  console.log(`\n${colors.green}🏆 MEJOR ESTRATEGIA: ${bestStrategy.name.toUpperCase()}${colors.reset}`);
  
  // Guardar reporte
  const report = {
    timestamp: new Date().toISOString(),
    results,
    bestStrategy,
    recommendations: generateRecommendations(results)
  };
  
  const reportPath = path.join(outputDir, 'broll-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n${colors.yellow}📄 Reporte guardado en: ${reportPath}${colors.reset}`);
  
  // Mostrar recomendaciones
  console.log(`\n${colors.bright}${colors.cyan}💡 RECOMENDACIONES PARA EL PROMPT DEL LLM:${colors.reset}`);
  for (const rec of report.recommendations) {
    console.log(`   • ${rec}`);
  }
}

/**
 * Test a specific set of search terms
 */
async function testSearchTerms(
  terms: string[],
  _strategy: string,
  _scriptName: string
): Promise<{ found: number, total: number, details: any[] }> {
  const details: any[] = [];
  let found = 0;
  
  for (const term of terms.slice(0, 3)) { // Test solo los primeros 3 para rapidez
    try {
      // Intentar buscar con Pexels API si está disponible
      const searchUrl = `https://api.pexels.com/videos/search?query=${encodeURIComponent(term)}&per_page=1`;
      
      if (process.env.PEXELS_API_KEY) {
        const response = await fetch(searchUrl, {
          headers: {
            'Authorization': process.env.PEXELS_API_KEY
          }
        });
        
        if (response.ok) {
          const data: any = await response.json();
          if (data.videos && data.videos.length > 0) {
            console.log(`      ✅ "${term}" -> ${data.total_results} resultados`);
            found++;
            details.push({ term, found: true, results: data.total_results });
          } else {
            console.log(`      ❌ "${term}" -> 0 resultados`);
            details.push({ term, found: false, results: 0 });
          }
        }
      } else {
        // Simular búsqueda sin API key
        const commonTerms = ['person', 'people', 'business', 'office', 'brain', 'phone', 'social', 'media'];
        const hasCommon = commonTerms.some(common => term.toLowerCase().includes(common));
        
        if (hasCommon) {
          console.log(`      ✅ "${term}" -> probablemente encontraría resultados`);
          found++;
          details.push({ term, found: true, simulated: true });
        } else {
          console.log(`      ❓ "${term}" -> término muy específico`);
          details.push({ term, found: false, simulated: true });
        }
      }
      
      // Pequeña pausa para no saturar la API
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.log(`      ⚠️  "${term}" -> error en búsqueda`);
      details.push({ term, found: false, error: true });
    }
  }
  
  return {
    found,
    total: terms.slice(0, 3).length,
    details
  };
}

/**
 * Generate recommendations based on test results
 */
function generateRecommendations(results: any[]): string[] {
  const recommendations: string[] = [];
  
  // Analizar qué estrategia funcionó mejor
  const strategyScores = {
    original: results.reduce((sum, r) => sum + r.original.found, 0),
    refined: results.reduce((sum, r) => sum + r.refined.found, 0),
    simple: results.reduce((sum, r) => sum + r.simple.found, 0)
  };
  
  const best = Object.entries(strategyScores).sort((a, b) => b[1] - a[1])[0][0];
  
  if (best === 'simple') {
    recommendations.push('Usa términos SIMPLES de una sola palabra cuando sea posible');
    recommendations.push('Evita frases largas y específicas');
    recommendations.push('Ejemplo: "brain" en lugar de "brain prefrontal cortex"');
  } else if (best === 'refined') {
    recommendations.push('Usa términos de 2-3 palabras máximo');
    recommendations.push('Sé específico pero no demasiado técnico');
    recommendations.push('Ejemplo: "brain anatomy" en lugar de "brain prefrontal cortex illustration"');
  } else {
    recommendations.push('Los términos originales funcionan, pero podrían mejorarse');
  }
  
  // Recomendaciones generales
  recommendations.push('Evita términos muy específicos o técnicos');
  recommendations.push('Usa términos genéricos que tengan más probabilidad de tener stock footage');
  recommendations.push('Incluye alternativas: si buscas "CEO", también incluye "business person", "executive"');
  recommendations.push('Para conceptos abstractos, usa visualizaciones comunes: "success" -> "trophy", "celebration"');
  
  return recommendations;
}

// Ejecutar el test
if (require.main === module) {
  testBrollSearchStrategies()
    .then(() => {
      console.log(`\n${colors.green}✅ Test completado!${colors.reset}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`\n${colors.red}❌ Error:${colors.reset}`, error);
      process.exit(1);
    });
}

export { testBrollSearchStrategies };