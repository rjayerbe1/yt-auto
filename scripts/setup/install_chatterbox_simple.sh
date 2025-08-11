#!/bin/bash

echo "🎤 Instalador Simple de Chatterbox TTS"
echo "======================================"
echo ""

# Instalar PyTorch primero
echo "📦 Instalando PyTorch..."
pip3 install torch torchaudio

# Instalar Chatterbox
echo ""
echo "📦 Instalando Chatterbox TTS..."
pip3 install git+https://github.com/resemble-ai/chatterbox.git

# Verificar instalación
echo ""
echo "🧪 Verificando instalación..."
python3 -c "from chatterbox.tts import ChatterboxTTS; print('✅ Chatterbox instalado correctamente')"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 ¡Listo! Ahora puedes ejecutar:"
    echo "   python3 test_chatterbox.py"
    echo ""
    echo "⚠️ NOTA: La primera vez descargará el modelo (~2GB)"
else
    echo ""
    echo "❌ Error en la instalación"
    echo "Intenta instalar manualmente:"
    echo "   pip3 install torch torchaudio"
    echo "   pip3 install git+https://github.com/resemble-ai/chatterbox.git"
fi