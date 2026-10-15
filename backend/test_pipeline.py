"""
test_pipeline.py — End-to-end unit and integration verification for EMOTIA backend engines.
"""

import sys
import os
import time
import numpy as np

# Add backend directory to path
sys.path.insert(0, os.path.dirname(__file__))

from stream_capture import StreamCapture
from face_detector import FaceDetector
from eye_fatigue import EyeFatigueDetector
from continual_learning import ContinualLearningEngine
from context_engine import ContextAwareEngine
from xai_engine import XAIEngine
from hardware_controller import HardwareController
from fusion import fuse


def test_stream_capture():
    print("[TEST 1/7] Testing StreamCapture (Synthetic Mode)...")
    capture = StreamCapture(source="synthetic", width=640, height=480)
    capture.start()
    time.sleep(0.5)

    ret, frame = capture.get_latest_frame()
    assert ret is True, "Failed to capture synthetic frame"
    assert frame is not None, "Frame is None"
    assert frame.shape == (480, 640, 3), f"Unexpected frame shape: {frame.shape}"
    status = capture.get_status()
    assert status["source_type"] == "synthetic"
    capture.stop()
    print("  [OK] StreamCapture passed")
    return frame


def test_face_detector(frame):
    print("[TEST 2/7] Testing FaceDetector (MediaPipe FaceMesh + Action Units)...")
    detector = FaceDetector()
    res, annotated = detector.process_frame(frame, draw_overlay=True)

    assert "detected" in res
    assert "action_units" in res
    assert "AU4" in res["action_units"]
    assert "AU12" in res["action_units"]
    assert "head_pose" in res
    assert "pitch" in res["head_pose"]
    assert "face_center_norm" in res
    assert annotated.shape == (480, 640, 3)
    detector.release()
    print(f"  [OK] FaceDetector passed (Detected: {res['detected']}, AU4: {res['action_units']['AU4']}, Emotion: {res['emotion']})")
    return res


def test_continual_learning():
    print("[TEST 3/7] Testing ContinualLearningEngine...")
    cl = ContinualLearningEngine(user_id="TEST_USER_01")
    au_sample = {"AU4": 0.12, "AU12": 0.08, "AU15": 0.05, "AU7": 0.04}

    # Simulate 50 calibration steps
    for _ in range(50):
        cl.update_baseline(au_sample, ear=0.28, is_neutral_context=True)

    calibrated = cl.calibrate_features(au_sample)
    assert "AU4" in calibrated
    telemetry = cl.get_telemetry()
    assert telemetry["calibration_samples"] >= 50
    assert 0.0 <= telemetry["stability_index"] <= 1.0

    # User feedback test
    cl.apply_user_feedback("calm", au_sample)
    assert len(cl.replay_buffer) >= 1
    print("  [OK] ContinualLearningEngine passed (Stability: %s, Buffer: %d)" % (telemetry["stability_index"], len(cl.replay_buffer)))
    return telemetry


def test_context_engine():
    print("[TEST 4/7] Testing ContextAwareEngine (Cognitive Load & Policy)...")
    ce = ContextAwareEngine()
    ce.set_context("Programming • PyTorch", "VS Code", "Debugging tensor shape mismatch")

    fused_state = {"emotion": "frustrated", "valence": -0.65, "arousal": 0.75, "confidence": 0.88}
    fatigue_state = {"fatigue_score": 0.60, "perclos": 0.32, "blink_rate": 8}
    au_state = {"AU4": 0.85, "AU15": 0.70}

    eval_res = ce.evaluate(fused_state, fatigue_state, au_state)
    assert "cognitiveLoadIndex" in eval_res
    assert eval_res["cognitiveLoadIndex"] > 50, f"Expected elevated CLI, got {eval_res['cognitiveLoadIndex']}"
    assert eval_res["workState"] in ("Cognitive Overload", "Elevated Tension", "Fatigued")
    assert "hardwareRecommendation" in eval_res
    print(f"  [OK] ContextAwareEngine passed (CLI: {eval_res['cognitiveLoadIndex']}%, State: {eval_res['workState']})")
    return eval_res


def test_xai_engine(eval_res, cl_telemetry):
    print("[TEST 5/7] Testing XAIEngine (Feature Attributions & Explanations)...")
    xai = XAIEngine()
    fused_state = {"emotion": "frustrated", "confidence": 0.87}
    face_state = {"action_units": {"AU4": 0.82, "AU12": 0.05, "AU15": 0.72, "AU7": 0.55}}
    speech_state = {"active": True, "energy": 0.08}
    fatigue_state = {"fatigue_score": 0.55, "perclos": 0.28, "blink_rate": 9}

    xai_res = xai.generate_explanation(fused_state, face_state, speech_state, fatigue_state, eval_res, cl_telemetry)

    assert "contributingFactors" in xai_res
    assert len(xai_res["contributingFactors"]) >= 4
    total_pct = sum(f["percentage"] for f in xai_res["contributingFactors"])
    # Factors should sum close to 100%
    assert 90 <= total_pct <= 105, f"Factors sum was {total_pct}"
    assert len(xai_res["detailedExplanation"]) > 20
    assert len(xai_res["counterfactual"]) > 10
    print(f"  [OK] XAIEngine passed (Attribution Sum: {total_pct}%, Factors: {len(xai_res['contributingFactors'])})")


def test_hardware_controller():
    print("[TEST 6/7] Testing HardwareController (Servo & Light Multi-Transport)...")
    hw = HardwareController(transport="sim")

    # 1. Servo Pan/Tilt tracking
    hw.set_servo_mode("face_tracking")
    hw.update_from_vision(face_detected=True, norm_cx=0.5, norm_cy=0.0)
    assert 15 <= hw.servo_angle <= 165

    # 2. Gesture test
    hw.trigger_gesture("nod")
    time.sleep(0.4)

    # 3. Light control test
    hw.set_light("warm_focus", brightness=70, color_temp="warm_amber")
    assert hw.light_brightness == 70
    assert hw.light_color_temp == "warm_amber"

    telemetry = hw.get_telemetry()
    assert telemetry["connected"] is True
    assert telemetry["servo"]["mode"] == "face_tracking"
    print(f"  [OK] HardwareController passed (Servo: {hw.servo_angle}°, Light: {hw.light_mode} @ {hw.light_brightness}%)")


def test_fusion():
    print("[TEST 7/7] Testing Fusion Engine...")
    face_res = {"detected": True, "emotion": "frustrated", "confidence": 0.85}
    speech_res = {"active": True, "emotion": "stressed", "confidence": 0.75}
    fatigue_res = {"fatigue_score": 0.40, "alert": "tired"}

    fused = fuse(face_res, speech_res, fatigue_res)
    assert "emotion" in fused
    assert "confidence" in fused
    assert "valence" in fused
    assert "arousal" in fused
    print(f"  [OK] Fusion passed (Fused: {fused['emotion']}, Conf: {fused['confidence']}, V: {fused['valence']}, A: {fused['arousal']})")


if __name__ == "__main__":
    print("=" * 60)
    print("STARTING EMOTIA BACKEND UNIT & INTEGRATION TESTS")
    print("=" * 60)
    f = test_stream_capture()
    face_res = test_face_detector(f)
    cl_res = test_continual_learning()
    eval_res = test_context_engine()
    test_xai_engine(eval_res, cl_res)
    test_hardware_controller()
    test_fusion()
    print("=" * 60)
    print("ALL 7 BACKEND SUBSYSTEM TESTS PASSED SUCCESSFULLY! [OK]")
    print("=" * 60)
