import React from 'react';
import { useEmotion } from '../context/EmotionContext';
import { CheckCircle2, Cpu, Activity, Server, Radio } from 'lucide-react';

export const SystemStatusMatrix = () => {
  const { systemSubmodules, cameraActive, micActive } = useEmotion();

  return (
    <div className="bg-surface rounded-2xl border border-surface-border p-4 shadow-subtle-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
            Pipeline Submodule Telemetry
          </h3>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
          9/9 Subsystems Online
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
              className={`p-2.5 rounded-xl border transition-all ${
                isRunning
                  ? 'bg-surface-light/70 border-surface-border hover:border-cyan-500/30'
                  : 'bg-slate-900/40 border-slate-800 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-slate-200 truncate pr-1">
                  {sub.name}
                </span>
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  {isRunning && (
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ backgroundColor: sub.color }}
                    ></span>
                  )}
                  <span
                    className="relative inline-flex rounded-full h-2 w-2"
                    style={{ backgroundColor: isRunning ? sub.color : '#64748B' }}
                  ></span>
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="text-slate-500">{sub.category}</span>
                <span className={isRunning ? 'text-cyan-400 font-semibold' : 'text-slate-500'}>
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
