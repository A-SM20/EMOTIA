import React from 'react';
import { useEmotion } from '../context/EmotionContext';
import { QuickScenarioBar } from '../components/QuickScenarioBar';
import {
  Activity,
  Zap,
  Layers,
  Eye,
  Mic,
  Cpu,
  TrendingUp,
  BarChart3,
  Compass
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export const LiveEmotionScreen = () => {
  const { scenario, emotionHistory } = useEmotion();

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Quick Scenario Preset Toolbar */}
      <QuickScenarioBar />

      {/* Hero Emotion Telemetry Banner */}
      <div className="rounded-xl bg-[#121215] border border-white/[0.08] p-5 shadow-card">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Main Emotion Display (5 Cols) */}
          <div className="lg:col-span-5 flex items-center space-x-4">
            <div className="text-6xl">
              {scenario.emoji}
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-medium">
                Fused Affect Prediction
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                {scenario.label}
              </h1>
              <div className="flex items-center space-x-2 pt-0.5">
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-800 border border-white/[0.08] text-zinc-200">
                  {scenario.confidence}% Confidence
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  Latency: 11.2ms
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid (7 Cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="bg-zinc-900/80 p-3 rounded-lg border border-white/[0.06]">
              <div className="text-[10px] font-mono uppercase text-zinc-500 mb-1 flex items-center gap-1">
                <Compass className="w-3 h-3 text-zinc-400" />
                <span>Task Context</span>
              </div>
              <div className="text-xs font-medium text-white truncate">{scenario.taskContext}</div>
              <div className="text-[10px] text-zinc-500 truncate">{scenario.activeApp}</div>
            </div>

            <div className="bg-zinc-900/80 p-3 rounded-lg border border-white/[0.06]">
              <div className="text-[10px] font-mono uppercase text-zinc-500 mb-1 flex items-center gap-1">
                <Zap className="w-3 h-3 text-zinc-400" />
                <span>Affect Valence</span>
              </div>
              <div className="text-base font-semibold font-mono text-zinc-100">
                {scenario.valence > 0 ? `+${scenario.valence}` : scenario.valence}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">
                {scenario.valence >= 0.3 ? 'Positive' : scenario.valence <= -0.3 ? 'Negative' : 'Equilibrium'}
              </div>
            </div>

            <div className="bg-zinc-900/80 p-3 rounded-lg border border-white/[0.06]">
              <div className="text-[10px] font-mono uppercase text-zinc-500 mb-1 flex items-center gap-1">
                <Activity className="w-3 h-3 text-zinc-400" />
                <span>Arousal Level</span>
              </div>
              <div className="text-base font-semibold font-mono text-zinc-100">
                {scenario.arousal > 0 ? `+${scenario.arousal}` : scenario.arousal}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">
                {scenario.arousal >= 0.4 ? 'High Activation' : scenario.arousal <= -0.2 ? 'Relaxed' : 'Moderate'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Multimodal Signal Streams: 3 Parallel Modality Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
              Multimodal Fusion Streams
            </h2>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-white/[0.08] px-2 py-0.5 rounded-full">
            Cross-Attention Architecture
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Signal 1: Facial Vision Signal */}
          <div className="bg-[#121215] rounded-xl border border-white/[0.08] p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-md bg-zinc-900 text-zinc-300 border border-white/[0.08]">
                  <Eye className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-zinc-200">1. Facial Vision</h3>
                  <div className="text-[10px] text-zinc-500 font-mono">Swin-FER</div>
                </div>
              </div>
              <span className="text-xs font-mono font-medium text-white">
                {scenario.modalities.facial.confidence}%
              </span>
            </div>

            <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${scenario.modalities.facial.confidence}%` }}
              ></div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Action Units (AU):</div>
              <div className="space-y-1">
                {scenario.modalities.facial.detectedUnits.map((au, i) => (
                  <div key={i} className="text-xs font-mono bg-zinc-900 px-2 py-1 rounded text-zinc-300 border border-white/[0.06]">
                    {au}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Signal 2: Acoustic Speech Signal */}
          <div className="bg-[#121215] rounded-xl border border-white/[0.08] p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-md bg-zinc-900 text-zinc-300 border border-white/[0.08]">
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-zinc-200">2. Acoustic Speech</h3>
                  <div className="text-[10px] text-zinc-500 font-mono">Wav2Vec2 Prosody</div>
                </div>
              </div>
              <span className="text-xs font-mono font-medium text-white">
                {scenario.modalities.vocal.confidence}%
              </span>
            </div>

            <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${scenario.modalities.vocal.confidence}%` }}
              ></div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Prosody Vectors:</div>
              <div className="space-y-1">
                {scenario.modalities.vocal.detectedUnits.map((feat, i) => (
                  <div key={i} className="text-xs font-mono bg-zinc-900 px-2 py-1 rounded text-zinc-300 border border-white/[0.06]">
                    {feat}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Signal 3: Cross-Attention Fused State */}
          <div className="bg-[#121215] rounded-xl border border-white/[0.12] p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-md bg-white text-black font-semibold">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white">3. Fused Prediction</h3>
                  <div className="text-[10px] text-zinc-500 font-mono">Cross-Modal Attention</div>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold text-white bg-zinc-800 px-2 py-0.5 rounded border border-white/[0.08]">
                {scenario.modalities.fused.confidence}%
              </span>
            </div>

            <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${scenario.modalities.fused.confidence}%` }}
              ></div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Attention Layer:</div>
              <div className="space-y-1">
                {scenario.modalities.fused.detectedUnits.map((weight, i) => (
                  <div key={i} className="text-xs font-mono bg-zinc-900 px-2 py-1 rounded text-zinc-200 border border-white/[0.06]">
                    {weight}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Distribution & History Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Emotion Distribution (5 Cols) */}
        <div className="lg:col-span-5 bg-[#121215] rounded-xl border border-white/[0.08] p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-3.5 h-3.5 text-zinc-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                Emotion Distribution
              </h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">Softmax Output</span>
          </div>

          <div className="space-y-2.5">
            {scenario.emotionDistribution.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300">{item.name}</span>
                  <span className="text-zinc-400 font-medium">{item.percentage}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/[0.06]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.percentage > 50 ? '#ffffff' : '#71717a',
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live Rolling Intensity Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-[#121215] rounded-xl border border-white/[0.08] p-4 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                Intensity Trajectory
              </h3>
            </div>

            <div className="flex items-center space-x-2 text-[10px] font-mono text-zinc-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                <span>Intensity %</span>
              </span>
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={emotionHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="intensityMonochrome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="time" stroke="#52525b" fontSize={10} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={10} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="intensity"
                  stroke="#ffffff"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#intensityMonochrome)"
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] font-mono text-zinc-500 flex items-center justify-between border-t border-white/[0.08] pt-2">
            <span>Sample Rate: 10Hz</span>
            <span className="text-zinc-400">Last 15 Window Samples</span>
          </div>
        </div>
      </div>
    </div>
  );
};
