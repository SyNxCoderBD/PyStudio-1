import React from 'react';
import { ToastItem } from '../types';
import { Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss?: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-3 right-3 z-50 flex flex-col gap-2 max-w-xs sm:max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="neu-raised border border-slate-700 text-slate-100 p-3 rounded-xl shadow-2xl flex items-start gap-2.5 pointer-events-auto transition-all duration-300 animate-in fade-in slide-in-from-top-2 text-xs"
        >
          <div className="mt-0.5 shrink-0 text-amber-400">
            {toast.iconColorClass?.includes('rose') ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : toast.iconColorClass?.includes('emerald') ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Info className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-200 truncate">{toast.title}</div>
            <div className="text-[11px] text-slate-400 mt-0.5 leading-snug break-words">
              {toast.message}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
