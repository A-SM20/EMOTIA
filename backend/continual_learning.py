"""
continual_learning.py — Continual Learning (CL) Affective Personalization Engine for EMOTIA.

Capabilities:
  1. Online Baseline Calibration: Learns personal neutral resting metrics (AU4, AU12, AU15, EAR)
     to prevent false positives from individual anatomical variance.
  2. Episodic Memory Replay Buffer: Stores critical affective transitions and user feedback.
  3. Catastrophic Forgetting Mitigation: Applies Elastic Weight / baseline regularization.
  4. Cross-Session Persistence: Saves and restores calibrated user profiles from JSON.
  5. Telemetry Generation: Exposes plasticity, stability, and adaptation drift metrics.
"""

import json
import os
import time
import numpy as np
from typing import Dict, List, Optional
from collections import deque

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
PROFILE_FILE = os.path.join(DATA_DIR, "user_profile.json")


class ContinualLearningEngine:
    def __init__(self, user_id: str = "ID_ALEX_01", replay_capacity: int = 500):
        self.user_id = user_id
        self.replay_capacity = replay_capacity
        self.replay_buffer = deque(maxlen=replay_capacity)

        # Running baseline calibration (mean and sample count)
        self.baseline_counts = {
            "AU4": 0,
            "AU12": 0,
            "AU15": 0,
            "AU7": 0,
            "EAR": 0,
        }
        self.baseline_means = {
            "AU4": 0.05,
            "AU12": 0.05,
            "AU15": 0.05,
            "AU7": 0.05,
            "EAR": 0.30,
        }

        # Regularization anchor (historical baseline to mitigate catastrophic drift)
        self.anchor_baseline = self.baseline_means.copy()
        self.regularization_lambda = 0.25

        # Online adaptation weights for emotions
        self.emotion_bias = {
            "frustrated": 0.0,
            "stressed": 0.0,
            "happy": 0.0,
            "calm": 0.0,
            "neutral": 0.0,
        }

        # Telemetry metrics
        self.plasticity_index = 0.85
        self.stability_index = 0.94
        self.adaptation_drift = 0.02
        self.calibration_samples = 0
        self.calibration_threshold = 150  # ~15 seconds of neutral face to achieve initial calibration

        self._load_profile()

    def _load_profile(self):
        """Load user profile and baseline parameters from disk if available."""
        if not os.path.exists(PROFILE_FILE):
            return
        try:
            with open(PROFILE_FILE, "r") as f:
                data = json.load(f)
                if data.get("user_id") == self.user_id:
                    self.baseline_means = data.get("baseline_means", self.baseline_means)
                    self.anchor_baseline = data.get("anchor_baseline", self.anchor_baseline)
                    self.emotion_bias = data.get("emotion_bias", self.emotion_bias)
                    self.calibration_samples = data.get("calibration_samples", 0)
                    print(f"[continual_learning] Loaded profile for {self.user_id} [OK] (calibrated samples: {self.calibration_samples})")
        except Exception as e:
            print(f"[continual_learning] Warning loading profile: {e}")

    def save_profile(self):
        """Persist calibrated profile to disk."""
        os.makedirs(DATA_DIR, exist_ok=True)
        try:
            payload = {
                "user_id": self.user_id,
                "timestamp": time.time(),
                "calibration_samples": self.calibration_samples,
                "baseline_means": self.baseline_means,
                "anchor_baseline": self.anchor_baseline,
                "emotion_bias": self.emotion_bias,
                "plasticity_index": self.plasticity_index,
                "stability_index": self.stability_index,
            }
            with open(PROFILE_FILE, "w") as f:
                json.dump(payload, f, indent=2)
        except Exception as e:
            print(f"[continual_learning] Error saving profile: {e}")

    def update_baseline(self, action_units: Dict[str, float], ear: float, is_neutral_context: bool):
        """
        Continuously updates user baseline when the user is in a calm/neutral state.
        Applies incremental Welford update with regularization against anchor.
        """
        if not is_neutral_context:
            return

        self.calibration_samples += 1
        lr = 0.02 if self.calibration_samples < self.calibration_threshold else 0.002

        # Update running baseline for each AU
        for k in ("AU4", "AU12", "AU15", "AU7"):
            current_val = action_units.get(k, 0.0)
            # Elastic update: step towards current observation, pulled back by anchor
            raw_update = (1.0 - lr) * self.baseline_means[k] + lr * current_val
            # Regularization penalty towards long-term anchor
            self.baseline_means[k] = (1.0 - self.regularization_lambda * lr) * raw_update + (self.regularization_lambda * lr) * self.anchor_baseline[k]

        # Update EAR baseline
        raw_ear = (1.0 - lr) * self.baseline_means["EAR"] + lr * ear
        self.baseline_means["EAR"] = (1.0 - self.regularization_lambda * lr) * raw_ear + (self.regularization_lambda * lr) * self.anchor_baseline["EAR"]

        # Drift measurement
        drift_sum = sum(abs(self.baseline_means[k] - self.anchor_baseline[k]) for k in self.baseline_means)
        self.adaptation_drift = round(float(drift_sum / len(self.baseline_means)), 4)
        self.stability_index = round(float(1.0 - min(0.5, self.adaptation_drift * 2.0)), 3)

        # Periodic autosave every 200 samples
        if self.calibration_samples % 200 == 0:
            self.save_profile()

    def calibrate_features(self, action_units: Dict[str, float]) -> Dict[str, float]:
        """
        Subtracts personalized neutral baseline from raw Action Units.
        Produces baseline-normalized delta features.
        """
        calibrated = {}
        for k, v in action_units.items():
            base = self.baseline_means.get(k, 0.0)
            # Delta above baseline
            calibrated[k] = round(float(max(0.0, v - base)), 3)
        return calibrated

    def record_episode(self, episode_data: dict):
        """Store an affective transition into episodic replay buffer."""
        self.replay_buffer.append({
            "timestamp": time.time(),
            **episode_data
        })

    def apply_user_feedback(self, corrected_emotion: str, raw_features: dict):
        """
        Active learning: User corrects or confirms detected emotion.
        Updates emotion bias weights and logs experience.
        """
        if corrected_emotion in self.emotion_bias:
            for em in self.emotion_bias:
                if em == corrected_emotion:
                    self.emotion_bias[em] = min(0.35, self.emotion_bias[em] + 0.05)
                else:
                    self.emotion_bias[em] = max(-0.25, self.emotion_bias[em] - 0.01)

            self.record_episode({
                "type": "user_feedback_correction",
                "corrected_emotion": corrected_emotion,
                "features": raw_features,
            })
            self.save_profile()
            print(f"[continual_learning] Adapted bias for correction: {corrected_emotion} [OK]")

    def get_telemetry(self) -> dict:
        """Expose Continual Learning engine telemetry for dashboard."""
        calib_pct = min(100, int((self.calibration_samples / self.calibration_threshold) * 100))
        return {
            "user_id": self.user_id,
            "calibration_samples": self.calibration_samples,
            "calibration_status": f"{calib_pct}% Calibrated" if calib_pct < 100 else "Active (Baseline Anchored)",
            "calibration_pct": calib_pct,
            "plasticity_index": self.plasticity_index,
            "stability_index": self.stability_index,
            "adaptation_drift": self.adaptation_drift,
            "episodes_stored": len(self.replay_buffer),
            "baseline_means": {k: round(v, 3) for k, v in self.baseline_means.items()},
        }
