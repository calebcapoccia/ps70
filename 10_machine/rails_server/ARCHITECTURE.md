# Rails Braille Machine Architecture

## Overview
This Rails application provides a web interface to control a Braille/tactile art machine via ESP32 WebSocket connection.

## Key Components

### Backend (Rails)

#### WebSocket Connections
1. **ESP32 Connection** (`app/models/esp32_connection.rb`)
   - Uses `faye-websocket` gem with EventMachine
   - Maintains persistent WebSocket connection to ESP32
   - Runs EventMachine in background thread
   - Messages from ESP32 go into a Queue for processing
   - Handles commands: DOT, RUN, HOME, STOP, CLEAR

2. **Action Cable** (Frontend ↔ Backend WebSocket)
   - `MachineChannel` broadcasts real-time progress updates
   - Eliminates need for HTTP polling
   - Instant progress notifications to connected clients

#### Background Jobs
- **MonitorEsp32Job** (`app/jobs/monitor_esp32_job.rb`)
  - Starts when dots are sent to machine
  - Polls ESP32 every 500ms for progress
  - Broadcasts updates via Action Cable
  - Runs for max 5 minutes with auto-timeout

#### API Endpoints
- `POST /api/connect` - Connect to ESP32
- `POST /api/disconnect` - Disconnect from ESP32
- `GET /api/status` - Get connection status
- `POST /api/convert/text` - Convert text to Braille coordinates
- `POST /api/send/dots` - Send dots to machine (starts MonitorEsp32Job)
- `POST /api/home` - Home the machine
- `POST /api/stop` - Emergency stop
- `POST /api/clear` - Clear dot queue

#### Services
- **BrailleConverter** - Text to Braille coordinate conversion
- **PathOptimizer** - Nearest-neighbor path optimization

### Frontend

#### WebSocket Integration
- Connects to Action Cable at `ws://localhost:3000/cable`
- Subscribes to `MachineChannel` when sending dots
- Receives real-time progress updates
- 60-second timeout fallback if no ESP32 progress messages

#### Features
- Text to Braille conversion with auto word-wrap
- Manual drawing mode with grid snapping
- Precision test pattern (80mm radius circle)
- Path optimization toggle
- Mirror mode for flip-over embossing
- Real-time execution progress bar
- Activity log

## Message Flow

### Sending Dots
```
Frontend → POST /api/send/dots → Rails Controller
                                      ↓
                                 Send DOT commands to ESP32
                                      ↓
                                 Send RUN command
                                      ↓
                                 Start MonitorEsp32Job
                                      ↓
Frontend ← WebSocket ← Action Cable ← Job polls ESP32
         (progress updates)           every 500ms
```

### ESP32 Progress Messages
- `PROGRESS,current,total` - Current progress (e.g., "PROGRESS,3,10")
- `COMPLETE` - Job finished
- `READY` - Initial connection message
- `BUSY` - Machine is busy

## Technical Decisions

### Why faye-websocket?
- Automatic WebSocket frame parsing (no manual `\x81\b` handling)
- EventMachine integration for non-blocking I/O
- More reliable than manual frame parsing with `websocket` gem

### Why Action Cable?
- Eliminates inefficient HTTP polling
- Real-time push notifications
- Built into Rails, no additional infrastructure
- Scalable with Redis adapter in production

### Why Background Job?
- Keeps HTTP requests fast (don't block on ESP32 polling)
- Allows multiple clients to receive same progress updates
- Automatic cleanup after timeout

## Constants
- Work area: 170mm × 250mm
- Dot size: 3mm
- Grid spacing: 5mm
- Braille cell: 17mm wide × 28mm tall
- Max characters per line: 10
- Max lines: 8

## Dependencies
- `faye-websocket` - WebSocket client
- `eventmachine` - Async I/O
- `rack-cors` - CORS support
- Rails Action Cable - WebSocket server
