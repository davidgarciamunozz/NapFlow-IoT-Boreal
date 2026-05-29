// ─── CONFIG — edit these before flashing ─────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* API_URL       = "https://YOUR_APP.vercel.app/api/sensors";
const char* SENSOR_KEY    = "boreal-sensor-2026-k9xPqR3mNv";
const int   SLOT_NUMBER   = 1;
// ─────────────────────────────────────────────────────────

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>

const int REED_PIN = 2;  // GPIO2 — only safe GPIO on ESP-01 for INPUT_PULLUP

bool lastState = HIGH;

void setup() {
  Serial.begin(9600);
  pinMode(REED_PIN, INPUT_PULLUP);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected: " + WiFi.localIP().toString());
}

void sendStatus(const char* status) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure(); // prototype — skip cert verification
  HTTPClient http;

  http.begin(client, API_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-sensor-key", SENSOR_KEY);

  String body = "{\"slot\":" + String(SLOT_NUMBER) + ",\"status\":\"" + status + "\"}";
  int code = http.POST(body);
  Serial.println("POST " + String(code) + " -> " + status);
  http.end();
}

void loop() {
  bool state = digitalRead(REED_PIN);

  if (state != lastState) {
    delay(50); // debounce
    state = digitalRead(REED_PIN);
    if (state != lastState) {
      if (state == LOW) {
        Serial.println("Colchoneta 1 GUARDADA");
        sendStatus("available");   // magnet present = pillow returned
      } else {
        Serial.println("Colchoneta 1 EN USO");
        sendStatus("occupied");    // magnet removed = pillow taken
      }
      lastState = state;
    }
  }

  delay(100);
}
