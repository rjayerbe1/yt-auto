#!/usr/bin/env python3
"""
YouTube Shorts Video Generator CLI
Terminal-based interface with real-time progress
"""

import requests
import json
import sys
import time
from datetime import datetime
import argparse

# ANSI color codes
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

def check_gpu_status():
    """Check if GPU acceleration is available"""
    gpu_info = {
        'video': False,
        'audio': False,
        'system': 'Unknown'
    }
    
    # Check system
    import platform
    if platform.system() == 'Darwin':
        import subprocess
        try:
            result = subprocess.run(['sysctl', '-n', 'machdep.cpu.brand_string'], 
                                  capture_output=True, text=True)
            if 'Apple' in result.stdout:
                gpu_info['system'] = 'Apple Silicon (M1/M2/M3)'
                gpu_info['video'] = True  # VideoToolbox available
        except:
            pass
    
    # Check PyTorch MPS for audio
    try:
        import torch
        if hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            gpu_info['audio'] = True
    except:
        pass
    
    return gpu_info

def print_header():
    """Print styled header with GPU status"""
    print(f"{Colors.CYAN}{'═' * 60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.WHITE}     🎬 YouTube Shorts Video Generator{Colors.END}")
    
    # Show GPU status
    gpu_info = check_gpu_status()
    if gpu_info['video'] or gpu_info['audio']:
        print(f"{Colors.GREEN}     🚀 GPU Acceleration: ENABLED{Colors.END}")
        if gpu_info['system'] != 'Unknown':
            print(f"{Colors.YELLOW}     📱 System: {gpu_info['system']}{Colors.END}")
        if gpu_info['video']:
            print(f"{Colors.CYAN}     ✅ Video: VideoToolbox (GPU){Colors.END}")
        if gpu_info['audio']:
            print(f"{Colors.CYAN}     ✅ Audio: Metal Performance Shaders (GPU){Colors.END}")
    else:
        print(f"{Colors.YELLOW}     💻 Running on: CPU (No GPU acceleration){Colors.END}")
    
    print(f"{Colors.CYAN}{'═' * 60}{Colors.END}\n")

def progress_bar(current, total, message="", width=50):
    """Display progress bar in terminal"""
    percent = int((current / total) * 100)
    filled = int(width * current / total)
    bar = '█' * filled + '░' * (width - filled)
    
    # Clear entire line first, then print progress
    sys.stdout.write('\r\033[K')  # \033[K clears from cursor to end of line
    sys.stdout.write(f"{Colors.CYAN}[{bar}] {Colors.WHITE}{percent:3d}% {Colors.YELLOW}{message}{Colors.END}")
    sys.stdout.flush()

def check_server():
    """Check if server is running"""
    try:
        response = requests.get('http://localhost:3000/health', timeout=2)
        return response.status_code == 200
    except:
        return False

def generate_quick_test():
    """Generate 2-second test video"""
    print(f"{Colors.CYAN}Generating 2-second test video...{Colors.END}")
    
    try:
        response = requests.post('http://localhost:3000/api/test/quick-video')
        data = response.json()
        
        if data.get('success'):
            print(f"\n{Colors.GREEN}✅ Success!{Colors.END}")
            print(f"{Colors.WHITE}Video: {data['videoPath']}{Colors.END}")
            return data['videoPath']
        else:
            print(f"\n{Colors.RED}❌ Failed: {data.get('error', 'Unknown error')}{Colors.END}")
            return None
    except Exception as e:
        print(f"\n{Colors.RED}❌ Error: {str(e)}{Colors.END}")
        return None

def generate_optimized(duration=10):
    """Generate optimized video"""
    print(f"{Colors.CYAN}Generating {duration}-second optimized video...{Colors.END}")
    
    try:
        response = requests.post(
            'http://localhost:3000/api/test/optimized-video',
            json={'duration': duration}
        )
        data = response.json()
        
        if data.get('success'):
            print(f"\n{Colors.GREEN}✅ Success!{Colors.END}")
            print(f"{Colors.WHITE}Video: {data['videoPath']}{Colors.END}")
            return data['videoPath']
        else:
            print(f"\n{Colors.RED}❌ Failed: {data.get('error', 'Unknown error')}{Colors.END}")
            return None
    except Exception as e:
        print(f"\n{Colors.RED}❌ Error: {str(e)}{Colors.END}")
        return None

