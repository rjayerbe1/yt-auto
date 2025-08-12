#!/usr/bin/env python3
"""
Viral Content Generator for YouTube Shorts
Generates videos from viral scripts using existing infrastructure
"""

import requests
import json
import sys
import time
import random
from datetime import datetime
import argparse
import os

# Import colors from existing generate.py
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
    UNDERLINE = '\033[4m'
    END = '\033[0m'

def load_viral_scripts():
    """Load viral scripts from JSON file"""
    script_path = 'data/viral-scripts.json'
    if not os.path.exists(script_path):
        print(f"{Colors.RED}❌ viral-scripts.json not found!{Colors.END}")
        print(f"{Colors.YELLOW}Run 'npm run test:viral' first to generate scripts{Colors.END}")
        sys.exit(1)
    
    with open(script_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def print_viral_header():
    """Print styled header for viral content"""
    print(f"{Colors.MAGENTA}{'🔥' * 30}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.WHITE}     VIRAL CONTENT GENERATOR{Colors.END}")
    print(f"{Colors.YELLOW}     YouTube Shorts Automation{Colors.END}")
    print(f"{Colors.MAGENTA}{'🔥' * 30}{Colors.END}\n")

def animated_progress_bar(current, total, message="", width=50):
    """Display animated progress bar with effects"""
    percent = int((current / total) * 100)
    filled = int(width * current / total)
    
    # Color based on progress
    if percent < 30:
        color = Colors.RED
    elif percent < 60:
        color = Colors.YELLOW
    elif percent < 90:
        color = Colors.CYAN
    else:
        color = Colors.GREEN
    
    bar = '█' * filled + '░' * (width - filled)
    
    # Animation frames
    animation_frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    frame = animation_frames[int(time.time() * 10) % len(animation_frames)]
    
    sys.stdout.write('\r\033[K')
    sys.stdout.write(f"{color}[{bar}] {Colors.WHITE}{percent:3d}% {frame} {Colors.YELLOW}{message}{Colors.END}")
    sys.stdout.flush()

def display_script(script, index, channel_name):
    """Display a script with formatting"""
    print(f"\n{Colors.CYAN}{'─' * 60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.WHITE}#{index + 1} - {script['title']}{Colors.END}")
    print(f"{Colors.YELLOW}Channel: {channel_name}{Colors.END}")
    print(f"{Colors.GREEN}Expected Views: {script['expectedViews']}{Colors.END}")
    print(f"{Colors.CYAN}Duration: {script['duration']}s | Style: {script['style']}{Colors.END}")
    print(f"\n{Colors.WHITE}Hook:{Colors.END} {script['hook']}")
    print(f"\n{Colors.WHITE}Script Preview:{Colors.END}")
    # Show first 150 characters of script
    preview = script['script'][:150] + "..." if len(script['script']) > 150 else script['script']
    print(f"{Colors.YELLOW}{preview}{Colors.END}")

def select_script(scripts_data):
    """Interactive script selection"""
    print(f"{Colors.BOLD}{Colors.GREEN}SELECT CONTENT TO GENERATE:{Colors.END}\n")
    
    # Show channel options
    print(f"{Colors.CYAN}CHANNELS:{Colors.END}")
    print(f"  {Colors.YELLOW}1){Colors.END} 🧠 Psychology & Drama Channel")
    print(f"  {Colors.WHITE}2){Colors.END} 👻 Horror & Creepypasta Channel")
    print(f"  {Colors.WHITE}3){Colors.END} 🎲 Random viral script")
    print(f"  {Colors.RED}4){Colors.END} Exit\n")
    
    channel_choice = input("Select channel [1-4]: ")
    
    if channel_choice == '4':
        print(f"{Colors.CYAN}Goodbye!{Colors.END}")
        sys.exit(0)
    elif channel_choice == '3':
        # Random selection
        all_scripts = scripts_data['channel1_psychology'] + scripts_data['channel2_horror']
        selected = random.choice(all_scripts)
        channel = "Mixed"
    elif channel_choice == '1':
        # Psychology channel
        scripts = scripts_data['channel1_psychology']
        channel = "Psychology & Drama"
        
        print(f"\n{Colors.CYAN}PSYCHOLOGY SCRIPTS:{Colors.END}")
        for i, script in enumerate(scripts):
            display_script(script, i, channel)
        
        print(f"\n{Colors.WHITE}Select script [1-{len(scripts)}]:{Colors.END} ", end='')
        script_choice = input()
        try:
            idx = int(script_choice) - 1
            if 0 <= idx < len(scripts):
                selected = scripts[idx]
            else:
                print(f"{Colors.RED}Invalid selection{Colors.END}")
                sys.exit(1)
        except:
            print(f"{Colors.RED}Invalid selection{Colors.END}")
            sys.exit(1)
            
    elif channel_choice == '2':
        # Horror channel
        scripts = scripts_data['channel2_horror']
        channel = "Horror & Creepypasta"
        
        print(f"\n{Colors.CYAN}HORROR SCRIPTS:{Colors.END}")
        for i, script in enumerate(scripts):
            display_script(script, i, channel)
        
        print(f"\n{Colors.WHITE}Select script [1-{len(scripts)}]:{Colors.END} ", end='')
        script_choice = input()
        try:
            idx = int(script_choice) - 1
            if 0 <= idx < len(scripts):
                selected = scripts[idx]
            else:
                print(f"{Colors.RED}Invalid selection{Colors.END}")
                sys.exit(1)
        except:
            print(f"{Colors.RED}Invalid selection{Colors.END}")
            sys.exit(1)
    else:
        print(f"{Colors.RED}Invalid choice{Colors.END}")
        sys.exit(1)
    
    return selected, channel

def get_style_number(style_name):
    """Convert style name to number for API"""
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
    return style_map.get(style_name, 1)

def generate_viral_video(script, channel_name):
    """Generate video from viral script using existing API"""
    print(f"\n{Colors.MAGENTA}{'═' * 60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.WHITE}GENERATING VIRAL VIDEO{Colors.END}")
    print(f"{Colors.YELLOW}Title: {script['title']}{Colors.END}")
    print(f"{Colors.CYAN}Channel: {channel_name}{Colors.END}")
    print(f"{Colors.GREEN}Expected Views: {script['expectedViews']}{Colors.END}")
    print(f"{Colors.MAGENTA}{'═' * 60}{Colors.END}\n")
    
    # Get style number
    style_num = get_style_number(script['style'])
    
    # Prepare the full script with hook and CTA
    # The script field contains the main content, but we need to structure it properly
    full_script = f"{script['hook']} {script['script']}"
    
    # Add a CTA if it's not already in the script
    if 'cta' in script and script['cta']:
        full_script = f"{full_script} {script['cta']}"
    elif not any(phrase in script['script'].lower() for phrase in ['comment', 'follow', 'share', 'like']):
        # Add a default CTA if none exists
        full_script = f"{full_script} Follow for more content like this."
    
    # Prepare the request
    payload = {
        'topic': script['title'],
        'script': full_script,
        'duration': script['duration'],
        'style': style_num,
        'hook': script['hook']  # Also send hook separately for reference
    }
    
    try:
        # Start generation with SSE for progress
        print(f"{Colors.CYAN}Connecting to server...{Colors.END}")
        
        response = requests.post(
            'http://localhost:3000/api/video/generate-viral',
            json=payload,
            stream=True,
            timeout=1200
        )
        
        if response.status_code != 200:
            # Try fallback to regular synced endpoint
            print(f"{Colors.YELLOW}Using fallback endpoint...{Colors.END}")
            response = requests.get(
                f'http://localhost:3000/api/video/generate-synced?duration={script["duration"]}&style={style_num}',
                stream=True,
                timeout=1200
            )
        
        video_path = None
        
        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8')
                if line.startswith('data: '):
                    try:
                        data = json.loads(line[6:])
                        
                        if data['type'] == 'start':
                            animated_progress_bar(0, 100, data['message'])
                            
                        elif data['type'] == 'progress':
                            animated_progress_bar(
                                data['progress'], 
                                100, 
                                data['message']
                            )
                            
                        elif data['type'] == 'complete':
                            animated_progress_bar(100, 100, "Complete!")
                            video_path = data['videoPath']
                            
                            # Success animation
                            print(f"\n\n{Colors.GREEN}{'🎉' * 20}{Colors.END}")
                            print(f"{Colors.BOLD}{Colors.GREEN}✅ VIRAL VIDEO GENERATED SUCCESSFULLY!{Colors.END}")
                            print(f"{Colors.GREEN}{'🎉' * 20}{Colors.END}\n")
                            
                            print(f"{Colors.WHITE}📁 Path: {video_path}{Colors.END}")
                            print(f"{Colors.YELLOW}📊 Expected Views: {script['expectedViews']}{Colors.END}")
                            print(f"{Colors.CYAN}🏷️ Tags: {', '.join(script['tags'])}{Colors.END}")
                            
                            # Save metadata
                            metadata = {
                                'script': script,
                                'channel': channel_name,
                                'videoPath': video_path,
                                'generatedAt': datetime.now().isoformat()
                            }
                            
                            metadata_path = video_path.replace('.mp4', '_metadata.json')
                            with open(metadata_path, 'w', encoding='utf-8') as f:
                                json.dump(metadata, f, indent=2, ensure_ascii=False)
                            
                            print(f"{Colors.GREEN}📝 Metadata saved: {metadata_path}{Colors.END}")
                            break
                            
                        elif data['type'] == 'error':
                            print(f"\n\n{Colors.RED}❌ Error: {data['error']}{Colors.END}")
                            break
                            
                    except json.JSONDecodeError:
                        pass
        
        return video_path
        
    except Exception as e:
        print(f"\n{Colors.RED}❌ Connection error: {str(e)}{Colors.END}")
        return None

def batch_generate(scripts_data, channel, count=3):
    """Generate multiple videos in batch"""
    if channel == 'psychology':
        scripts = scripts_data['channel1_psychology'][:count]
        channel_name = "Psychology & Drama"
    elif channel == 'horror':
        scripts = scripts_data['channel2_horror'][:count]
        channel_name = "Horror & Creepypasta"
    else:
        # Mix both channels
        all_scripts = scripts_data['channel1_psychology'] + scripts_data['channel2_horror']
        random.shuffle(all_scripts)
        scripts = all_scripts[:count]
        channel_name = "Mixed Viral"
    
    print(f"{Colors.BOLD}{Colors.CYAN}BATCH GENERATION MODE{Colors.END}")
    print(f"{Colors.WHITE}Generating {count} videos from {channel_name}{Colors.END}\n")
    
    results = []
    for i, script in enumerate(scripts):
        print(f"\n{Colors.YELLOW}[{i+1}/{count}] Processing: {script['title']}{Colors.END}")
        video_path = generate_viral_video(script, channel_name)
        results.append({
            'script': script,
            'video': video_path,
            'success': video_path is not None
        })
        
        if i < count - 1:
            print(f"\n{Colors.CYAN}Waiting 5 seconds before next video...{Colors.END}")
            time.sleep(5)
    
    # Summary
    print(f"\n{Colors.MAGENTA}{'=' * 60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.WHITE}BATCH GENERATION COMPLETE{Colors.END}")
    print(f"{Colors.MAGENTA}{'=' * 60}{Colors.END}\n")
    
    successful = sum(1 for r in results if r['success'])
    print(f"{Colors.GREEN}✅ Successful: {successful}/{count}{Colors.END}")
    
    if successful > 0:
        print(f"\n{Colors.CYAN}Generated Videos:{Colors.END}")
        for r in results:
            if r['success']:
                print(f"  • {r['script']['title']}")
                print(f"    {Colors.WHITE}{r['video']}{Colors.END}")
    
    return results

def main():
    """Main CLI interface"""
    parser = argparse.ArgumentParser(description='Generate viral YouTube Shorts')
    parser.add_argument(
        '--channel',
        choices=['psychology', 'horror', 'mixed'],
        help='Channel type for batch generation'
    )
    parser.add_argument(
        '--batch',
        type=int,
        help='Number of videos to generate in batch mode'
    )
    parser.add_argument(
        '--random',
        action='store_true',
        help='Generate random viral video'
    )
    
    args = parser.parse_args()
    
    print_viral_header()
    
    # Check server
    print(f"{Colors.CYAN}Checking server...{Colors.END}")
    try:
        response = requests.get('http://localhost:3000/health', timeout=2)
        if response.status_code != 200:
            raise Exception("Server not healthy")
        print(f"{Colors.GREEN}✓ Server is running{Colors.END}\n")
    except:
        print(f"{Colors.RED}❌ Server is not running!{Colors.END}")
        print(f"{Colors.YELLOW}Start it with: npm run dev{Colors.END}")
        sys.exit(1)
    
    # Load scripts
    scripts_data = load_viral_scripts()
    
    # Handle different modes
    if args.batch and args.channel:
        # Batch mode
        batch_generate(scripts_data, args.channel, args.batch)
    elif args.random:
        # Random single video
        all_scripts = scripts_data['channel1_psychology'] + scripts_data['channel2_horror']
        script = random.choice(all_scripts)
        channel = "Random Viral"
        generate_viral_video(script, channel)
    else:
        # Interactive mode
        script, channel = select_script(scripts_data)
        
        # Confirm generation
        print(f"\n{Colors.CYAN}{'─' * 60}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.WHITE}READY TO GENERATE:{Colors.END}")
        print(f"  Title: {script['title']}")
        print(f"  Channel: {channel}")
        print(f"  Duration: {script['duration']}s")
        print(f"  Style: {script['style']}")
        print(f"  Expected Views: {script['expectedViews']}")
        print(f"{Colors.CYAN}{'─' * 60}{Colors.END}\n")
        
        confirm = input(f"{Colors.YELLOW}Generate this video? [y/n]:{Colors.END} ")
        if confirm.lower() == 'y':
            video_path = generate_viral_video(script, channel)
            
            if video_path:
                # Offer to open video
                print()
                open_video = input("Open video in player? [y/n]: ")
                if open_video.lower() == 'y':
                    import subprocess
                    import platform
                    
                    if platform.system() == 'Darwin':  # macOS
                        subprocess.run(['open', video_path])
                    elif platform.system() == 'Linux':
                        subprocess.run(['xdg-open', video_path])
                    elif platform.system() == 'Windows':
                        subprocess.run(['start', video_path], shell=True)
    
    print(f"\n{Colors.CYAN}{'═' * 60}{Colors.END}")
    print(f"{Colors.WHITE}Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.END}")

if __name__ == "__main__":
    main()