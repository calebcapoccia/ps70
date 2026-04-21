// Constants
const WORK_WIDTH = 170;   // mm
const WORK_HEIGHT = 250;  // mm
const SCALE = 2;          // 2px per mm
const CANVAS_WIDTH = WORK_WIDTH * SCALE;
const CANVAS_HEIGHT = WORK_HEIGHT * SCALE;
const DOT_SIZE = 3;       // mm
const GRID_SPACING = 5;   // mm

// State
let currentMode = 'text';
let connected = false;
let currentDots = [];
let drawingDots = [];
let drawMode = 'pen'; // 'pen' or 'eraser'
let isDrawing = false;

// Canvas setup
let drawCanvas, drawCtx, previewCanvas, previewCtx;

window.onload = function() {
    drawCanvas = document.getElementById('drawCanvas');
    drawCtx = drawCanvas.getContext('2d');
    previewCanvas = document.getElementById('previewCanvas');
    previewCtx = previewCanvas.getContext('2d');
    
    setupDrawCanvas();
    updateCharCount();
    
    // Text input listener
    document.getElementById('textInput').addEventListener('input', updateCharCount);
    
    log('Page loaded. Connect to ESP32 to begin.', 'info');
};

// Connection Management
async function connect() {
    const ip = document.getElementById('espIp').value.trim();
    if (!ip) {
        log('Please enter ESP32 IP address', 'error');
        return;
    }
    
    log(`Connecting to ${ip}...`, 'info');
    
    try {
        const response = await fetch('/api/connect', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ip})
        });
        
        const data = await response.json();
        
        if (data.success) {
            connected = true;
            updateConnectionUI(true);
            log(`✓ Connected to ESP32 at ${ip}`, 'success');
        } else {
            log(`✗ Connection failed: ${data.error}`, 'error');
        }
    } catch (error) {
        log(`✗ Connection error: ${error.message}`, 'error');
    }
}

async function disconnect() {
    try {
        await fetch('/api/disconnect', {method: 'POST'});
        connected = false;
        updateConnectionUI(false);
        log('Disconnected from ESP32', 'info');
    } catch (error) {
        log(`Error disconnecting: ${error.message}`, 'error');
    }
}

function updateConnectionUI(isConnected) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const connectBtn = document.getElementById('connectBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const controlBtns = ['homeBtn', 'stopBtn', 'clearBtn'];
    
    if (isConnected) {
        statusDot.classList.add('connected');
        statusText.textContent = 'Connected';
        connectBtn.disabled = true;
        disconnectBtn.disabled = false;
        controlBtns.forEach(id => document.getElementById(id).disabled = false);
    } else {
        statusDot.classList.remove('connected');
        statusText.textContent = 'Disconnected';
        connectBtn.disabled = false;
        disconnectBtn.disabled = true;
        controlBtns.forEach(id => document.getElementById(id).disabled = true);
    }
}

// Tab Management
function switchTab(mode) {
    currentMode = mode;
    
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update mode content
    document.querySelectorAll('.mode-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (mode === 'text') {
        document.getElementById('textMode').classList.add('active');
    } else {
        document.getElementById('drawMode').classList.add('active');
    }
    
    // Hide preview when switching modes
    document.getElementById('previewSection').style.display = 'none';
}

// Text Mode
function updateCharCount() {
    const text = document.getElementById('textInput').value;
    const charCount = text.length;
    const lines = text.split('\n').length;
    
    document.getElementById('charCount').textContent = `${charCount} / 80 characters`;
    document.getElementById('lineCount').textContent = `${lines} lines`;
    
    if (charCount > 80) {
        document.getElementById('charCount').style.color = '#e74c3c';
    } else {
        document.getElementById('charCount').style.color = '#666';
    }
}