def animated_progress_bar(current, total, message="", width=50):
    """Display animated progress bar with effects"""
    percent = int((current / total) * 100)
    filled = int(width * current / total)
    
    # Different animation styles based on progress
    if percent < 30:
        bar_char = '▰'
        empty_char = '▱'
        color = Colors.RED
    elif percent < 60:
        bar_char = '▰'
        empty_char = '▱'
        color = Colors.YELLOW
    elif percent < 90:
        bar_char = '█'
        empty_char = '▒'
        color = Colors.CYAN
    else:
        bar_char = '█'
        empty_char = '░'
        color = Colors.GREEN
    
    # Create animated bar
    bar = bar_char * filled + empty_char * (width - filled)
    
    # Always show spinning animation to indicate activity
    animation_frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    frame = animation_frames[int(time.time() * 10) % len(animation_frames)]
    
    # Add pulsing indicator when processing
    if 'audio' in message.lower() or 'generating' in message.lower():
        pulse = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣']
        pulse_indicator = pulse[int(time.time() * 2) % len(pulse)]
    elif 'cleaning' in message.lower() or 'cleanup' in message.lower():
        pulse_indicator = '🧹'
    else:
        pulse_indicator = ''
    
    # Clear entire line first, then print progress
    sys.stdout.write('\r\033[K')  # \033[K clears from cursor to end of line
    sys.stdout.write(f"{color}[{bar}] {Colors.WHITE}{percent:3d}% {frame} {pulse_indicator} {Colors.YELLOW}{message}{Colors.END}")
    sys.stdout.flush()

def generate_synced_with_duration(duration_seconds, style=1):
    """Generate synchronized video with specified duration and style"""
    # Style names for display
    style_names = [
        'Clean Modern (Purple/Gold)',
        'Minimal (White/Black)',
        'Gradient Tropical (Coral/Teal)',
        'Matrix Green (Terminal)',
        'Gold Luxury (Dark/Gold)',
        'Cherry Blossom (Peach/Red)'
    ]
    
    print(f"{Colors.BOLD}{Colors.GREEN}🎯 Generating {duration_seconds}-second SYNCHRONIZED video...{Colors.END}")
    print(f"{Colors.CYAN}🎨 Style: {style_names[style-1] if 1 <= style <= 6 else 'Default'}{Colors.END}")
    print(f"{Colors.YELLOW}Audio and text will be perfectly synced!{Colors.END}")
    
    # Show GPU status
    gpu_info = check_gpu_status()
    if gpu_info['video'] or gpu_info['audio']:
        print(f"{Colors.GREEN}🚀 Using GPU Acceleration:{Colors.END}")
        if gpu_info['video']:
            print(f"  • Video: {Colors.CYAN}VideoToolbox{Colors.END}")
        if gpu_info['audio']:
            print(f"  • Audio: {Colors.CYAN}MPS (Metal){Colors.END}")
    else:
        print(f"{Colors.YELLOW}💻 Using CPU{Colors.END}")
    print()
    
    import threading
    animation_active = True
    current_segment = ""
    
    def audio_animation():
        """Show audio waveform animation while processing"""
        waves = [
            "▁▂▃▄▅▆▇█▇▆▅▄▃▂▁",
            "▂▃▄▅▆▇█▇▆▅▄▃▂▁▂",
            "▃▄▅▆▇█▇▆▅▄▃▂▁▂▃",
            "▄▅▆▇█▇▆▅▄▃▂▁▂▃▄",
            "▅▆▇█▇▆▅▄▃▂▁▂▃▄▅",
            "▆▇█▇▆▅▄▃▂▁▂▃▄▅▆",
            "▇█▇▆▅▄▃▂▁▂▃▄▅▆▇",
            "█▇▆▅▄▃▂▁▂▃▄▅▆▇█"
        ]
        i = 0
        while animation_active:
            if current_segment and 'audio' in current_segment.lower():
                sys.stdout.write(f'\r  {Colors.CYAN}🎵 {waves[i % len(waves)]} Processing: {current_segment}{Colors.END}')
                sys.stdout.flush()
                i += 1
            time.sleep(0.1)
        sys.stdout.write('\r\033[K')
        sys.stdout.flush()
    
    try:
        # Start animation thread
        anim_thread = threading.Thread(target=audio_animation)
        anim_thread.daemon = True
        anim_thread.start()
        
        # Connect to SSE endpoint with duration and style parameters
        response = requests.get(
            f'http://localhost:3000/api/video/generate-synced?duration={duration_seconds}&style={style}',
            stream=True,
            timeout=1200  # 20 minutes timeout for slow TTS generation
        )
        
        video_path = None
        last_message = ""
        
        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8')
                if line.startswith('data: '):
                    try:
                        data = json.loads(line[6:])
                        
                        if data['type'] == 'start':
                            animated_progress_bar(0, 100, data['message'])
                            
                        elif data['type'] == 'progress':
                            # Stop animation temporarily
                            animation_active = False
                            time.sleep(0.1)
                            
                            # Clear previous line properly
                            sys.stdout.write('\r\033[K')
                            
                            # Update current segment for animation
                            message = data['message']
                            current_segment = message
                            
                            # Show segment preview on same line
                            if 'details' in data and 'text' in data['details']:
                                preview = data['details']['text'][:40]
                                message = f"{message}"
                                
                                # Show segment details inline (no new lines)
                                if 'audio' in message.lower():
                                    # Don't print new lines, include in progress message
                                    segment_info = data['details'].get('segment', 'processing')
                                    message = f"{message} [{segment_info}]"
                                    animation_active = True
                            
                            animated_progress_bar(
                                data['progress'], 
                                100, 
                                message
                            )
                            last_message = message
                                
                        elif data['type'] == 'complete':
                            animation_active = False
                            time.sleep(0.1)
                            sys.stdout.write('\r\033[K')  # Clear line properly
                            animated_progress_bar(100, 100, "Complete!")
                            video_path = data['videoPath']
                            print(f"\n\n{Colors.GREEN}✅ SYNCHRONIZED video generated!{Colors.END}")
                            print(f"{Colors.WHITE}Path: {video_path}{Colors.END}")
                            print(f"{Colors.CYAN}✨ Audio and text are perfectly synced!{Colors.END}")
                            print(f"{Colors.YELLOW}📏 Duration: {duration_seconds} seconds{Colors.END}")
                            break
                            
                        elif data['type'] == 'error':
                            animation_active = False
                            print(f"\n\n{Colors.RED}❌ Error: {data['error']}{Colors.END}")
                            break
                            
                    except json.JSONDecodeError:
                        pass
        
        animation_active = False
        return video_path
        
    except Exception as e:
        animation_active = False
        print(f"\n{Colors.RED}❌ Connection error: {str(e)}{Colors.END}")
        return None

