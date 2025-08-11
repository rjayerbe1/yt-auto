#!/bin/bash

echo "🎬 Testing Video with Audio Generation"
echo "======================================="
echo ""

# Test simple video without audio first
echo "1. Testing video generation without audio..."
curl -X POST http://localhost:3000/api/video/generate-viral | jq '.'

echo ""
echo "2. Would you like to test with audio? (y/n)"
read -p "Continue? " answer

if [ "$answer" = "y" ]; then
    echo ""
    echo "🎤 Generating video with audio (this will take 2-3 minutes)..."
    curl -X POST http://localhost:3000/api/video/generate-complete \
        -H "Content-Type: application/json" \
        --max-time 300 | jq '.'
fi

echo ""
echo "✅ Test complete!"
echo "Check output/videos/ for generated files"