"""
main.py — Root ASGI entrypoint and launcher for EMOTIA Backend.

Allows running the backend directly from the project root:
    python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
or:
    python main.py
"""

import sys
import os

# Ensure backend directory is in Python module search path
BACKEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Expose FastAPI application instance from backend.main
from backend.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
