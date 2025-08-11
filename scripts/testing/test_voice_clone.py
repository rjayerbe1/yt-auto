#!/usr/bin/env python3
"""
Voice cloning test with Chatterbox
Run: python3 test_voice_clone.py
"""

import torch
import torchaudio as ta
from chatterbox.tts import ChatterboxTTS
import os

print("🎭 Voice Cloning Test with Chatterbox")
print("=" * 50)

# Load model
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"📱 Device: {device}")

print("📦 Loading model...")
model = ChatterboxTTS.from_pretrained(device=device)
print("✅ Model loaded")

# Text to generate
text = "This is a voice cloning test. If you have a reference audio file, Chatterbox can mimic that voice!"

# Check for reference file
reference_audio = "reference_voice.wav"  # Change this to your file

if os.path.exists(reference_audio):
    print(f"\n🎤 Using reference voice: {reference_audio}")
    wav = model.generate(text, audio_prompt_path=reference_audio)
    output_file = "cloned_voice.wav"
else:
    print("\n⚠️ Reference file not found")
    print("   To clone a voice, record 10+ seconds of audio:")
    print("   - WAV format")
    print("   - 24kHz or higher")
    print("   - No background noise")
    print("\n🎤 Using default voice...")
    wav = model.generate(text)
    output_file = "default_voice.wav"

# Save audio
ta.save(output_file, wav, model.sr)

print(f"\n✅ Audio saved: {output_file}")
print(f"   Duration: ~{len(wav[0])/model.sr:.2f} seconds")

# Instructions for recording reference audio
print("\n💡 To record your own reference voice on macOS:")
print("   rec reference_voice.wav")
print("   Or use QuickTime Player > New Audio Recording")