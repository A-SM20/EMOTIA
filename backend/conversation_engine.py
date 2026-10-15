"""
conversation_engine.py — Context-Aware & Emotion-Adaptive Conversational Reasoning for EMOTIA.

Integrates:
  1. Multimodal user affect (emotion, valence, arousal, fatigue)
  2. Cognitive Load Index (CLI) & active workspace task
  3. Long-term episodic memory & user persona
  4. Local LLM inference (Ollama Llama 3 / Gemma) with neuro-symbolic affective fallback
"""

import os
import json
import time
import urllib.request
import urllib.error
from typing import Dict, Any, Optional, List


class ConversationEngine:
    def __init__(self, ollama_url: str = "http://localhost:11434/api/generate", model_name: str = "llama3:latest"):
        self.ollama_url = os.getenv("OLLAMA_URL", ollama_url)
        self.model_name = os.getenv("LLM_MODEL", model_name)
        self.use_llm = True

    def generate_response(
        self,
        user_message: str,
        emotion_state: Dict[str, Any],
        fatigue_state: Optional[Dict[str, Any]] = None,
        context_state: Optional[Dict[str, Any]] = None,
        user_profile: Optional[Dict[str, Any]] = None,
        retrieved_memories: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Generate an affect-guided, context-aware empathetic assistant reply.
        """
        user_msg = user_message.strip()
        emotion = (emotion_state.get("emotion") or "neutral").lower()
        confidence = int(emotion_state.get("confidence", 0.75) * 100)
        valence = float(emotion_state.get("valence", 0.0))
        arousal = float(emotion_state.get("arousal", 0.0))

        fatigue_alert = (fatigue_state or {}).get("alert", "alert")
        perclos = (fatigue_state or {}).get("perclos", 0.0)

        task = (context_state or {}).get("activeTask", "Autonomous Workspace")
        app = (context_state or {}).get("activeApp", "Active Environment")
        cli = (context_state or {}).get("cognitiveLoadIndex", 50)
        policy = (context_state or {}).get("interactionPolicy", "Standard Assistive")

        user_name = (user_profile or {}).get("name", "Dr. Alex Vance")
        style = (user_profile or {}).get("preferredStyle", "Proactive & Supportive")

        # 1. Attempt LLM Generation if Ollama or local endpoint is running
        llm_reply = None
        if self.use_llm:
            llm_reply = self._query_llm(
                user_msg, emotion, confidence, task, app, cli, fatigue_alert, user_name, retrieved_memories
            )

        # 2. Use Affective Symbolic Generator if LLM is offline or times out
        if not llm_reply:
            llm_reply = self._generate_affective_fallback(
                user_msg, emotion, confidence, valence, arousal, task, app, cli, fatigue_alert, user_name
            )

        # 3. Formulate Proactive Recommendation
        recommendation = self._derive_proactive_action(emotion, cli, fatigue_alert, task)

        return {
            "reply": llm_reply,
            "engine": "LLM (Ollama)" if llm_reply and self._last_used_llm else "Neuro-Symbolic Affect Engine",
            "context_tag": {
                "task": task,
                "app": app,
                "cognitive_load": f"{cli}%",
                "emotion_state": emotion.capitalize(),
                "policy": policy,
            },
            "recommendation": recommendation,
            "timestamp": time.strftime("%H:%M:%S"),
        }

    def _query_llm(
        self,
        user_msg: str,
        emotion: str,
        confidence: int,
        task: str,
        app: str,
        cli: int,
        fatigue_alert: str,
        user_name: str,
        memories: Optional[List[Dict[str, Any]]],
    ) -> Optional[str]:
        """Query local Ollama server if running."""
        memory_context = ""
        if memories:
            memory_context = "Past relevant experiences:\n" + "\n".join(
                [f"- {m.get('title')}: {m.get('description', '')}" for m in memories[:3]]
            )

        system_prompt = (
            f"You are EMOTIA, an intelligent humanoid desk companion for {user_name}.\n"
            f"Current User Affect: {emotion.upper()} ({confidence}% confidence).\n"
            f"Cognitive Load: {cli}% | Fatigue Alert: {fatigue_alert.upper()}.\n"
            f"Active Task: {task} ({app}).\n"
            f"{memory_context}\n"
            f"Instructions:\n"
            f"- Acknowledge their affective state implicitly or gently.\n"
            f"- Keep responses concise (2-3 sentences max) suitable for voice TTS.\n"
            f"- If user is frustrated/stressed, offer calming, actionable assistance.\n"
            f"- If user is calm/flow, avoid unnecessary chatter.\n"
        )

        payload = json.dumps({
            "model": self.model_name,
            "prompt": f"{system_prompt}\n\nUser: {user_msg}\nEMOTIA:",
            "stream": False,
            "options": {"temperature": 0.65, "num_predict": 90}
        }).encode("utf-8")

        req = urllib.request.Request(
            self.ollama_url,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=2.5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                ans = data.get("response", "").strip()
                if ans:
                    self._last_used_llm = True
                    return ans
        except Exception:
            self._last_used_llm = False
            return None

    def _generate_affective_fallback(
        self,
        user_msg: str,
        emotion: str,
        confidence: int,
        valence: float,
        arousal: float,
        task: str,
        app: str,
        cli: int,
        fatigue: str,
        user_name: str,
    ) -> str:
        """Deterministic context-aware empathetic generator."""
        msg_lower = user_msg.lower()

        if emotion == "frustrated":
            if "error" in msg_lower or "bug" in msg_lower or "not working" in msg_lower:
                return (
                    f"I hear the friction with this bug. Let me isolate the failing stack trace in {app} "
                    f"and verify the tensor shapes so you don't have to keep digging through logs."
                )
            return (
                f"I sense the tension with {task}. Let's break this down into smaller steps. "
                f"I've set desk lighting to soft amber to reduce visual strain while we tackle it."
            )

        elif emotion == "stressed":
            if fatigue in ("drowsy", "tired"):
                return (
                    f"You've been pushing hard through {task} and your ocular fatigue index is elevated. "
                    f"Take a 90-second stretch; I'm holding your workspace state safe."
                )
            return (
                f"Deep breath, {user_name}. Cognitive load is at {cli}%. "
                f"All your recent checkpoints are secured, and we're on schedule."
            )

        elif emotion == "happy":
            return (
                f"Great momentum on {task}! Your flow state is solid. "
                f"I've logged this progress in your episodic memory."
            )

        elif emotion == "calm":
            if "help" in msg_lower or "explain" in msg_lower:
                return f"Certainly. In {task}, the primary workflow is optimized. How would you like me to assist?"
            return f"You're in a steady, focused groove. I'll stay quiet and keep background distractions minimized."

        else: # neutral
            if "hello" in msg_lower or "hi" in msg_lower:
                return f"Hello {user_name}. System sensors are online and tracking your workstation. How can I assist today?"
            return f"Understood. Analyzing '{user_msg}' against your current {task} session."

    def _derive_proactive_action(self, emotion: str, cli: int, fatigue: str, task: str) -> str:
        """Suggest actionable environmental or workflow adjustments."""
        if fatigue in ("drowsy", "tired") or cli > 80:
            return "Recommend 5-minute visual break (20-20-20 rule) and warm amber desk illumination."
        elif emotion == "frustrated":
            return "Offer automated syntax/dependency diagnostic and dim peripheral glare."
        elif emotion == "happy":
            return "Archive experimental checkpoint and generate summary validation plots."
        else:
            return "Maintain current focus profile with neutral daylight."
