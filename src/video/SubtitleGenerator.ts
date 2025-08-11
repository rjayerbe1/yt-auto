import fs from 'fs/promises';
import path from 'path';
import { Script, ScriptSegment } from '../types';
import { createLogger } from '../utils/logger';

export class SubtitleGenerator {
  private logger = createLogger('SubtitleGenerator');

  async generate(script: Script, audioPath?: string): Promise<string> {
    try {
      this.logger.info(`Generating subtitles for script: ${script.id}`);

      // Generate SRT format subtitles
      const srtContent = this.generateSRT(script);
      
      // Save SRT file
      const outputPath = path.join(
        process.cwd(),
        'output',
        'subtitles',
        `${script.id}.srt`
      );

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, srtContent, 'utf-8');

      // If audio provided, could use speech recognition for more accurate timing
      if (audioPath) {
        // This would integrate with services like AssemblyAI or Rev.ai
        // for automatic transcription and timing
      }

      this.logger.info(`Subtitles generated: ${outputPath}`);
      return outputPath;
    } catch (error) {
      this.logger.error('Error generating subtitles:', error);
      throw error;
    }
  }

  private generateSRT(script: Script): string {
    const srtLines: string[] = [];
    let subtitleIndex = 1;

    // Add hook as first subtitle
    if (script.hook) {
      srtLines.push(
        this.createSRTEntry(
          subtitleIndex++,
          0,
          3,
          this.formatSubtitleText(script.hook)
        )
      );
    }

    // Process script segments
    script.content.forEach((segment) => {
      if (segment.type === 'narration' || segment.type === 'text_overlay') {
        const lines = this.splitIntoSubtitleLines(segment.content);
        const segmentDuration = segment.endTime - segment.startTime;
        const lineDuration = segmentDuration / lines.length;

        lines.forEach((line, index) => {
          const startTime = segment.startTime + (index * lineDuration);
          const endTime = startTime + lineDuration;
          
          srtLines.push(
            this.createSRTEntry(
              subtitleIndex++,
              startTime,
              endTime,
              this.formatSubtitleText(line)
            )
          );
        });
      }
    });

    // Add CTA as last subtitle
    if (script.callToAction) {
      const ctaStart = script.duration - 3;
      srtLines.push(
        this.createSRTEntry(
          subtitleIndex++,
          ctaStart,
          script.duration,
          this.formatSubtitleText(script.callToAction)
        )
      );
    }

    return srtLines.join('\n\n');
  }

  private createSRTEntry(
    index: number,
    startTime: number,
    endTime: number,
    text: string
  ): string {
    return `${index}
${this.formatTime(startTime)} --> ${this.formatTime(endTime)}
${text}`;
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds
      .toString()
      .padStart(3, '0')}`;
  }

  private splitIntoSubtitleLines(text: string): string[] {
    const maxCharsPerLine = 40; // YouTube Shorts optimal subtitle length
    const maxWordsPerLine = 7;
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine: string[] = [];
    let currentLength = 0;

    words.forEach((word) => {
      const wordLength = word.length;
      
      if (
        currentLine.length > 0 &&
        (currentLength + wordLength + 1 > maxCharsPerLine ||
         currentLine.length >= maxWordsPerLine)
      ) {
        lines.push(currentLine.join(' '));
        currentLine = [word];
        currentLength = wordLength;
      } else {
        currentLine.push(word);
        currentLength += wordLength + (currentLine.length > 1 ? 1 : 0);
      }
    });

    if (currentLine.length > 0) {
      lines.push(currentLine.join(' '));
    }

    return lines;
  }

  private formatSubtitleText(text: string): string {
    // Format text for better readability
    return text
      .toUpperCase() // YouTube Shorts often use uppercase
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  async generateAnimatedSubtitles(script: Script): Promise<any> {
    // Generate JSON format for animated subtitles in Remotion
    const animatedSubs = script.content
      .filter(seg => seg.type === 'narration' || seg.type === 'text_overlay')
      .map(segment => {
        const words = segment.content.split(' ');
        const wordDuration = (segment.endTime - segment.startTime) / words.length;
        
        return words.map((word, index) => ({
          word,
          startTime: segment.startTime + (index * wordDuration),
          endTime: segment.startTime + ((index + 1) * wordDuration),
          style: this.getWordStyle(word, segment),
        }));
      })
      .flat();

    return {
      subtitles: animatedSubs,
      style: {
        fontSize: 48,
        fontFamily: 'Montserrat',
        fontWeight: 'bold',
        color: '#FFFFFF',
        strokeColor: '#000000',
        strokeWidth: 3,
        position: 'bottom',
        animation: 'pop', // pop, slide, fade
      },
    };
  }

  private getWordStyle(word: string, segment: ScriptSegment): any {
    // Special styling for emphasis words
    const emphasisWords = ['never', 'always', 'best', 'worst', 'only', 'first'];
    const isEmphasis = emphasisWords.some(e => word.toLowerCase().includes(e));

    if (isEmphasis) {
      return {
        color: '#FFD700', // Gold for emphasis
        scale: 1.2,
        animation: 'bounce',
      };
    }

    // Numbers get special treatment
    if (/\d+/.test(word)) {
      return {
        color: '#00FF00', // Green for numbers
        scale: 1.1,
        animation: 'glow',
      };
    }

    return {};
  }

  async generateMultiLanguageSubtitles(
    script: Script,
    languages: string[] = ['es', 'pt', 'fr']
  ): Promise<Record<string, string>> {
    const subtitlePaths: Record<string, string> = {};

    // Generate subtitles for each language
    for (const lang of languages) {
      // This would integrate with translation APIs
      const translatedScript = await this.translateScript(script, lang);
      const srtContent = this.generateSRT(translatedScript);
      
      const outputPath = path.join(
        process.cwd(),
        'output',
        'subtitles',
        `${script.id}_${lang}.srt`
      );

      await fs.writeFile(outputPath, srtContent, 'utf-8');
      subtitlePaths[lang] = outputPath;
    }

    return subtitlePaths;
  }

  private async translateScript(script: Script, targetLang: string): Promise<Script> {
    // Placeholder for translation logic
    // Would integrate with translation APIs like Google Translate or DeepL
    
    this.logger.info(`Translating script to ${targetLang}`);
    
    // Return original script for now
    return script;
  }
}