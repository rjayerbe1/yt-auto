# YouTube Auto - Generador Automático de Videos

Sistema automatizado para generar YouTube Shorts usando IA, TTS y procesamiento de video.

## Estructura del Proyecto

```
yt-auto/
├── src/                    # Código fuente principal
│   ├── api/               # Endpoints y rutas API
│   ├── config/            # Configuración de la aplicación
│   ├── database/          # Modelos y conexión BD
│   ├── generators/        # Generadores de contenido
│   ├── scrapers/          # Scrapers de contenido
│   ├── services/          # Servicios TTS y otros
│   ├── video/             # Producción de videos
│   │   └── remotion/      # Componentes Remotion
│   ├── workers/           # Procesadores en background
│   └── types/             # Definiciones TypeScript
│
├── scripts/               # Scripts utilitarios
│   ├── setup/            # Scripts de instalación
│   │   ├── install-chatterbox.sh
│   │   ├── install_chatterbox.py
│   │   ├── install_chatterbox_simple.sh
│   │   ├── setup-google-cloud.sh
│   │   └── setup-tts.py
│   ├── testing/          # Scripts de prueba
│   │   ├── test_chatterbox.py
│   │   ├── test_final.sh
│   │   ├── test_multiple_voices.py
│   │   ├── test_voice_clone.py
│   │   └── test_youtube_script.py
│   ├── generation/       # Scripts de generación
│   │   ├── demo.sh
│   │   └── generate-video.sh
│   └── chatterbox_tts.py # Módulo TTS principal
│
├── docs/                  # Documentación
│   ├── ARQUITECTURA_CLOUD.md
│   ├── GUIA_USO.md
│   ├── INICIO_RAPIDO.md
│   ├── PLAN.md
│   ├── README.md
│   └── RESUMEN_FINAL.md
│
├── assets/               # Recursos multimedia
│   ├── effects/         # Efectos de video
│   ├── fonts/           # Fuentes tipográficas
│   ├── music/           # Música de fondo
│   └── templates/       # Plantillas de video
│
├── output/              # Archivos generados
│   ├── audio/          # Audios generados
│   ├── videos/         # Videos finales
│   ├── thumbnails/     # Miniaturas
│   └── temp/           # Archivos temporales
│
├── prisma/             # Esquema de base de datos
├── logs/               # Archivos de log
└── data/               # Datos persistentes
```

## Instalación Rápida

1. **Clonar repositorio:**
```bash
git clone https://github.com/tuusuario/yt-auto.git
cd yt-auto
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**
```bash
cp .env.example .env
# Editar .env con tus API keys
```

4. **Configurar TTS (opcional):**
```bash
# Para Chatterbox/Resemble AI
bash scripts/setup/install-chatterbox.sh

# Para Google Cloud TTS
bash scripts/setup/setup-google-cloud.sh
```

5. **Configurar base de datos:**
```bash
npx prisma migrate dev
```

## Uso

### Generar un video demo:
```bash
bash scripts/generation/demo.sh
```

### Generar video personalizado:
```bash
bash scripts/generation/generate-video.sh "Tu tema aquí"
```

### Ejecutar servidor de desarrollo:
```bash
npm run dev
```

### Ejecutar tests:
```bash
# Test completo del sistema
bash scripts/testing/test_final.sh

# Tests individuales
python scripts/testing/test_chatterbox.py
python scripts/testing/test_youtube_script.py
```

## Servicios TTS Disponibles

- **Chatterbox (Resemble AI)**: Clonación de voz realista
- **Google Cloud TTS**: Voces naturales multiidioma
- **ElevenLabs**: Voces de alta calidad
- **Fallback**: Generador básico de audio

## Configuración

Ver archivo `.env.example` para todas las opciones de configuración disponibles.

## Documentación

- [Guía de Uso Completa](docs/GUIA_USO.md)
- [Inicio Rápido](docs/INICIO_RAPIDO.md)
- [Arquitectura Cloud](docs/ARQUITECTURA_CLOUD.md)
- [Plan del Proyecto](docs/PLAN.md)

## Tecnologías

- **Backend**: Node.js, TypeScript, Express
- **Video**: Remotion, FFmpeg
- **TTS**: Chatterbox, Google Cloud, ElevenLabs
- **Base de Datos**: PostgreSQL con Prisma
- **Cache**: Redis
- **IA**: OpenAI GPT, Anthropic Claude

## Licencia

MIT