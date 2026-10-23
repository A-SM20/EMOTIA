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
import socket
import threading
import urllib.request
import urllib.parse
from typing import Dict, Optional

try:
    import serial
    SERIAL_AVAILABLE = True
except ImportError:
    SERIAL_AVAILABLE = False


def find_esp32_port() -> Optional[str]:
    """Scan for CH340, CP210x, FTDI, or USB Serial COM ports."""
    if not SERIAL_AVAILABLE:
        return None
    try:
        import serial.tools.list_ports
        ports = list(serial.tools.list_ports.comports())
        for p in ports:
            desc = (p.description or "").lower()
            if "ch340" in desc or "cp210" in desc or "usb-serial" in desc or "uart" in desc:
                return p.device
        for p in ports:
            desc = (p.description or "").lower()
            if ("usb" in desc or "serial" in desc) and "bluetooth" not in desc:
                return p.device
    except Exception:
        pass
    return None


class HardwareController:
    @staticmethod
    def list_ports():
        if not SERIAL_AVAILABLE:
            return []
        try:
            import serial.tools.list_ports
            return [{"port": p.device, "desc": p.description} for p in serial.tools.list_ports.comports()]
        except Exception:
            return []

    def __init__(self, transport: str = "sim", com_port: str = "COM6", esp32_ip: str = "10.150.189.243"):
        self.transport = transport          # "sim", "serial", "wifi", "http"
        self.com_port = com_port or find_esp32_port() or "COM6"
        self.esp32_ip = esp32_ip
        self.baud_rate = 115200
        self.udp_port = 8888
        self._udp_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

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
            "style": "neutral",
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
        """Initialize serial connection to Arduino Nano or ESP32."""
        if not SERIAL_AVAILABLE:
            print("[hardware] pySerial not available — falling back to virtual simulation")
            self.transport = "sim"
            return
        port_to_try = self.com_port or find_esp32_port() or "COM6"
        try:
            self._serial_conn = serial.Serial(port_to_try, self.baud_rate, timeout=0.2)
            self._connected = True
            self.com_port = port_to_try
            print(f"[hardware] Opened Serial connection to Robot Eyes: {self.com_port} [OK]")
        except Exception as e:
            # If default port failed, try auto-detect
            detected = find_esp32_port()
            if detected and detected != port_to_try:
                try:
                    self._serial_conn = serial.Serial(detected, self.baud_rate, timeout=0.2)
                    self._connected = True
                    self.com_port = detected
                    print(f"[hardware] Auto-detected & Opened Serial connection: {detected} [OK]")
                    return
                except Exception:
                    pass
            print(f"[hardware] Could not open {port_to_try}: {e} (using virtual simulation)")
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
            "frustrated": "frustrated",
            "stressed": "stressed",
            "happy": "happy",
            "love": "love",
            "calm": "calm",
            "neutral": "neutral",
            "fatigued": "fatigued",
            "drowsy": "fatigued",
            "sleep": "sleep",
            "sad": "sad",
            "dizzy": "dizzy",
            "thinking": "thinking",
            "surprised": "surprised",
            "scan": "scan",
        }
        eye_style = style_map.get(emotion.lower(), "neutral")

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
        """Dispatch eye animation packet to ESP32 over Serial or Wi-Fi (UDP / HTTP)."""
        packet_dict = {
            "cmd": "EYES",
            "emo": emotion,
            "gx": round(gx, 2),
            "gy": round(gy, 2),
            "blk": 1 if blink else 0,
            "stl": style
        }
        packet_bytes = (json.dumps(packet_dict) + "\n").encode('utf-8')

        # 1. Serial Transport (USB Wired)
        if self.transport == "serial" and self._serial_conn and self._serial_conn.is_open:
            try:
                self._serial_conn.write(packet_bytes)
                self._connected = True
            except Exception:
                self._connected = False

        # 2. Wi-Fi Transport (UDP Datagram on port 8888 — Zero Latency, Real-time)
        elif self.transport in ("wifi", "http"):
            try:
                self._udp_sock.sendto(packet_bytes, (self.esp32_ip, self.udp_port))
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
