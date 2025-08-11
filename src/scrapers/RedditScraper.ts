import Snoowrap from 'snoowrap';
import { PrismaClient } from '@prisma/client';
import { config, contentConfig } from '@config/index';
import { Trend } from '@types/index';
import winston from 'winston';

export class RedditScraper {
  private client: Snoowrap | null = null;
  private prisma: PrismaClient;
  private logger: winston.Logger;

  constructor(prisma: PrismaClient, logger: winston.Logger) {
    this.prisma = prisma;
    this.logger = logger;
    this.initializeClient();
  }

  private initializeClient() {
    if (config.REDDIT_CLIENT_ID && config.REDDIT_CLIENT_SECRET) {
      this.client = new Snoowrap({
        userAgent: config.REDDIT_USER_AGENT,
        clientId: config.REDDIT_CLIENT_ID,
        clientSecret: config.REDDIT_CLIENT_SECRET,
        refreshToken: '', // We'll use app-only auth
      });
    } else {
      this.logger.warn('Reddit credentials not configured, scraper disabled');
    }
  }

  async getTrendingTopics(): Promise<Trend[]> {
    if (!this.client) {
      this.logger.warn('Reddit client not initialized');
      return [];
    }

    const trends: Trend[] = [];
    const { subreddits, minScore, maxAge } = contentConfig.trendSources.reddit;

    for (const subredditName of subreddits) {
      try {
        this.logger.info(`Scraping r/${subredditName}`);
        
        const subreddit = this.client.getSubreddit(subredditName);
        const posts = await subreddit.getHot({ limit: 50 });

        for (const post of posts) {
          const ageInMs = Date.now() - (post.created_utc * 1000);
          
          if (post.score >= minScore && ageInMs <= maxAge) {
            const viralScore = this.calculateViralScore(post);
            
            if (viralScore >= contentConfig.viralScoreThreshold) {
              const trend = await this.createTrendFromPost(post, subredditName, viralScore);
              trends.push(trend);
            }
          }
        }
      } catch (error) {
        this.logger.error(`Error scraping r/${subredditName}:`, error);
      }
    }

    // Save trends to database
    await this.saveTrends(trends);
    
    return trends;
  }

  private calculateViralScore(post: any): number {
    const now = Date.now();
    const postAge = (now - post.created_utc * 1000) / (1000 * 60 * 60); // Age in hours
    
    // Factors for viral potential
    const factors = {
      score: Math.min(post.score / 10000, 1) * 30, // Normalized score (max 30 points)
      comments: Math.min(post.num_comments / 1000, 1) * 20, // Engagement (max 20 points)
      awards: Math.min(post.total_awards_received / 10, 1) * 10, // Awards (max 10 points)
      crosspostable: post.is_crosspostable ? 5 : 0, // Shareable content (5 points)
      media: post.is_video || post.url?.includes('imgur') || post.url?.includes('gfycat') ? 10 : 5, // Visual content bonus
      recency: Math.max(0, (24 - postAge) / 24) * 15, // Recency factor (max 15 points)
      engagement_rate: Math.min((post.num_comments / post.score) * 100, 1) * 10, // Comment ratio (max 10 points)
    };

    const totalScore = Object.values(factors).reduce((sum, value) => sum + value, 0);
    
    this.logger.debug(`Viral score for "${post.title}": ${totalScore.toFixed(2)}`);
    
    return totalScore;
  }

