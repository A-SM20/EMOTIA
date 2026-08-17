import React, { useState } from 'react';
import { useEmotion } from '../context/EmotionContext';
import { LEARNED_PREFERENCES_MOCK } from '../data/mockScenarios';
import {
  BrainCircuit,
  User,
  Clock,
  Sparkles,
  BookMarked,
  Layers,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Tag,
  Sliders,
  History,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export const MemoryScreen = () => {
  const { userProfile, setUserProfile } = useEmotion();
  const [selectedDay, setSelectedDay] = useState('Today');

  // Hourly mock affective breakdown for today
  const dailyAffectData = [
    { hour: '09:00', calm: 80, focus: 85, stress: 10 },
    { hour: '11:00', calm: 90, focus: 92, stress: 8 },
    { hour: '13:00', calm: 65, focus: 70, stress: 20 },
    { hour: '15:00', calm: 45, focus: 75, stress: 55 },
    { hour: '17:00', calm: 25, focus: 60, stress: 85 }, // Debugging bug
    { hour: '19:00', calm: 50, focus: 80, stress: 40 },
    { hour: '21:00', calm: 85, focus: 90, stress: 15 },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-2xl bg-surface border border-surface-border p-6 shadow-subtle-card relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-cyan-500/10 filter blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center text-black shadow-glow-cyan">
              <BrainCircuit className="w-7 h-7" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-semibold">
                Personalized Cognitive State
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Episodic Memory & User Profile
              </h1>
              <p className="text-xs text-slate-400">
                Persistent behavioral representations, long-term interaction habits, and adaptive assistant tailoring
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-surface-light border border-surface-border px-3 py-1.5 rounded-xl text-xs font-mono text-slate-300">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>Active Profile: ID_ALEX_01</span>
          </div>
        </div>
      </div>

      {/* Main Grid: User Profile Card (Left) & Emotional History (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* User Profile Card (5 Cols) */}
        <div className="lg:col-span-5 bg-surface rounded-2xl border border-surface-border p-5 shadow-subtle-card space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <User className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  Participant Persona
                </h2>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Synchronized
              </span>
            </div>

            {/* Profile Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-slate-400">Researcher Name</label>
                <div className="text-base font-bold text-white mt-0.5">{userProfile.name}</div>
                <div className="text-xs text-slate-400">{userProfile.role} • {userProfile.institution}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-surface-light p-3 rounded-xl border border-surface-border">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Preferred Interaction Style</span>
                  <div className="text-xs font-bold text-cyan-300 mt-1">{userProfile.preferredStyle}</div>
                </div>

                <div className="bg-surface-light p-3 rounded-xl border border-surface-border">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Active Focus Area</span>
                  <div className="text-xs font-bold text-blue-300 mt-1 truncate">{userProfile.currentFocus}</div>
                </div>
              </div>

              {/* Interest Tags */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-cyan-400" />
                  <span>Research Interest Tags & Domain Ontology</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {userProfile.interests.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-light border border-surface-border text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>Session Duration: 4h 18m</span>
            <span className="text-cyan-400">Context Window: 64k</span>
          </div>
        </div>

        {/* Emotional History Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-surface rounded-2xl border border-surface-border p-5 shadow-subtle-card space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  Longitudinal Affective Trajectory
                </h2>
                <p className="text-[11px] text-slate-400">Daily cognitive state evolution (Calm → Focused → Stress Spikes)</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-sky-400">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span>Calm %</span>
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Focus %</span>
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Stress %</span>
              </span>
            </div>
          </div>

          {/* Daily Bar Chart */}
          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyAffectData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748B" fontSize={10} tickLine={false} />
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
                <Bar dataKey="calm" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="focus" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="stress" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-xl bg-surface-light border border-surface-border text-xs text-slate-300 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-amber-400 font-bold">17:00 Peak:</span>
              <span>Observed 85% frustration spike during deep debugging; proactively suppressed non-urgent interrupts.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Learned Preferences Section */}
      <div className="bg-surface rounded-2xl border border-surface-border p-6 shadow-subtle-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surface-border">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-glow-blue">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Learned Interaction Preferences (Adaptive Memory)</h2>
              <p className="text-xs text-slate-400">Contextual behavioral priors inferred across repeated HRI sessions</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full self-start sm:self-auto">
            <span>Adaptive Prior Engine v1.2</span>
          </div>
        </div>

        {/* Preferences List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {LEARNED_PREFERENCES_MOCK.map((pref) => (
            <div
              key={pref.id}
              className="p-4 rounded-xl bg-surface-light/80 border border-surface-border hover:border-cyan-500/30 transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {pref.category}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified</span>
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-100">{pref.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{pref.desc}</p>
            </div>
          ))}
        </div>

        {/* Mandatory Research Notice / Disclaimer Caption */}
        <div className="p-3.5 rounded-xl bg-surface-light/60 border border-slate-700/60 flex items-start space-x-2.5 text-xs text-slate-400">
          <AlertCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed font-sans text-[11px]">
            <strong className="text-slate-200">Illustrative / Mock Simulation Notice:</strong> The behavioral preferences above illustrate the personalized memory schema proposed in our paper. In the production deployment, these rules will be dynamically inferred from prolonged multimodal user interactions via neuro-symbolic rule extraction rather than static configuration.
          </p>
        </div>
      </div>
    </div>
  );
};
