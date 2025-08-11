import { PrismaClient } from '@prisma/client';
import { ScriptGenerator } from '../generators/ScriptGenerator';
import { createLogger } from '../utils/logger';

export class ScriptProcessor {
  private prisma: PrismaClient;
  private logger = createLogger('ScriptProcessor');
  private scriptGenerator: ScriptGenerator;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.scriptGenerator = new ScriptGenerator(prisma);
  }

  async process(data: { ideaId: string }) {
    try {
      this.logger.info(`Processing script for idea: ${data.ideaId}`);
      
      // 1. Get the idea
      const idea = await this.prisma.contentIdea.findUnique({
        where: { id: data.ideaId },
      });

      if (!idea) {
        throw new Error(`Idea not found: ${data.ideaId}`);
      }

      // 2. Update idea status
      await this.prisma.contentIdea.update({
        where: { id: data.ideaId },
        data: { status: 'IN_PRODUCTION' },
      });

      // 3. Generate script
      const script = await this.scriptGenerator.generateScript(idea as any);
      this.logger.info(`Script generated: ${script.id}`);

      // 4. Optimize script for maximum engagement
      const optimizedScript = await this.scriptGenerator.optimizeScript(script);
      this.logger.info(`Script optimized: ${optimizedScript.id}`);

      // 5. Create job record
      await this.prisma.job.create({
        data: {
          type: 'GENERATE_SCRIPT',
          status: 'COMPLETED',
          priority: 0,
          data: { ideaId: data.ideaId },
          result: { scriptId: optimizedScript.id },
        },
      });

      return {
        success: true,
        scriptId: optimizedScript.id,
      };
    } catch (error) {
      this.logger.error('Error processing script:', error);
      
      await this.prisma.job.create({
        data: {
          type: 'GENERATE_SCRIPT',
          status: 'FAILED',
          priority: 0,
          data: { ideaId: data.ideaId },
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }
}