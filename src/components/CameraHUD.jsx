import React, { useState, useEffect, useRef } from 'react';
import { useEmotion } from '../context/EmotionContext';
import { Camera, CameraOff, Eye, EyeOff, ScanFace } from 'lucide-react';

export const CameraHUD = () => {
  const { scenario, cameraActive, setCameraActive } = useEmotion();
  const [showMesh, setShowMesh] = useState(true);
  const [recSeconds, setRecSeconds] = useState(1124);

  // Dynamic animation frame state
  const [frameTime, setFrameTime] = useState(0);
  const animRef = useRef(null);

  // Real-time micro-animation loop
  useEffect(() => {
    let start = performance.now();
    const updateLoop = (now) => {
      const elapsed = (now - start) / 1000;
      setFrameTime(elapsed);
      animRef.current = requestAnimationFrame(updateLoop);
    };

    animRef.current = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Timer increment
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

  const t = frameTime;
  const mood = scenario.id;

  // -------------------------------------------------------------
  // Mood-Driven Dynamic Physics & Landmark Calculations
  // -------------------------------------------------------------

  // 1. Head Pose Micro-Movements (Translations & Rotations)
  let headOffsetX = 0;
  let headOffsetY = 0;
  let pitchDeg = 0;
  let yawDeg = 0;
  let rollDeg = 0;

  if (mood === 'frustrated') {
    // Frustrated: subtle rapid tension tremor + slight forward/downward posture
    headOffsetX = Math.sin(t * 1.8) * 1.5 + (Math.sin(t * 16) * 0.4);
    headOffsetY = 3.5 + Math.sin(t * 2.2) * 1.0;
    pitchDeg = 2.4 + Math.sin(t * 2.0) * 0.8;
    yawDeg = Math.sin(t * 1.4) * 1.6;
    rollDeg = Math.sin(t * 1.8) * 0.9;
  } else if (mood === 'happy') {
    // Happy: lively upward bounce & slight rhythmic nod
    headOffsetX = Math.sin(t * 2.0) * 1.8;
    headOffsetY = -2.0 + Math.sin(t * 3.5) * 1.8;
    pitchDeg = -1.6 + Math.sin(t * 3.5) * 1.2;
    yawDeg = Math.sin(t * 1.8) * 1.4;
    rollDeg = Math.sin(t * 2.2) * 0.6;
  } else if (mood === 'stressed') {
    // Stressed: high-frequency nervous micro-jitter and rapid posture adjustments
    headOffsetX = (Math.sin(t * 9.0) * 0.8) + (Math.sin(t * 2.5) * 1.2);
    headOffsetY = 1.0 + (Math.cos(t * 8.0) * 0.7);
    pitchDeg = 1.8 + Math.sin(t * 7.0) * 1.4;
    yawDeg = Math.sin(t * 6.5) * 2.0;
    rollDeg = Math.cos(t * 8.0) * 1.1;
  } else if (mood === 'calm') {
    // Calm: smooth, slow, gentle sinusoidal breathing rhythm
    headOffsetX = Math.sin(t * 0.8) * 1.0;
    headOffsetY = Math.sin(t * 1.2) * 1.5;
    pitchDeg = Math.sin(t * 1.0) * 0.5;
    yawDeg = Math.cos(t * 0.7) * 0.6;
    rollDeg = Math.sin(t * 0.9) * 0.3;
  } else {
    // Neutral / Reading: subtle downward gaze & slow reading scan drift
    headOffsetX = Math.sin(t * 0.9) * 1.2;
    headOffsetY = Math.sin(t * 1.1) * 0.8;
    pitchDeg = 1.0 + Math.sin(t * 0.8) * 0.4;
    yawDeg = Math.sin(t * 0.6) * 0.8;
    rollDeg = 0.2;
  }

  // 2. Dynamic Eye Blinking
  // Blinks occur cyclically; eye height drops to 0.5
  let blinkPeriod = 4.0;
  let isBlinking = false;
  if (mood === 'stressed') {
    // Rapid double-blinking every 1.8s
    const cycle = t % 1.8;
    isBlinking = cycle < 0.12 || (cycle > 0.22 && cycle < 0.34);
  } else if (mood === 'frustrated') {
    // Staring with occasional hard blink
    const cycle = t % 5.0;
    isBlinking = cycle < 0.18;
  } else if (mood === 'happy') {
    const cycle = t % 3.2;
    isBlinking = cycle < 0.14;
  } else {
    // Calm/Neutral: regular relaxed blink every 3.8s
    const cycle = t % 3.8;
    isBlinking = cycle < 0.14;
  }

  const eyeRadiusY = isBlinking ? 0.6 : (mood === 'happy' ? 3.8 : 5.0);

  // 3. Dynamic Gaze Tracking (Pupil position shifts)
  let gazeX = 0;
  let gazeY = 0;
  if (mood === 'neutral') {
    // Reading left-to-right drift
    gazeX = Math.sin(t * 1.6) * 2.5;
    gazeY = 1.2;
  } else if (mood === 'frustrated') {
    // Fixated on code error trace
    gazeX = -1.0 + Math.sin(t * 4.0) * 0.6;
    gazeY = 1.8;
  } else if (mood === 'stressed') {
    // Rapid ocular saccades between screens
    gazeX = Math.sin(t * 5.5) * 3.2;
    gazeY = Math.cos(t * 4.2) * 2.0;
  } else if (mood === 'happy') {
    gazeX = Math.sin(t * 1.5) * 1.2;
    gazeY = -0.8;
  } else {
    // Calm: relaxed center gaze
    gazeX = Math.sin(t * 0.8) * 0.8;
    gazeY = Math.cos(t * 0.6) * 0.5;
  }

  // 4. Feature Morphs (Eyebrows, Cheeks, Mouth)
  // Left & Right Brow Curves
  let leftBrowY1 = 80;
  let leftBrowYMid = 76;
  let leftBrowY2 = 80;
  let rightBrowY1 = 80;
  let rightBrowYMid = 76;
  let rightBrowY2 = 80;

  if (mood === 'frustrated') {
    // AU4 Brow Lowerer: Inner brows pushed downward and furrowed
    const furrowPulse = Math.sin(t * 3.0) * 0.8;
    leftBrowY1 = 78; leftBrowYMid = 84 + furrowPulse; leftBrowY2 = 88 + furrowPulse;
    rightBrowY1 = 88 + furrowPulse; rightBrowYMid = 84 + furrowPulse; rightBrowY2 = 78;
  } else if (mood === 'stressed') {
    // AU1 Inner Brow Raiser: Inner corners arched up in distress
    const stressPulse = Math.sin(t * 6.0) * 0.6;
    leftBrowY1 = 84; leftBrowYMid = 78 + stressPulse; leftBrowY2 = 74 + stressPulse;
    rightBrowY1 = 74 + stressPulse; rightBrowYMid = 78 + stressPulse; rightBrowY2 = 84;
  } else if (mood === 'happy') {
    // Cheerful relaxed high arches
    const happyBounce = Math.sin(t * 3.5) * 0.6;
    leftBrowY1 = 77 + happyBounce; leftBrowYMid = 72 + happyBounce; leftBrowY2 = 76 + happyBounce;
    rightBrowY1 = 76 + happyBounce; rightBrowYMid = 72 + happyBounce; rightBrowY2 = 77 + happyBounce;
  } else {
    // Calm/Neutral baseline
    leftBrowY1 = 80; leftBrowYMid = 76; leftBrowY2 = 80;
    rightBrowY1 = 80; rightBrowYMid = 76; rightBrowY2 = 80;
  }

  // Mouth Curve (Smile / Frown / Neutral)
  let mouthPath = "M74,170 Q100,172 126,170";
  if (mood === 'happy') {
    // AU12 Lip Corner Puller: Upturned smile pulsing with laughter/breath
    const smileDepth = 188 + Math.sin(t * 3.5) * 2.0;
    const cornerLift = 162 + Math.sin(t * 3.5) * 1.5;
    mouthPath = `M70,${cornerLift} Q100,${smileDepth} 130,${cornerLift}`;
  } else if (mood === 'frustrated') {
    // AU15 Lip Depressor: Downturned tense curve
    const frownTension = Math.sin(t * 2.0) * 1.0;
    mouthPath = `M72,${174 + frownTension} Q100,${162 + frownTension} 128,${174 + frownTension}`;
  } else if (mood === 'stressed') {
    // Tightened compressed lip line
    const jitter = Math.sin(t * 12.0) * 0.5;
    mouthPath = `M74,${169 + jitter} Q100,${167 + jitter} 126,${169 + jitter}`;
  } else {
    // Calm / Neutral resting mouth
    const calmBreath = Math.sin(t * 1.2) * 0.6;
    mouthPath = `M74,${170 + calmBreath} Q100,${172 + calmBreath} 126,${170 + calmBreath}`;
  }

  // Dynamic 3D Mesh Landmark Coordinates (x, y)
  const landmarks = [
    // Jawline contour
    [40 + headOffsetX * 0.8, 110 + headOffsetY],
    [46 + headOffsetX * 0.85, 140 + headOffsetY],
    [60 + headOffsetX * 0.9, 175 + headOffsetY],
    [80 + headOffsetX * 0.95, 202 + headOffsetY],
    [100 + headOffsetX, 215 + headOffsetY],
    [120 + headOffsetX * 0.95, 202 + headOffsetY],
    [140 + headOffsetX * 0.9, 175 + headOffsetY],
    [154 + headOffsetX * 0.85, 140 + headOffsetY],
    [160 + headOffsetX * 0.8, 110 + headOffsetY],

    // Left Eyebrow
    [60 + headOffsetX, leftBrowY1 + headOffsetY],
    [75 + headOffsetX, leftBrowYMid + headOffsetY],
    [90 + headOffsetX, leftBrowY2 + headOffsetY],

    // Right Eyebrow
    [110 + headOffsetX, rightBrowY1 + headOffsetY],
    [125 + headOffsetX, rightBrowYMid + headOffsetY],
    [140 + headOffsetX, rightBrowY2 + headOffsetY],

    // Left Eye corners & center
    [68 + headOffsetX, 98 + headOffsetY],
    [75 + headOffsetX, 98 + headOffsetY],
    [82 + headOffsetX, 98 + headOffsetY],

    // Right Eye corners & center
    [118 + headOffsetX, 98 + headOffsetY],
    [125 + headOffsetX, 98 + headOffsetY],
    [132 + headOffsetX, 98 + headOffsetY],

    // Nose Bridge & Base
    [100 + headOffsetX, 92 + headOffsetY],
    [100 + headOffsetX, 115 + headOffsetY],
    [100 + headOffsetX, 135 + headOffsetY],
    [93 + headOffsetX, 140 + headOffsetY],
    [107 + headOffsetX, 140 + headOffsetY],

    // Mouth corners & center
    [72 + headOffsetX, (mood === 'happy' ? 164 : 170) + headOffsetY],
    [86 + headOffsetX, (mood === 'happy' ? 172 : 171) + headOffsetY],
    [100 + headOffsetX, (mood === 'happy' ? 175 : 172) + headOffsetY],
    [114 + headOffsetX, (mood === 'happy' ? 172 : 171) + headOffsetY],
    [128 + headOffsetX, (mood === 'happy' ? 164 : 170) + headOffsetY],
    [100 + headOffsetX, 185 + headOffsetY], // Chin lower lip
  ];

  // Triangulation wireframe lines connecting facial landmarks
  const meshConnections = [
    [9, 10], [10, 11], [12, 13], [13, 14], // Eyebrows
    [11, 21], [12, 21], // Brow to nose bridge
    [15, 16], [16, 17], [18, 19], [19, 20], // Eyes
    [15, 9], [17, 11], [18, 12], [20, 14], // Eye to brow links
    [21, 22], [22, 23], [23, 24], [23, 25], // Nose bridge & nostrils
    [17, 22], [18, 22], // Inner eye to nose
    [24, 26], [25, 30], [23, 28], // Nose to mouth
    [26, 27], [27, 28], [28, 29], [29, 30], // Mouth top
    [26, 31], [30, 31], [28, 31], // Mouth bottom
    [0, 9], [8, 14], [2, 26], [6, 30], [4, 31], // Face contour anchors
  ];

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
          <div className="flex items-center space-x-1 text-[11px] font-mono text-zinc-400">
            <ScanFace className="w-3.5 h-3.5 text-zinc-300" />
            <span>Dynamic Perception Mesh</span>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="flex items-center space-x-3 text-[10px] font-mono text-zinc-400">
          <span className="text-zinc-300">30.0 FPS</span>
          <span className="hidden sm:inline">1080p</span>
          <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-white/[0.08]">
            Swin-FER 3D
          </span>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="relative aspect-[16/10] w-full bg-[#0c0c0e] overflow-hidden flex items-center justify-center">
        {cameraActive ? (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Minimalist Focal Frame */}
            <div
              className="relative w-44 h-52 sm:w-52 sm:h-60 flex items-center justify-center transition-transform duration-100 ease-out"
              style={{
                transform: `translate(${headOffsetX * 0.4}px, ${headOffsetY * 0.4}px)`,
              }}
            >
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

              {/* Dynamic SVG Animated Facial Mesh */}
              <svg
                viewBox="0 0 200 240"
                className="w-full h-full overflow-visible"
              >
                {/* Smooth Animated Head Contour */}
                <path
                  d={`M${100 + headOffsetX},${25 + headOffsetY} C${140 + headOffsetX * 0.8},${25 + headOffsetY} ${165 + headOffsetX * 0.8},${55 + headOffsetY} ${165 + headOffsetX * 0.8},${110 + headOffsetY} C${165 + headOffsetX * 0.8},${165 + headOffsetY} ${135 + headOffsetX * 0.9},${205 + headOffsetY} ${100 + headOffsetX},${215 + headOffsetY} C${65 + headOffsetX * 0.9},${205 + headOffsetY} ${35 + headOffsetX * 0.8},${165 + headOffsetY} ${35 + headOffsetX * 0.8},${110 + headOffsetY} C${35 + headOffsetX * 0.8},${55 + headOffsetY} ${60 + headOffsetX * 0.8},${25 + headOffsetY} ${100 + headOffsetX},${25 + headOffsetY} Z`}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.22)"
                  strokeWidth="1.2"
                />

                {showMesh && (
                  <>
                    {/* Triangulation Wireframe Lines */}
                    {meshConnections.map(([i, j], idx) => {
                      const p1 = landmarks[i];
                      const p2 = landmarks[j];
                      if (!p1 || !p2) return null;
                      return (
                        <line
                          key={idx}
                          x1={p1[0]}
                          y1={p1[1]}
                          x2={p2[0]}
                          y2={p2[1]}
                          stroke="rgba(255, 255, 255, 0.12)"
                          strokeWidth="0.8"
                        />
                      );
                    })}

                    {/* Animated Eyebrows (AU4 / AU1 dynamic curves) */}
                    <path
                      d={`M${60 + headOffsetX},${leftBrowY1 + headOffsetY} Q${75 + headOffsetX},${leftBrowYMid + headOffsetY} ${90 + headOffsetX},${leftBrowY2 + headOffsetY}`}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.85)"
                      strokeWidth="1.8"
                    />
                    <path
                      d={`M${110 + headOffsetX},${rightBrowY1 + headOffsetY} Q${125 + headOffsetX},${rightBrowYMid + headOffsetY} ${140 + headOffsetX},${rightBrowY2 + headOffsetY}`}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.85)"
                      strokeWidth="1.8"
                    />

                    {/* Left Eye & Gaze Pupil */}
                    <ellipse
                      cx={75 + headOffsetX}
                      cy={98 + headOffsetY}
                      rx={6}
                      ry={eyeRadiusY}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.7)"
                      strokeWidth="1.2"
                    />
                    {!isBlinking && (
                      <circle
                        cx={75 + headOffsetX + gazeX}
                        cy={98 + headOffsetY + gazeY}
                        r={2.2}
                        fill="#ffffff"
                      />
                    )}

                    {/* Right Eye & Gaze Pupil */}
                    <ellipse
                      cx={125 + headOffsetX}
                      cy={98 + headOffsetY}
                      rx={6}
                      ry={eyeRadiusY}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.7)"
                      strokeWidth="1.2"
                    />
                    {!isBlinking && (
                      <circle
                        cx={125 + headOffsetX + gazeX}
                        cy={98 + headOffsetY + gazeY}
                        r={2.2}
                        fill="#ffffff"
                      />
                    )}

                    {/* Nose Bridge */}
                    <path
                      d={`M${100 + headOffsetX},${92 + headOffsetY} L${100 + headOffsetX},${135 + headOffsetY} L${93 + headOffsetX},${140 + headOffsetY} L${107 + headOffsetX},${140 + headOffsetY}`}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.4)"
                      strokeWidth="1.2"
                    />

                    {/* Animated Mouth (AU12 / AU15 dynamic curve) */}
                    <path
                      d={mouthPath}
                      transform={`translate(${headOffsetX}, ${headOffsetY})`}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.85)"
                      strokeWidth="1.6"
                    />

                    {/* Dynamic Landmark Points */}
                    {landmarks.map(([cx, cy], i) => (
                      <circle
                        key={i}
                        cx={cx}
                        cy={cy}
                        r={1.3}
                        fill="#ffffff"
                        opacity={0.8}
                      />
                    ))}
                  </>
                )}
              </svg>
            </div>

            {/* Bottom HUD info overlay: Gaze tracking */}
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
            <span>{showMesh ? '3D Mesh ON' : '3D Mesh OFF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