def generate_synced():
    """Generate synchronized video with perfect audio-text sync"""
    print(f"{Colors.BOLD}{Colors.GREEN}🎯 Generating SYNCHRONIZED video...{Colors.END}")
    print(f"{Colors.YELLOW}Audio and text will be perfectly synced!{Colors.END}")
    
    # Show GPU status
    gpu_info = check_gpu_status()
    if gpu_info['video'] or gpu_info['audio']:
        print(f"{Colors.GREEN}🚀 Using GPU Acceleration:{Colors.END}")
        if gpu_info['video']:
            print(f"  • Video: {Colors.CYAN}VideoToolbox{Colors.END}")
        if gpu_info['audio']:
            print(f"  • Audio: {Colors.CYAN}MPS (Metal){Colors.END}")
    else:
        print(f"{Colors.YELLOW}💻 Using CPU{Colors.END}")
    print()
    
    import threading
    animation_active = True
    current_segment = ""
    
    def audio_animation():
        """Show audio waveform animation while processing"""
        waves = [
            "▁▂▃▄▅▆▇█▇▆▅▄▃▂▁",
            "▂▃▄▅▆▇█▇▆▅▄▃▂▁▂",
            "▃▄▅▆▇█▇▆▅▄▃▂▁▂▃",
            "▄▅▆▇█▇▆▅▄▃▂▁▂▃▄",
            "▅▆▇█▇▆▅▄▃▂▁▂▃▄▅",
            "▆▇█▇▆▅▄▃▂▁▂▃▄▅▆",
            "▇█▇▆▅▄▃▂▁▂▃▄▅▆▇",
            "█▇▆▅▄▃▂▁▂▃▄▅▆▇█"
        ]
        i = 0
        while animation_active:
            if current_segment and 'audio' in current_segment.lower():
                sys.stdout.write(f'\r  {Colors.CYAN}🎵 {waves[i % len(waves)]} Processing: {current_segment}{Colors.END}')
                sys.stdout.flush()
                i += 1
            time.sleep(0.1)
        sys.stdout.write('\r\033[K')
        sys.stdout.flush()
    
    try:
        # Start animation thread
        anim_thread = threading.Thread(target=audio_animation)
        anim_thread.daemon = True
        anim_thread.start()
        
        # Connect to SSE endpoint for real-time progress
        response = requests.get(
            'http://localhost:3000/api/video/generate-synced',
            stream=True,
            timeout=1200  # 20 minutes timeout for slow TTS generation
        )
        
        video_path = None
        last_message = ""
        
        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8')
                if line.startswith('data: '):
                    try:
                        data = json.loads(line[6:])
                        
                        if data['type'] == 'start':
                            animated_progress_bar(0, 100, data['message'])
                            
                        elif data['type'] == 'progress':
                            # Stop animation temporarily
                            animation_active = False
                            time.sleep(0.1)
                            
                            # Clear previous line properly
                            sys.stdout.write('\r\033[K')
                            
                            # Update current segment for animation
                            message = data['message']
                            current_segment = message
                            
                            # Show segment preview on same line
                            if 'details' in data and 'text' in data['details']:
                                preview = data['details']['text'][:40]
                                message = f"{message}"
                                
                                # Show segment details inline (no new lines)
                                if 'audio' in message.lower():
                                    # Don't print new lines, include in progress message
                                    segment_info = data['details'].get('segment', 'processing')
                                    message = f"{message} [{segment_info}]"
                                    animation_active = True
                            
                            animated_progress_bar(
                                data['progress'], 
                                100, 
                                message
                            )
                            last_message = message
                                
                        elif data['type'] == 'complete':
                            animation_active = False
                            time.sleep(0.1)
                            sys.stdout.write('\r\033[K')  # Clear line properly
                            animated_progress_bar(100, 100, "Complete!")
                            video_path = data['videoPath']
                            print(f"\n\n{Colors.GREEN}✅ SYNCHRONIZED video generated!{Colors.END}")
                            print(f"{Colors.WHITE}Path: {video_path}{Colors.END}")
                            print(f"{Colors.CYAN}✨ Audio and text are perfectly synced!{Colors.END}")
                            break
                            
                        elif data['type'] == 'error':
                            animation_active = False
                            print(f"\n\n{Colors.RED}❌ Error: {data['error']}{Colors.END}")
                            break
                            
                    except json.JSONDecodeError:
                        pass
        
        animation_active = False
        return video_path
        
    except Exception as e:
        animation_active = False
        print(f"\n{Colors.RED}❌ Connection error: {str(e)}{Colors.END}")
        return None

