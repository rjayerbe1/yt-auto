import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { config } from '@config/index';
import { ContentIdea, Script, ScriptSegment } from '@types/index';
import { createLogger } from '@utils/logger';

export class ScriptGenerator {
  private openai: OpenAI;
  private prisma: PrismaClient;
  private logger = createLogger('ScriptGenerator');

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.openai = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
    });
  }

  async generateScript(idea: ContentIdea): Promise<Script> {
    this.logger.info(`Generating script for idea: ${idea.title}`);

    const prompt = this.buildPrompt(idea);
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const scriptData = JSON.parse(response);
      const script = await this.saveScript(idea.id, scriptData);
      
      this.logger.info(`Script generated successfully for idea: ${idea.id}`);
      return script;
    } catch (error) {
      this.logger.error('Error generating script:', error);
      throw error;
    }
  }

  private getSystemPrompt(): string {
    return `You are a viral YouTube Shorts scriptwriter specializing in creating engaging, high-retention content.

Your scripts must:
1. Hook viewers in the first 3 seconds with a powerful opening
2. Maintain high retention with pattern interrupts every 5-7 seconds
3. Use simple, conversational language (6th-grade reading level)
4. Be between 30-59 seconds when read at normal pace
5. End with a strong call-to-action
6. Include visual and audio cues for video production

Output format must be valid JSON with this structure:
{
  "title": "Catchy title under 60 characters",
  "hook": "First 3 seconds - the most important part",
  "segments": [
    {
      "type": "narration|text_overlay|transition|effect",
      "content": "What to say or display",
      "startTime": 0,
      "endTime": 5,
      "visualDescription": "What should appear on screen",
      "audioDescription": "Sound effects or music cues"
    }
  ],
  "callToAction": "Final message to viewers",
  "duration": 45,
  "wordCount": 120,
  "tags": ["tag1", "tag2"],
  "emotions": ["curiosity", "surprise", "excitement"]
}`;
  }

  private buildPrompt(idea: ContentIdea): string {
    return `Create a viral YouTube Short script for:

Title: ${idea.title}
Description: ${idea.description}
Category: ${idea.category}
Target Audience: ${idea.targetAudience}
Tone: ${idea.tone}
Key Points: ${idea.keyPoints.join(', ')}

Make it ${idea.tone} and optimize for maximum retention and engagement.
The content should be factually accurate and valuable to viewers.
Include specific visual directions for each segment.`;
  }

  private async saveScript(ideaId: string, scriptData: any): Promise<Script> {
    const segments: ScriptSegment[] = scriptData.segments.map((seg: any) => ({
      type: seg.type,
      content: seg.content,
      startTime: seg.startTime,
      endTime: seg.endTime,
      visualDescription: seg.visualDescription,
      audioDescription: seg.audioDescription,
    }));

    const dbScript = await this.prisma.script.create({
      data: {
        ideaId,
        title: scriptData.title,
        hook: scriptData.hook,
        content: segments,
        callToAction: scriptData.callToAction,
        duration: scriptData.duration,
        wordCount: scriptData.wordCount,
        language: 'en',
        voiceSettings: {
          provider: 'elevenlabs',
          voiceId: 'default',
          speed: 1.0,
          pitch: 1.0,
          volume: 1.0,
        },
      },
      include: {
        idea: true,
      },
    });

    return {
      ...dbScript,
      content: segments,
      voiceSettings: dbScript.voiceSettings as any,
    } as Script;
  }

  async generateIdeasFromTrends(trends: any[]): Promise<ContentIdea[]> {
    const ideas: ContentIdea[] = [];

    for (const trend of trends) {
      try {
        const ideaPrompt = `Based on this trending topic, create 3 unique YouTube Short ideas:

Trending Topic: ${trend.title}
Description: ${trend.description || 'N/A'}
Category: ${trend.category}
Viral Score: ${trend.viralPotential}

Each idea should:
- Be different from the others
- Target a specific audience
- Have high viral potential
- Be producible without copyright issues

Output as JSON array with this structure:
[
  {
    "title": "Engaging title",
    "description": "Brief description",
    "targetAudience": "Specific demographic",
    "tone": "educational|entertaining|informative|humorous|inspirational",
    "keyPoints": ["point1", "point2", "point3"],
    "estimatedViralScore": 85
  }
]`;

        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are a content strategist specializing in viral YouTube Shorts. Create ideas that are unique, engaging, and optimized for the platform.',
            },
            {
              role: 'user',
              content: ideaPrompt,
            },
          ],
          temperature: 0.9,
          max_tokens: 800,
          response_format: { type: 'json_object' },
        });

        const response = completion.choices[0].message.content;
        if (!response) continue;

        const ideaData = JSON.parse(response);
        const ideaArray = Array.isArray(ideaData) ? ideaData : ideaData.ideas || [ideaData];

        for (const idea of ideaArray) {
          const savedIdea = await this.prisma.contentIdea.create({
            data: {
              trendId: trend.id,
              title: idea.title,
              description: idea.description,
              category: trend.category,
              targetAudience: idea.targetAudience,
              tone: idea.tone.toUpperCase(),
              keyPoints: idea.keyPoints,
              estimatedViralScore: idea.estimatedViralScore || trend.viralPotential,
              status: 'PENDING',
            },
          });

          ideas.push({
            ...savedIdea,
            status: 'pending' as const,
            tone: idea.tone as any,
          });
        }
      } catch (error) {
        this.logger.error(`Error generating ideas for trend ${trend.id}:`, error);
      }
    }

    this.logger.info(`Generated ${ideas.length} content ideas from ${trends.length} trends`);
    return ideas;
  }

  async optimizeScript(script: Script): Promise<Script> {
    const optimizationPrompt = `Optimize this YouTube Short script for maximum viral potential:

Current Script:
Title: ${script.title}
Hook: ${script.hook}
Content: ${JSON.stringify(script.content)}
CTA: ${script.callToAction}

Improve:
1. Make the hook more compelling
2. Add more pattern interrupts
3. Strengthen emotional triggers
4. Optimize pacing
5. Enhance the call-to-action

Maintain the same core message and duration.
Output the optimized version in the same JSON format.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: optimizationPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        return script;
      }

      const optimizedData = JSON.parse(response);
      
      // Update the script in database
      const updated = await this.prisma.script.update({
        where: { id: script.id },
        data: {
          title: optimizedData.title,
          hook: optimizedData.hook,
          content: optimizedData.segments,
          callToAction: optimizedData.callToAction,
        },
      });

      return {
        ...updated,
        content: optimizedData.segments,
        voiceSettings: updated.voiceSettings as any,
      } as Script;
    } catch (error) {
      this.logger.error('Error optimizing script:', error);
      return script;
    }
  }
}