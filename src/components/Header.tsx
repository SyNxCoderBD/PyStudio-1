import React, { useState } from 'react';
import { 
  Terminal, 
  Users, 
  Copy, 
  MessageSquare, 
  Box, 
  Play, 
  Loader2, 
  AlertCircle,
  Code2,
  Columns,
  SquareTerminal,
  CheckCheck,
  ArrowRight,
  Hand,
  Home,
  LogOut,
  Square
} from 'lucide-react';
import { UserPresence } from '../types';
import { PyodideStatus } from '../services/pyodide';

export type WorkspaceViewMode = 'split' | 'editor' | 'terminal';

interface HeaderProps {
  pyStatus: PyodideStatus;
  roomId: string;
  roomInputValue: string;
  onRoomInputChange: (val: string) => void;
  onJoinRoom: () => void;
  onCopyRoomLink: () => void;
  collaborators: Record<string, UserPresence>;
  currentUserId: string;
  isChatOpen: boolean;
  unreadChatCount: number;
  onToggleChat: () => void;
  onOpenPipModal: () => void;
  isRunning: boolean;
  onRunCode: () => void;
  onForceStop?: () => void;
  viewMode: WorkspaceViewMode;
  onViewModeChange: (mode: WorkspaceViewMode) => void;
  roomPackageCount?: number;
  onRaiseHand: () => void;
  handRaiseCooldown: number;
  onLeaveRoom?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  pyStatus,
  roomId,
  roomInputValue,
  onRoomInputChange,
  onJoinRoom,
  onCopyRoomLink,
  collaborators,
  currentUserId,
  isChatOpen,
  unreadChatCount,
  onToggleChat,
  onOpenPipModal,
  isRunning,
  onRunCode,
  onForceStop,
  viewMode,
  onViewModeChange,
  roomPackageCount = 0,
  onRaiseHand,
  handRaiseCooldown,
  onLeaveRoom
}) => {
  const [copied, setCopied] = useState(false);
  const usersArray: UserPresence[] = Object.values(collaborators);

  const handleCopy = () => {
    onCopyRoomLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomInputValue.trim()) {
      onJoinRoom();
    }
  };

  const isDifferentRoom = roomInputValue.trim() !== '' && roomInputValue.trim() !== roomId;

  return (
    <header className="neu-raised border-b border-slate-800 shrink-0 w-full select-none z-30 relative overflow-hidden">
      
      {/* Fully inline toolbar layout - No floating windows or modals */}
      <div className="hidden lg:grid grid-cols-[auto_minmax(0,1fr)] grid-rows-[38px_38px] items-center gap-x-4 px-3 py-2 w-full">

        {/* SECTION 1: Brand Logo & WASM Engine Status & Menu Navigation */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {onLeaveRoom && (
            <button
              type="button"
              onClick={onLeaveRoom}
              title="Return to Main Menu / Choose another room"
              className="p-1 sm:p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700/80 transition cursor-pointer flex items-center gap-1 text-xs shrink-0"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden md:inline">Menu</span>
            </button>
          )}

          <div className="bg-amber-500 text-slate-950 p-1 sm:p-1.5 rounded-lg font-bold flex items-center justify-center shadow-sm shadow-amber-500/20 shrink-0">
            <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            <h1 className="font-bold text-xs sm:text-sm md:text-base leading-none text-slate-100 flex items-center gap-1 shrink-0">
              PyStudio
            </h1>

            {/* Python WASM Engine Indicator */}
            {pyStatus === 'loading' && (
              <span 
                title="Loading Python 3.11 WebAssembly kernel..." 
                className="text-[9px] sm:text-[10px] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1 shrink-0"
              >
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                <span className="font-mono">Python 3.11</span>
              </span>
            )}
            {pyStatus === 'ready' && (
              <span 
                title="Python 3.11 WASM ready in browser" 
                className="text-[9px] sm:text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 shrink-0"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono">Python 3.11</span>
              </span>
            )}
            {pyStatus === 'failed' && (
              <span 
                title="WASM initialization error" 
                className="text-[9px] sm:text-[10px] bg-rose-500/15 text-rose-400 px-1.5 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1 shrink-0"
              >
                <AlertCircle className="w-2.5 h-2.5" />
                <span>Error</span>
              </span>
            )}
          </div>
        </div>

        {/* SECTION 2: Direct Inline Room Controls (No floating popup) */}
        <div className="neu-inset flex items-center justify-self-end space-x-1.5 sm:space-x-2 shrink-0 border border-slate-800/90 rounded-lg p-1">
          <form onSubmit={handleRoomSubmit} className="flex items-center gap-1 shrink-0">
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-md px-2 py-1 focus-within:border-amber-500 transition">
              <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-slate-500 font-mono text-xs">#</span>
              <input
                type="text"
                value={roomInputValue}
                onChange={(e) => onRoomInputChange(e.target.value)}
                placeholder="room-id"
                title="Type room name and press Enter to join"
                className="bg-transparent text-amber-300 font-mono text-xs font-semibold focus:outline-none w-24 sm:w-28 md:w-32 placeholder-slate-600"
              />
            </div>

            {/* Join / Switch Button if typed room differs from active room */}
            {isDifferentRoom && (
              <button
                type="submit"
                title="Join room"
                className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 px-2 py-1 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
              >
                <span>Join</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            {/* Direct 1-Tap Copy Link Button */}
            <button
              type="button"
              onClick={handleCopy}
              title="Copy room invite link"
              className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700/80 px-2 py-1 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1 shrink-0"
            >
              {copied ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-300" />
                  <span className="text-[11px] hidden xs:inline">Copy</span>
                </>
              )}
            </button>
          </form>

          {/* Active Collaborators Avatars & Online Counter */}
          <div className="flex items-center space-x-1 pl-1.5 border-l border-slate-800 shrink-0">
            <div className="flex -space-x-1.5 overflow-hidden shrink-0">
              {usersArray.slice(0, 3).map((user) => {
                const isMe = user.id === currentUserId;
                return (
                  <div
                    key={user.id}
                    style={{ backgroundColor: user.color || '#3b82f6' }}
                    title={`${user.name || user.id}${isMe ? ' (You)' : ''}`}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white border border-slate-900 uppercase shrink-0 select-none shadow"
                  >
                    {String(user.name || user.id || '?').substring(0, 2)}
                  </div>
                );
              })}
              {usersArray.length > 3 && (
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-700 flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-slate-200 border border-slate-900 shrink-0">
                  +{usersArray.length - 3}
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline pl-1">
              {usersArray.length} online
            </span>
          </div>
        </div>

        {/* SECTION 3: View Mode & Action Tools */}
        <div className="col-span-2 flex items-center justify-between space-x-1.5 sm:space-x-2 shrink-0 border-t border-slate-800/80 pt-1.5">
          
          {/* View Mode Switcher (Editor / Split / Terminal) */}
          <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 shrink-0">
            <button
              onClick={() => onViewModeChange('editor')}
              title="Code Editor Only"
              className={`px-2 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 cursor-pointer shrink-0 ${
                viewMode === 'editor' 
                  ? 'bg-slate-800 text-amber-400 shadow-sm border border-slate-700' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px]">Editor</span>
            </button>
            <button
              onClick={() => onViewModeChange('split')}
              title="Split Code & Terminal"
              className={`px-2 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 cursor-pointer shrink-0 ${
                viewMode === 'split' 
                  ? 'bg-slate-800 text-amber-400 shadow-sm border border-slate-700' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px]">Split</span>
            </button>
            <button
              onClick={() => onViewModeChange('terminal')}
              title="Interactive Terminal Full View"
              className={`px-2 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 cursor-pointer shrink-0 ${
                viewMode === 'terminal' 
                  ? 'bg-slate-800 text-amber-400 shadow-sm border border-slate-700' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SquareTerminal className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px]">Terminal</span>
            </button>
          </div>

          {/* Raise Hand Button (Request others to pause/stop for editing) */}
          <button
            onClick={onRaiseHand}
            disabled={handRaiseCooldown > 0}
            title={
              handRaiseCooldown > 0 
                ? `Raise Hand cooldown active (${handRaiseCooldown}s remaining)` 
                : "Raise Hand: Request others to stop running/waiting so you can edit code (20s cooldown)"
            }
            className={`h-9 px-3 rounded-md text-xs font-semibold flex items-center gap-2 cursor-pointer shrink-0 border ${
              handRaiseCooldown > 0
                ? 'bg-slate-800/80 text-slate-500 border-slate-800'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/35 hover:border-amber-400'
            }`}
          >
            <Hand className={`w-3.5 h-3.5 shrink-0 ${handRaiseCooldown === 0 ? 'text-amber-400' : 'text-slate-500'}`} />
            <span className="text-[11px]">
              {handRaiseCooldown > 0 ? `Wait ${handRaiseCooldown}s` : 'Raise Hand'}
            </span>
          </button>

          {/* Pip Package Manager */}
          <button
            onClick={onOpenPipModal}
            title={roomPackageCount > 0 ? `${roomPackageCount} room packages active (preserved in room)` : "Install Python Packages (Micropip)"}
            className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer shrink-0 relative"
          >
            <Box className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px]">Pip</span>
            {roomPackageCount > 0 && (
              <span className="ml-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full border border-amber-500/30">
                {roomPackageCount}
              </span>
            )}
          </button>

          {/* Chat Toggle Button */}
          <button
            onClick={onToggleChat}
            title="Collaborative Room Chat"
            className={`relative bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer shrink-0 ${
              isChatOpen ? 'border-amber-500/50 bg-slate-800 text-amber-300' : ''
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px]">Chat</span>
            {unreadChatCount > 0 && !isChatOpen && (
              <span key={unreadChatCount} className="chat-notification-badge absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-slate-900 shrink-0">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Run / Stop Code Button */}
          {isRunning ? (
            <button
              type="button"
              onClick={onForceStop}
              title="Stop Python Execution immediately (1-click Stop)"
              className="bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-md shadow-rose-950/40 cursor-pointer shrink-0 animate-pulse"
            >
              <Square className="w-3.5 h-3.5 fill-current shrink-0" />
              <span className="text-xs font-bold">Stop</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onRunCode}
              disabled={pyStatus === 'loading'}
              title="Run Python Code (Ctrl+Enter)"
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current shrink-0" />
              <span className="text-xs font-bold">Run</span>
            </button>
          )}
        </div>

      </div>

      <div className="lg:hidden px-3 py-2.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="bg-amber-500 text-slate-950 w-8 h-8 rounded-md flex items-center justify-center shrink-0">
              <Terminal className="w-4 h-4 stroke-[2.5]" />
            </span>
            <span className="font-bold text-sm text-slate-100">PyStudio</span>
            <span
              title={pyStatus === 'ready' ? 'Python runtime ready' : pyStatus === 'failed' ? 'Python runtime unavailable' : pyStatus === 'loading' ? 'Loading Python runtime' : 'Python loads on first run'}
              className={`w-2 h-2 rounded-full shrink-0 ${
                pyStatus === 'ready' ? 'bg-emerald-400' : pyStatus === 'failed' ? 'bg-rose-400' : 'bg-amber-400'
              }`}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1.5">
              {usersArray.slice(0, 3).map((user) => (
                <span
                  key={user.id}
                  title={user.name || user.id}
                  style={{ backgroundColor: user.color || '#3b82f6' }}
                  className="w-6 h-6 rounded-full border border-slate-950 flex items-center justify-center text-[9px] font-bold text-white"
                >
                  {String(user.name || user.id || '?').substring(0, 2)}
                </span>
              ))}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">{usersArray.length}</span>
            {onLeaveRoom && (
              <button
                type="button"
                onClick={onLeaveRoom}
                title="Leave room"
                aria-label="Leave room"
                className="w-8 h-8 flex items-center justify-center text-slate-400 border border-slate-800 rounded-md"
              >
                <Home className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleRoomSubmit} className="flex items-center gap-1.5">
          <label className="neu-inset flex items-center gap-2 min-w-0 flex-1 h-9 px-2.5 border border-slate-800 rounded-md focus-within:border-amber-500">
            <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-500 font-mono text-xs">#</span>
            <input
              type="text"
              value={roomInputValue}
              onChange={(event) => onRoomInputChange(event.target.value)}
              placeholder="room-id"
              aria-label="Room name or number"
              className="bg-transparent text-slate-100 font-mono text-xs min-w-0 flex-1 focus:outline-none placeholder:text-slate-600"
            />
          </label>
          {isDifferentRoom && (
            <button type="submit" title="Join room" aria-label="Join room" className="w-9 h-9 flex items-center justify-center bg-amber-500 text-slate-950 rounded-md">
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button type="button" onClick={handleCopy} title="Copy room invite link" aria-label="Copy room invite link" className="w-9 h-9 flex items-center justify-center border border-slate-700 rounded-md text-slate-300">
            {copied ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </form>

        <div className="neu-inset grid grid-cols-3 gap-1 p-1 rounded-md" role="group" aria-label="Workspace view">
          {([
            ['editor', Code2, 'Editor'],
            ['split', Columns, 'Split'],
            ['terminal', SquareTerminal, 'Terminal']
          ] as const).map(([mode, Icon, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewModeChange(mode)}
              title={`${label} view`}
              aria-label={`${label} view`}
              aria-pressed={viewMode === mode}
              className={`h-9 flex items-center justify-center gap-1.5 rounded text-[11px] font-medium ${
                viewMode === mode ? 'bg-slate-700 text-amber-300 shadow-sm' : 'text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onRaiseHand}
            disabled={handRaiseCooldown > 0}
            title={handRaiseCooldown > 0 ? `Raise hand cooldown: ${handRaiseCooldown}s` : 'Raise hand'}
            aria-label={handRaiseCooldown > 0 ? `Raise hand cooldown: ${handRaiseCooldown} seconds` : 'Raise hand'}
            className="w-9 h-9 flex items-center justify-center border border-slate-700 rounded-md text-amber-300 disabled:text-slate-600"
          >
            <Hand className="w-4 h-4" />
          </button>
          <button type="button" onClick={onOpenPipModal} title="Python packages" aria-label="Python packages" className="w-9 h-9 flex items-center justify-center border border-slate-700 rounded-md text-amber-300 relative">
            <Box className="w-4 h-4" />
            {roomPackageCount > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-slate-950 text-[9px] font-bold">{roomPackageCount}</span>}
          </button>
          <button type="button" onClick={onToggleChat} title="Room chat" aria-label="Room chat" className={`w-9 h-9 flex items-center justify-center border rounded-md relative ${isChatOpen ? 'border-amber-500 text-amber-300' : 'border-slate-700 text-slate-300'}`}>
            <MessageSquare className="w-4 h-4" />
            {unreadChatCount > 0 && !isChatOpen && <span key={unreadChatCount} className="chat-notification-badge absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-bold flex items-center justify-center">{unreadChatCount}</span>}
          </button>
          {isRunning ? (
            <button type="button" onClick={onForceStop} title="Stop Python execution" aria-label="Stop Python execution" className="flex-1 h-9 flex items-center justify-center gap-2 bg-rose-600 text-white rounded-md text-xs font-semibold">
              <Square className="w-3.5 h-3.5 fill-current" /> Stop
            </button>
          ) : (
            <button type="button" onClick={onRunCode} disabled={pyStatus === 'loading'} title="Run Python code" aria-label="Run Python code" className="flex-1 h-9 flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-md text-xs font-semibold disabled:opacity-50">
              <Play className="w-3.5 h-3.5 fill-current" /> Run
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
