#!/usr/bin/env python3
"""
Generador de Videos Virales con API Directa
Conecta directamente con el servidor sin pasar por generate.py
"""

import json
import os
import sys
import time
import requests
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

def animated_progress_bar(current, total, message="", width=50):
    """Display animated progress bar"""
    percent = int((current / total) * 100)
    filled = int(width * current / total)
    
    if percent < 30:
        color = Colors.RED
        bar_char = '▰'
        empty_char = '▱'
    elif percent < 60:
        color = Colors.YELLOW
        bar_char = '▰'
        empty_char = '▱'
    elif percent < 90:
        color = Colors.CYAN
        bar_char = '█'
        empty_char = '▒'
    else:
        color = Colors.GREEN
        bar_char = '█'
        empty_char = '░'
    
    bar = bar_char * filled + empty_char * (width - filled)
    
    animation_frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    frame = animation_frames[int(time.time() * 10) % len(animation_frames)]
    
    sys.stdout.write('\r\033[K')
    sys.stdout.write(f"{color}[{bar}] {Colors.WHITE}{percent:3d}% {frame} {Colors.YELLOW}{message}{Colors.END}")
    sys.stdout.flush()

def prepare_and_send_to_api(script):
    """Preparar datos y enviar directamente a la API"""
    
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
    
    # Dividir script en segmentos para la API
    words = script['script'].split(' ')
    segment_count = min(5, max(3, script['duration'] // 10))
    words_per_segment = len(words) // segment_count
    
    segments = []
    for i in range(segment_count):
        start = i * words_per_segment
        end = start + words_per_segment if i < segment_count - 1 else len(words)
        segment_text = ' '.join(words[start:end])
        if segment_text:
            segments.append(segment_text)
    
    # Crear estructura para la API
    synced_data = {
        "title": script['title'],
        "segments": [],
        "totalDuration": script['duration'],
        "videoStyle": video_style,
        "brollVideos": [],
        "metadata": {
            "scriptId": script['id'],
            "expectedViews": script['expectedViews'],
            "tags": script['tags']
        }
    }
    
    # Preparar segmentos con timing básico
    time_per_segment = script['duration'] / len(segments)
    current_time = 0
    
    for i, text in enumerate(segments):
        segment = {
            "text": text,
            "audioFile": f"/tmp/segment_{i}.wav",
            "duration": time_per_segment,
            "startTime": current_time,
            "endTime": current_time + time_per_segment,
            "wordTimings": [],
            "captions": []
        }
        synced_data['segments'].append(segment)
        current_time += time_per_segment
    
    # Guardar en synced-data.json para que la API lo use
    with open('src/remotion/synced-data.json', 'w', encoding='utf-8') as f:
        json.dump(synced_data, f, indent=2, ensure_ascii=False)
    
    return video_style, synced_data

def generate_viral_video_direct(script):
    """Generar video usando la API directamente"""
    
    print(f"\n{Colors.CYAN}{'═' * 60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.WHITE}GENERANDO VIDEO VIRAL{Colors.END}")
    print(f"{Colors.YELLOW}📺 {script['title']}{Colors.END}")
    print(f"{Colors.GREEN}📊 Views esperadas: {script['expectedViews']}{Colors.END}")
    print(f"{Colors.CYAN}⏱️  Duración: {script['duration']} segundos{Colors.END}")
    print(f"{Colors.CYAN}{'═' * 60}{Colors.END}\n")
    
    # Preparar datos
    print(f"{Colors.YELLOW}Preparando contenido viral...{Colors.END}")
    video_style, synced_data = prepare_and_send_to_api(script)
    print(f"{Colors.GREEN}✅ Contenido preparado{Colors.END}")
    print(f"{Colors.CYAN}🎨 Estilo visual: {video_style}{Colors.END}\n")
    
    # Conectar con la API usando SSE
    print(f"{Colors.CYAN}Conectando con el servidor...{Colors.END}\n")
    
    try:
        # Usar el endpoint de generación sincronizada con los parámetros correctos
        url = f'http://localhost:3000/api/video/generate-synced?duration={script["duration"]}&style={video_style}'
        
        response = requests.get(
            url,
            stream=True,
            timeout=1200  # 20 minutos
        )
        
        video_path = None
        last_progress = 0
        
        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8')
                if line.startswith('data: '):
                    try:
                        data = json.loads(line[6:])
                        
                        if data['type'] == 'start':
                            animated_progress_bar(0, 100, data['message'])
                            
                        elif data['type'] == 'progress':
                            progress = data.get('progress', last_progress)
                            last_progress = progress
                            
                            # Mostrar detalles si están disponibles
                            message = data['message']
                            if 'details' in data:
                                if 'segment' in data['details']:
                                    segment_info = data['details']['segment']
                                    if isinstance(segment_info, str) and len(segment_info) > 40:
                                        segment_info = segment_info[:40] + "..."
                                    message = f"{message} [{segment_info}]"
                            
                            animated_progress_bar(progress, 100, message)
                            
                        elif data['type'] == 'complete':
                            animated_progress_bar(100, 100, "¡Completado!")
                            video_path = data['videoPath']
                            
                            print(f"\n\n{Colors.GREEN}{'🎉' * 25}{Colors.END}")
                            print(f"{Colors.BOLD}{Colors.GREEN}¡VIDEO VIRAL GENERADO EXITOSAMENTE!{Colors.END}")
                            print(f"{Colors.GREEN}{'🎉' * 25}{Colors.END}\n")
                            
                            print(f"{Colors.WHITE}📁 Video guardado en:{Colors.END}")
                            print(f"   {Colors.CYAN}{video_path}{Colors.END}")
                            print(f"\n{Colors.YELLOW}📊 Métricas esperadas:{Colors.END}")
                            print(f"   Views: {Colors.GREEN}{script['expectedViews']}{Colors.END}")
                            print(f"   Duración: {Colors.GREEN}{script['duration']}s{Colors.END}")
                            print(f"   Tags: {Colors.GREEN}{', '.join(script['tags'])}{Colors.END}")
                            
                            # Guardar metadata
                            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                            metadata_path = f"output/viral_{script['id']}_{timestamp}.json"
                            
                            metadata = {
                                'script': script,
                                'videoPath': video_path,
                                'generatedAt': datetime.now().isoformat(),
                                'videoStyle': video_style,
                                'syncedData': synced_data
                            }
                            
                            with open(metadata_path, 'w', encoding='utf-8') as f:
                                json.dump(metadata, f, indent=2, ensure_ascii=False)
                            
                            print(f"\n{Colors.GREEN}📝 Metadata guardada en:{Colors.END}")
                            print(f"   {Colors.CYAN}{metadata_path}{Colors.END}")
                            break
                            
                        elif data['type'] == 'error':
                            print(f"\n\n{Colors.RED}❌ Error: {data['error']}{Colors.END}")
                            return None
                            
                    except json.JSONDecodeError as e:
                        pass  # Ignorar líneas que no son JSON
        
        return video_path
        
    except Exception as e:
        print(f"\n{Colors.RED}❌ Error de conexión: {str(e)}{Colors.END}")
        return None

def show_menu(scripts_data):
    """Mostrar menú de scripts virales"""
    print(f"{Colors.MAGENTA}{'🔥' * 30}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.WHITE}     GENERADOR DIRECTO DE VIDEOS VIRALES{Colors.END}")
    print(f"{Colors.YELLOW}     Conecta directamente con la API{Colors.END}")
    print(f"{Colors.MAGENTA}{'🔥' * 30}{Colors.END}\n")
    
    print(f"{Colors.CYAN}CANAL 1 - PSICOLOGÍA Y DRAMA:{Colors.END}")
    for i, script in enumerate(scripts_data['channel1_psychology'], 1):
        print(f"  {Colors.YELLOW}{i:2}.{Colors.END} {script['title'][:45]}...")
        print(f"      {Colors.GREEN}└─ {script['expectedViews']} | {script['duration']}s{Colors.END}")
    
    print(f"\n{Colors.CYAN}CANAL 2 - HORROR Y CREEPYPASTA:{Colors.END}")
    for i, script in enumerate(scripts_data['channel2_horror'], 6):
        print(f"  {Colors.YELLOW}{i:2}.{Colors.END} {script['title'][:45]}...")
        print(f"      {Colors.RED}└─ {script['expectedViews']} | {script['duration']}s{Colors.END}")
    
    print(f"\n  {Colors.MAGENTA}0.{Colors.END} 🎲 Generar TODOS los videos (batch)")
    print(f"  {Colors.RED}q.{Colors.END} Salir\n")

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
    
    while True:
        # Mostrar menú
        show_menu(scripts_data)
        
        # Obtener selección
        choice = input(f"{Colors.WHITE}Selecciona una opción [1-10, 0, q]: {Colors.END}").strip().lower()
        
        # Procesar selección
        if choice == 'q':
            print(f"{Colors.CYAN}¡Hasta luego!{Colors.END}")
            break
        elif choice == '0':
            print(f"{Colors.YELLOW}Modo batch no implementado aún{Colors.END}")
            continue
        
        try:
            choice_num = int(choice)
            if 1 <= choice_num <= 5:
                script = scripts_data['channel1_psychology'][choice_num - 1]
            elif 6 <= choice_num <= 10:
                script = scripts_data['channel2_horror'][choice_num - 6]
            else:
                print(f"{Colors.RED}Opción inválida{Colors.END}\n")
                continue
        except:
            print(f"{Colors.RED}Opción inválida{Colors.END}\n")
            continue
        
        # Mostrar script seleccionado
        print(f"\n{Colors.GREEN}SCRIPT SELECCIONADO:{Colors.END}")
        print(f"  📺 {script['title']}")
        print(f"  🏷️  {', '.join(script['tags'])}")
        print(f"  ⏱️  {script['duration']} segundos")
        print(f"\n{Colors.CYAN}Hook:{Colors.END} {script['hook']}")
        print(f"\n{Colors.CYAN}Preview:{Colors.END}")
        print(f"{script['script'][:200]}...")
        
        # Confirmar
        confirm = input(f"\n{Colors.YELLOW}¿Generar este video? [s/n]: {Colors.END}").strip().lower()
        if confirm != 's':
            print("Cancelado\n")
            continue
        
        # Generar video
        video_path = generate_viral_video_direct(script)
        
        if video_path:
            # Preguntar si quiere abrir el video
            open_video = input(f"\n{Colors.CYAN}¿Abrir el video? [s/n]: {Colors.END}").strip().lower()
            if open_video == 's':
                import subprocess
                import platform
                
                if platform.system() == 'Darwin':  # macOS
                    subprocess.run(['open', video_path])
                elif platform.system() == 'Linux':
                    subprocess.run(['xdg-open', video_path])
                elif platform.system() == 'Windows':
                    subprocess.run(['start', video_path], shell=True)
        
        print()  # Línea en blanco antes del siguiente menú

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Cancelado por el usuario{Colors.END}")
        sys.exit(0)