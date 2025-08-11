#!/usr/bin/env python3
"""
Complete test: Generate audio for a YouTube Shorts script
Run: python3 test_youtube_script.py
"""

import torch
import torchaudio as ta
from chatterbox.tts import ChatterboxTTS
import os

print("🎬 Audio Generator for YouTube Shorts")
print("=" * 50)

# Load model
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"📱 Device: {device}\n")

print("📦 Loading Chatterbox TTS...")
model = ChatterboxTTS.from_pretrained(device=device)
print("✅ Model loaded\n")

# Complete YouTube Short script
script = {
    "hook": "Did you know your iPhone can do THIS?",
    "content": [
        "Number 1: Press the side button three times to activate the secret accessibility mode.",
        "Number 2: Swipe down with three fingers for instant screenshot.",
        "Number 3: Hold the period at the end of a sentence to access all punctuation marks.",
        "Number 4: Shake your iPhone to undo the last thing you typed.",
        "Number 5: Use the back of your iPhone as a button. Go to Settings, Accessibility, Touch, and enable Back Tap."
    ],
    "cta": "Follow me for more amazing tricks you didn't know!"
}

print("📝 Video script:")
print(f"   Hook: {script['hook']}")
print(f"   Content: {len(script['content'])} tips")
print(f"   CTA: {script['cta'][:30]}...")
print()

# Create directory for audio files
os.makedirs("output/youtube_audio", exist_ok=True)

# Generate audio for each part
audio_files = []

print("🎵 Generating audio files...\n")

# 1. Hook (with emphasis)
print("1. Generating HOOK...")
hook_wav = model.generate(script['hook'])
hook_file = "output/youtube_audio/01_hook.wav"
ta.save(hook_file, hook_wav, model.sr)
audio_files.append(hook_file)
print(f"   ✅ {hook_file}\n")

# 2. Main content
for i, content in enumerate(script['content'], 1):
    print(f"2.{i} Generating content {i}/5...")
    content_wav = model.generate(content)
    content_file = f"output/youtube_audio/02_content_{i}.wav"
    ta.save(content_file, content_wav, model.sr)
    audio_files.append(content_file)
    print(f"   ✅ {content_file}")

print()

# 3. Call to Action (with urgency)
print("3. Generating CALL TO ACTION...")
cta_wav = model.generate(script['cta'])
cta_file = "output/youtube_audio/03_cta.wav"
ta.save(cta_file, cta_wav, model.sr)
audio_files.append(cta_file)
print(f"   ✅ {cta_file}\n")

# Calculate total duration
total_duration = 0
for file in audio_files:
    wav, sr = ta.load(file)
    total_duration += len(wav[0]) / sr

print("📊 Summary:")
print(f"   Total files: {len(audio_files)}")
print(f"   Total duration: ~{total_duration:.2f} seconds")
print(f"   Perfect for: YouTube Shorts (< 60s)")

print("\n🎧 To listen to all audio files in order:")
print("   afplay output/youtube_audio/*.wav")

print("\n💡 Next step:")
print("   Use these audio files with Remotion to create the complete video")
print("   Files are ready in: output/youtube_audio/")