#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <AsyncTCP.h>
#include <AccelStepper.h>
#include <ESP32Servo.h>
#include "secrets.h"

// Pin definitions
const int stepPinX = D1;
const int dirPinX = D5;
const int stepPinY = D3;
const int dirPinY = D2;
const int xLimit = D8;
const int yLimit = D7;
const int servoPin = D4;

// Machine parameters
float pulleyDiamX = 18.7;
float pulleyDiamY = 12.22;
const int xMicrosteps = 16;
const int yMicrosteps = 16;
const int stepsPerRev = 200;

const float xMmtoSteps = (xMicrosteps * stepsPerRev) / (pulleyDiamX * PI);
const float yMmtoSteps = (yMicrosteps * stepsPerRev) / (pulleyDiamY * PI);

// Servo positions
const int SERVO_UP = 90;
const int SERVO_DOWN = 0;

// Stepper motors
AccelStepper stepperX(AccelStepper::DRIVER, stepPinX, dirPinX);
AccelStepper stepperY(AccelStepper::DRIVER, stepPinY, dirPinY);

// Servo
Servo servo;

// Web server and WebSocket
AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

// Dot job structure
struct DotJob {
  float x[500];
  float y[500];
  int count;
  int current;
  bool running;
} job;

int servoPos = SERVO_UP;
bool isHoming = false;

void moveServo(int targetPos) {
  Serial.printf("Moving servo to %d\n", targetPos);
  servoPos = targetPos;
  servo.write(targetPos);
}

void home() {
  Serial.println("=== HOMING ===");
  isHoming = true;
  ws.textAll("BUSY");
  
  stepperX.setSpeed(-600);
  stepperY.setSpeed(-600);
  
  while (digitalRead(xLimit) == HIGH || digitalRead(yLimit) == HIGH) {
    if (digitalRead(xLimit) == HIGH) {
      stepperX.runSpeed();
    }
    if (digitalRead(yLimit) == HIGH) {
      stepperY.runSpeed();
    }
    delay(2);
  }
  
  stepperX.setCurrentPosition(0);
  stepperY.setCurrentPosition(0);
  isHoming = false;
  
  Serial.println("Homing complete - at (0,0)");
  ws.textAll("READY");
}

void moveTo(float x_mm, float y_mm) {
  long targetX = x_mm * xMmtoSteps;
  long targetY = y_mm * yMmtoSteps;
  
  Serial.printf("Moving to (%.2f, %.2f) mm = (%ld, %ld) steps\n", 
                x_mm, y_mm, targetX, targetY);
  
  stepperX.moveTo(targetX);
  stepperY.moveTo(targetY);
  
  // Synchronize movement
  unsigned long distanceX = abs(targetX - stepperX.currentPosition());
  unsigned long distanceY = abs(targetY - stepperY.currentPosition());
  
  if (distanceX > 0 || distanceY > 0) {
    float distRatio = distanceX / ((float)distanceY + 0.001);
    
    stepperX.setAcceleration(distRatio > 1 ? 1000 : 1000 * distRatio);
    stepperX.setMaxSpeed(distRatio > 1 ? 2000 : 2000 * distRatio);
    stepperY.setAcceleration(distRatio > 1 ? 1000 / distRatio : 1000);
    stepperY.setMaxSpeed(distRatio > 1 ? 2000 / distRatio : 2000);
  }
  
  while (stepperX.distanceToGo() != 0 || stepperY.distanceToGo() != 0) {
    stepperX.run();
    stepperY.run();
  }
  
  Serial.println("Move complete");
}

void press() {
  Serial.println("Pressing...");
  moveServo(SERVO_DOWN);
  delay(300);
  moveServo(SERVO_UP);
  delay(200);
  Serial.println("Press complete");
}

