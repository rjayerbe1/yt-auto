#!/usr/bin/env python3
"""
Solución temporal para generar videos virales
Modifica el flujo para usar el contenido correcto
"""

import json
import os
import sys
import subprocess
import time
from datetime import datetime

# Colores
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    END = '\033[0m'

def load_viral_scripts():
    """Cargar scripts virales"""
    with open('data/viral-scripts.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def prepare_script_segments(script_text, duration):
    """Dividir el script en segmentos para el formato correcto"""
    words = script_text.split()
    
    # Calcular segmentos basados en duración
    # Aproximadamente 2.5 palabras por segundo para buen ritmo
    words_per_second = 2.5
    total_words = len(words)
    
    # Crear 5-8 segmentos dependiendo de la duración
    if duration <= 30:
        num_segments = 5
    elif duration <= 45:
        num_segments = 6
    else:
        num_segments = 8
    
    words_per_segment = total_words // num_segments
    segments = []
    
    for i in range(num_segments):
        start_idx = i * words_per_segment
        if i == num_segments - 1:
            # Último segmento toma todas las palabras restantes
            segment_words = words[start_idx:]
        else:
            segment_words = words[start_idx:start_idx + words_per_segment]
        
        if segment_words:
            segments.append(' '.join(segment_words))
    
    return segments

def create_demo_script(viral_script):
    """Crear un script en el formato que espera DemoGenerator"""
    
    # Dividir el script en partes
    segments = prepare_script_segments(viral_script['script'], viral_script['duration'])
    
    # Crear estructura de demo script
    demo_script = {
        "topic": viral_script['title'],
        "hook": segments[0] if segments else viral_script['hook'],
        "content": segments[1:-1] if len(segments) > 2 else segments,
        "callToAction": segments[-1] if segments else "Follow for more",
        "duration": viral_script['duration'],
        "metadata": {
            "scriptId": viral_script['id'],
            "expectedViews": viral_script['expectedViews'],
            "tags": viral_script['tags']
        }
    }
    
    return demo_script

def save_demo_script(demo_script):
    """Guardar el script en un archivo temporal que el generador pueda usar"""
    
    # Crear directorio temporal si no existe
    temp_dir = 'output/temp'
    os.makedirs(temp_dir, exist_ok=True)
    
    # Guardar script
    script_path = os.path.join(temp_dir, 'current-viral-script.json')
    with open(script_path, 'w', encoding='utf-8') as f:
        json.dump(demo_script, f, indent=2, ensure_ascii=False)
    
    return script_path

def generate_with_nodejs(viral_script, style_num):
    """Generar video usando un script Node.js personalizado"""
    
    # Crear script Node.js temporal
    node_script = f"""
const {{ SyncedVideoGenerator }} = require('./dist/video/SyncedVideoGenerator');
const fs = require('fs');
const path = require('path');

async function generateViral() {{
    console.log('🔥 Generating viral video with correct content...');
    
    // Preparar el contenido viral
    const viralContent = {{
        title: "{viral_script['title'].replace('"', '\\"')}",
        segments: {json.dumps(prepare_script_segments(viral_script['script'], viral_script['duration']))}.map((text, i) => ({{
            text: text,
            audioFile: `/tmp/segment_${{i}}.wav`,
            duration: {viral_script['duration'] / len(prepare_script_segments(viral_script['script'], viral_script['duration']))},
            startTime: i * {viral_script['duration'] / len(prepare_script_segments(viral_script['script'], viral_script['duration']))},
            endTime: (i + 1) * {viral_script['duration'] / len(prepare_script_segments(viral_script['script'], viral_script['duration']))},
            wordTimings: [],
            captions: []
        }})),
        totalDuration: {viral_script['duration']},
        videoStyle: {style_num},
        brollVideos: []
    }};
    
    // Guardar en synced-data.json
    fs.writeFileSync(
        path.join(__dirname, 'src/remotion/synced-data.json'),
        JSON.stringify(viralContent, null, 2)
    );
    
    // Generar video
    const generator = new SyncedVideoGenerator({viral_script['duration']}, {style_num});
    
    generator.on('progress', (data) => {{
        console.log(`[${{data.progress}}%] ${{data.message}}`);
    }});
    
    const videoPath = await generator.generateSyncedVideo();
    console.log('✅ Video generated:', videoPath);
}}

generateViral().catch(console.error);
"""
    
    # Guardar script temporal
    script_path = 'output/temp/generate-viral-temp.js'
    os.makedirs('output/temp', exist_ok=True)
    with open(script_path, 'w') as f:
        f.write(node_script)
    
    # Compilar TypeScript si es necesario
    print(f"{Colors.YELLOW}Compilando TypeScript...{Colors.END}")
    subprocess.run(['npm', 'run', 'build'], capture_output=True)
    
    # Ejecutar script
    print(f"{Colors.CYAN}Generando video...{Colors.END}")
    result = subprocess.run(['node', script_path], capture_output=False, text=True)
    
    return result.returncode == 0

def main():
    print(f"{Colors.CYAN}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.WHITE}GENERADOR DE VIDEOS VIRALES (FIX){Colors.END}")
    print(f"{Colors.CYAN}{'='*60}{Colors.END}\n")
    
    # Cargar scripts
    data = load_viral_scripts()
    
    # Mostrar menú
    print(f"{Colors.YELLOW}SCRIPTS DISPONIBLES:{Colors.END}\n")
    
    all_scripts = []
    for i, script in enumerate(data['channel1_psychology'], 1):
        print(f"  {i}. {script['title'][:50]}...")
        all_scripts.append(script)
    
    for i, script in enumerate(data['channel2_horror'], len(data['channel1_psychology']) + 1):
        print(f"  {i}. {script['title'][:50]}...")
        all_scripts.append(script)
    
    # Seleccionar
    choice = input(f"\n{Colors.WHITE}Selecciona [1-{len(all_scripts)}]: {Colors.END}")
    
    try:
        idx = int(choice) - 1
        if 0 <= idx < len(all_scripts):
            script = all_scripts[idx]
        else:
            print(f"{Colors.RED}Opción inválida{Colors.END}")
            return
    except:
        print(f"{Colors.RED}Opción inválida{Colors.END}")
        return
    
    # Mostrar selección
    print(f"\n{Colors.GREEN}SELECCIONADO:{Colors.END}")
    print(f"  📺 {script['title']}")
    print(f"  ⏱️  {script['duration']}s")
    print(f"  📊 {script['expectedViews']} views esperadas")
    
    # Mapear estilos
    style_map = {
        'modern_gradient': 2,
        'minimalist': 4,
        'neon_cyberpunk': 3,
        'dynamic': 6,
        'dark_horror': 3,
        'glitch_tech': 6,
        'hospital_horror': 3,
        'professional': 4
    }
    style_num = style_map.get(script.get('style', 'neon_cyberpunk'), 3)
    
    # Confirmar
    confirm = input(f"\n{Colors.YELLOW}¿Generar video? [s/n]: {Colors.END}")
    if confirm.lower() != 's':
        return
    
    print(f"\n{Colors.CYAN}MÉTODO 1: Preparando script para generate.py...{Colors.END}")
    
    # Preparar el contenido en synced-data.json
    segments = prepare_script_segments(script['script'], script['duration'])
    segment_duration = script['duration'] / len(segments)
    
    synced_data = {
        "title": script['title'],
        "segments": [],
        "totalDuration": script['duration'],
        "videoStyle": style_num,
        "brollVideos": [],
        "metadata": {
            "scriptId": script['id'],
            "expectedViews": script['expectedViews'],
            "tags": script['tags']
        }
    }
    
    for i, text in enumerate(segments):
        synced_data['segments'].append({
            "text": text,
            "audioFile": f"/tmp/segment_{i}.wav",
            "duration": segment_duration,
            "startTime": i * segment_duration,
            "endTime": (i + 1) * segment_duration,
            "wordTimings": [],
            "captions": []
        })
    
    # Guardar en synced-data.json
    with open('src/remotion/synced-data.json', 'w', encoding='utf-8') as f:
        json.dump(synced_data, f, indent=2, ensure_ascii=False)
    
    print(f"{Colors.GREEN}✅ Contenido viral guardado en synced-data.json{Colors.END}")
    print(f"\n{Colors.YELLOW}IMPORTANTE:{Colors.END}")
    print(f"El contenido está listo, pero generate.py lo sobrescribirá con contenido aleatorio.")
    print(f"\n{Colors.CYAN}Opciones:{Colors.END}")
    print(f"1. Usar el script TypeScript directamente (recomendado)")
    print(f"2. Modificar SyncedVideoGenerator.ts para usar contenido existente")
    print(f"3. Crear un nuevo endpoint que no genere script aleatorio")
    
    print(f"\n{Colors.GREEN}Archivo preparado: src/remotion/synced-data.json{Colors.END}")
    print(f"Puedes verificar el contenido y usar Remotion directamente para renderizar.")

if __name__ == "__main__":
    main()