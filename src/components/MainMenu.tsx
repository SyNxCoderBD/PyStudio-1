import React, { useEffect, useRef, useState } from 'react';
import { 
  Terminal, 
  Users, 
  ArrowRight, 
  Cpu, 
  Box, 
  Hash,
  User,
  Palette
} from 'lucide-react';
import { USER_COLORS } from '../constants/python';

interface MainMenuProps {
  initialRoomNumber?: string;
  isRoomInvite: boolean;
  userName: string;
  userColor: string;
  onUserNameChange: (name: string) => void;
  onUserColorChange: (color: string) => void;
  onJoinRoom: (roomId: string) => void;
}

const FEATURED_ROOMS = [
  { id: '101', label: 'Python basics', desc: 'Sandbox' },
  { id: '102', label: 'Data lab', desc: 'Algorithms' },
  { id: 'python-lab', label: 'Python lab', desc: 'Open room' },
  { id: 'live-collab', label: 'Live collab', desc: 'Terminal + packages' }
];

export const MainMenu: React.FC<MainMenuProps> = ({
  initialRoomNumber = '',
  isRoomInvite,
  userName,
  userColor,
  onUserNameChange,
  onUserColorChange,
  onJoinRoom
}) => {
  const [roomNumber, setRoomNumber] = useState(initialRoomNumber || '101');
  const [errorMsg, setErrorMsg] = useState('');
  const roomInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    (isRoomInvite ? nameInputRef.current : roomInputRef.current)?.focus();
  }, [isRoomInvite]);

  useEffect(() => {
    setRoomNumber(initialRoomNumber || '101');
  }, [initialRoomNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRoom = roomNumber.trim();
    if (!cleanRoom) {
      setErrorMsg('Please enter a room number or name to continue.');
      return;
    }
    if (isRoomInvite && !userName.trim()) {
      setErrorMsg('Enter your display name to join this room.');
      nameInputRef.current?.focus();
      return;
    }
    setErrorMsg('');
    onJoinRoom(cleanRoom);
  };

  const handleSelectFeaturedRoom = (id: string) => {
    setRoomNumber(id);
    onJoinRoom(id);
  };

  return (
    <div className="main-menu-scroll bg-[#080b0f] text-slate-100 flex flex-col px-5 sm:px-8 lg:px-12 relative select-none">
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,.08) 1px, transparent 1px)', backgroundSize: '100% 44px' }} />

      <header className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between py-5 sm:py-7 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-400 text-slate-950 flex items-center justify-center rounded-md">
            <Terminal className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex items-baseline gap-2.5">
            <h1 className="font-bold text-lg text-white">PyStudio</h1>
            <span className="hidden sm:inline text-[10px] text-slate-500 font-mono uppercase">Python workspaces</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-400 font-mono">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
          <span>PYTHON 3.11</span>
          <span className="text-slate-700">/</span>
          <span>BROWSER RUNTIME</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-2xl flex-1 flex items-center justify-center py-8 sm:py-12">
        <section className="w-full max-w-xl mx-auto">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-[10px] font-mono uppercase text-amber-400 mb-5">
            <span className="w-6 h-px bg-amber-400" />
            {isRoomInvite ? `Joining room / ${roomNumber}` : 'Pairing room / 01'}
          </div>
          <h2 className="font-serif text-center sm:text-left text-5xl sm:text-6xl leading-[0.98] text-slate-100 max-w-lg">
            Code in<br />
            good company<span className="text-amber-400">.</span>
          </h2>
          <p className="mt-5 mx-auto sm:mx-0 text-center sm:text-left text-sm text-slate-400 max-w-sm leading-relaxed">
            One shared room. A Python runtime for everyone in it.
          </p>

          <form onSubmit={handleSubmit} className="mt-9 space-y-5">
            <div className="space-y-2">
              <label htmlFor="room-number" className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-amber-400" /> Room name or number
              </label>
              <div className="flex items-stretch border-b border-slate-600 focus-within:border-amber-400 transition-colors">
                <span className="flex items-center pl-1 pr-3 text-amber-400 font-mono text-lg">#</span>
                <input
                  ref={roomInputRef}
                  id="room-number"
                  type="text"
                  value={roomNumber}
                  readOnly={isRoomInvite}
                  onChange={(e) => {
                    setRoomNumber(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="101 or team-name"
                  className="min-w-0 flex-1 bg-transparent py-3 text-base sm:text-lg font-mono font-medium text-slate-100 placeholder:text-slate-600 focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 sm:px-5 my-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  {isRoomInvite ? 'Join room' : 'Join/create'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              {errorMsg && <p className="text-rose-400 text-xs font-medium">{errorMsg}</p>}
            </div>

            <div className="grid sm:grid-cols-[1fr_auto] gap-5 items-end">
              <div className="space-y-2">
                <label htmlFor="display-name" className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-500" /> Display name
                </label>
                <input
                  ref={nameInputRef}
                  id="display-name"
                  type="text"
                  value={userName}
                  onChange={(e) => onUserNameChange(e.target.value)}
                  placeholder="Developer"
                  maxLength={24}
                  className="w-full bg-transparent border-b border-slate-700 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5 text-slate-500" /> Cursor color
                </span>
                <div className="flex items-center gap-2.5 py-1">
                  {USER_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onUserColorChange(color)}
                      style={{ backgroundColor: color }}
                      className={`w-4 h-4 rounded-full transition-transform cursor-pointer shrink-0 ${
                        userColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#080b0f] scale-110' : 'opacity-60 hover:opacity-100 hover:scale-110'
                      }`}
                      title={color}
                      aria-label={`Select cursor color ${color}`}
                      aria-pressed={userColor === color}
                    />
                  ))}
                </div>
              </div>
            </div>
          </form>

          <div className="mt-9 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase text-slate-500">Rooms to explore</span>
              <span className="text-[10px] font-mono text-slate-600">04</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6">
              {FEATURED_ROOMS.map((room, index) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => handleSelectFeaturedRoom(room.id)}
                  className="group flex items-center justify-between gap-2 py-2.5 border-b border-slate-800/70 text-left cursor-pointer"
                >
                  <span className="min-w-0">
                    <span className="block text-xs text-slate-200 group-hover:text-amber-300 transition-colors">{room.label}</span>
                    <span className="block text-[10px] text-slate-600 mt-0.5">{room.desc}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-600 group-hover:text-amber-400">0{index + 1}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

      </main>

      <footer className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between border-t border-slate-800/80 py-4 text-[10px] font-mono text-slate-600">
        <span>PyStudio</span>
        <span>NO INSTALL / JUST CODE</span>
      </footer>
    </div>
  );
};
