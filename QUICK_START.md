# 🚀 Quick Start - YouTube Shorts Generator

## Opción 1: Iniciar TODO automáticamente (RECOMENDADO)

```bash
# Inicia ambos servidores (Node.js + TTS Server)
npm run dev:all

# En otra terminal, genera videos:
python3 generate.py
```

## Opción 2: Iniciar servidores por separado

### Terminal 1 - Servidor TTS (mantener el modelo cargado)
```bash
npm run tts:server
# O directamente:
python3 scripts/tts_server.py
```

### Terminal 2 - Servidor Node.js
```bash
npm run dev
```

### Terminal 3 - Generar videos
```bash
python3 generate.py
```

## 🎯 Ventajas del nuevo sistema

### ANTES (sin servidor TTS):
- Cada segmento de audio cargaba el modelo desde cero
- 5-10 segundos por segmento solo cargando el modelo
- Total para 5 segmentos: 25-50 segundos

### AHORA (con servidor TTS):
- El modelo se carga UNA SOLA VEZ al iniciar el servidor
- Generación en batch: todos los segmentos en una petición
- Total para 5 segmentos: 10-15 segundos
- **3-5x más rápido!**

## 📝 Notas

- El servidor TTS se inicia automáticamente si no está corriendo
- El modelo permanece en memoria para todas las generaciones
- Usa GPU automáticamente si está disponible (Apple Silicon MPS)
- Si el batch falla, tiene fallback a generación individual

## 🛑 Detener servidores

Si usaste `npm run dev:all`, presiona `Ctrl+C` para detener ambos servidores.

Si los iniciaste por separado, presiona `Ctrl+C` en cada terminal.