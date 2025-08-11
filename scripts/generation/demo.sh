#!/bin/bash

echo "🎬 YouTube Shorts Automation System - Demo"
echo "=========================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar que el servidor está corriendo
echo -e "${YELLOW}Verificando servidor...${NC}"
if curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}✅ Servidor funcionando${NC}"
else
    echo -e "${RED}❌ Error: El servidor no está corriendo${NC}"
    echo -e "${YELLOW}Ejecuta: npm run dev${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}¿Qué quieres hacer?${NC}"
echo "1) Ver una idea de contenido viral"
echo "2) Generar un script completo"
echo "3) Crear datos para video (Remotion)"
echo "4) Ejecutar demo completo"
echo "5) Ver estado del sistema"
echo ""
read -p "Selecciona una opción (1-5): " option

case $option in
    1)
        echo -e "\n${YELLOW}Generando idea viral...${NC}"
        curl -s http://localhost:3000/api/demo/idea | python3 -m json.tool
        ;;
    2)
        echo -e "\n${YELLOW}Generando script optimizado...${NC}"
        curl -s -X POST http://localhost:3000/api/demo/script | python3 -m json.tool
        ;;
    3)
        echo -e "\n${YELLOW}Creando datos para video...${NC}"
        response=$(curl -s -X POST http://localhost:3000/api/demo/video)
        echo $response | python3 -m json.tool
        echo -e "\n${GREEN}✅ Datos creados!${NC}"
        echo -e "${BLUE}Ahora ejecuta:${NC} npm run remotion:preview"
        ;;
    4)
        echo -e "\n${YELLOW}Ejecutando demo completo...${NC}"
        curl -s http://localhost:3000/api/demo/run | python3 -m json.tool
        echo -e "\n${GREEN}✅ Demo completado!${NC}"
        echo -e "${BLUE}Para ver el video:${NC}"
        echo "1. npm run remotion:preview (interfaz visual)"
        echo "2. npm run remotion:render (generar MP4)"
        ;;
    5)
        echo -e "\n${YELLOW}Estado del sistema:${NC}"
        curl -s http://localhost:3000/api/v1/status | python3 -m json.tool
        ;;
    *)
        echo -e "${RED}Opción no válida${NC}"
        ;;
esac

echo ""
echo -e "${GREEN}¡Listo!${NC} 🚀"