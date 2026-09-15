@echo off
echo ============================================================
echo  EMOTIA Backend — Real-time ML Pipeline
echo ============================================================
echo  Starting FastAPI server on http://localhost:8000
echo  WebSocket endpoint: ws://localhost:8000/ws
echo  Health check: http://localhost:8000/health
echo ============================================================
cd /d %~dp0
uvicorn main:app --reload --host 0.0.0.0 --port 8000