def generate_with_progress():
    """Generate video with real-time progress updates"""
    print(f"{Colors.CYAN}Generating full video with real-time progress...{Colors.END}")
    print(f"{Colors.YELLOW}This may take 3-5 minutes...{Colors.END}\n")
    
    try:
        # Connect to SSE endpoint
        response = requests.get(
            'http://localhost:3000/api/video/generate-with-progress',
            stream=True,
            timeout=600
        )
        
        video_path = None
        
        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8')
                if line.startswith('data: '):
                    try:
                        data = json.loads(line[6:])
                        
                        if data['type'] == 'start':
                            progress_bar(0, 100, data['message'])
                            
                        elif data['type'] == 'progress':
                            progress_bar(
                                data['progress'], 
                                100, 
                                data['message']
                            )
                            
                        elif data['type'] == 'complete':
                            progress_bar(100, 100, "Complete!")
                            video_path = data['videoPath']
                            print(f"\n\n{Colors.GREEN}✅ Video generated successfully!{Colors.END}")
                            print(f"{Colors.WHITE}Path: {video_path}{Colors.END}")
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

# Función generate_animated eliminada
def generate_animated_removed():
    """Generate video with animated visual effects"""
    print(f"{Colors.BOLD}{Colors.MAGENTA}✨ Generating ANIMATED video with visual effects...{Colors.END}")
    print(f"{Colors.YELLOW}This video will include particles, waves, and glow effects!{Colors.END}")
    
    # Show GPU status for this generation
    gpu_info = check_gpu_status()
    if gpu_info['video'] or gpu_info['audio']:
        print(f"{Colors.GREEN}🚀 Using GPU Acceleration:{Colors.END}")
        if gpu_info['video']:
            print(f"  • Video encoding: {Colors.CYAN}VideoToolbox (h264_videotoolbox){Colors.END}")
        if gpu_info['audio']:
            print(f"  • Audio generation: {Colors.CYAN}Metal Performance Shaders{Colors.END}")
    else:
        print(f"{Colors.YELLOW}💻 Using CPU (GPU not available){Colors.END}")
    print()
    
    import threading
    animation_active = True
    last_progress = 0
    last_message = ""
    
    def continuous_animation():
        """Continuously update the progress bar animation"""
        nonlocal last_progress, last_message
        while animation_active:
            if last_progress > 0 and last_message:
                animated_progress_bar(last_progress, 100, last_message)
            time.sleep(0.1)
    
    try:
        # Start continuous progress animation only
        continuous_thread = threading.Thread(target=continuous_animation)
        continuous_thread.daemon = True
        continuous_thread.start()
        
        # Connect to SSE endpoint for animated video
        response = requests.get(
            'http://localhost:3000/api/video/generate-animated',
            stream=True,
            timeout=1200  # 20 minutes timeout for slow TTS generation
        )
        
        video_path = None
        
        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8')
                if line.startswith('data: '):
                    try:
                        data = json.loads(line[6:])
                        
                        if data['type'] == 'start':
                            last_progress = 0
                            last_message = data['message']
                            animated_progress_bar(0, 100, data['message'])
                            
                        elif data['type'] == 'progress':
                            message = data['message']
                            last_progress = data.get('progress', last_progress)  # Use .get() to avoid KeyError
                            last_message = message
                            
                            # Note: Animation type info is available but we're showing it in the progress bar
                            # instead of a separate animation
                            pass
                            
                            # Effects list is available in data['details']['effects'] if needed
                            # but we don't print it to avoid disrupting the progress bar
                            
                            # Update progress (continuous animation will handle the display)
                            animated_progress_bar(
                                data['progress'], 
                                100, 
                                message
                            )
                                
                        elif data['type'] == 'complete':
                            animation_active = False
                            last_progress = 0  # Stop continuous animation
                            last_message = ""
                            time.sleep(0.2)  # Give threads time to stop
                            sys.stdout.write('\r\033[K')  # Clear line properly
                            animated_progress_bar(100, 100, "Complete!")
                            video_path = data['videoPath']
                            
                            # Celebration animation
                            print(f"\n\n{Colors.MAGENTA}✨ ✨ ✨ ANIMATED VIDEO COMPLETE! ✨ ✨ ✨{Colors.END}")
                            for _ in range(3):
                                sys.stdout.write(f'\r{Colors.BOLD}{Colors.MAGENTA}★ ☆ ★ ☆ ★ SUCCESS! ★ ☆ ★ ☆ ★{Colors.END}')
                                time.sleep(0.2)
                                sys.stdout.write(f'\r{Colors.MAGENTA}☆ ★ ☆ ★ ☆ SUCCESS! ☆ ★ ☆ ★ ☆{Colors.END}')
                                time.sleep(0.2)
                            
                            print(f"\n\n{Colors.WHITE}Path: {video_path}{Colors.END}")
                            print(f"{Colors.CYAN}✨ Video includes animated visual effects!{Colors.END}")
                            break
                            
                        elif data['type'] == 'error':
                            animation_active = False
                            last_progress = 0  # Stop continuous animation
                            last_message = ""
                            time.sleep(0.2)  # Give threads time to stop
                            sys.stdout.write('\r\033[K')  # Clear line
                            print(f"\n{Colors.RED}❌ Error: {data['error']}{Colors.END}")
                            break
                            
                    except json.JSONDecodeError:
                        pass
        
        animation_active = False
        last_progress = 0
        last_message = ""
        time.sleep(0.2)  # Give threads time to stop
        return video_path
        
    except Exception as e:
        animation_active = False
        last_progress = 0
        last_message = ""
        print(f"\n{Colors.RED}❌ Connection error: {str(e)}{Colors.END}")
        return None

