#!/bin/bash

echo "🎯 Whisper Model Upgrade Script"
echo "================================"
echo ""
echo "Current model: base (142 MB)"
echo ""
echo "Available models:"
echo "1. small (466 MB) - Better word separation, ~2x slower"
echo "2. medium (1.5 GB) - Much better accuracy, ~5x slower"
echo "3. large-v3 (3.1 GB) - Best accuracy, ~10x slower"
echo ""
echo "Recommended: small (good balance of speed and accuracy)"
echo ""
read -p "Which model to download? (1/2/3): " choice

case $choice in
  1)
    MODEL="small"
    ;;
  2)
    MODEL="medium"
    ;;
  3)
    MODEL="large-v3"
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "📥 Downloading $MODEL model..."
echo ""

# Create directory if it doesn't exist
mkdir -p whisper-bin/models

# Download the model
cd whisper-bin/models

# Download using the whisper.cpp download script if available
if [ -f "../../whisper-temp/models/download-ggml-model.sh" ]; then
  echo "Using whisper.cpp download script..."
  bash ../../whisper-temp/models/download-ggml-model.sh $MODEL
else
  echo "Downloading directly from Hugging Face..."
  curl -L --progress-bar -o ggml-$MODEL.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-$MODEL.bin
fi

cd ../..

echo ""
echo "✅ Model downloaded successfully!"
echo ""
echo "📝 Updating WhisperTranscriber to use the new model..."

# Backup the current file
cp src/services/WhisperTranscriber.ts src/services/WhisperTranscriber.ts.backup

# Update the model path
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s/ggml-base\.bin/ggml-$MODEL.bin/g" src/services/WhisperTranscriber.ts
else
  # Linux
  sed -i "s/ggml-base\.bin/ggml-$MODEL.bin/g" src/services/WhisperTranscriber.ts
fi

echo "✅ Configuration updated!"
echo ""
echo "🎉 Upgrade complete! Using model: $MODEL"
echo ""
echo "Benefits of $MODEL model:"
case $choice in
  1)
    echo "- Better word boundary detection"
    echo "- Improved punctuation handling"
    echo "- More accurate for complex words"
    echo "- ~2x slower than base but still fast"
    ;;
  2)
    echo "- Excellent word separation"
    echo "- Very accurate transcription"
    echo "- Handles accents and complex speech well"
    echo "- ~5x slower but worth it for quality"
    ;;
  3)
    echo "- State-of-the-art accuracy"
    echo "- Perfect word boundaries"
    echo "- Handles all languages and accents"
    echo "- Slower but best quality possible"
    ;;
esac
echo ""
echo "🚀 Ready to generate videos with better transcription!"