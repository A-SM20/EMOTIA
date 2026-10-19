/*
 * robot_eyes.ino — Advanced Expressive Robot Eyes for EMOTIA Desk Robot
 * Hardware: Regular ESP32 (or Arduino Nano) + 0.96" I2C OLED (SSD1306 128x64)
 * 
 * Pin Connections for Regular ESP32:
 *   OLED GND     -> ESP32 GND
 *   OLED VCC     -> ESP32 3V3 (or VIN 5V)
 *   OLED CSK/SCL -> ESP32 GPIO 22 (D22)
 *   OLED SDA     -> ESP32 GPIO 21 (D21)
 *   ESP32 USB    -> PC (115200 baud Serial)
 *
 * Supported Emotion Personas & Animations:
 *   1. NEUTRAL    - Lifelike breathing bob, natural specular pupils, spontaneous micro-saccades
 *   2. HAPPY      - Joyful bouncing arcs (^ ^), double catchlights, animated rosy cheek blush
 *   3. FRUSTRATED - Sharp angular tension brows, constricted pupils, exasperated tremor vibration
 *   4. STRESSED   - Wide dilated eyes, rapid nervous saccadic twitches, alert high-frequency jitter
 *   5. CALM       - Gentle hooded eyelids, slow rhythmic breathing, soft oval gaze
 *   6. FATIGUED   - Heavy drooping eyelids (65% drop), slow-motion drowsy blinking, drifting gaze
 *   7. THINKING   - Inquisitive upward gaze, subtle horizontal scan wave
 *   8. SURPRISED  - Wide open circular eyes, pinpoint pupils, dramatic bounce
 *   9. WINK       - Playful / affirming single-eye wink with catchlight twinkle
 *
 * Required Libraries:
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
#define SCREEN_ADDRESS 0x3C  // Default I2C address (alternates to 0x3D automatically)

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ── Eye Geometry & Layout Constants ──────────────────────────────────────────
const int LEFT_EYE_X   = 36;
const int RIGHT_EYE_X  = 92;
const int EYE_BASE_Y   = 32;
const int EYE_WIDTH    = 28;
const int EYE_HEIGHT   = 36;
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
int blinkDuration      = 140; // ms
float blinkFraction    = 0.0; // 0.0 = open, 1.0 = fully closed

// Idle & Timer States
unsigned long lastSerialTime   = 0;
unsigned long lastIdleBlink    = 0;
unsigned long lastIdleAction   = 0;
float idleWanderX      = 0.0;
float idleWanderY      = 0.0;

// Time accumulator for continuous micro-physics
float animTime         = 0.0;

// Special Action Trigger (0: normal, 1: wink left, 2: wink right, 3: happy bob)
int specialAction      = 0;
unsigned long actionStart = 0;

// ==============================================================================
// 1. SETUP
// ==============================================================================
void setup() {
  Serial.begin(115200);
  delay(100);

#if defined(ESP32)
  // Explicitly map ESP32 hardware I2C pins: SDA=21, SCL=22
  Wire.begin(21, 22);
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
  display.setCursor(24, 20);
  display.println(F("EMOTIA ROBOT"));
  display.drawFastHLine(20, 32, 88, SSD1306_WHITE);
  display.setCursor(34, 38);
  display.println(F("AI VISOR v2"));
  display.display();
  delay(1200);

  Serial.println(F("[OLED] Expressive Robot Eyes Online. Ready for Serial JSON @ 115200 baud."));
}

// ==============================================================================
// 2. MAIN LOOP
// ==============================================================================
void loop() {
  animTime += 0.05f;

  readSerialCommands();

  // If no serial received for > 3.0 seconds, run autonomous lifelike behaviors
  if (millis() - lastSerialTime > 3000) {
    runAutonomousIdle();
  }

  // Smooth exponential interpolation towards target gaze
  float lerpSpeed = (currentEmotion == "stressed" || currentEmotion == "frustrated") ? 0.45f : 0.25f;
  currentGazeX += (targetGazeX - currentGazeX) * lerpSpeed;
  currentGazeY += (targetGazeY - currentGazeY) * lerpSpeed;

  // Update smooth blink fraction
  updateBlinkState();

  // Render the expressive frame
  renderExpressiveEyes();

  delay(25); // ~40 FPS smooth rendering
}

// ==============================================================================
// 3. SERIAL PARSING
// ==============================================================================
void readSerialCommands() {
  while (Serial.available() > 0) {
    String line = Serial.readStringUntil('\n');
    line.trim();
    if (line.length() == 0) continue;

    lastSerialTime = millis();

    // Check for emotion: {"cmd":"EYES","emo":"happy","gx":0.1,"gy":-0.2,"blk":0}
    int emoIdx = line.indexOf("\"emo\":\"");
    if (emoIdx != -1) {
      int emoEnd = line.indexOf("\"", emoIdx + 7);
      if (emoEnd != -1) {
        String newEmo = line.substring(emoIdx + 7, emoEnd);
        newEmo.toLowerCase();
        if (newEmo != currentEmotion) {
          currentEmotion = newEmo;
          // Trigger a reactive micro-blink on emotion transition
          triggerBlink(110);
        }
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
      if (wantBlink && !isBlinking) {
        triggerBlink(140);
      }
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
    // Parabolic ease-in / ease-out blink curve: 0.0 -> 1.0 -> 0.0
    float progress = (float)elapsed / (float)blinkDuration;
    blinkFraction = sin(progress * 3.14159f);
  }
}

// ==============================================================================
// 4. AUTONOMOUS IDLE BEHAVIORS (LIFELIKE DESK COMPANION)
// ==============================================================================
void runAutonomousIdle() {
  unsigned long now = millis();

  // 1. Natural spontaneous blinking (every 3.0 to 5.5s)
  if (!isBlinking && (now - lastIdleBlink > (unsigned long)(3200 + (idleWanderX * 1500)))) {
    lastIdleBlink = now;
    // 25% chance of a quick human-like double-blink
    if (random(0, 4) == 0) {
      triggerBlink(95);
    } else {
      triggerBlink(135);
    }
  }

  // 2. Lifelike idle saccades (wandering curious gaze)
  if (now - lastIdleAction > 2800) {
    lastIdleAction = now;
    int roll = random(0, 10);
    if (roll < 3) {
      // Look straight ahead
      idleWanderX = 0.0f;
      idleWanderY = (float)random(-1, 2) * 0.1f;
    } else if (roll < 6) {
      // Look slightly to the left (curious)
      idleWanderX = -(float)random(3, 8) * 0.1f;
      idleWanderY = -(float)random(1, 4) * 0.1f;
    } else if (roll < 9) {
      // Look slightly to the right
      idleWanderX = (float)random(3, 8) * 0.1f;
      idleWanderY = -(float)random(1, 4) * 0.1f;
    } else {
      // Glance down (reading desk / notes)
      idleWanderX = 0.0f;
      idleWanderY = 0.7f;
    }
  }

  targetGazeX = idleWanderX;
  targetGazeY = idleWanderY;
}

// ==============================================================================
// 5. MASTER RENDER DISPATCHER
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
  } else if (currentEmotion == "frustrated") {
    drawFrustratedEyes(breathBob);
  } else if (currentEmotion == "stressed") {
    drawStressedEyes(breathBob);
  } else if (currentEmotion == "calm") {
    drawCalmEyes(breathBob);
  } else if (currentEmotion == "fatigued" || currentEmotion == "drowsy") {
    drawFatiguedEyes(breathBob);
  } else if (currentEmotion == "thinking") {
    drawThinkingEyes(breathBob);
  } else if (currentEmotion == "surprised") {
    drawSurprisedEyes(breathBob);
  } else {
    // Default: Lively neutral eyes
    drawNeutralEyes(breathBob);
  }

  display.display();
}

// ==============================================================================
// 6. EMOTION-SPECIFIC EYE RENDERERS
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
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. HAPPY: Joyful curving arches (^ ^), bouncing giggle, and rosy cheek blush
// ──────────────────────────────────────────────────────────────────────────────
void drawHappyEyes(float breathBob) {
  // Joyful vertical bouncing giggle rhythm (8 Hz frequency)
  float giggleBob = sin(animTime * 7.5f) * 2.5f;
  int yPos = EYE_BASE_Y + (int)giggleBob;

  int eyeW = EYE_WIDTH + 2;

  // Draw Left Smiling Arc (^ )
  drawHappyArc(LEFT_EYE_X, yPos);
  // Draw Right Smiling Arc ( ^)
  drawHappyArc(RIGHT_EYE_X, yPos);

  // Animated Rosy Cheek Blush dots under eyes
  display.fillCircle(LEFT_EYE_X - 12, yPos + 16, 2, SSD1306_WHITE);
  display.fillCircle(LEFT_EYE_X - 6,  yPos + 17, 2, SSD1306_WHITE);
  display.fillCircle(RIGHT_EYE_X + 6,  yPos + 17, 2, SSD1306_WHITE);
  display.fillCircle(RIGHT_EYE_X + 12, yPos + 16, 2, SSD1306_WHITE);
}

void drawHappyArc(int cx, int cy) {
  int r = 14;
  // Multiple stacked inverted arcs create a thick, warm cartoon smiling curve
  for (int thickness = 0; thickness < 4; thickness++) {
    display.drawCircle(cx, cy + 8 + thickness, r, SSD1306_WHITE);
  }
  // Mask off bottom half of the circle so only the top smiling curve (^ ) remains
  display.fillRect(cx - r - 2, cy + 9, (r * 2) + 4, 16, SSD1306_BLACK);
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. FRUSTRATED: Sharp inward-angled tension brows, small pupils, tension tremor
// ──────────────────────────────────────────────────────────────────────────────
void drawFrustratedEyes(float breathBob) {
  // Exasperated horizontal tension vibration tremor (28 Hz)
  float tremorX = sin(animTime * 26.0f) * 1.5f;
  float tremorY = cos(animTime * 22.0f) * 0.8f;
  int yPos = EYE_BASE_Y + (int)breathBob + (int)tremorY;

  // Narrowed, tense eye shape
  int w = EYE_WIDTH - 2;
  int h = EYE_HEIGHT - 6;
  int pupilR = PUPIL_RAD - 2; // Constricted pupil under frustration/stress

  drawEyeCapsule(LEFT_EYE_X + (int)tremorX, yPos, currentGazeX, currentGazeY, w, h, pupilR, isBlinking, blinkFraction);
  drawEyeCapsule(RIGHT_EYE_X + (int)tremorX, yPos, currentGazeX, currentGazeY, w, h, pupilR, isBlinking, blinkFraction);

  // Sharp Inward Angry Brow Triangles cutting into the eye tops
  // Left eye: angles downwards towards center
  int lx = LEFT_EYE_X + (int)tremorX;
  display.fillTriangle(lx - (w / 2) - 2, yPos - (h / 2) - 1,
                       lx + (w / 2) + 2, yPos - (h / 2) - 1,
                       lx + (w / 2) + 2, yPos - 1, SSD1306_BLACK);
  // Brow accent line
  display.drawLine(lx - (w / 2) - 3, yPos - (h / 2) - 2,
                   lx + (w / 2) + 3, yPos + 1, SSD1306_WHITE);

  // Right eye: angles downwards towards center
  int rx = RIGHT_EYE_X + (int)tremorX;
  display.fillTriangle(rx - (w / 2) - 2, yPos - (h / 2) - 1,
                       rx + (w / 2) + 2, yPos - (h / 2) - 1,
                       rx - (w / 2) - 2, yPos - 1, SSD1306_BLACK);
  display.drawLine(rx + (w / 2) + 3, yPos - (h / 2) - 2,
                   rx - (w / 2) - 3, yPos + 1, SSD1306_WHITE);
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. STRESSED / ANXIOUS: Wide dilated eyes, rapid jitter, worried raised inner brows
// ──────────────────────────────────────────────────────────────────────────────
void drawStressedEyes(float breathBob) {
  // High-frequency anxious micro-jitter
  float jitterX = (sin(animTime * 32.0f) > 0.0f ? 1.0f : -1.0f) * 1.0f;
  float jitterY = (cos(animTime * 28.0f) > 0.0f ? 1.0f : -1.0f) * 0.8f;
  int yPos = EYE_BASE_Y + (int)breathBob + (int)jitterY;

  // Wide dilated pupil
  int pupilR = PUPIL_RAD + 2;

  drawEyeCapsule(LEFT_EYE_X + (int)jitterX, yPos, currentGazeX, currentGazeY, EYE_WIDTH + 2, EYE_HEIGHT + 2, pupilR, isBlinking, blinkFraction);
  drawEyeCapsule(RIGHT_EYE_X + (int)jitterX, yPos, currentGazeX, currentGazeY, EYE_WIDTH + 2, EYE_HEIGHT + 2, pupilR, isBlinking, blinkFraction);

  // Worried upward-tilted inner eyebrows
  int lx = LEFT_EYE_X + (int)jitterX;
  int rx = RIGHT_EYE_X + (int)jitterX;
  display.drawLine(lx - 12, yPos - 21, lx + 12, yPos - 25, SSD1306_WHITE);
  display.drawLine(rx - 12, yPos - 25, rx + 12, yPos - 21, SSD1306_WHITE);

  // Anxious sweat drop on left temple
  display.fillCircle(LEFT_EYE_X - 22, yPos - 10, 2, SSD1306_WHITE);
  display.drawLine(LEFT_EYE_X - 22, yPos - 14, LEFT_EYE_X - 22, yPos - 10, SSD1306_WHITE);
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. CALM / RELAXED: Hooded droop eyelids, gentle breathing, relaxed soft capsules
// ──────────────────────────────────────────────────────────────────────────────
void drawCalmEyes(float breathBob) {
  // Very slow, deeply relaxing breathing oscillation
  float slowBreath = sin(animTime * 1.2f) * 1.8f;
  int yPos = EYE_BASE_Y + (int)slowBreath;

  drawEyeCapsule(LEFT_EYE_X, yPos, currentGazeX, currentGazeY, EYE_WIDTH + 2, EYE_HEIGHT - 4, PUPIL_RAD, isBlinking, blinkFraction);
  drawEyeCapsule(RIGHT_EYE_X, yPos, currentGazeX, currentGazeY, EYE_WIDTH + 2, EYE_HEIGHT - 4, PUPIL_RAD, isBlinking, blinkFraction);

  // Gentle hooded upper eyelid droop (softening the gaze by ~35%)
  int droopH = 9;
  display.fillRect(LEFT_EYE_X - (EYE_WIDTH / 2) - 2, yPos - (EYE_HEIGHT / 2) - 1, EYE_WIDTH + 4, droopH, SSD1306_BLACK);
  display.fillRect(RIGHT_EYE_X - (EYE_WIDTH / 2) - 2, yPos - (EYE_HEIGHT / 2) - 1, EYE_WIDTH + 4, droopH, SSD1306_BLACK);

  // Soft curved horizontal eyelid fold
  display.drawFastHLine(LEFT_EYE_X - (EYE_WIDTH / 2) - 1, yPos - (EYE_HEIGHT / 2) + droopH - 1, EYE_WIDTH + 2, SSD1306_WHITE);
  display.drawFastHLine(RIGHT_EYE_X - (EYE_WIDTH / 2) - 1, yPos - (EYE_HEIGHT / 2) + droopH - 1, EYE_WIDTH + 2, SSD1306_WHITE);
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. FATIGUED / DROWSY: 65% heavy eyelids, sluggish gaze, slow-motion slumber
// ──────────────────────────────────────────────────────────────────────────────
void drawFatiguedEyes(float breathBob) {
  // Heavy sinking posture with slow bob
  float sinkBob = sin(animTime * 0.9f) * 1.0f + 2.5f;
  int yPos = EYE_BASE_Y + (int)sinkBob;

  drawEyeCapsule(LEFT_EYE_X, yPos, currentGazeX * 0.4f, 0.4f, EYE_WIDTH, EYE_HEIGHT, PUPIL_RAD - 1, isBlinking, blinkFraction);
  drawEyeCapsule(RIGHT_EYE_X, yPos, currentGazeX * 0.4f, 0.4f, EYE_WIDTH, EYE_HEIGHT, PUPIL_RAD - 1, isBlinking, blinkFraction);

  // Heavy, half-closed drooping eyelids cutting down to 60% of eye height
  int droopH = 16;
  display.fillRect(LEFT_EYE_X - (EYE_WIDTH / 2) - 2, yPos - (EYE_HEIGHT / 2) - 1, EYE_WIDTH + 4, droopH, SSD1306_BLACK);
  display.fillRect(RIGHT_EYE_X - (EYE_WIDTH / 2) - 2, yPos - (EYE_HEIGHT / 2) - 1, EYE_WIDTH + 4, droopH, SSD1306_BLACK);
  display.drawFastHLine(LEFT_EYE_X - (EYE_WIDTH / 2) - 1, yPos - (EYE_HEIGHT / 2) + droopH - 1, EYE_WIDTH + 2, SSD1306_WHITE);
  display.drawFastHLine(RIGHT_EYE_X - (EYE_WIDTH / 2) - 1, yPos - (EYE_HEIGHT / 2) + droopH - 1, EYE_WIDTH + 2, SSD1306_WHITE);

  // Subtle floating 'Z' particle floating up on the top right
  int zY = (int)(animTime * 8.0f) % 24;
  display.setCursor(RIGHT_EYE_X + 20, yPos - 12 - (24 - zY));
  display.setTextSize(1);
  display.print(F("z"));
}

// ──────────────────────────────────────────────────────────────────────────────
// 7. THINKING: Inquisitive upward gaze, subtle horizontal scan wave
// ──────────────────────────────────────────────────────────────────────────────
void drawThinkingEyes(float breathBob) {
  // Gaze slowly rolls upward and sweeps left-to-right
  float thinkGazeX = sin(animTime * 2.2f) * 0.65f;
  float thinkGazeY = -0.75f; // Look up thoughtfully
  int yPos = EYE_BASE_Y + (int)breathBob;

  drawEyeCapsule(LEFT_EYE_X, yPos, thinkGazeX, thinkGazeY, EYE_WIDTH, EYE_HEIGHT, PUPIL_RAD, isBlinking, blinkFraction);
  drawEyeCapsule(RIGHT_EYE_X, yPos, thinkGazeX, thinkGazeY, EYE_WIDTH, EYE_HEIGHT, PUPIL_RAD, isBlinking, blinkFraction);

  // Floating sci-fi thought dots (...) above left eye
  int dotStep = ((int)(animTime * 3.0f)) % 3;
  for (int d = 0; d <= dotStep; d++) {
    display.fillCircle(LEFT_EYE_X - 18 + (d * 5), yPos - 22, 1, SSD1306_WHITE);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 8. SURPRISED: Wide open circular sclera, tiny pinpoint pupils
// ──────────────────────────────────────────────────────────────────────────────
void drawSurprisedEyes(float breathBob) {
  int yPos = EYE_BASE_Y + (int)breathBob - 2;

  // Tall, circular wide-open eye
  int w = EYE_WIDTH + 4;
  int h = EYE_HEIGHT + 4;
  int pupilR = 4; // Pinpoint pupil

  drawEyeCapsule(LEFT_EYE_X, yPos, currentGazeX * 0.5f, currentGazeY * 0.5f, w, h, pupilR, isBlinking, blinkFraction);
  drawEyeCapsule(RIGHT_EYE_X, yPos, currentGazeX * 0.5f, currentGazeY * 0.5f, w, h, pupilR, isBlinking, blinkFraction);

  // Raised high curved surprise brows
  display.drawCircle(LEFT_EYE_X, yPos - 22, 12, SSD1306_WHITE);
  display.fillRect(LEFT_EYE_X - 14, yPos - 22, 28, 12, SSD1306_BLACK);
  display.drawCircle(RIGHT_EYE_X, yPos - 22, 12, SSD1306_WHITE);
  display.fillRect(RIGHT_EYE_X - 14, yPos - 22, 28, 12, SSD1306_BLACK);
}

// ==============================================================================
// 7. CORE EYE DRAWING PRIMITIVE (CAPSULE + PUPIL + SMOOTH BLINK)
// ==============================================================================
void drawEyeCapsule(int cx, int cy, float gx, float gy, int w, int h, int pupilR, bool closed, float blinkFactor) {
  // 1. Closed Eyelid / Slit state
  if (closed || blinkFactor > 0.85f) {
    display.fillRoundRect(cx - (w / 2), cy - 2, w, 4, 2, SSD1306_WHITE);
    return;
  }

  // 2. Animated smooth blink compression
  int effectiveH = h;
  if (blinkFactor > 0.05f) {
    effectiveH = max(4, (int)(h * (1.0f - blinkFactor)));
  }

  // 3. Eye Body (Solid white rounded capsule)
  int rad = min(CORNER_RAD, effectiveH / 2);
  display.fillRoundRect(cx - (w / 2), cy - (effectiveH / 2), w, effectiveH, rad, SSD1306_WHITE);

  // If eye is compressed close to shut, skip pupil rendering
  if (effectiveH < pupilR * 2) return;

  // 4. Pupil Offset Calculation (Gaze tracking within bounds)
  int maxOffsetX = (w / 2) - pupilR - 2;
  int maxOffsetY = (effectiveH / 2) - pupilR - 2;
  int px = cx + (int)(gx * maxOffsetX);
  int py = cy + (int)(gy * maxOffsetY);

  // 5. Draw Black Pupil inside White Sclera
  display.fillCircle(px, py, pupilR, SSD1306_BLACK);

  // 6. Dynamic Specular Catchlight (white reflection dot for soul & depth)
  if (pupilR >= 5) {
    display.fillCircle(px + 2, py - 2, 2, SSD1306_WHITE);
  }
}
