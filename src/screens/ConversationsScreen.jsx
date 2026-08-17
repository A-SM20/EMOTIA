import React, { useState } from 'react';
import { useEmotion } from '../context/EmotionContext';
import {
  MessageSquareCode,
  Send,
  Sparkles,
  Bot,
  User,
  Clock,
  Zap,
  Mic,
  Sliders,
  Filter,
  CheckCheck,
  Volume2,
  VolumeX,
  Compass
} from 'lucide-react';

export const ConversationsScreen = () => {
  const {
    conversations,
    sendMessage,
    scenario,
    isSpeaking,
    speakAssistantMessage,
    stopSpeaking,
    ttsEnabled,
  } = useEmotion();

  const [inputVal, setInputVal] = useState('');
  const [filterModality, setFilterModality] = useState('all');

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    sendMessage(inputVal);
    setInputVal('');
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-2xl bg-surface border border-surface-border p-6 shadow-subtle-card relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-blue-500/10 filter blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-indigo-600 flex items-center justify-center text-black shadow-glow-cyan">
              <MessageSquareCode className="w-7 h-7" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-semibold">
                Affective Dialog Log
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Conversation History & Metadata
              </h1>
              <p className="text-xs text-slate-400">
                Full chronological transcript tagged with multimodal emotion confidence and task context
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-surface-light border border-surface-border px-3 py-1.5 rounded-xl self-start sm:self-auto">
            <span>{conversations.length} Exchanges Logged</span>
          </div>
        </div>
      </div>

      {/* Transcript Chat Stream */}
      <div className="bg-surface rounded-2xl border border-surface-border p-5 shadow-subtle-card space-y-5 min-h-[480px] flex flex-col justify-between">
        <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2">
          {conversations.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                {/* Sender Header Info */}
                <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400 px-1">
                  {isUser ? (
                    <>
                      <span>Participant (Dr. Alex Vance)</span>
                      <span className="text-slate-600">•</span>
                      <span>{msg.time}</span>
                      <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <User className="w-2.5 h-2.5" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-black flex items-center justify-center">
                        <Bot className="w-2.5 h-2.5" />
                      </div>
                      <span className="font-bold text-cyan-300">EMOTIA Assistant</span>
                      <span className="text-slate-600">•</span>
                      <span>{msg.time}</span>
                    </>
                  )}
                </div>

                {/* Message Bubble Body */}
                <div
                  className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-blue-950/40 via-surface-light to-surface-light border border-cyan-500/30 text-slate-100 rounded-tr-sm shadow-md'
                      : 'bg-surface-light/90 border border-surface-border text-slate-200 rounded-tl-sm shadow-md'
                  }`}
                >
                  <p className="font-sans whitespace-pre-wrap">{msg.text}</p>

                  {/* Assistant Speak aloud button if available */}
                  {!isUser && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center justify-between">
                      <button
                        onClick={() => speakAssistantMessage(msg.text)}
                        className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                        title="Speak this response"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Replay Audio</span>
                      </button>
                      <span className="text-[10px] font-mono text-slate-500">Autonomous Proactive Trigger</span>
                    </div>
                  )}
                </div>

                {/* Metadata Chips Tagging */}
                <div className="flex flex-wrap items-center gap-1.5 px-1 pt-0.5">
                  {isUser && msg.emotionTag && (
                    <div className="flex items-center space-x-1 bg-surface-light border border-slate-700 px-2 py-0.5 rounded-full text-[10px] font-mono">
                      <span className="text-slate-400">Detected:</span>
                      <span className="font-bold" style={{ color: msg.emotionTag.color }}>
                        {msg.emotionTag.label} • {msg.emotionTag.confidence}%
                      </span>
                    </div>
                  )}

                  {isUser && msg.modality && (
                    <span className="text-[10px] font-mono bg-surface-light border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                      Modality: {msg.modality}
                    </span>
                  )}

                  {!isUser && msg.contextTag && (
                    <div className="flex items-center space-x-1.5 bg-surface-light border border-cyan-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-cyan-300">
                      <Compass className="w-3 h-3 text-cyan-400" />
                      <span>Context: {msg.contextTag.task}</span>
                      <span className="text-slate-600">/</span>
                      <span>Affect State: {msg.contextTag.emotionState}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Chat Input at bottom */}
        <form onSubmit={handleSend} className="pt-4 border-t border-surface-border space-y-2">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Send query to EMOTIA (Affect-aware agent will adapt its answer to your active emotion state)..."
              className="w-full bg-surface-light border border-surface-border rounded-xl pl-4 pr-24 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />

            <button
              type="submit"
              disabled={!inputVal.trim()}
              className={`absolute right-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center space-x-1.5 transition-all ${
                inputVal.trim()
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold shadow-glow-cyan'
                  : 'bg-surface text-slate-600 cursor-not-allowed'
              }`}
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
            <span className="flex items-center gap-1 text-slate-400">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Active Affect Prior: {scenario.label} ({scenario.confidence}%)</span>
            </span>
            <span>Real-time Prompt Evaluation Mode</span>
          </div>
        </form>
      </div>
    </div>
  );
};
