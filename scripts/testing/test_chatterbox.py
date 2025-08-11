#!/usr/bin/env python3
"""
Chatterbox TTS Test from Resemble AI
Run: python3 test_chatterbox.py
"""

import torch
import torchaudio as ta
from chatterbox.tts import ChatterboxTTS

print("🎤 Chatterbox TTS Test")
print("=" * 50)

# Detect device
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"📱 Using device: {device}")

# Load model (first time downloads ~2GB)
print("📦 Loading Chatterbox model...")
print("   (First time may take 1-2 minutes)")
model = ChatterboxTTS.from_pretrained(device=device)
print("✅ Model loaded")

# Test text
text = "Hello friends! Welcome to my YouTube Shorts channel. Today I bring you incredible content you can't miss. Like and subscribe!"

# Generate audio
print(f"\n🎵 Generating audio...")
print(f"   Text: {text[:50]}...")
wav = model.generate(text)

# Save audio
output_file = "test_audio.wav"
ta.save(output_file, wav, model.sr)

print(f"\n✅ Audio saved to: {output_file}")
print(f"   Sample rate: {model.sr} Hz")
print(f"   Duration: ~{len(wav[0])/model.sr:.2f} seconds")
print("\n🎧 Play the file with:")
print(f"   afplay {output_file}  # macOS")
print(f"   aplay {output_file}   # Linux")