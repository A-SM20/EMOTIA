import React from 'react';
import { useEmotion } from '../context/EmotionContext';
import { Activity } from 'lucide-react';

export const SystemStatusMatrix = () => {
  const { systemSubmodules, cameraActive, micActive } = useEmotion();

  return (
    <div className="bg-[#121215] rounded-xl border border-white/[0.08] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-3.5 h-3.5 text-zinc-400" />
          <h3 className="text-xs font-semibold text-zinc-300">
            Pipeline Subsystems
          </h3>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-white/[0.08] px-2 py-0.5 rounded-full">
          9/9 Online
        </span>
      </div>

      {/* Grid of 9 Submodules */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {systemSubmodules.map((sub) => {
          let isRunning = true;
          if (sub.id === 'camera' && !cameraActive) isRunning = false;
          if (sub.id === 'microphone' && !micActive) isRunning = false;

          return (
            <div
              key={sub.id}
              className={`p-2.5 rounded-lg border transition-all ${
                isRunning
                  ? 'bg-zinc-900/80 border-white/[0.06] hover:border-white/20'
                  : 'bg-zinc-950/40 border-zinc-900 opacity-40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-zinc-200 truncate pr-1">
                  {sub.name}
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: isRunning ? '#10b981' : '#52525b' }}
                ></span>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span>{sub.category}</span>
                <span className={isRunning ? 'text-zinc-300 font-medium' : 'text-zinc-600'}>
                  {isRunning ? sub.latency : 'OFF'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
