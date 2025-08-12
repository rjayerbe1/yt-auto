#!/usr/bin/env python3
"""
Generador de Scripts Virales con IA
Crea nuevos scripts para YouTube Shorts incluyendo términos de búsqueda de B-roll
"""

import os
import json
import sys
from datetime import datetime
from openai import OpenAI

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

def generate_viral_scripts_with_ai(channel_type="psychology", count=5):
    """Generar scripts virales usando OpenAI con términos de B-roll incluidos"""
    
    # Verificar API key
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print(f"{Colors.RED}❌ OPENAI_API_KEY no configurada{Colors.END}")
        print(f"{Colors.YELLOW}Configura: export OPENAI_API_KEY='tu-api-key'{Colors.END}")
        sys.exit(1)
    
    client = OpenAI(api_key=api_key)
    
    # Prompts específicos por canal
    prompts = {
        "psychology": """Genera 5 scripts virales para YouTube Shorts sobre psicología y relaciones.
        
        Cada script debe:
        - Durar entre 25-35 segundos cuando se lea
        - Tener un hook poderoso en las primeras 3 palabras
        - Incluir datos científicos o estadísticas
        - Terminar con una pregunta o llamada a la acción
        - Incluir términos de búsqueda específicos para B-roll
        
        Formato JSON requerido para cada script:
        {
            "id": "psych_XXX",
            "title": "Título llamativo (máx 60 caracteres)",
            "hook": "Pregunta o statement impactante para los primeros 3 segundos",
            "script": "Contenido principal del video (150-200 palabras)",
            "duration": 30,
            "style": "modern_gradient",
            "tags": ["psychology", "relationships", "science"],
            "expectedViews": "200K-500K",
            "cta": "Call to action final",
            "brollSearchTerms": [
                "término específico 1 para buscar video",
                "término específico 2 para buscar video",
                "término específico 3 para buscar video",
                "término específico 4 para buscar video",
                "término específico 5 para buscar video",
                "término específico 6 para buscar video",
                "término específico 7 para buscar video"
            ]
        }
        
        IMPORTANTE: Los brollSearchTerms deben ser términos de búsqueda muy específicos y visuales que correspondan exactamente con las escenas descritas en el script. Por ejemplo:
        - Si hablas de "el cerebro procesa", incluye "brain scan animation"
        - Si mencionas "parejas discutiendo", incluye "couple arguing silhouette"
        - Si dices "persona exitosa", incluye "CEO business meeting"
        
        Genera exactamente 5 scripts en un array JSON.""",
        
        "horror": """Genera 5 scripts virales para YouTube Shorts sobre historias de terror y creepypastas.
        
        Cada script debe:
        - Durar entre 30-40 segundos cuando se lea
        - Comenzar con un hook terrorífico
        - Crear tensión progresiva
        - Terminar con un giro inesperado o cliffhanger
        - Incluir términos de búsqueda específicos para B-roll de terror
        
        Formato JSON requerido para cada script:
        {
            "id": "horror_XXX",
            "title": "Título terrorífico (máx 60 caracteres)",
            "hook": "Inicio impactante que genere miedo inmediato",
            "script": "Historia completa con tensión creciente (180-250 palabras)",
            "duration": 35,
            "style": "dark_horror",
            "tags": ["horror", "creepypasta", "scary"],
            "expectedViews": "500K-1M",
            "cta": "Pregunta final escalofriante",
            "brollSearchTerms": [
                "término específico 1 para buscar video de terror",
                "término específico 2 para buscar video de terror",
                "término específico 3 para buscar video de terror",
                "término específico 4 para buscar video de terror",
                "término específico 5 para buscar video de terror",
                "término específico 6 para buscar video de terror",
                "término específico 7 para buscar video de terror"
            ]
        }
        
        IMPORTANTE: Los brollSearchTerms deben ser términos de búsqueda muy específicos para escenas de terror. Por ejemplo:
        - Si mencionas "casa abandonada", incluye "abandoned house interior dark"
        - Si hablas de "figura en las sombras", incluye "shadow figure hallway"
        - Si describes "hospital vacío", incluye "empty hospital corridor night"
        
        Genera exactamente 5 scripts en un array JSON."""
    }
    
    prompt = prompts.get(channel_type, prompts["psychology"])
    
    print(f"{Colors.CYAN}🤖 Generando {count} scripts virales para canal de {channel_type}...{Colors.END}")
    
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "Eres un experto en contenido viral para YouTube Shorts. Generas scripts que obtienen millones de vistas."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.9,
            max_tokens=4000
        )
        
        # Parsear respuesta
        content = response.choices[0].message.content
        
        # Limpiar el contenido para obtener solo el JSON
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        
        scripts = json.loads(content.strip())
        
        print(f"{Colors.GREEN}✅ {len(scripts)} scripts generados exitosamente{Colors.END}")
        
        # Mostrar preview
        for i, script in enumerate(scripts, 1):
            print(f"\n{Colors.YELLOW}Script {i}: {script['title']}{Colors.END}")
            print(f"  {Colors.CYAN}Hook: {script['hook'][:50]}...{Colors.END}")
            print(f"  {Colors.MAGENTA}B-roll terms: {len(script.get('brollSearchTerms', []))} términos{Colors.END}")
            print(f"  {Colors.GREEN}Views esperadas: {script['expectedViews']}{Colors.END}")
        
        return scripts
        
    except Exception as e:
        print(f"{Colors.RED}❌ Error generando scripts: {e}{Colors.END}")
        return None

