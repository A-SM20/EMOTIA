import React from 'react';
import { useEmotion } from '../context/EmotionContext';
import { QuickScenarioBar } from '../components/QuickScenarioBar';
import {
  Activity,
  Zap,
  Layers,
  Sparkles,
  Eye,
  Mic,
  Cpu,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Compass,
  ArrowRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

export const LiveEmotionScreen = () => {
  const { scenario, emotionHistory } = useEmotion();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Quick Scenario Preset Toolbar */}
      <QuickScenarioBar />

      {/* Top Section: Hero Emotion Telemetry Banner */}
      <div className={`rounded-2xl bg-surface border p-6 shadow-subtle-card relative overflow-hidden transition-all duration-500 ${scenario.glowClass} ${scenario.borderColor}`}>
        {/* Glowing Background Radial */}
        <div
          className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-20 filter blur-3xl pointer-events-none"
          style={{ backgroundColor: scenario.color }}
        ></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Main Emotion Label & Big Gauge (5 Cols) */}
          <div className="lg:col-span-5 flex items-center space-x-5">
            <div className="text-6xl sm:text-7xl filter drop-shadow-lg animate-pulse-slow">
              {scenario.emoji}
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-semibold">
                Multimodal Fused State
              </div>
              <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight ${scenario.textColor}`}>
                {scenario.label}
              </h1>
              <div className="flex items-center space-x-2 pt-1">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-white shadow">
                  {scenario.confidence}% Confidence
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Latency: 11.2ms
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats: Task context, Valence, Arousal (7 Cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-surface-light/80 p-3.5 rounded-xl border border-surface-border">
              <div className="text-[10px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1">
                <Compass className="w-3 h-3 text-cyan-400" />
                <span>Task Context</span>
              </div>
              <div className="text-xs font-semibold text-white truncate">{scenario.taskContext}</div>
              <div className="text-[10px] text-slate-400 truncate">{scenario.activeApp}</div>
            </div>

            <div className="bg-surface-light/80 p-3.5 rounded-xl border border-surface-border">
              <div className="text-[10px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>Affective Valence</span>
              </div>
              <div className={`text-lg font-bold font-mono ${scenario.valence >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {scenario.valence > 0 ? `+${scenario.valence}` : scenario.valence}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {scenario.valence >= 0.3 ? 'Pleasant / Positive' : scenario.valence <= -0.3 ? 'Unpleasant / Negative' : 'Neutral Equilibrium'}
              </div>
            </div>

            <div className="bg-surface-light/80 p-3.5 rounded-xl border border-surface-border">
              <div className="text-[10px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1">
                <Activity className="w-3 h-3 text-amber-400" />
                <span>Arousal Intensity</span>
              </div>
              <div className={`text-lg font-bold font-mono ${scenario.arousal >= 0 ? 'text-amber-400' : 'text-sky-400'}`}>
                {scenario.arousal > 0 ? `+${scenario.arousal}` : scenario.arousal}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {scenario.arousal >= 0.4 ? 'High Activation' : scenario.arousal <= -0.2 ? 'Relaxed / Low Arousal' : 'Moderate Activation'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Multimodal Fusion Readouts: 3 Parallel Modality Stream Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Multimodal Signal Streams (Fusion Pipeline)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
            Cross-Attention Fusion Architecture
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Signal 1: Facial Vision Signal */}
          <div className="bg-surface rounded-2xl border border-surface-border p-4 shadow-subtle-card space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-100">1. Facial Vision Signal</h3>
                  <div className="text-[10px] text-slate-400 font-mono">OpenFace 3D + Swin-FER</div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {scenario.modalities.facial.confidence}%
              </span>
            </div>

            {/* Confidence Bar */}
            <div className="h-1.5 w-full bg-surface-light rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${scenario.modalities.facial.confidence}%` }}
              ></div>
            </div>

            {/* Extracted Action Units */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-mono uppercase text-slate-400">Detected Action Units (AU):</div>
              <div className="space-y-1">
                {scenario.modalities.facial.detectedUnits.map((au, i) => (
                  <div key={i} className="text-xs font-mono bg-surface-light px-2.5 py-1 rounded-md text-slate-300 border border-surface-border">
                    {au}
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-cyan-400 font-mono pt-1">
                {scenario.modalities.facial.metric}
              </div>
            </div>
          </div>

          {/* Signal 2: Acoustic Speech Signal */}
          <div className="bg-surface rounded-2xl border border-surface-border p-4 shadow-subtle-card space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-100">2. Acoustic Speech Signal</h3>
                  <div className="text-[10px] text-slate-400 font-mono">Wav2Vec2 + Prosody Extractor</div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-purple-400">
                {scenario.modalities.vocal.confidence}%
              </span>
            </div>

            {/* Confidence Bar */}
            <div className="h-1.5 w-full bg-surface-light rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-400 rounded-full transition-all duration-500"
                style={{ width: `${scenario.modalities.vocal.confidence}%` }}
              ></div>
            </div>

            {/* Acoustic Features */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-mono uppercase text-slate-400">Prosodic Feature Vectors:</div>
              <div className="space-y-1">
                {scenario.modalities.vocal.detectedUnits.map((feat, i) => (
                  <div key={i} className="text-xs font-mono bg-surface-light px-2.5 py-1 rounded-md text-slate-300 border border-surface-border">
                    {feat}
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-purple-400 font-mono pt-1">
                {scenario.modalities.vocal.metric}
              </div>
            </div>
          </div>

          {/* Signal 3: Cross-Attention Fused State */}
          <div className="bg-surface rounded-2xl border border-cyan-500/30 p-4 shadow-subtle-card space-y-3 relative overflow-hidden bg-gradient-to-b from-cyan-950/20 to-surface">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-black shadow-glow-cyan">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-cyan-300">3. Fused Prediction</h3>
                  <div className="text-[10px] text-cyan-400 font-mono">Cross-Modal Attention Matrix</div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-white bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/40">
                {scenario.modalities.fused.confidence}%
              </span>
            </div>

            {/* Confidence Bar */}
            <div className="h-1.5 w-full bg-surface-light rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${scenario.modalities.fused.confidence}%` }}
              ></div>
            </div>

            {/* Cross-Attention Weights */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-mono uppercase text-slate-400">Attention Layer Weighting:</div>
              <div className="space-y-1">
                {scenario.modalities.fused.detectedUnits.map((weight, i) => (
                  <div key={i} className="text-xs font-mono bg-surface-light/90 px-2.5 py-1 rounded-md text-cyan-200 border border-cyan-500/20">
                    {weight}
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono pt-1 flex items-center justify-between">
                <span>{scenario.modalities.fused.metric}</span>
                <span className="font-semibold">Synchronized</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emotion Distribution Spectrum & Live Intensity Timeline (2 Cols on LG) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Emotion Distribution Horizontal Bars (5 Cols) */}
        <div className="lg:col-span-5 bg-surface rounded-2xl border border-surface-border p-5 shadow-subtle-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                Emotion Probability Distribution
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Softmax Output</span>
          </div>

          <div className="space-y-3">
            {scenario.emotionDistribution.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-medium">{item.name}</span>
                  <span className="text-slate-400 font-semibold">{item.percentage}%</span>
                </div>
                <div className="h-2 w-full bg-surface-light rounded-full overflow-hidden border border-surface-border p-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                      boxShadow: item.percentage > 50 ? `0 0 8px ${item.color}` : 'none',
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live Rolling Intensity & Confidence Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-surface rounded-2xl border border-surface-border p-5 shadow-subtle-card flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  Real-Time Emotion Intensity Trajectory
                </h3>
                <p className="text-[11px] text-slate-400">Live sliding window tracking affective changes</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span>Intensity %</span>
              </span>
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={emotionHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="intensityGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111722',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="intensity"
                  stroke="#22D3EE"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#intensityGlow)"
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between border-t border-surface-border pt-2">
            <span>Sample Rate: 10Hz</span>
            <span className="text-cyan-400">Sliding Window: Last 15 Telemetry Samples</span>
          </div>
        </div>
      </div>
    </div>
  );
};
