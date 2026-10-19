/*
 * esp32_cam_robot.ino — Production Firmware for EMOTIA Desk Robot
 * Hardware: AI-Thinker ESP32-CAM + ESP32-CAM-MB Baseboard
 * Actuator: 0.96" I2C SSD1306 OLED Display (128x64) mounted in head visor
 * Camera:   OV2640 2MP Camera (mounted sideways, rotated on PC)
 *
 * Pin Map:
 *   - OLED SDA:   GPIO 13
 *   - OLED SCL:   GPIO 15
 *   - OLED VCC:   3.3V
 *   - OLED GND:   GND
 *   - Flash LED:  GPIO 4 (disabled by default)
 *   - INMP441 WS: GPIO 4 (shared, keep LED OFF)
 *   - INMP441 SCK:GPIO 14
 *   - INMP441 SD: GPIO 2
 *   - Audio PWM:  GPIO 12 -> PAM8403 Amp IN
 *
 * Communication:
 *   1. USB Serial at 115200 baud (wired JSON packets from PC)
 *   2. Wi-Fi MJPEG Stream at http://<ESP32_IP>:81/stream
 *   3. Wi-Fi HTTP REST API at http://<ESP32_IP>/api/eyes
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <WebServer.h>
#include <WiFiClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ArduinoJson.h>

// ==============================================================================
// 1. PIN DEFINITIONS & CAMERA CONFIG (AI-THINKER)
// ==============================================================================
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

#define FLASH_LED_PIN      4

// I2C for 0.96" OLED Visor
#define OLED_SDA_PIN      13
#define OLED_SCL_PIN      15
#define SCREEN_WIDTH     128
#define SCREEN_HEIGHT     64
#define OLED_RESET        -1
#define SCREEN_ADDRESS  0x3C

// Wi-Fi Configuration (Connects to your phone hotspot or router)
const char* ssid     = "OnePlus 13 B19C";
const char* password = "password1234";

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
WebServer server(80);
WebServer streamServer(81);

// ==============================================================================
// 2. ROBOT EYE STATE
// ==============================================================================
struct EyeState {
  char emotion[16] = "calm";
  float gazeX = 0.0;
  float gazeY = 0.0;
  bool isBlinking = false;
  char style[20] = "focused";
  unsigned long lastBlinkTime = 0;
  unsigned long blinkDuration = 120;
} eyes;

const int LEFT_EYE_CX = 38;
const int RIGHT_EYE_CX = 90;
const int EYE_CY = 32;
const int EYE_RADIUS = 18;
const int PUPIL_RADIUS = 7;

// ==============================================================================
// 3. EYE DRAWING ROUTINES
// ==============================================================================
void drawSingleEye(int cx, int cy, float gx, float gy, bool blink, const char* emo) {
  if (blink) {
    display.fillRoundRect(cx - EYE_RADIUS, cy - 2, EYE_RADIUS * 2, 4, 2, SSD1306_WHITE);
    return;
  }

  // Eye Sclera Outline / Fill
  display.fillCircle(cx, cy, EYE_RADIUS, SSD1306_WHITE);

  // Pupil Position with Gaze Tracking
  int px = cx + (int)(gx * (EYE_RADIUS - PUPIL_RADIUS - 3));
  int py = cy + (int)(gy * (EYE_RADIUS - PUPIL_RADIUS - 3));
  display.fillCircle(px, py, PUPIL_RADIUS, SSD1306_BLACK);
  display.fillCircle(px - 2, py - 2, 2, SSD1306_WHITE); // Catchlight

  // Emotional Eyelid Morphing
  if (strcmp(emo, "frustrated") == 0) {
    // Angled inner brow slants
    int browCut = (cx < 64) ? 10 : -10;
    display.fillTriangle(cx - EYE_RADIUS - 2, cy - EYE_RADIUS - 2,
                         cx + EYE_RADIUS + 2, cy - EYE_RADIUS - 2,
                         cx + browCut, cy - 4, SSD1306_BLACK);
  } else if (strcmp(emo, "happy") == 0) {
    // Happy squint: lower eyelid cut curve
    display.fillRoundRect(cx - EYE_RADIUS - 2, cy + 4, (EYE_RADIUS * 2) + 4, EYE_RADIUS, 4, SSD1306_BLACK);
  } else if (strcmp(emo, "stressed") == 0) {
    // Wide open: slight top eyelid pinch
    display.drawCircle(cx, cy, EYE_RADIUS + 1, SSD1306_WHITE);
  } else if (strcmp(emo, "calm") == 0) {
    // Calm upper lid droop
    display.fillRect(cx - EYE_RADIUS - 2, cy - EYE_RADIUS - 2, (EYE_RADIUS * 2) + 4, 8, SSD1306_BLACK);
  }
}

void renderEyes() {
#if defined(ENABLE_CAM_OLED)
  display.clearDisplay();
  drawSingleEye(LEFT_EYE_CX, EYE_CY, eyes.gazeX, eyes.gazeY, eyes.isBlinking, eyes.emotion);
  drawSingleEye(RIGHT_EYE_CX, EYE_CY, eyes.gazeX, eyes.gazeY, eyes.isBlinking, eyes.emotion);
  display.display();
#endif
}

// ==============================================================================
// 4. MJPEG CAMERA STREAM HANDLER
// ==============================================================================
#define PART_BOUNDARY "123456789000000000000987654321"
static const char* _STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* _STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
static const char* _STREAM_PART = "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

void handleMjpegStream() {
  WiFiClient client = streamServer.client();
  client.print("HTTP/1.1 200 OK\r\n");
  client.print("Content-Type: ");
  client.print(_STREAM_CONTENT_TYPE);
  client.print("\r\nAccess-Control-Allow-Origin: *\r\n\r\n");

  while (client.connected()) {
    camera_fb_t* fb = esp_camera_fb_get();
    if (!fb) {
      delay(20);
      continue;
    }

    client.print(_STREAM_BOUNDARY);
    char buf[64];
    snprintf(buf, sizeof(buf), _STREAM_PART, fb->len);
    client.print(buf);
    client.write(fb->buf, fb->len);
    esp_camera_fb_return(fb);
    delay(10); // Low latency ~35-40 FPS
  }
}

// ==============================================================================
// 5. REST & SERIAL EYE COMMAND PARSER
// ==============================================================================
void parseEyeJson(const String& jsonStr) {
  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, jsonStr);
  if (err) return;

  if (doc.containsKey("emo")) {
    strlcpy(eyes.emotion, doc["emo"] | "calm", sizeof(eyes.emotion));
  }
  if (doc.containsKey("gx")) eyes.gazeX = doc["gx"];
  if (doc.containsKey("gy")) eyes.gazeY = doc["gy"];
  if (doc.containsKey("blk")) eyes.isBlinking = (doc["blk"] == 1);
  if (doc.containsKey("stl")) {
    strlcpy(eyes.style, doc["stl"] | "focused", sizeof(eyes.style));
  }
  renderEyes();
}

void handlePostEyes() {
  if (server.hasArg("plain")) {
    parseEyeJson(server.arg("plain"));
    server.send(200, "application/json", "{\"status\":\"ok\"}");
  } else {
    server.send(400, "text/plain", "Missing body");
  }
}

// ==============================================================================
// 6. SETUP
// ==============================================================================
void setup() {
  Serial.begin(115200);
  delay(100);
  pinMode(FLASH_LED_PIN, OUTPUT);
  digitalWrite(FLASH_LED_PIN, LOW); // Keep flash LED off to free shared IO4

  // 1. Initialize Camera FIRST before any I2C peripherals
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  if (psramFound()) {
    config.frame_size = FRAMESIZE_HVGA;  // 480x320 (Smooth, low-latency)
    config.jpeg_quality = 12;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_HVGA;  // 480x320
    config.jpeg_quality = 14;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("[ESP32-CAM] Camera init failed with error 0x%x\n", err);
  } else {
    Serial.println("[ESP32-CAM] Camera initialized successfully [OK]");
    sensor_t *s = esp_camera_sensor_get();
    if (s != NULL) {
      s->set_framesize(s, FRAMESIZE_HVGA); // Ensure 480x320 HVGA resolution
      s->set_contrast(s, -1);              // Decrease contrast slightly (-2 to 2)
    }
  }

  // 2. Optional: Initialize I2C for OLED visor only if display is attached
  // (Skip if OLED is hosted on the Regular ESP32 master)
  #if defined(ENABLE_CAM_OLED)
  Wire.begin(OLED_SDA_PIN, OLED_SCL_PIN);
  if (display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    display.clearDisplay();
    display.display();
    renderEyes();
  }
  #endif

  // 3. Connect to Wi-Fi Hotspot (Station Mode)
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  WiFi.setSleep(false); // Disable Wi-Fi sleep for max frame rate

  Serial.printf("\n[ESP32-CAM] Connecting to Wi-Fi '%s' ", ssid);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[ESP32-CAM] Wi-Fi Connected successfully! [OK]");
    Serial.print("[ESP32-CAM] IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.printf("[ESP32-CAM] MJPEG Stream URL: http://%s:81/stream\n", WiFi.localIP().toString().c_str());
  } else {
    // Fallback: Start self-hosted Access Point if phone hotspot is unavailable
    Serial.println("\n[ESP32-CAM] Hotspot not found. Starting Access Point fallback: 'EMOTIA_ROBOT'...");
    WiFi.mode(WIFI_AP);
    WiFi.softAP("EMOTIA_ROBOT", "emotia2026");
    IPAddress IP = WiFi.softAPIP();
    Serial.printf("[ESP32-CAM] Hotspot IP: %s\n", IP.toString().c_str());
    Serial.printf("[ESP32-CAM] MJPEG Stream URL: http://%s:81/stream\n", IP.toString().c_str());
  }

  // Set up HTTP Endpoints
  server.on("/api/eyes", HTTP_POST, handlePostEyes);
  server.begin();

  streamServer.on("/stream", HTTP_GET, handleMjpegStream);
  streamServer.begin();

  Serial.println("[ESP32-CAM] Robot visor & camera stream online [OK]");
}

// ==============================================================================
// 7. MAIN LOOP
// ==============================================================================
void loop() {
  server.handleClient();
  streamServer.handleClient();

  // Read incoming Serial JSON commands from PC over USB
  if (Serial.available()) {
    String line = Serial.readStringUntil('\n');
    line.trim();
    if (line.length() > 5 && line.startsWith("{")) {
      parseEyeJson(line);
    }
  }

  // Autonomous Natural Blinking when idle
  unsigned long now = millis();
  if (!eyes.isBlinking && (now - eyes.lastBlinkTime > 3500 + random(0, 3000))) {
    eyes.isBlinking = true;
    eyes.lastBlinkTime = now;
    renderEyes();
  } else if (eyes.isBlinking && (now - eyes.lastBlinkTime > eyes.blinkDuration)) {
    eyes.isBlinking = false;
    eyes.lastBlinkTime = now;
    renderEyes();
  }
}
