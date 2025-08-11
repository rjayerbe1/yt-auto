#!/usr/bin/env python3
"""
TTS Server - Persistent service for Chatterbox TTS
Keeps model loaded in memory to avoid reloading for each audio generation
"""
import sys
import json
import os
import torch
import torchaudio as ta
from flask import Flask, request, jsonify, Response
import tempfile
from pathlib import Path
import logging
import signal
import atexit
import time
from queue import Queue
import threading

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Suppress model loading messages
import warnings
warnings.filterwarnings("ignore")

app = Flask(__name__)

# Global model instance
model = None
device = None

def get_optimal_device():
    """Get the best available device for computation"""
    if torch.cuda.is_available():
        return "cuda"  # NVIDIA GPU
    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        # Apple Silicon GPU (M1/M2/M3)
        return "mps"
    else:
        return "cpu"

def initialize_model():
    """Initialize the TTS model once"""
    global model, device
    
    if model is not None:
        return  # Already initialized
    
    logger.info("Initializing Chatterbox TTS model...")
    
    # Suppress output during model loading
    from io import StringIO
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    sys.stdout = StringIO()
    sys.stderr = StringIO()
    
    try:
        from chatterbox.tts import ChatterboxTTS
        
        device = get_optimal_device()
        logger.info(f"Using device: {device}")
        
        # Load model on the optimal device
        model = ChatterboxTTS.from_pretrained(device=device)
        
        # For MPS, optimize the model
        if device == "mps":
            # Enable memory efficient attention if available
            if hasattr(model, 'enable_xformers_memory_efficient_attention'):
                try:
                    model.enable_xformers_memory_efficient_attention()
                except:
                    pass
            
            # Set to eval mode for inference
            if hasattr(model, 'eval'):
                model.eval()
        
        logger.info("Model loaded successfully!")
        
    finally:
        # Restore stdout/stderr
        sys.stdout = old_stdout
        sys.stderr = old_stderr

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "device": device
    })

@app.route('/generate', methods=['POST'])
def generate():
    """Generate TTS audio"""
    global model, device
    
    # Initialize model if not already done
    if model is None:
        initialize_model()
    
    data = request.json
    text = data.get('text', '')
    output_path = data.get('output_path')
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
    
    if not output_path:
        # Generate temporary file if no path provided
        temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
        output_path = temp_file.name
    
    try:
        # Generate audio
        if device == "mps":
            # Try with automatic mixed precision for faster inference
            try:
                with torch.autocast(device_type="mps", dtype=torch.float16):
                    wav = model.generate(text)
            except:
                # Fallback to standard generation if autocast fails
                wav = model.generate(text)
        else:
            # Standard generation for CPU or CUDA
            wav = model.generate(text)
        
        # Save the audio file
        ta.save(output_path, wav, model.sr)
        
        return jsonify({
            "success": True,
            "output": output_path,
            "sample_rate": model.sr,
            "device": device,
            "gpu_accelerated": device in ["cuda", "mps"]
        })
        
    except Exception as e:
        logger.error(f"Error generating audio: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/batch', methods=['POST'])
def batch_generate():
    """Generate multiple TTS audios in batch"""
    global model, device
    
    # Initialize model if not already done
    if model is None:
        initialize_model()
    
    data = request.json
    items = data.get('items', [])
    
    if not items:
        return jsonify({"error": "No items provided"}), 400
    
    results = []
    total_items = len(items)
    
    for index, item in enumerate(items):
        text = item.get('text', '')
        output_path = item.get('output_path')
        
        if not text:
            results.append({"error": "No text provided", "progress": (index + 1) / total_items})
            continue
        
        if not output_path:
            # Generate temporary file if no path provided
            temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
            output_path = temp_file.name
        
        try:
            logger.info(f"Generating audio {index + 1}/{total_items}: {text[:30]}...")
            
            # Generate audio
            if device == "mps":
                try:
                    with torch.autocast(device_type="mps", dtype=torch.float16):
                        wav = model.generate(text)
                except:
                    wav = model.generate(text)
            else:
                wav = model.generate(text)
            
            # Save the audio file
            ta.save(output_path, wav, model.sr)
            
            results.append({
                "success": True,
                "output": output_path,
                "sample_rate": model.sr,
                "progress": (index + 1) / total_items,
                "index": index + 1,
                "total": total_items
            })
            
        except Exception as e:
            logger.error(f"Error generating audio for '{text[:50]}...': {e}")
            results.append({"error": str(e), "progress": (index + 1) / total_items})
    
    return jsonify({
        "success": True,
        "results": results,
        "device": device,
        "gpu_accelerated": device in ["cuda", "mps"],
        "total_processed": len(results)
    })

@app.route('/batch-stream', methods=['POST'])
def batch_generate_stream():
    """Generate multiple TTS audios with SSE progress updates"""
    global model, device
    
    # Initialize model if not already done
    if model is None:
        initialize_model()
    
    data = request.json
    items = data.get('items', [])
    
    if not items:
        return jsonify({"error": "No items provided"}), 400
    
    def generate():
        """Generator function for SSE"""
        results = []
        total_items = len(items)
        
        # Send initial message
        yield f"data: {json.dumps({'type': 'start', 'total': total_items, 'device': device})}\n\n"
        
        for index, item in enumerate(items):
            text = item.get('text', '')
            output_path = item.get('output_path')
            segment_type = item.get('type', 'segment')
            
            if not text:
                yield f"data: {json.dumps({'type': 'error', 'index': index, 'message': 'No text provided'})}\n\n"
                continue
            
            if not output_path:
                temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
                output_path = temp_file.name
            
            try:
                # Send progress update
                yield f"data: {json.dumps({'type': 'progress', 'index': index + 1, 'total': total_items, 'segment': segment_type, 'text': text[:50] + '...', 'progress': (index / total_items) * 100})}\n\n"
                
                # Generate audio
                if device == "mps":
                    try:
                        with torch.autocast(device_type="mps", dtype=torch.float16):
                            wav = model.generate(text)
                    except:
                        wav = model.generate(text)
                else:
                    wav = model.generate(text)
                
                # Save the audio file
                ta.save(output_path, wav, model.sr)
                
                result = {
                    "success": True,
                    "output": output_path,
                    "sample_rate": model.sr,
                    "index": index + 1
                }
                results.append(result)
                
                # Send completion for this item
                yield f"data: {json.dumps({'type': 'item_complete', 'index': index + 1, 'total': total_items, 'output': output_path, 'progress': ((index + 1) / total_items) * 100})}\n\n"
                
            except Exception as e:
                logger.error(f"Error generating audio: {e}")
                yield f"data: {json.dumps({'type': 'error', 'index': index, 'message': str(e)})}\n\n"
                results.append({"error": str(e)})
        
        # Send final message with all results
        yield f"data: {json.dumps({'type': 'complete', 'results': results, 'total': len(results)})}\n\n"
    
    return Response(generate(), mimetype='text/event-stream')

def cleanup():
    """Cleanup function to free resources"""
    global model
    if model is not None:
        logger.info("Cleaning up model...")
        del model
        model = None
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

# Register cleanup
atexit.register(cleanup)
signal.signal(signal.SIGTERM, lambda s, f: cleanup())
signal.signal(signal.SIGINT, lambda s, f: cleanup())

if __name__ == '__main__':
    # Initialize model on startup
    initialize_model()
    
    # Run server
    port = int(os.environ.get('TTS_PORT', 5555))
    logger.info(f"Starting TTS server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)