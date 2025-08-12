import { Script, ContentIdea } from '../types';
import path from 'path';
import fs from 'fs/promises';
import { createLogger } from '../utils/logger';
import { getViralContent, calculateWordCount } from './viral-content';

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
      trendId: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async generateDemoScript(idea: ContentIdea, targetDuration: number = 30): Promise<Script> {
    // Get viral content appropriate for the target duration
    const viralContent = getViralContent(targetDuration);
    
    // Log word count for debugging
    const wordCount = calculateWordCount(viralContent);
    const expectedWords = targetDuration * 3; // 3 words per second
    logger.info(`📝 Generated ${wordCount} words for ${targetDuration}s video (expected: ~${expectedWords} words)`);
    
    // Old function removed - using viral content instead
    /*
    const getContentForDuration = (duration: number) => {
      const wordsPerSecond = 2.5;
      const totalWordsNeeded = Math.floor(duration * wordsPerSecond);
      
      if (duration <= 2) {
        // Very short test video - ensure each segment has enough content for 1.5+ seconds of audio
        return {
          hook: "Here is an amazing fact that will absolutely blow your mind today",
          content: ["This incredible discovery completely changes everything we thought we knew about the world"],
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
      } else if (duration <= 60) {
        // 60 second video - need more content segments
        return {
          hook: "The complete guide to mastering this amazing technique that will transform your daily life",
          content: [
            "Let's start with the fundamental basics that everyone needs to understand before diving deeper into this topic",
            "Now here's where things get really interesting and you'll discover something truly revolutionary",
            "Most people don't know about this crucial detail that makes all the difference in the world",
            "This next part is absolutely essential to know if you want to succeed with this method",
            "Here's a professional tip that experts use every single day to get incredible results",
            "Let me show you an advanced technique that will take your skills to the next level",
            "Pay close attention to this next part because it's the most important thing you'll learn today",
            "Here's another amazing secret that only the top professionals know about and use regularly",
            "This specific detail is what separates the beginners from the true masters of this craft",
            "Now I'm going to reveal something that took me years to discover through trial and error",
            "This is the game-changing secret that will completely transform how you approach this",
            "And here's exactly how to put it all together step by step for maximum effectiveness",
            "One more incredibly important thing that you absolutely must remember going forward",
            "Before we finish, let me share this final golden nugget of wisdom with you"
          ],
          callToAction: "Subscribe and hit the bell for more amazing tutorials and daily tips!"
        };
      } else {
        // 90+ second video - generate enough segments
        const segmentCount = Math.ceil(duration / 4); // Roughly 4 seconds per segment
        const segments = [];
        
        // Generate varied content segments
        const segmentTemplates = [
          "Here's an incredible fact that most people have never heard about before",
          "This next technique will completely change how you think about this topic",
          "Let me explain why this is so important for your success and growth",
          "Pay attention to this crucial detail that makes all the difference",
          "Scientists have recently discovered something amazing about this subject",
          "This professional secret has been closely guarded for years until now",
          "Here's what the experts don't want you to know about this method",
          "This simple trick can save you hours of time and frustration",
          "Let me show you the most effective way to approach this challenge",
          "This is the number one mistake that beginners always make",
          "Here's a little-known shortcut that professionals use daily",
          "This breakthrough discovery is changing everything we thought we knew",
          "Let me reveal the truth behind this common misconception",
          "This advanced technique requires practice but yields incredible results",
          "Here's the scientific explanation for why this works so well",
          "This historical perspective gives us valuable insights into the topic",
          "Let me share a personal story that illustrates this perfectly",
          "This comparative analysis reveals some surprising conclusions",
          "Here's what happens when you apply this principle consistently",
          "This final piece of advice could be the most valuable of all"
        ];
        
        for (let i = 0; i < segmentCount; i++) {
          segments.push(segmentTemplates[i % segmentTemplates.length]);
        }
        
        return {
          hook: "The ultimate comprehensive guide that covers everything you need to know about this fascinating topic",
          content: segments,
          callToAction: "Don't forget to subscribe, like this video, and ring the notification bell for more incredible content!"
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
    */

    // Use the viral content we selected instead of old content
    const dynamicContent = viralContent;
    
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
      title: `${targetDuration}s - ${viralContent.topic || idea.title}`,
      hook: dynamicContent.hook,
      content: formattedContent,
      callToAction: dynamicContent.cta || "",
      duration: targetDuration,
      wordCount: dynamicContent.content.join(' ').split(' ').length + 10,
      language: 'en',
      voiceSettings: {
        provider: 'elevenlabs' as const,
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

    // Return a default template since we don't have idea property
    return 'trending';
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