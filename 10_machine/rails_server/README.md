# 💎 Ruby on Brailles ⠃⠗⠇

A Ruby on Rails implementation of the Braille/Tactile Art Machine web server.

## What is This?

This is a complete Rails alternative to the Flask server, providing the same functionality. It connects to the ESP32-powered Braille embossing machine and provides a web interface for creating tactile art.

## Features

✅ **Text to Braille Conversion** - Type text, get Braille coordinates  
✅ **Manual Drawing Mode** - Click and drag to create custom patterns  
✅ **Path Optimization** - Nearest neighbor algorithm reduces travel time by 30-50%  
✅ **Real-time Progress Updates** - WebSocket-based progress (no polling!)  
✅ **ESP32 WebSocket Communication** - Bidirectional real-time control  
✅ **Precision Test Mode** - Generate calibration patterns  
✅ **Beautiful Web UI** - Same interface as Flask version

### Key Improvements over Flask
- 🚀 **Action Cable WebSockets** - Push-based progress updates instead of HTTP polling
- 🔧 **faye-websocket** - Reliable WebSocket client with automatic frame parsing
- ⚡ **Background Jobs** - Non-blocking progress monitoring
- 📡 **Multi-client Support** - Multiple browsers can watch progress simultaneously

## Requirements

- **Ruby**: 3.0 or higher (tested with 4.0.2)
- **Rails**: 7.0 or higher (tested with 8.1.3)
- **ESP32**: Running `braille_machine.ino` firmware
- **Network**: ESP32 and computer on same WiFi

## Installation

### 1. Install Dependencies

```bash
cd rails_server
bundle install
```

This installs:
- Rails 8.1.3
- Puma web server
- WebSocket client for ESP32 communication
- Rack CORS for development

### 2. Verify Installation

```bash
bundle exec rails --version
# Should show: Rails 8.1.3
```

## Running the Server

### Start the Rails Server

```bash
bundle exec rails server -p 3000
```

**Expected output:**
```
=> Booting Puma
=> Rails 8.1.3 application starting in development
=> Run `bin/rails server --help` for more startup options
Puma starting in single mode...
* Puma version: 8.0.0 (ruby 4.0.2-p0) ("Generational Goodness")
* Listening on http://127.0.0.1:3000
```

### Access the Web Interface

Open your browser to: **http://localhost:3000**

**Note:** Rails runs on port **3000** (Flask uses 8000), so both can run simultaneously!

## API Endpoints

All endpoints return JSON responses:

### Connection Management
- `POST /api/connect` - Connect to ESP32
- `POST /api/disconnect` - Disconnect from ESP32
- `GET /api/status` - Get connection status

### Braille Conversion
- `POST /api/convert/text` - Convert text to Braille coordinates

### Machine Control
- `POST /api/send/dots` - Send dot array to machine (with optional optimization)
- `POST /api/home` - Home the machine
- `POST /api/stop` - Emergency stop
- `POST /api/clear` - Clear dot queue
- `POST /api/command` - Send raw command

## Architecture

```
Browser
   ↕ HTTP (API calls)
   ↕ WebSocket (Action Cable - real-time progress)
Rails Server (Port 3000)
   ├── Controllers (API endpoints)
   ├── Channels (Action Cable - MachineChannel)
   ├── Jobs (MonitorEsp32Job - background progress monitoring)
   ├── Services (Braille conversion, path optimization)
   └── Models (ESP32 WebSocket connection)
   ↓ WebSocket
ESP32 (ws://192.168.x.x/ws)
   ↓
Stepper Motors + Servo
```

### Real-time Progress Updates
- Frontend subscribes to `MachineChannel` via Action Cable WebSocket
- When dots are sent, `MonitorEsp32Job` starts in background
- Job polls ESP32 every 500ms for progress messages
- Progress broadcasts to all connected clients in real-time
- No HTTP polling needed!

## Code Structure

```
rails_server/
├── app/
│   ├── channels/
│   │   ├── application_cable/
│   │   │   ├── channel.rb              # Base channel class
│   │   │   └── connection.rb           # Base connection class
│   │   └── machine_channel.rb          # Real-time progress updates
│   ├── controllers/
│   │   ├── home_controller.rb          # Serves main page
│   │   └── api/
│   │       ├── braille_controller.rb   # Text conversion
│   │       └── machine_controller.rb   # ESP32 communication
│   ├── jobs/
│   │   └── monitor_esp32_job.rb        # Background progress monitoring
│   ├── models/
│   │   └── esp32_connection.rb         # ESP32 WebSocket client (faye-websocket)
│   └── services/
│       ├── braille_converter.rb        # Text → coordinates
│       └── path_optimizer.rb           # Nearest neighbor algorithm
├── config/
│   ├── cable.yml                       # Action Cable configuration
│   └── routes.rb                       # API routes
├── public/
│   ├── index.html                      # Web interface (includes Action Cable JS)
│   └── static/
│       ├── app.js                      # Frontend logic (WebSocket subscriptions)
│       └── style.css                   # Styling
├── ARCHITECTURE.md                     # Detailed system design
└── Gemfile                             # Dependencies (faye-websocket, eventmachine)
```

