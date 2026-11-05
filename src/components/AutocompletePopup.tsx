import React, { useEffect, useRef } from 'react';
import { 
  Boxes, 
  Code2, 
  Variable, 
  AlertCircle, 
  Terminal, 
  Layers, 
  Zap, 
  Hash,
  CornerDownLeft,
  Minimize2,
  X,
  Sparkles
} from 'lucide-react';
import { AutocompleteItem } from '../utils/pythonAutocomplete';

interface AutocompletePopupProps {
  suggestions: AutocompleteItem[];
  selectedIndex: number;
  position: { top: number; left: number };
  isMinimized: boolean;
  onToggleMinimize: (minimized: boolean) => void;
  onClose: () => void;
  onSelect: (item: AutocompleteItem) => void;
  onHoverIndex: (index: number) => void;
}

export const AutocompletePopup: React.FC<AutocompletePopupProps> = ({
  suggestions,
  selectedIndex,
  position,
  isMinimized,
  onToggleMinimize,
  onClose,
  onSelect,
  onHoverIndex
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const selectedItem = suggestions[selectedIndex] || suggestions[0];

  // Auto-scroll list when arrow keys navigate
  useEffect(() => {
    if (!isMinimized && listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, isMinimized]);

  const getKindBadge = (kind: AutocompleteItem['kind']) => {
    switch (kind) {
      case 'function':
        return {
          icon: <Code2 className="w-3 h-3 text-purple-400 shrink-0" />,
          label: 'fn',
          bg: 'bg-purple-950/80 text-purple-300 border-purple-800/60'
        };
      case 'method':
        return {
          icon: <Code2 className="w-3 h-3 text-blue-400 shrink-0" />,
          label: 'def',
          bg: 'bg-blue-950/80 text-blue-300 border-blue-800/60'
        };
      case 'class':
        return {
          icon: <Layers className="w-3 h-3 text-emerald-400 shrink-0" />,
          label: 'class',
          bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
        };
      case 'constant':
        return {
          icon: <Hash className="w-3 h-3 text-amber-400 shrink-0" />,
          label: 'const',
          bg: 'bg-amber-950/80 text-amber-300 border-amber-800/60'
        };
      case 'module':
        return {
          icon: <Boxes className="w-3 h-3 text-orange-400 shrink-0" />,
          label: 'mod',
          bg: 'bg-orange-950/80 text-orange-300 border-orange-800/60'
        };
      case 'keyword':
        return {
          icon: <Zap className="w-3 h-3 text-sky-400 shrink-0" />,
          label: 'kw',
          bg: 'bg-sky-950/80 text-sky-300 border-sky-800/60'
        };
      case 'builtin':
        return {
          icon: <Terminal className="w-3 h-3 text-yellow-400 shrink-0" />,
          label: 'built-in',
          bg: 'bg-yellow-950/80 text-yellow-300 border-yellow-800/60'
        };
      case 'exception':
        return {
          icon: <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />,
          label: 'error',
          bg: 'bg-rose-950/80 text-rose-300 border-rose-800/60'
        };
      case 'variable':
      default:
        return {
          icon: <Variable className="w-3 h-3 text-teal-400 shrink-0" />,
          label: 'var',
          bg: 'bg-teal-950/80 text-teal-300 border-teal-800/60'
        };
    }
  };

  // If minimized, display a small floating dot/pill button near the cursor
  if (isMinimized) {
    return (
      <div
        id="python-autocomplete-popup"
        className="absolute z-50 animate-in fade-in zoom-in-95 duration-100 select-none"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMinimize(false);
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            onToggleMinimize(false);
          }}
          title="Click to expand auto recommendations"
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/90 hover:bg-amber-400 text-slate-950 font-mono text-[10.5px] font-bold shadow-lg shadow-amber-500/20 border border-amber-300/80 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-slate-950 animate-pulse" />
          <span>{suggestions.length}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      id="python-autocomplete-popup"
      className="neu-raised absolute z-50 flex flex-col border border-slate-700/80 rounded-lg shadow-2xl overflow-hidden font-mono max-w-[92vw] md:max-w-2xl text-xs animate-in fade-in zoom-in-95 duration-100 select-none"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header with Title and Minimize / Close Controls */}
      <div className="flex items-center justify-between px-2.5 py-1 bg-slate-900/90 border-b border-slate-800 text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5 text-amber-300/90 font-medium">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>{suggestions.length} Recommendations</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMinimize(true);
            }}
            title="Minimize to dot button"
            className="p-0.5 rounded text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition cursor-pointer"
          >
            <Minimize2 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close recommendations (Esc)"
            className="p-0.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Suggestions List - Mobile Touch-Scroll Safe */}
        <div 
          ref={listRef}
          className="max-h-52 w-56 sm:w-64 overflow-y-auto divide-y divide-slate-800/40 select-none py-1 shrink-0 overscroll-contain touch-pan-y"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {suggestions.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const badge = getKindBadge(item.kind);

            return (
              <div
                key={`${item.label}-${idx}`}
                onMouseEnter={() => onHoverIndex(idx)}
                onMouseDown={(e) => {
                  if (e.button === 0) {
                    e.preventDefault();
                    onSelect(item);
                  }
                }}
                onTouchStart={(e) => {
                  touchStartRef.current = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY,
                    time: Date.now()
                  };
                }}
                onTouchEnd={(e) => {
                  if (touchStartRef.current) {
                    const dx = Math.abs(e.changedTouches[0].clientX - touchStartRef.current.x);
                    const dy = Math.abs(e.changedTouches[0].clientY - touchStartRef.current.y);
                    const dt = Date.now() - touchStartRef.current.time;
                    touchStartRef.current = null;
                    // If finger movement was very small and quick, it's a tap, not a scroll drag
                    if (dx < 12 && dy < 12 && dt < 450) {
                      e.preventDefault();
                      onSelect(item);
                    }
                  }
                }}
                className={`px-2.5 py-1.5 cursor-pointer flex items-center justify-between gap-2 transition-colors active:bg-amber-500/30 ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-200 font-semibold border-l-2 border-amber-400'
                    : 'text-slate-300 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {badge.icon}
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.source === 'imported' && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                      imported
                    </span>
                  )}
                  {item.source === 'local' && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                      local
                    </span>
                  )}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${badge.bg}`}>
                    {badge.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Docstring & Signature Preview Side-Panel (shows on selection) */}
        {selectedItem && (
          <div className="flex flex-col border-t md:border-t-0 md:border-l border-slate-700/60 bg-[#12141c] p-2.5 w-full md:w-72 lg:w-80 text-[11px] overflow-y-auto max-h-56 md:max-h-64 justify-between shrink-0">
            <div className="space-y-1.5">
              <div className="font-semibold text-slate-100 flex items-center justify-between border-b border-slate-800 pb-1">
                <span className="text-amber-300 truncate">{selectedItem.label}</span>
                <span className="text-[9px] text-slate-500 font-normal uppercase tracking-wider">
                  {selectedItem.kind}
                </span>
              </div>

              {selectedItem.detail && (
                <div className="text-slate-300 bg-slate-900/80 px-2 py-1 rounded text-[10.5px] border border-slate-800 font-mono break-all leading-snug">
                  {selectedItem.detail}
                </div>
              )}

              {selectedItem.doc && (
                <div className="text-slate-300 text-[10.5px] leading-relaxed pt-0.5">
                  {selectedItem.doc}
                </div>
              )}

              {selectedItem.example && (
                <div className="pt-1">
                  <div className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Code2 className="w-3 h-3 text-amber-400" />
                    <span>Example</span>
                  </div>
                  <pre className="bg-[#0b0d14] text-amber-200/90 p-2 rounded text-[10px] border border-slate-800/80 font-mono whitespace-pre overflow-x-auto leading-relaxed shadow-inner">
                    <code>{selectedItem.example}</code>
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[9px] text-slate-500 shrink-0">
              <span>Tab / ↵ to insert</span>
              <span className="flex items-center gap-0.5">
                <CornerDownLeft className="w-2.5 h-2.5" />
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
