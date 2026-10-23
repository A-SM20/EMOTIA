/*
 * robot_eyes.ino — Complete Wireless & Interactive Affective Desk Robot Visor
 * Hardware: Regular ESP32 + 0.96" I2C OLED (SSD1306 128x64) + PAM8403 Audio + Sound Sensor
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * PIN CONNECTIONS FOR REGULAR ESP32 (DevKit 30/38 Pin):
 * ══════════════════════════════════════════════════════════════════════════════
 *   ── 1. 0.96" I2C OLED Display (SSD1306 128x64) ──
 *      OLED GND     -> ESP32 GND
 *      OLED VCC     -> ESP32 3V3 (or VIN 5V)
 *      OLED SCL     -> ESP32 GPIO 22 (D22)
 *      OLED SDA     -> ESP32 GPIO 21 (D21)
 *
 *   ── 2. PAM8403 Audio Amplifier + Speaker ──
 *      PAM8403 GND  -> ESP32 GND
 *      PAM8403 +5V  -> ESP32 VIN (5V)
 *      PAM8403 L_IN -> ESP32 GPIO 25 (Audio DAC1 / PWM Tone)
 *      PAM8403 R_IN -> (Bridge with L_IN or leave open for mono)
 *      PAM8403 L+/L--> 4Ω or 8Ω Mini Speaker (+ and -)
 *
 *   ── 3. 3-Pin Sound Sensor Module (VCC, GND, OUT) ──
 *      Sensor GND   -> ESP32 GND
 *      Sensor VCC   -> ESP32 3V3 (or VIN 5V)
 *      Sensor OUT   -> ESP32 GPIO 34 (D34 - Universal input for both Digital & Analog 3-pin sensors)
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Transports Supported Concurrently:
 *   1. Wi-Fi Real-time UDP (Port 8888) — Zero-latency face gaze tracking stream
 *   2. Wi-Fi HTTP Web Dashboard & REST API (Port 80) — Control from browser at http://<ESP32_IP>/
 *   3. USB Serial (115200 baud) — Serial Monitor interactive command testing
 *
 * Supported Emotion Personas (Pure Graphic Eyes, Centered at Y=32, No text):
 *   1.  NEUTRAL    - Companion breathing bob, natural specular pupils, organic micro-saccades
 *   2.  HAPPY      - Joyful smiling crescent arches (^ ^), bouncing giggle, rosy blush + Happy chime
 *   3.  LOVE       - Pulsing animated heart eyes (<3 <3), heartbeat rhythm, sparkles + Love chime
 *   4.  FRUSTRATED - Angled tension brows, constricted pupils, tremor vibration, angry vein + Grumble
 *   5.  STRESSED   - Wide dilated eyes, rapid jitter, worried raised brows, sliding sweat + Double-beep
 *   6.  CALM       - Soft hooded eyelids (35% droop), horizontal crease, slow ocean breathing + Zen tone
 *   7.  FATIGUED   - Heavy 65% drooping eyelids, sluggish gaze, floating "z" particle + Yawn slide
 *   8.  SLEEPING   - Completely closed peaceful curved slits (- -), rising Z z Z snore wave + Soft hum
 *   9.  SAD        - Downward drooping sad eyes (T T), quivering eyelids, dripping teardrops + Sad chime
 *   10. SURPRISED  - Wide open circular eyes (O O), tiny pinpoint pupils, high arched brows + Up-sweep
 *   11. THINKING   - Inquisitive upward gaze, smooth horizontal search sweep, scanning dots + Inquisitive blip
 *   12. DIZZY      - Spinning cartoon spirals (@ @) rotating continuously, orbiting stars + Wobbly slide
 *   13. SCANNER    - Cyberpunk visor slots with bouncing laser radar beam + Laser sound
 *   14. WINK       - Playful single-eye wink with 4-point sparkle star catchlight + Star ping
 *   15. DEMO MODE  - Autonomous showcase cycling through all emotions every 4.5s
 */

#include <WiFi.h>
#include <WiFiUdp.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C  // Default I2C address (alternates to 0x3D automatically)

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ── Hardware Pin Map ─────────────────────────────────────────────────────────
const int AUDIO_PIN = 25; // PAM8403 Audio Input (DAC1 / PWM)
const int SOUND_PIN = 34; // 3-Pin Sound Sensor OUT (ADC1_CH6 - safe with Wi-Fi)

// ── Wi-Fi Credentials ────────────────────────────────────────────────────────
const char *ssid     = "OnePlus 13 B19C";
const char *password = "password1234";

const char *ap_ssid  = "EMOTIA_EYES";
const char *ap_pass  = "12345678";

// ── Network Services ─────────────────────────────────────────────────────────
WiFiUDP udp;
const int UDP_PORT   = 8888;
char udpPacketBuffer[256];

WebServer server(80);

// ── Eye Geometry & Layout Constants ──────────────────────────────────────────
const int LEFT_EYE_X   = 36;
const int RIGHT_EYE_X  = 92;
const int EYE_BASE_Y   = 32; // Centered vertically on 64px display
const int EYE_WIDTH    = 28;
const int EYE_HEIGHT   = 34;
const int CORNER_RAD   = 9;
const int PUPIL_RAD    = 7;

// ── Dynamic Animation State ──────────────────────────────────────────────────
String currentEmotion  = "neutral";
float targetGazeX      = 0.0; // -1.0 (left) to +1.0 (right)
float targetGazeY      = 0.0; // -1.0 (up) to +1.0 (down)
float currentGazeX     = 0.0;
float currentGazeY     = 0.0;

// Blinking State Machine (smooth parametric eyelid interpolation)
bool isBlinking        = false;
unsigned long blinkStart = 0;
int blinkDuration      = 135; // ms
float blinkFraction    = 0.0; // 0.0 = open, 1.0 = fully closed

// Idle, Demo & Timer States
unsigned long lastSerialTime   = 0;
unsigned long lastIdleBlink    = 0;
unsigned long lastIdleAction   = 0;
unsigned long lastDemoSwitch   = 0;
bool isDemoMode        = true; // Starts in Showcase Demo mode until live packets arrive!
int demoIndex          = 0;
float idleWanderX      = 0.0;
float idleWanderY      = 0.0;

// Time accumulator for continuous micro-physics
float animTime         = 0.0;

// Special Action Trigger (0: normal, 1: wink left, 2: wink right, 3: happy bob)
int specialAction      = 0;
unsigned long actionStart = 0;

// Non-blocking serial accumulator buffer
char serialBuf[128];
int serialPos = 0;

// ── Audio & PAM8403 Sound Engine ─────────────────────────────────────────────
struct SoundNote {
  int freq;      // Frequency in Hz (0 = silent pause)
  int duration;  // Duration in ms
};

const int MAX_TUNE_NOTES = 8;
SoundNote currentTune[MAX_TUNE_NOTES];
int tuneLength         = 0;
int tuneIndex          = 0;
unsigned long noteStartTime = 0;
bool isPlayingTune     = false;
bool soundEnabled      = true; // Can be toggled via Web or Serial ('mute' / 'unmute')

// ── Sound Sensor State ───────────────────────────────────────────────────────
int soundLevel         = 0;    // Peak-to-peak amplitude (0 - 4095)
int soundThreshold     = 450;  // Threshold to detect clapping/speech
unsigned long lastSoundCheck = 0;
unsigned long lastSoundEvent = 0;

