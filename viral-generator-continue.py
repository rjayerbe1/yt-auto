#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import json
import time
import asyncio
import aiohttp
from datetime import datetime
from pathlib import Path

# Colores para la consola
class Colors:
    RESET = '\033[0m'
    BOLD = '\033[1m'
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'
    CYAN = '\033[36m'

def log(message, color=Colors.RESET):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {message}{Colors.RESET}")

def load_script_data(script_id):
    """Cargar datos del script desde archivo JSON"""
    scripts_path = Path("data/viral-scripts.json")
    
    if not scripts_path.exists():
        log(f"❌ No se encontró {scripts_path}", Colors.RED)
        return None
    
    with open(scripts_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Buscar el script por ID
    all_scripts = []
    for channel in ['channel1_psychology', 'channel2_horror']:
        all_scripts.extend(data.get(channel, []))
    
    for script in all_scripts:
        if script.get('id') == script_id:
            return script
    
    return None

async def continue_video_generation(script_id=None):
    """Continuar generación desde audios ya creados"""
    
    log("=" * 60, Colors.CYAN)
    log("🎬 CONTINUANDO GENERACIÓN DE VIDEO VIRAL", Colors.BOLD)
    log("=" * 60, Colors.CYAN)
    
    # Si no se especifica ID, usar el primer script de psicología
    if not script_id:
        script_id = "psych_001"
        log(f"📝 Usando script por defecto: {script_id}", Colors.YELLOW)
    
    # Cargar datos del script
    script_data = load_script_data(script_id)
    if not script_data:
        log(f"❌ No se encontró el script {script_id}", Colors.RED)
        return False
    
    log(f"✅ Script cargado: {script_data['title']}", Colors.GREEN)
    log(f"   Duración: {script_data['duration']}s", Colors.BLUE)
    log(f"   Términos B-roll: {len(script_data.get('brollSearchTerms', []))}", Colors.BLUE)
    
    # Verificar archivos de audio existentes
    audio_dir = Path("output/audio")
    if not audio_dir.exists():
        log("❌ No se encontró el directorio de audio", Colors.RED)
        return False
    
    audio_files = list(audio_dir.glob("*.wav"))
    json_files = list(audio_dir.glob("*.json"))
    
    log(f"\n📂 Archivos encontrados:", Colors.CYAN)
    log(f"   • Audios WAV: {len(audio_files)}", Colors.GREEN)
    log(f"   • Transcripciones JSON: {len(json_files)}", Colors.GREEN)
    
    # Verificar audio combinado
    combined_audio = None
    for audio_file in audio_files:
        if "combined" in audio_file.name:
            combined_audio = audio_file
            break
    
    if not combined_audio:
        log("❌ No se encontró el audio combinado", Colors.RED)
        return False
    
    log(f"✅ Audio combinado: {combined_audio.name}", Colors.GREEN)
    
    # Preparar datos para la API
    viral_script = {
        "id": script_data["id"],
        "title": script_data["title"],
        "hook": script_data["hook"],
        "script": script_data["script"],
        "cta": script_data["cta"],
        "tags": script_data["tags"],
        "duration": script_data["duration"],
        "brollSearchTerms": script_data.get("brollSearchTerms", [])
    }
    
    # Paso 3: Generar video con la API
    log("\n" + "=" * 60, Colors.YELLOW)
    log("📹 PASO 3: GENERANDO VIDEO", Colors.BOLD)
    log("=" * 60, Colors.YELLOW)
    
    try:
        async with aiohttp.ClientSession() as session:
            # Usar el endpoint de debug para pruebas rápidas
            url = "http://localhost:3000/api/viral-debug/generate"
            
            log(f"🔗 Enviando a: {url} [DEBUG MODE]", Colors.CYAN)
            log(f"📊 Datos del script:", Colors.BLUE)
            log(f"   • ID: {viral_script['id']}", Colors.BLUE)
            log(f"   • Título: {viral_script['title'][:50]}...", Colors.BLUE)
            log(f"   • Duración: {viral_script['duration']}s", Colors.BLUE)
            log(f"   • B-roll términos: {len(viral_script['brollSearchTerms'])}", Colors.BLUE)
            
            # Enviar solicitud con el script viral (el debug processor usará los audios existentes)
            async with session.post(
                url,
                json={
                    "viralScript": viral_script
                },
                timeout=aiohttp.ClientTimeout(total=1800)  # 30 minutos timeout
            ) as response:
                
                if response.status != 200:
                    error_text = await response.text()
                    log(f"❌ Error del servidor: {error_text}", Colors.RED)
                    return False
                
                # Leer respuesta con Server-Sent Events
                async for line in response.content:
                    line = line.decode('utf-8').strip()
                    if line.startswith('data: '):
                        try:
                            data = json.loads(line[6:])
                            
                            if data.get('type') == 'progress':
                                progress = data.get('progress', 0)
                                message = data.get('message', '')
                                log(f"   [{progress}%] {message}", Colors.CYAN)
                            
                            elif data.get('type') == 'complete':
                                video_path = data.get('videoPath', '')
                                log(f"\n✅ Video generado exitosamente!", Colors.GREEN)
                                log(f"📹 Ubicación: {video_path}", Colors.GREEN)
                                
                                # Guardar resultado
                                result_file = Path(f"output/viral_result_{script_id}_{int(time.time())}.json")
                                with open(result_file, 'w', encoding='utf-8') as f:
                                    json.dump({
                                        "script_id": script_id,
                                        "video_path": video_path,
                                        "timestamp": datetime.now().isoformat(),
                                        "duration": viral_script["duration"],
                                        "audio_used": str(combined_audio)
                                    }, f, indent=2, ensure_ascii=False)
                                
                                log(f"💾 Resultado guardado en: {result_file}", Colors.GREEN)
                                return True
                            
                            elif data.get('type') == 'error':
                                log(f"❌ Error: {data.get('message', 'Error desconocido')}", Colors.RED)
                                return False
                                
                        except json.JSONDecodeError:
                            pass
    
    except asyncio.TimeoutError:
        log("❌ Timeout al generar el video (30 minutos)", Colors.RED)
        return False
    except Exception as e:
        log(f"❌ Error al generar video: {str(e)}", Colors.RED)
        return False
    
    return True

async def main():
    """Función principal"""
    
    # Verificar argumentos
    script_id = None
    if len(sys.argv) > 1:
        script_id = sys.argv[1]
        log(f"📝 Usando script ID: {script_id}", Colors.CYAN)
    
    # Continuar generación
    success = await continue_video_generation(script_id)
    
    if success:
        log("\n" + "🎉" * 30, Colors.GREEN)
        log("¡GENERACIÓN COMPLETADA EXITOSAMENTE!", Colors.BOLD + Colors.GREEN)
        log("🎉" * 30, Colors.GREEN)
    else:
        log("\n❌ La generación falló", Colors.RED)
        sys.exit(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        log("\n⚠️ Proceso interrumpido por el usuario", Colors.YELLOW)
        sys.exit(0)
    except Exception as e:
        log(f"\n❌ Error fatal: {str(e)}", Colors.RED)
        sys.exit(1)