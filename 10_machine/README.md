# Braille/Tactile Art Machine

A drawing machine that creates embossed Braille text and tactile art by pressing 3mm dots into paper against a silicone backing.

## System Overview

- **Work Area**: 170mm × 250mm
- **Dot Size**: 3mm diameter
- **Spacing**: 5mm minimum (scaled 2× from standard Braille)
- **Capacity**: ~80 characters of Braille text, or 1,700 dot positions for drawing

## Architecture

```
Browser UI ←→ Python Flask Server ←→ ESP32 ←→ Machine
  (Input)     (Braille Conversion)    (Motors)
```

## Hardware Setup

### Components
- ESP32 microcontroller
- 2× Stepper motors (X/Y axis)
- Servo motor (rack & pinion press mechanism)
- 2× Limit switches (homing)
- Stepper drivers
- 3mm ball on plate (press end effector)
- Silicone backing sheet (170×250mm)

### Pin Configuration
- X Stepper: Step=D1, Dir=D5
- Y Stepper: Step=D3, Dir=D2
- Servo: D4
- X Limit: D8
- Y Limit: D7

## Software Setup

### 1. ESP32 Firmware

**Upload `braille_machine.ino` to ESP32:**

```bash
# Open in Arduino IDE
# Select Board: ESP32 Dev Module
# Upload
```

**Check Serial Monitor (115200 baud) for IP address:**
```
WiFi connected!
IP address: 192.168.1.123
WebSocket: ws://192.168.1.123/ws
```

### 2. Python Server

**Install dependencies:**

```bash
cd server
pip install -r requirements.txt
```

**Run server:**

```bash
python app.py
```

Server will start at `http://localhost:8000`

### 3. Web Interface

1. Open browser to `http://localhost:8000`
2. Enter ESP32 IP address (from Serial Monitor)
3. Click "Connect"
4. Run "Home" command to initialize machine

## Usage

### Text to Braille Mode

1. Switch to "Text to Braille" tab
2. Type your message (max 80 characters)
3. Enable "Auto word-wrap" for automatic line breaks
4. Enable "Mirror" for flip-over embossing (recommended)
5. Click "Convert to Braille"
6. Review preview
7. Click "Send to Machine"
8. Wait for completion
9. Flip paper to see raised Braille dots

**Example:**
- Input: "HELLO WORLD"
- Output: 2 lines, ~30 dots
- Time: ~30 seconds

### Manual Drawing Mode

1. Switch to "Manual Drawing" tab
2. Select tool:
   - **✏️ Pen**: Click and drag to add dots
   - **🧹 Eraser**: Click and drag to remove dots
3. Draw your pattern (dots snap to 5mm grid)
4. Enable "Mirror" for flip-over embossing
5. Preview updates automatically
6. Click "Send to Machine"
7. Flip paper to see raised pattern

**Tips:**
- Click and hold while dragging to draw continuous lines
- Dots snap to 5mm grid to prevent overlap
- Switch between pen and eraser as needed
- Maximum 500 dots per job
- Simple patterns work best

### Precision Test Mode

For calibration and precision testing:

1. Switch to "Manual Drawing" tab
2. Click "⭕ Precision Test" button
3. System generates a 40mm radius circle with center dot
4. Click "Send to Machine"
5. Measure the actual embossed circle:
   - **Radius**: Measure from center dot to circle edge
   - **Expected**: 40mm
   - **Percent Error**: `|measured - 40| / 40 × 100%`
6. Verify center dot is at exact center of circle

**Calibration Requirements:**
- ✅ Home position consistent on each power-on (auto-homes on startup)
- ✅ Precision test: circle with marked center for error calculation

## Communication Protocol

### Commands (Server → ESP32)

- `HOME` - Run homing routine
- `DOT,x,y` - Add dot at position (mm)
- `RUN` - Execute queued dots
- `STOP` - Stop execution
- `CLEAR` - Clear dot queue
- `STATUS` - Get current position

### Responses (ESP32 → Server)

- `READY` - Ready for commands
- `BUSY` - Executing job
- `COMPLETE` - Job finished
- `PROGRESS,current,total` - Progress update
- `POS,x,y` - Current position
- `ERROR,message` - Error occurred

## Braille Reference

### Standard vs. Your Machine

| Dimension | Standard | Your Machine |
|-----------|----------|--------------|
| Dot diameter | 1.5mm | 3mm (2×) |
| Dot spacing | 2.5mm | 5mm (2×) |
| Cell spacing | 6mm | 12mm (2×) |
| Line spacing | 10mm | 15mm (1.5×) |

### Braille Alphabet

Each letter is represented by a pattern of dots in a 2×3 grid:

```
1 4
2 5
3 6
```

- A = dot 1
- B = dots 1,2
- C = dots 1,4
- H = dots 1,2,5
- (etc.)

## Troubleshooting

### ESP32 won't connect to WiFi
- Check SSID and password in `braille_machine.ino`
- Verify MAKERSPACE network is available
- Check Serial Monitor for error messages

### Web interface can't connect to ESP32
- Verify ESP32 IP address is correct
- Ensure both computer and ESP32 are on same network
- Check firewall settings

### Dots not pressing correctly
- Verify servo is attached and moving
- Check servo positions (SERVO_UP=90, SERVO_DOWN=0)
- Adjust press delay if needed (currently 300ms)
- Ensure silicone backing is in place

### Machine not homing
- Check limit switch connections
- Verify limit switches are normally open
- Test switches with multimeter

### Dots overlapping or misaligned
- Run HOME command before each job
- Verify stepper calibration (xMmtoSteps, yMmtoSteps)
- Check belt tension
- Ensure work surface is level

## Physical Constraints

### Braille Text Limits
- **10 characters per line** (170mm ÷ 17mm)
- **8 lines maximum** (250mm ÷ 28mm)
- **80 characters total**

### Drawing Limits
- **34 dots wide** (170mm ÷ 5mm)
- **50 dots tall** (250mm ÷ 5mm)
- **1,700 possible positions**
- **500 dots per job** (memory limit)

## Mirroring Explained

The machine presses from the **back** of the paper, so coordinates must be mirrored horizontally:

1. User types "HELLO"
2. Machine presses mirrored version on back
3. User flips paper over
4. Raised dots read correctly as "HELLO"

**Formula:** `mirrored_x = 170 - original_x`

This is why "Mirror" checkbox is enabled by default.

## File Structure

```
10_machine/
├── braille_machine.ino          # ESP32 firmware
├── server/
│   ├── app.py                   # Flask server
│   ├── braille_converter.py     # Text → coordinates
│   ├── requirements.txt         # Python dependencies
│   ├── templates/
│   │   └── index.html          # Web interface
│   └── static/
│       ├── style.css           # Styling
│       └── app.js              # Frontend logic
└── README.md                    # This file
```

## Development Notes

### Future Enhancements
- SVG import for complex patterns
- Toolpath optimization (traveling salesman)
- Job queue for multiple patterns
- Real-time position tracking
- Undo/redo in drawing mode
- Save/load patterns
- Progress polling from ESP32

### Known Limitations
- No optimization (dots executed in order)
- Progress is simulated (not real-time from ESP32)
- 500 dot limit per job
- No job persistence
- Basic error handling

## Credits

Built by Caleb Capoccia, Jacob Gokongwei, and Ellie Yin for PS70: Digital Fabrication.

## License

MIT License - Feel free to modify and use for your own projects!
