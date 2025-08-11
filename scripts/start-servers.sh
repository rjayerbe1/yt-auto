#!/bin/bash

echo "🚀 Starting YouTube Shorts Automation System..."

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down servers..."
    if [ ! -z "$TTS_PID" ]; then
        kill $TTS_PID 2>/dev/null
    fi
    if [ ! -z "$NODE_PID" ]; then
        kill $NODE_PID 2>/dev/null
    fi
    exit 0
}

# Trap exit signals
trap cleanup EXIT INT TERM

# Start TTS server in background
echo "🎤 Starting TTS server..."
python3 scripts/tts_server.py > logs/tts_server.log 2>&1 &
TTS_PID=$!

# Wait for TTS server to be ready
echo "⏳ Waiting for TTS server to initialize model..."
sleep 5

# Check if TTS server is running
if ! kill -0 $TTS_PID 2>/dev/null; then
    echo "❌ TTS server failed to start. Check logs/tts_server.log"
    exit 1
fi

# Start Node.js server
echo "🌐 Starting Node.js server..."
npm run dev &
NODE_PID=$!

echo "✅ All servers started!"
echo "📝 TTS Server PID: $TTS_PID"
echo "📝 Node Server PID: $NODE_PID"
echo ""
echo "🎬 Ready to generate videos!"
echo "Run 'python3 generate.py' in another terminal to generate videos"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for servers
wait