import React from 'react';
import { UserX, RotateCw } from 'lucide-react';

interface KickModalProps {
  isOpen: boolean;
  roomId: string;
  onRejoin: () => void;
}

export const KickModal: React.FC<KickModalProps> = ({ isOpen, roomId, onRejoin }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="neu-raised border border-rose-500/50 rounded-2xl max-w-sm w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 shadow-2xl text-center space-y-4">
        <div className="w-12 h-12 bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto text-xl">
          <UserX className="w-6 h-6 text-rose-500" />
        </div>
        <div>
          <h3 className="font-bold text-slate-100 text-base">You Were Disconnected</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            You were disconnected from room <code className="text-amber-400 font-mono font-semibold">{roomId}</code> because you were inactive for 5 minutes.
          </p>
        </div>
        <button
          onClick={onRejoin}
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
        >
          <RotateCw className="w-4 h-4" /> Rejoin Room
        </button>
      </div>
    </div>
  );
};
