import { Caption } from './WhisperTranscriber';
import { logger } from '../utils/logger';

/**
 * Service to align original script words with Whisper timestamps
 * This solves the word splitting problem by using the original text
 */
export class WordAligner {
  
  /**
   * Align original script words with Whisper-detected timestamps
   * @param originalText - The original script text with correct word boundaries
   * @param whisperCaptions - The captions from Whisper with timestamps
   * @returns Captions with original words and Whisper timestamps
   */
  alignWordsWithTimestamps(originalText: string, whisperCaptions: Caption[]): Caption[] {
    logger.info('🔄 Aligning original words with Whisper timestamps...');
    
    // Clean and split original text into words
    const originalWords = this.tokenizeText(originalText);
    
    // Get Whisper words for comparison
    const whisperWords = whisperCaptions.map(c => this.normalizeWord(c.text));
    
    logger.info(`📊 Original words: ${originalWords.length}, Whisper words: ${whisperWords.length}`);
    
    // Use dynamic programming to find best alignment
    const alignment = this.findBestAlignment(originalWords, whisperWords);
    
    // Create new captions with original words and aligned timestamps
    const alignedCaptions: Caption[] = [];
    
    for (const [origIndex, whisperIndices] of alignment) {
      if (whisperIndices.length === 0) {
        // No match found - estimate timing
        logger.warn(`⚠️ No timestamp for word: "${originalWords[origIndex]}"`);
        continue;
      }
      
      // Merge timestamps from all matched Whisper words
      const startMs = whisperCaptions[whisperIndices[0]].startMs;
      const endMs = whisperCaptions[whisperIndices[whisperIndices.length - 1]].endMs;
      
      alignedCaptions.push({
        text: originalWords[origIndex],
        startMs: startMs,
        endMs: endMs,
        timestampMs: Math.round((startMs + endMs) / 2),
        confidence: whisperCaptions[whisperIndices[0]].confidence
      });
    }
    
    logger.info(`✅ Aligned ${alignedCaptions.length} words with timestamps`);
    
    // Fill in any missing timestamps by interpolation
    this.interpolateMissingTimestamps(alignedCaptions, whisperCaptions);
    
    return alignedCaptions;
  }
  
