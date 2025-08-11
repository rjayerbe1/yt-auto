#!/bin/bash

echo "🎬 Generador de Videos YouTube Shorts con FFmpeg"
echo "================================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Verificar que FFmpeg está instalado
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg no está instalado"
    echo "Instálalo con: brew install ffmpeg"
    exit 1
fi

# Crear directorio de salida
mkdir -p output

echo -e "${YELLOW}Generando video...${NC}"

# Generar video con FFmpeg
ffmpeg -f lavfi -i color=c=black:s=1080x1920:d=5 \
  -vf "drawtext=text='YouTube Shorts':fontsize=80:fontcolor=white:x=(w-text_w)/2:y=200:fontfile=/System/Library/Fonts/Helvetica.ttc,
       drawtext=text='Sistema Automatizado':fontsize=50:fontcolor=red:x=(w-text_w)/2:y=400:fontfile=/System/Library/Fonts/Helvetica.ttc,
       drawtext=text='✅ Funcionando!':fontsize=60:fontcolor=yellow:x=(w-text_w)/2:y=600:fontfile=/System/Library/Fonts/Helvetica.ttc,
       drawtext=text='Genera videos virales':fontsize=40:fontcolor=white:x=(w-text_w)/2:y=800:fontfile=/System/Library/Fonts/Helvetica.ttc,
       drawtext=text='Con IA y FFmpeg':fontsize=40:fontcolor=cyan:x=(w-text_w)/2:y=900:fontfile=/System/Library/Fonts/Helvetica.ttc,
       drawtext=text='¡Sígueme para más!':fontsize=50:fontcolor=lime:x=(w-text_w)/2:y=1600:fontfile=/System/Library/Fonts/Helvetica.ttc" \
  -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p \
  -y output/demo-shorts.mp4 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Video generado exitosamente!${NC}"
    echo -e "${BLUE}📁 Ubicación: output/demo-shorts.mp4${NC}"
    echo ""
    echo "Para ver el video:"
    echo "  open output/demo-shorts.mp4"
else
    echo "❌ Error generando el video"
fi