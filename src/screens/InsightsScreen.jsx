import React from 'react';
import { useEmotion } from '../context/EmotionContext';
import { QuickScenarioBar } from '../components/QuickScenarioBar';
import { TEAM_ARCHITECTURE_MODULES } from '../data/mockScenarios';
import {
  Sparkles,
  HelpCircle,
  BarChart3,
  Layers,
  ArrowRight,
  ShieldCheck,
  Eye,
  Mic,
  Brain,
  History,
  Compass,
  Cpu,
  Workflow
} from 'lucide-react';

export const InsightsScreen = () => {
  const { scenario } = useEmotion();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Quick Scenario Preset Toolbar */}
      <QuickScenarioBar />

      {/* Main Explainability Card: "Why did the system predict this?" */}
      <div className={`rounded-2xl bg-surface border p-6 shadow-subtle-card space-y-6 relative overflow-hidden transition-all duration-500 ${scenario.glowClass} ${scenario.borderColor}`}>
        {/* Background glow */}
        <div
          className="absolute -right-20 -top-20 w-72 h-72 rounded-full opacity-15 filter blur-3xl pointer-events-none"
          style={{ backgroundColor: scenario.color }}
        ></div>

        {/* Top Header & Target Prediction Score */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-surface-border">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-glow-blue">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-semibold">
                Transparent Affect Attribution (XAI)
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Why did the system predict this?
              </h1>
              <p className="text-xs text-slate-400">
                Interpretable feature attribution and multimodal Shapley weight decompositions
              </p>
            </div>
          </div>

          {/* Target Emotion Badge */}
          <div className="bg-surface-light border border-surface-border p-3.5 rounded-2xl flex items-center space-x-3 self-start md:self-auto shadow-md">
            <span className="text-4xl">{scenario.emoji}</span>
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Target Emotion Outcome</div>
              <div className={`text-lg font-bold ${scenario.textColor}`}>
                {scenario.label} ({scenario.confidence}%)
              </div>
            </div>
          </div>
        </div>

        {/* Contributing Factors Bar Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                Multimodal Contributing Factors Attribution
              </h2>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">Sum = 100% Attribution Weight</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenario.contributingFactors.map((factor, index) => {
              const icons = [Eye, Compass, Mic, History];
              const Icon = icons[index % icons.length];

              return (
                <div
                  key={factor.factor}
                  className="bg-surface-light/80 p-4 rounded-xl border border-surface-border space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-surface text-cyan-400 border border-slate-700">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-100">{factor.factor}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      {factor.percentage}%
                    </span>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="h-2 w-full bg-surface rounded-full overflow-hidden border border-surface-border p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-700"
                      style={{ width: `${factor.percentage * 2}%` }}
                    ></div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-snug">{factor.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Natural Language AI Explanation Paragraph */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-surface-light to-blue-950/30 border border-cyan-500/30 space-y-2">
          <div className="flex items-center space-x-2 text-cyan-300 font-bold text-xs font-mono">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Generated Natural-Language XAI Narrative</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-sans">
            "{scenario.detailedExplanation}"
          </p>
          <div className="text-[10px] font-mono text-slate-500 pt-1 flex items-center justify-between">
            <span>XAI Method: Cross-Modal Integrated Gradients + Symbolic AU Mapping</span>
            <span className="text-emerald-400 font-semibold">User Trust Index: +34%</span>
          </div>
        </div>
      </div>

      {/* Research Paper Architecture Pipeline Strip */}
      <div className="bg-surface rounded-2xl border border-surface-border p-6 shadow-subtle-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Workflow className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                End-to-End System Architecture & Research Pipeline
              </h2>
              <p className="text-xs text-slate-400">
                Data flow from hardware perception to explainable proactive desk assistant frontend
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full">
            Modular HRI Pipeline
          </span>
        </div>

        {/* Horizontal Pipeline Steps */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {TEAM_ARCHITECTURE_MODULES.map((mod, idx) => (
            <div
              key={mod.step}
              className={`p-4 rounded-xl bg-gradient-to-b ${mod.color} border ${mod.border} flex flex-col justify-between space-y-3 relative group hover:scale-[1.02] transition-transform`}
            >
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
                  {mod.step}
                </div>
                <div className="text-xs font-bold text-white leading-tight">
                  {mod.owner}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {mod.description}
                </p>
              </div>

              {idx < TEAM_ARCHITECTURE_MODULES.length - 1 && (
                <div className="hidden md:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10">
                  <div className="w-5 h-5 rounded-full bg-slate-900 border border-cyan-400 flex items-center justify-center text-[10px] text-cyan-400 shadow-glow-cyan">
                    →
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
