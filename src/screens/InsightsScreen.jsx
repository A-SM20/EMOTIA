import React from 'react';
import { useEmotion } from '../context/EmotionContext';
import { QuickScenarioBar } from '../components/QuickScenarioBar';
import { TEAM_ARCHITECTURE_MODULES } from '../data/mockScenarios';
import {
  Sparkles,
  BarChart3,
  Eye,
  Mic,
  Compass,
  History,
  Workflow
} from 'lucide-react';

export const InsightsScreen = () => {
  const { scenario } = useEmotion();

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Quick Scenario Preset Toolbar */}
      <QuickScenarioBar />

      {/* Main Explainability Card: "Why did the system predict this?" */}
      <div className="rounded-xl bg-[#121215] border border-white/[0.08] p-5 shadow-card space-y-5">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-medium">
                Transparent Attribution (XAI)
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Why did the system predict this?
              </h1>
            </div>
          </div>

          {/* Target Emotion Badge */}
          <div className="bg-zinc-900 border border-white/[0.08] p-3 rounded-xl flex items-center space-x-3 self-start md:self-auto">
            <span className="text-3xl">{scenario.emoji}</span>
            <div>
              <div className="text-[10px] font-mono text-zinc-500 uppercase">Target Outcome</div>
              <div className="text-sm font-bold text-white">
                {scenario.label} ({scenario.confidence}%)
              </div>
            </div>
          </div>
        </div>

        {/* Contributing Factors Bar Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-3.5 h-3.5 text-zinc-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                Attribution Factor Weighting
              </h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">Sum = 100%</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {scenario.contributingFactors.map((factor, index) => {
              const icons = [Eye, Compass, Mic, History];
              const Icon = icons[index % icons.length];

              return (
                <div
                  key={factor.factor}
                  className="bg-zinc-900/80 p-3.5 rounded-lg border border-white/[0.06] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-xs font-medium text-zinc-200">{factor.factor}</span>
                    </div>
                    <span className="text-xs font-mono font-medium text-white">
                      {factor.percentage}%
                    </span>
                  </div>

                  <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-white/[0.04]">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-500"
                      style={{ width: `${factor.percentage * 2}%` }}
                    ></div>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-snug">{factor.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Natural Language AI Explanation Paragraph */}
        <div className="p-4 rounded-lg bg-zinc-900/90 border border-white/[0.08] space-y-1.5">
          <div className="text-zinc-400 font-medium text-xs font-mono">
            Generated XAI Explanation
          </div>
          <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans">
            "{scenario.detailedExplanation}"
          </p>
          <div className="text-[10px] font-mono text-zinc-500 pt-1 flex items-center justify-between">
            <span>Method: Integrated Gradients & Symbolic AU Mapping</span>
            <span className="text-zinc-300 font-medium">Trust Index: +34%</span>
          </div>
        </div>
      </div>

      {/* System Architecture Pipeline */}
      <div className="bg-[#121215] rounded-xl border border-white/[0.08] p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2">
            <Workflow className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-white">
              End-to-End System Architecture Pipeline
            </h2>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-white/[0.08] px-2 py-0.5 rounded-full">
            Modular Pipeline
          </span>
        </div>

        {/* Horizontal Pipeline Steps */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 pt-1">
          {TEAM_ARCHITECTURE_MODULES.map((mod) => (
            <div
              key={mod.step}
              className="p-3.5 rounded-lg bg-zinc-900/80 border border-white/[0.06] flex flex-col justify-between space-y-2 hover:border-white/20 transition-colors"
            >
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-zinc-500 font-medium">
                  {mod.step}
                </div>
                <div className="text-xs font-semibold text-zinc-200">
                  {mod.owner}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {mod.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
