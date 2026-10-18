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
import sqlite3
from typing import List, Dict, Any, Optional


DEFAULT_MEMORY_PATH = os.path.join(os.path.dirname(__file__), "data", "memory_store.json")
DEFAULT_DB_PATH = os.path.join(os.path.dirname(__file__), "data", "memory.db")


class MemoryEngine:
    def __init__(self, storage_path: Optional[str] = None, db_path: Optional[str] = None):
        self.storage_path = storage_path or DEFAULT_MEMORY_PATH
        if db_path:
            self.db_path = db_path
        elif storage_path is None:
            self.db_path = DEFAULT_DB_PATH
        else:
            self.db_path = os.path.splitext(self.storage_path)[0] + ".db"
        self._ensure_storage()

    def _init_sqlite(self):
        """Initialize SQLite database tables for relational storage & querying."""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        conn = sqlite3.connect(self.db_path)
        try:
            cur = conn.cursor()
            cur.execute("""
                CREATE TABLE IF NOT EXISTS persons (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    role TEXT,
                    notes TEXT,
                    first_seen TEXT,
                    last_seen TEXT,
                    session_count INTEGER,
                    face_signature TEXT,
                    last_emotion TEXT
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS episodes (
                    id TEXT PRIMARY KEY,
                    timestamp TEXT,
                    task TEXT,
                    app TEXT,
                    emotion TEXT,
                    cli INTEGER,
                    summary TEXT,
                    intervention TEXT
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS preferences (
                    id TEXT PRIMARY KEY,
                    title TEXT,
                    category TEXT,
                    confidence INTEGER,
                    observed_count INTEGER,
                    status TEXT
                )
            """)
            conn.commit()
        finally:
            conn.close()

    def _sync_to_sqlite(self, data: Dict[str, Any]):
        """Persist in-memory state to SQLite relational tables."""
        try:
            conn = sqlite3.connect(self.db_path)
            try:
                cur = conn.cursor()
                for pid, p in data.get("persons", {}).items():
                    sig_str = json.dumps(p.get("face_signature", []))
                    cur.execute("""
                        INSERT INTO persons (id, name, role, notes, first_seen, last_seen, session_count, face_signature, last_emotion)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(id) DO UPDATE SET
                            name=excluded.name,
                            role=excluded.role,
                            notes=excluded.notes,
                            last_seen=excluded.last_seen,
                            session_count=excluded.session_count,
                            face_signature=excluded.face_signature,
                            last_emotion=excluded.last_emotion
                    """, (pid, p.get("name"), p.get("role"), p.get("notes"), p.get("first_seen"), p.get("last_seen"), p.get("session_count", 1), sig_str, p.get("last_emotion", "Neutral")))

                for ep in data.get("episodes", []):
                    cur.execute("""
                        INSERT OR IGNORE INTO episodes (id, timestamp, task, app, emotion, cli, summary, intervention)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (ep.get("id"), ep.get("timestamp"), ep.get("task"), ep.get("app"), ep.get("emotion"), ep.get("cli", 50), ep.get("summary"), ep.get("intervention")))

                for pref in data.get("preferences", []):
                    cur.execute("""
                        INSERT INTO preferences (id, title, category, confidence, observed_count, status)
                        VALUES (?, ?, ?, ?, ?, ?)
                        ON CONFLICT(id) DO UPDATE SET
                            confidence=excluded.confidence,
                            observed_count=excluded.observed_count,
                            status=excluded.status
                    """, (pref.get("id"), pref.get("title"), pref.get("category"), pref.get("confidence", 80), pref.get("observed_count", 1), pref.get("status", "Active Policy")))
                conn.commit()
            finally:
                conn.close()
        except Exception:
            pass

    def _ensure_storage(self):
        """Ensure memory store JSON exists with baseline historical episodes and init SQLite."""
        os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
        self._init_sqlite()
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
            self._sync_to_sqlite(initial_data)
        else:
            # Sync existing store to SQLite
            try:
                with open(self.storage_path, "r", encoding="utf-8") as f:
                    self._sync_to_sqlite(json.load(f))
            except Exception:
                pass

    def load_data(self) -> Dict[str, Any]:
        """Load stored episodic memory and preferences."""
        try:
            with open(self.storage_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"preferences": [], "episodes": []}

    def save_data(self, data: Dict[str, Any]):
        """Save data back to storage and sync with SQLite relational database."""
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        self._sync_to_sqlite(data)

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
        """
        Retrieve relevant past episodes matching query string via SQLite relational query.
        Falls back to keyword scoring if query does not match exact SQL pattern.
        """
        results = []
        try:
            conn = sqlite3.connect(self.db_path)
            try:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                tokens = [t.strip() for t in query.split() if len(t.strip()) > 2]
                if tokens:
                    conditions = " OR ".join(["summary LIKE ? OR task LIKE ? OR app LIKE ?" for _ in tokens])
                    params = []
                    for t in tokens:
                        params.extend([f"%{t}%", f"%{t}%", f"%{t}%"])
                    params.append(top_k)
                    sql = f"SELECT id, timestamp, task, app, emotion, cli, summary, intervention FROM episodes WHERE {conditions} ORDER BY id DESC LIMIT ?"
                    cur.execute(sql, params)
                    rows = cur.fetchall()
                    for r in rows:
                        results.append(dict(r))
            finally:
                conn.close()
        except Exception:
            pass

        if not results:
            data = self.load_data()
            episodes = data.get("episodes", [])
            q_words = set(query.lower().split())
            scored = []
            for ep in episodes:
                text = f"{ep.get('task', '')} {ep.get('app', '')} {ep.get('emotion', '')} {ep.get('summary', '')}".lower()
                score = sum(1 for w in q_words if w in text)
                scored.append((score, ep))
            scored.sort(key=lambda x: x[0], reverse=True)
            results = [item[1] for item in scored[:top_k]]

        return results

    def get_preferences(self) -> List[Dict[str, Any]]:
        """Get all active learned user preferences."""
        return self.load_data().get("preferences", [])

    def identify_or_register_person(self, face_features: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Identify person based on geometric biometric vector or register active user.
        Maintains person profile, visits, and emotion history.
        """
        data = self.load_data()
        persons = data.setdefault("persons", {})

        now_str = time.strftime("%Y-%m-%d %H:%M:%S")

        if not persons:
            # Seed primary researcher profile
            primary = {
                "id": "user_1",
                "name": "User 1",
                "role": "Lead Researcher",
                "notes": "Primary researcher. Working on EMOTIA HRI system.",
                "first_seen": now_str,
                "last_seen": now_str,
                "session_count": 1,
                "face_signature": [0.42, 0.65, 0.22, 0.82],
                "last_emotion": "Neutral",
            }
            persons["user_1"] = primary
            data["active_person_id"] = "user_1"
            self.save_data(data)
            return primary

        # If no face is detected in the current frame, return the active person
        if not face_features or not face_features.get("valid", False):
            active_id = data.get("active_person_id", "user_1")
            return persons.get(active_id, list(persons.values())[0])

        vector = face_features.get("vector", [0.42, 0.65, 0.22, 0.82])
        best_match = None
        min_dist = 999.0

        for pid, pdata in persons.items():
            stored_vec = pdata.get("face_signature")
            if stored_vec and len(stored_vec) == len(vector):
                dist = sum((float(a) - float(b)) ** 2 for a, b in zip(vector, stored_vec)) ** 0.5
                if dist < min_dist:
                    min_dist = dist
                    best_match = pid

        # Biometric similarity threshold (normalized Euclidean distance)
        if best_match and min_dist < 0.28:
            person = persons[best_match]
            person["last_seen"] = now_str
            # Exponential moving average to calibrate face signature over time
            person["face_signature"] = [round(0.92 * s + 0.08 * v, 4) for s, v in zip(person["face_signature"], vector)]
            data["active_person_id"] = best_match
            self.save_data(data)
            return {**person, "match_confidence": round(max(0.65, 1.0 - min_dist), 2), "is_new": False}

        # Register new person
        new_id = f"user_{len(persons) + 1}"
        new_person = {
            "id": new_id,
            "name": f"User {len(persons) + 1}",
            "role": "Collaborator",
            "notes": "Recognized collaborator.",
            "first_seen": now_str,
            "last_seen": now_str,
            "session_count": 1,
            "face_signature": [round(float(v), 4) for v in vector],
            "last_emotion": "Neutral",
        }
        persons[new_id] = new_person
        data["active_person_id"] = new_id
        self.save_data(data)
        return {**new_person, "match_confidence": 0.90, "is_new": True}

    def update_person_profile(self, person_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update person profile attributes (name, role, notes, etc.)."""
        data = self.load_data()
        persons = data.setdefault("persons", {})
        if person_id not in persons:
            person_id = "user_1"
        if person_id in persons:
            for k in ("name", "role", "notes"):
                if k in updates:
                    persons[person_id][k] = updates[k]
            self.save_data(data)
            return {"status": "ok", "person": persons[person_id]}
        return {"status": "error", "message": "Person not found"}

    def get_persons(self) -> Dict[str, Any]:
        """Return all recognized person profiles."""
        return self.load_data().get("persons", {})
