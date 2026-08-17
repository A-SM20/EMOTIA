import React from 'react';
import { useEmotion } from '../context/EmotionContext';
import { X, Sliders, Volume2, RefreshCw, Layers } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121215] border border-white/[0.08] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2.5">
            <Sliders className="w-4 h-4 text-zinc-300" />
            <div>
              <h2 className="text-sm font-semibold text-white">System Settings</h2>
              <p className="text-xs text-zinc-400">Simulation parameters and sensor streams</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Simulation */}
        <div className="space-y-2.5">
          <div className="text-xs font-medium text-zinc-300">Simulation Controls</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-zinc-900/80 p-3 rounded-lg border border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-zinc-200">Auto Cycle</div>
                <div className="text-[11px] text-zinc-500">Loop through scenarios</div>
              </div>
              <input
                type="checkbox"
                checked={isAutoCycle}
                onChange={(e) => setIsAutoCycle(e.target.checked)}
                className="w-4 h-4 accent-white cursor-pointer"
              />
            </div>

            <div className="bg-zinc-900/80 p-3 rounded-lg border border-white/[0.06]">
              <div className="text-xs font-medium text-zinc-200 mb-1">Interval</div>
              <select
                value={cycleSpeed}
                onChange={(e) => setCycleSpeed(Number(e.target.value))}
                className="w-full bg-[#121215] text-zinc-200 border border-white/[0.08] rounded-md px-2 py-1 text-xs font-mono focus:outline-none focus:border-white/20"
              >
                <option value={5000}>5 Seconds</option>
                <option value={8000}>8 Seconds (Default)</option>
                <option value={12000}>12 Seconds</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Sensor Streams */}
        <div className="space-y-2.5">
          <div className="text-xs font-medium text-zinc-300">Sensor Streams</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-zinc-900/80 p-3 rounded-lg border border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-zinc-200">Camera Stream</div>
                <div className="text-[11px] text-zinc-500">Facial Vision</div>
              </div>
              <input
                type="checkbox"
                checked={cameraActive}
                onChange={(e) => setCameraActive(e.target.checked)}
                className="w-4 h-4 accent-white cursor-pointer"
              />
            </div>

            <div className="bg-zinc-900/80 p-3 rounded-lg border border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-zinc-200">Microphone Stream</div>
                <div className="text-[11px] text-zinc-500">Acoustic Speech</div>
              </div>
              <input
                type="checkbox"
                checked={micActive}
                onChange={(e) => setMicActive(e.target.checked)}
                className="w-4 h-4 accent-white cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Speech Synthesis */}
        <div className="space-y-2.5">
          <div className="text-xs font-medium text-zinc-300">Voice Synthesis</div>
          <div className="bg-zinc-900/80 p-3 rounded-lg border border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-zinc-200">Voice Assistant Speech (TTS)</div>
              <div className="text-[11px] text-zinc-500">Speak assistant proactive suggestions</div>
            </div>
            <input
              type="checkbox"
              checked={ttsEnabled}
              onChange={(e) => setTtsEnabled(e.target.checked)}
              className="w-4 h-4 accent-white cursor-pointer"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-white/[0.08]">
          <button
            onClick={() => {
              triggerScenario('frustrated', false);
              setSettingsOpen(false);
            }}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium"
          >
            Reset
          </button>
          <button
            onClick={() => setSettingsOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
