"""
fusion.py — Weighted fusion of face, eye fatigue, and speech emotion signals.

Maps fused emotion to:
  - valence  (-1 to +1)
  - arousal  (-1 to +1)
  - confidence
  - final emotion label
"""

# Valence / Arousal mapping per emotion
CIRCUMPLEX = {
    "happy":      {"valence":  0.85, "arousal":  0.60},
    "calm":       {"valence":  0.65, "arousal": -0.40},
    "neutral":    {"valence":  0.05, "arousal":  0.05},
    "stressed":   {"valence": -0.70, "arousal":  0.80},
    "frustrated": {"valence": -0.60, "arousal":  0.70},
}

# Fusion weights
W_FACE    = 0.55
W_SPEECH  = 0.30
W_FATIGUE = 0.15  # fatigue modulates arousal axis

EMOTION_PRIORITY = ["frustrated", "stressed", "happy", "calm", "neutral"]


def _emotion_vec(emotion: str) -> dict:
    return CIRCUMPLEX.get(emotion, CIRCUMPLEX["neutral"])


def fuse(face_result: dict, speech_result: dict, fatigue_result: dict) -> dict:
    """
    Combine face, speech, and fatigue signals into a single emotion prediction.

    Returns:
        {
          "emotion": str,
          "confidence": float,
          "valence": float,
          "arousal": float,
          "sources": {...}  # individual contributions
        }
    """
    face_emotion    = face_result.get("emotion", "neutral")
    face_conf       = face_result.get("confidence", 0.5) if face_result.get("detected") else 0.0

    speech_emotion  = speech_result.get("emotion", "neutral")
    speech_conf     = speech_result.get("confidence", 0.5) if speech_result.get("active") else 0.0

    fatigue_score   = fatigue_result.get("fatigue_score", 0.0)
    fatigue_alert   = fatigue_result.get("alert", "alert")

    # Translate fatigue into an emotion modifier
    fatigue_emotion = "stressed" if fatigue_score > 0.5 else "neutral"
    fatigue_conf    = fatigue_score

    # Weighted emotion scores per class
    scores = {e: 0.0 for e in CIRCUMPLEX}

    def _add(emotion, conf, weight):
        em = emotion if emotion in scores else "neutral"
        scores[em] += conf * weight

    _add(face_emotion,    face_conf,    W_FACE)
    _add(speech_emotion,  speech_conf,  W_SPEECH)
    _add(fatigue_emotion, fatigue_conf, W_FATIGUE)

    # Pick dominant emotion
    best_emotion = max(scores, key=lambda e: scores[e])
    total = sum(scores.values()) or 1.0
    confidence = round(scores[best_emotion] / total, 3)

    # Ensure minimum confidence floor when face is detected
    if face_result.get("detected") and confidence < 0.55:
        confidence = 0.55

    va = _emotion_vec(best_emotion)

    # Fatigue boosts arousal when stressed/frustrated
    arousal = va["arousal"]
    if fatigue_score > 0.4 and best_emotion in ("frustrated", "stressed", "neutral"):
        arousal = min(1.0, arousal + fatigue_score * 0.3)

    return {
        "emotion":    best_emotion,
        "confidence": confidence,
        "valence":    round(va["valence"], 3),
        "arousal":    round(arousal, 3),
        "fatigue":    fatigue_result,
        "sources": {
            "face": {
                "emotion": face_emotion,
                "confidence": round(face_conf, 3),
                "weight": W_FACE,
            },
            "speech": {
                "emotion": speech_emotion,
                "confidence": round(speech_conf, 3),
                "weight": W_SPEECH,
            },
            "fatigue": {
                "emotion": fatigue_emotion,
                "score": round(fatigue_score, 3),
                "alert": fatigue_alert,
                "weight": W_FATIGUE,
            },
        },
    }