## Usage

### 1. Connect to ESP32

1. Upload `braille_machine.ino` to ESP32
2. Note the IP address from Serial Monitor (e.g., `192.168.1.123`)
3. Enter IP in web interface
4. Click "Connect"
5. Click "🏠 Home" to initialize

### 2. Create Braille Text

1. Switch to "📝 Text to Braille" tab
2. Type your message (max 80 characters)
3. Enable "Auto word-wrap" for automatic line breaks
4. Enable "Mirror" for flip-over embossing
5. Click "Convert to Braille"
6. Review preview
7. Click "Send to Machine"

### 3. Draw Custom Patterns

1. Switch to "🎨 Manual Drawing" tab
2. Use "✏️ Pen" to add dots
3. Use "🧹 Eraser" to remove dots
4. Dots snap to 5mm grid
5. Preview updates automatically
6. Click "Send to Machine"

### 4. Path Optimization

The "⚡ Optimize path" checkbox (enabled by default) uses a nearest neighbor algorithm to reorder dots for minimal travel distance.

**Typical results:**
- 30-50% reduction in execution time
- Statistics shown in activity log

## Development

### Run in Development Mode

```bash
bundle exec rails server
```

### Check Routes

```bash
bundle exec rails routes
```

### Rails Console

```bash
bundle exec rails console
```

Test services directly:
```ruby
# Test Braille conversion
coords = BrailleConverter.braille_to_coords("HELLO")
# => [[160.0, 10.0], [155.0, 10.0], ...]

# Test path optimization
dots = [[10, 10], [150, 200], [15, 15]]
optimized = PathOptimizer.optimize_dots(dots)
```

## Comparison: Rails vs Flask

| Feature | Rails (this) | Flask |
|---------|-------------|-------|
| **Language** | Ruby | Python |
| **Port** | 3000 | 8000 |
| **Framework** | Rails 8.1 | Flask 3.0 |
| **WebSocket** | websocket-client-simple | websocket-client |
| **Structure** | MVC (services) | Functional |

**Both implementations:**
- Produce identical output
- Use same algorithms
- Share the same frontend
- Connect to same hardware

## Troubleshooting

### "Connection refused" when starting server

Make sure port 3000 is available:
```bash
lsof -i :3000
# If something is running, kill it or use a different port
bundle exec rails server -p 3001
```

### WebSocket connection fails

- Verify ESP32 IP address is correct
- Ensure both devices are on same network
- Check ESP32 Serial Monitor for errors
- Try pinging the ESP32: `ping 192.168.1.123`

### "Gem not found" errors

```bash
bundle install
```

### Rails server won't start

```bash
# Clear cache and restart
bundle exec rails tmp:clear
bundle exec rails server
```

### Progress bar not updating

1. **Hard refresh browser** - Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows) to clear JavaScript cache
2. **Check browser console** - Look for WebSocket connection errors
3. **Verify Action Cable** - Should see "Connected to progress WebSocket" in activity log
4. **Check Rails logs** - Look for `[MonitorEsp32Job]` messages showing progress polling

### WebSocket connection issues

```bash
# Check if EventMachine is installed
bundle list | grep eventmachine

# Reinstall gems if needed
bundle install
```

## Why Rails?

1. **Learning** - Provides comparison between Rails and Flask architectures
2. **Structure** - Rails conventions make code organization clear
3. **Real-time Features** - Action Cable provides native WebSocket support
4. **Background Jobs** - Active Job for non-blocking operations
5. **Ecosystem** - Rich gem ecosystem for future features

## Future Enhancements

- ✅ ~~Real-time progress updates via Action Cable~~ **DONE!**
- ✅ ~~Job queue with Active Job~~ **DONE!**
- Pattern library with Active Storage
- User authentication
- SVG import
- Multi-machine support

## Credits

Built by Caleb Capoccia, Jacob Gokongwei, and Ellie Yin for PS70: Digital Fabrication.

## License

MIT License - Feel free to modify and use for your own projects!

---

**Note:** Both Flask (port 8000) and Rails (port 3000) can run simultaneously to compare implementations.