async function convertText() {
    const text = document.getElementById('textInput').value;
    const autoWrap = document.getElementById('autoWrap').checked;
    const mirror = document.getElementById('mirrorText').checked;
    
    if (!text.trim()) {
        log('Please enter some text', 'error');
        return;
    }
    
    log('Converting text to Braille...', 'info');
    
    try {
        const response = await fetch('/api/convert/text', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({text, auto_wrap: autoWrap, mirror})
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentDots = data.dots;
            log(`✓ Converted to ${data.dots.length} dots`, 'success');
            log(`Text info: ${data.info.total_chars} chars, ${data.info.lines} lines`, 'info');
            
            showPreview(currentDots);
        } else {
            log(`✗ Conversion failed: ${data.error}`, 'error');
        }
    } catch (error) {
        log(`✗ Error: ${error.message}`, 'error');
    }
}

// Drawing Mode
function setDrawMode(mode) {
    drawMode = mode;
    
    // Update button states
    document.getElementById('penBtn').classList.toggle('active', mode === 'pen');
    document.getElementById('eraserBtn').classList.toggle('active', mode === 'eraser');
    
    // Update cursor
    drawCanvas.style.cursor = mode === 'pen' ? 'crosshair' : 'not-allowed';
    
    log(`Switched to ${mode} mode`, 'info');
}

function setupDrawCanvas() {
    drawGrid(drawCtx);
    
    // Mouse down - start drawing
    drawCanvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        const rect = drawCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / SCALE;
        const y = (e.clientY - rect.top) / SCALE;
        handleDrawing(x, y);
    });
    
    // Mouse move - continue drawing if mouse is down
    drawCanvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        const rect = drawCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / SCALE;
        const y = (e.clientY - rect.top) / SCALE;
        handleDrawing(x, y);
    });
    
    // Mouse up - stop drawing
    drawCanvas.addEventListener('mouseup', () => {
        isDrawing = false;
    });
    
    // Mouse leave - stop drawing if mouse leaves canvas
    drawCanvas.addEventListener('mouseleave', () => {
        isDrawing = false;
    });
}

function handleDrawing(x, y) {
    if (drawMode === 'pen') {
        addDrawingDot(x, y);
    } else if (drawMode === 'eraser') {
        removeDrawingDot(x, y);
    }
}

function drawGrid(ctx) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw work area border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw grid lines
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= WORK_WIDTH; x += GRID_SPACING) {
        ctx.beginPath();
        ctx.moveTo(x * SCALE, 0);
        ctx.lineTo(x * SCALE, CANVAS_HEIGHT);
        ctx.stroke();
    }
    
    for (let y = 0; y <= WORK_HEIGHT; y += GRID_SPACING) {
        ctx.beginPath();
        ctx.moveTo(0, y * SCALE);
        ctx.lineTo(CANVAS_WIDTH, y * SCALE);
        ctx.stroke();
    }
}

function snapToGrid(x, y) {
    return {
        x: Math.round(x / GRID_SPACING) * GRID_SPACING,
        y: Math.round(y / GRID_SPACING) * GRID_SPACING
    };
}

function addDrawingDot(x, y) {
    const snapped = snapToGrid(x, y);
    
    // Check bounds
    if (snapped.x < 0 || snapped.x > WORK_WIDTH - DOT_SIZE || 
        snapped.y < 0 || snapped.y > WORK_HEIGHT - DOT_SIZE) {
        return;
    }
    
    // Check if dot already exists at this position
    const exists = drawingDots.some(dot => dot.x === snapped.x && dot.y === snapped.y);
    if (exists) {
        return;
    }
    
    drawingDots.push(snapped);
    redrawCanvas();
    updateDotCount();
    
    // Auto-show preview
    const mirror = document.getElementById('mirrorDraw').checked;
    const dots = mirror ? drawingDots.map(d => [WORK_WIDTH - d.x, d.y]) : drawingDots.map(d => [d.x, d.y]);
    showPreview(dots);
}

function removeDrawingDot(x, y) {
    const snapped = snapToGrid(x, y);
    
    // Find and remove dot at this position
    const index = drawingDots.findIndex(dot => dot.x === snapped.x && dot.y === snapped.y);
    if (index !== -1) {
        drawingDots.splice(index, 1);
        redrawCanvas();
        updateDotCount();
        
        // Update preview
        if (drawingDots.length > 0) {
            const mirror = document.getElementById('mirrorDraw').checked;
            const dots = mirror ? drawingDots.map(d => [WORK_WIDTH - d.x, d.y]) : drawingDots.map(d => [d.x, d.y]);
            showPreview(dots);
        } else {
            document.getElementById('previewSection').style.display = 'none';
        }
    }
}

