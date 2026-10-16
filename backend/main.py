"""
main.py — FastAPI Orchestration Server for EMOTIA Live Emotion & Hardware Pipeline.

Pipelines & Services:
  - Video Stream Ingestion (ESP32-CAM MJPEG / Webcam / Synthetic Feed)
  - Background Facial Perception (MediaPipe 468-pt Mesh, Action Units, 3D Head Pose)
  - Eye Fatigue & Ocular Telemetry (EAR, PERCLOS)
  - Speech Emotion Recognition (Wav2Vec2 / Prosody Energy)
  - Continual Learning Engine (Personal Baseline Calibration, Replay Buffer)
  - Context-Aware Engine (Cognitive Load Index, Proactive Policy Matrix)
  - Explainable AI Engine (Feature Attribution Breakdown, Natural Language Justifications)
  - Multi-Transport Hardware Controller (Servo Pan/Tilt & Gestures, Smart Desk Lighting)
  - Real-time WebSocket Telemetry & MJPEG Live Video Feed
"""

import os
os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

import asyncio
import json
import time
import threading
from typing import Set, Dict, Any, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from stream_capture import StreamCapture
from face_detector import FaceDetector
from eye_fatigue import EyeFatigueDetector
from speech_emotion import SpeechEmotionDetector
from continual_learning import ContinualLearningEngine
from context_engine import ContextAwareEngine
from xai_engine import XAIEngine
from hardware_controller import HardwareController
from fusion import fuse
from conversation_engine import ConversationEngine
from memory_engine import MemoryEngine

