@echo off
echo ============================================================
echo  EMOTIA Live Software Pipeline — Perception, CL, XAI ^& Actuators
echo ============================================================
echo  FastAPI REST Server:  http://localhost:8000
echo  WebSocket Telemetry: ws://localhost:8000/ws
echo  Live Video Feed:     http://localhost:8000/video_feed
echo  Health Diagnostics:  http://localhost:8000/health
echo ============================================================
cd /d %~dp0
uvicorn main:app --reload --host 0.0.0.0 --port 8000
