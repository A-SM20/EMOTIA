"""
test_comprehensive.py — Full Empirical Validation Suite for EMOTIA Desk Assistant.
Covers Module A (Perception & Fusion), Module B (Context & Memory), and Module C (APIs, XAI, Hardware).
"""

import sys
import os
import time
import json
import sqlite3
import numpy as np

backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app
from stream_capture import StreamCapture
from face_detector import FaceDetector
from eye_fatigue import EyeFatigueDetector
from speech_emotion import SpeechEmotionDetector
from fusion import fuse, CIRCUMPLEX
from context_engine import ContextAwareEngine
from memory_engine import MemoryEngine
from conversation_engine import ConversationEngine
from xai_engine import XAIEngine
from hardware_controller import HardwareController
from continual_learning import ContinualLearningEngine


def run_full_validation():
    results = {
        "tests_run": 0,
        "passed": 0,
        "failed": 0,
        "blocked": 0,
        "details": [],
        "latencies": {},
    }

    def record(name, status, message="", evidence=None):
        results["tests_run"] += 1
        if status == "PASS":
            results["passed"] += 1
        elif status == "FAIL":
            results["failed"] += 1
        else:
            results["blocked"] += 1
        results["details"].append({
            "name": name,
            "status": status,
            "message": message,
            "evidence": evidence
        })
        print(f"[{status}] {name}: {message}")

    print("=" * 70)
    print("EMOTIA COMPREHENSIVE AUTOMATED VERIFICATION SUITE")
    print("=" * 70)

    # ─────────────────────────────────────────────────────────────────────────
    # 1. STARTUP & DEPENDENCY AUDIT
    # ─────────────────────────────────────────────────────────────────────────
    try:
        import torch
        import transformers
        import cv2
        import mediapipe
        record("DEP-01: PyTorch & Transformers import", "PASS", f"torch={torch.__version__}, transformers={transformers.__version__}")
    except Exception as e:
        record("DEP-01: PyTorch & Transformers import", "FAIL", str(e))

    # ─────────────────────────────────────────────────────────────────────────
    # 2. MODULE A — EMOTION RECOGNITION & MULTIMODAL PERCEPTION
    # ─────────────────────────────────────────────────────────────────────────
    detector = FaceDetector()
    latencies = []

    # Case A1: Valid synthetic frame with face
    stream = StreamCapture(source="synthetic", width=640, height=480)
    stream.start()
    time.sleep(0.3)
    ret, frame = stream.get_latest_frame()
    stream.stop()

    if ret and frame is not None:
        for _ in range(25):
            t0 = time.perf_counter()
            res, annotated = detector.process_frame(frame, draw_overlay=True, person_name="Test User")
            latencies.append((time.perf_counter() - t0) * 1000)

        mean_lat = np.mean(latencies)
        p95_lat = np.percentile(latencies, 95)
        results["latencies"]["face_detection_mean_ms"] = round(mean_lat, 2)
        results["latencies"]["face_detection_p95_ms"] = round(p95_lat, 2)

        if res.get("detected") and "action_units" in res:
            record("MOD-A-01: Face detection & AU extraction", "PASS",
                   f"Mean Latency={mean_lat:.2f}ms, P95={p95_lat:.2f}ms, Emotion={res.get('emotion')}",
                   {"AUs": res.get("action_units"), "head_pose": res.get("head_pose")})
        else:
            record("MOD-A-01: Face detection & AU extraction", "FAIL", "Face not detected on synthetic test frame")
    else:
        record("MOD-A-01: Face detection & AU extraction", "FAIL", "Synthetic frame capture failed")

    # Case A2: Empty / Corrupted image handling
    try:
        corrupted_frame = np.zeros((0, 0, 0), dtype=np.uint8)
        res_c, _ = detector.process_frame(corrupted_frame)
        if not res_c.get("detected"):
            record("MOD-A-02: Corrupted frame safety guard", "PASS", "Gracefully returned detected=False on 0-dim frame")
        else:
            record("MOD-A-02: Corrupted frame safety guard", "FAIL", "Unexpected result on corrupted frame")
    except Exception as e:
        record("MOD-A-02: Corrupted frame safety guard", "FAIL", f"Unhandled exception: {e}")

    # Case A3: Blank black image (no face)
    blank_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    res_b, _ = detector.process_frame(blank_frame)
    if not res_b.get("detected") and res_b.get("landmarks_count") == 0:
        record("MOD-A-03: No face handling", "PASS", "Correctly reports detected=False and 0 landmarks")
    else:
        record("MOD-A-03: No face handling", "FAIL", f"Incorrectly detected face in black image: {res_b}")

    # Case A4: Eye fatigue & PERCLOS detection
    fatigue = EyeFatigueDetector()
    fake_landmarks = [type("LM", (), {"x": 0.5, "y": 0.5})() for _ in range(468)]
    f_res = fatigue.update(fake_landmarks)
    if "fatigue_score" in f_res and "ear" in f_res:
        record("MOD-A-04: Eye fatigue & ocular telemetry", "PASS", f"EAR={f_res['ear']}, Score={f_res['fatigue_score']}")
    else:
        record("MOD-A-04: Eye fatigue & ocular telemetry", "FAIL", "Missing required ocular telemetry fields")

    # Case A5: Speech emotion engine (Wav2Vec2)
    try:
        speech = SpeechEmotionDetector()
        sp_res = speech.get_result()
        if "emotion" in sp_res and "active" in sp_res:
            record("MOD-A-05: Speech Emotion Recognition (Wav2Vec2)", "PASS",
                   f"Active={sp_res['active']}, Emotion={sp_res['emotion']}, Energy={sp_res.get('energy')}")
        else:
            record("MOD-A-05: Speech Emotion Recognition (Wav2Vec2)", "FAIL", "Missing speech telemetry structure")
    except Exception as e:
        record("MOD-A-05: Speech Emotion Recognition (Wav2Vec2)", "FAIL", str(e))

    # Case A6: Multimodal late fusion combinations
    # Case A6.1: Agreement
    f1 = fuse({"detected": True, "emotion": "happy", "confidence": 0.90},
              {"active": True, "emotion": "happy", "confidence": 0.85},
              {"fatigue_score": 0.1, "alert": "alert"})
    # Case A6.2: Disagreement (Face frustrated, Speech happy)
    f2 = fuse({"detected": True, "emotion": "frustrated", "confidence": 0.85},
              {"active": True, "emotion": "happy", "confidence": 0.70},
              {"fatigue_score": 0.2, "alert": "alert"})
    # Case A6.3: Missing Vision
    f3 = fuse({"detected": False, "emotion": "neutral", "confidence": 0.0},
              {"active": True, "emotion": "stressed", "confidence": 0.80},
              {"fatigue_score": 0.2, "alert": "alert"})
    # Case A6.4: Missing Audio
    f4 = fuse({"detected": True, "emotion": "calm", "confidence": 0.88},
              {"active": False, "emotion": "neutral", "confidence": 0.0},
              {"fatigue_score": 0.1, "alert": "alert"})

    if f1["emotion"] == "happy" and f2["emotion"] == "frustrated" and f3["emotion"] == "stressed" and f4["emotion"] == "calm":
        record("MOD-A-06: Multimodal late fusion combinations", "PASS",
               f"Agreement={f1['emotion']}, Disagreement={f2['emotion']} (face dominant), AudioOnly={f3['emotion']}, VisionOnly={f4['emotion']}")
    else:
        record("MOD-A-06: Multimodal late fusion combinations", "FAIL", f"Unexpected fusion outputs: f1={f1}, f2={f2}, f3={f3}, f4={f4}")

    # ─────────────────────────────────────────────────────────────────────────
    # 3. MODULE B — CONTEXT REASONING & PERSONALIZED MEMORY
    # ─────────────────────────────────────────────────────────────────────────
    # Case B1: Cognitive Load Index & Proactive Policy
    ce = ContextAwareEngine()
    ce.set_context("Research • Paper Revision", "Overleaf LaTeX", "Section 4 Multimodal Fusion")
    ctx_res = ce.evaluate(
        {"emotion": "stressed", "valence": -0.7, "arousal": 0.8, "confidence": 0.85},
        {"fatigue_score": 0.65, "alert": "drowsy", "perclos": 0.35, "blink_rate": 8},
        {"AU4": 0.75, "AU15": 0.60}
    )
    if ctx_res["cognitiveLoadIndex"] >= 60 and "hardwareRecommendation" in ctx_res:
        record("MOD-B-01: Context-aware cognitive load & policy", "PASS",
               f"CLI={ctx_res['cognitiveLoadIndex']}%, State={ctx_res['workState']}, Action={ctx_res['proactiveAction']}")
    else:
        record("MOD-B-01: Context-aware cognitive load & policy", "FAIL", f"Unexpected context result: {ctx_res}")

    # Case B2: Memory Engine User Isolation & Relational Persistence
    test_db = os.path.join(backend_dir, "data", "test_memory_verify.db")
    test_json = os.path.join(backend_dir, "data", "test_memory_verify.json")
    if os.path.exists(test_db):
        os.remove(test_db)
    if os.path.exists(test_json):
        os.remove(test_json)

    mem_engine = MemoryEngine(storage_path=test_json, db_path=test_db)

    # Register User A
    user_a_metrics = {"valid": True, "vector": [0.32, 0.45, 0.28, 0.55]}
    user_a = mem_engine.identify_or_register_person(user_a_metrics)
    user_a_id = user_a["id"]
    mem_engine.update_person_profile(user_a_id, {
        "name": "Dr. Alex Vance",
        "role": "Lead Researcher",
        "notes": "Secret Note for User A: Prefers warm 2700K lighting and silent TTS during coding."
    })

    # Register User B with distinct geometric face signature (Euclidean distance >> 0.28)
    user_b_metrics = {"valid": True, "vector": [0.85, 0.90, 0.70, 0.95]}
    user_b = mem_engine.identify_or_register_person(user_b_metrics)
    user_b_id = user_b["id"]
    mem_engine.update_person_profile(user_b_id, {
        "name": "Prof. Gordon Freeman",
        "role": "Visiting Scientist",
        "notes": "Secret Note for User B: Prefers bright 5000K circadian lighting."
    })

    # Add episodic memories
    mem_engine.add_episode("PyTorch Debugging", "VS Code", "Frustrated", 85, "Debugging CUDA memory allocation error", "Suggested 5m break")
    mem_engine.add_episode("Paper Writing", "Overleaf", "Calm", 30, "Completed introduction draft", "Maintained silent monitoring")

    # Verify memory isolation
    data_snapshot = mem_engine.load_data()
    user_a_profile = data_snapshot["persons"].get(user_a_id, {})
    user_b_profile = data_snapshot["persons"].get(user_b_id, {})

    isolated = (user_a_id != user_b_id) and \
               ("Secret Note for User A" in user_a_profile.get("notes", "")) and \
               ("Secret Note for User A" not in user_b_profile.get("notes", "")) and \
               ("Secret Note for User B" in user_b_profile.get("notes", ""))

    # Verify SQLite tables
    conn = sqlite3.connect(test_db)
    cur = conn.cursor()
    cur.execute("SELECT count(*) FROM persons")
    db_persons_count = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM episodes")
    db_episodes_count = cur.fetchone()[0]
    conn.close()

    if isolated and db_persons_count >= 2 and db_episodes_count >= 2:
        record("MOD-B-02: Multi-user memory isolation & SQLite persistence", "PASS",
               f"UserA={user_a_id}, UserB={user_b_id}, DB Persons={db_persons_count}, DB Episodes={db_episodes_count}")
    else:
        record("MOD-B-02: Multi-user memory isolation & SQLite persistence", "FAIL",
               f"Isolation failed or SQLite mismatch: isolated={isolated}, db_persons={db_persons_count}")

    # Case B3: Conversational Reasoning Engine (Affect & Memory integration)
    conv = ConversationEngine()
    conv_res = conv.generate_response(
        user_message="Why does my code keep throwing out of memory errors?",
        emotion_state={"emotion": "frustrated", "confidence": 0.88, "valence": -0.6, "arousal": 0.75},
        fatigue_state={"alert": "alert"},
        context_state={"activeTask": "PyTorch Optimization", "activeApp": "VS Code", "cognitiveLoadIndex": 82},
        user_profile={"name": "Dr. Alex Vance", "preferredStyle": "Concise & Proactive"},
        retrieved_memories=[{"title": "CUDA OOM", "description": "Resolved by reducing batch size from 64 to 32"}]
    )
    if "reply" in conv_res and len(conv_res["reply"]) > 20 and conv_res["context_tag"]["emotion_state"] == "Frustrated":
        record("MOD-B-03: Affect-adaptive conversational response generation", "PASS",
               f"Engine={conv_res['engine']}, Recommendation={conv_res.get('recommendation', '')[:40]}...")
    else:
        record("MOD-B-03: Affect-adaptive conversational response generation", "FAIL", f"Unexpected response: {conv_res}")

    # ─────────────────────────────────────────────────────────────────────────
    # 4. MODULE C — BACKEND APIS, EXPLAINABILITY, HARDWARE & INTEGRATION
    # ─────────────────────────────────────────────────────────────────────────
    # Case C1: XAI Feature Attribution & Counterfactuals
    xai = XAIEngine()
    xai_res = xai.generate_explanation(
        {"emotion": "frustrated", "confidence": 0.87},
        {"action_units": {"AU4": 0.85, "AU12": 0.05, "AU15": 0.70, "AU7": 0.50}},
        {"active": True, "energy": 0.09},
        {"fatigue_score": 0.50, "perclos": 0.25, "blink_rate": 10},
        {"cognitiveLoadIndex": 75, "taskContext": "Machine Learning", "sessionMinutes": 45.0},
        {"stability_index": 0.94}
    )
    attr_weights = xai_res.get("featureAttributionWeights", {})
    total_weights = sum(attr_weights.values())
    if 98 <= total_weights <= 102 and len(xai_res.get("detailedExplanation", "")) > 30 and len(xai_res.get("counterfactual", "")) > 10:
        record("MOD-C-01: Explainable AI (XAI) feature attribution & counterfactual", "PASS",
               f"Weights Sum={total_weights}%, Factors Count={len(xai_res['contributingFactors'])}, Counterfactual verified")
    else:
        record("MOD-C-01: Explainable AI (XAI) feature attribution & counterfactual", "FAIL",
               f"Attribution weights sum was {total_weights}% (expected ~100%)")

    # Case C2: Continual Learning Baseline Adaptation & User Feedback
    cl = ContinualLearningEngine(user_id="CL_VERIFY_USER")
    initial_au4_mean = cl.baseline_means["AU4"]
    elevated_au = {"AU4": 0.40, "AU12": 0.05, "AU15": 0.05, "AU7": 0.05}
    for _ in range(30):
        cl.update_baseline(elevated_au, ear=0.30, is_neutral_context=True)
    adapted_au4_mean = cl.baseline_means["AU4"]

    cl.apply_user_feedback("calm", elevated_au)
    calm_bias = cl.emotion_bias["calm"]

    if adapted_au4_mean > initial_au4_mean and calm_bias > 0.0:
        record("MOD-C-02: Continual learning resting baseline calibration", "PASS",
               f"Initial AU4={initial_au4_mean:.3f} -> Adapted AU4={adapted_au4_mean:.3f}, Calm Bias={calm_bias:.2f}")
    else:
        record("MOD-C-02: Continual learning resting baseline calibration", "FAIL",
               f"Baseline failed to adapt: initial={initial_au4_mean}, adapted={adapted_au4_mean}")

    # Case C3: Hardware Actuation & Telemetry
    hw = HardwareController(transport="sim")
    hw.set_servo_mode("face_tracking")
    hw.update_from_vision(face_detected=True, norm_cx=-0.4, norm_cy=0.2)
    hw.set_light(mode="cool_energize", brightness=90, color_temp="cool_white")
    hw_telemetry = hw.get_telemetry()

    if hw_telemetry["connected"] is True and hw_telemetry["light"]["brightness"] == 90:
        record("MOD-C-03: Hardware controller multi-transport actuation", "PASS",
               f"Servo={hw_telemetry['servo']['angle']}°, Light={hw_telemetry['light']['mode']} @ {hw_telemetry['light']['brightness']}%")
    else:
        record("MOD-C-03: Hardware controller multi-transport actuation", "FAIL", f"Hardware telemetry invalid: {hw_telemetry}")

    # Case C4: FastAPI TestClient End-to-End REST Verification
    client = TestClient(app)
    api_endpoints = [
        ("GET", "/health", 200),
        ("POST", "/api/stream/config", 200, {"source": "synthetic"}),
        ("POST", "/api/stream/active", 200, {"active": True}),
        ("POST", "/api/hardware/control", 200, {"servo_angle": 90, "light_mode": "neutral_ambient"}),
        ("POST", "/api/hardware/eyes", 200, {"emotion": "happy", "gaze_x": 0.0, "gaze_y": 0.0}),
        ("POST", "/api/context/set", 200, {"task": "Validation Test", "app": "PyTest", "details": "Automated Suite"}),
        ("POST", "/api/cl/feedback", 200, {"corrected_emotion": "happy"}),
        ("POST", "/api/chat/message", 200, {"message": "Hello desk assistant!"}),
        ("GET", "/api/memory/list", 200),
        ("POST", "/api/memory/note", 200, {"task": "Verification", "app": "Test", "emotion": "Calm", "cli": 25, "summary": "E2E verification pass"}),
        ("GET", "/api/person/active", 200),
        ("POST", "/api/person/profile", 200, {"person_id": "user_1", "name": "Lead Researcher"}),
    ]

    all_api_passed = True
    for entry in api_endpoints:
        method, url, exp_code = entry[0], entry[1], entry[2]
        payload = entry[3] if len(entry) > 3 else None
        try:
            if method == "GET":
                resp = client.get(url)
            else:
                resp = client.post(url, json=payload)
            if resp.status_code != exp_code:
                all_api_passed = False
                record(f"API: {method} {url}", "FAIL", f"Status {resp.status_code} != {exp_code}")
        except Exception as e:
            all_api_passed = False
            record(f"API: {method} {url}", "FAIL", str(e))

    if all_api_passed:
        record("MOD-C-04: FastAPI REST API coverage (12 core endpoints)", "PASS", "12/12 endpoints returned 200 OK")

    # Cleanup test files
    if os.path.exists(test_db):
        os.remove(test_db)
    if os.path.exists(test_json):
        os.remove(test_json)

    print("=" * 70)
    print(f"VERIFICATION SUMMARY: {results['passed']}/{results['tests_run']} TESTS PASSED")
    print(f"FAILED: {results['failed']}, BLOCKED: {results['blocked']}")
    print("=" * 70)
    return results


if __name__ == "__main__":
    res = run_full_validation()