  private async createTrendFromPost(post: any, subreddit: string, viralScore: number): Promise<Trend> {
    const category = this.categorizePost(post, subreddit);
    const tags = this.extractTags(post);

    const trend: Trend = {
      id: `reddit_${post.id}`,
      source: 'reddit',
      title: post.title,
      description: post.selftext || post.title,
      url: `https://reddit.com${post.permalink}`,
      score: post.score,
      viralPotential: viralScore,
      category,
      tags,
      metadata: {
        subreddit,
        author: post.author?.name || 'deleted',
        num_comments: post.num_comments,
        awards: post.total_awards_received,
        is_video: post.is_video,
        thumbnail: post.thumbnail,
        media_url: post.url,
        created_utc: post.created_utc,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return trend;
  }

  private categorizePost(post: any, subreddit: string): string {
    const subredditCategories: Record<string, string> = {
      'todayilearned': 'education',
      'explainlikeimfive': 'education',
      'askreddit': 'entertainment',
      'showerthoughts': 'entertainment',
      'lifeprotips': 'lifehacks',
      'youshouldknow': 'lifehacks',
      'interestingasfuck': 'science',
      'damnthatsinteresting': 'science',
    };

    // Check subreddit mapping first
    if (subredditCategories[subreddit.toLowerCase()]) {
      return subredditCategories[subreddit.toLowerCase()];
    }

    // Analyze title and content for keywords
    const text = `${post.title} ${post.selftext || ''}`.toLowerCase();
    
    const categoryKeywords: Record<string, string[]> = {
      technology: ['tech', 'app', 'software', 'computer', 'ai', 'robot', 'digital', 'internet'],
      science: ['science', 'study', 'research', 'discover', 'experiment', 'nasa', 'space'],
      psychology: ['psychology', 'mental', 'brain', 'mind', 'behavior', 'emotion', 'therapy'],
      lifehacks: ['hack', 'tip', 'trick', 'easy', 'simple', 'save', 'improve'],
      finance: ['money', 'invest', 'stock', 'crypto', 'finance', 'economy', 'budget'],
      health: ['health', 'fitness', 'exercise', 'diet', 'medical', 'doctor', 'wellness'],
      education: ['learn', 'teach', 'school', 'education', 'know', 'fact', 'history'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }

    return 'entertainment'; // Default category
  }

  private extractTags(post: any): string[] {
    const tags: string[] = [];
    const text = `${post.title} ${post.selftext || ''}`;
    
    // Extract hashtags if present
    const hashtags = text.match(/#\w+/g) || [];
    tags.push(...hashtags.map(tag => tag.slice(1).toLowerCase()));
    
    // Extract important words from title (simple approach)
    const titleWords = post.title
      .toLowerCase()
      .split(/\s+/)
      .filter((word: string) => word.length > 4 && !this.isStopWord(word))
      .slice(0, 5);
    
    tags.push(...titleWords);
    
    // Add subreddit as tag
    tags.push(post.subreddit_name_prefixed.slice(2).toLowerCase());
    
    return [...new Set(tags)]; // Remove duplicates
  }

  private isStopWord(word: string): boolean {
    const stopWords = [
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her',
      'was', 'one', 'our', 'out', 'his', 'has', 'had', 'were', 'been', 'have',
      'their', 'they', 'will', 'with', 'this', 'that', 'from', 'what', 'when',
      'where', 'which', 'while', 'about', 'after', 'before', 'could', 'should'
    ];
    return stopWords.includes(word.toLowerCase());
  }

  private async saveTrends(trends: Trend[]): Promise<void> {
    for (const trend of trends) {
      try {
        await this.prisma.trend.upsert({
          where: { id: trend.id },
          update: {
            score: trend.score,
            viralPotential: trend.viralPotential,
            metadata: trend.metadata,
            updatedAt: new Date(),
          },
          create: {
            id: trend.id,
            source: trend.source,
            title: trend.title,
            description: trend.description || '',
            url: trend.url,
            score: trend.score,
            viralPotential: trend.viralPotential,
            category: trend.category,
            tags: trend.tags,
            metadata: trend.metadata,
          },
        });
      } catch (error) {
        this.logger.error(`Error saving trend ${trend.id}:`, error);
      }
    }
    
    this.logger.info(`Saved ${trends.length} trends to database`);
  }

  async getTopTrends(limit: number = 10): Promise<Trend[]> {
    const dbTrends = await this.prisma.trend.findMany({
      where: {
        source: 'reddit',
        viralPotential: {
          gte: contentConfig.viralScoreThreshold,
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: {
        viralPotential: 'desc',
      },
      take: limit,
    });

    return dbTrends.map(trend => ({
      ...trend,
      metadata: trend.metadata as any,
    }));
  }
}