import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Loader2, 
  ShieldCheck, 
  Cpu, 
  Code2, 
  Users, 
  Sparkles, 
  RefreshCw, 
  Flame, 
  Zap, 
  BookOpen, 
  Check 
} from 'lucide-react';
import { PyodideStatus } from '../services/pyodide';

interface LoadingScreenProps {
  isLoading: boolean;
  roomId: string;
  pyStatus: PyodideStatus;
  isCodeLoaded: boolean;
}

const PYTHON_TIPS = [
  {
    topic: "Python 3.11 WASM",
    text: "PyStudio runs standard CPython 3.11 compiled to WebAssembly inside your browser with zero server roundtrips.",
    icon: Cpu
  },
  {
    topic: "Speed & Performance",
    text: "Python 3.11 includes the 'Specializing Adaptive Interpreter' making execution up to 60% faster than Python 3.10.",
    icon: Zap
  },
  {
    topic: "Micropip Wheels",
    text: "You can install pure-Python packages like sympy, requests-mock, regex, and pytest directly in your browser using Pip!",
    icon: Sparkles
  },
  {
    topic: "Live Collaboration",
    text: "Multiple developers can write code, see cursor positions, and view terminal executions in realtime inside the same room.",
    icon: Users
  },
  {
    topic: "Origin Story",
    text: "Guido van Rossum named Python after the BBC comedy series 'Monty Python's Flying Circus', not the snake!",
    icon: BookOpen
  },
  {
    topic: "List Comprehensions",
    text: "List comprehensions in Python are executed at native C-speed and are often 20-30% faster than standard for-loops.",
    icon: Flame
  }
];

