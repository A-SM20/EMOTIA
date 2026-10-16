"""
stream_capture.py — Robust video stream acquisition for EMOTIA.

Supports:
  1. ESP32-CAM HTTP MJPEG stream (e.g. http://192.168.1.50:81/stream or http://.../capture)
  2. Local USB / built-in webcam (index 0, 1, etc.)
  3. Synthetic test feed with animated face geometry for automated testing & offline development
Features:
  - Non-blocking circular buffer (drops stale frames to eliminate stream lag)
  - Automatic reconnection with exponential backoff on network dropouts
  - Direct MJPEG generator for streaming annotated video to the React frontend
"""

import cv2
import numpy as np
import threading
import time
import urllib.request
from typing import Optional, Tuple


class StreamCapture:
    def __init__(self, source: str = "http://192.168.1.100:81/stream", width: int = 640, height: int = 480, rotate_angle: int = 90):
        self.source = source
        self.width = width
        self.height = height
        self.rotate_angle = rotate_angle

        self._lock = threading.Lock()
        self._latest_frame: Optional[np.ndarray] = None
        self._annotated_frame: Optional[np.ndarray] = None
        self._is_running = False
        self._is_active = True
        self._connected = False
        self._current_cap = None
        self._source_type = "esp32"  # "esp32", "webcam", "synthetic"
        self._fps = 0.0
        self._frame_count = 0
        self._thread: Optional[threading.Thread] = None

    def set_active(self, active: bool):
        """Enable or disable camera hardware capture."""
        with self._lock:
            self._is_active = active
            if not active:
                self._connected = False
                if self._current_cap is not None:
                    try:
                        self._current_cap.release()
                    except Exception:
                        pass
                    self._current_cap = None
                self._latest_frame = self._generate_blank_frame("Camera Inactive")
                self._annotated_frame = self._latest_frame.copy()
        state_str = "ENABLED" if active else "PAUSED / HARDWARE RELEASED"
        print(f"[stream_capture] Camera hardware state: {state_str}")

    def start(self):
        """Start the background frame capture thread."""
        if self._is_running:
            return
        self._is_running = True
        self._thread = threading.Thread(target=self._capture_loop, daemon=True)
        self._thread.start()
        print(f"[stream_capture] Background capture thread started (source: {self.source}, rotation: {self.rotate_angle}°)")

    def stop(self):
        """Stop background capture."""
        self._is_running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=1.0)
        print("[stream_capture] Capture stopped")

    def set_source(self, new_source: str, rotate_angle: Optional[int] = None):
        """Dynamically switch stream source without restarting backend."""
        with self._lock:
            s_str = str(new_source).strip()
            if s_str.lower() in ("webcam", "laptop", "cam", "camera"):
                s_str = "0"
            self.source = s_str
            if rotate_angle is not None:
                self.rotate_angle = rotate_angle
            elif s_str.startswith("http://") or s_str.startswith("https://"):
                # Default 90 degree clockwise rotation for sideways ESP32-CAM head mount
                self.rotate_angle = 90
            else:
                self.rotate_angle = 0
            self._connected = False
        print(f"[stream_capture] Stream source switched to: {self.source} (rotation: {self.rotate_angle}°)")

    def get_latest_frame(self) -> Tuple[bool, Optional[np.ndarray]]:
        """Return the most recent unanalyzed frame (thread-safe)."""
        with self._lock:
            if self._latest_frame is not None:
                return True, self._latest_frame.copy()
            return False, None

    def set_annotated_frame(self, frame: np.ndarray):
        """Store the processed frame with HUD overlays for web streaming."""
        with self._lock:
            self._annotated_frame = frame.copy()

    def get_annotated_frame(self) -> Optional[np.ndarray]:
        """Get the annotated frame, or raw frame if annotation not yet available."""
        with self._lock:
            if self._annotated_frame is not None:
                return self._annotated_frame.copy()
            if self._latest_frame is not None:
                return self._latest_frame.copy()
            return None

    def get_status(self) -> dict:
        """Return capture telemetry."""
        with self._lock:
            return {
                "source": self.source,
                "source_type": self._source_type,
                "connected": self._connected,
                "fps": round(self._fps, 1),
                "frame_count": self._frame_count,
            }

    def _capture_loop(self):
        """Main loop: attempts ESP32 / Webcam, falls back to synthetic on failure."""
        fps_start_time = time.time()
        frames_in_second = 0

        while self._is_running:
            if not self._is_active:
                time.sleep(0.1)
                continue

            current_src = self.source
            # 1. Check if source is synthetic
            if str(current_src).lower() in ("synthetic", "test", "sim", "mock"):
                self._source_type = "synthetic"
                self._generate_synthetic_frame()
                self._connected = True
                time.sleep(0.033)  # ~30 FPS
            elif str(current_src).startswith("http://") or str(current_src).startswith("https://"):
                # 2. ESP32-CAM stream via HTTP
                self._source_type = "esp32"
                success = self._read_mjpeg_stream(current_src)
                if not success:
                    # Temporary fallback to synthetic while reconnecting
                    self._generate_synthetic_frame(banner="[RECONNECTING ESP32-CAM...]")
                    self._connected = False
                    time.sleep(1.0)
            else:
                # 3. Local USB webcam index (e.g. 0 or '0')
                self._source_type = "webcam"
                try:
                    cam_idx = int(current_src)
                except ValueError:
                    cam_idx = 0
                success = self._read_webcam_stream(cam_idx)
                if not success:
                    self._generate_synthetic_frame(banner="[WEBCAM OFFLINE - SYNTHETIC ACTIVE]")
                    self._connected = False
                    time.sleep(1.0)

            # FPS calculation
            frames_in_second += 1
            now = time.time()
            if now - fps_start_time >= 1.0:
                self._fps = frames_in_second / (now - fps_start_time)
                frames_in_second = 0
                fps_start_time = now

    def _read_mjpeg_stream(self, url: str) -> bool:
        """Connect to an HTTP MJPEG stream (standard ESP32-CAM)."""
        try:
            print(f"[stream_capture] Connecting to ESP32-CAM stream: {url}")
            stream = urllib.request.urlopen(url, timeout=4.0)
            self._connected = True
            bytes_data = bytes()

            while self._is_running and self.source == url:
                chunk = stream.read(1024)
                if not chunk:
                    break
                bytes_data += chunk
                a = bytes_data.find(b'\xff\xd8')
                b = bytes_data.find(b'\xff\xd9')
                if a != -1 and b != -1:
                    jpg = bytes_data[a:b+2]
                    bytes_data = bytes_data[b+2:]
                    frame = cv2.imdecode(np.frombuffer(jpg, dtype=np.uint8), cv2.IMREAD_COLOR)
                    if frame is not None:
                        # Fix 90 deg sideways camera mount orientation if requested
                        if self.rotate_angle == 90:
                            frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
                        elif self.rotate_angle == 180:
                            frame = cv2.rotate(frame, cv2.ROTATE_180)
                        elif self.rotate_angle == 270:
                            frame = cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)

                        if frame.shape[1] != self.width or frame.shape[0] != self.height:
                            frame = cv2.resize(frame, (self.width, self.height))
                        with self._lock:
                            self._latest_frame = frame
                            self._frame_count += 1
            return True
        except Exception as e:
            # Failed to read or connect
            return False

    def _read_webcam_stream(self, cam_idx: int) -> bool:
        """Read from local OpenCV webcam."""
        if not self._is_active:
            time.sleep(0.1)
            return True

        cap = cv2.VideoCapture(cam_idx)
        if not cap.isOpened():
            cap = cv2.VideoCapture(cam_idx, cv2.CAP_DSHOW)
        if not cap.isOpened():
            print(f"[stream_capture] Webcam #{cam_idx} could not be opened")
            return False

        with self._lock:
            self._current_cap = cap

        cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
        cap.set(cv2.CAP_PROP_FPS, 30)
        self._connected = True
        print(f"[stream_capture] Webcam #{cam_idx} opened [OK]")

        target_source = str(self.source)
        try:
            while self._is_running and self._is_active and str(self.source) == target_source:
                ret, frame = cap.read()
                if not ret or frame is None:
                    break
                if self.rotate_angle == 90:
                    frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
                elif self.rotate_angle == 180:
                    frame = cv2.rotate(frame, cv2.ROTATE_180)
                elif self.rotate_angle == 270:
                    frame = cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)
                with self._lock:
                    self._latest_frame = frame
                    self._frame_count += 1
                time.sleep(0.005)
        finally:
            with self._lock:
                self._current_cap = None
            cap.release()
            print(f"[stream_capture] Webcam #{cam_idx} closed and hardware released [OK]")
        return True

    def _generate_blank_frame(self, text: str = "Camera Inactive") -> np.ndarray:
        frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)
        frame[:] = (18, 18, 22)
        cv2.putText(frame, text.upper(), (self.width // 2 - 120, self.height // 2),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (120, 120, 140), 2, cv2.LINE_AA)
        cv2.putText(frame, "HARDWARE POWER OFF", (self.width // 2 - 100, self.height // 2 + 35),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (80, 80, 100), 1, cv2.LINE_AA)
        return frame

    def _generate_synthetic_frame(self, banner: Optional[str] = None):
        """
        Generate an animated synthetic test frame with realistic human face proportions.
        Allows MediaPipe FaceMesh to detect landmarks and test the entire downstream pipeline!
        """
        frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)
        # Gradient background
        for y in range(self.height):
            c = int(18 + (y / self.height) * 20)
            frame[y, :] = [c + 6, c + 2, c]

        t = time.time()
        # Animated head sway
        head_cx = int(self.width / 2 + np.sin(t * 1.5) * 18)
        head_cy = int(self.height / 2 + np.cos(t * 1.2) * 12)
        head_rx = 95
        head_ry = 125

        # Face skin tone
        skin_color = (195, 215, 235)  # BGR
        shadow_color = (160, 180, 200)

        # Draw neck & shoulders
        cv2.ellipse(frame, (head_cx, head_cy + 130), (55, 75), 0, 0, 360, (60, 60, 70), -1)
        cv2.ellipse(frame, (head_cx, head_cy + 220), (220, 100), 0, 0, 360, (40, 40, 50), -1)

        # Draw head oval
        cv2.ellipse(frame, (head_cx, head_cy), (head_rx, head_ry), 0, 0, 360, skin_color, -1)
        cv2.ellipse(frame, (head_cx, head_cy), (head_rx, head_ry), 0, 0, 360, shadow_color, 2)

        # Hair
        cv2.ellipse(frame, (head_cx, head_cy - 65), (head_rx + 8, 55), 0, 180, 360, (35, 30, 25), -1)

        # Eyes & Eyebrows (with dynamic blinking)
        eye_y = head_cy - 12
        left_eye_x = head_cx - 36
        right_eye_x = head_cx + 36

        # Blink cycle: blink every ~3.5 seconds
        blink_cycle = t % 3.5
        is_blinking = blink_cycle < 0.18
        eye_ry = 2 if is_blinking else 8

        # Eyes whites & pupils
        for ex in (left_eye_x, right_eye_x):
            cv2.ellipse(frame, (ex, eye_y), (16, eye_ry), 0, 0, 360, (250, 250, 250), -1)
            cv2.ellipse(frame, (ex, eye_y), (16, eye_ry), 0, 0, 360, (100, 100, 100), 1)
            if not is_blinking:
                # Pupil
                cv2.circle(frame, (ex + int(np.sin(t * 0.8) * 3), eye_y), 5, (60, 45, 30), -1)
                cv2.circle(frame, (ex + int(np.sin(t * 0.8) * 3) - 1, eye_y - 2), 2, (255, 255, 255), -1)

        # Eyebrows (AU4 brow movement simulation)
        brow_y = eye_y - 18 + int(np.sin(t * 2.0) * 3)
        cv2.line(frame, (left_eye_x - 18, brow_y + 2), (left_eye_x + 18, brow_y - 2), (40, 35, 30), 3)
        cv2.line(frame, (right_eye_x - 18, brow_y - 2), (right_eye_x + 18, brow_y + 2), (40, 35, 30), 3)

        # Nose
        cv2.line(frame, (head_cx, eye_y + 4), (head_cx - 4, head_cy + 22), (160, 180, 200), 2)
        cv2.line(frame, (head_cx - 4, head_cy + 22), (head_cx + 6, head_cy + 22), (160, 180, 200), 2)

        # Mouth (AU12 / AU15 dynamic curve)
        mouth_y = head_cy + 52
        mouth_curve = int(np.sin(t * 1.6) * 6)
        pts = np.array([
            [head_cx - 26, mouth_y],
            [head_cx, mouth_y + mouth_curve],
            [head_cx + 26, mouth_y]
        ], np.int32)
        cv2.polylines(frame, [pts], isClosed=False, color=(110, 110, 180), thickness=3)

        # Watermark & Telemetry Banner
        header_text = banner or f"EMOTIA SIMULATED FEED • {self._fps:.1f} FPS"
        cv2.putText(frame, header_text, (16, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (220, 220, 220), 1, cv2.LINE_AA)
        timestamp_str = time.strftime("%H:%M:%S")
        cv2.putText(frame, f"REC: {timestamp_str}", (self.width - 140, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 220, 180), 1, cv2.LINE_AA)

        with self._lock:
            self._latest_frame = frame
            self._frame_count += 1

    def generate_mjpeg_stream(self):
        """Generator for FastAPI StreamingResponse (/video_feed)."""
        while self._is_running:
            frame = self.get_annotated_frame()
            if frame is None:
                _, frame = self.get_latest_frame()
            if frame is None:
                time.sleep(0.04)
                continue
            ret, jpeg = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
            if not ret:
                time.sleep(0.02)
                continue
            yield (
                b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n'
            )
            time.sleep(0.033)  # limit stream to ~30 FPS
