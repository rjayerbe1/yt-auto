# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YouTube Auto is an automated YouTube Shorts generation system that creates viral videos using AI-powered script generation, text-to-speech (TTS), and video rendering with Remotion.

## Key Commands

### Development
- `npm run dev` - Start the main development server (uses index-simple.ts)
- `npm run dev:full` - Start full server with all features (uses index.ts)
- `npm run remotion:preview` - Preview Remotion videos on port 3001
- `npm run remotion:studio` - Open Remotion Studio for visual editing

### Database
- `npx prisma migrate dev` - Run database migrations
- `npx prisma studio` - Open Prisma Studio GUI
- `npx prisma db push` - Push schema changes without migration

### Testing Videos
- `npm run remotion:render src/remotion/index.tsx MyVideo output/demo-video.mp4` - Render a test video
- Use the API endpoints to generate videos programmatically

## Architecture

### Core Flow
1. **Script Generation**: OpenAI generates viral scripts based on trending topics
2. **Audio Generation**: Multiple TTS services (Chatterbox/Resemble AI, Google Cloud, ElevenLabs)
3. **Video Production**: Remotion renders React components into videos with synchronized audio
4. **Word-by-Word Sync**: Uses Whisper for transcription to achieve perfect text-audio synchronization

### Key Services
- **TTS Integration**: `src/services/` contains multiple TTS implementations with fallback support
- **Video Generators**: `src/video/` has various video generation strategies (optimized, synced, with progress tracking)
- **Remotion Components**: `src/remotion/` contains React components for video rendering with multiple style variations

### API Structure
The main server (`src/index-simple.ts`) exposes endpoints for:
- `/api/video/generate-synced` - Generate synchronized videos with word-by-word animation
- `/api/video/generate-with-progress` - Server-sent events for real-time progress
- `/api/demo/*` - Demo generation endpoints for testing

### Video Styles
The system supports 6 different video styles (configurable via `style` parameter):
1. Classic style with bold text
2. Modern gradient style
3. Neon cyberpunk style
4. Minimalist clean style
5. Retro vintage style
6. Dynamic colorful style

### Database Schema
PostgreSQL with Prisma ORM manages:
- Users and YouTube channels
- Content ideas and scripts
- Videos and analytics
- Job queue for background processing

## Environment Configuration

Required environment variables (see .env.example):
- `OPENAI_API_KEY` - For script generation
- `CHATTERBOX_API_KEY` - For Resemble AI voice cloning
- `DATABASE_URL` - PostgreSQL connection string
- YouTube OAuth credentials for channel integration

## TypeScript Path Aliases

The project uses path aliases configured in tsconfig.json:
- `@services/*`, `@video/*`, `@api/*`, etc. map to their respective src/ subdirectories

## Important Implementation Details

- **Whisper Integration**: The system uses whisper-cpp for audio transcription to achieve word-level synchronization
- **Remotion Rendering**: Videos are rendered server-side using Remotion's Node.js APIs
- **Progress Tracking**: Server-sent events provide real-time updates during video generation
- **TTS Fallback**: Multiple TTS services with automatic fallback ensure reliability
- **Cleanup**: Temporary files in `output/temp/` should be cleaned periodically