// Available emotions for Autonomous Showcase Carousel
const char* DEMO_EMOTIONS[] = {
  "neutral", "happy", "love", "frustrated", "stressed", "calm",
  "fatigued", "sleep", "sad", "dizzy", "surprised", "thinking", "scan"
};
const int DEMO_COUNT = 13;

// Forward declarations
void drawNeutralEyes(float breathBob);
void drawHappyEyes(float breathBob);
void drawLoveEyes(float breathBob);
void drawFrustratedEyes(float breathBob);
void drawStressedEyes(float breathBob);
void drawCalmEyes(float breathBob);
void drawFatiguedEyes(float breathBob);
void drawSleepingEyes(float breathBob);
void drawSadEyes(float breathBob);
void drawDizzyEyes(float breathBob);
void drawThinkingEyes(float breathBob);
void drawSurprisedEyes(float breathBob);
void drawScanningEyes(float breathBob);
void drawEyeCapsule(int cx, int cy, float gx, float gy, int w, int h, int pupilR, bool closed, float blinkFactor);
void drawSparkle(int cx, int cy, int size);
void drawHeart(int cx, int cy, float scale);
void triggerBlink(int duration);
void triggerSpecial(int action, int duration);
void updateBlinkState();
void runAutonomousIdle();
void readSerialCommands();
void readUdpCommands();
void processCommandLine(String line);
void setEmotion(String newEmo);
void setupWiFi();
void setupHttpServer();
void handleRoot();
void handleApiEyes();
void handleApiSound();
void handleStatus();
void playNoteSequence(const SoundNote* notes, int count);
void updateAudioPlayer();
void playEmotionSound(String emo);
void updateSoundSensor();
void onSoundDetected();

// ==============================================================================
// 1. SETUP
// ==============================================================================
void setup() {
  Serial.begin(115200);
  delay(100);

  // Initialize Audio & Sound Sensor Pins
  pinMode(AUDIO_PIN, OUTPUT);
  pinMode(SOUND_PIN, INPUT);

#if defined(ESP32)
  Wire.begin(21, 22); // Explicitly map I2C pins: SDA=21, SCL=22
#else
  Wire.begin();
#endif

  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3D)) {
      Serial.println(F("[OLED] Error: SSD1306 allocation failed. Check D21=SDA, D22=SCL wiring!"));
    }
  }

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  // Futuristic boot splash
  display.setTextSize(1);
  display.setCursor(20, 16);
  display.println(F("EMOTIA ROBOT"));
  display.drawFastHLine(16, 28, 96, SSD1306_WHITE);
  display.setCursor(18, 34);
  display.println(F("WIRELESS EYES"));
  display.setCursor(14, 48);
  display.println(F("AUDIO & SOUND ON"));
  display.display();

  // Play startup confirmation chime on PAM8403 (verifies speaker wiring instantly)
  tone(AUDIO_PIN, 1046, 70);
  delay(80);
  tone(AUDIO_PIN, 1568, 110);
  delay(120);
  noTone(AUDIO_PIN);

  delay(600);

  // Initialize Wi-Fi connection
  setupWiFi();

  Serial.println(F("=========================================================="));
  Serial.println(F(" [EMOTIA] Robot Eyes + PAM8403 Audio + Sound Sensor Ready "));
  Serial.println(F(" Transports: Wi-Fi UDP (8888), HTTP (80), USB Serial      "));
  Serial.println(F(" Audio: GPIO 25 (PAM8403) | Mic: GPIO 34 (AO), GPIO 35(DO)"));
  Serial.println(F("=========================================================="));
}

// ==============================================================================
// 2. WI-FI & WEB SERVER INITIALIZATION
// ==============================================================================
void setupWiFi() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(12, 16);
  display.println(F("CONNECTING WIFI..."));
  display.setCursor(12, 32);
  display.println(ssid);
  display.display();

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  unsigned long startAttempt = millis();
  int dotCount = 0;
  while (WiFi.status() != WL_CONNECTED && (millis() - startAttempt < 9000)) {
    delay(400);
    dotCount++;
    display.fillRect(12, 46, 104, 12, SSD1306_BLACK);
    display.setCursor(12, 46);
    for (int i = 0; i < (dotCount % 10); i++) display.print(F("."));
    display.display();
  }

  display.clearDisplay();
  if (WiFi.status() == WL_CONNECTED) {
    String ipStr = WiFi.localIP().toString();
    Serial.println(F("[WIFI] Connected successfully!"));
    Serial.print(F("[WIFI] IP Address: "));
    Serial.println(ipStr);

    display.setCursor(18, 14);
    display.println(F("WIFI CONNECTED"));
    display.drawFastHLine(14, 26, 100, SSD1306_WHITE);
    display.setCursor(12, 34);
    display.println(F("IP ADDRESS:"));
    display.setCursor(12, 48);
    display.println(ipStr);
    display.display();
    delay(2000);

    MDNS.begin("emotia-eyes");
  } else {
    Serial.println(F("[WIFI] Hotspot not found. Starting Access Point: EMOTIA_EYES"));
    WiFi.mode(WIFI_AP);
    WiFi.softAP(ap_ssid, ap_pass);
    String apIpStr = WiFi.softAPIP().toString();

    display.setCursor(16, 14);
    display.println(F("AP MODE ACTIVE"));
    display.drawFastHLine(14, 26, 100, SSD1306_WHITE);
    display.setCursor(12, 34);
    display.println(F("SSID: EMOTIA_EYES"));
    display.setCursor(12, 48);
    display.println(apIpStr);
    display.display();
    delay(2000);
  }

  // Start UDP listener for zero-latency real-time face gaze packets
  udp.begin(UDP_PORT);
  Serial.print(F("[UDP] Listening on port: "));
  Serial.println(UDP_PORT);

  // Setup Web Server routes
  setupHttpServer();
}

void setupHttpServer() {
  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/eyes", HTTP_ANY, handleApiEyes);
  server.on("/api/sound", HTTP_ANY, handleApiSound);
  server.on("/api/status", HTTP_GET, handleStatus);
  server.begin();
  Serial.println(F("[HTTP] Web Server started on port 80"));
}

