import React, { useState } from 'react';
import { EmotionProvider, useEmotion } from './context/EmotionContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SettingsModal } from './components/SettingsModal';
import { DashboardScreen } from './screens/DashboardScreen';
import { LiveEmotionScreen } from './screens/LiveEmotionScreen';
import { MemoryScreen } from './screens/MemoryScreen';
import { ConversationsScreen } from './screens/ConversationsScreen';
import { InsightsScreen } from './screens/InsightsScreen';

const AppContent = () => {
  const { activeScreen } = useEmotion();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'live':
        return <LiveEmotionScreen />;
      case 'memory':
        return <MemoryScreen />;
      case 'conversations':
        return <ConversationsScreen />;
      case 'insights':
        return <InsightsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-[#f4f4f5] font-sans overflow-hidden selection:bg-white/20 selection:text-white">
      {/* Left Sidebar Nav */}
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* Dynamic Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 modern-grid">
          <div className="max-w-6xl mx-auto">
            {renderScreen()}
          </div>
        </main>
      </div>

      {/* System Settings & Controls Modal */}
      <SettingsModal />
    </div>
  );
};

export default function App() {
  return (
    <EmotionProvider>
      <AppContent />
    </EmotionProvider>
  );
}
