#!/bin/bash

echo "🧹 Cleaning up YouTube Shorts Automation System..."

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo "  ✓ Killing processes on port $port (PIDs: $pids)"
        echo "$pids" | xargs kill -9 2>/dev/null
    else
        echo "  • No processes found on port $port"
    fi
}

# Function to kill processes by name pattern
kill_process() {
    local pattern=$1
    local count=$(pgrep -f "$pattern" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$count" -gt 0 ]; then
        echo "  ✓ Killing $count process(es) matching: $pattern"
        pkill -f "$pattern" 2>/dev/null
    else
        echo "  • No processes matching: $pattern"
    fi
}

echo ""
echo "📍 Checking ports..."
kill_port 5555  # TTS server port
kill_port 3000  # Node server port
kill_port 3100  # Alternative port sometimes used

echo ""
echo "📍 Checking processes..."
kill_process "tts_server.py"
kill_process "nodemon"
kill_process "tsx.*index-simple"
kill_process "generate.py"
kill_process "start-servers.sh"

# Clean up Chrome headless processes if any
kill_process "chrome-headless-shell"

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "You can now run 'npm run dev:all' to start fresh."