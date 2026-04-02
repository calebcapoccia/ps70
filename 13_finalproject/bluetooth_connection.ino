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
const int dataPin = 15;
const int csPin = 2;
const int clkPin = 4;

String currentMessage = "Booting!";
uint16_t numScrolls = 1;
uint16_t completedScrolls = 0;
uint16_t currentPause = 0;
uint16_t currentSpeed = 25;
bool scrolling = false;
bool incomingMessage = false;

// Bluetooth variables
uint16_t connectionId = 0;
bool deviceConnected = false;
bool oldDeviceConnected = false;

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

class LedMatrix {
  MD_Parola display;
  char messageBuffer[300]; // Message buffer to persist message while scrolling

public:
  LedMatrix(uint8_t dataPin, uint8_t clkPin, uint8_t csPin)
    : display(HARDWARE_TYPE, dataPin, clkPin, csPin, MAX_DEVICES) {}

  void begin() {
    display.begin();
    display.setIntensity(8);
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

LedMatrix ledDisplay(dataPin, clkPin, csPin);

void setup() {
  Serial.begin(9600);
  ledDisplay.begin(); // Start LED

  // Begin BLE connection
  BLEDevice::init("CarDisplay");
  BLEServer *pServer = BLEDevice::createServer();
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
  pAdvertising->start();
}

void loop() {
  // Just disconnected
  if (!deviceConnected && oldDeviceConnected) {
    delay(200); // Change to non delay method
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