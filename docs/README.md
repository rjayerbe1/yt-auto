# YouTube Shorts Automation System 🎬

Sistema completo de automatización para generar y publicar YouTube Shorts virales de forma automática usando **Remotion**, **FFmpeg** y **Chatterbox TTS**.

## 🚀 Características Principales

- **Análisis de Tendencias**: Scraping automático de Reddit, TikTok y YouTube
- **Generación de Contenido**: Scripts generados con IA (GPT-4)
- **Producción de Video**: Pipeline con **Remotion** (React) + **FFmpeg**
- **Text-to-Speech**: Voces naturales con **Chatterbox TTS**
- **Subtítulos Dinámicos**: Animados palabra por palabra con énfasis
- **Templates Virales**: 4 plantillas optimizadas para engagement
- **Publicación Automática**: Upload a YouTube en horarios óptimos
- **Analytics**: Tracking de métricas y optimización continua

## 📋 Requisitos

- Node.js v20+
- PostgreSQL 15+
- Redis 7+
- FFmpeg (se instala automáticamente)
- Cuenta de OpenAI con acceso a GPT-4
- Chatterbox API key (para TTS)
- YouTube API credentials
- Reddit API credentials (opcional)

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/yourusername/yt-auto.git
cd yt-auto
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

4. **Configurar base de datos**
```bash
# Crear base de datos PostgreSQL
createdb ytauto

# Ejecutar migraciones
npm run db:migrate
```

5. **Iniciar Redis**
```bash
redis-server
```

## 🚀 Uso

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm run build
npm start
```

### Workers (en terminal separada)
```bash
npm run worker
```

### Remotion - Preview y Renderizado
```bash
# Preview en tiempo real
npm run remotion:preview

# Renderizar video
npm run remotion:render
```

## 📡 API Endpoints

### Trends
- `GET /api/v1/trends` - Obtener tendencias
- `POST /api/v1/trends/analyze` - Iniciar análisis de tendencias
- `GET /api/v1/trends/:id` - Obtener tendencia específica

### Ideas
- `GET /api/v1/ideas` - Listar ideas de contenido
- `POST /api/v1/ideas/generate` - Generar ideas desde tendencias
- `PATCH /api/v1/ideas/:id/status` - Actualizar estado de idea

### Scripts
- `GET /api/v1/scripts` - Listar scripts
- `POST /api/v1/scripts/generate/:ideaId` - Generar script desde idea
- `POST /api/v1/scripts/:id/optimize` - Optimizar script existente

### Videos
- `GET /api/v1/videos` - Listar videos
- `GET /api/v1/videos/:id` - Obtener detalles de video
- `PATCH /api/v1/videos/:id/status` - Actualizar estado de video

### Analytics
- `GET /api/v1/analytics/dashboard` - Dashboard de métricas
- `GET /api/v1/analytics/video/:videoId` - Analytics de video específico

## 🎬 Sistema de Video con Remotion

### Templates Disponibles
- **TrendingTemplate**: Para contenido viral con efectos llamativos
- **FactsTemplate**: Para datos y hechos con visualización científica
- **StoryTimeTemplate**: Para narrativas con efectos cinematográficos
- **LifeHacksTemplate**: Para tips y trucos con indicadores paso a paso

### Características de Video
- **Resolución**: 1080x1920 (9:16 vertical)
- **FPS**: 30 frames por segundo
- **Duración**: 15-60 segundos
- **Subtítulos**: Animados palabra por palabra
- **Efectos**: Transiciones, partículas, gradientes animados
- **Audio**: TTS + música de fondo mezclada

## 🎤 Chatterbox TTS Integration

### Voces Disponibles
```javascript
const voices = [
  { id: 'alex', style: 'energetic' },    // Masculina enérgica
  { id: 'emma', style: 'conversational' }, // Femenina conversacional
  { id: 'jake', style: 'narrative' },     // Masculina narrativa
  { id: 'sophia', style: 'energetic' },   // Femenina enérgica
  { id: 'carlos', style: 'conversational' }, // Masculina español
  { id: 'luna', style: 'calm' }           // Femenina calmada
];
```

### Características de Audio
- **Detección automática de emociones**
- **Énfasis en palabras clave y números**
- **Velocidad y tono ajustables**
- **Soporte para clonación de voz**
- **Multi-idioma** (EN, ES, PT, FR)

## 🔧 Configuración

### OpenAI
```env
OPENAI_API_KEY=sk-...
```

### Chatterbox TTS
```env
CHATTERBOX_API_KEY=your-chatterbox-api-key
```

### YouTube OAuth
1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Crear nuevo proyecto
3. Habilitar YouTube Data API v3
4. Crear credenciales OAuth 2.0
5. Añadir redirect URI: `http://localhost:3000/auth/youtube/callback`

