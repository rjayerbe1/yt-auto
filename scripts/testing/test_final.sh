#!/bin/bash

echo "🎬 Final Test - Video with Real Chatterbox Audio"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Check if server is running
echo -e "${YELLOW}Checking server...${NC}"
curl -s http://localhost:3000/health > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Server is not running${NC}"
    echo "First run: npm run dev"
    exit 1
fi

echo -e "${GREEN}✅ Server active${NC}"
echo ""

# Options menu
echo "Choose what to test:"
echo ""
echo "1) Test audio generation with Chatterbox"
echo "2) Generate video WITHOUT audio (fast - 10 seconds)"
echo "3) Generate video WITH real audio (complete - 2-3 minutes)"
echo ""
read -p "Option (1-3): " option

case $option in
    1)
        echo ""
        echo -e "${BLUE}🎤 Testing audio generation...${NC}"
        curl -X POST http://localhost:3000/api/tts/test \
            -H "Content-Type: application/json" \
            -d '{"text": "Hello! This is a test of Chatterbox TTS working correctly"}' | jq '.'
        ;;
    
    2)
        echo ""
        echo -e "${BLUE}🎥 Generating video without audio...${NC}"
        echo "(This takes ~5-10 seconds)"
        curl -X POST http://localhost:3000/api/video/generate-viral | jq '.'
        ;;
    
    3)
        echo ""
        echo -e "${BLUE}🎬 Generating COMPLETE video with real audio...${NC}"
        echo -e "${YELLOW}NOTE: This can take 1-2 minutes${NC}"
        echo ""
        echo "The process includes:"
        echo "  1. Generate script with AI"
        echo "  2. Generate audio with Chatterbox TTS"
        echo "  3. Render video with Remotion"
        echo "  4. Combine audio and video"
        echo ""
        read -p "Continue? (y/n): " confirm
        
        if [ "$confirm" = "y" ]; then
            echo ""
            echo "Generating..."
            curl -X POST http://localhost:3000/api/video/generate-complete | jq '.'
            
            if [ $? -eq 0 ]; then
                echo ""
                echo -e "${GREEN}✅ Video generated successfully!${NC}"
                echo "Find the file in: output/videos/"
                echo ""
                echo "To view the video:"
                echo "  open output/videos/final_*.mp4"
            fi
        fi
        ;;
    
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo "✨ Test completed"