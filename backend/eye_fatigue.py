"""
eye_fatigue.py — PERCLOS-based eye fatigue detector using MediaPipe FaceMesh landmarks.
"""

import collections
import time

# MediaPipe FaceMesh eye landmark indices
LEFT_EYE_VERT  = [159, 145]   # top lid, bottom lid
RIGHT_EYE_VERT = [386, 374]
LEFT_EYE_HORIZ  = [33, 133]
RIGHT_EYE_HORIZ = [362, 263]

BLINK_WINDOW_SECONDS = 30      # PERCLOS window
EAR_CLOSE_THRESHOLD  = 0.20    # Eye Aspect Ratio below this = closed


def _dist(p1, p2):
    return ((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2) ** 0.5


def compute_ear(landmarks):
    """Compute Eye Aspect Ratio (EAR) from MediaPipe landmark objects."""
    try:
        # Left eye
        lv = _dist(landmarks[LEFT_EYE_VERT[0]],  landmarks[LEFT_EYE_VERT[1]])
        lh = _dist(landmarks[LEFT_EYE_HORIZ[0]], landmarks[LEFT_EYE_HORIZ[1]])
        # Right eye
        rv = _dist(landmarks[RIGHT_EYE_VERT[0]],  landmarks[RIGHT_EYE_VERT[1]])
        rh = _dist(landmarks[RIGHT_EYE_HORIZ[0]], landmarks[RIGHT_EYE_HORIZ[1]])

        left_ear  = lv / (lh + 1e-6)
        right_ear = rv / (rh + 1e-6)
        return (left_ear + right_ear) / 2.0
    except Exception:
        return 0.3  # default open


class EyeFatigueDetector:
    def __init__(self):
        self._ear_history = collections.deque()   # (timestamp, ear)
        self._blink_times = collections.deque()   # timestamps of blink events
        self._in_blink    = False
        self._blink_count = 0

    def update(self, landmarks) -> dict:
        ear = compute_ear(landmarks)
        now = time.time()

        # — Blink detection —
        if ear < EAR_CLOSE_THRESHOLD and not self._in_blink:
            self._in_blink = True
        elif ear >= EAR_CLOSE_THRESHOLD and self._in_blink:
            self._in_blink = False
            self._blink_count += 1
            self._blink_times.append(now)

        # Expire old blink timestamps
        while self._blink_times and now - self._blink_times[0] > BLINK_WINDOW_SECONDS:
            self._blink_times.popleft()

        # — PERCLOS (rolling 30-second window) —
        self._ear_history.append((now, ear))
        while self._ear_history and now - self._ear_history[0][0] > BLINK_WINDOW_SECONDS:
            self._ear_history.popleft()

        closed_frames = sum(1 for _, e in self._ear_history if e < EAR_CLOSE_THRESHOLD)
        perclos = closed_frames / max(len(self._ear_history), 1)

        blink_rate = len(self._blink_times)   # blinks in last 30 s

        # — Fatigue score (0–1) —
        # PERCLOS > 0.35 = drowsy; blink_rate < 5 in 30s = fatigue
        perclos_score  = min(perclos / 0.35, 1.0)
        blink_penalty  = max(0.0, (10 - blink_rate) / 10)    # fewer blinks = more fatigue
        fatigue_score  = 0.65 * perclos_score + 0.35 * blink_penalty

        alert = "drowsy" if fatigue_score > 0.65 else ("tired" if fatigue_score > 0.35 else "alert")

        return {
            "ear":           round(ear, 3),
            "perclos":       round(perclos, 3),
            "blink_rate":    blink_rate,
            "fatigue_score": round(fatigue_score, 3),
            "alert":         alert,
            "in_blink":      self._in_blink,
        }
