"""
context_engine.py — Context-Aware Decision & Proactive Policy Engine for EMOTIA.

Features:
  - Aggregates task context, application environment, and longitudinal session duration
  - Computes continuous Cognitive Load Index (CLI: 0–100%)
  - Classifies user work state (Deep Flow, Active Focus, Cognitive Overload, Fatigued, Needs Break)
  - Evaluates proactive assistance policies and determines hardware intervention actions
"""

import time
from typing import Dict, Optional, Tuple


class ContextAwareEngine:
    def __init__(self):
        self.session_start = time.time()
        self.active_task = "Programming • PyTorch & Python"
        self.active_app = "VS Code"
        self.task_details = "Refactoring cross_attention_fusion.py"
        self.last_state_change = time.time()
        self.current_state = "Active Focus"
        self.continuous_focus_sec = 0
        self.cognitive_load_index = 45  # 0 to 100

        # Cooldown timer to prevent annoying rapid-fire proactive interruptions
        self.last_intervention_time = 0
        self.intervention_cooldown = 45.0  # seconds

    def set_context(self, task: str, app: str, details: Optional[str] = None):
        """Update current active task context from frontend."""
        self.active_task = task
        self.active_app = app
        if details:
            self.task_details = details
        print(f"[context_engine] Context updated: {task} ({app})")

    def evaluate(self, fused_state: dict, fatigue_state: dict, action_units: dict) -> dict:
        """
        Evaluate full multimodal affect and environmental context to compute Cognitive Load
        and generate proactive interventions.
        """
        now = time.time()
        session_elapsed_min = (now - self.session_start) / 60.0

        emotion = fused_state.get("emotion", "neutral")
        valence = fused_state.get("valence", 0.0)
        arousal = fused_state.get("arousal", 0.0)
        conf = fused_state.get("confidence", 0.5)

        fatigue_score = fatigue_state.get("fatigue_score", 0.0)
        perclos = fatigue_state.get("perclos", 0.0)
        blink_rate = fatigue_state.get("blink_rate", 15)

        au4 = action_units.get("AU4", 0.0)
        au15 = action_units.get("AU15", 0.0)

        # ── 1. Cognitive Load Index (CLI) Computation (0–100) ───────────────
        # Factors:
        #  - Negative valence with high arousal (frustration / distress)
        #  - Sustained AU4 brow contraction
        #  - Reduced blink rate or elevated PERCLOS (visual fatigue)
        #  - Session duration accumulation
        stress_factor = max(0.0, (-valence * 35.0)) if valence < 0 else 0.0
        arousal_factor = max(0.0, arousal * 20.0)
        au_factor = (au4 * 25.0) + (au15 * 15.0)
        fatigue_factor = fatigue_score * 30.0
        time_factor = min(20.0, session_elapsed_min * 0.2)  # up to +20 after 100 min

        raw_cli = 20.0 + stress_factor + arousal_factor + au_factor + fatigue_factor + time_factor
        self.cognitive_load_index = int(max(5, min(100, raw_cli)))

        # ── 2. User Work State Classification ───────────────────────────────
        if self.cognitive_load_index > 78 or (emotion == "frustrated" and conf > 0.70):
            work_state = "Cognitive Overload"
        elif fatigue_score > 0.65 or perclos > 0.35:
            work_state = "Fatigued"
        elif emotion in ("calm", "neutral") and self.cognitive_load_index < 55:
            work_state = "Deep Flow" if session_elapsed_min > 15 else "Active Focus"
        elif self.cognitive_load_index > 65:
            work_state = "Elevated Tension"
        else:
            work_state = "Active Focus"

        self.current_state = work_state

        # ── 3. Proactive Decision Policy & Interventions ────────────────────
        should_intervene = False
        proactive_action = "Maintain continuous unobtrusive monitoring"
        assistant_speech = ""
        hardware_recommendation = {
            "servo_action": "center",
            "light_mode": "circadian",
            "light_brightness": 75,
            "light_color_temp": "neutral",
        }

        # Check cooldown
        can_trigger = (now - self.last_intervention_time) > self.intervention_cooldown

        if work_state == "Cognitive Overload":
            proactive_action = "Offer automated syntax check & suggest a 5-min cognitive break"
            assistant_speech = "You seem frustrated with this syntax issue... would you like me to help break the problem into smaller steps or run a quick tensor shape diff check?"
            hardware_recommendation = {
                "servo_action": "tilt",     # gentle attentive head tilt
                "light_mode": "warm_focus", # warm 3000K to ease eye strain
                "light_brightness": 60,
                "light_color_temp": "warm_amber",
            }
            if can_trigger:
                should_intervene = True
                self.last_intervention_time = now

        elif work_state == "Fatigued":
            proactive_action = "Recommend ergonomic posture adjustment and hydration pause"
            assistant_speech = "Your blink frequency has decreased and eye fatigue is elevated. Consider taking a 2-minute ocular rest."
            hardware_recommendation = {
                "servo_action": "nod",
                "light_mode": "circadian_boost",
                "light_brightness": 85,
                "light_color_temp": "daylight",
            }
            if can_trigger:
                should_intervene = True
                self.last_intervention_time = now

        elif work_state == "Deep Flow":
            proactive_action = "Suppress non-urgent peripheral notifications; maintain uninterrupted lighting"
            assistant_speech = "You are in steady flow. I will keep peripheral distractions minimized."
            hardware_recommendation = {
                "servo_action": "track",    # track face gently or stay centered
                "light_mode": "flow",
                "light_brightness": 70,
                "light_color_temp": "balanced",
            }

        elif emotion == "happy":
            proactive_action = "Acknowledge successful milestone and archive experiment telemetry"
            assistant_speech = "Great progress on this run! Checkpoint logs and validation plots are pre-rendered."
            hardware_recommendation = {
                "servo_action": "nod",
                "light_mode": "accent_green",
                "light_brightness": 80,
                "light_color_temp": "warm",
            }

        return {
            "taskContext": self.active_task,
            "activeApp": self.active_app,
            "taskDetails": self.task_details,
            "sessionMinutes": round(session_elapsed_min, 1),
            "cognitiveLoadIndex": self.cognitive_load_index,
            "workState": work_state,
            "shouldIntervene": should_intervene,
            "proactiveAction": proactive_action,
            "assistantSpeech": assistant_speech,
            "hardwareRecommendation": hardware_recommendation,
        }
