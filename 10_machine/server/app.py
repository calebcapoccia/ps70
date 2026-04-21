"""
Flask server for Braille/Tactile Art Machine
Handles text-to-Braille conversion and WebSocket communication with ESP32
"""

from flask import Flask, render_template, request, jsonify
import websocket
import threading
import time
from braille_converter import braille_to_coords, get_text_info, word_wrap

app = Flask(__name__)

# ESP32 connection state
esp32_ws = None
esp32_connected = False
esp32_ip = None

def connect_to_esp32(ip):
    """Connect to ESP32 WebSocket server"""
    global esp32_ws, esp32_connected, esp32_ip
    
    try:
        ws_url = f"ws://{ip}/ws"
        print(f"Connecting to ESP32 at {ws_url}...")
        
        esp32_ws = websocket.create_connection(ws_url, timeout=5)
        esp32_connected = True
        esp32_ip = ip
        
        print(f"✓ Connected to ESP32 at {ip}")
        return True
    except Exception as e:
        print(f"✗ Failed to connect to ESP32: {e}")
        esp32_connected = False
        esp32_ws = None
        return False

def send_to_esp32(command):
    """Send command to ESP32"""
    global esp32_ws, esp32_connected
    
    if not esp32_connected or esp32_ws is None:
        return {"success": False, "error": "Not connected to ESP32"}
    
    try:
        esp32_ws.send(command)
        print(f"→ Sent to ESP32: {command}")
        
        # Try to receive response (non-blocking)
        esp32_ws.settimeout(0.5)
        try:
            response = esp32_ws.recv()
            print(f"← Received from ESP32: {response}")
            return {"success": True, "response": response}
        except:
            return {"success": True, "response": None}
            
    except Exception as e:
        print(f"✗ Error sending to ESP32: {e}")
        esp32_connected = False
        return {"success": False, "error": str(e)}

@app.route('/')
def index():
    """Serve main web interface"""
    return render_template('index.html')

@app.route('/api/connect', methods=['POST'])
def api_connect():
    """Connect to ESP32"""
    data = request.json
    ip = data.get('ip')
    
    if not ip:
        return jsonify({"success": False, "error": "No IP provided"})
    
    success = connect_to_esp32(ip)
    return jsonify({"success": success, "ip": ip})

@app.route('/api/disconnect', methods=['POST'])
def api_disconnect():
    """Disconnect from ESP32"""
    global esp32_ws, esp32_connected
    
    if esp32_ws:
        try:
            esp32_ws.close()
        except:
            pass
    
    esp32_ws = None
    esp32_connected = False
    
    return jsonify({"success": True})

@app.route('/api/status', methods=['GET'])
def api_status():
    """Get connection status"""
    return jsonify({
        "connected": esp32_connected,
        "ip": esp32_ip
    })

@app.route('/api/command', methods=['POST'])
def api_command():
    """Send command to ESP32"""
    data = request.json
    command = data.get('command')
    
    if not command:
        return jsonify({"success": False, "error": "No command provided"})
    
    result = send_to_esp32(command)
    return jsonify(result)

@app.route('/api/convert/text', methods=['POST'])
def api_convert_text():
    """Convert text to Braille coordinates"""
    data = request.json
    text = data.get('text', '')
    auto_wrap = data.get('auto_wrap', True)
    mirror = data.get('mirror', True)
    
    if not text:
        return jsonify({"success": False, "error": "No text provided"})
    
    # Word wrap if requested
    if auto_wrap:
        text = word_wrap(text)
    
    # Get text info
    info = get_text_info(text)
    
    if not info['fits']:
        return jsonify({
            "success": False,
            "error": f"Text too long. Max {info['max_chars']} characters, got {info['total_chars']}"
        })
    
    # Convert to coordinates
    coords = braille_to_coords(text, mirror=mirror)
    
    return jsonify({
        "success": True,
        "dots": coords,
        "info": info,
        "wrapped_text": text
    })

@app.route('/api/send/dots', methods=['POST'])
def api_send_dots():
    """Send dots to ESP32"""
    data = request.json
    dots = data.get('dots', [])
    
    if not dots:
        return jsonify({"success": False, "error": "No dots provided"})
    
    # Clear existing queue
    send_to_esp32("CLEAR")
    time.sleep(0.1)
    
    # Send all dots
    for x, y in dots:
        command = f"DOT,{x:.2f},{y:.2f}"
        result = send_to_esp32(command)
        if not result['success']:
            return jsonify({
                "success": False,
                "error": f"Failed to send dot: {result.get('error')}"
            })
        time.sleep(0.05)  # Small delay between commands
    
    # Start execution
    result = send_to_esp32("RUN")
    
    return jsonify({
        "success": True,
        "dots_sent": len(dots)
    })

@app.route('/api/home', methods=['POST'])
def api_home():
    """Send home command"""
    result = send_to_esp32("HOME")
    return jsonify(result)

@app.route('/api/stop', methods=['POST'])
def api_stop():
    """Send stop command"""
    result = send_to_esp32("STOP")
    return jsonify(result)

@app.route('/api/clear', methods=['POST'])
def api_clear():
    """Clear dot queue"""
    result = send_to_esp32("CLEAR")
    return jsonify(result)

@app.route('/api/progress', methods=['GET'])
def api_progress():
    """Poll for progress updates from ESP32"""
    global esp32_ws
    
    if not esp32_connected or esp32_ws is None:
        return jsonify({"success": False, "error": "Not connected"})
    
    try:
        # Check if there's a message waiting
        esp32_ws.settimeout(0.1)
        try:
            response = esp32_ws.recv()
            print(f"← Progress check: {response}")
            
            # Parse PROGRESS,current,total or COMPLETE
            if response.startswith("PROGRESS,"):
                parts = response.split(',')
                if len(parts) == 3:
                    return jsonify({
                        "success": True,
                        "status": "running",
                        "current": int(parts[1]),
                        "total": int(parts[2])
                    })
            elif response == "COMPLETE":
                return jsonify({
                    "success": True,
                    "status": "complete"
                })
            elif response == "BUSY":
                return jsonify({
                    "success": True,
                    "status": "busy"
                })
            
            return jsonify({"success": True, "status": "unknown", "message": response})
        except:
            # No message waiting
            return jsonify({"success": True, "status": "no_update"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

if __name__ == '__main__':
    print("\n" + "="*50)
    print("  BRAILLE MACHINE SERVER")
    print("="*50)
    print("\nStarting Flask server on http://localhost:8000")
    print("\nMake sure your ESP32 is:")
    print("  1. Connected to MAKERSPACE WiFi")
    print("  2. Running braille_machine.ino")
    print("  3. Check Serial Monitor for IP address")
    print("\nThen open http://localhost:8000 in your browser")
    print("="*50 + "\n")
    
    app.run(host='0.0.0.0', port=8000, debug=True)
