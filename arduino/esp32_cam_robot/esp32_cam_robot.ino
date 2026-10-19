/*
 * esp32_cam_robot.ino — Production Firmware for EMOTIA Desk Robot Camera
 * Hardware: AI-Thinker ESP32-CAM + ESP32-CAM-MB Baseboard
 * Camera:   OV2640 2MP Camera
 * Output:   High-speed MJPEG Stream over Wi-Fi on Port 81
 *
 * Dependencies: ONLY standard ESP32 core libraries (NO external libraries needed!)
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <WebServer.h>
#include <WiFiClient.h>

// ==============================================================================
// 1. PIN DEFINITIONS (AI-THINKER HARDWARE DEFAULTS)
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

// ==============================================================================
// 2. WI-FI CONFIGURATION
// ==============================================================================
const char* ssid     = "OnePlus 13 B19C";
const char* password = "password1234";

WebServer streamServer(81);

// ==============================================================================
// 3. MJPEG CAMERA STREAM HANDLER
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
      delay(10);
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
// 4. SETUP
// ==============================================================================
void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(FLASH_LED_PIN, OUTPUT);
  digitalWrite(FLASH_LED_PIN, LOW); // Flash LED OFF

  // 1. Initialize Camera FIRST
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
    Serial.printf("[ESP32-CAM] Camera probe failed with error 0x%x\n", err);
    return;
  }
  Serial.println("[ESP32-CAM] Camera probe & init SUCCESS [OK]");

  // Adjust sensor settings: set to HVGA and decrease contrast slightly
  sensor_t *s = esp_camera_sensor_get();
  if (s != NULL) {
    s->set_framesize(s, FRAMESIZE_HVGA);
    s->set_contrast(s, -1); // Decrease contrast slightly (-2 to 2)
  }

  // 2. Connect to your OnePlus 13 Hotspot
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  WiFi.setSleep(false); // Disable power saving for max frame rate

  Serial.printf("\n[ESP32-CAM] Connecting to '%s' ", ssid);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[ESP32-CAM] Wi-Fi Connected!");
    Serial.print("[ESP32-CAM] IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.printf("[ESP32-CAM] MJPEG Stream URL: http://%s:81/stream\n", WiFi.localIP().toString().c_str());
  } else {
    // Auto-fallback: Creates standalone AP if phone hotspot is off
    Serial.println("\n[ESP32-CAM] Hotspot not found. Starting Fallback AP 'EMOTIA_ROBOT'...");
    WiFi.mode(WIFI_AP);
    WiFi.softAP("EMOTIA_ROBOT", "emotia2026");
    IPAddress IP = WiFi.softAPIP();
    Serial.printf("[ESP32-CAM] Hotspot IP: %s\n", IP.toString().c_str());
    Serial.printf("[ESP32-CAM] MJPEG Stream URL: http://%s:81/stream\n", IP.toString().c_str());
  }

  // 3. Start Streaming Server on Port 81
  streamServer.on("/stream", HTTP_GET, handleMjpegStream);
  streamServer.begin();

  Serial.println("[ESP32-CAM] Video stream server is live on Port 81 [OK]");
}

// ==============================================================================
// 5. MAIN LOOP
// ==============================================================================
void loop() {
  streamServer.handleClient();
  delay(1);
}
