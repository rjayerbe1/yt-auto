import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger';

export class FileCleanup {
  /**
   * Clean up intermediate files after video generation
   * Keeps only the final output
   */
  static async cleanupIntermediateFiles(
    filesToDelete: string[],
    finalFile: string
  ): Promise<void> {
    logger.info(`🧹 Cleaning up ${filesToDelete.length} intermediate files...`);
    
    let deletedCount = 0;
    let failedCount = 0;
    
    for (const file of filesToDelete) {
      // Don't delete the final file
      if (file === finalFile) {
        continue;
      }
      
      try {
        await fs.unlink(file);
        deletedCount++;
        logger.debug(`Deleted: ${path.basename(file)}`);
      } catch (error) {
        // File might already be deleted or doesn't exist
        failedCount++;
        logger.debug(`Could not delete: ${path.basename(file)}`);
      }
    }
    
    logger.info(`✅ Cleanup complete: ${deletedCount} files deleted, ${failedCount} skipped`);
  }
  
  /**
   * Clean up old files in a directory (older than specified days)
   */
  static async cleanupOldFiles(
    directory: string,
    daysOld: number = 7
  ): Promise<void> {
    try {
      const files = await fs.readdir(directory);
      const now = Date.now();
      const maxAge = daysOld * 24 * 60 * 60 * 1000; // Convert days to milliseconds
      
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
          logger.debug(`Deleted old file: ${file}`);
        }
      }
      
      if (deletedCount > 0) {
        logger.info(`🗑️ Deleted ${deletedCount} old files (>${daysOld} days)`);
      }
    } catch (error) {
      logger.error('Error cleaning up old files:', error);
    }
  }
  
  /**
   * Get directory size in MB
   */
  static async getDirectorySize(directory: string): Promise<number> {
    let totalSize = 0;
    
    try {
      const files = await fs.readdir(directory);
      
      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
    } catch (error) {
      logger.error('Error calculating directory size:', error);
    }
    
    return totalSize / (1024 * 1024); // Convert to MB
  }
  
  /**
   * Clean up temporary audio list files
   */
  static async cleanupTempFiles(directory: string): Promise<void> {
    try {
      const files = await fs.readdir(directory);
      const tempFiles = files.filter(f => 
        f.includes('audio_list') || 
        f.includes('timing_') ||
        f.includes('_temp') ||
        f.includes('_processed')
      );
      
      for (const file of tempFiles) {
        const filePath = path.join(directory, file);
        try {
          await fs.unlink(filePath);
          logger.debug(`Deleted temp file: ${file}`);
        } catch (error) {
          // Ignore errors for individual files
        }
      }
      
      if (tempFiles.length > 0) {
        logger.info(`🧹 Cleaned up ${tempFiles.length} temporary files`);
      }
    } catch (error) {
      logger.error('Error cleaning up temp files:', error);
    }
  }
}