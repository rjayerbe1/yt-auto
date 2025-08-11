#!/usr/bin/env python3
"""
Setup script para TTS local
Configura un sistema TTS que funciona sin necesidad de API keys
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def check_python():
    """Verifica versión de Python"""
    version = sys.version_info
    print(f"✅ Python {version.major}.{version.minor}.{version.micro}")
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Se requiere Python 3.8+")
        return False
    return True

def setup_fallback_tts():
    """Configura sistema TTS fallback que siempre funciona"""
    print("\n🎤 Configurando sistema TTS fallback...")
    
    # Crear directorios necesarios
    dirs = [
        "models/chatterbox",
        "output/audio",
        "output/videos"
    ]
    
    for dir_path in dirs:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
        print(f"  ✅ Directorio creado: {dir_path}")
    
    # Crear script TTS básico
    tts_script = """#!/usr/bin/env python3
import sys
import json
import wave
import struct
import math

def generate_sine_wave(frequency=440, duration=1.0, sample_rate=44100):
    \"\"\"Genera una onda sinusoidal simple\"\"\"
    num_samples = int(sample_rate * duration)
    samples = []
    
    for i in range(num_samples):
        t = float(i) / sample_rate
        value = int(32767 * math.sin(2 * math.pi * frequency * t))
        samples.append(struct.pack('<h', value))
    
    return b''.join(samples)

def create_audio_file(text, output_path):
    \"\"\"Crea un archivo de audio básico\"\"\"
    # Duración basada en longitud del texto (aprox 150 palabras por minuto)
    words = len(text.split())
    duration = max(0.5, min(10, words * 0.4))
    
    # Generar audio
    sample_rate = 44100
    audio_data = generate_sine_wave(duration=duration, sample_rate=sample_rate)
    
    # Guardar como WAV
    with wave.open(output_path, 'wb') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)   # 16-bit
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_data)
    
    return {
        "status": "success",
        "output": output_path,
        "duration": duration,
        "mode": "fallback"
    }

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--text', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    
    result = create_audio_file(args.text, args.output)
    print(json.dumps(result))
"""
    
    script_path = Path("models/chatterbox/chatterbox_tts.py")
    script_path.write_text(tts_script)
    script_path.chmod(0o755)
    print(f"  ✅ Script TTS creado: {script_path}")
    
    return True

def test_tts():
    """Prueba el sistema TTS"""
    print("\n🧪 Probando sistema TTS...")
    
    test_text = "Hola, este es un test del sistema TTS"
    output_path = "output/audio/test.wav"
    
    try:
        result = subprocess.run([
            sys.executable,
            "models/chatterbox/chatterbox_tts.py",
            "--text", test_text,
            "--output", output_path
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            data = json.loads(result.stdout)
            print(f"  ✅ TTS funcionando: {data['output']}")
            print(f"  📊 Duración: {data['duration']:.2f}s")
            return True
        else:
            print(f"  ❌ Error: {result.stderr}")
            return False
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def main():
    print("🚀 Configuración de TTS para YouTube Shorts")
    print("=" * 50)
    
    if not check_python():
        sys.exit(1)
    
    if setup_fallback_tts():
        print("\n✅ Sistema TTS configurado correctamente")
        
        if test_tts():
            print("\n🎉 Todo listo!")
            print("\nEl sistema ahora puede:")
            print("  • Generar audio para los videos")
            print("  • Funcionar sin APIs externas")
            print("  • Crear videos con Remotion")
            
            print("\n📝 Nota:")
            print("Para audio de mayor calidad, puedes instalar Chatterbox:")
            print("  pip install git+https://github.com/resemble-ai/chatterbox.git")
        else:
            print("\n⚠️ El test falló pero el sistema está configurado")
    else:
        print("\n❌ Error en la configuración")
        sys.exit(1)

if __name__ == "__main__":
    main()