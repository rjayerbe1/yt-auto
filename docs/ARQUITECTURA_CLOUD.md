# 🚀 Arquitectura Cloud para YouTube Shorts Automation

## 📊 Comparación de Servicios

### TTS (Text-to-Speech) APIs
| Servicio | Precio | Velocidad | Calidad | Voces |
|----------|--------|-----------|---------|--------|
| **ElevenLabs** | $5/mes (10k chars) | ⚡ Rápido | ⭐⭐⭐⭐⭐ | 1000+ |
| **Google Cloud TTS** | $4/1M chars | ⚡ Muy rápido | ⭐⭐⭐⭐ | 400+ |
| **Amazon Polly** | $4/1M chars | ⚡ Muy rápido | ⭐⭐⭐⭐ | 60+ |
| **OpenAI TTS** | $15/1M chars | ⚡ Rápido | ⭐⭐⭐⭐⭐ | 6 |
| **Azure Speech** | $4/1M chars | ⚡ Muy rápido | ⭐⭐⭐⭐ | 400+ |
| **PlayHT** | $9/mes | ⚡ Rápido | ⭐⭐⭐⭐⭐ | 800+ |

### Recomendación: **Google Cloud TTS** o **ElevenLabs**

## 🏗️ Arquitectura Recomendada

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│            (Vercel / Netlify - GRATIS)          │
└────────────────────┬───────────────────────────┘
                     │
┌────────────────────▼───────────────────────────┐
│              Google Cloud Run                   │
│         (API REST - Serverless)                │
│      • Express.js                              │
│      • Gestión de tareas                       │
│      • $0 hasta 2M requests/mes                │
└──────┬─────────────┬──────────────┬───────────┘
       │             │              │
┌──────▼──────┐ ┌───▼────┐ ┌──────▼──────┐
│ Cloud SQL   │ │ Redis  │ │ Cloud Tasks │
│ PostgreSQL  │ │ Cache  │ │   Queue     │
└─────────────┘ └────────┘ └──────┬──────┘
                                   │
┌──────────────────────────────────▼─────────────┐
│              Servicios Externos                 │
├─────────────────────────────────────────────────┤
│ • Google Cloud TTS (audio rápido)              │
│ • Vast.ai (Chatterbox para voces premium)      │
│ • Remotion (renderizado local/cloud)           │
│ • YouTube API (upload automático)              │
└─────────────────────────────────────────────────┘
```

## 💰 Costos Estimados (1000 videos/mes)

### Opción A: Todo en Cloud (Recomendado)
- **Google Cloud Run**: $0 (free tier)
- **Cloud SQL**: $10/mes (micro instance)
- **Google Cloud TTS**: $4/mes (1M caracteres)
- **Cloud Storage**: $2/mes (100GB)
- **Total**: ~$16/mes

### Opción B: Híbrido con Vast.ai
- **Google Cloud Run**: $0
- **Vast.ai GPU**: $20/mes (50 horas)
- **Cloud Storage**: $2/mes
- **Total**: ~$22/mes

### Opción C: Premium con ElevenLabs
- **Google Cloud Run**: $0
- **ElevenLabs**: $5-22/mes
- **Cloud Storage**: $2/mes
- **Total**: ~$7-24/mes

## 🛠️ Implementación Paso a Paso

### 1. Configurar Google Cloud

```bash
# Instalar CLI
brew install google-cloud-sdk

# Autenticar
gcloud auth login

# Crear proyecto
gcloud projects create youtube-shorts-auto

# Configurar proyecto
gcloud config set project youtube-shorts-auto
```

### 2. Desplegar en Cloud Run

```bash
# Crear Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
EOF

# Build y deploy
gcloud run deploy youtube-shorts-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### 3. Configurar Google Cloud TTS

```typescript
// src/services/GoogleCloudTTS.ts
import textToSpeech from '@google-cloud/text-to-speech';

export class GoogleCloudTTS {
  private client = new textToSpeech.TextToSpeechClient();

  async generateSpeech(text: string): Promise<Buffer> {
    const request = {
      input: { text },
      voice: {
        languageCode: 'es-US',
        name: 'es-US-Neural2-B', // Voz masculina neural
        ssmlGender: 'MALE'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.1, // Un poco más rápido
        pitch: 0,
      },
    };

    const [response] = await this.client.synthesizeSpeech(request);
    return response.audioContent as Buffer;
  }
}
```