void handleRoot() {
  String html = "<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'>"
    "<title>EMOTIA Robot Eyes & Sound</title><style>"
    "body{background:#0e0e11;color:#eee;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:16px;margin:0}"
    "h2{color:#00f2fe;margin-bottom:4px;font-size:20px;letter-spacing:1px}"
    ".sub{color:#888;font-size:12px;margin-bottom:16px}"
    ".grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;max-width:480px;margin:0 auto}"
    "button{background:#18181f;color:#fff;border:1px solid #333;padding:12px 6px;border-radius:10px;font-size:12px;cursor:pointer;font-weight:600;transition:all 0.15s}"
    "button:active{transform:scale(0.96);background:#00f2fe;color:#000}"
    ".ctrl{margin-top:16px;display:flex;justify-content:center;gap:10px}"
    ".ip{margin-top:16px;font-size:11px;color:#666;font-family:monospace}"
    "</style></head><body>"
    "<h2>EMOTIA ROBOT</h2><p class='sub'>Wireless Visor, PAM8403 Sound & Mic</p>"
    "<div class='grid'>"
    "<button onclick='set(\"neutral\")'>Neutral</button>"
    "<button onclick='set(\"happy\")' style='color:#fbbf24;border-color:#fbbf2455'>Happy ^ ^</button>"
    "<button onclick='set(\"love\")' style='color:#f472b6;border-color:#f472b655'>Love &hearts;</button>"
    "<button onclick='set(\"frustrated\")' style='color:#f87171;border-color:#f8717155'>Angry &gt;&lt;</button>"
    "<button onclick='set(\"stressed\")' style='color:#c084fc;border-color:#c084fc55'>Stressed</button>"
    "<button onclick='set(\"calm\")' style='color:#34d399;border-color:#34d39955'>Calm Zen</button>"
    "<button onclick='set(\"fatigued\")' style='color:#fb923c;border-color:#fb923c55'>Fatigued</button>"
    "<button onclick='set(\"sleep\")' style='color:#60a5fa;border-color:#60a5fa55'>Sleep Zzz</button>"
    "<button onclick='set(\"sad\")' style='color:#818cf8;border-color:#818cf855'>Sad T_T</button>"
    "<button onclick='set(\"dizzy\")' style='color:#facc15;border-color:#facc1555'>Dizzy @ @</button>"
    "<button onclick='set(\"surprised\")' style='color:#2dd4bf;border-color:#2dd4bf55'>Surprised !</button>"
    "<button onclick='set(\"thinking\")' style='color:#38bdf8;border-color:#38bdf855'>Thinking ...</button>"
    "<button onclick='set(\"scan\")' style='color:#ef4444;border-color:#ef444455'>Visor Scan</button>"
    "<button onclick='set(\"wink\")' style='color:#fde047;border-color:#fde04755'>Wink &#10022;</button>"
    "<button onclick='set(\"demo\")' style='color:#a3e635;border-color:#a3e63555'>Demo Cycle</button>"
    "</div>"
    "<div class='ctrl'>"
    "<button onclick='fetch(\"/api/sound?state=toggle\").then(r=>r.json()).then(d=>alert(\"Speaker: \"+(d.sound_enabled?\"ON\":\"MUTED\")))' style='color:#a78bfa;border-color:#a78bfa55;padding:8px 14px'>Audio Mute/Unmute</button>"
    "<button onclick='fetch(\"/api/sound?beep=1\")' style='color:#38bdf8;border-color:#38bdf855;padding:8px 14px'>Test Speaker Chime</button>"
    "</div>"
    "<p class='ip'>IP: " + WiFi.localIP().toString() + " | Sound Sensor: GPIO 34</p>"
    "<script>function set(e){fetch('/api/eyes?emo='+e)}</script>"
    "</body></html>";
  server.send(200, "text/html", html);
}

void handleApiEyes() {
  if (server.hasArg("emo")) {
    setEmotion(server.arg("emo"));
  }
  if (server.hasArg("gx")) {
    targetGazeX = constrain(server.arg("gx").toFloat(), -1.0f, 1.0f);
  }
  if (server.hasArg("gy")) {
    targetGazeY = constrain(server.arg("gy").toFloat(), -1.0f, 1.0f);
  }
  if (server.hasArg("blk")) {
    if (server.arg("blk") == "1" && !isBlinking) triggerBlink(130);
  }
  if (server.hasArg("act")) {
    String act = server.arg("act");
    if (act == "wink" || act == "wink_left") triggerSpecial(1, 450);
    if (act == "wink_right") triggerSpecial(2, 450);
  }

  if (server.hasArg("plain")) {
    processCommandLine(server.arg("plain"));
  }

  lastSerialTime = millis();
  isDemoMode = false;

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", "{\"status\":\"ok\",\"emotion\":\"" + currentEmotion + "\"}");
}

void handleApiSound() {
  if (server.hasArg("state")) {
    String st = server.arg("state");
    if (st == "toggle") soundEnabled = !soundEnabled;
    else if (st == "on" || st == "1") soundEnabled = true;
    else if (st == "off" || st == "0") soundEnabled = false;
  }
  if (server.hasArg("beep")) {
    playEmotionSound("happy");
  }
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String json = "{\"status\":\"ok\",\"sound_enabled\":" + String(soundEnabled ? "true" : "false") + ",\"sound_level\":" + String(soundLevel) + "}";
  server.send(200, "application/json", json);
}

void handleStatus() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String json = "{\"status\":\"online\",\"emotion\":\"" + currentEmotion + "\",\"ip\":\"" + WiFi.localIP().toString() + "\",\"sound_level\":" + String(soundLevel) + ",\"sound_enabled\":" + String(soundEnabled ? "true" : "false") + "}";
  server.send(200, "application/json", json);
}

// ==============================================================================
// 3. MAIN LOOP
// ==============================================================================
void loop() {
  animTime += 0.05f;

  // Process inputs from all transports
  readSerialCommands();
  readUdpCommands();
  server.handleClient();

  // Non-blocking audio sequence player (PAM8403 speaker)
  updateAudioPlayer();

  // Read sound sensor & react to claps/speech
  updateSoundSensor();

  // If no commands received recently, run autonomous idle and showcase
  if (millis() - lastSerialTime > 4000) {
    runAutonomousIdle();
  }

  // Smooth exponential interpolation towards target gaze
  float lerpSpeed = (currentEmotion == "stressed" || currentEmotion == "frustrated") ? 0.45f : 0.22f;
  currentGazeX += (targetGazeX - currentGazeX) * lerpSpeed;
  currentGazeY += (targetGazeY - currentGazeY) * lerpSpeed;

  // Update smooth blink fraction
  updateBlinkState();

  // Render the expressive frame (Pure eyes, centered at Y=32, no text below)
  renderExpressiveEyes();

  delay(20); // ~50 FPS smooth rendering
}

// ==============================================================================
// 4. PAM8403 AUDIO ENGINE (NON-BLOCKING CHIMES & CHIRPS)
// ==============================================================================
void playNoteSequence(const SoundNote* notes, int count) {
  if (!soundEnabled) return;
  count = min(count, MAX_TUNE_NOTES);
  for (int i = 0; i < count; i++) {
    currentTune[i] = notes[i];
  }
  tuneLength = count;
  tuneIndex = 0;
  isPlayingTune = true;
  noteStartTime = millis();
  if (currentTune[0].freq > 0) {
    tone(AUDIO_PIN, currentTune[0].freq, currentTune[0].duration);
  } else {
    noTone(AUDIO_PIN);
  }
}

void updateAudioPlayer() {
  if (!isPlayingTune) return;
  unsigned long now = millis();
  if (now - noteStartTime >= (unsigned long)currentTune[tuneIndex].duration) {
    tuneIndex++;
    if (tuneIndex >= tuneLength) {
      isPlayingTune = false;
      noTone(AUDIO_PIN);
    } else {
      noteStartTime = now;
      if (currentTune[tuneIndex].freq > 0) {
        tone(AUDIO_PIN, currentTune[tuneIndex].freq, currentTune[tuneIndex].duration);
      } else {
        noTone(AUDIO_PIN);
      }
    }
  }
}

