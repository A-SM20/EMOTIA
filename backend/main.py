"""
main.py — FastAPI WebSocket server for EMOTIA real-time emotion pipeline.

Endpoints:
  GET  /health     → health check
  WS   /ws         → streams live emotion JSON every 500ms

Run:
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import asyncio
import json
import time
import threading
import cv2
import numpy as np
from typing import Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from face_detector import FaceDetector
from eye_fatigue import EyeFatigueDetector
from speech_emotion import SpeechEmotionDetector
from fusion import fuse

# ── App Setup ────────────────────────────────────────────────────────────────
app = FastAPI(title="EMOTIA Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global Detectors ─────────────────────────────────────────────────────────
face_detector   = FaceDetector()
eye_fatigue     = EyeFatigueDetector()
speech_detector = SpeechEmotionDetector()

# ── Shared State (updated by camera thread) ───────────────────────────────────
_state_lock  = threading.Lock()
_latest_state: dict = {
    "timestamp":   0,
    "emotion":     "neutral",
    "confidence":  0.5,
    "valence":     0.05,
    "arousal":     0.05,
    "face":        {},
    "speech":      {},
    "fatigue":     {},
    "sources":     {},
    "camera_ok":   False,
    "mic_ok":      False,
}

# ── Camera Capture Thread ─────────────────────────────────────────────────────
def _camera_loop():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[camera] Could not open webcam — face detection disabled")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 30)
    print("[camera] Webcam opened ✓")

    while True:
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.05)
            continue

        # Face emotion + landmarks
        face_res = face_detector.process_frame(frame)

        # Eye fatigue (only if face detected)
        fatigue_res = {"fatigue_score": 0.0, "ear": 0.3, "blink_rate": 15,
                       "perclos": 0.0, "alert": "alert", "in_blink": False}
        if face_res.get("detected") and face_res.get("landmarks"):
            fatigue_res = eye_fatigue.update(face_res["landmarks"])

        # Speech (latest from background thread)
        speech_res = speech_detector.get_result()

        # Fuse all signals
        fused = fuse(face_res, speech_res, fatigue_res)

        with _state_lock:
            _latest_state.update({
                "timestamp":  time.time(),
                "emotion":    fused["emotion"],
                "confidence": fused["confidence"],
                "valence":    fused["valence"],
                "arousal":    fused["arousal"],
                "face": {
                    "detected":    face_res.get("detected", False),
                    "emotion":     face_res.get("emotion", "neutral"),
                    "confidence":  face_res.get("confidence", 0.0),
                    "raw_emotion": face_res.get("raw_emotion", "neutral"),
                },
                "speech": {
                    "active":     speech_res.get("active", False),
                    "emotion":    speech_res.get("emotion", "neutral"),
                    "confidence": speech_res.get("confidence", 0.0),
                    "energy":     speech_res.get("energy", 0.0),
                },
                "fatigue": {
                    "score":      fatigue_res.get("fatigue_score", 0.0),
                    "ear":        fatigue_res.get("ear", 0.3),
                    "blink_rate": fatigue_res.get("blink_rate", 0),
                    "alert":      fatigue_res.get("alert", "alert"),
                },
                "sources":    fused.get("sources", {}),
                "camera_ok":  True,
                "mic_ok":     speech_res.get("active", False),
            })

    cap.release()


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    # Start microphone in background
    speech_detector.start()

    # Start camera loop in daemon thread
    t = threading.Thread(target=_camera_loop, daemon=True)
    t.start()
    print("[EMOTIA] Backend started ✓")


# ── REST Health Check ─────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    with _state_lock:
        return {
            "status":     "ok",
            "camera_ok":  _latest_state["camera_ok"],
            "mic_ok":     _latest_state["mic_ok"],
            "emotion":    _latest_state["emotion"],
            "confidence": _latest_state["confidence"],
        }


# ── WebSocket Connections ─────────────────────────────────────────────────────
_clients: Set[WebSocket] = set()

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    _clients.add(ws)
    print(f"[ws] Client connected ({len(_clients)} total)")
    try:
        while True:
            with _state_lock:
                payload = json.dumps(_latest_state)
            await ws.send_text(payload)
            await asyncio.sleep(0.5)   # broadcast every 500 ms
    except WebSocketDisconnect:
        _clients.discard(ws)
        print(f"[ws] Client disconnected ({len(_clients)} remaining)")
    except Exception as e:
        _clients.discard(ws)
        print(f"[ws] Error: {e}")
