# 🚀 Inicio Rápido - YouTube Shorts Automation

## ✅ Sistema Ya Funcionando

- **Servidor API**: http://localhost:3000
- **Remotion Studio**: http://localhost:3001

## 🎬 Cómo Usar el Sistema AHORA

### 1️⃣ Ver el Preview del Video (Navegador)
```bash
# Ya está corriendo en:
http://localhost:3001
```
Abre esta URL en tu navegador para ver el editor visual de Remotion.

### 2️⃣ Generar un Video MP4
```bash
npm run remotion:render
```
El video se guardará en: `output/demo-video.mp4`

### 3️⃣ Usar el Menú Interactivo
```bash
./demo.sh
```
Selecciona:
- Opción 1: Ver idea viral
- Opción 2: Generar script
- Opción 3: Preparar datos para video
- Opción 4: Demo completo

## 📱 Ejemplos de Videos que Puedes Crear

### Video de Tecnología
```bash
curl -X POST http://localhost:3000/api/demo/video
```

### Ver Ideas Disponibles
```bash
curl http://localhost:3000/api/demo/idea | json_pp
```

## 🎨 Personalizar tu Video

### Cambiar Texto
Edita `src/video/remotion/simple.tsx`:
```javascript
// Línea 32 - Cambia el título
🎬 YouTube Shorts → Tu Título

// Línea 43 - Cambia el subtítulo  
Automatización Viral → Tu Subtítulo
```

### Cambiar Colores
```javascript
// Línea 24 - Cambia los colores del gradiente
background: `linear-gradient(${rotation}deg, 
  hsl(${hue}, 70%, 50%), 
  hsl(${hue + 60}, 70%, 50%))`
```

### Cambiar Duración
```javascript
// Línea 108
durationInFrames={150} // Cambia este número (30fps = 1 segundo son 30 frames)
```

## 🔥 Videos Pre-Configurados

### 1. Trucos de iPhone
```bash
curl http://localhost:3000/api/demo/run
```

### 2. Life Hacks de Cocina
```bash
curl -X POST http://localhost:3000/api/demo/script | json_pp
```

### 3. Datos Curiosos
```bash
curl http://localhost:3000/api/demo/idea | json_pp
```

## 🛠️ Comandos Esenciales

```bash
# Ver preview en navegador
npm run remotion:preview

# Generar video MP4
npm run remotion:render

# Menú interactivo
./demo.sh

# Ver estado del sistema
curl http://localhost:3000/api/v1/status
```

## 📂 Dónde Están los Archivos

- **Videos generados**: `output/demo-video.mp4`
- **Datos del video**: `output/temp/demo-data.json`
- **Templates**: `src/video/remotion/`
- **Logs**: `logs/combined.log`

## ⚡ Solución Rápida de Problemas

### Puerto 3001 ocupado
```bash
pkill -f "remotion"
npm run remotion:preview
```

### No se genera el video
```bash
# Instalar FFmpeg (si no lo tienes)
brew install ffmpeg  # Mac
```

### Ver logs de errores
```bash
tail -f logs/combined.log
```

## 🎯 Tu Primer Video en 3 Pasos

```bash
# Paso 1: Genera una idea
curl http://localhost:3000/api/demo/idea

# Paso 2: Crea el script
curl -X POST http://localhost:3000/api/demo/script

# Paso 3: Renderiza el video
npm run remotion:render
```

**¡El video estará en `output/demo-video.mp4`!** 🎉

## 💡 Tips

- Usa Chrome para mejor experiencia en http://localhost:3001
- Los videos se renderizan a 1080x1920 (formato vertical)
- Cada video dura 5 segundos por defecto
- Puedes cambiar todo en tiempo real en el navegador

---

**¿Necesitas ayuda?** Revisa `GUIA_USO.md` para más detalles.