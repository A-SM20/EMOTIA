import React, { useState, useEffect } from 'react';
import { useEmotion } from '../context/EmotionContext';
import { Play, Pause, Settings, Volume2, VolumeX, Sparkles, Activity, ShieldCheck, Clock } from 'lucide-react';

export const Header = () => {
  const {
    scenario,
    isAutoCycle,
    setIsAutoCycle,
    ttsEnabled,
    setTtsEnabled,
    isSpeaking,
    setSettingsOpen,
  } = useEmotion();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b border-surface-border bg-surface/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: App Title & Paper Badge */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-glow-cyan">
            <Sparkles className="w-4 h-4 text-black font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center">
                EMOTIA
                <span className="ml-2 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  HRI v2.4
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Emotion-Aware Intelligent Desk Assistant
            </p>
          </div>
        </div>

        {/* Live System Active Badge */}
        <div className="hidden md:flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1 text-xs text-emerald-400 font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold tracking-wider">● SYSTEM ACTIVE</span>
        </div>
      </div>

      {/* Right Controls: Auto-Cycle, Audio, Time & Settings */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Current Active Emotion Preview Chip */}
        <div className={`hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full border text-xs font-mono transition-all duration-300 ${scenario.bgColor} ${scenario.borderColor}`}>
          <span className="text-sm">{scenario.emoji}</span>
          <span className={scenario.textColor}>Live: {scenario.label}</span>
          <span className="text-slate-400 font-normal">({scenario.confidence}%)</span>
        </div>

        {/* Auto Cycle Simulator Toggle */}
        <button
          onClick={() => setIsAutoCycle(!isAutoCycle)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
            isAutoCycle
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
              : 'bg-surface-light text-slate-400 border border-surface-border hover:text-white'
          }`}
          title={isAutoCycle ? 'Auto-cycling scenarios (Click to pause)' : 'Auto-cycle paused (Click to resume)'}
        >
          {isAutoCycle ? <Pause className="w-3.5 h-3.5 animate-pulse" /> : <Play className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isAutoCycle ? 'Auto-Cycle ON' : 'Cycle Paused'}</span>
        </button>

        {/* TTS Audio Speech Toggle */}
        <button
          onClick={() => setTtsEnabled(!ttsEnabled)}
          className={`p-2 rounded-lg text-xs transition-all border ${
            ttsEnabled
              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
              : 'bg-surface-light text-slate-400 border-surface-border hover:text-white'
          }`}
          title={ttsEnabled ? 'Voice Synthesis Active' : 'Voice Synthesis Muted'}
        >
          {ttsEnabled ? (
            <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-cyan-400 animate-bounce' : ''}`} />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>

        {/* Live Clock */}
        <div className="hidden xl:flex items-center space-x-1 text-slate-400 text-xs font-mono bg-surface-light/80 px-2.5 py-1.5 rounded-lg border border-surface-border">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>

        {/* Settings Button */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-2 rounded-lg bg-surface-light border border-surface-border text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
          title="Open System Settings & Demo Controls"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
