#!/usr/bin/env python3
"""
Instalador y configurador de Chatterbox TTS de Resemble AI
"""

import subprocess
import sys
import os

def install_chatterbox():
    """Instala Chatterbox TTS correctamente"""
    
    print("🎤 Instalando Chatterbox TTS de Resemble AI")
    print("=" * 50)
    
    # 1. Verificar Python version
    python_version = sys.version_info
    print(f"✅ Python {python_version.major}.{python_version.minor}")
    
    if python_version.minor < 10:
        print("⚠️ Se recomienda Python 3.10+ para mejor compatibilidad")
    
    # 2. Instalar dependencias básicas
    print("\n📦 Instalando dependencias...")
    dependencies = [
        "torch",
        "torchaudio", 
        "numpy",
        "scipy",
        "transformers",
    ]
    
    for dep in dependencies:
        print(f"  Instalando {dep}...")
        subprocess.run([sys.executable, "-m", "pip", "install", dep], 
                      capture_output=True)
    
    # 3. Instalar Chatterbox
    print("\n🎤 Instalando Chatterbox TTS...")
    
    # Opción 1: Desde PyPI
    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", "chatterbox-tts"],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print("⚠️ No se pudo instalar desde PyPI, intentando desde GitHub...")
        # Opción 2: Desde GitHub
        subprocess.run([
            sys.executable, "-m", "pip", "install",
            "git+https://github.com/resemble-ai/chatterbox.git"
        ])
    
    print("✅ Chatterbox instalado")
    
    # 4. Crear script de prueba
    print("\n📝 Creando script de prueba...")
    
    test_script = '''#!/usr/bin/env python3
"""
Script de prueba de Chatterbox TTS
"""

import sys
import json

try:
    import torch
    import torchaudio as ta
    from chatterbox.tts import ChatterboxTTS
    
    def generate_audio(text, output_path="output.wav", device=None):
        """Genera audio con Chatterbox"""
        
        # Detectar dispositivo
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        
        print(f"Usando dispositivo: {device}")
        
        # Cargar modelo
        print("Cargando modelo Chatterbox...")
        model = ChatterboxTTS.from_pretrained(device=device)
        
        # Generar audio
        print(f"Generando audio para: {text[:50]}...")
        wav = model.generate(text)
        
        # Guardar audio
        ta.save(output_path, wav, model.sr)
        print(f"✅ Audio guardado en: {output_path}")
        
        return {
            "status": "success",
            "output": output_path,
            "sample_rate": model.sr,
            "device": device
        }
    
    if __name__ == "__main__":
        import argparse
        parser = argparse.ArgumentParser()
        parser.add_argument("--text", required=True, help="Texto a convertir")
        parser.add_argument("--output", default="output.wav", help="Archivo de salida")
        parser.add_argument("--device", default=None, help="Dispositivo (cuda/cpu)")
        
        args = parser.parse_args()
        
        result = generate_audio(args.text, args.output, args.device)
        print(json.dumps(result))
        
except ImportError as e:
    print(f"Error importando Chatterbox: {e}")
    print("Instalando dependencias...")
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "chatterbox-tts"])
    print("Por favor ejecuta el script de nuevo")
    sys.exit(1)
'''
    
    with open("test_chatterbox.py", "w") as f:
        f.write(test_script)
    
    print("✅ Script de prueba creado: test_chatterbox.py")
    
    # 5. Probar la instalación
    print("\n🧪 Probando Chatterbox...")
    
    test_result = subprocess.run(
        [sys.executable, "-c", "from chatterbox.tts import ChatterboxTTS; print('✅ Chatterbox importado correctamente')"],
        capture_output=True,
        text=True
    )
    
    if test_result.returncode == 0:
        print(test_result.stdout)
        print("\n🎉 Chatterbox está listo para usar!")
        print("\nPrueba con:")
        print("  python test_chatterbox.py --text 'Hola mundo'")
    else:
        print("⚠️ Hubo un problema con la importación:")
        print(test_result.stderr)
        print("\nIntenta instalar manualmente:")
        print("  pip install chatterbox-tts")
        print("  o")
        print("  git clone https://github.com/resemble-ai/chatterbox.git")
        print("  cd chatterbox && pip install -e .")

if __name__ == "__main__":
    install_chatterbox()