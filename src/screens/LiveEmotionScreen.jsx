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
  const context = useEmotion() || {};
  const {
    scenario = {},
    emotionHistory = [],
    liveData = null,
    backendStatus = 'offline',
  } = context;

  const isLive = backendStatus === 'connected' && !!liveData;

  // Active Affect Label
  const activeLabel = isLive && typeof liveData?.emotion === 'string' && liveData.emotion.length > 0
    ? (liveData.emotion.charAt(0).toUpperCase() + liveData.emotion.slice(1))
    : (scenario?.label || 'Neutral');

  // Active Confidence Percentage
  const activeConfidence = isLive && typeof liveData?.confidence === 'number' && !isNaN(liveData.confidence)
    ? Math.round(liveData.confidence * 100)
    : (scenario?.confidence ?? 85);

  // Active Valence & Arousal with strict numeric formatting
  const activeValenceNum = isLive && liveData?.valence != null && !isNaN(Number(liveData.valence))
    ? Number(liveData.valence)
    : (scenario?.valence != null && !isNaN(Number(scenario.valence)) ? Number(scenario.valence) : 0.05);

  const activeArousalNum = isLive && liveData?.arousal != null && !isNaN(Number(liveData.arousal))
    ? Number(liveData.arousal)
    : (scenario?.arousal != null && !isNaN(Number(scenario.arousal)) ? Number(scenario.arousal) : 0.10);

  const activeValence = activeValenceNum.toFixed(2);
  const activeArousal = activeArousalNum.toFixed(2);

  const activeLatency = isLive && liveData?.face?.latency_ms != null
    ? `${Number(liveData.face.latency_ms).toFixed(1)}ms`
    : '11.2ms';
  const activePersonName = liveData?.person?.name || 'User';

  // Modality 1: Facial Vision
  const facialConfidence = isLive && typeof liveData?.face?.confidence === 'number' && !isNaN(liveData.face.confidence)
    ? Math.round(liveData.face.confidence * 100)
    : (scenario?.modalities?.facial?.confidence ?? 85);

  const rawAU = liveData?.face?.action_units;
  const facialUnits = isLive && rawAU && typeof rawAU === 'object'
    ? [
        `AU4 (Brow Lowerer: ${Number(rawAU.AU4 || 0).toFixed(2)})`,
        `AU12 (Lip Corner Puller: ${Number(rawAU.AU12 || 0).toFixed(2)})`,
        `AU15 (Lip Corner Depressor: ${Number(rawAU.AU15 || 0).toFixed(2)})`,
      ]
    : (Array.isArray(scenario?.modalities?.facial?.detectedUnits) && scenario.modalities.facial.detectedUnits.length > 0
        ? scenario.modalities.facial.detectedUnits
        : ['AU4 (Brow Lowerer: 0.12)', 'AU12 (Lip Corner Puller: 0.15)', 'AU15 (Lip Corner Depressor: 0.08)']);

  // Modality 2: Acoustic Speech
  const vocalConfidence = isLive && typeof liveData?.speech?.confidence === 'number' && !isNaN(liveData.speech.confidence)
    ? Math.round(liveData.speech.confidence * 100)
    : (scenario?.modalities?.vocal?.confidence ?? 80);

  const vocalUnits = isLive
    ? (liveData?.speech?.active
        ? [
            'Signal: Voice Activity Detected',
            `Energy: ${Number(liveData?.speech?.energy || 0).toFixed(3)}`,
            `Acoustic Affect: ${liveData?.speech?.emotion || 'neutral'}`
          ]
        : [
            'Signal: Silent / Ambient Desk',
            'Acoustic Front-End: Wav2Vec2.0 Ready',
            'Voice Activity: Listening'
          ])
    : (Array.isArray(scenario?.modalities?.vocal?.detectedUnits) && scenario.modalities.vocal.detectedUnits.length > 0
        ? scenario.modalities.vocal.detectedUnits
        : ['Signal: Silent / Ambient Desk', 'Acoustic Front-End: Wav2Vec2.0 Ready', 'Voice Activity: Listening']);

  // Modality 3: Multimodal Fused
  const fusedConfidence = activeConfidence;
  const xaiWeights = liveData?.xai?.featureAttributionWeights;
  const fusedUnits = isLive && liveData?.xai
    ? [
        `Attention Weight Vision: ${xaiWeights?.vision ?? Math.round((liveData.xai.vision_weight || 0.48) * 100)}%`,
        `Attention Weight Audio: ${xaiWeights?.audio ?? Math.round((liveData.xai.speech_weight || 0.32) * 100)}%`,
        `Attention Weight Context: ${xaiWeights?.context ?? Math.round((liveData.xai.context_weight || 0.20) * 100)}%`,
      ]
    : (Array.isArray(scenario?.modalities?.fused?.detectedUnits) && scenario.modalities.fused.detectedUnits.length > 0
        ? scenario.modalities.fused.detectedUnits
        : ['Attention Weight Vision: 48%', 'Attention Weight Audio: 32%', 'Attention Weight Context: 20%']);

  // Softmax Emotion Distribution
  const rawProbs = liveData?.face?.probabilities;
  const emotionDist = isLive && rawProbs && typeof rawProbs === 'object' && Object.keys(rawProbs).length > 0
    ? Object.entries(rawProbs).map(([name, prob]) => ({
        name: typeof name === 'string' ? (name.charAt(0).toUpperCase() + name.slice(1)) : String(name),
        percentage: typeof prob === 'number' && !isNaN(prob) ? Math.round(prob * 100) : 0
      })).sort((a, b) => b.percentage - a.percentage)
    : (Array.isArray(scenario?.emotionDistribution) && scenario.emotionDistribution.length > 0
        ? scenario.emotionDistribution
        : [
            { name: 'Neutral', percentage: 70 },
            { name: 'Calm', percentage: 15 },
            { name: 'Frustrated', percentage: 5 },
            { name: 'Stressed', percentage: 5 },
            { name: 'Happy', percentage: 5 }
          ]);

  const safeEmotionDist = Array.isArray(emotionDist) ? emotionDist : [];

  // Sanitized History Data for Recharts AreaChart
  const safeEmotionHistory = Array.isArray(emotionHistory) && emotionHistory.length > 0
    ? emotionHistory.map((item, idx) => ({
        time: item?.time || `T-${idx}`,
        intensity: typeof item?.intensity === 'number' && !isNaN(item.intensity)
          ? Math.max(0, Math.min(100, item.intensity))
          : (typeof item?.confidence === 'number' && !isNaN(item.confidence) ? item.confidence : 50),
        confidence: typeof item?.confidence === 'number' && !isNaN(item.confidence) ? item.confidence : 50,
        emotion: item?.emotion || 'Neutral',
      }))
    : [
        { time: '12:00:00', intensity: 50, confidence: 50, emotion: 'Neutral' },
        { time: '12:01:00', intensity: 65, confidence: 65, emotion: 'Calm' }
      ];

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
              {scenario?.emoji || '😐'}
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-medium flex items-center space-x-2">
                <span>Fused Affect Prediction {isLive && '• LIVE TELEMETRY'}</span>
                {isLive && (
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-emerald-500/30 text-[9px]">
                    👤 {activePersonName}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                {activeLabel}
              </h1>
              <div className="flex items-center space-x-2 pt-0.5">
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-800 border border-white/[0.08] text-zinc-200">
                  {activeConfidence}% Confidence
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  Latency: {activeLatency}
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
              <div className="text-xs font-medium text-white truncate">{scenario?.taskContext || 'General Task'}</div>
              <div className="text-[10px] text-zinc-500 truncate">{scenario?.activeApp || 'System'}</div>
            </div>

            <div className="bg-zinc-900/80 p-3 rounded-lg border border-white/[0.06]">
              <div className="text-[10px] font-mono uppercase text-zinc-500 mb-1 flex items-center gap-1">
                <Zap className="w-3 h-3 text-zinc-400" />
                <span>Affect Valence</span>
              </div>
              <div className="text-base font-semibold font-mono text-zinc-100">
                {activeValenceNum > 0 ? `+${activeValence}` : activeValence}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">
                {activeValenceNum >= 0.3 ? 'Positive' : activeValenceNum <= -0.3 ? 'Negative' : 'Equilibrium'}
              </div>
            </div>

            <div className="bg-zinc-900/80 p-3 rounded-lg border border-white/[0.06]">
              <div className="text-[10px] font-mono uppercase text-zinc-500 mb-1 flex items-center gap-1">
                <Activity className="w-3 h-3 text-zinc-400" />
                <span>Arousal Level</span>
              </div>
              <div className="text-base font-semibold font-mono text-zinc-100">
                {activeArousalNum > 0 ? `+${activeArousal}` : activeArousal}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">
                {activeArousalNum >= 0.4 ? 'High Activation' : activeArousalNum <= -0.2 ? 'Relaxed' : 'Moderate'}
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
                {facialConfidence}%
              </span>
            </div>

            <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, facialConfidence))}%` }}
              ></div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Action Units (AU):</div>
              <div className="space-y-1">
                {(Array.isArray(facialUnits) ? facialUnits : []).map((au, i) => (
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
                {vocalConfidence}%
              </span>
            </div>

            <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, vocalConfidence))}%` }}
              ></div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Prosody Vectors:</div>
              <div className="space-y-1">
                {(Array.isArray(vocalUnits) ? vocalUnits : []).map((feat, i) => (
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
                {fusedConfidence}%
              </span>
            </div>

            <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, fusedConfidence))}%` }}
              ></div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Attention Layer:</div>
              <div className="space-y-1">
                {(Array.isArray(fusedUnits) ? fusedUnits : []).map((weight, i) => (
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
            {safeEmotionDist.map((item, idx) => (
              <div key={item?.name || idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300">{item?.name || 'Unknown'}</span>
                  <span className="text-zinc-400 font-medium">{item?.percentage ?? 0}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/[0.06]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, item?.percentage ?? 0))}%`,
                      backgroundColor: (item?.percentage ?? 0) > 50 ? '#ffffff' : '#71717a',
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
          <div className="h-52 w-full pt-2 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={180}>
              <AreaChart data={safeEmotionHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
