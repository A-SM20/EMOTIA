import React from 'react';
import { useEmotion } from '../context/EmotionContext';
import { LEARNED_PREFERENCES_MOCK } from '../data/mockScenarios';
import {
  BrainCircuit,
  User,
  History,
  Tag,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export const MemoryScreen = () => {
  const { userProfile } = useEmotion();

  const dailyAffectData = [
    { hour: '09:00', calm: 80, focus: 85, stress: 10 },
    { hour: '11:00', calm: 90, focus: 92, stress: 8 },
    { hour: '13:00', calm: 65, focus: 70, stress: 20 },
    { hour: '15:00', calm: 45, focus: 75, stress: 55 },
    { hour: '17:00', calm: 25, focus: 60, stress: 85 },
    { hour: '19:00', calm: 50, focus: 80, stress: 40 },
    { hour: '21:00', calm: 85, focus: 90, stress: 15 },
  ];

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-xl bg-[#121215] border border-white/[0.08] p-5 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold shadow-sm">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-medium">
                Cognitive State
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Episodic Memory & Profile
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-zinc-900 border border-white/[0.08] px-2.5 py-1 rounded-lg text-xs font-mono text-zinc-400">
            <span>Profile: ID_ALEX_01</span>
          </div>
        </div>
      </div>

      {/* Main Grid: User Profile (Left) & Affect History (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* User Profile Card (5 Cols) */}
        <div className="lg:col-span-5 bg-[#121215] rounded-xl border border-white/[0.08] p-5 shadow-card space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-zinc-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                  Participant Persona
                </h2>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-white/[0.08] px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            {/* Profile Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-zinc-500">Name</label>
                <div className="text-sm font-semibold text-white mt-0.5">{userProfile.name}</div>
                <div className="text-xs text-zinc-400">{userProfile.role} • {userProfile.institution}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-white/[0.06]">
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Preferred Style</span>
                  <div className="text-xs font-medium text-zinc-200 mt-0.5">{userProfile.preferredStyle}</div>
                </div>

                <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-white/[0.06]">
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Active Focus</span>
                  <div className="text-xs font-medium text-zinc-200 mt-0.5 truncate">{userProfile.currentFocus}</div>
                </div>
              </div>

              {/* Interest Tags */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-zinc-400" />
                  <span>Domain Ontology Tags</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {userProfile.interests.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md text-xs font-mono bg-zinc-900 text-zinc-300 border border-white/[0.08]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-900 border border-white/[0.08] text-[11px] text-zinc-400 font-mono flex items-center justify-between">
            <span>Session: 4h 18m</span>
            <span className="text-zinc-300">Context: 64k</span>
          </div>
        </div>

        {/* Affect History Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-[#121215] rounded-xl border border-white/[0.08] p-5 shadow-card space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-3.5 h-3.5 text-zinc-400" />
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                  Affective Trajectory
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-[10px] font-mono text-zinc-400">
              <span className="flex items-center gap-1 text-zinc-300">
                <span className="w-2 h-2 rounded-sm bg-zinc-400"></span>
                <span>Calm</span>
              </span>
              <span className="flex items-center gap-1 text-zinc-300">
                <span className="w-2 h-2 rounded-sm bg-zinc-100"></span>
                <span>Focus</span>
              </span>
              <span className="flex items-center gap-1 text-zinc-300">
                <span className="w-2 h-2 rounded-sm bg-zinc-600"></span>
                <span>Stress</span>
              </span>
            </div>
          </div>

          {/* Daily Bar Chart */}
          <div className="h-52 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyAffectData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="hour" stroke="#52525b" fontSize={10} tickLine={false} />
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
                <Bar dataKey="calm" fill="#a1a1aa" radius={[3, 3, 0, 0]} />
                <Bar dataKey="focus" fill="#f4f4f5" radius={[3, 3, 0, 0]} />
                <Bar dataKey="stress" fill="#52525b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-900 border border-white/[0.08] text-xs text-zinc-400">
            Observed 85% frustration spike at 17:00 during active debugging; suppressed non-urgent notification interrupts.
          </div>
        </div>
      </div>

      {/* Learned Preferences Section */}
      <div className="bg-[#121215] rounded-xl border border-white/[0.08] p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
          <div>
            <h2 className="text-sm font-semibold text-white">Learned Interaction Preferences</h2>
            <p className="text-xs text-zinc-400">Adaptive behavioral priors inferred across repeated sessions</p>
          </div>

          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-white/[0.08] px-2.5 py-0.5 rounded-full self-start sm:self-auto">
            Adaptive Prior v1.2
          </span>
        </div>

        {/* Preferences Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {LEARNED_PREFERENCES_MOCK.map((pref) => (
            <div
              key={pref.id}
              className="p-3.5 rounded-lg bg-zinc-900/80 border border-white/[0.06] hover:border-white/20 transition-all space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-zinc-400 bg-zinc-800 px-1.5 py-0.2 rounded border border-white/[0.08]">
                  {pref.category}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  Verified
                </span>
              </div>
              <h3 className="text-xs font-semibold text-zinc-200">{pref.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{pref.desc}</p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/[0.06] flex items-start space-x-2 text-xs text-zinc-400">
          <AlertCircle className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            <strong className="text-zinc-300">Illustrative / Mock Simulation Notice:</strong> In the production deployment, behavioral preferences are dynamically inferred from prolonged multimodal user interactions via neuro-symbolic rule extraction rather than static configuration.
          </p>
        </div>
      </div>
    </div>
  );
};