def main():
    """Main CLI interface"""
    parser = argparse.ArgumentParser(description='Generate YouTube Shorts videos')
    parser.add_argument(
        '--type',
        choices=['quick', 'optimized', 'full', 'animated'],
        default=None,
        help='Type of video to generate'
    )
    parser.add_argument(
        '--duration',
        type=int,
        default=10,
        help='Duration for optimized video (seconds)'
    )
    parser.add_argument(
        '--auto',
        action='store_true',
        help='Run without interactive prompts'
    )
    
    args = parser.parse_args()
    
    print_header()
    
    # Check server
    print(f"{Colors.CYAN}Checking server...{Colors.END}")
    if not check_server():
        print(f"{Colors.RED}❌ Server is not running!{Colors.END}")
        print(f"{Colors.YELLOW}Start it with: npm run dev{Colors.END}")
        sys.exit(1)
    print(f"{Colors.GREEN}✓ Server is running{Colors.END}\n")
    
    # Auto mode
    if args.auto and args.type:
        if args.type == 'quick':
            generate_quick_test()
        elif args.type == 'optimized':
            generate_optimized(args.duration)
        elif args.type == 'full':
            generate_with_progress()
        return
    
    # Simplified menu - only synchronized video with duration options
    print(f"{Colors.BOLD}{Colors.GREEN}🎯 SYNCHRONIZED TEXT VIDEO GENERATOR{Colors.END}")
    print(f"{Colors.CYAN}{'─' * 50}{Colors.END}")
    print(f"{Colors.WHITE}Select video duration:{Colors.END}\n")
    print(f"  {Colors.YELLOW}1){Colors.END} 🧪 Test (2 seconds) - Quick test")
    print(f"  {Colors.WHITE}2){Colors.END} 📱 Short (15 seconds) - Instagram/TikTok")
    print(f"  {Colors.WHITE}3){Colors.END} 🎬 Medium (30 seconds) - YouTube Shorts")
    print(f"  {Colors.WHITE}4){Colors.END} 📺 Long (60 seconds) - Full video")
    print(f"  {Colors.WHITE}5){Colors.END} ⚙️  Custom duration")
    print(f"  {Colors.RED}6){Colors.END} Exit\n")
    
    choice = input("Enter choice [1-6]: ")
    print()
    
    video_path = None
    duration = None
    style = 1  # Default style
    
    if choice == '1':
        duration = 2
        print(f"{Colors.YELLOW}🧪 Generating 2-second test video...{Colors.END}")
    elif choice == '2':
        duration = 15
        print(f"{Colors.CYAN}📱 Generating 15-second short video...{Colors.END}")
    elif choice == '3':
        duration = 30
        print(f"{Colors.GREEN}🎬 Generating 30-second YouTube Short...{Colors.END}")
    elif choice == '4':
        duration = 60
        print(f"{Colors.MAGENTA}📺 Generating 60-second full video...{Colors.END}")
    elif choice == '5':
        custom = input("Enter custom duration in seconds: ")
        try:
            duration = int(custom)
            if duration < 1 or duration > 120:
                print(f"{Colors.RED}Duration must be between 1 and 120 seconds{Colors.END}")
                sys.exit(1)
            print(f"{Colors.WHITE}⚙️ Generating {duration}-second custom video...{Colors.END}")
        except ValueError:
            print(f"{Colors.RED}Invalid duration{Colors.END}")
            sys.exit(1)
    elif choice == '6':
        print(f"{Colors.CYAN}Goodbye!{Colors.END}")
        sys.exit(0)
    else:
        print(f"{Colors.RED}Invalid choice{Colors.END}")
        sys.exit(1)
    
    # Ask for style selection
    if duration:
        print(f"\n{Colors.CYAN}{'─' * 50}{Colors.END}")
        print(f"{Colors.WHITE}Select subtitle style:{Colors.END}\n")
        print(f"  {Colors.YELLOW}1){Colors.END} 🎨 Clean Modern - Purple gradient with gold text")
        print(f"  {Colors.WHITE}2){Colors.END} ⚪ Minimal - White background, black text")
        print(f"  {Colors.WHITE}3){Colors.END} 🌴 Gradient Tropical - Coral to teal gradient")
        print(f"  {Colors.WHITE}4){Colors.END} 💻 Matrix Green - Terminal style")
        print(f"  {Colors.WHITE}5){Colors.END} 👑 Gold Luxury - Dark gradient with gold")
        print(f"  {Colors.WHITE}6){Colors.END} 🌸 Cherry Blossom - Soft peach with red text\n")
        
        style_choice = input("Enter style [1-6, default=1]: ")
        if style_choice.strip():
            try:
                style = int(style_choice)
                if style < 1 or style > 6:
                    print(f"{Colors.YELLOW}Using default style (Clean Modern){Colors.END}")
                    style = 1
            except ValueError:
                print(f"{Colors.YELLOW}Using default style (Clean Modern){Colors.END}")
                style = 1
        else:
            style = 1
        
        print()
        video_path = generate_synced_with_duration(duration, style)
    
    # Offer to open video
    if video_path:
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