void playEmotionSound(String emo) {
  if (!soundEnabled) return;

  if (emo == "happy") {
    // Joyful ascending arpeggio (C5 -> E5 -> G5 -> C6)
    const SoundNote notes[] = {{523, 70}, {659, 70}, {784, 90}, {1046, 130}};
    playNoteSequence(notes, 4);
  } else if (emo == "love") {
    // Warm sweet chime (A5 -> C6 -> E6)
    const SoundNote notes[] = {{880, 110}, {1046, 120}, {1318, 180}};
    playNoteSequence(notes, 3);
  } else if (emo == "frustrated") {
    // Low grumble buzz
    const SoundNote notes[] = {{160, 90}, {130, 110}, {100, 160}};
    playNoteSequence(notes, 3);
  } else if (emo == "stressed") {
    // Rapid panic alert double-beep
    const SoundNote notes[] = {{1400, 50}, {0, 30}, {1400, 50}};
    playNoteSequence(notes, 3);
  } else if (emo == "calm") {
    // Relaxing soft tone (G4 -> C5)
    const SoundNote notes[] = {{392, 180}, {523, 240}};
    playNoteSequence(notes, 2);
  } else if (emo == "fatigued") {
    // Sluggish downward yawn
    const SoundNote notes[] = {{440, 90}, {370, 90}, {300, 120}};
    playNoteSequence(notes, 3);
  } else if (emo == "sleep") {
    // Gentle tranquil hum
    const SoundNote notes[] = {{330, 140}, {262, 220}};
    playNoteSequence(notes, 2);
  } else if (emo == "sad") {
    // Melancholy descending chime
    const SoundNote notes[] = {{784, 110}, {659, 110}, {523, 220}};
    playNoteSequence(notes, 3);
  } else if (emo == "dizzy") {
    // Cartoon wobbly slide
    const SoundNote notes[] = {{400, 60}, {600, 60}, {350, 60}, {550, 80}};
    playNoteSequence(notes, 4);
  } else if (emo == "surprised") {
    // High-pitch startle upward sweep
    const SoundNote notes[] = {{600, 40}, {1200, 50}, {2400, 110}};
    playNoteSequence(notes, 3);
  } else if (emo == "thinking") {
    // Inquisitive computer blip
    const SoundNote notes[] = {{880, 40}, {0, 20}, {1175, 60}};
    playNoteSequence(notes, 3);
  } else if (emo == "scan") {
    // High-tech sci-fi scanner chirp
    const SoundNote notes[] = {{1800, 30}, {1200, 30}, {600, 40}};
    playNoteSequence(notes, 3);
  }
}

// ==============================================================================
// 5. SOUND SENSOR SAMPLING & ACOUSTIC REACTIVITY (3-PIN MODULE: VCC, GND, OUT)
// ==============================================================================
void updateSoundSensor() {
  unsigned long now = millis();
  if (now - lastSoundCheck < 35) return; // Sample sound every 35ms
  lastSoundCheck = now;

  // Measure peak-to-peak amplitude & pulse transitions over 15ms window
  int signalMax = 0;
  int signalMin = 4095;
  unsigned long startSample = millis();
  while (millis() - startSample < 15) {
    int sample = analogRead(SOUND_PIN);
    if (sample > signalMax) signalMax = sample;
    if (sample < signalMin) signalMin = sample;
  }
  soundLevel = signalMax - signalMin;

  // Dual-mode detection for 3-pin sound sensors connected to GPIO 34:
  // 1. Digital Sensor (LM393 with pot screw): OUT swings full rail on sound (idle HIGH -> pulse LOW, or vice versa)
  bool digitalTriggered = (signalMin < 350 && signalMax > 3400);

  // 2. Analog Sensor (electret mic with DC bias): OUT fluctuates around midpoint ~1.65V (1800-2200)
  bool analogTriggered = (signalMin > 180 && signalMax < 3950 && soundLevel > soundThreshold);

  // Trigger acoustic event if loud voice, clap, or desk tap detected
  // (Both modes automatically reject disconnected floating pins where signalMax < 200 or signalMin == 0)
  if ((digitalTriggered || analogTriggered) && (now - lastSoundEvent > 1500)) {
    lastSoundEvent = now;
    onSoundDetected();
  }
}

void onSoundDetected() {
  Serial.print(F("[SOUND SENSOR] Loud Sound Detected! Peak Amplitude: "));
  Serial.println(soundLevel);

  // 1. If robot was sleeping or drowsy -> Startled wake up!
  if (currentEmotion == "sleep" || currentEmotion == "fatigued" || currentEmotion == "drowsy") {
    setEmotion("surprised");
    playEmotionSound("surprised");
  } else {
    // 2. Look up curiously towards the sound + friendly acknowledgment chirp
    targetGazeY = -0.55f;
    targetGazeX = (random(0, 2) == 0 ? -0.4f : 0.4f);
    triggerBlink(95);

    const SoundNote chirp[] = {{784, 50}, {0, 20}, {1046, 80}};
    playNoteSequence(chirp, 3);
  }
}

// ==============================================================================
// 6. FAST COMMAND PARSERS (SERIAL & UDP)
// ==============================================================================
void readSerialCommands() {
  while (Serial.available() > 0) {
    char c = (char)Serial.read();
    if (c == '\n' || c == '\r') {
      if (serialPos > 0) {
        serialBuf[serialPos] = '\0';
        processCommandLine(String(serialBuf));
        serialPos = 0;
      }
    } else {
      if (serialPos < 126) {
        serialBuf[serialPos++] = c;
      }
    }
  }
}

void readUdpCommands() {
  int packetSize = udp.parsePacket();
  if (packetSize > 0) {
    int len = udp.read(udpPacketBuffer, min(packetSize, 255));
    if (len > 0) {
      udpPacketBuffer[len] = '\0';
      processCommandLine(String(udpPacketBuffer));
    }
  }
}

void processCommandLine(String line) {
  line.trim();
  if (line.length() == 0) return;

  lastSerialTime = millis();
  isDemoMode = false; // Live command takes over!

  // 1. JSON Packet: {"cmd":"EYES","emo":"happy","gx":0.1,"gy":-0.2,"blk":0}
  if (line.startsWith("{")) {
    int emoIdx = line.indexOf("\"emo\":\"");
    if (emoIdx != -1) {
      int emoEnd = line.indexOf("\"", emoIdx + 7);
      if (emoEnd != -1) {
        setEmotion(line.substring(emoIdx + 7, emoEnd));
      }
    }

    int gxIdx = line.indexOf("\"gx\":");
    if (gxIdx != -1) {
      targetGazeX = constrain(line.substring(gxIdx + 5).toFloat(), -1.0f, 1.0f);
    }

    int gyIdx = line.indexOf("\"gy\":");
    if (gyIdx != -1) {
      targetGazeY = constrain(line.substring(gyIdx + 5).toFloat(), -1.0f, 1.0f);
    }

    int blkIdx = line.indexOf("\"blk\":");
    if (blkIdx != -1) {
      bool wantBlink = (line.charAt(blkIdx + 6) == '1');
      if (wantBlink && !isBlinking) triggerBlink(130);
    }

    int actIdx = line.indexOf("\"act\":\"");
    if (actIdx != -1) {
      int actEnd = line.indexOf("\"", actIdx + 7);
      if (actEnd != -1) {
        String act = line.substring(actIdx + 7, actEnd);
        if (act == "wink" || act == "wink_left")  triggerSpecial(1, 450);
        if (act == "wink_right") triggerSpecial(2, 450);
        if (act == "nod" || act == "happy_bob") triggerSpecial(3, 800);
      }
    }
    return;
  }

  // 2. Plain Text Commands
  line.toLowerCase();
  if (line == "demo") {
    isDemoMode = !isDemoMode;
    Serial.println(isDemoMode ? F("[EYES] Showcase Demo: ON") : F("[EYES] Showcase Demo: OFF"));
  } else if (line == "mute" || line == "sound=0" || line == "sound=off") {
    soundEnabled = false;
    Serial.println(F("[AUDIO] PAM8403 Sound Muted"));
  } else if (line == "unmute" || line == "sound=1" || line == "sound=on") {
    soundEnabled = true;
    Serial.println(F("[AUDIO] PAM8403 Sound Enabled"));
    playEmotionSound("happy");
  } else if (line == "beep" || line == "chirp") {
    playEmotionSound("happy");
  } else if (line == "wink" || line == "wink_left") {
    triggerSpecial(1, 450);
    Serial.println(F("[EYES] Action: Wink Left"));
  } else if (line == "wink_right") {
    triggerSpecial(2, 450);
    Serial.println(F("[EYES] Action: Wink Right"));
  } else {
    setEmotion(line);
    Serial.print(F("[EYES] Switched to Emotion: "));
    Serial.println(currentEmotion);
  }
}

