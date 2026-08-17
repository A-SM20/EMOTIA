import React, { useState } from 'react';
import { useEmotion } from '../context/EmotionContext';
import { CameraHUD } from '../components/CameraHUD';
import { SystemStatusMatrix } from '../components/SystemStatusMatrix';
import { QuickScenarioBar } from '../components/QuickScenarioBar';
import {
  Mic,
  MicOff,
  Volume2,
  Send,
  Sparkles,
  Bot,
  Compass,
  Zap,
  Activity,
  Layers,
  ArrowUpRight,
  HelpCircle,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';

export const DashboardScreen = () => {
  const {
    scenario,
    isSpeaking,
    speakAssistantMessage,
    stopSpeaking,
    isListening,
    setIsListening,
    sendMessage,
    setActiveScreen,
  } = useEmotion();

  const [inputPrompt, setInputPrompt] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputPrompt.trim()) return;
    sendMessage(inputPrompt);
    setInputPrompt('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Quick Scenario Demo Toolbar */}
      <QuickScenarioBar />

      {/* Main Grid: Left (Camera & System Matrix) | Right (Current State & AI Assistant) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera HUD & System Matrix (7 Cols on LG) */}
        <div className="lg:col-span-7 space-y-6">
          <CameraHUD />
          <SystemStatusMatrix />
        </div>

        {/* Right Column: Current State Card & AI Assistant (5 Cols on LG) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          {/* Card 1: Current State Card */}
          <div className={`rounded-2xl bg-surface border p-5 shadow-subtle-card relative overflow-hidden transition-all duration-500 ${scenario.glowClass} ${scenario.borderColor}`}>
            {/* Ambient Background Glow */}
            <div
              className="absolute -right-12 -top-12 w-48 h-48 rounded-full opacity-15 filter blur-3xl pointer-events-none"
              style={{ backgroundColor: scenario.color }}
            ></div>

            {/* Card Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Live Affective Telemetry
                </span>
              </div>

              <button
                onClick={() => setActiveScreen('live')}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 hover:underline"
              >
                <span>Full Stream</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Big Emotion Label & Emoji Display */}
            <div className="flex items-center space-x-4 mb-5">
              <div className="text-5xl sm:text-6xl filter drop-shadow-md animate-pulse-slow">
                {scenario.emoji}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight ${scenario.textColor}`}>
                    {scenario.label}
                  </h2>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                    {scenario.confidence}% Conf.
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1">
                  Cross-attention fusion verified
                </p>
              </div>
            </div>

            {/* Confidence Bar */}
            <div className="space-y-1.5 mb-5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Model Fusion Confidence</span>
                <span className="font-bold text-white">{scenario.confidence}%</span>
              </div>
              <div className="h-2 w-full bg-surface-light rounded-full overflow-hidden p-0.5 border border-surface-border">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${scenario.confidence}%`,
                    backgroundColor: scenario.color,
                    boxShadow: `0 0 10px ${scenario.color}`,
                  }}
                ></div>
              </div>
            </div>

            {/* Context & Dimensional Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-surface-border">
              {/* Task Context */}
              <div className="bg-surface-light/80 p-3 rounded-xl border border-surface-border">
                <div className="text-[10px] uppercase font-mono text-slate-400 mb-1 flex items-center gap-1">
                  <Compass className="w-3 h-3 text-cyan-400" />
                  <span>Desk Context</span>
                </div>
                <div className="text-xs font-semibold text-slate-200 truncate" title={scenario.taskContext}>
                  {scenario.taskContext}
                </div>
                <div className="text-[10px] text-slate-500 truncate" title={scenario.taskDetails}>
                  {scenario.taskDetails}
                </div>
              </div>

              {/* Valence & Arousal (Russell's Model) */}
              <div className="bg-surface-light/80 p-3 rounded-xl border border-surface-border">
                <div className="text-[10px] uppercase font-mono text-slate-400 mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Russell 2D Model</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Valence:</span>
                  <span className={scenario.valence >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    {scenario.valence > 0 ? `+${scenario.valence}` : scenario.valence}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Arousal:</span>
                  <span className={scenario.arousal >= 0 ? 'text-amber-400 font-semibold' : 'text-sky-400 font-semibold'}>
                    {scenario.arousal > 0 ? `+${scenario.arousal}` : scenario.arousal}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: AI Assistant Interaction & Speech Card */}
          <div className="rounded-2xl bg-surface border border-surface-border p-5 shadow-subtle-card flex-1 flex flex-col justify-between space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-black">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                    Proactive Desk Assistant
                  </h3>
                  <div className="text-[10px] text-cyan-400 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span>Context-Aware Agent Ready</span>
                  </div>
                </div>
              </div>

              {/* Speak Audio Action Button */}
              <button
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                  } else {
                    speakAssistantMessage(scenario.assistantMessage);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center space-x-1.5 border transition-all ${
                  isSpeaking
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-glow-cyan animate-pulse'
                    : 'bg-surface-light text-slate-300 border-surface-border hover:text-cyan-400 hover:border-cyan-500/40'
                }`}
                title="Synthesize and speak message aloud"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-bounce text-cyan-400' : ''}`} />
                <span>{isSpeaking ? 'Speaking...' : 'Speak'}</span>
              </button>
            </div>

            {/* Assistant Speech Bubble */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-surface-light via-surface-light/90 to-surface border border-cyan-500/20 relative">
              <div className="text-xs text-slate-400 font-mono mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                  <Sparkles className="w-3 h-3" />
                  <span>Proactive Recommendation</span>
                </span>
                <span className="text-[10px] text-slate-500">Live Agent Response</span>
              </div>
              <p className="text-sm text-slate-100 leading-relaxed font-sans">
                "{scenario.assistantMessage}"
              </p>

              {/* Animated Audio Frequency Waves if speaking */}
              {isSpeaking && (
                <div className="mt-3 pt-2 border-t border-cyan-500/20 flex items-center space-x-1">
                  <span className="text-[10px] font-mono text-cyan-400 mr-2">TTS Audio Output:</span>
                  {[40, 75, 100, 60, 90, 45, 80, 95, 50, 70].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-cyan-400 rounded-full animate-pulse"
                      style={{
                        height: `${h * 0.16}px`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    ></div>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Prompt / Query Input Bar */}
            <form onSubmit={handleSend} className="space-y-2">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder={`Ask EMOTIA or test prompt (e.g. "I'm stuck on this bug")...`}
                  className="w-full bg-surface-light border border-surface-border rounded-xl pl-3.5 pr-24 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />

                <div className="absolute right-1.5 flex items-center space-x-1">
                  {/* Mic Listening Indicator / Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsListening(!isListening)}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${
                      isListening
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                        : 'bg-surface text-slate-500 hover:text-slate-300'
                    }`}
                    title={isListening ? 'Microphone Active (Listening...)' : 'Microphone Muted'}
                  >
                    {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                  </button>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!inputPrompt.trim()}
                    className={`p-1.5 rounded-lg text-xs transition-all ${
                      inputPrompt.trim()
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold shadow-glow-cyan'
                        : 'bg-surface text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Status footer with listening indicator */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
                <div className="flex items-center space-x-1.5">
                  <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`}></span>
                  <span>{isListening ? 'Mic Active • Continuous Ambient Acoustic Sensing' : 'Mic Paused'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveScreen('conversations')}
                  className="text-cyan-400 hover:underline"
                >
                  View Transcript History →
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
