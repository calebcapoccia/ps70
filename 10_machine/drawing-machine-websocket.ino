// SPDX-License-Identifier: LGPL-3.0-or-later
// Copyright 2016-2025 Hristo Gochkov, Mathieu Carbou, Emil Muratov

//
// WebSocket example using the easy to use AsyncWebSocketMessageHandler handler that only supports unfragmented messages
//
#include <AsyncTCP.h>
#include <WiFi.h>

#include <ESPAsyncWebServer.h>
#include "html.h"

#include <AccelStepper.h>
#include <ESP32Servo.h>

const int xLimit = D8;
const int yLimit = D7;

const int stepPinX = D1;
const int dirPinX = D5;
const int stepPinY = D3;
const int dirPinY = D2;
float pulleyDiamX = 18.7;
float pulleyDiamY = 12.22;
const int xMicrosteps = 16;
const int yMicrosteps = 16;
const int stepsPerRev = 200;

const float xMmtoSteps = (xMicrosteps*stepsPerRev)/(pulleyDiamX*PI);
const float yMmtoSteps = (yMicrosteps*stepsPerRev)/(pulleyDiamY*PI);

const int servoPin = D4;
const int SERVO_DOWN = 0;
const int SERVO_UP = 90;
volatile bool isHoming = false;

AccelStepper stepperX(AccelStepper::DRIVER, stepPinX, dirPinX);
AccelStepper stepperY(AccelStepper::DRIVER, stepPinY, dirPinY);

static AsyncWebServer server(80);

// create an easy-to-use handler
static AsyncWebSocketMessageHandler wsHandler;

// add it to the websocket server
static AsyncWebSocket ws("/ws", wsHandler.eventHandler());

Servo servo;

volatile int currXPos = 0;
volatile int currYPos = 0;

volatile int servoPos = SERVO_UP;
volatile bool updateServo = true;

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_AP);
  WiFi.softAP("esp-captive");
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
  stepperX.setAcceleration(1000);
  stepperX.setMaxSpeed(2000);
  stepperY.setAcceleration(1000);
  stepperY.setMaxSpeed(2000);

  servo.setPeriodHertz(50);    // standard 50 hz servo
	servo.attach(servoPin, 1000, 2000);
  // stepperX.moveTo(3200);
  // stepperY.moveTo(100);

  // serves root html page
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(200, "text/html", (const uint8_t *)htmlContent, sizeof(htmlContent)/ sizeof(htmlContent[0]));
  });

  wsHandler.onConnect([](AsyncWebSocket *server, AsyncWebSocketClient *client) {
    Serial.printf("Client %" PRIu32 " connected\n", client->id());
    server->textAll("New client: " + String(client->id()));
  });

  wsHandler.onDisconnect([](AsyncWebSocket *server, uint32_t clientId) {
    Serial.printf("Client %" PRIu32 " disconnected\n", clientId);
    server->textAll("Client " + String(clientId) + " disconnected");
  });

  wsHandler.onError([](AsyncWebSocket *server, AsyncWebSocketClient *client, uint16_t errorCode, const char *reason, size_t len) {
    Serial.printf("Client %" PRIu32 " error: %" PRIu16 ": %s\n", client->id(), errorCode, reason);
  });
  //data comes in the format of xPos,yPos
  wsHandler.onMessage([](AsyncWebSocket *server, AsyncWebSocketClient *client, const uint8_t *data, size_t len) {
    Serial.printf("Client %" PRIu32 " data: %s\n", client->id(), (const char *)data);
    bool isFirstNum = true;
    int targetXPos = 0;
    int targetYPos = 0;

    if(len == 1){
      switch((char)data[0]){
        case('u'):
          servoPos = SERVO_UP;
          updateServo = true;
        break;
        case('d'):
          servoPos = SERVO_DOWN;
          updateServo = true;
        break;
        case('h'):
          isHoming = true;
        default:
        break;
      }
      return;
    }

    for(int i = 0; i < len; i++){
      if (data[i] == ','){
        isFirstNum = false;
        continue;
      }
      if(isFirstNum){
        targetXPos = targetXPos * 10 + (data[i] - '0');
      }
      else{
        targetYPos = targetYPos * 10 + (data[i] - '0');
      }
    }
    long targetXPosSteps = targetXPos * xMmtoSteps;
    long targetYPosSteps = targetYPos * yMmtoSteps;

    Serial.printf("targetXPosSteps %ld, targetYPosSteps: %ld\n", targetXPosSteps, targetYPosSteps);

    unsigned long distanceX = abs(targetXPosSteps - stepperX.currentPosition());
    unsigned long distanceY = abs(targetYPosSteps - stepperY.currentPosition());
    float distRatio = distanceX/((float)distanceY);
    stepperX.setAcceleration(distRatio > 1 ? 1000 : 1000*distRatio);
    stepperX.setMaxSpeed(distRatio > 1 ? 1000: 1000*distRatio);
    stepperX.moveTo(targetXPosSteps);
    stepperY.setAcceleration(distRatio > 1 ? 1000/distRatio: 1000);
    stepperY.setMaxSpeed(distRatio > 1 ? 1000/distRatio: 1000);
    stepperY.moveTo(targetYPosSteps);
  });

  wsHandler.onFragment([](AsyncWebSocket *server, AsyncWebSocketClient *client, const AwsFrameInfo *frameInfo, const uint8_t *data, size_t len) {
    Serial.printf("Client %" PRIu32 " fragment %" PRIu32 ": %s\n", client->id(), frameInfo->num, (const char *)data);
  });

  server.addHandler(&ws);
  server.begin();


}

void loop() {
  if(isHoming){
    stepperX.setSpeed(-600);
    stepperY.setSpeed(-600);
    while((digitalRead(xLimit) == 1 || digitalRead(yLimit) == 1)){
      if(digitalRead(xLimit) == 1){
        stepperX.runSpeed();
      }
      if(digitalRead(yLimit) == 1){
        stepperY.runSpeed();
      }
      delay(2); 
    }
    stepperX.setCurrentPosition(0);
    stepperY.setCurrentPosition(0);
    isHoming = false;
  }
  

  if(updateServo){
    Serial.println("updating servo");
    Serial.println(servoPos);
    int endPos = servoPos;
    int startPos = servoPos == SERVO_UP ? SERVO_DOWN: SERVO_UP;
    int increment = servoPos == SERVO_UP ? 1 : -1; 
    for(int i = startPos; i != endPos; i += increment){
      servo.write(i);
      delay(5);
    }
    
    updateServo = false;
  }
  stepperX.run();
  stepperY.run();
  
}
