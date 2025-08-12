#!/usr/bin/env python3
"""
Generador de Videos Virales - Cliente Final
Usa los endpoints dedicados para contenido viral
"""

import requests
import json
import sys
import time
from datetime import datetime

# Colores ANSI
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

class ViralVideoClient:
    def __init__(self, base_url='http://localhost:3000'):
        self.base_url = base_url
        self.scripts = None
        
    def check_server(self):
        """Verificar que el servidor esté activo"""
        try:
            response = requests.get(f'{self.base_url}/health', timeout=2)
            return response.status_code == 200
        except:
            return False
    
    def load_scripts(self):
        """Cargar scripts virales desde el servidor"""
        try:
            response = requests.get(f'{self.base_url}/api/viral/scripts')
            if response.status_code == 200:
                self.scripts = response.json()
                return True
            return False
        except Exception as e:
            print(f"{Colors.RED}Error cargando scripts: {e}{Colors.END}")
            return False
    
    def display_menu(self):
        """Mostrar menú de scripts disponibles"""
        print(f"\n{Colors.MAGENTA}{'🔥' * 30}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.WHITE}     GENERADOR DE VIDEOS VIRALES{Colors.END}")
        print(f"{Colors.YELLOW}     Sistema Completo de Producción{Colors.END}")
        print(f"{Colors.MAGENTA}{'🔥' * 30}{Colors.END}\n")
        
        if not self.scripts:
            print(f"{Colors.RED}No hay scripts cargados{Colors.END}")
            return
        
        all_scripts = []
        
        # Canal 1 - Psicología
        print(f"{Colors.CYAN}CANAL 1 - PSICOLOGÍA Y DRAMA:{Colors.END}")
        for i, script in enumerate(self.scripts['channel1_psychology'], 1):
            print(f"  {Colors.YELLOW}{i:2}.{Colors.END} {script['title'][:45]}...")
            print(f"      {Colors.GREEN}└─ {script['expectedViews']} | {script['duration']}s{Colors.END}")
            all_scripts.append(('psychology', script))
        
        # Canal 2 - Horror
        print(f"\n{Colors.CYAN}CANAL 2 - HORROR Y CREEPYPASTA:{Colors.END}")
        for i, script in enumerate(self.scripts['channel2_horror'], len(self.scripts['channel1_psychology']) + 1):
            print(f"  {Colors.YELLOW}{i:2}.{Colors.END} {script['title'][:45]}...")
            print(f"      {Colors.RED}└─ {script['expectedViews']} | {script['duration']}s{Colors.END}")
            all_scripts.append(('horror', script))
        
        print(f"\n  {Colors.CYAN}0.{Colors.END} 📊 Ver estadísticas")
        print(f"  {Colors.RED}q.{Colors.END} Salir\n")
        
        return all_scripts
    
    def show_statistics(self):
        """Mostrar estadísticas de los scripts"""
        if not self.scripts:
            return
        
        print(f"\n{Colors.CYAN}{'═' * 60}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.WHITE}ESTADÍSTICAS DE CONTENIDO VIRAL{Colors.END}")
        print(f"{Colors.CYAN}{'═' * 60}{Colors.END}\n")
        
        # Calcular estadísticas
        all_scripts = self.scripts['channel1_psychology'] + self.scripts['channel2_horror']
        total_duration = sum(s['duration'] for s in all_scripts)
        avg_duration = total_duration / len(all_scripts)
        
        print(f"{Colors.YELLOW}Total de scripts:{Colors.END} {len(all_scripts)}")
        print(f"{Colors.YELLOW}Duración total:{Colors.END} {total_duration}s ({total_duration/60:.1f} minutos)")
        print(f"{Colors.YELLOW}Duración promedio:{Colors.END} {avg_duration:.1f}s")
        
        # Tags más comunes
        all_tags = []
        for script in all_scripts:
            all_tags.extend(script['tags'])
        
        from collections import Counter
        tag_counts = Counter(all_tags)
        
        print(f"\n{Colors.CYAN}Tags más comunes:{Colors.END}")
        for tag, count in tag_counts.most_common(5):
            print(f"  • {tag}: {count} videos")
        
        input(f"\n{Colors.YELLOW}Presiona Enter para continuar...{Colors.END}")
    
    def generate_video(self, script_id):
        """Generar video viral usando SSE para progreso en tiempo real"""
        print(f"\n{Colors.CYAN}Conectando con el servidor...{Colors.END}")
        
        try:
            # Usar endpoint con SSE para progreso
            response = requests.get(
                f'{self.base_url}/api/viral/generate/{script_id}',
                stream=True,
                timeout=1200
            )
            
            if response.status_code == 404:
                print(f"{Colors.RED}Script no encontrado{Colors.END}")
                return False
            
            # Procesar eventos SSE
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        try:
                            data = json.loads(line[6:])
                            
                            if data['type'] == 'start':
                                print(f"\n{Colors.GREEN}{data['message']}{Colors.END}")
                                if 'script' in data:
                                    script = data['script']
                                    print(f"{Colors.YELLOW}Duración: {script['duration']}s{Colors.END}")
                                    print(f"{Colors.YELLOW}Views esperadas: {script['expectedViews']}{Colors.END}")
                                
                            elif data['type'] == 'progress':
                                progress = data.get('progress', 0)
                                message = data.get('message', '')
                                bar_width = 50
                                filled = int(bar_width * progress / 100)
                                bar = '█' * filled + '░' * (bar_width - filled)
                                
                                # Color según progreso
                                if progress < 30:
                                    color = Colors.RED
                                elif progress < 70:
                                    color = Colors.YELLOW
                                else:
                                    color = Colors.GREEN
                                
                                sys.stdout.write(f'\r{color}[{bar}] {progress:3d}% {Colors.WHITE}{message}{Colors.END}')
                                sys.stdout.flush()
                                
                            elif data['type'] == 'complete':
                                print(f"\n\n{Colors.GREEN}{'🎉' * 20}{Colors.END}")
                                print(f"{Colors.BOLD}{Colors.GREEN}¡VIDEO VIRAL GENERADO EXITOSAMENTE!{Colors.END}")
                                print(f"{Colors.GREEN}{'🎉' * 20}{Colors.END}\n")
                                
                                print(f"{Colors.WHITE}📁 Archivo: {data['videoPath']}{Colors.END}")
                                
                                if 'metadata' in data:
                                    meta = data['metadata']
                                    print(f"\n{Colors.CYAN}Metadata:{Colors.END}")
                                    print(f"  • ID: {meta['scriptId']}")
                                    print(f"  • Título: {meta['title']}")
                                    print(f"  • Duración: {meta['duration']}s")
                                    print(f"  • Views esperadas: {meta['expectedViews']}")
                                
                                return data['videoPath']
                                
                            elif data['type'] == 'error':
                                print(f"\n\n{Colors.RED}❌ Error: {data['error']}{Colors.END}")
                                return False
                                
                        except json.JSONDecodeError:
                            pass
            
            return False
            
        except Exception as e:
            print(f"\n{Colors.RED}Error de conexión: {e}{Colors.END}")
            return False
    
    def run(self):
        """Ejecutar el cliente interactivo"""
        # Verificar servidor
        print(f"{Colors.CYAN}Verificando servidor...{Colors.END}")
        if not self.check_server():
            print(f"{Colors.RED}❌ El servidor no está activo{Colors.END}")
            print(f"{Colors.YELLOW}Inicia el servidor con: npm run dev{Colors.END}")
            sys.exit(1)
        
        print(f"{Colors.GREEN}✓ Servidor activo{Colors.END}")
        
        # Cargar scripts
        print(f"{Colors.CYAN}Cargando scripts virales...{Colors.END}")
        if not self.load_scripts():
            print(f"{Colors.RED}❌ No se pudieron cargar los scripts{Colors.END}")
            sys.exit(1)
        
        print(f"{Colors.GREEN}✓ Scripts cargados{Colors.END}")
        
        # Loop principal
        while True:
            all_scripts = self.display_menu()
            
            if not all_scripts:
                break
            
            choice = input(f"{Colors.WHITE}Selecciona una opción: {Colors.END}").strip().lower()
            
            if choice == 'q':
                print(f"{Colors.CYAN}¡Hasta luego!{Colors.END}")
                break
            elif choice == '0':
                self.show_statistics()
                continue
            
            try:
                idx = int(choice) - 1
                if 0 <= idx < len(all_scripts):
                    channel, script = all_scripts[idx]
                    
                    # Mostrar detalles del script
                    print(f"\n{Colors.GREEN}SCRIPT SELECCIONADO:{Colors.END}")
                    print(f"  📺 {script['title']}")
                    print(f"  📊 {script['expectedViews']} views esperadas")
                    print(f"  ⏱️  {script['duration']} segundos")
                    print(f"  🏷️  {', '.join(script['tags'])}")
                    
                    # Confirmar generación
                    confirm = input(f"\n{Colors.YELLOW}¿Generar este video? [s/n]: {Colors.END}").strip().lower()
                    if confirm == 's':
                        video_path = self.generate_video(script['id'])
                        
                        if video_path:
                            # Ofrecer abrir el video
                            open_video = input(f"\n{Colors.CYAN}¿Abrir el video? [s/n]: {Colors.END}").strip().lower()
                            if open_video == 's':
                                import subprocess
                                import platform
                                
                                if platform.system() == 'Darwin':
                                    subprocess.run(['open', video_path])
                                elif platform.system() == 'Linux':
                                    subprocess.run(['xdg-open', video_path])
                                elif platform.system() == 'Windows':
                                    subprocess.run(['start', video_path], shell=True)
                else:
                    print(f"{Colors.RED}Opción inválida{Colors.END}")
            except ValueError:
                print(f"{Colors.RED}Opción inválida{Colors.END}")
            
            print()  # Línea en blanco

def main():
    """Función principal"""
    print(f"{Colors.CYAN}{'═' * 60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.WHITE}Sistema de Generación de Videos Virales v2.0{Colors.END}")
    print(f"{Colors.CYAN}{'═' * 60}{Colors.END}")
    
    client = ViralVideoClient()
    
    try:
        client.run()
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Cancelado por el usuario{Colors.END}")
        sys.exit(0)
    
    print(f"\n{Colors.CYAN}Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.END}")

if __name__ == "__main__":
    main()