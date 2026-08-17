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
  Compass,
  Zap,
  Activity,
  ArrowUpRight
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
    <div className="space-y-5 animate-fadeIn">
      {/* Quick Scenario Demo Toolbar */}
      <QuickScenarioBar />

      {/* Main Grid: Left (Camera & System Matrix) | Right (Current State & AI Assistant) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Camera HUD & System Matrix (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <CameraHUD />
          <SystemStatusMatrix />
        </div>

        {/* Right Column: Current State Card & AI Assistant (5 Cols) */}
        <div className="lg:col-span-5 space-y-5 flex flex-col">
          {/* Card 1: Current State Card */}
          <div className="rounded-xl bg-[#121215] border border-white/[0.08] p-5 shadow-card relative overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: scenario.dotColor }}
                ></span>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                  Current Affect State
                </span>
              </div>

              <button
                onClick={() => setActiveScreen('live')}
                className="text-xs font-mono text-zinc-400 hover:text-white flex items-center space-x-1 transition-colors"
              >
                <span>Full Telemetry</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {/* Big Emotion Label & Emoji */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="text-5xl">
                {scenario.emoji}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    {scenario.label}
                  </h2>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-white/[0.08]">
                    {scenario.confidence}%
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Multimodal cross-attention confirmed
                </p>
              </div>
            </div>

            {/* Confidence Progress Bar */}
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">Model Confidence</span>
                <span className="font-semibold text-white">{scenario.confidence}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/[0.06]">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${scenario.confidence}%` }}
                ></div>
              </div>
            </div>

            {/* Context & Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-white/[0.08]">
              {/* Task Context */}
              <div className="bg-zinc-900/80 p-3 rounded-lg border border-white/[0.06]">
                <div className="text-[10px] uppercase font-mono text-zinc-500 mb-1 flex items-center gap-1">
                  <Compass className="w-3 h-3 text-zinc-400" />
                  <span>Task Context</span>
                </div>
                <div className="text-xs font-medium text-zinc-200 truncate" title={scenario.taskContext}>
                  {scenario.taskContext}
                </div>
                <div className="text-[10px] text-zinc-500 truncate" title={scenario.taskDetails}>
                  {scenario.taskDetails}
                </div>
              </div>

              {/* Valence & Arousal */}
              <div className="bg-zinc-900/80 p-3 rounded-lg border border-white/[0.06]">
                <div className="text-[10px] uppercase font-mono text-zinc-500 mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-zinc-400" />
                  <span>Affect Dimensions</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500">Valence:</span>
                  <span className="text-zinc-200 font-medium">{scenario.valence > 0 ? `+${scenario.valence}` : scenario.valence}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500">Arousal:</span>
                  <span className="text-zinc-200 font-medium">{scenario.arousal > 0 ? `+${scenario.arousal}` : scenario.arousal}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: AI Assistant Interaction Card */}
          <div className="rounded-xl bg-[#121215] border border-white/[0.08] p-5 shadow-card flex-1 flex flex-col justify-between space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                  Desk Assistant
                </h3>
                <div className="text-[10px] text-zinc-500 font-mono">
                  Context-Aware Recommendation
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
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center space-x-1.5 border transition-all ${
                  isSpeaking
                    ? 'bg-zinc-800 text-white border-white/20'
                    : 'bg-zinc-900 text-zinc-400 border-white/[0.08] hover:text-white hover:border-white/20'
                }`}
                title="Synthesize and speak message aloud"
              >
                <Volume2 className="w-3 h-3 text-zinc-300" />
                <span>{isSpeaking ? 'Speaking...' : 'Speak'}</span>
              </button>
            </div>

            {/* Assistant Speech Bubble */}
            <div className="p-3.5 rounded-lg bg-zinc-900/90 border border-white/[0.06] relative space-y-1.5">
              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans">
                "{scenario.assistantMessage}"
              </p>

              {/* Animated audio wave indicator if speaking */}
              {isSpeaking && (
                <div className="pt-2 border-t border-white/[0.08] flex items-center space-x-1">
                  <span className="text-[10px] font-mono text-zinc-400 mr-2">Audio Out:</span>
                  {[40, 75, 100, 60, 90, 45, 80, 95, 50, 70].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-white rounded-full animate-pulse"
                      style={{
                        height: `${h * 0.14}px`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    ></div>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Prompt Input Bar */}
            <form onSubmit={handleSend} className="space-y-2">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder={`Ask EMOTIA or test query...`}
                  className="w-full bg-zinc-900 border border-white/[0.08] rounded-lg pl-3 pr-20 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
                />

                <div className="absolute right-1 flex items-center space-x-1">
                  {/* Mic Listening Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsListening(!isListening)}
                    className={`p-1.5 rounded-md text-xs transition-colors ${
                      isListening
                        ? 'text-white bg-zinc-800'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title={isListening ? 'Microphone Active (Listening...)' : 'Microphone Muted'}
                  >
                    {isListening ? <Mic className="w-3 h-3 text-zinc-200" /> : <MicOff className="w-3 h-3" />}
                  </button>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!inputPrompt.trim()}
                    className={`p-1.5 rounded-md text-xs transition-all ${
                      inputPrompt.trim()
                        ? 'bg-white text-black font-semibold hover:bg-zinc-200'
                        : 'text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Status footer */}
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 px-0.5">
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>{isListening ? 'Ambient Mic Active' : 'Mic Inactive'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveScreen('conversations')}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Transcript →
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