void handleCommand(String cmd) {
  cmd.trim();
  Serial.printf("Command received: %s\n", cmd.c_str());
  
  if (cmd == "HOME") {
    home();
  }
  else if (cmd == "RUN") {
    if (job.count == 0) {
      Serial.println("ERROR: No dots in queue");
      ws.textAll("ERROR,No dots in queue");
      return;
    }
    job.running = true;
    job.current = 0;
    ws.textAll("BUSY");
    Serial.printf("Starting job with %d dots\n", job.count);
  }
  else if (cmd == "STOP") {
    job.running = false;
    Serial.println("Job stopped");
    ws.textAll("READY");
  }
  else if (cmd == "STATUS") {
    float x = stepperX.currentPosition() / xMmtoSteps;
    float y = stepperY.currentPosition() / yMmtoSteps;
    String status = String("POS,") + String(x, 2) + "," + String(y, 2);
    Serial.printf("Status: %s\n", status.c_str());
    ws.textAll(status);
  }
  else if (cmd.startsWith("DOT,")) {
    int comma = cmd.indexOf(',', 4);
    if (comma == -1) {
      Serial.println("ERROR: Invalid DOT command format");
      return;
    }
    
    float x = cmd.substring(4, comma).toFloat();
    float y = cmd.substring(comma + 1).toFloat();
    
    // Bounds check
    if (x < 0 || x > 170 || y < 0 || y > 250) {
      Serial.printf("ERROR: Dot out of bounds (%.2f, %.2f)\n", x, y);
      ws.textAll("ERROR,Dot out of bounds");
      return;
    }
    
    if (job.count < 500) {
      job.x[job.count] = x;
      job.y[job.count] = y;
      job.count++;
      Serial.printf("Added dot %d: (%.2f, %.2f)\n", job.count, x, y);
      ws.textAll(String("DOT_ADDED,") + job.count);
    } else {
      Serial.println("ERROR: Job queue full (500 dots max)");
      ws.textAll("ERROR,Queue full");
    }
  }
  else if (cmd == "CLEAR") {
    job.count = 0;
    job.current = 0;
    job.running = false;
    Serial.println("Job queue cleared");
    ws.textAll("CLEARED");
  }
  else {
    Serial.printf("ERROR: Unknown command: %s\n", cmd.c_str());
  }
}

void onWebSocketEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, 
                      AwsEventType type, void *arg, uint8_t *data, size_t len) {
  if (type == WS_EVT_CONNECT) {
    Serial.printf("WebSocket client #%u connected from %s\n", 
                  client->id(), client->remoteIP().toString().c_str());
    client->text("READY");
  }
  else if (type == WS_EVT_DISCONNECT) {
    Serial.printf("WebSocket client #%u disconnected\n", client->id());
  }
  else if (type == WS_EVT_DATA) {
    String message = "";
    for (size_t i = 0; i < len; i++) {
      message += (char)data[i];
    }
    handleCommand(message);
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n========================================");
  Serial.println("    BRAILLE/TACTILE ART MACHINE");
  Serial.println("========================================\n");
  
  // Pin setup
  pinMode(xLimit, INPUT_PULLUP);
  pinMode(yLimit, INPUT_PULLUP);
  pinMode(stepPinX, OUTPUT);
  pinMode(dirPinX, OUTPUT);
  pinMode(stepPinY, OUTPUT);
  pinMode(dirPinY, OUTPUT);
  
  digitalWrite(stepPinX, LOW);
  digitalWrite(stepPinY, LOW);
  digitalWrite(dirPinY, LOW);
  digitalWrite(dirPinX, LOW);
  
  // Stepper setup
  stepperX.setMaxSpeed(2000);
  stepperX.setAcceleration(1000);
  stepperY.setMaxSpeed(2000);
  stepperY.setAcceleration(1000);
  
  // Servo setup
  servo.setPeriodHertz(50);
  servo.attach(servoPin, 1000, 2000);
  moveServo(SERVO_UP);
  
  // Job initialization
  job.count = 0;
  job.current = 0;
  job.running = false;
  
  // WiFi connection
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("✓ WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    Serial.println();
    Serial.println("WebSocket endpoint:");
    Serial.print("  ws://");
    Serial.print(WiFi.localIP());
    Serial.println("/ws");
    Serial.println();
  } else {
    Serial.println("✗ WiFi connection failed!");
    Serial.println("Check SSID and password");
  }
  
  // WebSocket setup
  ws.onEvent(onWebSocketEvent);
  server.addHandler(&ws);
  server.begin();
  
  Serial.println("========================================");
  Serial.println("COMMANDS:");
  Serial.println("  HOME          - Run homing routine");
  Serial.println("  DOT,x,y       - Add dot at position (mm)");
  Serial.println("  RUN           - Execute queued dots");
  Serial.println("  STOP          - Stop execution");
  Serial.println("  CLEAR         - Clear dot queue");
  Serial.println("  STATUS        - Get current position");
  Serial.println("========================================");
  Serial.println("Ready for commands!\n");
}

void loop() {
  ws.cleanupClients();
  
  // Execute job if running
  if (job.running && job.current < job.count) {
    Serial.printf("\n[%d/%d] Executing dot at (%.2f, %.2f)\n", 
                  job.current + 1, job.count, 
                  job.x[job.current], job.y[job.current]);
    
    moveTo(job.x[job.current], job.y[job.current]);
    press();
    
    job.current++;
    
    // Send progress update
    String progress = String("PROGRESS,") + job.current + "," + job.count;
    ws.textAll(progress);
    Serial.printf("Progress: %d/%d complete\n", job.current, job.count);
    
    // Check if job complete
    if (job.current >= job.count) {
      job.running = false;
      Serial.println("\n=== JOB COMPLETE ===\n");
      ws.textAll("COMPLETE");
    }
  }
  
  delay(10);
}
