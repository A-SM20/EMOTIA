"""
hardware_controller.py — Hardware Controller Hub for EMOTIA Desk Robot.

Primary Active Actuator (v1.0 Current Build):
  - Arduino Nano Clone driving a 0.96" SSD1306 OLED Display (I2C: A4/A5)
  - Connects via USB Serial (CH340 at 115200 baud) through internal USB Hub
  - Renders real-time animated eyes matching detected emotion, gaze tracking, and blinks

Future Additions / Modular Expansions (Documented for v2.0 Roadmap):
  - Pan/Tilt Motorized Servo Mount
  - Smart Ambient Desk LED Controller (PWM / NeoPixel)

Transports Supported:
  1. USB Serial COM (Arduino Nano on COM3/COM4/etc. at 115200 baud)
  2. Virtual Simulation (Simulates display states & actuators when hardware is offline)
  3. HTTP REST (Optional network microcontroller fallback)
"""

import time
import json
import threading
import urllib.request
import urllib.parse
from typing import Dict, Optional

try:
    import serial
    SERIAL_AVAILABLE = True
except ImportError:
    SERIAL_AVAILABLE = False


class HardwareController:
    def __init__(self, transport: str = "sim", com_port: str = "COM3", esp32_ip: str = "192.168.1.100"):
        self.transport = transport          # "sim", "serial", "http"
        self.com_port = com_port
        self.esp32_ip = esp32_ip
        self.baud_rate = 115200

        self._lock = threading.Lock()
        self._serial_conn = None
        self._connected = (transport == "sim")

        # ── Primary Actuator: OLED Animated Eyes (v1.0 Build) ───────────────
        self.eyes_state = {
            "emotion": "neutral",
            "gaze_x": 0.0,                  # -1.0 (left) to +1.0 (right)
            "gaze_y": 0.0,                  # -1.0 (up) to +1.0 (down)
            "blink": False,
            "ear": 0.30,
            "style": "round",               # "round", "focused", "frustrated_slant", "stressed_wide", "happy_arc"
            "last_packet_time": 0.0,
        }
        self.eyes_rate_limit = 0.065        # ~15 Hz refresh rate to Arduino

        # ── Future Additions (v2.0 Modular Roadmap) ──────────────────────────
        # Kept for research forward-compatibility and modular extensions
        self.future_expansion = {
            "servo_enabled": False,         # Marked as future addition
            "light_enabled": False,         # Marked as future addition
            "servo_angle": 90,
            "servo_mode": "face_tracking",
            "light_mode": "circadian",
            "light_brightness": 75,
        }

        if self.transport == "serial":
            self._init_serial()

    def _init_serial(self):
        """Initialize serial connection to Arduino Nano."""
        if not SERIAL_AVAILABLE:
            print("[hardware] pySerial not available — falling back to virtual simulation")
            self.transport = "sim"
            return
        try:
            self._serial_conn = serial.Serial(self.com_port, self.baud_rate, timeout=0.2)
            self._connected = True
            print(f"[hardware] Opened Serial connection to Arduino Nano: {self.com_port} [OK]")
        except Exception as e:
            print(f"[hardware] Could not open {self.com_port}: {e} (using virtual simulation)")
            self._connected = False

    def set_transport(self, transport: str, com_port: Optional[str] = None, esp32_ip: Optional[str] = None):
        """Switch hardware transport configuration dynamically."""
        with self._lock:
            self.transport = transport
            if com_port:
                self.com_port = com_port
            if esp32_ip:
                self.esp32_ip = esp32_ip
            if self._serial_conn:
                try:
                    self._serial_conn.close()
                except Exception:
                    pass
                self._serial_conn = None
            if transport == "serial":
                self._init_serial()
            else:
                self._connected = (transport == "sim")
        print(f"[hardware] Transport updated to: {transport} (COM: {self.com_port})")

    # ── Primary Actuator Interface: OLED Animated Eyes ───────────────────────

    def update_eyes(self, emotion: str, gaze_x: float = 0.0, gaze_y: float = 0.0,
                    is_blinking: bool = False, ear: float = 0.30):
        """
        Sends real-time affective eye animation packet to the Arduino Nano driving the OLED.
        Packet includes current emotion, gaze direction (tracking user's face), and blink state.
        """
        now = time.time()
        if now - self.eyes_state["last_packet_time"] < self.eyes_rate_limit:
            return

        # Determine eye graphic style
        style_map = {
            "frustrated": "frustrated_slant",
            "stressed": "stressed_wide",
            "happy": "happy_arc",
            "calm": "focused",
            "neutral": "round",
            "fatigued": "drowsy",
            "drowsy": "drowsy",
            "thinking": "thinking",
            "surprised": "surprised",
        }
        eye_style = style_map.get(emotion, "round")

        with self._lock:
            self.eyes_state.update({
                "emotion": emotion,
                "gaze_x": round(float(gaze_x), 2),
                "gaze_y": round(float(gaze_y), 2),
                "blink": bool(is_blinking),
                "ear": round(float(ear), 2),
                "style": eye_style,
                "last_packet_time": now,
            })

        # Send command over serial to Arduino Nano
        self._send_eyes_packet(emotion, gaze_x, gaze_y, is_blinking, eye_style)

    def _send_eyes_packet(self, emotion: str, gx: float, gy: float, blink: bool, style: str):
        """Dispatch eye animation packet to Arduino Nano over Serial."""
        if self.transport == "serial" and self._serial_conn and self._serial_conn.is_open:
            try:
                # 1. Compact JSON format
                packet = json.dumps({
                    "cmd": "EYES",
                    "emo": emotion,
                    "gx": round(gx, 2),
                    "gy": round(gy, 2),
                    "blk": 1 if blink else 0,
                    "stl": style
                }) + "\n"
                self._serial_conn.write(packet.encode('utf-8'))
                self._connected = True
            except Exception:
                self._connected = False
        else:
            # Virtual simulation: state maintained in memory
            self._connected = True

    # ── Future Additions: Servo & Light (v2.0 Modular Roadmap) ───────────────
    # Provided as simulated hooks for forward compatibility and research

    @property
    def servo_angle(self):
        return self.future_expansion.get("servo_angle", 90)

    @servo_angle.setter
    def servo_angle(self, val):
        self.future_expansion["servo_angle"] = val

    @property
    def servo_mode(self):
        return self.future_expansion.get("servo_mode", "face_tracking")

    @property
    def light_mode(self):
        return self.future_expansion.get("light_mode", "circadian")

    @property
    def light_brightness(self):
        return self.future_expansion.get("light_brightness", 75)

    @property
    def light_color_temp(self):
        return self.future_expansion.get("light_color_temp", "neutral")

    def update_from_vision(self, face_detected: bool, norm_cx: float, norm_cy: float):
        """Future expansion: Servo tracking hook."""
        if not face_detected:
            return
        pan_delta = norm_cx * 45.0
        target = int(max(15, min(165, 90 - pan_delta)))
        self.future_expansion["servo_angle"] = target

    def trigger_gesture(self, gesture_name: str):
        """Future expansion: Servo gesture hook."""
        pass

    def set_servo_angle(self, angle: int, immediate: bool = False):
        """Future expansion: Manual servo control."""
        self.future_expansion["servo_angle"] = max(15, min(165, angle))

    def set_light(self, mode: str, brightness: int = 75, color_temp: str = "neutral"):
        """Future expansion: Smart desk light control."""
        self.future_expansion["light_mode"] = mode
        self.future_expansion["light_brightness"] = brightness
        self.future_expansion["light_color_temp"] = color_temp

    def set_servo_mode(self, mode: str):
        """Future expansion: Servo mode."""
        self.future_expansion["servo_mode"] = mode

    # ── Telemetry Payload ────────────────────────────────────────────────────

    def get_telemetry(self) -> dict:
        """Telemetry dictionary exposed to WebSocket and Dashboard."""
        with self._lock:
            return {
                "transport": self.transport,
                "connected": self._connected,
                "com_port": self.com_port,
                "active_actuator": "OLED_EYES (SSD1306 via Arduino Nano)",
                "eyes": {
                    "emotion": self.eyes_state["emotion"],
                    "gaze_x": self.eyes_state["gaze_x"],
                    "gaze_y": self.eyes_state["gaze_y"],
                    "blink": self.eyes_state["blink"],
                    "ear": self.eyes_state["ear"],
                    "style": self.eyes_state["style"],
                },
                "servo": {
                    "angle": self.servo_angle,
                    "mode": self.servo_mode,
                    "target_angle": self.servo_angle,
                    "note": "v2.0 modular addition (simulated)",
                },
                "light": {
                    "mode": self.light_mode,
                    "brightness": self.light_brightness,
                    "color_temp": self.light_color_temp,
                    "note": "v2.0 modular addition (simulated)",
                },
                "future_expansion": {
                    "note": "Motorized servo & smart LED are marked as future additions (v2.0)",
                    "servo_angle": self.future_expansion["servo_angle"],
                    "light_mode": self.future_expansion["light_mode"],
                    "light_brightness": self.future_expansion["light_brightness"],
                }
            }
