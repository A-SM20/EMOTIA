import React, { useState } from 'react';
import { useEmotion } from '../context/EmotionContext';
import {
  MessageSquareCode,
  Send,
  User,
  Volume2,
  Compass
} from 'lucide-react';

export const ConversationsScreen = () => {
  const {
    conversations,
    sendMessage,
    scenario,
    speakAssistantMessage,
  } = useEmotion();

  const [inputVal, setInputVal] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    sendMessage(inputVal);
    setInputVal('');
  };

  return (
    <div className="space-y-5 animate-fadeIn max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-xl bg-[#121215] border border-white/[0.08] p-5 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold shadow-sm">
              <MessageSquareCode className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-medium">
                Interaction History
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Conversations & Context
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400 bg-zinc-900 border border-white/[0.08] px-2.5 py-1 rounded-lg self-start sm:self-auto">
            <span>{conversations.length} Messages</span>
          </div>
        </div>
      </div>

      {/* Transcript Chat Stream */}
      <div className="bg-[#121215] rounded-xl border border-white/[0.08] p-5 shadow-card space-y-4 min-h-[480px] flex flex-col justify-between">
        <div className="space-y-4 overflow-y-auto max-h-[560px] pr-2">
          {conversations.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                {/* Sender Header */}
                <div className="flex items-center space-x-2 text-[11px] font-mono text-zinc-500 px-1">
                  {isUser ? (
                    <>
                      <span>Dr. Alex Vance</span>
                      <span>•</span>
                      <span>{msg.time}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-zinc-300">EMOTIA</span>
                      <span>•</span>
                      <span>{msg.time}</span>
                    </>
                  )}
                </div>

                {/* Message Bubble Body */}
                <div
                  className={`max-w-xl rounded-xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-zinc-800 text-zinc-100 border border-white/[0.08] rounded-tr-sm shadow-sm'
                      : 'bg-zinc-900 text-zinc-200 border border-white/[0.06] rounded-tl-sm shadow-sm'
                  }`}
                >
                  <p className="font-sans whitespace-pre-wrap">{msg.text}</p>

                  {!isUser && (
                    <div className="mt-2 pt-2 border-t border-white/[0.08] flex items-center justify-between">
                      <button
                        onClick={() => speakAssistantMessage(msg.text)}
                        className="text-[10px] font-mono text-zinc-400 hover:text-white flex items-center space-x-1 transition-colors"
                        title="Speak this response"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Replay Voice</span>
                      </button>
                      <span className="text-[10px] font-mono text-zinc-500">Proactive Trigger</span>
                    </div>
                  )}
                </div>

                {/* Metadata Chips Tagging */}
                <div className="flex flex-wrap items-center gap-1.5 px-1 pt-0.5">
                  {isUser && msg.emotionTag && (
                    <div className="flex items-center space-x-1 bg-zinc-900 border border-white/[0.08] px-2 py-0.5 rounded-md text-[10px] font-mono text-zinc-300">
                      <span className="text-zinc-500">Detected:</span>
                      <span className="font-medium text-white">
                        {msg.emotionTag.label} • {msg.emotionTag.confidence}%
                      </span>
                    </div>
                  )}

                  {!isUser && msg.contextTag && (
                    <div className="flex items-center space-x-1.5 bg-zinc-900 border border-white/[0.08] px-2 py-0.5 rounded-md text-[10px] font-mono text-zinc-400">
                      <Compass className="w-3 h-3 text-zinc-400" />
                      <span>{msg.contextTag.task}</span>
                      <span className="text-zinc-600">/</span>
                      <span className="text-zinc-300">{msg.contextTag.emotionState}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Chat Input */}
        <form onSubmit={handleSend} className="pt-3 border-t border-white/[0.08] space-y-2">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Send prompt to EMOTIA..."
              className="w-full bg-zinc-900 border border-white/[0.08] rounded-lg pl-3.5 pr-20 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
            />

            <button
              type="submit"
              disabled={!inputVal.trim()}
              className={`absolute right-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium flex items-center space-x-1 transition-all ${
                inputVal.trim()
                  ? 'bg-white text-black font-semibold hover:bg-zinc-200'
                  : 'text-zinc-600 cursor-not-allowed'
              }`}
            >
              <span>Send</span>
              <Send className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 px-0.5">
            <span>Prior State: {scenario.label} ({scenario.confidence}%)</span>
            <span>Real-time Evaluation</span>
          </div>
        </form>
      </div>
    </div>
  );
};
