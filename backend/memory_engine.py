"""
memory_engine.py — Long-Term Episodic Memory & Learned User Preference Store for EMOTIA.

Maintains:
  1. Episodic Interaction Memory (past sessions, emotional milestones, break logs)
  2. Learned User Preferences (sensory thresholds, lighting preferences, proactive pacing)
  3. Semantic / Keyword Retrieval (RAG memory context for conversational reasoning)
"""

import os
import json
import time
from typing import List, Dict, Any, Optional


class MemoryEngine:
    def __init__(self, storage_path: str = "backend/data/memory_store.json"):
        self.storage_path = storage_path
        self._ensure_storage()

    def _ensure_storage(self):
        """Ensure memory store JSON exists with baseline historical episodes."""
        os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
        if not os.path.exists(self.storage_path):
            initial_data = {
                "user_id": "DR_ALEX_VANCE",
                "preferences": [
                    {
                        "id": "pref_1",
                        "title": "Dim Amber Lighting during Cognitive Overload",
                        "category": "Workspace Environment",
                        "confidence": 94,
                        "observed_count": 18,
                        "status": "Active Policy",
                    },
                    {
                        "id": "pref_2",
                        "title": "Proactive Break Prompts at 45m Interval",
                        "category": "Health & Fatigue",
                        "confidence": 88,
                        "observed_count": 12,
                        "status": "Active Policy",
                    },
                    {
                        "id": "pref_3",
                        "title": "Suppress Peripheral Alerts during Deep Flow",
                        "category": "Interaction Pacing",
                        "confidence": 96,
                        "observed_count": 25,
                        "status": "Active Policy",
                    },
                ],
                "episodes": [
                    {
                        "id": "ep_1",
                        "timestamp": "Yesterday, 16:45",
                        "task": "PyTorch Debugging",
                        "app": "VS Code",
                        "emotion": "Frustrated",
                        "cli": 89,
                        "summary": "Resolved CUDA out-of-memory error after 40m session. System suggested batch size reduction.",
                        "intervention": "Amber Focus lighting + automated stack trace isolation.",
                    },
                    {
                        "id": "ep_2",
                        "timestamp": "Yesterday, 14:10",
                        "task": "Literature Review Writing",
                        "app": "Overleaf",
                        "emotion": "Calm",
                        "cli": 35,
                        "summary": "Steady deep writing sprint. System maintained silent daylight illumination.",
                        "intervention": "Silent focus lock.",
                    },
                    {
                        "id": "ep_3",
                        "timestamp": "2 days ago, 18:20",
                        "task": "Model Evaluation",
                        "app": "Terminal",
                        "emotion": "Happy",
                        "cli": 42,
                        "summary": "Validation accuracy exceeded 91.4% benchmark on emotion dataset.",
                        "intervention": "Archived evaluation run checkpoint.",
                    },
                ],
            }
            with open(self.storage_path, "w", encoding="utf-8") as f:
                json.dump(initial_data, f, indent=2)

    def load_data(self) -> Dict[str, Any]:
        """Load stored episodic memory and preferences."""
        try:
            with open(self.storage_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"preferences": [], "episodes": []}

    def save_data(self, data: Dict[str, Any]):
        """Save data back to storage."""
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def add_episode(self, task: str, app: str, emotion: str, cli: int, summary: str, intervention: str) -> Dict[str, Any]:
        """Record a new interaction episode into long-term memory."""
        data = self.load_data()
        episode = {
            "id": f"ep_{int(time.time())}",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "task": task,
            "app": app,
            "emotion": emotion.capitalize(),
            "cli": cli,
            "summary": summary,
            "intervention": intervention,
        }
        data.setdefault("episodes", []).insert(0, episode)
        self.save_data(data)
        return episode

    def query_memories(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Retrieve relevant past episodes matching a query string (RAG context)."""
        data = self.load_data()
        episodes = data.get("episodes", [])
        q_words = set(query.lower().split())

        scored = []
        for ep in episodes:
            text = f"{ep.get('task', '')} {ep.get('app', '')} {ep.get('emotion', '')} {ep.get('summary', '')}".lower()
            score = sum(1 for w in q_words if w in text)
            scored.append((score, ep))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored[:top_k]]

    def get_preferences(self) -> List[Dict[str, Any]]:
        """Get all active learned user preferences."""
        return self.load_data().get("preferences", [])
