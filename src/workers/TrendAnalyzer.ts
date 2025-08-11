import { PrismaClient } from '@prisma/client';
import { RedditScraper } from '../scrapers/RedditScraper';
import { ScriptGenerator } from '../generators/ScriptGenerator';
import { createLogger } from '../utils/logger';

export class TrendAnalyzer {
  private prisma: PrismaClient;
  private logger = createLogger('TrendAnalyzer');
  private redditScraper: RedditScraper;
  private scriptGenerator: ScriptGenerator;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.redditScraper = new RedditScraper(prisma, this.logger);
    this.scriptGenerator = new ScriptGenerator(prisma);
  }

  async process(data: any) {
    try {
      this.logger.info('Starting trend analysis');
      
      // 1. Scrape trends from Reddit
      const trends = await this.redditScraper.getTrendingTopics();
      this.logger.info(`Found ${trends.length} trending topics`);

      // 2. Filter high-potential trends
      const viralTrends = trends.filter(t => t.viralPotential >= 80);
      this.logger.info(`${viralTrends.length} trends with high viral potential`);

      // 3. Generate content ideas from top trends
      if (viralTrends.length > 0) {
        const topTrends = viralTrends.slice(0, 5);
        const ideas = await this.scriptGenerator.generateIdeasFromTrends(topTrends);
        this.logger.info(`Generated ${ideas.length} content ideas`);

        // 4. Auto-approve best ideas
        const bestIdeas = ideas.filter(i => i.estimatedViralScore >= 85);
        for (const idea of bestIdeas) {
          await this.prisma.contentIdea.update({
            where: { id: idea.id },
            data: { status: 'APPROVED' },
          });
        }
        this.logger.info(`Auto-approved ${bestIdeas.length} high-scoring ideas`);
      }

      // 5. Update job status
      await this.prisma.job.create({
        data: {
          type: 'ANALYZE_TRENDS',
          status: 'COMPLETED',
          priority: 0,
          data: { trendsFound: trends.length },
          result: { 
            totalTrends: trends.length,
            viralTrends: viralTrends.length,
          },
        },
      });

      return {
        success: true,
        trendsAnalyzed: trends.length,
        viralTrends: viralTrends.length,
      };
    } catch (error) {
      this.logger.error('Error in trend analysis:', error);
      
      await this.prisma.job.create({
        data: {
          type: 'ANALYZE_TRENDS',
          status: 'FAILED',
          priority: 0,
          data: {},
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }
}