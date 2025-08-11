#!/usr/bin/env python3
"""
Simple TTS script for Chatterbox
"""
import sys
import json
import os

# Capture all stdout to prevent model loading messages
from io import StringIO
old_stdout = sys.stdout
sys.stdout = StringIO()

import torch
import torchaudio as ta
from chatterbox.tts import ChatterboxTTS

# Restore stdout for our output
sys.stdout = old_stdout

if len(sys.argv) < 3:
    print(json.dumps({"error": "Usage: python3 simple_tts.py 'text' output.wav"}))
    sys.exit(1)

text = sys.argv[1]
output_path = sys.argv[2]

try:
    # Suppress output during model loading
    old_stdout = sys.stdout
    sys.stdout = StringIO()
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = ChatterboxTTS.from_pretrained(device=device)
    
    # Restore stdout
    sys.stdout = old_stdout
    
    # Generate audio
    wav = model.generate(text)
    
    # Save
    ta.save(output_path, wav, model.sr)
    
    # Only output clean JSON
    print(json.dumps({
        "success": True,
        "output": output_path,
        "sample_rate": model.sr
    }))
    
except Exception as e:
    sys.stdout = old_stdout  # Make sure stdout is restored
    print(json.dumps({"error": str(e)}))
    sys.exit(1)