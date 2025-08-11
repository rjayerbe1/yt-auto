#!/bin/bash

# Monitor GPU usage on M1 Mac during video generation
echo "🖥️ Monitoring GPU Usage on Apple Silicon..."
echo "================================================"

# Check if we're on macOS with Apple Silicon
if [[ $(uname) != "Darwin" ]]; then
    echo "This script is for macOS only"
    exit 1
fi

# Check for Apple Silicon
if sysctl -n machdep.cpu.brand_string | grep -q "Apple"; then
    echo "✅ Apple Silicon detected: $(sysctl -n machdep.cpu.brand_string)"
else
    echo "❌ This script requires Apple Silicon"
    exit 1
fi

echo ""
echo "GPU Monitoring Active..."
echo "Press Ctrl+C to stop"
echo ""

# Monitor using powermetrics (requires sudo)
echo "Note: This requires administrator privileges to monitor GPU"
echo ""

# Function to check GPU usage without sudo (limited info)
check_gpu_simple() {
    while true; do
        # Check FFmpeg processes using VideoToolbox
        if pgrep -f "ffmpeg.*videotoolbox" > /dev/null; then
            echo "🟢 GPU ACTIVE: FFmpeg using VideoToolbox hardware acceleration"
        else
            echo "⚪ Waiting for video processing..."
        fi
        
        # Check system load
        load=$(uptime | awk '{print $(NF-2), $(NF-1), $NF}')
        echo "   System Load: $load"
        
        # Check memory pressure
        mem=$(vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
        echo "   Free Memory Pages: $mem"
        
        echo "---"
        sleep 2
    done
}

# Option to use powermetrics with sudo for detailed info
echo "Choose monitoring mode:"
echo "1) Simple monitoring (no sudo required)"
echo "2) Detailed GPU monitoring (requires sudo)"
read -p "Enter choice [1-2]: " choice

case $choice in
    1)
        check_gpu_simple
        ;;
    2)
        echo "Running detailed GPU monitoring (requires password)..."
        sudo powermetrics --samplers gpu_power -i 1000 --format plist | while read line; do
            if [[ $line == *"gpu_energy"* ]]; then
                echo "🔥 GPU Power Usage detected"
            fi
        done
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac