import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { SCENARIOS, INITIAL_CONVERSATIONS, SYSTEM_SUBMODULES } from '../data/mockScenarios';

const EmotionContext = createContext(null);

const SCENARIO_KEYS = ['frustrated', 'calm', 'happy', 'stressed', 'neutral'];

export const EmotionProvider = ({ children }) => {
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [currentScenarioKey, setCurrentScenarioKey] = useState('frustrated');
  const [isAutoCycle, setIsAutoCycle] = useState(true);
  const [cycleSpeed, setCycleSpeed] = useState(8000); // 8s
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [isListening, setIsListening] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // User Profile state
  const [userProfile, setUserProfile] = useState({
    name: 'Dr. Alex Vance',
    role: 'Senior HRI Researcher',
    institution: 'Human-Robot Interaction Lab',
    preferredStyle: 'Detailed & Proactive',
    currentFocus: 'Multimodal Fusion & Explainable Emotion AI',
    interests: ['Affective HRI', 'Multimodal Attention', 'Neuro-Symbolic XAI', 'PyTorch', 'Robotics UI'],
  });

  // Generate initial historical emotion data for recharts
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
      
      // Try to find a pleasant English voice
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

    // Push new point into emotion history
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
      // Keep last 15 points
      return updated.slice(-15);
    });

    if (speak && ttsEnabled) {
      speakAssistantMessage(targetScenario.assistantMessage);
    }
  }, [speakAssistantMessage, ttsEnabled]);

  // Auto-cycle loop
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

  // Send a custom message from user
  const sendMessage = useCallback((userText) => {
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

    // Simulated contextual Assistant response
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
    }, 900);
  }, [currentScenarioKey, micActive, speakAssistantMessage, ttsEnabled]);

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
