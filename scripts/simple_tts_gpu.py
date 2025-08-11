#!/usr/bin/env python3
"""
GPU-accelerated TTS script for Chatterbox on Apple Silicon
"""
import sys
import json
import os
import platform

# Capture all stdout to prevent model loading messages
from io import StringIO
old_stdout = sys.stdout
sys.stdout = StringIO()

import torch
import torchaudio as ta

# Check if MPS (Metal Performance Shaders) is available for M1 Macs
def get_optimal_device():
    """Get the best available device for computation"""
    if torch.cuda.is_available():
        return "cuda"  # NVIDIA GPU
    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        # Apple Silicon GPU (M1/M2/M3)
        return "mps"
    else:
        return "cpu"

# Import after setting up device detection
from chatterbox.tts import ChatterboxTTS

# Restore stdout for our output
sys.stdout = old_stdout

if len(sys.argv) < 3:
    print(json.dumps({"error": "Usage: python3 simple_tts_gpu.py 'text' output.wav"}))
    sys.exit(1)

text = sys.argv[1]
output_path = sys.argv[2]

try:
    # Suppress output during model loading
    old_stdout = sys.stdout
    sys.stdout = StringIO()
    
    # Get optimal device
    device = get_optimal_device()
    
    # Log device selection (captured in StringIO)
    if device == "mps":
        print(f"Using Apple Silicon GPU (Metal Performance Shaders)")
    elif device == "cuda":
        print(f"Using NVIDIA GPU (CUDA)")
    else:
        print(f"Using CPU (no GPU acceleration available)")
    
    # Load model on the optimal device
    model = ChatterboxTTS.from_pretrained(device=device)
    
    # For MPS, optimize the model
    if device == "mps":
        # Enable memory efficient attention if available
        if hasattr(model, 'enable_xformers_memory_efficient_attention'):
            try:
                model.enable_xformers_memory_efficient_attention()
            except:
                pass  # Not all models support this
        
        # Set to eval mode for inference if available
        if hasattr(model, 'eval'):
            model.eval()
        
        # Generate audio with MPS optimization
        # Note: Some models might not support autocast, so we try with and without
        try:
            # Try with automatic mixed precision for faster inference
            with torch.autocast(device_type="mps", dtype=torch.float16):
                wav = model.generate(text)
        except:
            # Fallback to standard generation if autocast fails
            wav = model.generate(text)
    else:
        # Standard generation for CPU or CUDA
        wav = model.generate(text)
    
    # Restore stdout
    sys.stdout = old_stdout
    
    # Save the audio file
    ta.save(output_path, wav, model.sr)
    
    # Output clean JSON with device info
    print(json.dumps({
        "success": True,
        "output": output_path,
        "sample_rate": model.sr,
        "device": device,
        "gpu_accelerated": device in ["cuda", "mps"]
    }))
    
except Exception as e:
    sys.stdout = old_stdout  # Make sure stdout is restored
    print(json.dumps({
        "error": str(e),
        "device": get_optimal_device() if 'get_optimal_device' in locals() else "unknown"
    }))
    sys.exit(1)