"""
test_api.py — Verify FastAPI endpoints, health check, video stream, and control APIs.
"""

import sys
import os
import time
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(__file__))
from main import app

def test_fastapi_endpoints():
    print("[API TEST] Starting FastAPI TestClient...")
    client = TestClient(app)

    # 1. Test /health
    resp = client.get("/health")
    assert resp.status_code == 200, f"/health returned {resp.status_code}"
    data = resp.json()
    assert data["status"] == "ok"
    assert "hardware" in data
    assert "stream" in data
    print("  [OK] /health returned valid status")

    # 2. Test /api/stream/config
    resp = client.post("/api/stream/config", json={"source": "synthetic"})
    assert resp.status_code == 200
    assert resp.json()["source"] == "synthetic"
    print("  [OK] /api/stream/config configured successfully")

    # 3. Test /api/hardware/control
    resp = client.post("/api/hardware/control", json={
        "servo_angle": 105,
        "servo_mode": "face_tracking",
        "light_mode": "warm_focus",
        "light_brightness": 85,
        "light_color_temp": "warm_amber"
    })
    assert resp.status_code == 200
    hw_data = resp.json()["hardware"]
    assert hw_data["servo"]["angle"] == 105
    assert hw_data["light"]["brightness"] == 85
    print("  [OK] /api/hardware/control responded with updated actuator state")

    # 4. Test /api/context/set
    resp = client.post("/api/context/set", json={
        "task": "HRI Research • Live Trial",
        "app": "EMOTIA Dashboard",
        "details": "Testing live ESP32-CAM ingestion"
    })
    assert resp.status_code == 200
    print("  [OK] /api/context/set context updated")

    # 5. Test /api/cl/feedback
    resp = client.post("/api/cl/feedback", json={"corrected_emotion": "calm"})
    assert resp.status_code == 200
    print("  [OK] /api/cl/feedback received user correction")

    # 6. Test /api/chat/message (Conversational Reasoning)
    resp = client.post("/api/chat/message", json={
        "message": "I am having trouble debugging this tensor shape error.",
        "user_profile": {"name": "Dr. Alex Vance", "preferredStyle": "Proactive"}
    })
    assert resp.status_code == 200
    chat_data = resp.json()
    assert chat_data["status"] == "ok"
    assert "reply" in chat_data["response"]
    assert len(chat_data["response"]["reply"]) > 10
    print(f"  [OK] /api/chat/message generated conversational reply: \"{chat_data['response']['reply'][:60]}...\"")

    # 7. Test /api/memory/list & /api/memory/note (Episodic Memory)
    resp = client.get("/api/memory/list")
    assert resp.status_code == 200
    mem_data = resp.json()
    assert mem_data["status"] == "ok"
    assert "episodes" in mem_data["memories"]
    print(f"  [OK] /api/memory/list returned {len(mem_data['memories']['episodes'])} episodes")

    resp = client.post("/api/memory/note", json={
        "task": "Test Execution",
        "app": "PyTest",
        "emotion": "Calm",
        "cli": 30,
        "summary": "Ran unit test suite successfully.",
        "intervention": "Logged verification note"
    })
    assert resp.status_code == 200
    print("  [OK] /api/memory/note recorded episodic memory")

    print("[API TEST] All REST endpoints verified successfully! [OK]")

if __name__ == "__main__":
    test_fastapi_endpoints()
