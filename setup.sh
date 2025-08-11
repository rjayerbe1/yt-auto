#!/bin/bash

# YouTube Shorts Automation System - Setup Script
# This script sets up everything needed to run the system

echo "🚀 YouTube Shorts Automation Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js
echo -e "${YELLOW}Checking Node.js...${NC}"
if command_exists node; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js not found. Please install Node.js 18+ from https://nodejs.org${NC}"
    exit 1
fi

# Check Python
echo -e "${YELLOW}Checking Python...${NC}"
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓ Python installed: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}✗ Python 3 not found. Please install Python 3.8+${NC}"
    exit 1
fi

# Check FFmpeg
echo -e "${YELLOW}Checking FFmpeg...${NC}"
if command_exists ffmpeg; then
    echo -e "${GREEN}✓ FFmpeg installed${NC}"
else
    echo -e "${RED}✗ FFmpeg not found. Installing...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command_exists brew; then
            brew install ffmpeg
        else
            echo "Please install Homebrew first: https://brew.sh"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt-get update && sudo apt-get install -y ffmpeg
    else
        echo "Please install FFmpeg manually: https://ffmpeg.org/download.html"
        exit 1
    fi
fi

# Install Node dependencies
echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
npm install

# Install Python dependencies
echo -e "${YELLOW}Installing Python dependencies...${NC}"
pip3 install torch torchaudio chatterbox-tts --upgrade

# Setup PostgreSQL (optional - will work without it)
echo -e "${YELLOW}Setting up PostgreSQL...${NC}"
if command_exists psql; then
    echo -e "${GREEN}✓ PostgreSQL found${NC}"
    
    # Try to create database
    echo "Creating database 'ytauto'..."
    createdb ytauto 2>/dev/null || echo "Database might already exist"
    
    # Run migrations
    echo "Running database migrations..."
    npx prisma migrate deploy
    echo -e "${GREEN}✓ Database ready${NC}"
else
    echo -e "${YELLOW}⚠ PostgreSQL not found. The app will work but without database features.${NC}"
    echo "To install PostgreSQL:"
    echo "  macOS: brew install postgresql@15 && brew services start postgresql@15"
    echo "  Linux: sudo apt-get install postgresql postgresql-contrib"
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created. Please update it with your API keys.${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Create necessary directories
echo -e "${YELLOW}Creating directories...${NC}"
mkdir -p output/videos output/audio output/temp logs
echo -e "${GREEN}✓ Directories created${NC}"

# Generate Prisma client
echo -e "${YELLOW}Generating Prisma client...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma client generated${NC}"

echo ""
echo -e "${GREEN}=================================="
echo "✅ Setup Complete!"
echo "==================================${NC}"
echo ""
echo "To start the application:"
echo "  npm run dev"
echo ""
echo "To test video generation:"
echo "  curl -X POST http://localhost:3000/api/test/quick-video"
echo ""
echo "API Endpoints:"
echo "  - Quick 2-sec test: POST /api/test/quick-video"
echo "  - 10-sec optimized: POST /api/test/optimized-video"
echo "  - Full 30-sec video: POST /api/video/generate-complete"
echo ""
echo "For production deployment:"
echo "  1. Update .env with production database URL"
echo "  2. Run: npm run build"
echo "  3. Run: npm start"