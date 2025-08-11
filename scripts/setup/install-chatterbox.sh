#!/bin/bash

echo "🎤 Instalador de Chatterbox TTS"
echo "================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar Python
echo -e "${YELLOW}Verificando Python...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✅ Python encontrado: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}❌ Python 3 no está instalado${NC}"
    echo "Por favor instala Python 3.9+ primero"
    exit 1
fi

# Crear entorno virtual
echo -e "${YELLOW}Creando entorno virtual...${NC}"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✅ Entorno virtual creado${NC}"
else
    echo -e "${GREEN}✅ Entorno virtual ya existe${NC}"
fi

# Activar entorno virtual
echo -e "${YELLOW}Activando entorno virtual...${NC}"
source venv/bin/activate

# Actualizar pip
echo -e "${YELLOW}Actualizando pip...${NC}"
pip install --upgrade pip

# Instalar Chatterbox
echo -e "${YELLOW}Instalando Chatterbox TTS...${NC}"
echo "Esto puede tomar varios minutos..."

# Opción 1: Instalar desde GitHub (recomendado)
pip install git+https://github.com/resemble-ai/chatterbox.git

# Si falla, intentar con requirements básicos
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Instalando dependencias básicas...${NC}"
    pip install torch torchaudio numpy scipy
    pip install git+https://github.com/resemble-ai/chatterbox.git
fi

# Verificar instalación
echo -e "${YELLOW}Verificando instalación...${NC}"
python3 -c "import chatterbox; print('✅ Chatterbox instalado correctamente')" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Chatterbox TTS instalado exitosamente${NC}"
    
    # Descargar modelo si es necesario
    echo -e "${YELLOW}Descargando modelo de Chatterbox...${NC}"
    python3 -c "
from chatterbox import Chatterbox
model = Chatterbox()
print('✅ Modelo descargado')
" 2>/dev/null
    
else
    echo -e "${YELLOW}⚠️ Chatterbox no se pudo instalar completamente${NC}"
    echo "El sistema usará audio fallback"
fi

# Crear directorio para modelos
mkdir -p models/chatterbox
mkdir -p output/audio

echo ""
echo -e "${GREEN}Instalación completada!${NC}"
echo ""
echo "Para usar Chatterbox en el proyecto:"
echo "1. Asegúrate de que el entorno virtual esté activado:"
echo "   source venv/bin/activate"
echo "2. El sistema detectará automáticamente Chatterbox"
echo ""
echo "Si prefieres usar el sistema sin Chatterbox:"
echo "El sistema generará archivos de audio vacíos como placeholder"