"""
face_detector.py — Real-time face emotion detection using DeepFace + MediaPipe FaceMesh.

Uses:
  - MediaPipe FaceMesh for 468 facial landmarks
  - DeepFace (FER2013 backend) for 7-class emotion classification on the face ROI
"""

import cv2
import numpy as np
import mediapipe as mp
import threading
import time

try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    DEEPFACE_AVAILABLE = False
    print("[face_detector] DeepFace not available — using mock emotion")

mp_face_mesh = mp.solutions.face_mesh

# Emotion label mapping (DeepFace → EMOTIA labels)
EMOTION_MAP = {
    "angry":     "frustrated",
    "disgust":   "frustrated",
    "fear":      "stressed",
    "happy":     "happy",
    "sad":       "stressed",
    "surprise":  "neutral",
    "neutral":   "neutral",
}


class FaceDetector:
    def __init__(self):
        self._face_mesh = mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

        # Latest results (updated by background thread)
        self._lock = threading.Lock()
        self._result = {
            "detected": False,
            "emotion": "neutral",
            "raw_emotion": "neutral",
            "confidence": 0.0,
            "probabilities": {},
            "landmarks_count": 0,
            "face_bbox": None,
        }

        # DeepFace runs every N frames (expensive on CPU)
        self._frame_count = 0
        self._deepface_interval = 8   # run DeepFace every 8 frames (~3–4 FPS at 30 FPS)
        self._deepface_result = {}
        self._deepface_thread = None
        self._deepface_running = False

    def _run_deepface(self, face_img):
        """Run DeepFace in a background thread (non-blocking)."""
        if not DEEPFACE_AVAILABLE or face_img is None or face_img.size == 0:
            return
        try:
            result = DeepFace.analyze(
                face_img,
                actions=["emotion"],
                enforce_detection=False,
                detector_backend="opencv",
                silent=True,
            )
            emotions = result[0]["emotion"]
            dominant = result[0]["dominant_emotion"]
            conf = emotions.get(dominant, 0) / 100.0
            with self._lock:
                self._deepface_result = {
                    "raw_emotion": dominant,
                    "emotion": EMOTION_MAP.get(dominant, "neutral"),
                    "confidence": round(conf, 3),
                    "probabilities": {
                        EMOTION_MAP.get(k, k): round(v / 100, 3)
                        for k, v in emotions.items()
                    },
                }
        except Exception as e:
            pass  # silently ignore DeepFace errors on bad frames
        finally:
            self._deepface_running = False

    def process_frame(self, frame_bgr) -> dict:
        """Process a single BGR frame. Returns detection result dict."""
        self._frame_count += 1
        rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        mesh_result = self._face_mesh.process(rgb)

        if not mesh_result.multi_face_landmarks:
            with self._lock:
                self._result = {**self._result, "detected": False, "landmarks_count": 0}
            return self._result.copy()

        # Face detected — extract landmarks
        landmarks = mesh_result.multi_face_landmarks[0].landmark
        h, w = frame_bgr.shape[:2]

        # Bounding box from landmarks
        xs = [lm.x * w for lm in landmarks]
        ys = [lm.y * h for lm in landmarks]
        x1, y1 = max(0, int(min(xs)) - 10), max(0, int(min(ys)) - 10)
        x2, y2 = min(w, int(max(xs)) + 10), min(h, int(max(ys)) + 10)

        face_roi = frame_bgr[y1:y2, x1:x2]

        # Trigger DeepFace on interval (non-blocking)
        if (self._frame_count % self._deepface_interval == 0
                and not self._deepface_running
                and face_roi.size > 0):
            self._deepface_running = True
            t = threading.Thread(target=self._run_deepface, args=(face_roi.copy(),), daemon=True)
            t.start()

        # Merge latest deepface result
        with self._lock:
            dr = self._deepface_result
            self._result = {
                "detected": True,
                "emotion":        dr.get("emotion", "neutral"),
                "raw_emotion":    dr.get("raw_emotion", "neutral"),
                "confidence":     dr.get("confidence", 0.5),
                "probabilities":  dr.get("probabilities", {}),
                "landmarks_count": len(landmarks),
                "face_bbox":      [x1, y1, x2, y2],
                "landmarks":      landmarks,   # full landmark list for eye_fatigue
            }

        return self._result.copy()

    def release(self):
        self._face_mesh.close()
