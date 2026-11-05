import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  messages,
  currentUserId,
  onSendMessage
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="safe-area-panel neu-raised fixed md:relative inset-y-0 right-0 w-full md:w-80 border-l border-slate-800 flex flex-col h-full z-40 shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
        <span className="font-bold text-xs text-slate-200 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" /> Room Discussion
        </span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs bg-[#0b0d14]">
        {messages.length === 0 ? (
          <div className="text-center text-[10px] text-slate-500 py-4">
            Welcome to room chat! Send a message to your team members.
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.userId === currentUserId;
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={msg.id || index}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1 mb-0.5 text-[9px] text-slate-400 font-mono">
                  <span style={{ color: msg.userColor }} className="font-bold">
                    {msg.userName}
                  </span>
                  <span>{timeStr}</span>
                </div>
                <div
                  className={`px-2.5 py-1.5 rounded-lg max-w-[85%] text-xs break-words ${
                    isMe
                      ? 'bg-amber-500 text-slate-950 font-medium'
                      : 'bg-slate-800 text-slate-100 border border-slate-700'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-2 bg-slate-950 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          autoComplete="off"
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-sans placeholder:text-slate-500"
        />
        <button
          type="submit"
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center justify-center cursor-pointer shadow-sm shadow-amber-500/20"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