### 4. Configurar ElevenLabs (Alternativa Premium)

```typescript
// src/services/ElevenLabsTTS.ts
import axios from 'axios';

export class ElevenLabsTTS {
  private apiKey = process.env.ELEVENLABS_API_KEY;
  private voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam voice

  async generateSpeech(text: string): Promise<Buffer> {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`,
      {
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        }
      },
      {
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer'
      }
    );

    return Buffer.from(response.data);
  }
}
```

### 5. Usar Vast.ai para Procesamiento Pesado

```python
# vast_ai_worker.py
from chatterbox.tts import ChatterboxTTS
import redis
import json

# Conectar a Redis para recibir tareas
r = redis.from_url('redis://your-redis-url')

model = ChatterboxTTS.from_pretrained(device="cuda")

while True:
    # Esperar tarea
    task = r.blpop('tts_queue', timeout=60)
    if task:
        data = json.loads(task[1])
        
        # Generar audio
        wav = model.generate(data['text'])
        
        # Subir a Cloud Storage
        upload_to_gcs(wav, data['output_path'])
        
        # Marcar como completado
        r.set(f"task:{data['id']}", "completed")
```

## 🎯 Flujo Optimizado

1. **Usuario hace request** → Cloud Run API
2. **API crea tarea** → Cloud Tasks
3. **Para TTS rápido** → Google Cloud TTS (< 1 segundo)
4. **Para TTS premium** → Cola para Vast.ai con Chatterbox
5. **Video se genera** → Con Remotion en Cloud Run
6. **Upload a YouTube** → YouTube Data API

## 📝 Variables de Entorno

```env
# Google Cloud
GOOGLE_CLOUD_PROJECT=youtube-shorts-auto
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json

# TTS Services
GOOGLE_CLOUD_TTS_ENABLED=true
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_ENABLED=false

# Vast.ai
VASTAI_API_KEY=your_key_here
VASTAI_INSTANCE_ID=your_instance

# YouTube
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_secret

# Redis (para colas)
REDIS_URL=redis://localhost:6379
```

## 🚀 Scripts de Deployment

### Deploy a Cloud Run
```bash
#!/bin/bash
# deploy.sh

# Build y push a Container Registry
gcloud builds submit --tag gcr.io/youtube-shorts-auto/api

# Deploy a Cloud Run
gcloud run deploy api \
  --image gcr.io/youtube-shorts-auto/api \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production"
```

### Configurar CI/CD con GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - id: 'auth'
      uses: 'google-github-actions/auth@v1'
      with:
        credentials_json: '${{ secrets.GCP_SA_KEY }}'
    
    - name: Deploy to Cloud Run
      run: |
        gcloud run deploy api \
          --source . \
          --region us-central1
```

## 📊 Monitoreo

```typescript
// Configurar logging
import { Logging } from '@google-cloud/logging';

const logging = new Logging();
const log = logging.log('youtube-shorts');

// Log de métricas
async function logMetric(videoId: string, metrics: any) {
  const entry = log.entry({
    resource: { type: 'cloud_run_revision' },
    severity: 'INFO',
    jsonPayload: {
      videoId,
      ...metrics,
      timestamp: new Date().toISOString()
    }
  });
  
  await log.write(entry);
}
```

## 💡 Ventajas de esta Arquitectura

1. **Escalable**: Cloud Run escala automáticamente
2. **Económico**: Paga solo por uso
3. **Rápido**: TTS < 1 segundo con Google Cloud
4. **Flexible**: Puedes cambiar servicios fácilmente
5. **Profesional**: Infraestructura enterprise-ready

## 🔧 Comandos Útiles

```bash
# Ver logs
gcloud run logs read --service api

# Ver métricas
gcloud monitoring metrics list

# Actualizar servicio
gcloud run services update api --memory 4Gi

# Configurar dominio personalizado
gcloud run domain-mappings create --service api --domain yourdomain.com
```

## 📈 Optimizaciones

1. **Cache agresivo**: Redis para todo
2. **CDN para assets**: Cloudflare
3. **Batch processing**: Procesar múltiples videos a la vez
4. **Webhooks**: En lugar de polling
5. **Serverless**: Todo sin servidores dedicados

---

**¿Quieres que implemente alguna parte específica de esta arquitectura?**