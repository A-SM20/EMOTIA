import React from 'react';
import { useEmotion } from '../context/EmotionContext';
import { X, Sliders, Volume2, Shield, RefreshCw, Cpu, BookOpen, Layers } from 'lucide-react';

export const SettingsModal = () => {
  const {
    settingsOpen,
    setSettingsOpen,
    isAutoCycle,
    setIsAutoCycle,
    cycleSpeed,
    setCycleSpeed,
    ttsEnabled,
    setTtsEnabled,
    cameraActive,
    setCameraActive,
    micActive,
    setMicActive,
    triggerScenario,
  } = useEmotion();

  if (!settingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface border border-surface-border rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">EMOTIA System Settings</h2>
              <p className="text-xs text-slate-400">Simulation parameters & multimodal pipeline tuning</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1.5 rounded-lg bg-surface-light text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Live Demo & Simulation Controls */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Simulation Loop Controls</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-surface-light p-3 rounded-xl border border-surface-border flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">Auto-Cycle Scenarios</div>
                <div className="text-[11px] text-slate-400">Cycles through mock HRI states</div>
              </div>
              <input
                type="checkbox"
                checked={isAutoCycle}
                onChange={(e) => setIsAutoCycle(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="bg-surface-light p-3 rounded-xl border border-surface-border">
              <div className="text-xs font-semibold text-slate-200 mb-1">Cycle Duration</div>
              <select
                value={cycleSpeed}
                onChange={(e) => setCycleSpeed(Number(e.target.value))}
                className="w-full bg-surface text-slate-200 border border-surface-border rounded-lg px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-cyan-400"
              >
                <option value={4000}>4 Seconds (Fast Demo)</option>
                <option value={8000}>8 Seconds (Recommended)</option>
                <option value={12000}>12 Seconds (Detailed Observation)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Multimodal Perceptual Streams */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 font-mono flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Active Sensor Inputs</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-surface-light p-3 rounded-xl border border-surface-border flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">Facial Vision Stream</div>
                <div className="text-[11px] text-slate-400">OpenFace 3D + Swin-FER</div>
              </div>
              <input
                type="checkbox"
                checked={cameraActive}
                onChange={(e) => setCameraActive(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="bg-surface-light p-3 rounded-xl border border-surface-border flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">Acoustic Audio Stream</div>
                <div className="text-[11px] text-slate-400">Wav2Vec2 Prosody Front-end</div>
              </div>
              <input
                type="checkbox"
                checked={micActive}
                onChange={(e) => setMicActive(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Audio TTS & Assistant Voice */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 font-mono flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Voice & Proactive Speech</span>
          </h3>

          <div className="bg-surface-light p-3 rounded-xl border border-surface-border flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200">Synthetic Voice Output (Web Speech TTS)</div>
              <div className="text-[11px] text-slate-400">Speak assistant recommendations aloud</div>
            </div>
            <input
              type="checkbox"
              checked={ttsEnabled}
              onChange={(e) => setTtsEnabled(e.target.checked)}
              className="w-4 h-4 accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Section 4: Research Paper Metadata */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/30 to-blue-950/30 border border-cyan-500/20 text-xs space-y-1.5">
          <div className="flex items-center space-x-1.5 text-cyan-300 font-semibold font-mono">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Paper: "Context-Aware and Explainable Emotion Intelligence"</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Frontend evaluation platform showcasing multimodal affective intelligence, personalized behavioral memory, and human-interpretable feature attribution (XAI).
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-surface-border">
          <button
            onClick={() => {
              triggerScenario('frustrated', false);
              setSettingsOpen(false);
            }}
            className="px-4 py-2 rounded-xl bg-surface-light border border-surface-border text-slate-300 hover:text-white text-xs font-mono"
          >
            Reset Demo State
          </button>
          <button
            onClick={() => setSettingsOpen(false)}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold text-xs shadow-glow-cyan hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
