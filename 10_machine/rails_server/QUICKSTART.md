# Quick Start Guide - Ruby on Brailles 💎

Get your Rails-powered Braille machine running in 3 steps!

## Prerequisites

✅ ESP32 with `braille_machine.ino` uploaded  
✅ Ruby 3.0+ installed  
✅ Rails 7.0+ installed

## Step 1: Upload ESP32 Firmware (5 minutes)

**Skip this if you've already done it for the Flask version!**

1. Open Arduino IDE
2. Open `braille_machine.ino`
3. Select **Board**: ESP32 Dev Module
4. Select correct **Port**
5. Click **Upload**
6. Open **Serial Monitor** (115200 baud)
7. **Write down the IP address** shown (e.g., `192.168.1.123`)

**Expected output:**
```
========================================
    BRAILLE/TACTILE ART MACHINE
========================================

Connecting to WiFi: MAKERSPACE
.....
✓ WiFi connected!
IP address: 192.168.1.123

WebSocket endpoint:
  ws://192.168.1.123/ws

========================================
Ready for commands!
```

## Step 2: Start Rails Server (2 minutes)

Open terminal and run:

```bash
cd /Users/caleb/Desktop/PS70/10_machine/rails_server
bundle install
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
* Listening on http://[::1]:3000
Use Ctrl-C to stop
```

## Step 3: Use Web Interface (1 minute)

1. Open browser to: **http://localhost:3000**
2. Enter ESP32 IP address (from Step 1)
3. Click **Connect**
4. Click **🏠 Home** to initialize machine
5. Ready to create!

---

## First Test: "HI"

### Text Mode Test:
1. Switch to "📝 Text to Braille" tab
2. Type: `HI`
3. Click "Convert to Braille"
4. Review preview (should show ~8 dots)
5. Click "Send to Machine"
6. Wait ~10 seconds
7. Flip paper to see raised dots

### Drawing Mode Test:
1. Switch to "🎨 Manual Drawing" tab
2. Use "✏️ Pen" mode (default)
3. Click and drag on canvas to draw a simple pattern
4. Try "🧹 Eraser" to remove dots
5. Preview updates automatically
6. Click "Send to Machine"
7. Flip paper to see raised dots

### Precision Test (for calibration):
1. Switch to "🎨 Manual Drawing" tab
2. Click "⭕ Precision Test" button
3. System generates 40mm radius circle with center dot
4. Click "Send to Machine"
5. Measure actual circle radius and calculate error:
   - **Percent Error** = `|measured - 40| / 40 × 100%`
6. Verify center dot is at exact center

---

## Troubleshooting

### "Port 3000 already in use"

```bash
# Use a different port
bundle exec rails server -p 3001
# Then open http://localhost:3001
```

### "Connection failed" in web interface

- Double-check IP address (no typos!)
- Ensure computer is on MAKERSPACE network
- Try pinging the IP: `ping 192.168.1.123`
- Check ESP32 Serial Monitor for errors

### "Gem not found" errors

```bash
bundle install
```

### "Dots not pressing"

- Run Home command first
- Check servo is connected to D4
- Verify servo moves when pressing (listen for sound)
- Check silicone backing is in place

### "Machine not moving"

- Check stepper connections (D1,D5 for X; D3,D2 for Y)
- Verify power supply is connected
- Run Home command to reset position

---

## Tips for Best Results

✅ **DO:**
- Run Home before each session
- Use short messages (< 40 chars)
- Place silicone backing under paper
- Use printer paper (not cardstock)
- Flip paper to see raised dots
- Enable path optimization (saves 30-50% time!)

❌ **DON'T:**
- Exceed 80 characters in text mode
- Place dots too close together (< 5mm)
- Run without homing first
- Use paper that's too thick

---

## Rails-Specific Tips

### Running Both Servers

You can run Flask and Rails simultaneously:

```bash
# Terminal 1: Flask
cd server
python app.py
# Runs on http://localhost:8000

# Terminal 2: Rails
cd rails_server
bundle exec rails server
# Runs on http://localhost:3000
```

Both connect to the same ESP32!

### Rails Console

Test services directly:

```bash
bundle exec rails console
```

```ruby
# Test Braille conversion
BrailleConverter.braille_to_coords("HELLO")

# Test path optimization
dots = [[10, 10], [150, 200], [15, 15]]
PathOptimizer.optimize_dots(dots)

# Check ESP32 connection
Esp32Connection.instance.status
```

### View Routes

```bash
bundle exec rails routes
```

---

## Command Reference

### Machine Controls
- **🏠 Home**: Reset to origin (run this first!)
- **⏹️ Stop**: Emergency stop
- **🗑️ Clear Queue**: Remove all queued dots

### Text Mode
- Max 80 characters
- Auto word-wrap at 10 chars/line
- Mirror enabled by default (for flip-over)

### Drawing Mode
- Click to place dots
- Dots snap to 5mm grid
- Max 500 dots per job
- Mirror enabled by default

### Path Optimization
- **⚡ Enabled (default)**: Reorders dots for shortest path
- **Disabled**: Dots execute in order added
- **Typical savings**: 30-50% reduction in travel time

---

## Next Steps

Once basic operation works:

1. **Compare with Flask** - Run both servers and compare
2. **Explore Rails code** - Check out the MVC structure
3. **Test longer text** - Try full 80 character messages
4. **Create patterns** - Experiment with drawing mode
5. **Optimize paths** - Watch the optimization statistics
6. **Document results** - Take photos for your writeup!

---

## Getting Help

**Check Rails logs** in the terminal where server is running  
**Check Browser Console** (F12) for frontend errors  
**Check Serial Monitor** for ESP32 logs

**Common error messages:**
- `Dot out of bounds` - Position exceeds 170×250mm
- `Queue full` - More than 500 dots
- `Not connected` - WebSocket connection lost

---

## Demo Checklist

Before your demo:

- [ ] ESP32 connected to MAKERSPACE WiFi
- [ ] Rails server running on laptop
- [ ] Web interface loaded at http://localhost:3000
- [ ] Connected to ESP32 successfully
- [ ] Machine homed successfully
- [ ] Test pattern completed successfully
- [ ] Silicone backing in place
- [ ] Stack of printer paper ready
- [ ] Backup test message prepared ("HELLO")

Good luck! 🚀
