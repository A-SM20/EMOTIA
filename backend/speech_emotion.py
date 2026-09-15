"""
speech_emotion.py — Real-time speech emotion recognition using HuggingFace Wav2Vec2.

Model: superb/wav2vec2-base-superb-er (speech emotion recognition, ~360MB download on first run)
Falls back to energy-based heuristic if model unavailable.
"""

import threading
import time
import collections
import numpy as np

try:
    import pyaudio
    PYAUDIO_AVAILABLE = True
except ImportError:
    PYAUDIO_AVAILABLE = False
    print("[speech_emotion] pyaudio not available — audio disabled")

try:
    from transformers import pipeline as hf_pipeline
    HF_AVAILABLE = True
except ImportError:
    HF_AVAILABLE = False

# Emotion label mapping (superb-er → EMOTIA labels)
EMOTION_MAP = {
    "ang": "frustrated",
    "hap": "happy",
    "neu": "neutral",
    "sad": "stressed",
    "exc": "happy",
    "fea": "stressed",
    "dis": "frustrated",
    # Some models use full names
    "angry":   "frustrated",
    "happy":   "happy",
    "neutral": "neutral",
    "sad":     "stressed",
    "fearful": "stressed",
    "disgust": "frustrated",
    "surprised": "neutral",
    "calm":    "calm",
}

SAMPLE_RATE  = 16000
CHUNK_SIZE   = 1024
BUFFER_SECS  = 2        # analyze 2 seconds of audio at a time
ANALYZE_EVERY = 2.0     # seconds between analyses


class SpeechEmotionDetector:
    def __init__(self):
        self._lock = threading.Lock()
        self._result = {
            "active":      False,
            "emotion":     "neutral",
            "confidence":  0.0,
            "energy":      0.0,
            "probabilities": {},
        }

        self._buffer = collections.deque(maxlen=SAMPLE_RATE * BUFFER_SECS // CHUNK_SIZE)
        self._model  = None
        self._stream = None
        self._pa     = None
        self._running = False
        self._last_analysis = 0.0

        # Load model in background
        t = threading.Thread(target=self._load_model, daemon=True)
        t.start()

    def _load_model(self):
        if not HF_AVAILABLE:
            return
        try:
            print("[speech_emotion] Loading wav2vec2 model (may download ~360MB first run)...")
            self._model = hf_pipeline(
                "audio-classification",
                model="superb/wav2vec2-base-superb-er",
                device=-1,    # CPU
            )
            print("[speech_emotion] Model loaded ✓")
        except Exception as e:
            print(f"[speech_emotion] Model load failed: {e}")

    def start(self):
        """Start microphone capture thread."""
        if not PYAUDIO_AVAILABLE:
            print("[speech_emotion] pyaudio unavailable — skipping mic capture")
            return

        try:
            self._pa = pyaudio.PyAudio()
            self._stream = self._pa.open(
                format=pyaudio.paInt16,
                channels=1,
                rate=SAMPLE_RATE,
                input=True,
                frames_per_buffer=CHUNK_SIZE,
                stream_callback=self._audio_callback,
            )
            self._stream.start_stream()
            self._running = True

            # Start analysis thread
            t = threading.Thread(target=self._analysis_loop, daemon=True)
            t.start()
            print("[speech_emotion] Mic capture started ✓")
        except Exception as e:
            print(f"[speech_emotion] Could not open microphone: {e}")

    def _audio_callback(self, in_data, frame_count, time_info, status):
        """Called by PyAudio on each chunk."""
        chunk = np.frombuffer(in_data, dtype=np.int16).astype(np.float32) / 32768.0
        self._buffer.append(chunk)
        return (None, pyaudio.paContinue)

    def _analysis_loop(self):
        """Periodically analyze buffered audio."""
        while self._running:
            now = time.time()
            if now - self._last_analysis >= ANALYZE_EVERY and len(self._buffer) > 0:
                self._last_analysis = now
                audio = np.concatenate(list(self._buffer))
                self._analyze(audio)
            time.sleep(0.1)

    def _analyze(self, audio: np.ndarray):
        """Run emotion classification on audio array."""
        energy = float(np.sqrt(np.mean(audio ** 2)))

        # If audio is mostly silence, skip
        if energy < 0.005:
            with self._lock:
                self._result["active"] = False
                self._result["energy"] = round(energy, 4)
            return

        if self._model is not None:
            try:
                preds = self._model(audio, sampling_rate=SAMPLE_RATE, top_k=None)
                # preds = [{"label": "...", "score": 0.xx}, ...]
                top   = preds[0]
                label = top["label"].lower()
                conf  = top["score"]
                emotion = EMOTION_MAP.get(label, "neutral")
                probs = {
                    EMOTION_MAP.get(p["label"].lower(), p["label"]): round(p["score"], 3)
                    for p in preds
                }
                with self._lock:
                    self._result = {
                        "active":        True,
                        "emotion":       emotion,
                        "confidence":    round(conf, 3),
                        "energy":        round(energy, 4),
                        "probabilities": probs,
                    }
                return
            except Exception as e:
                print(f"[speech_emotion] inference error: {e}")

        # Fallback: energy heuristic
        emotion = "neutral"
        if energy > 0.15:
            emotion = "frustrated"
        elif energy > 0.07:
            emotion = "happy"

        with self._lock:
            self._result = {
                "active":        True,
                "emotion":       emotion,
                "confidence":    0.5,
                "energy":        round(energy, 4),
                "probabilities": {},
            }

    def get_result(self) -> dict:
        with self._lock:
            return self._result.copy()

    def stop(self):
        self._running = False
        if self._stream:
            self._stream.stop_stream()
            self._stream.close()
        if self._pa:
            self._pa.terminate()
