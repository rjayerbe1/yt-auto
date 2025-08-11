#!/usr/bin/env python3
"""
Script para generar audio con Chatterbox TTS de Resemble AI
"""

import sys
import json
import argparse
from pathlib import Path

def generate_with_chatterbox(text, output_path, voice_ref=None):
    """Genera audio usando Chatterbox TTS"""
    try:
        import torch
        import torchaudio as ta
        from chatterbox.tts import ChatterboxTTS
        
        # Detectar dispositivo disponible
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Usando dispositivo: {device}", file=sys.stderr)
        
        # Cargar modelo
        print("Cargando modelo Chatterbox...", file=sys.stderr)
        model = ChatterboxTTS.from_pretrained(device=device)
        
        # Generar audio
        print(f"Generando audio...", file=sys.stderr)
        
        if voice_ref and Path(voice_ref).exists():
            # Usar voz de referencia para clonación
            wav = model.generate(text, audio_prompt_path=voice_ref)
        else:
            # Usar voz por defecto
            wav = model.generate(text)
        
        # Guardar audio
        ta.save(output_path, wav, model.sr)
        
        return {
            "status": "success",
            "output": output_path,
            "sample_rate": model.sr,
            "device": device,
            "model": "chatterbox"
        }
        
    except ImportError as e:
        print(f"Chatterbox no está instalado: {e}", file=sys.stderr)
        return {
            "status": "error",
            "error": "Chatterbox no está instalado. Instala con: pip install chatterbox-tts"
        }
    except Exception as e:
        print(f"Error generando audio: {e}", file=sys.stderr)
        return {
            "status": "error",
            "error": str(e)
        }

def generate_fallback(text, output_path):
    """Genera audio fallback si Chatterbox no está disponible"""
    try:
        # Intentar con gTTS como alternativa
        from gtts import gTTS
        
        # Detectar idioma
        lang = 'es' if any(c in text for c in 'áéíóúñ¿¡') else 'en'
        
        tts = gTTS(text=text, lang=lang, slow=False)
        tts.save(output_path)
        
        return {
            "status": "success",
            "output": output_path,
            "model": "gtts",
            "language": lang
        }
        
    except ImportError:
        # Si gTTS tampoco está disponible, usar pyttsx3
        try:
            import pyttsx3
            
            engine = pyttsx3.init()
            engine.save_to_file(text, output_path)
            engine.runAndWait()
            
            return {
                "status": "success",
                "output": output_path,
                "model": "pyttsx3"
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": f"No hay TTS disponible: {e}"
            }

def main():
    parser = argparse.ArgumentParser(description='Generar audio con Chatterbox TTS')
    parser.add_argument('--text', required=True, help='Texto a convertir')
    parser.add_argument('--output', required=True, help='Archivo de salida')
    parser.add_argument('--voice', help='Archivo de audio de referencia para clonar voz')
    parser.add_argument('--fallback', action='store_true', help='Usar fallback si Chatterbox falla')
    
    args = parser.parse_args()
    
    # Intentar con Chatterbox primero
    result = generate_with_chatterbox(args.text, args.output, args.voice)
    
    # Si falla y se permite fallback, usar alternativa
    if result['status'] == 'error' and args.fallback:
        print("Usando TTS alternativo...", file=sys.stderr)
        result = generate_fallback(args.text, args.output)
    
    # Imprimir resultado como JSON
    print(json.dumps(result))
    
    # Retornar código de salida apropiado
    sys.exit(0 if result['status'] == 'success' else 1)

if __name__ == "__main__":
    main()
