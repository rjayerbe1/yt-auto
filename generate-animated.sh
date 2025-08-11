#!/bin/bash

# YouTube Video Generator with ANIMATED Progress
# Enhanced visual feedback during generation

# Colors and styles
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# Animation frames
SPINNER=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
DOTS=('   ' '.  ' '.. ' '...')
WAVE=('▁' '▂' '▃' '▄' '▅' '▆' '▇' '█' '▇' '▆' '▅' '▄' '▃' '▂')
PROGRESS_CHARS=('▰' '▱')

# Function to show animated spinner
show_spinner() {
    local pid=$1
    local message=$2
    local i=0
    
    while kill -0 $pid 2>/dev/null; do
        printf "\r\033[K${CYAN}${SPINNER[$i]} ${WHITE}${message}${NC}"
        i=$(( (i+1) % ${#SPINNER[@]} ))
        sleep 0.1
    done
    printf "\r\033[K" # Clear line
}

# Function to show audio waveform animation
show_audio_wave() {
    local message=$1
    local duration=${2:-10}
    local end_time=$(($(date +%s) + duration))
    
    while [ $(date +%s) -lt $end_time ]; do
        for wave in "${WAVE[@]}"; do
            printf "\r${CYAN}🎵 "
            for j in {1..15}; do
                idx=$(( (j + wave) % ${#WAVE[@]} ))
                printf "${WAVE[$idx]}"
            done
            printf " ${WHITE}${message}${NC}"
            sleep 0.05
            
            # Check if we should stop
            if [ $(date +%s) -ge $end_time ]; then
                break
            fi
        done
    done
    printf "\r\033[K"
}

# Function for animated progress bar
show_progress_animated() {
    local current=$1
    local total=$2
    local message=$3
    local width=50
    
    local percent=$((current * 100 / total))
    local filled=$((current * width / total))
    
    # Color based on progress
    local color=$RED
    if [ $percent -ge 30 ]; then color=$YELLOW; fi
    if [ $percent -ge 60 ]; then color=$CYAN; fi
    if [ $percent -ge 90 ]; then color=$GREEN; fi
    
    # Clear the entire line first
    printf "\r\033[K"
    printf "${color}["
    
    # Filled part with animation
    for ((i=0; i<filled; i++)); do
        if [ $i -eq $((filled-1)) ] && [ $filled -lt $width ]; then
            # Animate the leading edge
            printf "▸"
        else
            printf "█"
        fi
    done
    
    # Empty part
    for ((i=filled; i<width; i++)); do
        printf "░"
    done
    
    printf "] ${WHITE}%3d%% ${YELLOW}${message}${NC}" "$percent"
}

# Main header with animation
clear
echo ""
printf "${MAGENTA}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║     🎬  YOUTUBE SHORTS VIDEO GENERATOR  🎬            ║"
echo "║                With Live Animations                    ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
printf "${NC}\n"

# Check server with animation
printf "${CYAN}Checking server"
for dot in "${DOTS[@]}"; do
    printf "\r${CYAN}Checking server${dot}${NC}"
    sleep 0.3
done

if curl -s http://localhost:3000/health > /dev/null; then
    printf "\r${GREEN}✓ Server is running!${NC}\n"
else
    printf "\r${RED}❌ Server is not running!${NC}\n"
    echo -e "${YELLOW}Start it with: npm run dev${NC}"
    exit 1
fi
echo ""

# Menu with hover effect simulation
echo -e "${CYAN}Select generation type:${NC}"
echo ""
options=(
    "⚡ Quick test (2 seconds)"
    "🔧 Optimized (10 seconds)"
    "📊 Full with progress (30 seconds)"
    "🎯 SYNCHRONIZED (perfect sync)"
    "✨ ANIMATED (visual effects)"
    "❌ Exit"
)

for i in "${!options[@]}"; do
    echo -e "  ${WHITE}$((i+1)))${NC} ${options[$i]}"
done
echo ""

read -p "$(echo -e ${BOLD}Enter choice [1-6]:${NC} )" choice

case $choice in
    5)
        echo ""
        echo -e "${BOLD}${MAGENTA}✨ ANIMATED Video Generation${NC}"
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo -e "${CYAN}Visual effects include:${NC}"
        echo -e "  • Particle animations"
        echo -e "  • Wave effects"
        echo -e "  • Glow and lighting"
        echo -e "  • Dynamic color shifts"
        echo ""
        
        # Start the generation with SSE progress
        (
            curl -N -s http://localhost:3000/api/video/generate-animated 2>/dev/null | while IFS= read -r line; do
                if [[ $line == data:* ]]; then
                    json="${line#data: }"
                    
                    # Parse progress
                    if [[ $json == *'"type":"progress"'* ]]; then
                        progress=$(echo "$json" | grep -o '"progress":[0-9]*' | cut -d':' -f2)
                        message=$(echo "$json" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
                        
                        # Show sparkle effects for animated generation
                        if [[ $message == *"effect"* ]] || [[ $message == *"animated"* ]]; then
                            echo ""
                            echo -e "${MAGENTA}✨ Effects Processing:${NC}"
                            
                            # Animated sparkles
                            for i in {1..5}; do
                                printf "    "
                                for j in {1..10}; do
                                    sparkles=("✨" "💫" "⭐" "🌟" "✨")
                                    printf "${sparkles[$((RANDOM % 5))]}"
                                done
                                printf "\r"
                                sleep 0.1
                            done
                            echo ""
                        fi
                        
                        # Clear line before updating progress
                        printf "\r\033[K"
                        show_progress_animated "$progress" 100 "$message"
                        
                    elif [[ $json == *'"type":"complete"'* ]]; then
                        printf "\r\033[K"
                        show_progress_animated 100 100 "Complete!"
                        echo ""
                        echo ""
                        
                        videoPath=$(echo "$json" | grep -o '"videoPath":"[^"]*' | cut -d'"' -f4)
                        
                        # Celebration with effects
                        echo -e "${MAGENTA}✨ ✨ ✨ ANIMATED VIDEO COMPLETE! ✨ ✨ ✨${NC}"
                        for i in {1..3}; do
                            printf "\r${BOLD}${MAGENTA}★ ☆ ★ ☆ ★ SUCCESS! ★ ☆ ★ ☆ ★${NC}"
                            sleep 0.2
                            printf "\r${MAGENTA}☆ ★ ☆ ★ ☆ SUCCESS! ☆ ★ ☆ ★ ☆${NC}"
                            sleep 0.2
                        done
                        echo ""
                        echo ""
                        
                        echo -e "${WHITE}Video saved at:${NC}"
                        echo -e "${BLUE}${videoPath}${NC}"
                        echo ""
                        echo -e "${CYAN}✨ Video includes animated visual effects!${NC}"
                        break
                        
                    elif [[ $json == *'"type":"error"'* ]]; then
                        error=$(echo "$json" | grep -o '"error":"[^"]*' | cut -d'"' -f4)
                        echo ""
                        echo -e "${RED}❌ Error: ${error}${NC}"
                        break
                    fi
                fi
            done
        )
        ;;
        
    4)
        echo ""
        echo -e "${BOLD}${GREEN}🎯 SYNCHRONIZED Video Generation${NC}"
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        
        # Start the generation with SSE progress
        (
            curl -N -s http://localhost:3000/api/video/generate-synced 2>/dev/null | while IFS= read -r line; do
                if [[ $line == data:* ]]; then
                    json="${line#data: }"
                    
                    # Parse progress (basic)
                    if [[ $json == *'"type":"progress"'* ]]; then
                        progress=$(echo "$json" | grep -o '"progress":[0-9]*' | cut -d':' -f2)
                        message=$(echo "$json" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
                        
                        # Special handling for audio generation
                        if [[ $message == *"audio"* ]]; then
                            echo ""
                            echo -e "${CYAN}🎤 Audio Generation:${NC}"
                            
                            # Extract segment info if available
                            segment=$(echo "$json" | grep -o '"segment":"[^"]*' | cut -d'"' -f4)
                            if [ ! -z "$segment" ]; then
                                echo -e "  ${DIM}Segment: ${segment}${NC}"
                            fi
                            
                            # Show audio wave animation for a few seconds
                            show_audio_wave "$message" 3 &
                            wave_pid=$!
                            sleep 3
                            kill $wave_pid 2>/dev/null
                            wait $wave_pid 2>/dev/null
                        fi
                        
                        # Clear line before updating progress
                        printf "\r\033[K"
                        show_progress_animated "$progress" 100 "$message"
                        
                    elif [[ $json == *'"type":"complete"'* ]]; then
                        printf "\r\033[K"
                        show_progress_animated 100 100 "Complete!"
                        echo ""
                        echo ""
                        
                        videoPath=$(echo "$json" | grep -o '"videoPath":"[^"]*' | cut -d'"' -f4)
                        
                        # Success animation
                        for i in {1..3}; do
                            printf "\r${GREEN}✅ SUCCESS! ✅${NC}"
                            sleep 0.2
                            printf "\r${BOLD}${GREEN}✅ SUCCESS! ✅${NC}"
                            sleep 0.2
                        done
                        echo ""
                        echo ""
                        
                        echo -e "${WHITE}Video saved at:${NC}"
                        echo -e "${BLUE}${videoPath}${NC}"
                        echo ""
                        echo -e "${CYAN}✨ Audio and text are perfectly synchronized!${NC}"
                        break
                        
                    elif [[ $json == *'"type":"error"'* ]]; then
                        error=$(echo "$json" | grep -o '"error":"[^"]*' | cut -d'"' -f4)
                        echo ""
                        echo -e "${RED}❌ Error: ${error}${NC}"
                        break
                    fi
                fi
            done
        )
        ;;
        
    *)
        echo -e "${YELLOW}Feature coming soon...${NC}"
        ;;
esac

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo -e "${DIM}Timestamp: $(date '+%Y-%m-%d %H:%M:%S')${NC}"