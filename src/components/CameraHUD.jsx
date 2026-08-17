import React, { useState, useEffect } from 'react';
import { useEmotion } from '../context/EmotionContext';
import { Camera, CameraOff, Eye, EyeOff, Shield, Maximize2, Zap, ScanFace } from 'lucide-react';

export const CameraHUD = () => {
  const { scenario, cameraActive, setCameraActive } = useEmotion();
  const [showMesh, setShowMesh] = useState(true);
  const [recSeconds, setRecSeconds] = useState(1124);

  useEffect(() => {
    const timer = setInterval(() => setRecSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatRecTime = (totalSec) => {
    const hrs = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSec % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <div className="relative rounded-2xl bg-surface border border-surface-border overflow-hidden shadow-2xl flex flex-col">
      {/* Top HUD Status Bar */}
      <div className="bg-surface-light/90 border-b border-surface-border px-4 py-2 flex items-center justify-between z-20">
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5 font-mono text-[11px] font-semibold text-rose-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span>REC {formatRecTime(recSeconds)}</span>
          </div>
          <span className="text-slate-600 text-xs">|</span>
          <div className="text-[11px] font-mono text-cyan-400 flex items-center space-x-1">
            <ScanFace className="w-3.5 h-3.5" />
            <span>FACIAL PERCEPTION</span>
          </div>
        </div>

        {/* HUD Stats */}
        <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-400">
          <span className="hidden sm:inline text-emerald-400">30.0 FPS</span>
          <span className="hidden md:inline">1080p @ 60Hz</span>
          <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            OpenFace 3D
          </span>
        </div>
      </div>

      {/* Main Video Viewport / Canvas Simulation */}
      <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-[#060913] via-[#0b1220] to-[#080d1a] overflow-hidden flex items-center justify-center scanlines">
        {/* Cyber Grid Background */}
        <div className="absolute inset-0 cyber-grid opacity-30"></div>

        {/* Ambient Gradient Glows */}
        <div className="absolute w-72 h-72 rounded-full bg-cyan-500/5 filter blur-3xl pointer-events-none -top-10 -left-10"></div>
        <div className="absolute w-72 h-72 rounded-full bg-blue-500/5 filter blur-3xl pointer-events-none -bottom-10 -right-10"></div>

        {cameraActive ? (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Simulated Researcher Face Silhouette / Avatar Overlay */}
            <div className="relative w-48 h-56 sm:w-56 sm:h-64 flex items-center justify-center">
              {/* Outer Bounding Box with Cyber Reticles */}
              <div className={`absolute inset-0 border-2 rounded-2xl transition-all duration-500 ${scenario.borderColor} bg-slate-900/30 backdrop-blur-[1px]`}>
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-400"></div>
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-400"></div>
                <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-400"></div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-400"></div>

                {/* Top Floating Tag on Face Box */}
                <div className="absolute -top-3 left-3 bg-surface-light px-2 py-0.5 rounded text-[10px] font-mono border border-cyan-500/40 text-cyan-300 shadow-glow-cyan flex items-center space-x-1">
                  <span>TRACKED: ID_01</span>
                  <span className="text-slate-400">•</span>
                  <span className={scenario.textColor}>{scenario.label} ({scenario.confidence}%)</span>
                </div>
              </div>

              {/* Head Silhouette Graphics */}
              <svg
                viewBox="0 0 200 240"
                className="w-full h-full opacity-75 filter drop-shadow-[0_0_12px_rgba(34,211,238,0.2)]"
              >
                {/* Head Contour */}
                <path
                  d="M100,20 C145,20 170,55 170,110 C170,165 140,210 100,220 C60,210 30,165 30,110 C30,55 55,20 100,20 Z"
                  fill="none"
                  stroke="rgba(34, 211, 238, 0.4)"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />

                {/* Facial Features Wireframe Mesh (if showMesh is true) */}
                {showMesh && (
                  <>
                    {/* Eyebrows */}
                    <path
                      d={scenario.id === 'frustrated' ? "M60,82 Q75,90 90,88" : "M60,80 Q75,76 90,80"}
                      fill="none"
                      stroke={scenario.id === 'frustrated' ? "#F59E0B" : "#22D3EE"}
                      strokeWidth="2.5"
                    />
                    <path
                      d={scenario.id === 'frustrated' ? "M110,88 Q125,90 140,82" : "M110,80 Q125,76 140,80"}
                      fill="none"
                      stroke={scenario.id === 'frustrated' ? "#F59E0B" : "#22D3EE"}
                      strokeWidth="2.5"
                    />

                    {/* Eyes */}
                    <circle cx="75" cy="98" r="7" fill="none" stroke="#38BDF8" strokeWidth="1.5" />
                    <circle cx="75" cy="98" r="2.5" fill="#22D3EE" />
                    <circle cx="125" cy="98" r="7" fill="none" stroke="#38BDF8" strokeWidth="1.5" />
                    <circle cx="125" cy="98" r="2.5" fill="#22D3EE" />

                    {/* Nose Bridge & Base */}
                    <path d="M100,90 L100,135 L90,140 L110,140" fill="none" stroke="rgba(34, 211, 238, 0.5)" strokeWidth="1.5" />

                    {/* Mouth */}
                    {scenario.id === 'happy' ? (
                      <path d="M70,165 Q100,190 130,165" fill="none" stroke="#10B981" strokeWidth="2.5" />
                    ) : scenario.id === 'frustrated' || scenario.id === 'stressed' ? (
                      <path d="M72,175 Q100,162 128,175" fill="none" stroke={scenario.color} strokeWidth="2.5" />
                    ) : (
                      <path d="M74,170 Q100,172 126,170" fill="none" stroke="#38BDF8" strokeWidth="2" />
                    )}

                    {/* Facial Landmark Points */}
                    {[
                      [60,80], [75,76], [90,80], [110,80], [125,76], [140,80],
                      [75,98], [125,98], [100,120], [100,135], [92,140], [108,140],
                      [72,170], [86,172], [100,172], [114,172], [128,170], [100,195],
                      [45,110], [155,110], [52,150], [148,150]
                    ].map(([cx, cy], i) => (
                      <circle key={i} cx={cx} cy={cy} r="1.5" fill="#22D3EE" className="animate-pulse" />
                    ))}
                  </>
                )}
              </svg>

              {/* Target Action Units Overlay Chip */}
              <div className="absolute -bottom-3 right-3 bg-surface-light/95 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-700 text-slate-300 shadow-md">
                <span>AU4: {scenario.id === 'frustrated' ? '0.89 ⚠️' : '0.04'}</span>
                <span className="mx-1 text-slate-600">|</span>
                <span>AU12: {scenario.id === 'happy' ? '0.94 ✨' : '0.08'}</span>
              </div>
            </div>

            {/* Crosshair Center Marking */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20">
              <div className="w-8 h-8 border border-cyan-400 rounded-full flex items-center justify-center">
                <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
              </div>
            </div>

            {/* Bottom HUD Left: Modality Metrics */}
            <div className="absolute bottom-3 left-3 bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-surface-border text-[11px] font-mono space-y-0.5">
              <div className="text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span>Gaze: {scenario.modalities.facial.metric}</span>
              </div>
              <div className="text-slate-500 text-[10px]">
                Active App: <span className="text-slate-300 font-semibold">{scenario.activeApp}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-light border border-slate-700 mx-auto flex items-center justify-center text-slate-500">
              <CameraOff className="w-6 h-6" />
            </div>
            <div className="text-sm font-medium text-slate-400">Camera Feed Paused</div>
            <p className="text-xs text-slate-500 max-w-xs">
              Visual perception stream disabled. Emotion inference currently relying on Acoustic Prosody and Contextual Telemetry.
            </p>
          </div>
        )}
      </div>

      {/* Bottom HUD Action Controls */}
      <div className="bg-surface-light/80 border-t border-surface-border px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCameraActive(!cameraActive)}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-medium flex items-center space-x-1.5 border transition-all ${
              cameraActive
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20'
                : 'bg-surface text-slate-400 border-surface-border hover:text-white'
            }`}
          >
            {cameraActive ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
            <span>{cameraActive ? 'Camera ON' : 'Camera OFF'}</span>
          </button>

          <button
            onClick={() => setShowMesh(!showMesh)}
            disabled={!cameraActive}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-medium flex items-center space-x-1.5 border transition-all ${
              !cameraActive ? 'opacity-40 cursor-not-allowed' : ''
            } ${
              showMesh
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                : 'bg-surface text-slate-400 border-surface-border hover:text-white'
            }`}
          >
            {showMesh ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showMesh ? 'Mesh 3D ON' : 'Mesh OFF'}</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Edge Privacy Filter:</span>
          <span className="text-emerald-400 font-semibold">Local Only</span>
        </div>
      </div>
    </div>
  );
};