function redrawCanvas() {
    drawGrid(drawCtx);
    
    // Draw dots
    drawCtx.fillStyle = '#e74c3c';
    drawingDots.forEach(dot => {
        drawCtx.beginPath();
        drawCtx.arc(dot.x * SCALE, dot.y * SCALE, DOT_SIZE * SCALE, 0, 2 * Math.PI);
        drawCtx.fill();
    });
}

function updateDotCount() {
    document.getElementById('dotCount').textContent = `${drawingDots.length} dots`;
}

function clearCanvas() {
    drawingDots = [];
    redrawCanvas();
    updateDotCount();
    document.getElementById('previewSection').style.display = 'none';
    log('Canvas cleared', 'info');
}

function generatePrecisionTest() {
    // Clear existing dots
    drawingDots = [];
    
    // Circle parameters - centered in work area with reasonable size
    const centerX = WORK_WIDTH / 2;  // 85mm
    const centerY = WORK_HEIGHT / 2; // 125mm
    const radius = 40; // 40mm radius circle
    
    log('Generating precision test pattern...', 'info');
    
    // Generate circle dots (every 5mm around circumference)
    const circumference = 2 * Math.PI * radius;
    const numDots = Math.floor(circumference / GRID_SPACING); // Approximately one dot every 5mm
    
    for (let i = 0; i < numDots; i++) {
        const angle = (i / numDots) * 2 * Math.PI;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        // Snap to grid
        const snapped = snapToGrid(x, y);
        
        // Check if already exists (avoid duplicates)
        const exists = drawingDots.some(dot => dot.x === snapped.x && dot.y === snapped.y);
        if (!exists && snapped.x >= 0 && snapped.x <= WORK_WIDTH - DOT_SIZE && 
            snapped.y >= 0 && snapped.y <= WORK_HEIGHT - DOT_SIZE) {
            drawingDots.push(snapped);
        }
    }
    
    // Add center dot
    const centerSnapped = snapToGrid(centerX, centerY);
    drawingDots.push(centerSnapped);
    
    // Redraw and show preview
    redrawCanvas();
    updateDotCount();
    
    const mirror = document.getElementById('mirrorDraw').checked;
    const dots = mirror ? drawingDots.map(d => [WORK_WIDTH - d.x, d.y]) : drawingDots.map(d => [d.x, d.y]);
    showPreview(dots);
    
    log(`✓ Precision test generated: ${drawingDots.length} dots`, 'success');
    log(`Circle: radius=${radius}mm, center=(${centerX}, ${centerY})`, 'info');
    log('Measure the actual circle and center to calculate error', 'info');
}

function clearCanvas() {
    drawingDots = [];
    redrawCanvas();
    updateDotCount();
    document.getElementById('previewSection').style.display = 'none';
    log('Canvas cleared', 'info');
}

// Preview
function showPreview(dots) {
    currentDots = dots;
    
    // Clear preview canvas
    previewCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw work area border
    previewCtx.strokeStyle = '#333';
    previewCtx.lineWidth = 2;
    previewCtx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw grid
    previewCtx.strokeStyle = '#eee';
    previewCtx.lineWidth = 1;
    for (let x = 0; x <= WORK_WIDTH; x += GRID_SPACING) {
        previewCtx.beginPath();
        previewCtx.moveTo(x * SCALE, 0);
        previewCtx.lineTo(x * SCALE, CANVAS_HEIGHT);
        previewCtx.stroke();
    }
    for (let y = 0; y <= WORK_HEIGHT; y += GRID_SPACING) {
        previewCtx.beginPath();
        previewCtx.moveTo(0, y * SCALE);
        previewCtx.lineTo(CANVAS_WIDTH, y * SCALE);
        previewCtx.stroke();
    }
    
    // Draw dots
    previewCtx.fillStyle = '#2ecc71';
    dots.forEach(([x, y]) => {
        previewCtx.beginPath();
        previewCtx.arc(x * SCALE, y * SCALE, DOT_SIZE * SCALE, 0, 2 * Math.PI);
        previewCtx.fill();
    });
    
    // Show preview section
    document.getElementById('previewSection').style.display = 'block';
    document.getElementById('previewDotCount').textContent = `${dots.length} dots`;
    document.getElementById('sendBtn').disabled = !connected;
}

