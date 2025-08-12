import { Caption } from './WhisperTranscriber';
import { logger } from '../utils/logger';

/**
 * Service to merge incorrectly split words from Whisper transcription
 */
export class WhisperWordMerger {
  
  /**
   * Patterns of words that should be merged
   */
  private readonly mergePatterns = [
    // Common word splits
    { pattern: /^Un$/i, next: /^conscious$/i, merged: 'Unconscious' },
    { pattern: /^Em$/i, next: /^otional$/i, merged: 'Emotional' },
    { pattern: /^Rad$/i, next: /^ar$/i, merged: 'Radar' },
    { pattern: /^pre$/i, next: /^front$/i, merged: 'prefrontal' },
    { pattern: /^al$/i, prev: /^front$/i, merged: 'frontal' },
    { pattern: /^ind$/i, next: /^if$/i, merged: 'indif' },
    { pattern: /^ference$/i, prev: /^if$/i, merged: 'difference' },
    { pattern: /^ch$/i, next: /^ases$/i, merged: 'chases' },
    { pattern: /^unatt$/i, next: /^ain$/i, merged: 'unattain' },
    { pattern: /^able$/i, prev: /^ain$/i, merged: 'attainable' },
    { pattern: /^ign$/i, next: /^ores$/i, merged: 'ignores' },
    { pattern: /^fir$/i, next: /^mer$/i, merged: 'firmer' },
    { pattern: /^ex$/i, next: /^es$/i, merged: 'ex\'s' },
    { pattern: /^s$/i, next: /^ign$/i, merged: 'sign' },
    { pattern: /^als$/i, prev: /^ign$/i, merged: 'signals' },
    
    // Contractions
    { pattern: /^won$/i, next: /^'t$/i, merged: 'won\'t' },
    { pattern: /^doesn$/i, next: /^'t$/i, merged: 'doesn\'t' },
    { pattern: /^didn$/i, next: /^'t$/i, merged: 'didn\'t' },
    { pattern: /^hasn$/i, next: /^'t$/i, merged: 'hasn\'t' },
    { pattern: /^hadn$/i, next: /^'t$/i, merged: 'hadn\'t' },
    { pattern: /^weren$/i, next: /^'t$/i, merged: 'weren\'t' },
    { pattern: /^aren$/i, next: /^'t$/i, merged: 'aren\'t' },
    { pattern: /^isn$/i, next: /^'t$/i, merged: 'isn\'t' },
    { pattern: /^wasn$/i, next: /^'t$/i, merged: 'wasn\'t' },
    { pattern: /^couldn$/i, next: /^'t$/i, merged: 'couldn\'t' },
    { pattern: /^wouldn$/i, next: /^'t$/i, merged: 'wouldn\'t' },
    { pattern: /^shouldn$/i, next: /^'t$/i, merged: 'shouldn\'t' },
    
    // Common splits in horror/psychology content
    { pattern: /^grow$/i, next: /^ling$/i, merged: 'growling' },
    { pattern: /^compartment$/i, next: /^al$/i, merged: 'compartmental' },
    { pattern: /^ization$/i, prev: /^al$/i, merged: 'alization' },
    { pattern: /^neuro$/i, next: /^science$/i, merged: 'neuroscience' },
    
    // Numbers/time
    { pattern: /^3$/i, next: /^:$/i, nextNext: /^33$/i, merged: '3:33' },
    { pattern: /^000$/i, prev: /^,$/i, merged: ',000' },
  ];
  
  /**
   * Merge split words in captions
   */
  public mergeSplitWords(captions: Caption[]): Caption[] {
    if (!captions || captions.length === 0) {
      return captions;
    }
    
    const mergedCaptions: Caption[] = [];
    let i = 0;
    
    while (i < captions.length) {
      const current = captions[i];
      const next = captions[i + 1];
      const prev = mergedCaptions[mergedCaptions.length - 1];
      
      // Clean text (remove leading/trailing spaces but keep internal)
      const currentText = current.text.trim();
      
      // Check if current word should be merged with next
      let merged = false;
      
      // Check for patterns that merge with next word
      if (next) {
        const nextText = next.text.trim();
        
        for (const mergeRule of this.mergePatterns) {
          if (mergeRule.next && 
              mergeRule.pattern.test(currentText) && 
              mergeRule.next.test(nextText)) {
            
            // Merge current and next
            mergedCaptions.push({
              text: mergeRule.merged || `${currentText}${nextText}`,
              startMs: current.startMs,
              endMs: next.endMs,
              timestampMs: Math.round((current.startMs + next.endMs) / 2),
              confidence: Math.min(current.confidence || 1, next.confidence || 1)
            });
            
            i += 2; // Skip both words
            merged = true;
            logger.debug(`Merged: "${currentText}" + "${nextText}" -> "${mergeRule.merged || currentText + nextText}"`);
            break;
          }
        }
      }
      
      // Check for patterns that merge with previous word
      if (!merged && prev) {
        const prevText = prev.text.trim();
        
        for (const mergeRule of this.mergePatterns) {
          if (mergeRule.prev && 
              mergeRule.prev.test(prevText) && 
              mergeRule.pattern.test(currentText)) {
            
            // Update the previous caption
            const lastCaption = mergedCaptions[mergedCaptions.length - 1];
            lastCaption.text = mergeRule.merged || `${prevText}${currentText}`;
            lastCaption.endMs = current.endMs;
            lastCaption.timestampMs = Math.round((lastCaption.startMs + current.endMs) / 2);
            
            i++;
            merged = true;
            logger.debug(`Merged with previous: "${prevText}" + "${currentText}" -> "${mergeRule.merged || prevText + currentText}"`);
            break;
          }
        }
      }
      
      // Special case: merge single-character punctuation with previous word
      if (!merged && currentText.length === 1 && /^[.,!?;:'")\]}]$/.test(currentText) && prev) {
        const lastCaption = mergedCaptions[mergedCaptions.length - 1];
        lastCaption.text = `${lastCaption.text}${currentText}`;
        lastCaption.endMs = current.endMs;
        lastCaption.timestampMs = Math.round((lastCaption.startMs + current.endMs) / 2);
        i++;
        merged = true;
      }
      
      // Special case: merge quotes and parentheses
      if (!merged && /^["'(\[{]$/.test(currentText) && next) {
        const nextText = next.text.trim();
        mergedCaptions.push({
          text: `${currentText}${nextText}`,
          startMs: current.startMs,
          endMs: next.endMs,
          timestampMs: Math.round((current.startMs + next.endMs) / 2),
          confidence: Math.min(current.confidence || 1, next.confidence || 1)
        });
        i += 2;
        merged = true;
      }
      
      // If no merge happened, add as-is
      if (!merged) {
        mergedCaptions.push(current);
        i++;
      }
    }
    
    logger.info(`📝 Word merging: ${captions.length} words -> ${mergedCaptions.length} words`);
    return mergedCaptions;
  }
  
  /**
   * Post-process captions to fix common issues
   */
  public postProcess(captions: Caption[]): Caption[] {
    // First merge split words
    let processed = this.mergeSplitWords(captions);
    
    // Remove empty captions
    processed = processed.filter(c => c.text.trim().length > 0);
    
    // Fix timing overlaps
    for (let i = 1; i < processed.length; i++) {
      if (processed[i].startMs < processed[i - 1].endMs) {
        processed[i].startMs = processed[i - 1].endMs;
      }
    }
    
    return processed;
  }
}