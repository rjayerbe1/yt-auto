export interface Trend {
  id: string;
  source: 'reddit' | 'youtube' | 'twitter' | 'tiktok';
  title: string;
  description?: string;
  url: string;
  score: number;
  viralPotential: number;
  category: string;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentIdea {
  id: string;
  trendId?: string;
  title: string;
  description: string;
  category: string;
  targetAudience: string;
  tone: 'educational' | 'entertaining' | 'informative' | 'humorous' | 'inspirational';
  keyPoints: string[];
  estimatedViralScore: number;
  status: 'pending' | 'approved' | 'rejected' | 'in_production' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

export interface Script {
  id: string;
  ideaId: string;
  title: string;
  hook: string;
  content: ScriptSegment[];
  callToAction: string;
  duration: number;
  wordCount: number;
  language: string;
  voiceSettings?: VoiceSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScriptSegment {
  type: 'narration' | 'text_overlay' | 'transition' | 'effect';
  content: string;
  startTime: number;
  endTime: number;
  visualDescription?: string;
  audioDescription?: string;
}

export interface VoiceSettings {
  provider: 'elevenlabs' | 'azure' | 'google';
  voiceId: string;
  speed: number;
  pitch: number;
  volume: number;
}

export interface Video {
  id: string;
  scriptId: string;
  title: string;
  description: string;
  filePath: string;
  thumbnailPath?: string;
  duration: number;
  resolution: string;
  fileSize: number;
  status: 'rendering' | 'completed' | 'failed' | 'uploaded';
  metadata: VideoMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
  categoryId: string;
  language: string;
  thumbnailUrl?: string;
  scheduled?: boolean;
  publishAt?: Date;
  hashtags: string[];
  timestamps: Array<{
    time: string;
    label: string;
  }>;
}

export interface YouTubeUploadResult {
  videoId: string;
  url: string;
  status: 'uploaded' | 'processing' | 'published' | 'failed';
  publishedAt?: Date;
  error?: string;
}

export interface Analytics {
  videoId: string;
  views: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  watchTime: number;
  averageViewDuration: number;
  averageViewPercentage: number;
  impressions: number;
  clickThroughRate: number;
  subscribersGained: number;
  subscribersLost: number;
  estimatedRevenue?: number;
  updatedAt: Date;
}

export interface Job {
  id: string;
  type: 'analyze_trends' | 'generate_script' | 'create_video' | 'upload_video' | 'track_analytics';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  data: any;
  result?: any;
  error?: string;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
  scheduledFor?: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  youtubeChannels?: YouTubeChannel[];
  createdAt: Date;
  updatedAt: Date;
}

export interface YouTubeChannel {
  id: string;
  userId: string;
  channelId: string;
  channelName: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}