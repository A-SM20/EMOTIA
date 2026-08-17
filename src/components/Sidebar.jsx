import React from 'react';
import { useEmotion } from '../context/EmotionContext';
import {
  LayoutDashboard,
  Activity,
  BrainCircuit,
  MessageSquareCode,
  Sparkles,
  Settings,
  ChevronRight
} from 'lucide-react';

export const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { activeScreen, setActiveScreen, setSettingsOpen, scenario } = useEmotion();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      subtitle: 'Live Assistant & HUD',
      icon: LayoutDashboard,
      badge: 'Main',
    },
    {
      id: 'live',
      label: 'Live Emotion',
      subtitle: 'Multimodal Fusion Monitor',
      icon: Activity,
      badge: `${scenario.confidence}%`,
      badgeColor: scenario.textColor,
    },
    {
      id: 'memory',
      label: 'Memory',
      subtitle: 'Profile & Behavioral Habits',
      icon: BrainCircuit,
      badge: 'Active',
    },
    {
      id: 'conversations',
      label: 'Conversations',
      subtitle: 'Interaction Log & Affect',
      icon: MessageSquareCode,
      badge: '8 Logs',
    },
    {
      id: 'insights',
      label: 'Insights (XAI)',
      subtitle: 'Explainability & Pipeline',
      icon: Sparkles,
      badge: 'XAI',
    },
  ];

  return (
    <aside
      className={`bg-surface border-r border-surface-border flex flex-col justify-between transition-all duration-300 z-20 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Section */}
      <div className="flex flex-col">
        {/* Navigation Items */}
        <div className="p-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent text-white border-l-4 border-cyan-400 font-medium'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-surface-light/60'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-400 shadow-glow-cyan'
                        : 'bg-surface-light text-slate-400 group-hover:text-cyan-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {!isCollapsed && (
                    <div className="truncate">
                      <div className="text-sm font-medium leading-tight">{item.label}</div>
                      <div className="text-[11px] text-slate-500 truncate">{item.subtitle}</div>
                    </div>
                  )}
                </div>

                {!isCollapsed && item.badge && (
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border border-slate-700 bg-surface-light/80 ${
                      item.badgeColor || 'text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>

      {/* Bottom Pinned Section: Settings & Toggle */}
      <div className="p-3 border-t border-surface-border space-y-1">
        <button
          onClick={() => setSettingsOpen(true)}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between'
          } p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-surface-light transition-all`}
          title="Settings"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-surface-light text-slate-400 hover:text-cyan-400">
              <Settings className="w-4 h-4" />
            </div>
            {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
          </div>
          {!isCollapsed && <ChevronRight className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Collapse / Expand Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-surface-light/40 text-xs transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="text-[11px] font-mono font-medium">{isCollapsed ? '➔' : '◀ Collapse'}</span>
        </button>
      </div>
    </aside>
  );
};