  /**
   * Tokenize text into words, preserving punctuation attached to words
   */
  private tokenizeText(text: string): string[] {
    // Split by spaces but keep punctuation with words
    const words = text.match(/[\w']+[.,!?;:]?|[.,!?;:]/g) || [];
    return words.map(w => w.trim()).filter(w => w.length > 0);
  }
  
  /**
   * Normalize word for comparison (lowercase, remove punctuation)
   */
  private normalizeWord(word: string): string {
    return word.toLowerCase().replace(/[^a-z0-9']/g, '');
  }
  
  /**
   * Find best alignment between original and Whisper words using dynamic programming
   */
  private findBestAlignment(originalWords: string[], whisperWords: string[]): Map<number, number[]> {
    const alignment = new Map<number, number[]>();
    
    let whisperIndex = 0;
    
    for (let origIndex = 0; origIndex < originalWords.length; origIndex++) {
      const origWord = this.normalizeWord(originalWords[origIndex]);
      const matchedIndices: number[] = [];
      
      // Look for matching word(s) in Whisper output
      let searchStart = Math.max(0, whisperIndex - 3); // Allow some backward search
      let searchEnd = Math.min(whisperWords.length, whisperIndex + 10); // Look ahead
      
      for (let wi = searchStart; wi < searchEnd; wi++) {
        if (this.wordsMatch(origWord, whisperWords[wi])) {
          matchedIndices.push(wi);
          whisperIndex = wi + 1; // Move forward
          break; // Found a match, continue to next original word
        }
        
        // Check if Whisper split this word
        if (wi < whisperWords.length - 1) {
          const combined = whisperWords[wi] + whisperWords[wi + 1];
          if (this.wordsMatch(origWord, combined)) {
            matchedIndices.push(wi, wi + 1);
            whisperIndex = wi + 2;
            break;
          }
        }
        
        // Check three-word combination for very split words
        if (wi < whisperWords.length - 2) {
          const combined = whisperWords[wi] + whisperWords[wi + 1] + whisperWords[wi + 2];
          if (this.wordsMatch(origWord, combined)) {
            matchedIndices.push(wi, wi + 1, wi + 2);
            whisperIndex = wi + 3;
            break;
          }
        }
      }
      
      // If no exact match, try fuzzy matching
      if (matchedIndices.length === 0 && whisperIndex < whisperWords.length) {
        if (this.fuzzyMatch(origWord, whisperWords[whisperIndex])) {
          matchedIndices.push(whisperIndex);
          whisperIndex++;
        }
      }
      
      alignment.set(origIndex, matchedIndices);
    }
    
    return alignment;
  }
  
  /**
   * Check if two words match (exact or close enough)
   */
  private wordsMatch(word1: string, word2: string): boolean {
    if (word1 === word2) return true;
    
    // Check if one is substring of other (for contractions)
    if (word1.includes(word2) || word2.includes(word1)) return true;
    
    // Check common variations
    const variations: Record<string, string[]> = {
      'wont': ['won', 't'],
      'dont': ['don', 't'],
      'cant': ['can', 't'],
      'shouldnt': ['shouldn', 't'],
      'wouldnt': ['wouldn', 't'],
      'couldnt': ['couldn', 't'],
      'hasnt': ['hasn', 't'],
      'havent': ['haven', 't'],
      'isnt': ['isn', 't'],
      'arent': ['aren', 't'],
      'wasnt': ['wasn', 't'],
      'werent': ['weren', 't'],
      'didnt': ['didn', 't'],
      'doesnt': ['doesn', 't']
    };
    
    for (const [full, parts] of Object.entries(variations)) {
      if (word1 === full && word2 === parts.join('')) return true;
      if (word2 === full && word1 === parts.join('')) return true;
    }
    
    return false;
  }
  
  /**
   * Fuzzy matching for words with minor differences
   */
  private fuzzyMatch(word1: string, word2: string): boolean {
    // Calculate Levenshtein distance
    const maxDist = Math.max(1, Math.floor(Math.min(word1.length, word2.length) * 0.3));
    return this.levenshteinDistance(word1, word2) <= maxDist;
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  /**
   * Fill in missing timestamps by interpolation
   */
  private interpolateMissingTimestamps(captions: Caption[], whisperCaptions: Caption[]): void {
    if (captions.length === 0) return;
    
    const totalDuration = whisperCaptions[whisperCaptions.length - 1]?.endMs || 0;
    
    for (let i = 0; i < captions.length; i++) {
      if (!captions[i].startMs || !captions[i].endMs) {
        // Find previous and next captions with timestamps
        let prevIndex = i - 1;
        let nextIndex = i + 1;
        
        while (prevIndex >= 0 && !captions[prevIndex].endMs) prevIndex--;
        while (nextIndex < captions.length && !captions[nextIndex].startMs) nextIndex++;
        
        const prevEnd = prevIndex >= 0 ? captions[prevIndex].endMs : 0;
        const nextStart = nextIndex < captions.length ? captions[nextIndex].startMs : totalDuration;
        
        // Estimate timing for this word
        const gapDuration = nextStart - prevEnd;
        const wordsInGap = nextIndex - prevIndex - 1;
        const timePerWord = gapDuration / (wordsInGap + 1);
        
        const wordPosition = i - prevIndex;
        captions[i].startMs = Math.round(prevEnd + (timePerWord * wordPosition));
        captions[i].endMs = Math.round(captions[i].startMs + timePerWord);
        captions[i].timestampMs = Math.round((captions[i].startMs + captions[i].endMs) / 2);
        
        logger.debug(`Interpolated timing for "${captions[i].text}": ${captions[i].startMs}-${captions[i].endMs}ms`);
      }
    }
  }
}

// Export singleton instance
export const wordAligner = new WordAligner();