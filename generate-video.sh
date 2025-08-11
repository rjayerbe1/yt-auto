#!/bin/bash

# YouTube Video Generator with Progress
# Usage: ./generate-video.sh

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Progress bar function
show_progress() {
    local progress=$1
    local message=$2
    local bar_length=50
    local filled_length=$((progress * bar_length / 100))
    
    # Create progress bar
    printf "\r${CYAN}["
    for ((i=0; i<filled_length; i++)); do
        printf "█"
    done
    for ((i=filled_length; i<bar_length; i++)); do
        printf "░"
    done
    printf "] ${WHITE}%3d%% ${YELLOW}%s${NC}" "$progress" "$message"
}

# Clear line
clear_line() {
    printf "\r\033[K"
}

echo -e "${MAGENTA}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║${WHITE}     🎬 YouTube Shorts Video Generator with Progress    ${MAGENTA}║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if server is running
echo -e "${CYAN}Checking server status...${NC}"
if ! curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${RED}❌ Server is not running!${NC}"
    echo -e "${YELLOW}Start it with: npm run dev${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}"
echo ""

# Choose generation type
echo -e "${CYAN}Select video generation type:${NC}"
echo -e "  ${WHITE}1)${NC} Quick test (2 seconds)"
echo -e "  ${WHITE}2)${NC} Optimized (10 seconds)"
echo -e "  ${WHITE}3)${NC} Full video with progress (30 seconds)"
echo -e "  ${WHITE}4)${NC} Complete video (30 seconds, simple endpoint)"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo -e "\n${CYAN}Generating quick 2-second test...${NC}"
        response=$(curl -s -X POST http://localhost:3000/api/test/quick-video)
        if [[ $response == *"success"* ]]; then
            videoPath=$(echo $response | grep -o '"videoPath":"[^"]*' | cut -d'"' -f4)
            echo -e "${GREEN}✅ Video generated successfully!${NC}"
            echo -e "${WHITE}Path: ${videoPath}${NC}"
        else
            echo -e "${RED}❌ Generation failed${NC}"
            echo "$response"
        fi
        ;;
        
    2)
        echo -e "\n${CYAN}Generating optimized 10-second video...${NC}"
        response=$(curl -s -X POST http://localhost:3000/api/test/optimized-video \
            -H "Content-Type: application/json" \
            -d '{"duration": 10}')
        if [[ $response == *"success"* ]]; then
            videoPath=$(echo $response | grep -o '"videoPath":"[^"]*' | cut -d'"' -f4)
            echo -e "${GREEN}✅ Video generated successfully!${NC}"
            echo -e "${WHITE}Path: ${videoPath}${NC}"
        else
            echo -e "${RED}❌ Generation failed${NC}"
            echo "$response"
        fi
        ;;
        
    3)
        echo -e "\n${CYAN}Generating full video with real-time progress...${NC}"
        echo -e "${YELLOW}This may take 3-5 minutes...${NC}\n"
        
        # Connect to SSE endpoint and parse progress
        curl -N -s http://localhost:3000/api/video/generate-with-progress 2>/dev/null | while IFS= read -r line; do
            if [[ $line == data:* ]]; then
                # Extract JSON data
                json="${line#data: }"
                
                # Parse JSON (basic parsing)
                if [[ $json == *'"type":"start"'* ]]; then
                    message=$(echo "$json" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
                    show_progress 0 "$message"
                    
                elif [[ $json == *'"type":"progress"'* ]]; then
                    progress=$(echo "$json" | grep -o '"progress":[0-9]*' | cut -d':' -f2)
                    message=$(echo "$json" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
                    show_progress "$progress" "$message"
                    
                elif [[ $json == *'"type":"complete"'* ]]; then
                    clear_line
                    show_progress 100 "Complete!"
                    echo ""
                    videoPath=$(echo "$json" | grep -o '"videoPath":"[^"]*' | cut -d'"' -f4)
                    echo -e "\n${GREEN}✅ Video generated successfully!${NC}"
                    echo -e "${WHITE}Path: ${videoPath}${NC}"
                    break
                    
                elif [[ $json == *'"type":"error"'* ]]; then
                    clear_line
                    error=$(echo "$json" | grep -o '"error":"[^"]*' | cut -d'"' -f4)
                    echo -e "\n${RED}❌ Error: ${error}${NC}"
                    break
                fi
            fi
        done
        ;;
        
    4)
        echo -e "\n${CYAN}Generating complete video (this may take 5-10 minutes)...${NC}"
        echo -e "${YELLOW}Processing...${NC}"
        
        # Show spinner while waiting
        (
            while true; do
                for s in '⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏'; do
                    printf "\r${CYAN}%s${NC} Generating video..." "$s"
                    sleep 0.1
                done
            done
        ) &
        spinner_pid=$!
        
        response=$(curl -s -X POST http://localhost:3000/api/video/generate-complete --max-time 1800)
        
        kill $spinner_pid 2>/dev/null
        clear_line
        
        if [[ $response == *"success"* ]]; then
            videoPath=$(echo $response | grep -o '"videoPath":"[^"]*' | cut -d'"' -f4)
            echo -e "${GREEN}✅ Video generated successfully!${NC}"
            echo -e "${WHITE}Path: ${videoPath}${NC}"
        else
            echo -e "${RED}❌ Generation failed${NC}"
            echo "$response"
        fi
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"

# Ask if user wants to open the video
if [[ -n "$videoPath" ]]; then
    echo ""
    read -p "Open video in player? [y/n]: " open_video
    if [[ $open_video == "y" || $open_video == "Y" ]]; then
        open "$videoPath" 2>/dev/null || xdg-open "$videoPath" 2>/dev/null || echo "Please open manually: $videoPath"
    fi
fi