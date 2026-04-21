# Braille/Tactile Art Machine

A drawing machine that creates embossed Braille text and tactile art by pressing 3mm dots into paper against a silicone backing.

## 🎯 Two Implementations Available

This project offers **two complete web server implementations**:

### 1. **Flask Server** (Python)
Classic Python implementation with Flask framework.
- **Location**: `server/`
- **Port**: 8000
- **Documentation**: [server/README.md](server/README.md)
- **Quick Start**: [server/QUICKSTART.md](server/QUICKSTART.md)

### 2. **Ruby on Brailles** 💎⠃⠗⠇ (Rails)
Ruby on Rails implementation with the same functionality.
- **Location**: `rails_server/`
- **Port**: 3000
- **Documentation**: [rails_server/README.md](rails_server/README.md)
- **Quick Start**: [rails_server/QUICKSTART.md](rails_server/QUICKSTART.md)

**Both implementations:**
- ✅ Connect to the same ESP32 hardware
- ✅ Provide identical functionality
- ✅ Use the same communication protocol
- ✅ Share the same frontend interface

Choose based on your preferred language/framework!

## System Overview

- **Work Area**: 170mm × 250mm
- **Dot Size**: 3mm diameter
- **Spacing**: 5mm minimum (scaled 2× from standard Braille)
- **Capacity**: ~80 characters of Braille text, or 1,700 dot positions for drawing

## Architecture

```
Browser UI ←→ Web Server (Flask OR Rails) ←→ ESP32 ←→ Machine
  (Input)     (Braille Conversion)           (Motors)
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

## ESP32 Firmware Setup

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

This is why "Mirror" checkbox is enabled by default in both implementations.

## File Structure

```
10_machine/
├── braille_machine.ino          # ESP32 firmware
├── server/                      # Flask implementation
│   ├── app.py                   # Flask server
│   ├── braille_converter.py     # Text → coordinates
│   ├── optimizer.py             # Path optimization
│   ├── requirements.txt         # Python dependencies
│   ├── templates/
│   │   └── index.html          # Web interface
│   ├── static/
│   │   ├── style.css           # Styling
│   │   └── app.js              # Frontend logic
│   ├── README.md               # Flask documentation
│   └── QUICKSTART.md           # Flask quick start
├── rails_server/               # Rails implementation
│   ├── app/
│   │   ├── controllers/        # API controllers
│   │   ├── services/           # Braille & optimization logic
│   │   └── views/              # Web interface
│   ├── public/
│   │   ├── javascripts/        # Frontend logic
│   │   └── stylesheets/        # Styling
│   ├── Gemfile                 # Ruby dependencies
│   ├── README.md               # Rails documentation
│   └── QUICKSTART.md           # Rails quick start
└── README.md                   # This file
```

## Getting Started

1. **Upload ESP32 firmware** (see above)
2. **Choose your implementation**:
   - Python/Flask → See [server/QUICKSTART.md](server/QUICKSTART.md)
   - Ruby/Rails → See [rails_server/QUICKSTART.md](rails_server/QUICKSTART.md)
3. **Connect and create!**

## Credits

Built by Caleb Capoccia, Jacob Gokongwei, and Ellie Yin for PS70: Digital Fabrication.

## License

MIT License - Feel free to modify and use for your own projects!
