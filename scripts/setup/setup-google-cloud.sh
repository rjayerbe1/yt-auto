#!/bin/bash

echo "☁️ Configuración de Google Cloud para YouTube Shorts"
echo "===================================================="
echo ""

# Instalar Google Cloud SDK
echo "1️⃣ Instalando Google Cloud SDK..."
if ! command -v gcloud &> /dev/null; then
    echo "Instalando gcloud CLI..."
    curl https://sdk.cloud.google.com | bash
    exec -l $SHELL
else
    echo "✅ gcloud ya está instalado"
fi

# Autenticar
echo ""
echo "2️⃣ Autenticación..."
gcloud auth login

# Crear proyecto
echo ""
echo "3️⃣ Creando proyecto..."
read -p "Nombre del proyecto (ej: youtube-shorts-auto): " PROJECT_ID
gcloud projects create $PROJECT_ID

# Configurar proyecto
gcloud config set project $PROJECT_ID

# Habilitar APIs necesarias
echo ""
echo "4️⃣ Habilitando APIs..."
gcloud services enable texttospeech.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable storage.googleapis.com

# Crear cuenta de servicio
echo ""
echo "5️⃣ Creando cuenta de servicio..."
gcloud iam service-accounts create youtube-shorts-sa \
    --display-name="YouTube Shorts Service Account"

# Dar permisos
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:youtube-shorts-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/editor"

# Descargar credenciales
echo ""
echo "6️⃣ Descargando credenciales..."
gcloud iam service-accounts keys create ./google-credentials.json \
    --iam-account=youtube-shorts-sa@$PROJECT_ID.iam.gserviceaccount.com

echo ""
echo "✅ Configuración completada!"
echo ""
echo "📝 Agrega esto a tu .env:"
echo "GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json"
echo "GOOGLE_CLOUD_PROJECT=$PROJECT_ID"
echo ""
echo "💰 Costos estimados:"
echo "   - Cloud TTS: $4 por 1M caracteres"
echo "   - Cloud Run: GRATIS (2M requests/mes)"
echo "   - Storage: $0.02/GB/mes"
echo ""
echo "🚀 Para desplegar tu app:"
echo "   gcloud run deploy --source ."