def save_viral_scripts(scripts, channel_type):
    """Guardar scripts generados en archivo JSON"""
    
    # Cargar scripts existentes o crear estructura nueva
    output_file = 'data/viral-scripts-ai-generated.json'
    
    if os.path.exists(output_file):
        with open(output_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    else:
        data = {
            "channel1_psychology": [],
            "channel2_horror": []
        }
    
    # Agregar nuevos scripts
    if channel_type == "psychology":
        data["channel1_psychology"].extend(scripts)
    else:
        data["channel2_horror"].extend(scripts)
    
    # Guardar
    os.makedirs('data', exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n{Colors.GREEN}✅ Scripts guardados en: {output_file}{Colors.END}")
    
    # Generar resumen
    total_psych = len(data["channel1_psychology"])
    total_horror = len(data["channel2_horror"])
    
    print(f"\n{Colors.CYAN}{'=' * 60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.WHITE}RESUMEN DE SCRIPTS GENERADOS{Colors.END}")
    print(f"{Colors.CYAN}{'=' * 60}{Colors.END}")
    print(f"{Colors.YELLOW}📊 Canal Psicología: {total_psych} scripts{Colors.END}")
    print(f"{Colors.RED}👻 Canal Horror: {total_horror} scripts{Colors.END}")
    print(f"{Colors.GREEN}📁 Total: {total_psych + total_horror} scripts con B-roll terms{Colors.END}")

def main():
    """Función principal"""
    print(f"{Colors.MAGENTA}{'🔥' * 30}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.WHITE}   GENERADOR DE SCRIPTS VIRALES CON IA + B-ROLL{Colors.END}")
    print(f"{Colors.YELLOW}      Powered by GPT-4 + Smart B-roll Search{Colors.END}")
    print(f"{Colors.MAGENTA}{'🔥' * 30}{Colors.END}\n")
    
    # Menú
    print(f"{Colors.CYAN}Selecciona el tipo de contenido a generar:{Colors.END}")
    print(f"  {Colors.YELLOW}1){Colors.END} 🧠 Psicología y Relaciones")
    print(f"  {Colors.YELLOW}2){Colors.END} 👻 Horror y Creepypastas")
    print(f"  {Colors.YELLOW}3){Colors.END} 🎲 Ambos canales")
    print(f"  {Colors.RED}4){Colors.END} Salir\n")
    
    choice = input(f"{Colors.WHITE}Opción [1-4]: {Colors.END}")
    
    if choice == '1':
        scripts = generate_viral_scripts_with_ai("psychology", 5)
        if scripts:
            save_viral_scripts(scripts, "psychology")
    elif choice == '2':
        scripts = generate_viral_scripts_with_ai("horror", 5)
        if scripts:
            save_viral_scripts(scripts, "horror")
    elif choice == '3':
        print(f"\n{Colors.CYAN}Generando scripts para ambos canales...{Colors.END}")
        psych_scripts = generate_viral_scripts_with_ai("psychology", 5)
        if psych_scripts:
            save_viral_scripts(psych_scripts, "psychology")
        
        print()
        horror_scripts = generate_viral_scripts_with_ai("horror", 5)
        if horror_scripts:
            save_viral_scripts(horror_scripts, "horror")
    elif choice == '4':
        print(f"{Colors.CYAN}¡Hasta luego!{Colors.END}")
        sys.exit(0)
    else:
        print(f"{Colors.RED}Opción inválida{Colors.END}")
        sys.exit(1)
    
    print(f"\n{Colors.GREEN}{'✨' * 20}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.GREEN}PROCESO COMPLETADO{Colors.END}")
    print(f"{Colors.YELLOW}Los scripts ahora incluyen términos de búsqueda optimizados para B-roll{Colors.END}")
    print(f"{Colors.CYAN}Próximo paso: python3 viral-generator.py para generar videos{Colors.END}")
    print(f"{Colors.GREEN}{'✨' * 20}{Colors.END}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Cancelado por el usuario{Colors.END}")
        sys.exit(0)
    except Exception as e:
        print(f"\n{Colors.RED}Error fatal: {e}{Colors.END}")
        sys.exit(1)