void setEmotion(String newEmo) {
  newEmo.toLowerCase();
  newEmo.trim();
  if (newEmo == "angry") newEmo = "frustrated";
  if (newEmo == "heart" || newEmo == "hearts") newEmo = "love";
  if (newEmo == "cry" || newEmo == "crying") newEmo = "sad";
  if (newEmo == "nap" || newEmo == "sleeping") newEmo = "sleep";
  if (newEmo == "anxious") newEmo = "stressed";
  if (newEmo == "zen" || newEmo == "relaxed") newEmo = "calm";
  if (newEmo == "think") newEmo = "thinking";
  if (newEmo == "shock" || newEmo == "shocked") newEmo = "surprised";
  if (newEmo == "laser" || newEmo == "matrix") newEmo = "scan";

  if (newEmo != currentEmotion) {
    currentEmotion = newEmo;
    triggerBlink(110);              // Reactive micro-blink on emotion transition
    playEmotionSound(currentEmotion); // Play signature PAM8403 chime
  }
}

void triggerBlink(int duration) {
  isBlinking = true;
  blinkStart = millis();
  blinkDuration = duration;
}

void triggerSpecial(int action, int duration) {
  specialAction = action;
  actionStart = millis();
}

void updateBlinkState() {
  if (!isBlinking) {
    blinkFraction = 0.0f;
    return;
  }
  unsigned long elapsed = millis() - blinkStart;
  if (elapsed >= (unsigned long)blinkDuration) {
    isBlinking = false;
    blinkFraction = 0.0f;
  } else {
    float progress = (float)elapsed / (float)blinkDuration;
    blinkFraction = sin(progress * 3.14159f);
  }
}

// ==============================================================================
// 7. AUTONOMOUS IDLE & SHOWCASE CAROUSEL
// ==============================================================================
void runAutonomousIdle() {
  unsigned long now = millis();

  // In Demo Mode: cycle through all emotion personas every 4.5 seconds
  if (isDemoMode) {
    if (now - lastDemoSwitch > 4500) {
      lastDemoSwitch = now;
      demoIndex = (demoIndex + 1) % DEMO_COUNT;
      setEmotion(DEMO_EMOTIONS[demoIndex]);
    }
  }

  // 1. Natural spontaneous blinking (every 3.5 to 5.0s)
  if (!isBlinking && (now - lastIdleBlink > 3800)) {
    lastIdleBlink = now;
    if (random(0, 4) == 0) {
      triggerBlink(95);
    } else {
      triggerBlink(135);
    }
  }

  // 2. Lifelike idle saccades (wandering curious gaze)
  if (now - lastIdleAction > 3000) {
    lastIdleAction = now;
    int roll = random(0, 10);
    if (roll < 4) {
      idleWanderX = 0.0f;
      idleWanderY = 0.0f;
    } else if (roll < 7) {
      idleWanderX = -(float)random(3, 8) * 0.1f;
      idleWanderY = -(float)random(1, 4) * 0.1f;
    } else if (roll < 9) {
      idleWanderX = (float)random(3, 8) * 0.1f;
      idleWanderY = -(float)random(1, 4) * 0.1f;
    } else {
      idleWanderX = 0.0f;
      idleWanderY = 0.6f;
    }
  }

  if (currentEmotion == "neutral" || currentEmotion == "calm") {
    targetGazeX = idleWanderX;
    targetGazeY = idleWanderY;
  }
}

// ==============================================================================
// 8. MASTER RENDER DISPATCHER (PURE GRAPHIC EYES)
// ==============================================================================
void renderExpressiveEyes() {
  display.clearDisplay();

  // Reset special action if duration expired
  if (specialAction != 0 && (millis() - actionStart > 600)) {
    specialAction = 0;
  }

  // Continuous subtle breathing movement: vertical micro-bob (1.2px)
  float breathBob = sin(animTime * 1.8f) * 1.2f;

  if (currentEmotion == "happy") {
    drawHappyEyes(breathBob);
  } else if (currentEmotion == "love") {
    drawLoveEyes(breathBob);
  } else if (currentEmotion == "frustrated") {
    drawFrustratedEyes(breathBob);
  } else if (currentEmotion == "stressed") {
    drawStressedEyes(breathBob);
  } else if (currentEmotion == "calm") {
    drawCalmEyes(breathBob);
  } else if (currentEmotion == "fatigued" || currentEmotion == "drowsy") {
    drawFatiguedEyes(breathBob);
  } else if (currentEmotion == "sleep") {
    drawSleepingEyes(breathBob);
  } else if (currentEmotion == "sad") {
    drawSadEyes(breathBob);
  } else if (currentEmotion == "dizzy") {
    drawDizzyEyes(breathBob);
  } else if (currentEmotion == "thinking") {
    drawThinkingEyes(breathBob);
  } else if (currentEmotion == "surprised") {
    drawSurprisedEyes(breathBob);
  } else if (currentEmotion == "scan") {
    drawScanningEyes(breathBob);
  } else {
    // Default: Lively neutral eyes
    drawNeutralEyes(breathBob);
  }

  display.display();
}

// ==============================================================================
// 9. DETAILED EMOTION PERSONA RENDERERS
// ==============================================================================

