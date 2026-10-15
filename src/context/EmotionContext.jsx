import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { SCENARIOS, INITIAL_CONVERSATIONS, SYSTEM_SUBMODULES } from '../data/mockScenarios';

const BACKEND_BASE_URL = 'http://localhost:8000';
const BACKEND_WS_URL = 'ws://localhost:8000/ws';
const RECONNECT_DELAY_MS = 3000;

const EmotionContext = createContext(null);

const SCENARIO_KEYS = ['frustrated', 'calm', 'happy', 'stressed', 'neutral'];

export const EmotionProvider = ({ children }) => {
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [currentScenarioKey, setCurrentScenarioKey] = useState('frustrated');
  const [isAutoCycle, setIsAutoCycle] = useState(false); // Default to live sensing
  const [cycleSpeed, setCycleSpeed] = useState(8000); // 8s
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [isListening, setIsListening] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [useLiveVideo, setUseLiveVideo] = useState(true); // Toggle between live ESP32-CAM MJPEG and 3D mesh

  // ── Live Backend State ────────────────────────────────────────────────────
  const [backendStatus, setBackendStatus] = useState('offline'); // 'connected' | 'offline'
  const [liveData, setLiveData] = useState(null);  // raw WebSocket payload
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  // WebSocket connection to FastAPI backend
  const connectWS = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
    try {
      const ws = new WebSocket(BACKEND_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setBackendStatus('connected');
        console.log('[EMOTIA] Live Backend Connected [OK]');
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLiveData(data);

          // Map detected emotion to a scenario key for UI consistency
          const emotionKey = data.emotion;
          if (SCENARIOS[emotionKey]) {
            setCurrentScenarioKey(emotionKey);
          }

          // Push live point into emotion history
          const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setEmotionHistory(prev => {
            const updated = [...prev, {
              time: nowTime,
              intensity: Math.round(data.confidence * 100),
              confidence: Math.round(data.confidence * 100),
              valence: data.valence,
              arousal: data.arousal,
              emotion: emotionKey.charAt(0).toUpperCase() + emotionKey.slice(1),
            }];
            return updated.slice(-15);
          });
        } catch (e) {
          console.warn('[EMOTIA] WS parse error:', e);
        }
      };

      ws.onerror = () => {
        setBackendStatus('offline');
      };

      ws.onclose = () => {
        setBackendStatus('offline');
        setLiveData(null);
        reconnectTimer.current = setTimeout(connectWS, RECONNECT_DELAY_MS);
      };
    } catch (e) {
      setBackendStatus('offline');
      reconnectTimer.current = setTimeout(connectWS, RECONNECT_DELAY_MS);
    }
  }, []);

  useEffect(() => {
    connectWS();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connectWS]);

  // ── Hardware & Backend REST Control API Dispatchers ───────────────────────
  const updateStreamConfig = useCallback(async (sourceUrl) => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/stream/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: sourceUrl })
      });
      return await res.json();
    } catch (e) {
      console.warn('[EMOTIA] Failed to update stream config:', e);
      return null;
    }
  }, []);

  const updateHardwareControl = useCallback(async (params) => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/hardware/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (e) {
      console.warn('[EMOTIA] Failed to send hardware control:', e);
      return null;
    }
  }, []);

  const updateEyeAnimation = useCallback(async (params) => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/hardware/eyes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (e) {
      console.warn('[EMOTIA] Failed to send eye animation:', e);
      return null;
    }
  }, []);

  const updateHardwareTransport = useCallback(async (transport, comPort = 'COM3', esp32Ip = '192.168.1.100') => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/hardware/transport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transport, com_port: comPort, esp32_ip: esp32Ip })
      });
      return await res.json();
    } catch (e) {
      console.warn('[EMOTIA] Failed to update hardware transport:', e);
      return null;
    }
  }, []);

  const submitUserFeedback = useCallback(async (correctedEmotion) => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/cl/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corrected_emotion: correctedEmotion })
      });
      return await res.json();
    } catch (e) {
      console.warn('[EMOTIA] Failed to submit user feedback:', e);
      return null;
    }
  }, []);

  const setTaskContext = useCallback(async (task, app, details) => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/context/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, app, details })
      });
      return await res.json();
    } catch (e) {
      console.warn('[EMOTIA] Failed to set task context:', e);
      return null;
    }
  }, []);

  // ── Long-Term Episodic Memory & Preference API ─────────────────────────────
  const [memories, setMemories] = useState(null);

  const fetchMemories = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/memory/list`);
      const data = await res.json();
      if (data.status === 'ok') {
        setMemories(data.memories);
      }
    } catch (e) {
      console.warn('[EMOTIA] Failed to fetch memories:', e);
    }
  }, []);

  const addMemoryNote = useCallback(async (note) => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/memory/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note)
      });
      const data = await res.json();
      if (data.status === 'ok') {
        fetchMemories();
      }
      return data;
    } catch (e) {
      console.warn('[EMOTIA] Failed to add memory note:', e);
      return null;
    }
  }, [fetchMemories]);

  useEffect(() => {
    if (backendStatus === 'connected') {
      fetchMemories();
    }
  }, [backendStatus, fetchMemories]);

  // User Profile state
  const [userProfile, setUserProfile] = useState({
    name: 'Dr. Alex Vance',
    role: 'Senior HRI Researcher',
    institution: 'Human-Robot Interaction Lab',
    preferredStyle: 'Detailed & Proactive',
    currentFocus: 'Multimodal Fusion & Explainable Emotion AI',
    interests: ['Affective HRI', 'Multimodal Attention', 'Neuro-Symbolic XAI', 'PyTorch', 'Robotics UI'],
  });

  // Initial historical emotion data for recharts
  const [emotionHistory, setEmotionHistory] = useState(() => {
    const history = [];
    const now = Date.now();
    const mockPoints = [
      { offset: 12, label: 'Calm', valence: 0.65, arousal: -0.2, intensity: 75, emotion: 'Calm' },
      { offset: 10, label: 'Calm', valence: 0.70, arousal: -0.15, intensity: 82, emotion: 'Calm' },
      { offset: 8, label: 'Neutral', valence: 0.1, arousal: 0.05, intensity: 60, emotion: 'Neutral' },
      { offset: 6, label: 'Stressed', valence: -0.55, arousal: 0.72, intensity: 84, emotion: 'Stressed' },
      { offset: 4, label: 'Frustrated', valence: -0.68, arousal: 0.81, intensity: 89, emotion: 'Frustrated' },
      { offset: 2, label: 'Frustrated', valence: -0.62, arousal: 0.74, intensity: 87, emotion: 'Frustrated' },
    ];

    mockPoints.forEach((pt) => {
      const timeStr = new Date(now - pt.offset * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      history.push({
        time: timeStr,
        intensity: pt.intensity,
        confidence: pt.intensity,
        valence: pt.valence,
        arousal: pt.arousal,
        emotion: pt.emotion,
      });
    });
    return history;
  });

  // Active scenario base object
  const scenario = SCENARIOS[currentScenarioKey] || SCENARIOS.frustrated;

  // Speech synthesis helper
  const speakAssistantMessage = useCallback((text) => {
    if (!text || !window.speechSynthesis) {
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 3500);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Zira') || v.name.includes('Samantha')));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS fallback active:", e);
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 3000);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // Switch scenario manually or automatically
  const triggerScenario = useCallback((scenarioKey, speak = false) => {
    if (!SCENARIOS[scenarioKey]) return;
    setCurrentScenarioKey(scenarioKey);
    const targetScenario = SCENARIOS[scenarioKey];

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setEmotionHistory(prev => {
      const updated = [...prev, {
        time: nowTime,
        intensity: targetScenario.confidence,
        confidence: targetScenario.confidence,
        valence: targetScenario.valence,
        arousal: targetScenario.arousal,
        emotion: targetScenario.label,
      }];
      return updated.slice(-15);
    });

    if (speak && ttsEnabled) {
      speakAssistantMessage(targetScenario.assistantMessage);
    }
  }, [speakAssistantMessage, ttsEnabled]);

  // Auto-cycle loop (only runs if user turns it on)
  const cycleIndexRef = useRef(0);
  useEffect(() => {
    if (!isAutoCycle) return;

    const interval = setInterval(() => {
      cycleIndexRef.current = (cycleIndexRef.current + 1) % SCENARIO_KEYS.length;
      const nextKey = SCENARIO_KEYS[cycleIndexRef.current];
      triggerScenario(nextKey, false);
    }, cycleSpeed);

    return () => clearInterval(interval);
  }, [isAutoCycle, cycleSpeed, triggerScenario]);

  // Send a custom message from user (Live AI Conversational Reasoning or Scenario Fallback)
  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim()) return;

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const currentScen = SCENARIOS[currentScenarioKey];

    const newUserMsg = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      time: nowTime,
      emotionTag: { label: currentScen.label, confidence: currentScen.confidence, color: currentScen.color },
      modality: micActive ? 'Voice + Screen' : 'Text Query',
    };

    setConversations(prev => [...prev, newUserMsg]);

    // 1. Try real-time affective backend reasoning
    if (backendStatus === 'connected') {
      try {
        const res = await fetch(`${BACKEND_BASE_URL}/api/chat/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userText, user_profile: userProfile })
        });
        const data = await res.json();
        if (data.status === 'ok' && data.response?.reply) {
          const resp = data.response;
          const newAssistantMsg = {
            id: Date.now() + 1,
            sender: 'assistant',
            text: resp.reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            contextTag: resp.context_tag || { task: currentScen.taskContext, emotionState: currentScen.label, proactive: true },
            recommendation: resp.recommendation || currentScen.proactiveAction,
          };
          setConversations(prev => [...prev, newAssistantMsg]);
          if (ttsEnabled) {
            speakAssistantMessage(resp.reply);
          }
          fetchMemories();
          return;
        }
      } catch (e) {
        console.warn('[EMOTIA] Chat API error, falling back:', e);
      }
    }

    // 2. Client-side fallback if backend is offline or slow
    setTimeout(() => {
      let replyText = `I understand. Based on your current ${currentScen.label.toLowerCase()} state (${currentScen.confidence}% confidence), I'm actively optimizing your workstation context and analyzing potential bottlenecks in ${currentScen.taskContext}.`;
      
      if (currentScen.id === 'frustrated') {
        replyText = `I hear the urgency. Let me isolate the last failing submodule for you and run an automated syntax/shape validation so you don't have to keep digging through stack traces.`;
      } else if (currentScen.id === 'happy') {
        replyText = `That's great progress! I've archived the successful checkpoint logs and pre-rendered your validation plots for the final paper draft.`;
      } else if (currentScen.id === 'stressed') {
        replyText = `Take a quick breath. I'm cross-checking all submission requirements in the background. The core figures and LaTeX files are ready to bundle.`;
      } else if (currentScen.id === 'calm') {
        replyText = `Understood. I will keep peripheral distractions minimized so you can maintain your writing flow.`;
      }

      const newAssistantMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        contextTag: { task: currentScen.taskContext, emotionState: currentScen.label, proactive: true },
        recommendation: currentScen.proactiveAction,
      };

      setConversations(prev => [...prev, newAssistantMsg]);
      if (ttsEnabled) {
        speakAssistantMessage(replyText);
      }
    }, 600);
  }, [currentScenarioKey, micActive, backendStatus, userProfile, ttsEnabled, speakAssistantMessage, fetchMemories]);

  const value = {
    activeScreen,
    setActiveScreen,
    currentScenarioKey,
    scenario,
    isAutoCycle,
    setIsAutoCycle,
    cycleSpeed,
    setCycleSpeed,
    cameraActive,
    setCameraActive,
    micActive,
    setMicActive,
    isListening,
    setIsListening,
    isSpeaking,
    ttsEnabled,
    setTtsEnabled,
    speakAssistantMessage,
    stopSpeaking,
    triggerScenario,
    emotionHistory,
    conversations,
    sendMessage,
    systemSubmodules: SYSTEM_SUBMODULES,
    userProfile,
    setUserProfile,
    settingsOpen,
    setSettingsOpen,
    scenarioKeys: SCENARIO_KEYS,
    allScenarios: SCENARIOS,
    // Live Backend & Hardware State
    backendStatus,
    liveData,
    connectWS,
    useLiveVideo,
    setUseLiveVideo,
    updateStreamConfig,
    updateHardwareControl,
    updateHardwareTransport,
    updateEyeAnimation,
    submitUserFeedback,
    setTaskContext,
    memories,
    fetchMemories,
    addMemoryNote,
    hardwareState: liveData?.hardware || null,
    clTelemetry: liveData?.continual_learning || null,
    contextTelemetry: liveData?.context || null,
    xaiTelemetry: liveData?.xai || null,
    backendBaseUrl: BACKEND_BASE_URL,
  };

  return (
    <EmotionContext.Provider value={value}>
      {children}
    </EmotionContext.Provider>
  );
};

export const useEmotion = () => {
  const context = useContext(EmotionContext);
  if (!context) {
    throw new Error('useEmotion must be used within an EmotionProvider');
  }
  return context;
};
