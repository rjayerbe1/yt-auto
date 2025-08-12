import { logger } from './src/utils/logger';

function testCurrencyMerge() {
  // Test text with currency
  const testCases = [
    "You can save $ 500 per month",
    "The price is $100 today",
    "Get 50% off on items over $200",
    "Speed limit is 100 km per hour",
    "The temperature is 25°C today"
  ];
  
  logger.info('Testing currency and unit merging logic:\n');
  
  testCases.forEach(text => {
    logger.info(`Original: "${text}"`);
    
    // Simulate the word splitting and merging logic
    let words = text.split(/\s+/).filter(word => word.length > 0);
    logger.info(`  Split words: [${words.map(w => `"${w}"`).join(', ')}]`);
    
    // Merge currency symbols with following numbers
    const mergedWords: string[] = [];
    for (let i = 0; i < words.length; i++) {
      if (words[i] === '$' && i + 1 < words.length && /^\d/.test(words[i + 1])) {
        // Merge $ with the following number
        mergedWords.push(words[i] + words[i + 1]);
        i++; // Skip the next word
      } else if (/\$$/.test(words[i]) && i + 1 < words.length && /^\d/.test(words[i + 1])) {
        // Merge words ending with $ with following number
        mergedWords.push(words[i] + words[i + 1]);
        i++;
      } else if (/\d$/.test(words[i]) && i + 1 < words.length && /^(%|km|kg|m|cm|mm|ft|in|mph|kph|°C|°F)/.test(words[i + 1])) {
        // Merge numbers with following units
        mergedWords.push(words[i] + words[i + 1]);
        i++;
      } else {
        mergedWords.push(words[i]);
      }
    }
    
    logger.info(`  Merged words: [${mergedWords.map(w => `"${w}"`).join(', ')}]`);
    logger.info('');
  });
  
  logger.info('✅ Currency merge test complete!');
}

testCurrencyMerge();