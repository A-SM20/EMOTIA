/*
 * robot_eyes.ino — Animated Robot Eyes for EMOTIA Desk Robot
 * Hardware: Arduino Nano (ATmega328P) + 0.96" I2C OLED (SSD1306 128x64)
 * 
 * Pin Connections:
 *   Nano 5V  -> OLED VCC (or 3.3V)
 *   Nano GND -> OLED GND
 *   Nano A4  -> OLED SDA
 *   Nano A5  -> OLED SCL
 *   Nano USB -> Internal USB 2.0 Hub -> PC
 *
 * Required Arduino Libraries:
 *   - Adafruit SSD1306
 *   - Adafruit GFX Library
 *
 * Baud Rate: 115200
 */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C  // Default I2C address for 0.96" SSD1306

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Eye geometry parameters
const int LEFT_EYE_X = 36;
const int RIGHT_EYE_X = 92;
const int EYE_CENTER_Y = 32;
const int EYE_WIDTH = 26;
const int EYE_HEIGHT = 34;
const int EYE_CORNER_RADIUS = 8;
const int PUPIL_RADIUS = 7;

// Current state
String currentEmotion = "neutral";
float targetGazeX = 0.0; // -1.0 (left) to +1.0 (right)
float targetGazeY = 0.0; // -1.0 (up) to +1.0 (down)
float currentGazeX = 0.0;
float currentGazeY = 0.0;
bool isBlinking = false;
unsigned long lastSerialTime = 0;
unsigned long lastIdleBlink = 0;

void setup() {
  Serial.begin(115200);
  
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    // Try alternate I2C address if 0x3C fails
    display.begin(SSD1306_SWITCHCAPVCC, 0x3D);
  }

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  
  // Startup splash screen
  display.setTextSize(1);
  display.setCursor(24, 24);
  display.println(F("EMOTIA ROBOT"));
  display.setCursor(34, 38);
  display.println(F("ONLINE"));
  display.display();
  delay(1200);
}

void loop() {
  readSerialCommands();

  // If no serial received for > 3.5 seconds, run autonomous idle gaze
  if (millis() - lastSerialTime > 3500) {
    runAutonomousIdle();
  }

  // Smooth interpolation towards target gaze
  currentGazeX += (targetGazeX - currentGazeX) * 0.35;
  currentGazeY += (targetGazeY - currentGazeY) * 0.35;

  drawEyes();
  delay(30); // ~33 FPS refresh rate
}

void readSerialCommands() {
  while (Serial.available() > 0) {
    String line = Serial.readStringUntil('\n');
    line.trim();
    if (line.length() == 0) continue;

    lastSerialTime = millis();

    // Check for JSON packet: {"cmd":"EYES","emo":"calm","gx":0.1,"gy":-0.1,"blk":0}
    int emoIdx = line.indexOf("\"emo\":\"");
    if (emoIdx != -1) {
      int emoEnd = line.indexOf("\"", emoIdx + 7);
      if (emoEnd != -1) {
        currentEmotion = line.substring(emoIdx + 7, emoEnd);
      }
    }

    int gxIdx = line.indexOf("\"gx\":");
    if (gxIdx != -1) {
      targetGazeX = line.substring(gxIdx + 5).toFloat();
    }

    int gyIdx = line.indexOf("\"gy\":");
    if (gyIdx != -1) {
      targetGazeY = line.substring(gyIdx + 5).toFloat();
    }

    int blkIdx = line.indexOf("\"blk\":");
    if (blkIdx != -1) {
      isBlinking = (line.charAt(blkIdx + 6) == '1');
    }
  }
}

void runAutonomousIdle() {
  // Autonomous blink every ~3.5 seconds
  if (millis() - lastIdleBlink > 3500) {
    lastIdleBlink = millis();
    isBlinking = true;
    drawEyes();
    delay(120);
    isBlinking = false;
    // Slight random gaze wander
    targetGazeX = (random(-4, 5) / 10.0);
    targetGazeY = (random(-3, 4) / 10.0);
  }
}

void drawSingleEye(int cx, int cy, float gx, float gy, String emotion, bool blink) {
  if (blink) {
    // Eyelid closed: horizontal slit
    display.fillRect(cx - (EYE_WIDTH / 2), cy - 2, EYE_WIDTH, 4, SSD1306_WHITE);
    return;
  }

  if (emotion == "happy") {
    // Happy smiling arc (^ ^)
    for (int t = 0; t < 3; t++) {
      display.drawCircle(cx, cy + 6 + t, EYE_WIDTH / 2, SSD1306_WHITE);
    }
    display.fillRect(cx - (EYE_WIDTH / 2) - 2, cy + 6, EYE_WIDTH + 4, 18, SSD1306_BLACK);
    return;
  }

  // Draw eye outline / filled body
  display.fillRoundRect(cx - (EYE_WIDTH / 2), cy - (EYE_HEIGHT / 2),
                        EYE_WIDTH, EYE_HEIGHT, EYE_CORNER_RADIUS, SSD1306_WHITE);

  // Pupil offset calculation
  int maxOffsetX = (EYE_WIDTH / 2) - PUPIL_RADIUS - 2;
  int maxOffsetY = (EYE_HEIGHT / 2) - PUPIL_RADIUS - 2;
  int pupilX = cx + (int)(gx * maxOffsetX);
  int pupilY = cy + (int)(gy * maxOffsetY);

  // Draw black pupil inside white eye
  display.fillCircle(pupilX, pupilY, PUPIL_RADIUS, SSD1306_BLACK);
  // Pupil specular highlight
  display.fillCircle(pupilX + 2, pupilY - 2, 2, SSD1306_WHITE);

  // Emotion-specific eyelid overlays
  if (emotion == "frustrated") {
    // Angled angry brow overlay cutting inward
    if (cx < SCREEN_WIDTH / 2) {
      // Left eye: slope downwards towards center
      display.fillTriangle(cx - (EYE_WIDTH / 2) - 1, cy - (EYE_HEIGHT / 2) - 1,
                           cx + (EYE_WIDTH / 2) + 1, cy - (EYE_HEIGHT / 2) - 1,
                           cx + (EYE_WIDTH / 2) + 1, cy - 2, SSD1306_BLACK);
    } else {
      // Right eye: slope downwards towards center
      display.fillTriangle(cx - (EYE_WIDTH / 2) - 1, cy - (EYE_HEIGHT / 2) - 1,
                           cx + (EYE_WIDTH / 2) + 1, cy - (EYE_HEIGHT / 2) - 1,
                           cx - (EYE_WIDTH / 2) - 1, cy - 2, SSD1306_BLACK);
    }
  } else if (emotion == "calm") {
    // Soft relaxed upper lid
    display.fillRect(cx - (EYE_WIDTH / 2), cy - (EYE_HEIGHT / 2), EYE_WIDTH, 8, SSD1306_BLACK);
  } else if (emotion == "stressed") {
    // Alert / tense micro-tremor
    display.drawRoundRect(cx - (EYE_WIDTH / 2) - 2, cy - (EYE_HEIGHT / 2) - 2,
                          EYE_WIDTH + 4, EYE_HEIGHT + 4, EYE_CORNER_RADIUS, SSD1306_WHITE);
  }
}

void drawEyes() {
  display.clearDisplay();
  drawSingleEye(LEFT_EYE_X, EYE_CENTER_Y, currentGazeX, currentGazeY, currentEmotion, isBlinking);
  drawSingleEye(RIGHT_EYE_X, EYE_CENTER_Y, currentGazeX, currentGazeY, currentEmotion, isBlinking);
  display.display();
}
