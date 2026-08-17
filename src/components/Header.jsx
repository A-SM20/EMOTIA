import React, { useState, useEffect } from 'react';
import { useEmotion } from '../context/EmotionContext';
import { Play, Pause, Settings, Volume2, VolumeX, Clock } from 'lucide-react';

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
    <header className="h-14 border-b border-white/[0.08] bg-[#09090b]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: App Title */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center font-bold text-xs shadow-sm">
            E
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                EMOTIA
                <span className="text-[10px] font-mono font-normal text-zinc-400 px-1.5 py-0.2 rounded bg-zinc-900 border border-white/[0.08]">
                  v2.4
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Minimal Status Pill */}
        <div className="hidden md:flex items-center space-x-1.5 bg-zinc-900 border border-white/[0.08] rounded-full px-2.5 py-0.5 text-xs text-zinc-300 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span className="text-[11px]">System Active</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Current Active Emotion Preview Chip */}
        <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/[0.08] text-xs font-mono">
          <span>{scenario.emoji}</span>
          <span className="text-zinc-200 font-medium">{scenario.label}</span>
          <span className="text-zinc-500 font-normal">({scenario.confidence}%)</span>
        </div>

        {/* Auto Cycle Simulator Toggle */}
        <button
          onClick={() => setIsAutoCycle(!isAutoCycle)}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
            isAutoCycle
              ? 'bg-zinc-800 text-white border border-white/20'
              : 'bg-zinc-900 text-zinc-400 border border-white/[0.08] hover:text-white'
          }`}
          title={isAutoCycle ? 'Auto-cycling scenarios (Click to pause)' : 'Auto-cycle paused (Click to resume)'}
        >
          {isAutoCycle ? <Pause className="w-3 h-3 text-zinc-300" /> : <Play className="w-3 h-3" />}
          <span className="hidden sm:inline">{isAutoCycle ? 'Auto Loop' : 'Paused'}</span>
        </button>

        {/* TTS Audio Speech Toggle */}
        <button
          onClick={() => setTtsEnabled(!ttsEnabled)}
          className={`p-1.5 rounded-lg text-xs transition-all border ${
            ttsEnabled
              ? 'bg-zinc-800 text-white border-white/20'
              : 'bg-zinc-900 text-zinc-400 border-white/[0.08] hover:text-white'
          }`}
          title={ttsEnabled ? 'Voice Synthesis Active' : 'Voice Synthesis Muted'}
        >
          {ttsEnabled ? (
            <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'text-white' : 'text-zinc-300'}`} />
          ) : (
            <VolumeX className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Live Clock */}
        <div className="hidden xl:flex items-center space-x-1.5 text-zinc-400 text-xs font-mono bg-zinc-900 px-2.5 py-1 rounded-lg border border-white/[0.08]">
          <Clock className="w-3 h-3 text-zinc-400" />
          <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>

        {/* Settings Button */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-1.5 rounded-lg bg-zinc-900 border border-white/[0.08] text-zinc-300 hover:text-white hover:border-white/20 transition-colors"
          title="Open Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
