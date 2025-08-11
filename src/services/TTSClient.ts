import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

interface TTSResult {
  success: boolean;
  output: string;
  sample_rate: number;
  device?: string;
  gpu_accelerated?: boolean;
}

interface BatchItem {
  text: string;
  output_path: string;
}

export class TTSClient {
  private serverUrl: string;
  private serverProcess: any = null;
  private isServerRunning: boolean = false;
  private serverStartPromise: Promise<void> | null = null;

  constructor(port: number = 5555) {
    this.serverUrl = `http://localhost:${port}`;
  }

  /**
   * Check if TTS server is running
   */
  private async checkServer(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.serverUrl}/health`, { timeout: 1000 });
      return response.data.model_loaded === true;
    } catch {
      return false;
    }
  }

  /**
   * Start the TTS server if not running
   */
  private async startServer(): Promise<void> {
    // If already starting, wait for it
    if (this.serverStartPromise) {
      return this.serverStartPromise;
    }

    // If already running, return
    if (await this.checkServer()) {
      this.isServerRunning = true;
      return;
    }

    // Start the server
    this.serverStartPromise = this._startServerInternal();
    return this.serverStartPromise;
  }

  private async _startServerInternal(): Promise<void> {
    logger.info('🚀 Starting TTS server...');
    
    const scriptPath = path.join(process.cwd(), 'scripts', 'tts_server.py');
    
    // Check if script exists
    try {
      await fs.access(scriptPath);
    } catch {
      throw new Error('TTS server script not found');
    }

    // Start server in background
    const { spawn } = require('child_process');
    this.serverProcess = spawn('python3', [scriptPath], {
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Log server output
    this.serverProcess.stdout.on('data', (data: Buffer) => {
      logger.debug(`TTS Server: ${data.toString()}`);
    });

    this.serverProcess.stderr.on('data', (data: Buffer) => {
      logger.error(`TTS Server Error: ${data.toString()}`);
    });

    // Wait for server to be ready
    let retries = 30; // 30 seconds timeout
    while (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (await this.checkServer()) {
        logger.info('✅ TTS server is ready!');
        this.isServerRunning = true;
        this.serverStartPromise = null;
        return;
      }
      retries--;
    }

    throw new Error('TTS server failed to start');
  }

  /**
   * Generate audio for a single text
   */
  async generateAudio(text: string, outputPath: string): Promise<TTSResult> {
    // Ensure server is running
    await this.startServer();

    try {
      const response = await axios.post(`${this.serverUrl}/generate`, {
        text,
        output_path: outputPath
      }, {
        timeout: 60000 // 1 minute timeout
      });

      return response.data;
    } catch (error) {
      logger.error('Error generating audio:', error);
      throw error;
    }
  }

  /**
   * Generate audio for multiple texts in batch (more efficient)
   */
  async generateBatch(items: BatchItem[]): Promise<{ results: TTSResult[] }> {
    // Ensure server is running
    await this.startServer();

    try {
      const response = await axios.post(`${this.serverUrl}/batch`, {
        items
      }, {
        timeout: 300000 // 5 minutes timeout for batch
      });

      return response.data;
    } catch (error) {
      logger.error('Error generating batch audio:', error);
      throw error;
    }
  }

  /**
   * Generate audio for multiple texts with streaming progress
   */
  async generateBatchWithProgress(
    items: BatchItem[], 
    onProgress?: (data: any) => void
  ): Promise<{ results: TTSResult[] }> {
    // Ensure server is running
    await this.startServer();

    return new Promise((resolve, reject) => {
      const results: TTSResult[] = [];
      
      // Use fetch for SSE support
      fetch(`${this.serverUrl}/batch-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items })
      })
      .then(response => {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) {
          throw new Error('No response body');
        }

        const processStream = async () => {
          let buffer = '';
          
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.type === 'progress' || data.type === 'item_complete') {
                    if (onProgress) {
                      onProgress(data);
                    }
                  }
                  
                  if (data.type === 'complete') {
                    resolve({ results: data.results });
                    return;
                  }
                  
                  if (data.type === 'error') {
                    logger.error('TTS Error:', data.message);
                  }
                } catch (e) {
                  // Ignore JSON parse errors
                }
              }
            }
          }
        };
        
        processStream().catch(reject);
      })
      .catch(reject);
    });
  }

  /**
   * Stop the TTS server
   */
  async stopServer(): Promise<void> {
    if (this.serverProcess) {
      logger.info('Stopping TTS server...');
      this.serverProcess.kill('SIGTERM');
      this.serverProcess = null;
      this.isServerRunning = false;
    }
  }

  /**
   * Cleanup on exit
   */
  async cleanup(): Promise<void> {
    await this.stopServer();
  }
}

// Singleton instance
export const ttsClient = new TTSClient();