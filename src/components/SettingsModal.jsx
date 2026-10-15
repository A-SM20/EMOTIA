import React, { useState } from 'react';
import { useEmotion } from '../context/EmotionContext';
import {
  X,
  Sliders,
  Camera,
  Cpu,
  Zap,
  Radio,
  Lightbulb,
  Bot,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Eye,
  ChevronDown,
  Sparkles
} from 'lucide-react';

export const SettingsModal = () => {
  const {
    settingsOpen,
    setSettingsOpen,
    isAutoCycle,
    setIsAutoCycle,
    cycleSpeed,
    setCycleSpeed,
    ttsEnabled,
    setTtsEnabled,
    cameraActive,
    setCameraActive,
    micActive,
    setMicActive,
    triggerScenario,
    backendStatus,
    liveData,
    updateStreamConfig,
    updateHardwareControl,
    updateHardwareTransport,
    updateEyeAnimation,
    submitUserFeedback,
  } = useEmotion();

  const [activeTab, setActiveTab] = useState('hardware'); // 'hardware' | 'general'
  const [streamUrl, setStreamUrl] = useState('0');
  const [transportMode, setTransportMode] = useState('serial');
  const [esp32Ip, setEsp32Ip] = useState('192.168.1.100');
  const [comPort, setComPort] = useState('COM3');
  const [servoAngle, setServoAngle] = useState(90);
  const [servoMode, setServoMode] = useState('both');
  const [lightMode, setLightMode] = useState('circadian');
  const [lightBrightness, setLightBrightness] = useState(75);
  const [statusMsg, setStatusMsg] = useState('');
  const [showFutureHardware, setShowFutureHardware] = useState(false);

  if (!settingsOpen) return null;

  const showStatus = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleApplyStream = async (source) => {
    const target = source !== undefined ? source : streamUrl;
    setStreamUrl(target);
    const res = await updateStreamConfig(target);
    if (res?.status === 'ok') {
      showStatus(`Stream source updated: ${target}`);
    }
  };

  const handleApplyTransport = async () => {
    const res = await updateHardwareTransport(transportMode, comPort, esp32Ip);
    if (res?.status === 'ok') {
      showStatus(`Hardware transport set to: ${transportMode.toUpperCase()}`);
    }
  };

  const handleEyeTest = async (emotion, gx = 0.0, gy = 0.0, blink = 0, style = 'focused') => {
    showStatus(`Sending OLED Eye Animation: ${emotion.toUpperCase()}`);
    await updateEyeAnimation({
      emotion,
      gaze_x: gx,
      gaze_y: gy,
      blink,
      style
    });
  };

  const handleServoChange = async (angle) => {
    setServoAngle(angle);
    await updateHardwareControl({ servo_angle: Number(angle) });
  };

  const handleGesture = async (gesture) => {
    showStatus(`Triggering ${gesture} gesture (v2.0)...`);
    await updateHardwareControl({ gesture });
  };

  const handleLightChange = async (mode, brightness) => {
    setLightMode(mode);
    setLightBrightness(brightness);
    const colorTempMap = {
      warm_focus: 'warm_amber',
      daylight: 'daylight',
      circadian: 'neutral',
      alert: 'warm_amber',
    };
    await updateHardwareControl({
      light_mode: mode,
      light_brightness: brightness,
      light_color_temp: colorTempMap[mode] || 'neutral'
    });
  };

  const handleFeedbackCorrection = async (emotion) => {
    const res = await submitUserFeedback(emotion);
    if (res?.status === 'ok') {
      showStatus(`Adapted baseline for ${emotion} correction [OK]`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121215] border border-white/[0.08] rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2.5">
            <Sliders className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-sm font-semibold text-white">System & Hardware Settings</h2>
              <p className="text-[11px] text-zinc-400">Physical Bot (OLED Animated Eyes, Vision, Audio) & Modularity</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-white/[0.06] pb-2">
          <button
            onClick={() => setActiveTab('hardware')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-2 transition-all ${
              activeTab === 'hardware'
                ? 'bg-zinc-800 text-white border border-white/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Hardware Bot & OLED Eyes</span>
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-2 transition-all ${
              activeTab === 'general'
                ? 'bg-zinc-800 text-white border border-white/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Simulation & Sensors</span>
          </button>
        </div>

        {statusMsg && (
          <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center space-x-2">
            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* ── TAB 1: HARDWARE BOT & OLED EYES ── */}
        {activeTab === 'hardware' && (
          <div className="space-y-4 pt-1">
            {/* Stream Ingestion Config */}
            <div className="bg-zinc-900/80 p-3.5 rounded-lg border border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-zinc-300" />
                  <span className="text-xs font-semibold text-zinc-200">Video Ingestion Source</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  backendStatus === 'connected' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border-white/[0.08]'
                }`}>
                  {liveData?.stream?.source_type ? `${liveData.stream.source_type.toUpperCase()} ACTIVE` : 'DISCONNECTED'}
                </span>
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  placeholder="0 (Generic USB Webcam) or http://192.168.1.50:81/stream"
                  className="flex-1 bg-[#121215] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-white/30"
                />
                <button
                  onClick={() => handleApplyStream()}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-mono border border-white/10 transition-colors"
                >
                  Connect
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center space-x-2 pt-1 text-[11px] font-mono text-zinc-400 flex-wrap gap-y-1">
                <span>Presets:</span>
                <button
                  onClick={() => handleApplyStream('0')}
                  className="px-2 py-0.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 rounded border border-emerald-500/30 font-semibold"
                >
                  USB Webcam 0 (Bot Eye)
                </button>
                <button
                  onClick={() => handleApplyStream('synthetic')}
                  className="px-2 py-0.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded border border-white/[0.08]"
                >
                  Synthetic Feed
                </button>
                <button
                  onClick={() => handleApplyStream('http://192.168.1.100:81/stream')}
                  className="px-2 py-0.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded border border-white/[0.08]"
                >
                  ESP32-CAM WiFi
                </button>
              </div>
            </div>

            {/* Hardware Transport Mode */}
            <div className="bg-zinc-900/80 p-3.5 rounded-lg border border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Radio className="w-4 h-4 text-zinc-300" />
                  <span className="text-xs font-semibold text-zinc-200">Hardware Actuator Transport</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                  Arduino Nano (CH340)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={transportMode}
                  onChange={(e) => setTransportMode(e.target.value)}
                  className="bg-[#121215] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none"
                >
                  <option value="serial">USB Serial COM (Active)</option>
                  <option value="sim">Virtual Simulation</option>
                  <option value="http">ESP32 HTTP REST</option>
                </select>

                <div className="flex space-x-1.5 sm:col-span-2">
                  <input
                    type="text"
                    value={comPort}
                    onChange={(e) => setComPort(e.target.value)}
                    placeholder="COM3"
                    disabled={transportMode !== 'serial'}
                    className="w-24 bg-[#121215] border border-white/[0.1] rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-200 disabled:opacity-40"
                  />
                  <input
                    type="text"
                    value={esp32Ip}
                    onChange={(e) => setEsp32Ip(e.target.value)}
                    placeholder="ESP32 IP"
                    disabled={transportMode !== 'http'}
                    className="flex-1 bg-[#121215] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-200 disabled:opacity-40"
                  />
                  <button
                    onClick={handleApplyTransport}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-mono border border-white/10"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {/* Physical Robot Actuator: 0.96" SSD1306 OLED Animated Eyes */}
            <div className="bg-zinc-900/90 p-3.5 rounded-lg border border-cyan-500/20 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-cyan-200">Active Actuator: 0.96" OLED Animated Eyes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                    OLED State: {liveData?.hardware?.eyes?.emotion?.toUpperCase() || 'CALM'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Rendered live onto the 128x64 OLED display in the robot's head visor. Gaze coordinates and emotional eyelids are driven dynamically by the affective vision pipeline.
              </p>

              {/* Eye Emotion Testing */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Test Eye Emotion Presets:</span>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { id: 'calm', label: 'Calm', style: 'focused', color: 'hover:border-emerald-500/50' },
                    { id: 'happy', label: 'Happy', style: 'joy', color: 'hover:border-amber-500/50' },
                    { id: 'neutral', label: 'Neutral', style: 'wide', color: 'hover:border-zinc-500/50' },
                    { id: 'frustrated', label: 'Frustrated', style: 'droop', color: 'hover:border-rose-500/50' },
                    { id: 'stressed', label: 'Stressed', style: 'wide', color: 'hover:border-purple-500/50' },
                  ].map((emo) => (
                    <button
                      key={emo.id}
                      onClick={() => handleEyeTest(emo.id, 0.0, 0.0, 0, emo.style)}
                      className={`py-1.5 px-1 bg-zinc-950/70 text-zinc-300 rounded border border-white/[0.08] text-[11px] font-mono capitalize transition-all ${emo.color}`}
                    >
                      {emo.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gaze & Blink Testing */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Test Gaze Tracking & Blink:</span>
                <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
                  <button
                    onClick={() => handleEyeTest('calm', -0.85, 0.0, 0, 'focused')}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono rounded border border-white/[0.08]"
                  >
                    Look Left
                  </button>
                  <button
                    onClick={() => handleEyeTest('calm', 0.0, 0.0, 0, 'focused')}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono rounded border border-white/[0.08]"
                  >
                    Center Gaze
                  </button>
                  <button
                    onClick={() => handleEyeTest('calm', 0.85, 0.0, 0, 'focused')}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono rounded border border-white/[0.08]"
                  >
                    Look Right
                  </button>
                  <button
                    onClick={() => handleEyeTest('calm', 0.0, -0.75, 0, 'focused')}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono rounded border border-white/[0.08]"
                  >
                    Look Up
                  </button>
                  <button
                    onClick={() => handleEyeTest('calm', 0.0, 0.0, 1, 'focused')}
                    className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 text-xs font-mono rounded border border-cyan-500/40"
                  >
                    Trigger Blink
                  </button>
                </div>
              </div>
            </div>

            {/* Modular Hardware Expansions (v2.0 Future Additions Accordion) */}
            <div className="bg-zinc-900/50 rounded-lg border border-dashed border-white/[0.12] overflow-hidden">
              <button
                onClick={() => setShowFutureHardware(!showFutureHardware)}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400/80" />
                  <div>
                    <span className="text-xs font-semibold text-zinc-300">Modular Additions (Future v2.0 Roadmap)</span>
                    <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-500/30">
                      Servos & Smart Lighting
                    </span>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${showFutureHardware ? 'rotate-180' : ''}`} />
              </button>

              {showFutureHardware && (
                <div className="p-3.5 pt-0 space-y-3.5 border-t border-white/[0.06]">
                  <p className="text-[11px] text-zinc-400 pt-2 leading-relaxed">
                    The current physical bot is a stationary desk robot with animated OLED eyes. Motorized servo neck panning and ambient LED halo are staged as modular v2.0 expansions:
                  </p>

                  {/* Servo Motor Controls */}
                  <div className="bg-zinc-950/60 p-3 rounded-lg border border-white/[0.06] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-xs font-medium text-zinc-300">Motorized Neck Servo (Future v2.0)</span>
                      </div>
                      <span className="text-xs font-mono text-zinc-400">{servoAngle}°</span>
                    </div>

                    <div className="space-y-1">
                      <input
                        type="range"
                        min="15"
                        max="165"
                        value={servoAngle}
                        onChange={(e) => handleServoChange(e.target.value)}
                        className="w-full accent-amber-400 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <span className="text-[11px] font-mono text-zinc-400">Simulate Gestures:</span>
                      <button
                        onClick={() => handleGesture('nod')}
                        className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono rounded"
                      >
                        Nod
                      </button>
                      <button
                        onClick={() => handleGesture('tilt')}
                        className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono rounded"
                      >
                        Tilt
                      </button>
                      <button
                        onClick={() => handleGesture('shake')}
                        className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono rounded"
                      >
                        Shake
                      </button>
                    </div>
                  </div>

                  {/* Smart Desk Light Controller */}
                  <div className="bg-zinc-950/60 p-3 rounded-lg border border-white/[0.06] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Lightbulb className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-xs font-medium text-zinc-300">Smart RGB Desk Halo (Future v2.0)</span>
                      </div>
                      <span className="text-xs font-mono text-zinc-400">{lightBrightness}%</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        { id: 'circadian', label: 'Circadian' },
                        { id: 'warm_focus', label: 'Amber Focus' },
                        { id: 'daylight', label: 'Daylight' },
                        { id: 'alert', label: 'Alert Pulse' },
                      ].map((lm) => (
                        <button
                          key={lm.id}
                          onClick={() => handleLightChange(lm.id, lightBrightness)}
                          className={`py-1 rounded text-[11px] font-mono border transition-all ${
                            lightMode === lm.id
                              ? 'bg-zinc-800 text-white border-white/20'
                              : 'bg-zinc-900 text-zinc-400 border-white/[0.06] hover:text-white'
                          }`}
                        >
                          {lm.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Continual Learning Online Correction Trigger */}
            <div className="bg-zinc-900/80 p-3.5 rounded-lg border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200">Continual Learning Correction</span>
                <span className="text-[10px] font-mono text-zinc-500">Active Adaptation</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Submit an instant ground-truth label to calibrate your personal facial baseline:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['calm', 'neutral', 'frustrated', 'stressed', 'happy'].map((em) => (
                  <button
                    key={em}
                    onClick={() => handleFeedbackCorrection(em)}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono border border-white/[0.08] capitalize"
                  >
                    Mark as {em}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: GENERAL SIMULATION & SENSORS ── */}
        {activeTab === 'general' && (
          <div className="space-y-3.5 pt-1">
            <div className="bg-zinc-900/80 p-3 rounded-lg border border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-zinc-200">Auto Cycle Demo</div>
                <div className="text-[11px] text-zinc-500">Loop through preset emotion scenarios</div>
              </div>
              <input
                type="checkbox"
                checked={isAutoCycle}
                onChange={(e) => setIsAutoCycle(e.target.checked)}
                className="w-4 h-4 accent-white cursor-pointer"
              />
            </div>

            <div className="bg-zinc-900/80 p-3 rounded-lg border border-white/[0.06]">
              <div className="text-xs font-medium text-zinc-200 mb-1">Cycle Interval</div>
              <select
                value={cycleSpeed}
                onChange={(e) => setCycleSpeed(Number(e.target.value))}
                className="w-full bg-[#121215] text-zinc-200 border border-white/[0.08] rounded-md px-2 py-1 text-xs font-mono focus:outline-none"
              >
                <option value={5000}>5 Seconds</option>
                <option value={8000}>8 Seconds (Default)</option>
                <option value={12000}>12 Seconds</option>
              </select>
            </div>

            <div className="bg-zinc-900/80 p-3 rounded-lg border border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-zinc-200">Voice Assistant Speech (TTS)</div>
                <div className="text-[11px] text-zinc-500">Speak proactive suggestions aloud</div>
              </div>
              <input
                type="checkbox"
                checked={ttsEnabled}
                onChange={(e) => setTtsEnabled(e.target.checked)}
                className="w-4 h-4 accent-white cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-zinc-900/80 p-3 rounded-lg border border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-zinc-200">Camera</div>
                  <div className="text-[10px] text-zinc-500">Facial Vision</div>
                </div>
                <input
                  type="checkbox"
                  checked={cameraActive}
                  onChange={(e) => setCameraActive(e.target.checked)}
                  className="w-4 h-4 accent-white cursor-pointer"
                />
              </div>

              <div className="bg-zinc-900/80 p-3 rounded-lg border border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-zinc-200">Microphone</div>
                  <div className="text-[10px] text-zinc-500">Audio Prosody</div>
                </div>
                <input
                  type="checkbox"
                  checked={micActive}
                  onChange={(e) => setMicActive(e.target.checked)}
                  className="w-4 h-4 accent-white cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-white/[0.08]">
          <button
            onClick={() => setSettingsOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};