# ── App Setup ────────────────────────────────────────────────────────────────
app = FastAPI(title="EMOTIA Live Pipeline", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global Engines ───────────────────────────────────────────────────────────
stream_capture  = StreamCapture(source="synthetic", width=640, height=480)
face_detector   = FaceDetector()
eye_fatigue     = EyeFatigueDetector()
speech_detector = SpeechEmotionDetector()
cl_engine       = ContinualLearningEngine(user_id="ID_ALEX_01")
context_engine  = ContextAwareEngine()
xai_engine      = XAIEngine()
hardware_ctrl   = HardwareController(transport="sim")
conv_engine     = ConversationEngine()
memory_engine   = MemoryEngine()

# ── Global Shared Telemetry State ────────────────────────────────────────────
_state_lock = threading.Lock()
_latest_state: Dict[str, Any] = {
    "timestamp": 0,
    "emotion": "neutral",
    "confidence": 0.5,
    "valence": 0.05,
    "arousal": 0.05,
    "face": {
        "detected": False,
        "emotion": "neutral",
        "confidence": 0.0,
        "action_units": {"AU4": 0.0, "AU12": 0.0, "AU15": 0.0, "AU7": 0.0, "AU45": 0.0},
        "head_pose": {"pitch": 0.0, "yaw": 0.0, "roll": 0.0},
        "face_bbox": None,
        "face_center_norm": [0.0, 0.0],
        "latency_ms": 0.0,
    },
    "speech": {
        "active": False,
        "emotion": "neutral",
        "confidence": 0.0,
        "energy": 0.0,
    },
    "fatigue": {
        "score": 0.0,
        "ear": 0.30,
        "blink_rate": 15,
        "alert": "alert",
    },
    "continual_learning": {},
    "context": {},
    "xai": {},
    "hardware": {},
    "stream": {},
    "camera_ok": True,
    "mic_ok": False,
}


# ── Background Pipeline Orchestrator Thread ──────────────────────────────────
def _pipeline_orchestrator():
    """
    Continuous worker thread executing the end-to-end perception, learning,
    reasoning, and actuation loop.
    """
    print("[orchestrator] EMOTIA live pipeline orchestrator started [OK]")
    stream_capture.start()

    while True:
        ret, frame = stream_capture.get_latest_frame()
        if not ret or frame is None:
            time.sleep(0.015)
            continue

        # 1. Vision Processing (MediaPipe FaceMesh + Action Units + 3D Pose)
        face_res, annotated_frame = face_detector.process_frame(frame, draw_overlay=True)
        stream_capture.set_annotated_frame(annotated_frame)

        # 2. Eye Fatigue Telemetry
        fatigue_res = {
            "fatigue_score": 0.0,
            "ear": 0.30,
            "blink_rate": 15,
            "perclos": 0.0,
            "alert": "alert",
            "in_blink": False,
        }
        if face_res.get("detected") and face_res.get("landmarks"):
            fatigue_res = eye_fatigue.update(face_res["landmarks"])

        # 3. Continual Learning: Baseline Calibration & Feature Normalization
        au = face_res.get("action_units", {})
        ear = fatigue_res.get("ear", 0.30)
        is_neutral = (face_res.get("emotion") in ("neutral", "calm")) and (au.get("AU4", 0) < 0.25)
        cl_engine.update_baseline(au, ear, is_neutral_context=is_neutral)
        calibrated_au = cl_engine.calibrate_features(au)
        cl_telemetry = cl_engine.get_telemetry()

        # 4. Speech Emotion Recognition
        speech_res = speech_detector.get_result()

        # 5. Multimodal Affect Fusion
        fused = fuse(face_res, speech_res, fatigue_res)

        # 6. Context-Aware Decision Engine (Cognitive Load & Proactive Policy)
        context_res = context_engine.evaluate(fused, fatigue_res, au)

        # 7. Hardware Actuation: Drive Arduino Nano 0.96" OLED Animated Eyes
        norm_cx, norm_cy = face_res.get("face_center_norm", [0.0, 0.0])
        is_blinking = fatigue_res.get("in_blink", False) or (au.get("AU45", 0.0) > 0.5)
        hardware_ctrl.update_eyes(
            emotion=fused["emotion"],
            gaze_x=norm_cx,
            gaze_y=norm_cy,
            is_blinking=is_blinking,
            ear=fatigue_res.get("ear", 0.30)
        )

        hw_telemetry = hardware_ctrl.get_telemetry()

        # 8. Explainable AI (XAI) Attribution & Natural Language Justifications
        xai_res = xai_engine.generate_explanation(
            fused, face_res, speech_res, fatigue_res, context_res, cl_telemetry
        )

        # 9. Update Atomic Shared State
        with _state_lock:
            _latest_state.update({
                "timestamp": time.time(),
                "emotion": fused["emotion"],
                "confidence": fused["confidence"],
                "valence": fused["valence"],
                "arousal": fused["arousal"],
                "face": {
                    "detected": face_res.get("detected", False),
                    "emotion": face_res.get("emotion", "neutral"),
                    "confidence": face_res.get("confidence", 0.0),
                    "raw_emotion": face_res.get("raw_emotion", "neutral"),
                    "action_units": au,
                    "calibrated_action_units": calibrated_au,
                    "head_pose": face_res.get("head_pose", {}),
                    "face_bbox": face_res.get("face_bbox"),
                    "face_center_norm": face_res.get("face_center_norm", [0.0, 0.0]),
                    "probabilities": face_res.get("probabilities", {}),
                    "latency_ms": face_res.get("latency_ms", 0.0),
                },
                "speech": {
                    "active": speech_res.get("active", False),
                    "emotion": speech_res.get("emotion", "neutral"),
                    "confidence": speech_res.get("confidence", 0.0),
                    "energy": speech_res.get("energy", 0.0),
                    "probabilities": speech_res.get("probabilities", {}),
                },
                "fatigue": {
                    "score": fatigue_res.get("fatigue_score", 0.0),
                    "ear": fatigue_res.get("ear", 0.30),
                    "blink_rate": fatigue_res.get("blink_rate", 0),
                    "perclos": fatigue_res.get("perclos", 0.0),
                    "alert": fatigue_res.get("alert", "alert"),
                },
                "continual_learning": cl_telemetry,
                "context": context_res,
                "xai": xai_res,
                "hardware": hw_telemetry,
                "stream": stream_capture.get_status(),
                "camera_ok": stream_capture.get_status().get("connected", False),
                "mic_ok": speech_res.get("active", False),
            })

        time.sleep(0.015)  # yield slice (~40–50 Hz pipeline cadence)


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    # Start microphone capture
    speech_detector.start()

    # Launch pipeline orchestrator in daemon thread
    t = threading.Thread(target=_pipeline_orchestrator, daemon=True)
    t.start()
    print("[EMOTIA] All live engines initialized and running [OK]")


# ── REST API Endpoints ────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Health check for all subsystems."""
    with _state_lock:
        return {
            "status": "ok",
            "camera_ok": _latest_state["camera_ok"],
            "mic_ok": _latest_state["mic_ok"],
            "emotion": _latest_state["emotion"],
            "confidence": _latest_state["confidence"],
            "stream": _latest_state.get("stream", {}),
            "hardware": _latest_state.get("hardware", {}),
        }


@app.get("/api/stream/feed")
@app.get("/video_feed")
async def video_feed():
    """Live MJPEG video stream with HUD overlays for web display."""
    return StreamingResponse(
        stream_capture.generate_mjpeg_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


class StreamConfigRequest(BaseModel):
    source: str  # URL or '0' or 'synthetic'
    rotate_angle: Optional[int] = None


@app.post("/api/stream/config")
async def config_stream(req: StreamConfigRequest):
    """Switch stream source (e.g. ESP32-CAM URL, local webcam, synthetic)."""
    stream_capture.set_source(req.source, req.rotate_angle)
    return {"status": "ok", "source": req.source, "rotation": stream_capture.rotate_angle}


class HardwareControlRequest(BaseModel):
    servo_angle: Optional[int] = None
    servo_mode: Optional[str] = None      # 'face_tracking', 'gesture', 'both', 'manual'
    gesture: Optional[str] = None         # 'nod', 'tilt', 'shake'
    light_mode: Optional[str] = None      # 'circadian', 'warm_focus', 'alert', 'custom'
    light_brightness: Optional[int] = None
    light_color_temp: Optional[str] = None # 'warm_amber', 'daylight', 'neutral'


@app.post("/api/hardware/control")
async def control_hardware(req: HardwareControlRequest):
    """Manually command or configure servo and light actuators."""
    if req.servo_mode:
        hardware_ctrl.set_servo_mode(req.servo_mode)
    if req.servo_angle is not None:
        hardware_ctrl.set_servo_angle(req.servo_angle, immediate=True)
    if req.gesture:
        hardware_ctrl.trigger_gesture(req.gesture)
    if req.light_mode or req.light_brightness is not None or req.light_color_temp:
        hardware_ctrl.set_light(
            req.light_mode or hardware_ctrl.light_mode,
            req.light_brightness if req.light_brightness is not None else hardware_ctrl.light_brightness,
            req.light_color_temp or hardware_ctrl.light_color_temp
        )
    return {"status": "ok", "hardware": hardware_ctrl.get_telemetry()}


class EyeControlRequest(BaseModel):
    emotion: Optional[str] = None
    gaze_x: Optional[float] = None
    gaze_y: Optional[float] = None
    blink: Optional[bool] = None


@app.post("/api/hardware/eyes")
async def control_eyes(req: EyeControlRequest):
    """Command Arduino Nano 0.96" OLED eye expressions and gaze direction."""
    hardware_ctrl.update_eyes(
        emotion=req.emotion or hardware_ctrl.eyes_state["emotion"],
        gaze_x=req.gaze_x if req.gaze_x is not None else hardware_ctrl.eyes_state["gaze_x"],
        gaze_y=req.gaze_y if req.gaze_y is not None else hardware_ctrl.eyes_state["gaze_y"],
        is_blinking=req.blink if req.blink is not None else False
    )
    return {"status": "ok", "eyes": hardware_ctrl.eyes_state}


class HardwareTransportRequest(BaseModel):
    transport: str  # 'sim', 'http', 'serial'
    esp32_ip: Optional[str] = None
    com_port: Optional[str] = None


@app.post("/api/hardware/transport")
async def config_hardware_transport(req: HardwareTransportRequest):
    """Update hardware communication transport."""
    hardware_ctrl.set_transport(req.transport, req.esp32_ip, req.com_port)
    return {"status": "ok", "hardware": hardware_ctrl.get_telemetry()}


class ContextRequest(BaseModel):
    task: str
    app: str
    details: Optional[str] = None


@app.post("/api/context/set")
async def set_context(req: ContextRequest):
    """Update active task & application context."""
    context_engine.set_context(req.task, req.app, req.details)
    return {"status": "ok", "context": context_engine.current_state}


class FeedbackRequest(BaseModel):
    corrected_emotion: str


@app.post("/api/cl/feedback")
async def submit_feedback(req: FeedbackRequest):
    """Submit user correction to adapt Continual Learning priors."""
    with _state_lock:
        raw_feat = _latest_state.get("face", {}).get("action_units", {})
    cl_engine.apply_user_feedback(req.corrected_emotion, raw_feat)
    return {"status": "ok", "telemetry": cl_engine.get_telemetry()}


# ── Conversational Reasoning & Memory API ────────────────────────────────────

class ChatMessageRequest(BaseModel):
    message: str
    user_profile: Optional[Dict[str, Any]] = None


@app.post("/api/chat/message")
async def chat_message(req: ChatMessageRequest):
    """Context-aware conversational reasoning guided by real-time emotion & cognitive state."""
    with _state_lock:
        current_emotion = {
            "emotion": _latest_state.get("emotion", "calm"),
            "confidence": _latest_state.get("confidence", 0.8),
            "valence": _latest_state.get("valence", 0.0),
            "arousal": _latest_state.get("arousal", 0.0),
        }
        fatigue_data = _latest_state.get("fatigue", {})
        context_data = _latest_state.get("context", {})

    memories = memory_engine.query_memories(req.message, top_k=2)

    resp = conv_engine.generate_response(
        user_message=req.message,
        emotion_state=current_emotion,
        fatigue_state=fatigue_data,
        context_state=context_data,
        user_profile=req.user_profile,
        retrieved_memories=memories,
    )

    # Automatically record episode to long-term memory if emotional intensity is notable
    if current_emotion["emotion"] in ("frustrated", "stressed", "happy"):
        memory_engine.add_episode(
            task=context_data.get("activeTask", "Autonomous Workspace"),
            app=context_data.get("activeApp", "Active Environment"),
            emotion=current_emotion["emotion"],
            cli=context_data.get("cognitiveLoadIndex", 60),
            summary=f"User: '{req.message[:50]}' | Reply: '{resp['reply'][:50]}'",
            intervention=resp["recommendation"]
        )

    return {"status": "ok", "response": resp}


@app.get("/api/memory/list")
async def get_memories():
    """Fetch long-term episodic memory & learned user preferences."""
    data = memory_engine.load_data()
    return {"status": "ok", "memories": data}


class MemoryNoteRequest(BaseModel):
    task: str
    app: str
    emotion: str
    cli: Optional[int] = 50
    summary: str
    intervention: Optional[str] = "Logged note"


@app.post("/api/memory/note")
async def add_memory_note(req: MemoryNoteRequest):
    """Add an episodic memory entry."""
    ep = memory_engine.add_episode(
        req.task, req.app, req.emotion, req.cli, req.summary, req.intervention
    )
    return {"status": "ok", "episode": ep}


# ── WebSocket Real-Time Broadcast ────────────────────────────────────────────
_clients: Set[WebSocket] = set()

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """Streams live comprehensive telemetry to connected frontend dashboards."""
    await ws.accept()
    _clients.add(ws)
    print(f"[ws] Dashboard client connected ({len(_clients)} total)")
    try:
        while True:
            with _state_lock:
                payload = json.dumps(_latest_state)
            await ws.send_text(payload)
            await asyncio.sleep(0.15)  # broadcast every 150ms (~7 Hz smooth updates)
    except WebSocketDisconnect:
        _clients.discard(ws)
        print(f"[ws] Dashboard client disconnected ({len(_clients)} remaining)")
    except Exception as e:
        _clients.discard(ws)
        print(f"[ws] Error: {e}")
