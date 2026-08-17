import React from 'react';
import { useEmotion } from '../context/EmotionContext';
import { Play, Pause, FastForward, SlidersHorizontal, Sparkles } from 'lucide-react';

export const QuickScenarioBar = () => {
  const {
    currentScenarioKey,
    triggerScenario,
    isAutoCycle,
    setIsAutoCycle,
    cycleSpeed,
    setCycleSpeed,
    allScenarios,
    scenarioKeys,
  } = useEmotion();

  return (
    <div className="bg-surface/90 border border-surface-border rounded-xl p-3 mb-6 backdrop-blur-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Section Label */}
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
              Live Demo Preset Switcher
              <span className="text-[10px] lowercase text-slate-500 bg-slate-800 px-1.5 py-0.2 rounded">faculty demo</span>
            </span>
          </div>
        </div>

        {/* Middle: Quick Scenario Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {scenarioKeys.map((key) => {
            const sc = allScenarios[key];
            const isActive = currentScenarioKey === key;

            return (
              <button
                key={key}
                onClick={() => triggerScenario(key, true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 border ${
                  isActive
                    ? `${sc.bgColor} ${sc.borderColor} ${sc.textColor} font-semibold shadow-glow-cyan scale-[1.03]`
                    : 'bg-surface-light/80 text-slate-400 border-surface-border hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <span className="text-sm">{sc.emoji}</span>
                <span>{sc.label}</span>
                <span className="text-[10px] opacity-75 font-mono">({sc.confidence}%)</span>
              </button>
            );
          })}
        </div>

        {/* Right: Cycle Controls & Speed */}
        <div className="flex items-center space-x-2 border-t lg:border-t-0 pt-2 lg:pt-0 border-surface-border">
          <button
            onClick={() => setIsAutoCycle(!isAutoCycle)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center space-x-1.5 border transition-all ${
              isAutoCycle
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-surface-light text-slate-400 border-surface-border hover:text-white'
            }`}
          >
            {isAutoCycle ? <Pause className="w-3 h-3 text-emerald-400 animate-pulse" /> : <Play className="w-3 h-3" />}
            <span>{isAutoCycle ? 'Auto Loop ON' : 'Loop Off'}</span>
          </button>

          <select
            value={cycleSpeed}
            onChange={(e) => setCycleSpeed(Number(e.target.value))}
            className="bg-surface-light text-slate-300 border border-surface-border rounded-md px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value={5000}>5s / cycle</option>
            <option value={8000}>8s / cycle</option>
            <option value={12000}>12s / cycle</option>
          </select>
        </div>
      </div>
    </div>
  );
};