// ──────────────────────────────────────────────────────────────────────────────
// 1. NEUTRAL: Friendly, lifelike companion eyes with specular catchlights
// ──────────────────────────────────────────────────────────────────────────────
void drawNeutralEyes(float breathBob) {
  int yPos = EYE_BASE_Y + (int)breathBob;

  bool leftClosed  = (blinkFraction > 0.65f) || (specialAction == 1);
  bool rightClosed = (blinkFraction > 0.65f) || (specialAction == 2);

  drawEyeCapsule(LEFT_EYE_X, yPos, currentGazeX, currentGazeY, EYE_WIDTH, EYE_HEIGHT, PUPIL_RAD, leftClosed, blinkFraction);
  drawEyeCapsule(RIGHT_EYE_X, yPos, currentGazeX, currentGazeY, EYE_WIDTH, EYE_HEIGHT, PUPIL_RAD, rightClosed, blinkFraction);

  if (specialAction == 1) {
    drawSparkle(RIGHT_EYE_X + 2, yPos - 3, 3);
  } else if (specialAction == 2) {
    drawSparkle(LEFT_EYE_X - 2, yPos - 3, 3);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. HAPPY: Joyful smiling crescent arches (^ ^), bouncing giggle & rosy blush
// ──────────────────────────────────────────────────────────────────────────────
void drawHappyEyes(float breathBob) {
  float giggleBob = sin(animTime * 7.5f) * 2.5f;
  int yPos = EYE_BASE_Y + (int)giggleBob;

  int r = 14;
  for (int thickness = 0; thickness < 4; thickness++) {
    display.drawCircle(LEFT_EYE_X, yPos + 8 + thickness, r, SSD1306_WHITE);
  }
  display.fillRect(LEFT_EYE_X - r - 2, yPos + 9, (r * 2) + 4, 16, SSD1306_BLACK);

  for (int thickness = 0; thickness < 4; thickness++) {
    display.drawCircle(RIGHT_EYE_X, yPos + 8 + thickness, r, SSD1306_WHITE);
  }
  display.fillRect(RIGHT_EYE_X - r - 2, yPos + 9, (r * 2) + 4, 16, SSD1306_BLACK);

  display.fillCircle(LEFT_EYE_X - 12, yPos + 16, 2, SSD1306_WHITE);
  display.fillCircle(LEFT_EYE_X - 6,  yPos + 17, 2, SSD1306_WHITE);
  display.fillCircle(RIGHT_EYE_X + 6,  yPos + 17, 2, SSD1306_WHITE);
  display.fillCircle(RIGHT_EYE_X + 12, yPos + 16, 2, SSD1306_WHITE);
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. LOVE / EXCITED: Pulsing animated heart eyes (<3 <3) & sparkles
// ──────────────────────────────────────────────────────────────────────────────
void drawHeart(int cx, int cy, float scale) {
  int r = max(3, (int)(6.0f * scale));
  int d = max(4, (int)(5.0f * scale));
  int h = max(6, (int)(11.0f * scale));

  display.fillCircle(cx - d, cy - 2, r, SSD1306_WHITE);
  display.fillCircle(cx + d, cy - 2, r, SSD1306_WHITE);
  display.fillTriangle(cx - d - r + 1, cy - 1,
                       cx + d + r - 1, cy - 1,
                       cx, cy + h, SSD1306_WHITE);
  display.fillCircle(cx - d + 1, cy - 3, max(1, (int)(1.8f * scale)), SSD1306_BLACK);
}

void drawLoveEyes(float breathBob) {
  float beat = pow(sin(animTime * 4.0f), 4.0f);
  float pulse = 1.0f + 0.18f * beat;
  int yPos = EYE_BASE_Y + (int)breathBob;

  drawHeart(LEFT_EYE_X, yPos, pulse);
  drawHeart(RIGHT_EYE_X, yPos, pulse);

  drawSparkle(64, yPos - 12 + (int)(sin(animTime * 3.5f) * 3), 3);

  display.fillCircle(LEFT_EYE_X - 14, yPos + 14, 2, SSD1306_WHITE);
  display.fillCircle(RIGHT_EYE_X + 14, yPos + 14, 2, SSD1306_WHITE);
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. FRUSTRATED: Angled tension brows, small pupils, tremor & angry vein (#)
// ──────────────────────────────────────────────────────────────────────────────
void drawFrustratedEyes(float breathBob) {
  float tremorX = sin(animTime * 26.0f) * 1.6f;
  float tremorY = cos(animTime * 22.0f) * 0.8f;
  int yPos = EYE_BASE_Y + (int)breathBob + (int)tremorY;

  int w = EYE_WIDTH - 2;
  int h = EYE_HEIGHT - 6;
  int pupilR = PUPIL_RAD - 2;

  drawEyeCapsule(LEFT_EYE_X + (int)tremorX, yPos, currentGazeX, currentGazeY, w, h, pupilR, isBlinking, blinkFraction);
  drawEyeCapsule(RIGHT_EYE_X + (int)tremorX, yPos, currentGazeX, currentGazeY, w, h, pupilR, isBlinking, blinkFraction);

  int lx = LEFT_EYE_X + (int)tremorX;
  display.fillTriangle(lx - (w / 2) - 2, yPos - (h / 2) - 1,
                       lx + (w / 2) + 2, yPos - (h / 2) - 1,
                       lx + (w / 2) + 2, yPos - 1, SSD1306_BLACK);
  display.drawLine(lx - (w / 2) - 3, yPos - (h / 2) - 2,
                   lx + (w / 2) + 3, yPos + 1, SSD1306_WHITE);

  int rx = RIGHT_EYE_X + (int)tremorX;
  display.fillTriangle(rx - (w / 2) - 2, yPos - (h / 2) - 1,
                       rx + (w / 2) + 2, yPos - (h / 2) - 1,
                       rx - (w / 2) - 2, yPos - 1, SSD1306_BLACK);
  display.drawLine(rx + (w / 2) + 3, yPos - (h / 2) - 2,
                   rx - (w / 2) - 3, yPos + 1, SSD1306_WHITE);

  int cx = RIGHT_EYE_X + 22;
  int cy = yPos - 14;
  if (sin(animTime * 12.0f) > 0.0f) {
    display.drawLine(cx - 3, cy - 4, cx - 1, cy + 4, SSD1306_WHITE);
    display.drawLine(cx + 3, cy - 4, cx + 1, cy + 4, SSD1306_WHITE);
    display.drawLine(cx - 4, cy - 2, cx + 4, cy - 2, SSD1306_WHITE);
    display.drawLine(cx - 4, cy + 2, cx + 4, cy + 2, SSD1306_WHITE);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. STRESSED / ANXIOUS: Wide dilated eyes, rapid jitter & sliding sweat drop
// ──────────────────────────────────────────────────────────────────────────────
void drawStressedEyes(float breathBob) {
  float jitterX = (sin(animTime * 32.0f) > 0.0f ? 1.0f : -1.0f) * 1.0f;
  float jitterY = (cos(animTime * 28.0f) > 0.0f ? 1.0f : -1.0f) * 0.8f;
  int yPos = EYE_BASE_Y + (int)breathBob + (int)jitterY;

  int pupilR = PUPIL_RAD + 2;

  drawEyeCapsule(LEFT_EYE_X + (int)jitterX, yPos, currentGazeX, currentGazeY, EYE_WIDTH + 2, EYE_HEIGHT + 2, pupilR, isBlinking, blinkFraction);
  drawEyeCapsule(RIGHT_EYE_X + (int)jitterX, yPos, currentGazeX, currentGazeY, EYE_WIDTH + 2, EYE_HEIGHT + 2, pupilR, isBlinking, blinkFraction);

  int lx = LEFT_EYE_X + (int)jitterX;
  int rx = RIGHT_EYE_X + (int)jitterX;
  display.drawLine(lx - 12, yPos - 21, lx + 12, yPos - 25, SSD1306_WHITE);
  display.drawLine(rx - 12, yPos - 25, rx + 12, yPos - 21, SSD1306_WHITE);

  float sweatProg = fmod(animTime * 1.5f, 1.0f);
  int sweatY = yPos - 16 + (int)(sweatProg * 20.0f);
  display.fillCircle(LEFT_EYE_X - 22, sweatY, 2, SSD1306_WHITE);
  display.drawLine(LEFT_EYE_X - 22, sweatY - 3, LEFT_EYE_X - 22, sweatY, SSD1306_WHITE);
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. CALM / ZEN: Soft hooded droop eyelids, gentle breathing & serenity
// ──────────────────────────────────────────────────────────────────────────────
void drawCalmEyes(float breathBob) {
  float slowBreath = sin(animTime * 1.2f) * 1.8f;
  int yPos = EYE_BASE_Y + (int)slowBreath;

  drawEyeCapsule(LEFT_EYE_X, yPos, currentGazeX, currentGazeY, EYE_WIDTH + 2, EYE_HEIGHT - 4, PUPIL_RAD, isBlinking, blinkFraction);
  drawEyeCapsule(RIGHT_EYE_X, yPos, currentGazeX, currentGazeY, EYE_WIDTH + 2, EYE_HEIGHT - 4, PUPIL_RAD, isBlinking, blinkFraction);

  int droopH = 9;
  display.fillRect(LEFT_EYE_X - (EYE_WIDTH / 2) - 2, yPos - (EYE_HEIGHT / 2) - 1, EYE_WIDTH + 4, droopH, SSD1306_BLACK);
  display.fillRect(RIGHT_EYE_X - (EYE_WIDTH / 2) - 2, yPos - (EYE_HEIGHT / 2) - 1, EYE_WIDTH + 4, droopH, SSD1306_BLACK);

  display.drawFastHLine(LEFT_EYE_X - (EYE_WIDTH / 2) - 1, yPos - (EYE_HEIGHT / 2) + droopH - 1, EYE_WIDTH + 2, SSD1306_WHITE);
  display.drawFastHLine(RIGHT_EYE_X - (EYE_WIDTH / 2) - 1, yPos - (EYE_HEIGHT / 2) + droopH - 1, EYE_WIDTH + 2, SSD1306_WHITE);
}

// ──────────────────────────────────────────────────────────────────────────────
// 7. FATIGUED / DROWSY: 65% heavy eyelids, sluggish gaze & floating 'z'
// ──────────────────────────────────────────────────────────────────────────────
void drawFatiguedEyes(float breathBob) {
  float sinkBob = sin(animTime * 0.9f) * 1.0f + 2.5f;
  int yPos = EYE_BASE_Y + (int)sinkBob;

  drawEyeCapsule(LEFT_EYE_X, yPos, currentGazeX * 0.4f, 0.4f, EYE_WIDTH, EYE_HEIGHT, PUPIL_RAD - 1, isBlinking, blinkFraction);
  drawEyeCapsule(RIGHT_EYE_X, yPos, currentGazeX * 0.4f, 0.4f, EYE_WIDTH, EYE_HEIGHT, PUPIL_RAD - 1, isBlinking, blinkFraction);

  int droopH = 17;
  display.fillRect(LEFT_EYE_X - (EYE_WIDTH / 2) - 2, yPos - (EYE_HEIGHT / 2) - 1, EYE_WIDTH + 4, droopH, SSD1306_BLACK);
  display.fillRect(RIGHT_EYE_X - (EYE_WIDTH / 2) - 2, yPos - (EYE_HEIGHT / 2) - 1, EYE_WIDTH + 4, droopH, SSD1306_BLACK);
  display.drawFastHLine(LEFT_EYE_X - (EYE_WIDTH / 2) - 1, yPos - (EYE_HEIGHT / 2) + droopH - 1, EYE_WIDTH + 2, SSD1306_WHITE);
  display.drawFastHLine(RIGHT_EYE_X - (EYE_WIDTH / 2) - 1, yPos - (EYE_HEIGHT / 2) + droopH - 1, EYE_WIDTH + 2, SSD1306_WHITE);

  int zY = (int)(animTime * 8.0f) % 24;
  display.setCursor(RIGHT_EYE_X + 20, yPos - 12 - (24 - zY));
  display.setTextSize(1);
  display.print(F("z"));
}

// ──────────────────────────────────────────────────────────────────────────────
// 8. SLEEPING: Closed peaceful curved slits (- -) & rising "Z z Z" snore wave
// ──────────────────────────────────────────────────────────────────────────────
void drawSleepingEyes(float breathBob) {
  float sleepBreath = sin(animTime * 1.1f) * 1.4f;
  int yPos = EYE_BASE_Y + (int)sleepBreath + 4;

  display.drawFastHLine(LEFT_EYE_X - 11, yPos, 22, SSD1306_WHITE);
  display.drawPixel(LEFT_EYE_X - 12, yPos - 1, SSD1306_WHITE);
  display.drawPixel(LEFT_EYE_X + 11, yPos - 1, SSD1306_WHITE);

  display.drawFastHLine(RIGHT_EYE_X - 11, yPos, 22, SSD1306_WHITE);
  display.drawPixel(RIGHT_EYE_X - 12, yPos - 1, SSD1306_WHITE);
  display.drawPixel(RIGHT_EYE_X + 11, yPos - 1, SSD1306_WHITE);

  int cycle = (int)(animTime * 14.0f) % 48;
  int z1Y = yPos - 6 - (cycle % 32);
  int z2Y = yPos - 14 - ((cycle + 14) % 32);

  display.setTextSize(1);
  if (z1Y > 2) {
    display.setCursor(RIGHT_EYE_X + 16 + (cycle % 6), z1Y);
    display.print(F("z"));
  }
  if (z2Y > 2) {
    display.setCursor(RIGHT_EYE_X + 22 + ((cycle + 4) % 6), z2Y);
    display.print(F("Z"));
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 9. SAD / CRYING: Drooping sad eyes (T T) & animated dripping teardrops
// ──────────────────────────────────────────────────────────────────────────────
void drawSadEyes(float breathBob) {
  int yPos = EYE_BASE_Y + (int)breathBob + 2;

  drawEyeCapsule(LEFT_EYE_X, yPos, currentGazeX * 0.3f, 0.4f, EYE_WIDTH - 2, EYE_HEIGHT - 6, PUPIL_RAD - 1, isBlinking, blinkFraction);
  drawEyeCapsule(RIGHT_EYE_X, yPos, currentGazeX * 0.3f, 0.4f, EYE_WIDTH - 2, EYE_HEIGHT - 6, PUPIL_RAD - 1, isBlinking, blinkFraction);

  int lx = LEFT_EYE_X;
  int rx = RIGHT_EYE_X;
  display.drawLine(lx - 12, yPos - 15, lx + 12, yPos - 21, SSD1306_WHITE);
  display.drawLine(rx - 12, yPos - 21, rx + 12, yPos - 15, SSD1306_WHITE);

  float tearProgress = fmod(animTime * 1.6f, 1.0f);
  int tearY = yPos - 4 + (int)(tearProgress * 26.0f);
  int tearX = lx + 10;
  if (tearY < 60) {
    display.fillCircle(tearX, tearY, 2, SSD1306_WHITE);
    display.drawLine(tearX, tearY - 3, tearX, tearY, SSD1306_WHITE);
  } else {
    display.drawPixel(tearX - 2, 60, SSD1306_WHITE);
    display.drawPixel(tearX + 2, 60, SSD1306_WHITE);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 10. DIZZY / CONFUSED: Spinning cartoon spirals (@ @) & orbiting stars
// ──────────────────────────────────────────────────────────────────────────────
void drawDizzyEyes(float breathBob) {
  float wobbleX = cos(animTime * 3.0f) * 2.0f;
  float wobbleY = sin(animTime * 3.0f) * 1.5f;
  int yPos = EYE_BASE_Y + (int)breathBob + (int)wobbleY;
  int lx = LEFT_EYE_X + (int)wobbleX;
  int rx = RIGHT_EYE_X + (int)wobbleX;

  display.drawCircle(lx, yPos, 13, SSD1306_WHITE);
  display.drawCircle(rx, yPos, 13, SSD1306_WHITE);

  float angle = animTime * 6.5f;
  for (float t = 0.5f; t < 10.5f; t += 0.45f) {
    float r = t * 1.05f;
    float a1 = t + angle;
    float a2 = t - angle;
    display.drawPixel(lx + (int)(cos(a1) * r), yPos + (int)(sin(a1) * r), SSD1306_WHITE);
    display.drawPixel(rx + (int)(cos(a2) * r), yPos + (int)(sin(a2) * r), SSD1306_WHITE);
  }

  float starAngle = animTime * 4.0f;
  drawSparkle(64 + (int)(cos(starAngle) * 18), yPos - 18 + (int)(sin(starAngle) * 5), 2);
  drawSparkle(64 + (int)(cos(starAngle + 3.14159f) * 18), yPos - 18 + (int)(sin(starAngle + 3.14159f) * 5), 2);
}

// ──────────────────────────────────────────────────────────────────────────────
// 11. THINKING: Inquisitive upward gaze & animated scanning dots (...)
// ──────────────────────────────────────────────────────────────────────────────
void drawThinkingEyes(float breathBob) {
  float thinkGazeX = sin(animTime * 2.2f) * 0.65f;
  float thinkGazeY = -0.75f;
  int yPos = EYE_BASE_Y + (int)breathBob;

  drawEyeCapsule(LEFT_EYE_X, yPos, thinkGazeX, thinkGazeY, EYE_WIDTH, EYE_HEIGHT, PUPIL_RAD, isBlinking, blinkFraction);
  drawEyeCapsule(RIGHT_EYE_X, yPos, thinkGazeX, thinkGazeY, EYE_WIDTH, EYE_HEIGHT, PUPIL_RAD, isBlinking, blinkFraction);

  int dotStep = ((int)(animTime * 3.5f)) % 3;
  for (int d = 0; d <= dotStep; d++) {
    display.fillCircle(LEFT_EYE_X - 16 + (d * 6), yPos - 22, 1, SSD1306_WHITE);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 12. SURPRISED: Wide open circular sclera (O O), tiny pupils & startled bounce
// ──────────────────────────────────────────────────────────────────────────────
void drawSurprisedEyes(float breathBob) {
  int yPos = EYE_BASE_Y + (int)breathBob - 2;

  int w = EYE_WIDTH + 4;
  int h = EYE_HEIGHT + 4;
  int pupilR = 4;

  drawEyeCapsule(LEFT_EYE_X, yPos, currentGazeX * 0.5f, currentGazeY * 0.5f, w, h, pupilR, isBlinking, blinkFraction);
  drawEyeCapsule(RIGHT_EYE_X, yPos, currentGazeX * 0.5f, currentGazeY * 0.5f, w, h, pupilR, isBlinking, blinkFraction);

  display.drawCircle(LEFT_EYE_X, yPos - 22, 12, SSD1306_WHITE);
  display.fillRect(LEFT_EYE_X - 14, yPos - 22, 28, 12, SSD1306_BLACK);
  display.drawCircle(RIGHT_EYE_X, yPos - 22, 12, SSD1306_WHITE);
  display.fillRect(RIGHT_EYE_X - 14, yPos - 22, 28, 12, SSD1306_BLACK);
}

// ──────────────────────────────────────────────────────────────────────────────
// 13. SCANNER / CYBERPUNK: Visor slots with bouncing laser radar beam
// ──────────────────────────────────────────────────────────────────────────────
void drawScanningEyes(float breathBob) {
  int yPos = EYE_BASE_Y + (int)breathBob;

  display.drawRoundRect(LEFT_EYE_X - 16, yPos - 8, 32, 16, 4, SSD1306_WHITE);
  display.drawRoundRect(RIGHT_EYE_X - 16, yPos - 8, 32, 16, 4, SSD1306_WHITE);
  display.drawFastHLine(LEFT_EYE_X + 16, yPos, RIGHT_EYE_X - 16 - (LEFT_EYE_X + 16), SSD1306_WHITE);

  float scanPhase = (sin(animTime * 4.0f) + 1.0f) * 0.5f;
  int scanX = (LEFT_EYE_X - 14) + (int)(scanPhase * 84.0f);

  if (scanX >= (LEFT_EYE_X - 14) && scanX <= (LEFT_EYE_X + 14)) {
    display.drawFastVLine(scanX, yPos - 6, 12, SSD1306_WHITE);
    display.drawFastVLine(scanX - 1, yPos - 4, 8, SSD1306_WHITE);
  }
  if (scanX >= (RIGHT_EYE_X - 14) && scanX <= (RIGHT_EYE_X + 14)) {
    display.drawFastVLine(scanX, yPos - 6, 12, SSD1306_WHITE);
    display.drawFastVLine(scanX - 1, yPos - 4, 8, SSD1306_WHITE);
  }

  display.drawFastHLine(8, 8, 8, SSD1306_WHITE);
  display.drawFastVLine(8, 8, 8, SSD1306_WHITE);
  display.drawFastHLine(119, 8, 8, SSD1306_WHITE);
  display.drawFastVLine(127, 8, 8, SSD1306_WHITE);
}

// ==============================================================================
// 10. CORE EYE DRAWING PRIMITIVE (CAPSULE + PUPIL + SMOOTH BLINK)
// ==============================================================================
void drawEyeCapsule(int cx, int cy, float gx, float gy, int w, int h, int pupilR, bool closed, float blinkFactor) {
  if (closed || blinkFactor > 0.85f) {
    display.fillRoundRect(cx - (w / 2), cy - 2, w, 4, 2, SSD1306_WHITE);
    return;
  }

  int effectiveH = h;
  if (blinkFactor > 0.05f) {
    effectiveH = max(4, (int)(h * (1.0f - blinkFactor)));
  }

  int rad = min(CORNER_RAD, effectiveH / 2);
  display.fillRoundRect(cx - (w / 2), cy - (effectiveH / 2), w, effectiveH, rad, SSD1306_WHITE);

  if (effectiveH < pupilR * 2) return;

  int maxOffsetX = (w / 2) - pupilR - 2;
  int maxOffsetY = (effectiveH / 2) - pupilR - 2;
  int px = cx + (int)(gx * maxOffsetX);
  int py = cy + (int)(gy * maxOffsetY);

  display.fillCircle(px, py, pupilR, SSD1306_BLACK);

  if (pupilR >= 5) {
    display.fillCircle(px + 2, py - 2, 2, SSD1306_WHITE);
  }
}

void drawSparkle(int cx, int cy, int size) {
  display.drawFastVLine(cx, cy - size, (size * 2) + 1, SSD1306_WHITE);
  display.drawFastHLine(cx - size, cy, (size * 2) + 1, SSD1306_WHITE);
}