const CODE_STREAM_SNIPPETS = [
  "import sys, json, ast",
  "import pyodide_js as wasm",
  "from pystudio import CollabSession",
  "",
  "async def boot_workspace():",
  "    runtime = wasm.load_kernel('3.11.8')",
  "    session = CollabSession(room='connected')",
  "    await session.sync_document_tree()",
  "    return 'Ready to code! 🚀'",
  "",
  "# Initializing AST Analyzer...",
  "def analyze_syntax(code: str):",
  "    tree = ast.parse(code, mode='exec')",
  "    return {'valid': True, 'symbols': len(tree.body)}"
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isLoading,
  roomId,
  pyStatus,
  isCodeLoaded
}) => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [progress, setProgress] = useState(15);
  const [codeLinesVisible, setCodeLinesVisible] = useState(3);
  const [tipFading, setTipFading] = useState(false);

  // Tip rotation interval with smooth CSS fade transition
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setTipFading(true);
      setTimeout(() => {
        setCurrentTipIndex((prev) => (prev + 1) % PYTHON_TIPS.length);
        setTipFading(false);
      }, 200);
    }, 4200);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleNextTip = () => {
    setTipFading(true);
    setTimeout(() => {
      setCurrentTipIndex((prev) => (prev + 1) % PYTHON_TIPS.length);
      setTipFading(false);
    }, 150);
  };

  // Animated code streamer line ticker
  useEffect(() => {
    if (!isLoading) return;
    const codeInterval = setInterval(() => {
      setCodeLinesVisible((prev) => (prev < CODE_STREAM_SNIPPETS.length ? prev + 1 : 1));
    }, 450);
    return () => clearInterval(codeInterval);
  }, [isLoading]);

  // Calculate dynamic progress percentage
  useEffect(() => {
    let target = 25; // Connected to room
    if (isCodeLoaded) target += 35; // 60%
    if (pyStatus === 'idle' || pyStatus === 'ready') target += 40; // 100%
    else if (pyStatus === 'failed') target += 40;

    const timer = setInterval(() => {
      setProgress((old) => {
        if (old < target) {
          return Math.min(target, old + Math.max(1, Math.floor((target - old) * 0.2)));
        }
        return old;
      });
    }, 60);

    return () => clearInterval(timer);
  }, [isCodeLoaded, pyStatus]);

  const activeTip = PYTHON_TIPS[currentTipIndex];
  const TipIcon = activeTip.icon;

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#06080e] flex flex-col items-center justify-center p-3 sm:p-6 select-none overflow-y-auto overflow-x-hidden animate-in fade-in duration-300">
      {/* Subtle Tech Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Ambient Glowing Orbs */}
      <div className="absolute w-80 sm:w-96 h-80 sm:h-96 bg-amber-500/20 rounded-full blur-[100px] pointer-events-none -top-16 -left-16 animate-pulse" />
      <div className="absolute w-80 sm:w-96 h-80 sm:h-96 bg-emerald-500/15 rounded-full blur-[110px] pointer-events-none -bottom-16 -right-16 animate-pulse delay-700" />

      {/* Main Card Container */}
      <div className="neu-raised relative z-10 max-w-lg w-full border border-slate-800/90 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col items-center text-center space-y-5 my-auto animate-in zoom-in-95 duration-300">
        
        {/* Animated Header with Dual-Tone Logo */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative flex items-center justify-center">
            {/* Spinning ambient border ring */}
            <div className="absolute w-20 h-20 rounded-2xl border-2 border-dashed border-amber-500/40 pointer-events-none animate-[spin_8s_linear_infinite]" />
            
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center text-slate-950 font-black">
              <Terminal className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center justify-center gap-2">
              Initializing PyStudio
            </h2>
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                Room:
              </span>
              <span className="text-amber-300 font-bold bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                #{roomId}
              </span>
            </div>
          </div>
        </div>

        {/* Smooth Dynamic Progress Bar with Percentage Counter */}
        <div className="w-full space-y-2">
          <div className="flex justify-between items-center text-xs font-mono px-1">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              Preparing Workspace
            </span>
            <span className="text-amber-400 font-bold text-sm">
              {progress}%
            </span>
          </div>

          {/* Glowing Track */}
          <div className="w-full h-2.5 bg-slate-950/90 rounded-full border border-slate-800/80 overflow-hidden p-0.5 relative">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-400 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
          </div>
        </div>

        {/* Live Synchronized Progress Checklist */}
        <div className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 text-left font-mono space-y-2.5 shadow-inner">
          {/* Step 1: Realtime Channel */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Realtime Collab Room</span>
            </div>
            <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-semibold">
              <Check className="w-3.5 h-3.5 stroke-[3]" /> Connected
            </span>
          </div>

          {/* Step 2: Code Sync */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Code2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Synchronizing Source Code</span>
            </div>
            {isCodeLoaded ? (
              <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-semibold">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> Loaded
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1 text-[11px]">
                <Loader2 className="w-3 h-3 animate-spin" /> Syncing...
              </span>
            )}
          </div>

          {/* Step 3: Pyodide WASM Kernel */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Cpu className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Python 3.11 WASM Engine</span>
            </div>
            {pyStatus === 'idle' ? (
              <span className="text-slate-400 text-[11px]">Loads on first run</span>
            ) : pyStatus === 'ready' ? (
              <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-semibold">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> Ready
              </span>
            ) : pyStatus === 'failed' ? (
              <span className="text-rose-400 text-[11px]">Fallback</span>
            ) : (
              <span className="text-sky-400 flex items-center gap-1 text-[11px]">
                <Loader2 className="w-3 h-3 animate-spin" /> Compiling...
              </span>
            )}
          </div>
        </div>

        {/* Mini Live Python Terminal Code Streamer */}
        <div className="w-full bg-[#07090e] border border-slate-800/80 rounded-xl p-3 text-left overflow-hidden relative font-mono text-[11px] leading-[18px]">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800/60 text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-2 h-2 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2 h-2 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-1 text-slate-400">kernel_bootstrap.py</span>
            </div>
            <span className="text-slate-500">Python 3.11</span>
          </div>

          <div className="h-16 overflow-hidden text-slate-300 space-y-0.5">
            {CODE_STREAM_SNIPPETS.slice(0, codeLinesVisible).map((line, idx) => (
              <div key={idx} className="truncate">
                {line.startsWith('import') || line.startsWith('from') ? (
                  <span className="text-purple-400">{line}</span>
                ) : line.startsWith('def') || line.startsWith('async') ? (
                  <span className="text-blue-400">{line}</span>
                ) : line.startsWith('#') ? (
                  <span className="text-slate-500 italic">{line}</span>
                ) : line.includes('return') ? (
                  <span className="text-amber-300">{line}</span>
                ) : (
                  <span className="text-slate-300">{line}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Python Trivia / Pro-Tips Carousel */}
        <div className="w-full bg-amber-500/5 border border-amber-500/20 rounded-2xl p-3.5 text-left relative overflow-hidden">
          <div className="flex items-center justify-between pb-1 text-amber-400 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <TipIcon className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{activeTip.topic}</span>
            </div>
            <button
              type="button"
              onClick={handleNextTip}
              className="text-[10px] text-amber-400/80 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-full transition cursor-pointer"
              title="Next Python tip"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Next tip</span>
            </button>
          </div>
          
          <p
            className={`text-xs text-slate-300 leading-relaxed font-sans mt-1 transition-opacity duration-200 ${
              tipFading ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {activeTip.text}
          </p>
        </div>

      </div>
    </div>
  );
};
