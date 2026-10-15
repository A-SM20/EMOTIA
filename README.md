# EMOTIA • Emotion-Aware Intelligent Desk Assistant

[![Deploy to GitHub Pages](https://github.com/A-SM20/EMOTIA/actions/workflows/deploy.yml/badge.svg)](https://github.com/A-SM20/EMOTIA/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-059669.svg)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff.svg)](https://vitejs.dev/)

> **Live System for Human-Robot Interaction (HRI) Research:**  
> *"Context-Aware and Explainable Emotion Intelligence for a Personalized HRI Desk Assistant"*

---

## 🌟 Overview

**EMOTIA** is a real-time, closed-loop workstation assistant that ingests live video from an **ESP32-CAM module** (or webcam/synthetic feed), detects facial Action Units and head pose, calibrates individual resting baselines via a **Continual Learning (CL) engine**, evaluates cognitive fatigue through a **Context-Aware Decision Engine**, generates transparent **Explainable AI (XAI)** attributions, and commands **physical hardware actuators (servo pan/tilt, expressive robot gestures, and smart circadian lighting)**.

```
ESP32-CAM MJPEG Stream ──▶ StreamCapture (Zero-Latency Buffer)
                               │
                               ▼
                        FaceDetector (MediaPipe Mesh + Action Units AU4/12/15)
                               │
                               ▼
               ContinualLearningEngine (Personal Baseline Calibration)
                               │
                               ▼
                ContextAwareEngine (Cognitive Load Index & Policy)
                               │
                               ▼
                  XAIEngine (Attribution Weights & Justifications)
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
       HardwareController             FastAPI WebSocket (/ws)
  (Servo Pan/Tilt & Smart Light)             & MJPEG Feed
               │                               │
               ▼                               ▼
     Physical Microcontroller           React Workstation HUD
```

---

## 🚀 Live System Capabilities

- **ESP32-CAM Video Stream (`stream_capture.py`):** Real-time MJPEG acquisition over HTTP with zero-latency frame dropping, auto-reconnection, and fallback to webcam (0) or synthetic feed.
- **Background Facial Perception (`face_detector.py`):** MediaPipe 468-point 3D FaceMesh, Action Unit telemetry (`AU4` brow furrow, `AU12` smile, `AU15` frown, `AU7` squint), 3D head pose estimation (`Pitch/Yaw/Roll`), and normalized face centroid coordinates.
- **Eye Fatigue & Ocular Telemetry (`eye_fatigue.py`):** Eye Aspect Ratio (`EAR`) and rolling 30-second `PERCLOS` drowsiness monitoring.
- **Continual Learning Personalization (`continual_learning.py`):** Online user baseline calibration with catastrophic forgetting mitigation, episodic memory replay buffer, and cross-session persistence in `backend/data/user_profile.json`.
- **Context-Aware Decision Engine (`context_engine.py`):** Computes continuous Cognitive Load Index (`CLI`: 0–100%), evaluates work states (`Deep Flow`, `Overload`, `Fatigued`), and triggers proactive interventions.
- **Transparent Explainability (`xai_engine.py`):** Normalized feature attributions (`%`), counterfactual reasoning, and dynamically generated natural-language explanations.
- **Multi-Transport Hardware Hub (`hardware_controller.py`):** Dual-mode servo control (Face-Tracking Pan/Tilt + Expressive Robot Gestures like empathetic nodding) and smart circadian desk lighting via **HTTP REST** (ESP32) or **USB Serial COM** (Arduino/ESP32).

---

## 💻 Quickstart: Running the Live System

### 1. Start the Backend Pipeline

In a terminal, navigate to `backend/` and start the FastAPI server:

```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*(Or simply double-click `backend/start.bat` on Windows)*.

Endpoints initialized:
- **FastAPI REST Server:** `http://localhost:8000`
- **Live Video Feed:** `http://localhost:8000/video_feed`
- **WebSocket Telemetry:** `ws://localhost:8000/ws`
- **System Health:** `http://localhost:8000/health`

### 2. Start the React Frontend

In a second terminal:

```bash
npm install
npm run dev
```

Open `http://localhost:5173/` in your browser. The dashboard automatically connects to the backend WebSocket.

---

## ⚙️ Hardware & Actuator Configuration

Open the **Settings Modal** (gear icon in the top header) and navigate to the **Hardware & ESP32-CAM** tab:
1. **ESP32-CAM Stream URL:** Enter your camera stream IP (e.g. `http://192.168.1.50:81/stream`), or click the preset for `Webcam 0` or `Synthetic Feed`.
2. **Actuator Transport:** Select `Virtual Simulation` (safe test mode), `ESP32 HTTP REST`, or `USB Serial COM` (e.g. `COM3`).
3. **Servo Motor:** Toggle between `Face Tracking` (pan/tilt follows face position) and `Expressive Gestures` (empathetic nod, attentive tilt, alert shake), or test angles manually using the slider.
4. **Smart Desk Light:** Switch modes (`Circadian Flow`, `Amber Focus 3000K`, `Daylight 5000K`, `Alert Pulse`) and adjust brightness.

---

## 🧪 Automated Backend Verification

Run the comprehensive unit and integration test suite:

```bash
python backend/test_pipeline.py
python backend/test_api.py
```

All 7 subsystems are verified in both live and synthetic modes.

---

## 📄 License

MIT License. Designed for HRI Research and Academic Demonstration.
