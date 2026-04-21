#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <AsyncTCP.h>

// WiFi credentials
const char* ssid = "MAKERSPACE";
const char* password = "12345678";

// Web server on port 80
AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

void onWebSocketEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len) {
  if (type == WS_EVT_CONNECT) {
    Serial.printf("WebSocket client #%u connected from %s\n", client->id(), client->remoteIP().toString().c_str());
    client->text("Hello from ESP32!");
  } 
  else if (type == WS_EVT_DISCONNECT) {
    Serial.printf("WebSocket client #%u disconnected\n", client->id());
  } 
  else if (type == WS_EVT_DATA) {
    Serial.printf("WebSocket client #%u sent data: ", client->id());
    for (size_t i = 0; i < len; i++) {
      Serial.print((char)data[i]);
    }
    Serial.println();
    
    // Echo back the received message
    client->text("ESP32 received: " + String((char*)data));
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=== ESP32 WebSocket Test ===");
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  // Wait for connection
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
    Serial.println("Update your HTML page with this IP address!");
    Serial.println("=============================\n");
  } else {
    Serial.println("✗ WiFi connection failed!");
    Serial.println("Check SSID and password");
    return;
  }
  
  // Setup WebSocket
  ws.onEvent(onWebSocketEvent);
  server.addHandler(&ws);
  
  // Simple root page
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(200, "text/plain", "ESP32 WebSocket Test Server\nConnect to ws://" + WiFi.localIP().toString() + "/ws");
  });
  
  server.begin();
  Serial.println("Web server started!");
  Serial.println("Waiting for WebSocket connections...\n");
}

void loop() {
  ws.cleanupClients();
  delay(10);
}
