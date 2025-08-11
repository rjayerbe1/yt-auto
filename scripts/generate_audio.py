#!/usr/bin/env python3
"""
Script simplificado para generar audio con Chatterbox TTS
Uso: python3 generate_audio.py "texto" output.wav
"""

import sys
import json
import torch
import torchaudio as ta
from chatterbox.tts import ChatterboxTTS

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python3 generate_audio.py 'text' output.wav"}))
        sys.exit(1)
    
    text = sys.argv[1]
    output_path = sys.argv[2]
    
    try:
        # Detectar dispositivo
        device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # Cargar modelo
        print(f"Loading Chatterbox model on {device}...", file=sys.stderr)
        model = ChatterboxTTS.from_pretrained(device=device)
        
        # Generar audio
        print(f"Generating audio for: {text[:50]}...", file=sys.stderr)
        wav = model.generate(text)
        
        # Guardar audio
        ta.save(output_path, wav, model.sr)
        
        # Retornar éxito
        result = {
            "status": "success",
            "output": output_path,
            "sample_rate": model.sr,
            "device": device
        }
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "status": "error",
            "error": str(e)
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()