#!/usr/bin/env python3
"""
Generador Integrado de Videos Virales
Genera videos directamente con el contenido viral sin pasos intermedios
"""

import json
import os
import sys
import time
import requests
import subprocess
from datetime import datetime

# ANSI colors
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    MAGENTA = '\033[95m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    END = '\033[0m'

def load_viral_scripts():
    """Cargar scripts virales"""
    script_path = 'data/viral-scripts.json'
    if not os.path.exists(script_path):
        print(f"{Colors.RED}❌ viral-scripts.json no encontrado!{Colors.END}")
        sys.exit(1)
    
    with open(script_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def prepare_synced_data(script):
    """Preparar el archivo synced-data.json con el contenido viral"""
    
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
    
    video_style = style_map.get(script.get('style', 'neon_cyberpunk'), 3)
    
    # Dividir script en segmentos
    words = script['script'].split(' ')
    segment_count = min(5, max(3, script['duration'] // 10))  # 1 segmento cada 10 segundos aprox
    words_per_segment = len(words) // segment_count
    
    segments = []
    for i in range(segment_count):
        start = i * words_per_segment
        end = start + words_per_segment if i < segment_count - 1 else len(words)
        segment_text = ' '.join(words[start:end])
        
        if segment_text:
            duration = script['duration'] / segment_count
            segments.append({
                "text": segment_text,
                "audioFile": f"/tmp/segment_{i}.wav",
                "duration": duration,
                "startTime": i * duration,
                "endTime": (i + 1) * duration,
                "wordTimings": [],
                "captions": []
            })
    
    # Crear estructura completa
    synced_data = {
        "title": script['title'],
        "segments": segments,
        "totalDuration": script['duration'],
        "videoStyle": video_style,
        "brollVideos": [],
        "metadata": {
            "scriptId": script['id'],
            "expectedViews": script['expectedViews'],
            "tags": script['tags']
        }
    }
    
    # Guardar en archivo
    output_path = 'src/remotion/synced-data.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(synced_data, f, indent=2, ensure_ascii=False)
    
    print(f"{Colors.GREEN}✅ Script viral preparado en synced-data.json{Colors.END}")
    return video_style

def show_menu(scripts_data):
    """Mostrar menú de scripts virales"""
    print(f"{Colors.MAGENTA}{'🔥' * 30}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.WHITE}     GENERADOR INTEGRADO DE VIDEOS VIRALES{Colors.END}")
    print(f"{Colors.MAGENTA}{'🔥' * 30}{Colors.END}\n")
    
    print(f"{Colors.CYAN}CANAL 1 - PSICOLOGÍA Y DRAMA:{Colors.END}")
    for i, script in enumerate(scripts_data['channel1_psychology'], 1):
        views = script['expectedViews']
        print(f"  {Colors.YELLOW}{i}.{Colors.END} {script['title'][:45]}...")
        print(f"     {Colors.GREEN}└─ {views} views | {script['duration']}s{Colors.END}")
    
    print(f"\n{Colors.CYAN}CANAL 2 - HORROR Y CREEPYPASTA:{Colors.END}")
    for i, script in enumerate(scripts_data['channel2_horror'], 6):
        views = script['expectedViews']
        print(f"  {Colors.YELLOW}{i}.{Colors.END} {script['title'][:45]}...")
        print(f"     {Colors.RED}└─ {views} views | {script['duration']}s{Colors.END}")
    
    print(f"\n  {Colors.MAGENTA}11.{Colors.END} 🎲 Video aleatorio (contenido no viral)")
    print(f"  {Colors.RED}12.{Colors.END} Salir\n")

def generate_video_with_script(script, channel_name):
    """Generar video usando generate.py con el contenido preparado"""
    
    print(f"\n{Colors.CYAN}{'═' * 60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.WHITE}GENERANDO VIDEO VIRAL{Colors.END}")
    print(f"{Colors.YELLOW}📺 {script['title']}{Colors.END}")
    print(f"{Colors.GREEN}📊 Views esperadas: {script['expectedViews']}{Colors.END}")
    print(f"{Colors.CYAN}⏱️  Duración: {script['duration']} segundos{Colors.END}")
    print(f"{Colors.CYAN}{'═' * 60}{Colors.END}\n")
    
    # Preparar synced-data.json
    print(f"{Colors.YELLOW}Preparando contenido viral...{Colors.END}")
    video_style = prepare_synced_data(script)
    
    # Ejecutar generate.py con respuestas automáticas
    print(f"{Colors.CYAN}Iniciando generación de video...{Colors.END}\n")
    
    # Respuestas automáticas para generate.py
    # 5 = Custom duration
    # [duration] = duración del script
    # [style] = estilo del video
    # n = no abrir el video al final
    responses = f"5\n{script['duration']}\n{video_style}\nn\n"
    
    # Ejecutar generate.py
    process = subprocess.Popen(
        ['python3', 'generate.py'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        universal_newlines=True
    )
    
    # Enviar respuestas y mostrar output en tiempo real
    for line in process.stdout:
        # Filtrar algunas líneas innecesarias
        if not any(skip in line for skip in ['Checking server', 'Server is running', 'Enter choice']):
            print(line, end='')
    
    process.stdin.write(responses)
    process.stdin.flush()
    process.wait()
    
    # Guardar metadata
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    metadata_path = f"output/viral_{script['id']}_{timestamp}.json"
    
    metadata = {
        'script': script,
        'channel': channel_name,
        'generatedAt': datetime.now().isoformat(),
        'videoStyle': video_style
    }
    
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    
    print(f"\n{Colors.GREEN}{'🎉' * 20}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.GREEN}¡VIDEO VIRAL GENERADO EXITOSAMENTE!{Colors.END}")
    print(f"{Colors.GREEN}{'🎉' * 20}{Colors.END}\n")
    print(f"{Colors.WHITE}📝 Metadata guardada en: {metadata_path}{Colors.END}")
    
    return True

def main():
    """Programa principal"""
    
    # Verificar servidor
    print(f"{Colors.CYAN}Verificando servidor...{Colors.END}")
    try:
        response = requests.get('http://localhost:3000/health', timeout=2)
        if response.status_code != 200:
            raise Exception("Server not healthy")
        print(f"{Colors.GREEN}✓ Servidor activo{Colors.END}\n")
    except:
        print(f"{Colors.RED}❌ El servidor no está corriendo!{Colors.END}")
        print(f"{Colors.YELLOW}Inícialo con: npm run dev{Colors.END}")
        sys.exit(1)
    
    # Cargar scripts
    scripts_data = load_viral_scripts()
    
    # Mostrar menú
    show_menu(scripts_data)
    
    # Obtener selección
    try:
        choice = int(input(f"{Colors.WHITE}Selecciona una opción [1-12]: {Colors.END}"))
    except:
        print(f"{Colors.RED}Opción inválida{Colors.END}")
        sys.exit(1)
    
    # Procesar selección
    if choice == 12:
        print(f"{Colors.CYAN}¡Hasta luego!{Colors.END}")
        sys.exit(0)
    elif choice == 11:
        print(f"{Colors.YELLOW}Generando video con contenido aleatorio...{Colors.END}")
        print(f"{Colors.CYAN}Usa python3 generate.py directamente para esto{Colors.END}")
        sys.exit(0)
    elif 1 <= choice <= 5:
        script = scripts_data['channel1_psychology'][choice - 1]
        channel = "Psicología y Drama"
    elif 6 <= choice <= 10:
        script = scripts_data['channel2_horror'][choice - 6]
        channel = "Horror y Creepypasta"
    else:
        print(f"{Colors.RED}Opción inválida{Colors.END}")
        sys.exit(1)
    
    # Mostrar script seleccionado
    print(f"\n{Colors.GREEN}SCRIPT SELECCIONADO:{Colors.END}")
    print(f"  📺 {script['title']}")
    print(f"  🏷️  {', '.join(script['tags'])}")
    print(f"  ⏱️  {script['duration']} segundos")
    print(f"\n{Colors.CYAN}Hook:{Colors.END} {script['hook']}")
    print(f"\n{Colors.CYAN}Preview:{Colors.END}")
    print(f"{script['script'][:200]}...")
    
    # Confirmar
    confirm = input(f"\n{Colors.YELLOW}¿Generar este video? [s/n]: {Colors.END}")
    if confirm.lower() != 's':
        print("Cancelado")
        sys.exit(0)
    
    # Generar video
    success = generate_video_with_script(script, channel)
    
    if success:
        # Preguntar si quiere generar otro
        another = input(f"\n{Colors.CYAN}¿Generar otro video? [s/n]: {Colors.END}")
        if another.lower() == 's':
            os.execv(sys.executable, ['python3'] + sys.argv)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Cancelado por el usuario{Colors.END}")
        sys.exit(0)