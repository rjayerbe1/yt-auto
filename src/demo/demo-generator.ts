import { Script, ContentIdea } from '../types';
import path from 'path';
import fs from 'fs/promises';
import { createLogger } from '../utils/logger';

const logger = createLogger('DemoGenerator');

export class DemoGenerator {
  
  async generateDemoIdea(): Promise<ContentIdea> {
    const demoIdeas = [
      {
        id: 'demo-1',
        title: '5 iPhone Tricks 99% of People Don\'t Know',
        description: 'Discover amazing hidden features that will change how you use your iPhone',
        category: 'technology',
        targetAudience: 'iPhone users 18-35 years old',
        tone: 'educational' as const,
        keyPoints: [
          'Scan documents',
          'Measure objects',
          'Built-in level',
          'Copy text from photos',
          'Silence calls'
        ],
        estimatedViralScore: 92,
        status: 'approved' as const,
      },
      {
        id: 'demo-2',
        title: 'The Microwave Trick Chefs Don\'t Want You to Know',
        description: 'Cook like a pro with this simple trick',
        category: 'lifehacks',
        targetAudience: 'Food lovers',
        tone: 'entertaining' as const,
        keyPoints: [
          'Glass of water',
          'Crispy pizza',
          '30 seconds',
          'Perfect moisture'
        ],
        estimatedViralScore: 88,
        status: 'approved' as const,
      },
      {
        id: 'demo-3',
        title: 'Why Airplanes Are White: The Reason Will Shock You',
        description: 'The science behind commercial airplane colors',
        category: 'science',
        targetAudience: 'Science enthusiasts and curious minds',
        tone: 'informative' as const,
        keyPoints: [
          'Heat reflection',
          'Fuel savings',
          'Damage detection',
          'Paint cost'
        ],
        estimatedViralScore: 85,
        status: 'approved' as const,
      }
    ];

    const randomIdea = demoIdeas[Math.floor(Math.random() * demoIdeas.length)];
    
    return {
      ...randomIdea,
      trendId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async generateDemoScript(idea: ContentIdea, targetDuration: number = 30): Promise<Script> {
    // Adjust content based on target duration
    const getContentForDuration = (duration: number) => {
      if (duration <= 2) {
        // Very short test video - single message
        return {
          hook: "Test",
          content: ["Quick test video"],
          callToAction: ""
        };
      } else if (duration <= 15) {
        // Short video - 2-3 segments
        return {
          hook: "Quick tip for you",
          content: [
            "Here's something amazing",
            "You didn't know about this"
          ],
          callToAction: "Follow for more!"
        };
      } else if (duration <= 30) {
        // Medium video - 4-5 segments
        return {
          hook: "5 incredible tips you need to know",
          content: [
            "Tip number one is absolutely mind-blowing",
            "The second tip will save you hours",
            "Number three is a game changer",
            "This fourth tip is my personal favorite",
            "And finally, the best one"
          ],
          callToAction: "Like and follow for daily tips!"
        };
      } else {
        // Long video - 8+ segments
        return {
          hook: "The complete guide you've been waiting for",
          content: [
            "Let's start with the basics you need to understand",
            "Now here's where things get really interesting",
            "Most people don't know about this crucial detail",
            "This next part is absolutely essential to know",
            "Here's a pro tip that experts use every day",
            "Let me show you an advanced technique",
            "This is the secret that changes everything",
            "And here's how to put it all together",
            "One more thing that's incredibly important"
          ],
          callToAction: "Subscribe and hit the bell for more tutorials!"
        };
      }
    };
    
    const content = getContentForDuration(targetDuration);
    
    const scriptTemplates = {
      technology: {
        hook: "Did you know your iPhone could do THIS?",
        content: [
          {
            type: 'narration' as const,
            content: 'Trick number 1: Scan documents professionally without extra apps',
            startTime: 3,
            endTime: 8,
            visualDescription: 'Show Notes app opening scanner',
            audioDescription: 'Camera sound'
          },
          {
            type: 'text_overlay' as const,
            content: 'OPEN NOTES → CAMERA → SCAN',
            startTime: 8,
            endTime: 12,
            visualDescription: 'Animated text with arrows'
          },
          {
            type: 'narration' as const,
            content: 'Trick number 2: Measure any object with your camera',
            startTime: 12,
            endTime: 17,
            visualDescription: 'Measure app measuring a table',
            audioDescription: 'Tech sound'
          },
          {
            type: 'narration' as const,
            content: 'Trick number 3: Your iPhone has a built-in level',
            startTime: 17,
            endTime: 22,
            visualDescription: 'Compass app showing level',
            audioDescription: 'Ding sound'
          },
          {
            type: 'narration' as const,
            content: 'Trick number 4: Copy text from any photo instantly',
            startTime: 22,
            endTime: 27,
            visualDescription: 'Selecting text in a photo',
            audioDescription: 'Pop sound'
          },
          {
            type: 'narration' as const,
            content: 'Trick number 5: Silence calls by flipping your phone',
            startTime: 27,
            endTime: 32,
            visualDescription: 'iPhone flipping during call',
            audioDescription: 'Vibration'
          }
        ],
        callToAction: "Follow me for more amazing tricks!",
      },
      lifehacks: {
        hook: "This microwave trick will change your life",
        content: [
          {
            type: 'narration' as const,
            content: 'Yesterday\'s pizza always gets soggy in the microwave',
            startTime: 3,
            endTime: 8,
            visualDescription: 'Sad soggy pizza',
            audioDescription: 'Sad music'
          },
          {
            type: 'text_overlay' as const,
            content: 'BUT THERE\'S A SOLUTION',
            startTime: 8,
            endTime: 10,
            visualDescription: 'Dramatic text'
          },
          {
            type: 'narration' as const,
            content: 'Put a glass of water next to your pizza',
            startTime: 10,
            endTime: 15,
            visualDescription: 'Placing glass of water',
            audioDescription: 'Water sound'
          },
          {
            type: 'narration' as const,
            content: 'Heat for 30 seconds at medium power',
            startTime: 15,
            endTime: 20,
            visualDescription: 'Microwave running',
            audioDescription: 'Beep beep'
          },
          {
            type: 'narration' as const,
            content: 'The water absorbs excess microwaves and your pizza stays CRISPY!',
            startTime: 20,
            endTime: 27,
            visualDescription: 'Perfectly crispy pizza',
            audioDescription: 'Crunch sound'
          }
        ],
        callToAction: "Save this video and follow me!",
      },
      science: {
        hook: "Why are ALL airplanes white?",
        content: [
          {
            type: 'narration' as const,
            content: 'It\'s not a coincidence that 99% of airplanes are white',
            startTime: 3,
            endTime: 8,
            visualDescription: 'Montage of white airplanes',
            audioDescription: 'Airplane sound'
          },
          {
            type: 'narration' as const,
            content: 'Reason 1: White reflects heat from the sun',
            startTime: 8,
            endTime: 13,
            visualDescription: 'Solar reflection diagram',
            audioDescription: 'Whoosh'
          },
          {
            type: 'narration' as const,
            content: 'This saves up to 20% on air conditioning',
            startTime: 13,
            endTime: 18,
            visualDescription: 'Savings chart',
            audioDescription: 'Cha-ching'
          },
          {
            type: 'narration' as const,
            content: 'Reason 2: It\'s easier to detect cracks and damage',
            startTime: 18,
            endTime: 23,
            visualDescription: 'Inspector checking airplane',
            audioDescription: 'Inspection sound'
          },
          {
            type: 'narration' as const,
            content: 'Reason 3: White paint is cheaper and lighter',
            startTime: 23,
            endTime: 28,
            visualDescription: 'Cost comparison',
            audioDescription: 'Cash register'
          }
        ],
        callToAction: "Did you like it? Follow me for more fun facts!",
      }
    };

    // Use duration-based content for simplified version
    const dynamicContent = getContentForDuration(targetDuration);
    
    // Convert string content to proper format
    const formattedContent = dynamicContent.content.map((text, index) => ({
      type: 'narration' as const,
      content: text,
      startTime: index * (targetDuration / dynamicContent.content.length),
      endTime: (index + 1) * (targetDuration / dynamicContent.content.length),
      visualDescription: 'Text on screen',
      audioDescription: 'Voice narration'
    }));

    return {
      id: `demo-script-${Date.now()}`,
      ideaId: idea.id,
      title: `${targetDuration}s - ${idea.title}`,
      hook: dynamicContent.hook,
      content: formattedContent,
      callToAction: dynamicContent.callToAction,
      duration: targetDuration,
      wordCount: dynamicContent.content.join(' ').split(' ').length + 10,
      language: 'en',
      voiceSettings: {
        provider: 'chatterbox',
        voiceId: 'alex',
        speed: 1.0,
        pitch: 1.0,
        volume: 1.0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async createDemoVideo(script: Script): Promise<string> {
    logger.info('Generating demo video...');
    
    // Create data structure for Remotion
    const videoData = {
      script: {
        title: script.title,
        hook: script.hook,
        segments: script.content,
        callToAction: script.callToAction,
      },
      template: this.selectTemplate(script),
      audioUrl: null, // In demo we use mock TTS
      backgroundMusic: 'energetic',
      subtitlesEnabled: true,
    };

    // Save data for Remotion
    const dataPath = path.join(process.cwd(), 'output', 'temp', 'demo-data.json');
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.writeFile(dataPath, JSON.stringify(videoData, null, 2));

    logger.info('Video data saved at:', dataPath);
    logger.info('To generate the video run: npm run remotion:preview');
    
    return dataPath;
  }

  private selectTemplate(script: Script): string {
    const categoryTemplate: Record<string, string> = {
      technology: 'trending',
      science: 'facts',
      entertainment: 'storytime',
      lifehacks: 'lifehacks',
    };

    return categoryTemplate[script.idea?.category || 'technology'] || 'trending';
  }

  async runFullDemo(): Promise<void> {
    try {
      logger.info('=== STARTING FULL DEMO ===');
      
      // 1. Generate idea
      logger.info('1. Generating viral idea...');
      const idea = await this.generateDemoIdea();
      logger.info(`   ✅ Idea: "${idea.title}"`);
      logger.info(`   📊 Viral score: ${idea.estimatedViralScore}/100`);
      
      // 2. Generate script
      logger.info('2. Generating optimized script...');
      const script = await this.generateDemoScript(idea);
      logger.info(`   ✅ Script generated: ${script.content.length} segments`);
      logger.info(`   ⏱️ Duration: ${script.duration} seconds`);
      
      // 3. Prepare video
      logger.info('3. Preparing video data...');
      const videoDataPath = await this.createDemoVideo(script);
      logger.info(`   ✅ Data saved at: ${videoDataPath}`);
      
      logger.info('\n=== DEMO COMPLETED ===');
      logger.info('📹 To view the video:');
      logger.info('   1. Run: npm run remotion:preview');
      logger.info('   2. Or render: npm run remotion:render');
      logger.info('\n💡 The video will include:');
      logger.info('   - Professional animations');
      logger.info('   - Synchronized subtitles');
      logger.info('   - Background music');
      logger.info('   - Transition effects');
      
    } catch (error) {
      logger.error('Demo error:', error);
      throw error;
    }
  }
}