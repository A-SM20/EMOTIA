import React, { useState, useEffect } from 'react';
import { useEmotion } from '../context/EmotionContext';
import { Camera, CameraOff, Eye, EyeOff, Shield } from 'lucide-react';

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
    <div className="relative rounded-xl bg-[#121215] border border-white/[0.08] overflow-hidden shadow-card flex flex-col">
      {/* Top Bar */}
      <div className="bg-[#151518] border-b border-white/[0.08] px-4 py-2 flex items-center justify-between z-20">
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5 font-mono text-[11px] font-medium text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span>REC {formatRecTime(recSeconds)}</span>
          </div>
          <span className="text-zinc-600 text-xs">|</span>
          <span className="text-[11px] font-mono text-zinc-400">
            Vision Perception
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-3 text-[10px] font-mono text-zinc-400">
          <span className="text-zinc-300">30.0 FPS</span>
          <span className="hidden sm:inline">1080p</span>
          <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-white/[0.08]">
            Swin-FER
          </span>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="relative aspect-[16/10] w-full bg-[#0c0c0e] overflow-hidden flex items-center justify-center">
        {cameraActive ? (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Minimalist Focal Frame */}
            <div className="relative w-44 h-52 sm:w-52 sm:h-60 flex items-center justify-center">
              <div className="absolute inset-0 border border-white/20 rounded-xl bg-zinc-900/20 backdrop-blur-[1px]">
                {/* Minimalist Corner Markers */}
                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t border-l border-white"></div>
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t border-r border-white"></div>
                <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b border-l border-white"></div>
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b border-r border-white"></div>

                {/* Top Label Tag */}
                <div className="absolute -top-2.5 left-2.5 bg-zinc-900 px-2 py-0.2 rounded text-[10px] font-mono border border-white/[0.08] text-zinc-200 flex items-center space-x-1">
                  <span>Tracked:</span>
                  <span className="text-white font-medium">{scenario.label} ({scenario.confidence}%)</span>
                </div>
              </div>

              {/* Minimal SVG Face Contour */}
              <svg
                viewBox="0 0 200 240"
                className="w-full h-full opacity-60"
              >
                <path
                  d="M100,25 C140,25 165,55 165,110 C165,165 135,205 100,215 C65,205 35,165 35,110 C35,55 60,25 100,25 Z"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.25)"
                  strokeWidth="1.2"
                />

                {showMesh && (
                  <>
                    {/* Eyebrows */}
                    <path d="M60,82 Q75,78 90,82" fill="none" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.5" />
                    <path d="M110,82 Q125,78 140,82" fill="none" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.5" />

                    {/* Eyes */}
                    <circle cx="75" cy="98" r="5" fill="none" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.2" />
                    <circle cx="75" cy="98" r="2" fill="#ffffff" />
                    <circle cx="125" cy="98" r="5" fill="none" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.2" />
                    <circle cx="125" cy="98" r="2" fill="#ffffff" />

                    {/* Nose */}
                    <path d="M100,92 L100,135 L93,140 L107,140" fill="none" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.2" />

                    {/* Mouth */}
                    <path d="M74,170 Q100,172 126,170" fill="none" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1.5" />

                    {/* Minimal Landmark Points */}
                    {[
                      [60,82], [90,82], [110,82], [140,82],
                      [75,98], [125,98], [100,120], [100,140],
                      [74,170], [100,172], [126,170]
                    ].map(([cx, cy], i) => (
                      <circle key={i} cx={cx} cy={cy} r="1.2" fill="#ffffff" opacity="0.7" />
                    ))}
                  </>
                )}
              </svg>
            </div>

            {/* Bottom HUD info overlay */}
            <div className="absolute bottom-3 left-3 bg-zinc-900/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/[0.08] text-[10px] font-mono text-zinc-400">
              <span>Gaze: {scenario.modalities.facial.metric}</span>
            </div>
          </div>
        ) : (
          <div className="text-center p-6 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/[0.08] mx-auto flex items-center justify-center text-zinc-500">
              <CameraOff className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-zinc-400">Camera Feed Inactive</div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-[#151518] border-t border-white/[0.08] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCameraActive(!cameraActive)}
            className={`px-2.5 py-1 rounded-md text-xs font-mono flex items-center space-x-1.5 border transition-all ${
              cameraActive
                ? 'bg-zinc-800 text-white border-white/20'
                : 'bg-zinc-900 text-zinc-400 border-white/[0.08] hover:text-white'
            }`}
          >
            {cameraActive ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
            <span>{cameraActive ? 'Camera ON' : 'Camera OFF'}</span>
          </button>

          <button
            onClick={() => setShowMesh(!showMesh)}
            disabled={!cameraActive}
            className={`px-2.5 py-1 rounded-md text-xs font-mono flex items-center space-x-1.5 border transition-all ${
              !cameraActive ? 'opacity-40 cursor-not-allowed' : ''
            } ${
              showMesh
                ? 'bg-zinc-800 text-white border-white/20'
                : 'bg-zinc-900 text-zinc-400 border-white/[0.08] hover:text-white'
            }`}
          >
            {showMesh ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showMesh ? 'Mesh ON' : 'Mesh OFF'}</span>
          </button>
        </div>

        <div className="text-[10px] font-mono text-zinc-400 flex items-center space-x-1.5">
          <Shield className="w-3.5 h-3.5 text-zinc-300" />
          <span className="hidden sm:inline">Edge Privacy:</span>
          <span className="text-zinc-200 font-medium">Local</span>
        </div>
      </div>
    </div>
  );
};
