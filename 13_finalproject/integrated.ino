#include "MD_Parola.h"
#include "MD_MAX72XX.h"
#include "SPI.h"

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>

#include <ArduinoJson.h>

#define HARDWARE_TYPE MD_MAX72XX::FC16_HW
#define MAX_DEVICES 8

// Come back and change later?
#define SERVICE_UUID        "6da6814e-13a5-4144-96a0-6db8d3b343c9"
#define CHARACTERISTIC_UUID "82b3bdc2-ccf2-4063-b820-9a66322f8234"

// Define pins
const int dataPin = 5;
const int csPin = 18;
const int clkPin = 23;
const int btnPin = 19;

const int redPin = 12;
const int greenPin = 13;
const int bluePin = 15;

const int batteryPin = 36; // ADC1_CH0 (VP) - analog input only

String currentMessage = "Booting!";
uint16_t numScrolls = 1;
uint16_t completedScrolls = 0;
uint16_t currentPause = 0;
uint16_t currentSpeed = 25;
bool scrolling = false;
bool incomingMessage = false;

void setRgb(bool r, bool g, bool b) {
  digitalWrite(redPin, r ? HIGH : LOW);
  digitalWrite(greenPin, g ? HIGH : LOW);
  digitalWrite(bluePin, b ? HIGH : LOW);
}

// Set LED color based on battery percent: >=80 green, 20-80 yellow, <20 red
void setBatteryColor(float pct) {
  if (pct >= 80.0f)      setRgb(false, true,  false); // Green
  else if (pct >= 20.0f) setRgb(true,  true,  false); // Yellow (R+G)
  else                   setRgb(true,  false, false); // Red
}

// Battery monitoring state
const unsigned long batteryInterval = 2000; // ms between reads
unsigned long batteryLastRead = 0;

// LiPo voltage range (single cell): ~3.0V empty to ~4.2V full.
// User's "3.3V" LiPo: assuming direct connection within ESP32 ADC range (0-3.3V).
const float batteryMinV = 3.0f;
const float batteryMaxV = 4.2f;
const float batteryDividerRatio = 2.0f; // 1:1 divider -> ADC sees Vbat/2

void readBattery() {
  unsigned long now = millis();
  if (now - batteryLastRead < batteryInterval) return;
  batteryLastRead = now;

  // analogReadMilliVolts uses ESP32's factory ADC calibration
  uint32_t mv = analogReadMilliVolts(batteryPin);
  float voltage = (mv / 1000.0f) * batteryDividerRatio;

  // Approximate charge percentage (clamped 0-100)
  float pct = (voltage - batteryMinV) / (batteryMaxV - batteryMinV) * 100.0f;
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;

  Serial.print("Battery: V=");
  Serial.print(voltage, 2);
  Serial.print(" charge=");
  Serial.print(pct, 0);
  Serial.println("%");

  setBatteryColor(pct);
}

// Bluetooth variables
uint16_t connectionId = 0;
bool deviceConnected = false;
bool oldDeviceConnected = false;
BLEServer *pServer;

// Callback for bluetooth message to display
class DisplayCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) override {
    String payload = pCharacteristic->getValue();

    if (payload.length() == 0) return;

    Serial.print("Received BLE payload: ");
    Serial.println(payload);

    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (error) {
      Serial.print("JSON parse failed: ");
      Serial.println(error.c_str());
      return;
    }

    // Required field: text
    if (!doc["text"].is<const char*>()) {
      Serial.println("Missing required field: text");
      return;
    }

    currentMessage = String(doc["text"].as<const char*>());

    // Handle other fields
    numScrolls = max(1, doc["repeat"] | 1);
    currentPause = max(0, doc["pause"] | 0);
    currentSpeed = max(1, doc["speed"] | 25);

    completedScrolls = 0;
    incomingMessage = true;

    Serial.print("Received BLE message: ");
    Serial.println(currentMessage);
  }
};

void resetWithMessage(String message) {
  currentMessage = message;
  numScrolls = 1;
  completedScrolls = 0;
  currentPause = 0;
  currentSpeed = 25;
  scrolling = false;
  incomingMessage = true;
}

class DisplayServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer, esp_ble_gatts_cb_param_t* param) override {
    deviceConnected = true;
    connectionId = param->connect.conn_id;
    resetWithMessage("Connected");
    Serial.println("Device connected");
  }

  void onDisconnect(BLEServer* pServer) override {
    deviceConnected = false;
    resetWithMessage("Disconnected");
    Serial.println("Device disconnected");
  }
};

class Button {
  int pin;
  bool isPressed;
  unsigned long lastPressed;

  public:
    Button(int buttonPin) {
      pin = buttonPin;
    }

    void begin() {
      pinMode(pin, INPUT_PULLUP);
    }

    bool isReset() {
      // Check if currently pressed
      if (digitalRead(pin) == LOW) {
        // If was already pressed, check if 5 seconds have passed. If not previously pressed, reset time
        unsigned long curTime = millis();
        if (isPressed) {
          if (curTime - lastPressed >= 5000) {
            isPressed = false;
            return true;
          }
        } else {
          isPressed = true;
          lastPressed = curTime;
        }
      } else {
        isPressed = false;
      }
      return false;
    }
};

class LedMatrix {
  MD_Parola display;
  char messageBuffer[300]; // Message buffer to persist message while scrolling

  public:
    LedMatrix(uint8_t dataPin, uint8_t clkPin, uint8_t csPin)
      : display(HARDWARE_TYPE, dataPin, clkPin, csPin, MAX_DEVICES) {}

    void begin() {
      display.begin();
      display.setIntensity(2);
      display.displayClear();
      display.setTextAlignment(PA_RIGHT);
    }

    // Scrolls 'message' at 'speed' with 'pause' in between
    void startScroll(const String& message, uint16_t speed, uint16_t pause) {
      message.toCharArray(messageBuffer, sizeof(messageBuffer));
      display.displayClear();
      display.displayText(messageBuffer, PA_LEFT, speed, pause, PA_SCROLL_LEFT, PA_SCROLL_LEFT);
    }

    // Returns true if the display is animating
    bool animate() {
      return display.displayAnimate();
    }

    // Resets display
    void reset() {
      display.displayReset();
    }

    // Clears display
    void clear() {
      display.displayClear();
    }
};

Button universalBtn(btnPin);
LedMatrix ledDisplay(dataPin, clkPin, csPin);

void setup() {
  Serial.begin(9600);
  ledDisplay.begin(); // Start LED

  pinMode(redPin, OUTPUT);
  pinMode(greenPin, OUTPUT);
  pinMode(bluePin, OUTPUT);
  setRgb(true, false, false); // start on red

  analogReadResolution(12);
  pinMode(batteryPin, INPUT);

  universalBtn.begin();

  // Begin BLE connection
  BLEDevice::init("CarDisplay");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new DisplayServerCallbacks());


  BLEService *pService = pServer->createService(SERVICE_UUID);

  BLECharacteristic *pCharacteristic = pService->createCharacteristic(
                                         CHARACTERISTIC_UUID,
                                         BLECharacteristic::PROPERTY_WRITE
                                       );

  pCharacteristic->setCallbacks(new DisplayCallbacks());
  pCharacteristic->setValue("");
  pService->start();

  BLEAdvertising *pAdvertising = pServer->getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->start();
}

void loop() {
  // Periodically read battery and update LED color
  readBattery();

  // Check if reset button held
  if (universalBtn.isReset()) {
    if (deviceConnected) {
      pServer->disconnect(connectionId);
    }
  }
  
  // Just disconnected
  if (!deviceConnected && oldDeviceConnected) {
    delay(200); // Delay is fine here
    BLEDevice::startAdvertising();
    Serial.println("Restarted advertising");
    oldDeviceConnected = deviceConnected;
  }

  // Just connected
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }

  // Wait for current scroll to finish before displaying new message
  if (incomingMessage && !scrolling) {
    completedScrolls = 0;
    ledDisplay.startScroll(currentMessage, currentSpeed, currentPause);
    incomingMessage = false;
    scrolling = true;
  }
  else if (scrolling) {
    if (ledDisplay.animate()) {
      completedScrolls++;

      // Reset once we've completed all scrolls
      if (completedScrolls < numScrolls) {
        ledDisplay.reset();
      } else {
        ledDisplay.clear();
        scrolling = false;
      }
    }
  }
}