// Send to Machine
async function sendToMachine() {
    if (!connected) {
        log('Not connected to ESP32', 'error');
        return;
    }
    
    if (currentDots.length === 0) {
        log('No dots to send', 'error');
        return;
    }
    
    log(`Sending ${currentDots.length} dots to machine...`, 'info');
    document.getElementById('sendBtn').disabled = true;
    
    try {
        const response = await fetch('/api/send/dots', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({dots: currentDots})
        });
        
        const data = await response.json();
        
        if (data.success) {
            log(`✓ Sent ${data.dots_sent} dots to machine`, 'success');
            log('Machine is executing...', 'info');
            showProgress(data.dots_sent);
        } else {
            log(`✗ Failed to send: ${data.error}`, 'error');
            document.getElementById('sendBtn').disabled = false;
        }
    } catch (error) {
        log(`✗ Error: ${error.message}`, 'error');
        document.getElementById('sendBtn').disabled = false;
    }
}

function showProgress(total) {
    const progressSection = document.getElementById('progressSection');
    progressSection.style.display = 'block';
    
    // Poll ESP32 for real progress updates
    const interval = setInterval(async () => {
        try {
            const response = await fetch('/api/progress');
            const data = await response.json();
            
            if (data.success) {
                if (data.status === 'running' && data.current !== undefined) {
                    // Update progress bar with real data
                    const percent = (data.current / data.total) * 100;
                    document.getElementById('progressFill').style.width = `${percent}%`;
                    document.getElementById('progressText').textContent = `${data.current} / ${data.total} dots complete`;
                    log(`Progress: ${data.current}/${data.total}`, 'info');
                } else if (data.status === 'complete') {
                    // Job finished
                    clearInterval(interval);
                    document.getElementById('progressFill').style.width = '100%';
                    document.getElementById('progressText').textContent = `${total} / ${total} dots complete`;
                    log('✓ Job complete!', 'success');
                    document.getElementById('sendBtn').disabled = false;
                    setTimeout(() => {
                        progressSection.style.display = 'none';
                    }, 3000);
                }
            }
        } catch (error) {
            console.error('Progress poll error:', error);
        }
    }, 500);  // Poll every 500ms
}

// Machine Commands
async function sendHome() {
    if (!connected) return;
    
    log('Sending HOME command...', 'info');
    try {
        const response = await fetch('/api/home', {method: 'POST'});
        const data = await response.json();
        if (data.success) {
            log('✓ Homing...', 'success');
        }
    } catch (error) {
        log(`✗ Error: ${error.message}`, 'error');
    }
}

async function sendStop() {
    if (!connected) return;
    
    log('Sending STOP command...', 'info');
    try {
        const response = await fetch('/api/stop', {method: 'POST'});
        const data = await response.json();
        if (data.success) {
            log('✓ Stopped', 'success');
        }
    } catch (error) {
        log(`✗ Error: ${error.message}`, 'error');
    }
}

async function sendClear() {
    if (!connected) return;
    
    log('Clearing dot queue...', 'info');
    try {
        const response = await fetch('/api/clear', {method: 'POST'});
        const data = await response.json();
        if (data.success) {
            log('✓ Queue cleared', 'success');
        }
    } catch (error) {
        log(`✗ Error: ${error.message}`, 'error');
    }
}

// Logging
function log(message, type = 'info') {
    const logContainer = document.getElementById('logContainer');
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${timestamp}] ${message}`;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

function clearLog() {
    document.getElementById('logContainer').innerHTML = '';
    log('Log cleared', 'info');
}
