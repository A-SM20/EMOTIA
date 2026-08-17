import React from 'react';
import { useEmotion } from '../context/EmotionContext';
import { Play, Pause } from 'lucide-react';

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
    <div className="bg-[#121215] border border-white/[0.08] rounded-xl p-2.5 mb-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Left: Segmented Scenario Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {scenarioKeys.map((key) => {
            const sc = allScenarios[key];
            const isActive = currentScenarioKey === key;

            return (
              <button
                key={key}
                onClick={() => triggerScenario(key, true)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-zinc-800 text-white border border-white/20 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                }`}
              >
                <span>{sc.emoji}</span>
                <span>{sc.label}</span>
                <span className="text-[10px] text-zinc-500 font-mono">({sc.confidence}%)</span>
              </button>
            );
          })}
        </div>

        {/* Right: Cycle Controls */}
        <div className="flex items-center space-x-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/[0.08]">
          <button
            onClick={() => setIsAutoCycle(!isAutoCycle)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center space-x-1.5 border transition-all ${
              isAutoCycle
                ? 'bg-zinc-800 text-zinc-200 border-white/20'
                : 'bg-zinc-900 text-zinc-500 border-white/[0.08] hover:text-zinc-300'
            }`}
          >
            {isAutoCycle ? <Pause className="w-3 h-3 text-zinc-300" /> : <Play className="w-3 h-3" />}
            <span>{isAutoCycle ? 'Auto' : 'Manual'}</span>
          </button>

          <select
            value={cycleSpeed}
            onChange={(e) => setCycleSpeed(Number(e.target.value))}
            className="bg-zinc-900 text-zinc-300 border border-white/[0.08] rounded-md px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-white/20"
          >
            <option value={5000}>5s</option>
            <option value={8000}>8s</option>
            <option value={12000}>12s</option>
          </select>
        </div>
      </div>
    </div>
  );
};
