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
      subtitle: 'Live Assistant',
      icon: LayoutDashboard,
    },
    {
      id: 'live',
      label: 'Live Emotion',
      subtitle: 'Multimodal Monitor',
      icon: Activity,
      badge: `${scenario.confidence}%`,
    },
    {
      id: 'memory',
      label: 'Memory',
      subtitle: 'Profile & Habits',
      icon: BrainCircuit,
    },
    {
      id: 'conversations',
      label: 'Conversations',
      subtitle: 'Dialog History',
      icon: MessageSquareCode,
    },
    {
      id: 'insights',
      label: 'Insights',
      subtitle: 'Explainability (XAI)',
      icon: Sparkles,
    },
  ];

  return (
    <aside
      className={`bg-[#0c0c0e] border-r border-white/[0.08] flex flex-col justify-between transition-all duration-200 z-20 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Top Navigation */}
      <div className="p-3 space-y-1 mt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                isActive
                  ? 'bg-zinc-800/90 text-white font-medium border border-white/[0.08] shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div
                  className={`p-1.5 rounded-md transition-colors ${
                    isActive ? 'text-white' : 'text-zinc-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {!isCollapsed && (
                  <div className="truncate">
                    <div className="text-xs font-medium leading-tight">{item.label}</div>
                  </div>
                )}
              </div>

              {!isCollapsed && item.badge && (
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-white/[0.08] px-1.5 py-0.2 rounded">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Pinned Section */}
      <div className="p-3 border-t border-white/[0.08] space-y-1">
        <button
          onClick={() => setSettingsOpen(true)}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between'
          } p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900/80 transition-all`}
          title="Settings"
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 text-zinc-400">
              <Settings className="w-4 h-4" />
            </div>
            {!isCollapsed && <span className="text-xs font-medium">Settings</span>}
          </div>
          {!isCollapsed && <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />}
        </button>

        {/* Collapse / Expand Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40 text-xs transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="text-[10px] font-mono">{isCollapsed ? '→' : '← Collapse'}</span>
        </button>
      </div>
    </aside>
  );
};
