#!/usr/bin/env python3
"""
Multiple voices and emotions test with Chatterbox
Run: python3 test_multiple_voices.py
"""

import torch
import torchaudio as ta
from chatterbox.tts import ChatterboxTTS

print("🎭 Multiple Voices and Emotions Test")
print("=" * 50)

# Load model
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"📱 Device: {device}\n")

print("📦 Loading Chatterbox model...")
model = ChatterboxTTS.from_pretrained(device=device)
print("✅ Model loaded\n")

# Different texts with different emotions
samples = [
    {
        "text": "WOW! This is AMAZING! I can't believe what I'm seeing!",
        "name": "excited",
        "description": "Excited voice"
    },
    {
        "text": "Hello friends, welcome to my channel. Today I bring you very interesting content.",
        "name": "neutral",
        "description": "Neutral/professional voice"
    },
    {
        "text": "Did you know this could change your life? It's something no one has told you before...",
        "name": "mysterious",
        "description": "Mysterious voice"
    },
    {
        "text": "SUBSCRIBE NOW! Hit the LIKE button! Turn on the BELL! Don't miss out!",
        "name": "urgent",
        "description": "Urgent/call to action voice"
    }
]

print("🎵 Generating different voice styles...\n")

for i, sample in enumerate(samples, 1):
    print(f"{i}. {sample['description']}")
    print(f"   Text: {sample['text'][:50]}...")
    
    # Generate audio
    wav = model.generate(sample['text'])
    
    # Save
    filename = f"voice_{sample['name']}.wav"
    ta.save(filename, wav, model.sr)
    
    print(f"   ✅ Saved: {filename}")
    print(f"   Duration: ~{len(wav[0])/model.sr:.2f}s\n")

print("🎧 Play the files:")
print("   afplay voice_*.wav  # Listen to all on macOS")

print("\n💡 Tip: Chatterbox automatically detects text emotion")
print("   - Use UPPERCASE for emphasis")
print("   - Exclamation marks for emotion")
print("   - Ellipsis for mystery")