### Reddit API
1. Ir a [Reddit Apps](https://www.reddit.com/prefs/apps)
2. Crear nueva app (script type)
3. Copiar client ID y secret

## 📊 Arquitectura

```
yt-auto/
├── src/
│   ├── api/           # REST API endpoints
│   ├── services/      # Lógica de negocio
│   │   └── ChatterboxTTS.ts  # Servicio de Text-to-Speech
│   ├── workers/       # Procesamiento asíncrono
│   ├── scrapers/      # Trend scrapers
│   ├── generators/    # Content generators
│   ├── video/         # Video processing
│   │   ├── VideoProducer.ts    # Pipeline principal
│   │   ├── SubtitleGenerator.ts # Generador de subtítulos
│   │   └── remotion/            # Componentes de Remotion
│   │       ├── compositions/    # Composiciones principales
│   │       ├── templates/       # 4 templates virales
│   │       └── components/      # Efectos y transiciones
│   └── youtube/       # YouTube integration
├── prisma/            # Database schema
├── output/            # Generated videos
│   ├── videos/        # Videos finales
│   ├── audio/         # Archivos de audio TTS
│   ├── subtitles/     # Archivos SRT
│   └── thumbnails/    # Miniaturas generadas
└── logs/              # Application logs
```

## 🚀 Flujo de Trabajo

1. **Análisis de Tendencias** (cada 4 horas)
   - Scraping de Reddit/TikTok/YouTube
   - Cálculo de viral score
   - Almacenamiento en DB

2. **Generación de Ideas** (automático)
   - Análisis de tendencias top
   - Generación con GPT-4
   - Auto-aprobación de ideas con score >85

3. **Creación de Scripts** (cada 30 min)
   - Procesamiento de ideas aprobadas
   - Generación y optimización de scripts con GPT-4
   - Preparación para producción

4. **Producción de Video** (cada 20 min)
   - Text-to-speech con Chatterbox TTS
   - Renderizado con Remotion (React)
   - Post-procesamiento con FFmpeg
   - Subtítulos animados palabra por palabra
   - Mezcla de audio (voz + música)
   - Generación de thumbnail

5. **Publicación** (horarios óptimos)
   - Upload a YouTube
   - Optimización de metadata
   - Scheduling automático

## 🎯 Métricas de Éxito

- **Vistas objetivo**: 10K-100K en 48h
- **Retención**: >70%
- **CTR**: >15%
- **Engagement**: >10%

## 🔒 Seguridad

- Todas las API keys están encriptadas
- Rate limiting implementado
- Validación de entrada con Zod
- Logs de auditoría

## 📝 Scripts NPM

```bash
npm run dev          # Desarrollo con hot-reload
npm run build        # Build para producción
npm start            # Iniciar servidor producción
npm run worker       # Iniciar workers
npm run db:migrate   # Ejecutar migraciones
npm run db:studio    # Abrir Prisma Studio
npm run remotion:preview  # Preview de videos en Remotion
npm run remotion:render   # Renderizar video con Remotion
```

## 🎥 Pipeline de Producción de Video

### 1. Generación de Audio (Chatterbox TTS)
```typescript
// Genera audio con voces naturales
const tts = new ChatterboxTTS();
const audioPath = await tts.generateSpeech(
  text,
  { voiceId: 'alex', speed: 1.0, pitch: 1.0 }
);
```

### 2. Renderizado con Remotion
```typescript
// Renderiza video con React components
await renderMedia({
  composition: 'YouTubeShort',
  inputProps: {
    script,
    template: 'trending',
    audioUrl: audioPath,
    subtitlesEnabled: true
  }
});
```

### 3. Post-procesamiento con FFmpeg
```typescript
// Mejora el video final
ffmpeg(videoPath)
  .videoFilters(['subtitles', 'vignette', 'eq'])
  .audioCodec('aac')
  .videoCodec('libx264')
  .save(outputPath);
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles

## 🆘 Soporte

Para problemas o preguntas, abrir un [issue](https://github.com/yourusername/yt-auto/issues)

## 🎨 Templates de Video Disponibles

### 🔥 TrendingTemplate
- Gradientes animados y partículas flotantes
- Badges de "TRENDING" con animaciones
- Contadores de vistas/likes en tiempo real
- Efectos de fuego y emojis giratorios

### 🔬 FactsTemplate
- Diseño científico con grid animado
- Contador de hechos animado
- Iconos flotantes temáticos
- Badge de verificación "Fact Checked"

### 📖 StoryTimeTemplate
- Efecto cinematográfico con barras negras
- Efecto de máquina de escribir
- Partículas atmosféricas doradas
- Iluminación dramática con spotlight

### 💡 LifeHacksTemplate
- Indicadores de pasos visuales
- Tags de beneficios animados
- Cronómetro en tiempo real
- Iconos de herramientas animados

## 🎉 Próximas Características

- [ ] Soporte multi-idioma con traducción automática
- [ ] Integración con TikTok y Instagram Reels
- [ ] AI voice cloning con muestras personalizadas
- [ ] A/B testing automático de thumbnails
- [ ] Dashboard React con analytics en tiempo real
- [ ] Mobile app para monitoreo
- [ ] Integración con Stable Diffusion para imágenes
- [ ] Música generada por IA

## 🚀 Quick Start

```bash
# 1. Clonar el repositorio
git clone https://github.com/yourusername/yt-auto.git
cd yt-auto

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus API keys

# 4. Configurar base de datos
npm run db:migrate

# 5. Iniciar Redis
redis-server

# 6. Iniciar el sistema
npm run dev

# 7. En otra terminal, iniciar workers
npm run worker

# 8. Preview de videos (opcional)
npm run remotion:preview
```

## 📊 Tecnologías Principales

- **Backend**: Node.js + TypeScript + Express
- **Base de Datos**: PostgreSQL + Prisma ORM
- **Queue/Cache**: Redis + BullMQ
- **AI**: OpenAI GPT-4 + Chatterbox TTS
- **Video**: Remotion (React) + FFmpeg
- **Scraping**: Reddit API (Snoowrap)
- **YouTube**: Google APIs + OAuth 2.0

---

**Desarrollado con ❤️ para crear contenido viral automáticamente usando Remotion + FFmpeg + Chatterbox**