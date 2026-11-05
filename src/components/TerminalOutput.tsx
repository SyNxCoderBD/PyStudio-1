import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal as TerminalIcon, 
  Trash2, 
  Send, 
  CornerDownLeft, 
  Radio, 
  Sparkles,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Play,
  Loader2,
  Square,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sun,
  Moon,
  ArrowDown,
  X,
  LineChart,
  FileDown,
  FileText,
  FileType
} from 'lucide-react';
import { ExecutionOutput, TerminalEntry } from '../types';
import { parseAnsiToReact } from '../utils/ansi';

const TurtleDrawingImage: React.FC<{ entry: TerminalEntry; onOpen: () => void }> = ({ entry, onOpen }) => {
  const duration = entry.plotAnimationDuration || 900;
  const [isAnimating, setIsAnimating] = useState(() =>
    Boolean(entry.plotAnimationUrl && Date.now() - entry.timestamp < duration)
  );

  useEffect(() => {
    if (!entry.plotAnimationUrl) {
      setIsAnimating(false);
      return;
    }
    const remaining = duration - (Date.now() - entry.timestamp);
    if (remaining <= 0) {
      setIsAnimating(false);
      return;
    }
    setIsAnimating(true);
    const timer = window.setTimeout(() => setIsAnimating(false), remaining);
    return () => window.clearTimeout(timer);
  }, [duration, entry.id, entry.plotAnimationUrl, entry.timestamp]);

  return (
    <img
      src={isAnimating && entry.plotAnimationUrl ? entry.plotAnimationUrl : entry.plotUrl}
      alt={entry.plotTitle || 'Python Turtle drawing'}
      referrerPolicy="no-referrer"
      onClick={onOpen}
      className="max-w-full h-auto object-contain rounded-md cursor-pointer hover:opacity-95 transition-opacity"
      style={{ maxHeight: '380px' }}
    />
  );
};

interface TerminalOutputProps {
  executionOutput: ExecutionOutput | null;
  terminalEntries: TerminalEntry[];
  waitingForInput: boolean;
  inputPrompt: string;
  onClearOutput: () => void;
  onSubmitTerminalInput: (inputText: string) => void;
  currentUserName: string;
  currentUserColor: string;
  isKicked: boolean;
  terminalViewMode: 'split' | 'expanded' | 'collapsed';
  onViewModeChange: (mode: 'split' | 'expanded' | 'collapsed') => void;
  onRunCode?: () => void;
  isRunning?: boolean;
  onForceStop?: () => void;
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({
  executionOutput,
  terminalEntries,
  waitingForInput,
  inputPrompt,
  onClearOutput,
  onSubmitTerminalInput,
  currentUserName,
  currentUserColor,
  isKicked,
  terminalViewMode,
  onViewModeChange,
  onRunCode,
  isRunning = false,
  onForceStop
}) => {
  const [terminalInputValue, setTerminalInputValue] = useState('');
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [plotBgModes, setPlotBgModes] = useState<Record<string, 'dark' | 'light'>>({});
  const [activeZoomPlot, setActiveZoomPlot] = useState<{ url: string; title: string; format: 'png' | 'svg' } | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  const outputEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputFieldRef = useRef<HTMLInputElement>(null);
  let latestTurtleEntryKey: string | null = null;
  terminalEntries.forEach((entry, index) => {
    if (entry.type === 'plot' && entry.plotSource === 'turtle') {
      latestTurtleEntryKey = entry.id || `entry-${index}`;
    }
  });

  // Auto-scroll to bottom whenever new entries, output, or input states arrive
  useEffect(() => {
    if (terminalViewMode !== 'collapsed' && !isScrolledUp) {
      outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalEntries, executionOutput, waitingForInput, terminalViewMode, isScrolledUp]);

  // Track scroll position to show "Scroll to bottom" button on mobile
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setIsScrolledUp(distanceFromBottom > 80);
  };

  const scrollToBottom = () => {
    setIsScrolledUp(false);
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Focus input automatically when Python is waiting for input()
  useEffect(() => {
    if (waitingForInput) {
      if (terminalViewMode === 'collapsed') {
        onViewModeChange('split');
      }
      setTimeout(() => {
        inputFieldRef.current?.focus();
      }, 100);
    }
  }, [waitingForInput]);

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isKicked) return;
    if (!terminalInputValue.trim() && !waitingForInput) return;
    onSubmitTerminalInput(terminalInputValue);
    setTerminalInputValue('');
    setIsScrolledUp(false);
  };

  const handleCopyLogs = () => {
    const lines = terminalEntries.map((e) => {
      if (e.type === 'plot') {
        return `[${e.plotSource === 'turtle' ? 'Turtle Drawing' : 'Matplotlib Plot'}: ${e.plotTitle || 'Figure'}]`;
      }
      if (e.type === 'input_line') {
        const line = `${e.promptText || ''}${e.inputValue || e.text}`;
        return e.sender ? `${line} (inputted by ${e.sender})` : line;
      }
      if (e.type === 'stdin') return `> [Input by ${e.sender || 'User'}]: ${e.text}`;
      if (e.type === 'prompt') return `? ${e.text}`;
      if (e.type === 'stderr') return `[stderr]: ${e.text}`;
      if (e.type === 'system') return `[system]: ${e.text}`;
      return e.text;
    });

    if (executionOutput?.result) {
      lines.push(`[Return Value]: ${executionOutput.result}`);
    }

    const textToCopy = lines.join('\n') || executionOutput?.output || '';
    navigator.clipboard.writeText(textToCopy);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const handleDownloadPlot = (url: string, title?: string, format: 'png' | 'pdf' | 'svg' = 'png') => {
    const link = document.createElement('a');
    link.href = url;
    const cleanTitle = (title || 'matplotlib_plot').toLowerCase().replace(/\s+/g, '_');
    link.download = `${cleanTitle}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadFileEvent = (file: { filename: string; dataBase64?: string; dataUrl?: string; mimeType?: string }) => {
    let downloadUrl = file.dataUrl;
    if (!downloadUrl && file.dataBase64) {
      downloadUrl = `data:${file.mimeType || 'application/octet-stream'};base64,${file.dataBase64}`;
    }
    if (!downloadUrl) return;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const togglePlotBg = (idOrIdx: string) => {
    setPlotBgModes((prev) => ({
      ...prev,
      [idOrIdx]: prev[idOrIdx] === 'light' ? 'dark' : 'light'
    }));
  };

  // If collapsed, show a sleek mini bar at the bottom with quick expand
  if (terminalViewMode === 'collapsed') {
    return (
      <div className="bg-slate-900 border-t border-slate-800 px-3 py-2 flex items-center justify-between text-xs shrink-0 select-none z-20 transition-all duration-200 min-h-[44px]">
        <div 
          onClick={() => onViewModeChange('split')} 
          className="flex items-center space-x-2 cursor-pointer group flex-1 py-1"
        >
          <TerminalIcon className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="font-mono text-slate-300 group-hover:text-amber-300 font-semibold text-xs transition-colors">
            Terminal
          </span>
          {waitingForInput ? (
            <span className="animate-pulse bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
              <Radio className="w-2.5 h-2.5 text-amber-400 animate-ping" />
              Waiting for input()
            </span>
          ) : terminalEntries.some((e) => e.type === 'plot') ? (
            <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
              <LineChart className="w-2.5 h-2.5 text-sky-400" />
              Plot Ready
            </span>
          ) : terminalEntries.length > 0 ? (
            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[150px] xs:max-w-xs hidden xs:inline">
              Latest: {(terminalEntries[terminalEntries.length - 1]?.text || terminalEntries[terminalEntries.length - 1]?.plotTitle || '').substring(0, 30)}
            </span>
          ) : (
            <span className="text-[10px] text-slate-500 font-mono hidden xs:inline">
              (Ready)
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5">
          {onForceStop && (isRunning || waitingForInput) && (
            <button
              onClick={onForceStop}
              title="Force Stop Python execution instance"
              className="bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 transition cursor-pointer animate-pulse min-h-[32px]"
            >
              <Square className="w-3 h-3 fill-current" />
              <span className="hidden xs:inline">Stop</span>
            </button>
          )}
          {onRunCode && (
            <button
              onClick={onRunCode}
              disabled={isRunning}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 transition cursor-pointer min-h-[32px]"
            >
              {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
              <span className="hidden xs:inline">Run</span>
            </button>
          )}
          <button
            onClick={() => onViewModeChange('split')}
            title="Expand Terminal"
            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-md transition cursor-pointer flex items-center gap-1 text-[11px] min-h-[32px]"
          >
            <ChevronUp className="w-4 h-4" />
            <span className="hidden sm:inline">Expand</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-[#08090f] w-full border-t md:border-t-0 md:border-l border-slate-800 overflow-hidden relative transition-all duration-200 ${
      terminalViewMode === 'expanded' 
        ? 'flex-1 h-full min-h-0' 
        : 'h-[48dvh] md:h-full md:flex-1 min-h-[160px]'
    }`}>
      
      {/* Terminal Toolbar Header */}
      <div className="neu-inset px-2.5 sm:px-3 py-1.5 border-b border-slate-800 flex justify-between items-center text-xs shrink-0 select-none z-10 min-h-[38px]">
        
        {/* Title & Live Status */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-200 font-semibold text-xs flex items-center gap-1.5 font-mono">
            <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Terminal</span>
          </span>

          {waitingForInput && (
            <span className="animate-pulse bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 font-mono">
              <Radio className="w-2.5 h-2.5 text-amber-400 animate-ping" />
              <span>input() active</span>
            </span>
          )}
        </div>

        {/* Expand / Retract / Clear / Copy / Force Stop Toolbar Actions */}
        <div className="flex items-center space-x-1 sm:space-x-1.5">
          
          {/* Force Stop Button */}
          {onForceStop && (
            <button
              onClick={onForceStop}
              title="Force Stop Python execution / cancel active input"
              className={`p-1 sm:px-2 sm:py-0.5 text-[11px] font-semibold rounded transition flex items-center gap-1 cursor-pointer min-h-[28px] ${
                isRunning || waitingForInput
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-900/50 animate-pulse'
                  : 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/30'
              }`}
            >
              <Square className="w-3 h-3 fill-current" />
              <span className="hidden sm:inline">Force Stop</span>
            </button>
          )}

          {/* Copy Logs */}
          <button
            onClick={handleCopyLogs}
            title="Copy Terminal Logs"
            className="text-slate-400 hover:text-slate-200 p-1 sm:px-1.5 sm:py-0.5 text-[11px] rounded hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer min-h-[28px]"
          >
            {copiedLogs ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span className="hidden md:inline">Copy</span>
          </button>

          {/* Clear Logs */}
          <button
            onClick={onClearOutput}
            title="Clear terminal logs"
            className="text-slate-400 hover:text-slate-200 p-1 sm:px-1.5 sm:py-0.5 text-[11px] rounded hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer min-h-[28px]"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden md:inline">Clear</span>
          </button>

          {/* View Expand / Split / Retract Controls */}
          {terminalViewMode === 'expanded' ? (
            <button
              onClick={() => onViewModeChange('split')}
              title="Restore to Split View"
              className="text-amber-400 hover:text-amber-300 p-1 sm:px-1.5 sm:py-0.5 text-[11px] rounded hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer min-h-[28px]"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split</span>
            </button>
          ) : (
            <button
              onClick={() => onViewModeChange('expanded')}
              title="Expand Terminal to Full Height"
              className="text-slate-400 hover:text-amber-400 p-1 sm:px-1.5 sm:py-0.5 text-[11px] rounded hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer min-h-[28px]"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Expand</span>
            </button>
          )}

          {/* Retract / Minimize Button */}
          <button
            onClick={() => onViewModeChange('collapsed')}
            title="Retract / Minimize Terminal"
            className="text-slate-400 hover:text-rose-400 p-1 sm:px-1.5 sm:py-0.5 text-[11px] rounded hover:bg-slate-800 transition flex items-center gap-0.5 cursor-pointer min-h-[28px]"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Retract</span>
          </button>
        </div>

      </div>

      {/* Terminal Scrollable Logs (Synced for all users in real-time with touch-friendly scrolling) */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
        className="flex-1 p-2.5 sm:p-3.5 code-font text-xs sm:text-sm text-slate-200 overflow-y-auto overflow-x-auto whitespace-pre-wrap break-words font-mono leading-relaxed bg-[#08090f] select-text w-full min-h-0"
      >
        {terminalEntries.length === 0 && !executionOutput?.output && !waitingForInput ? (
          <div className="text-slate-500 text-xs py-3 space-y-2 select-none">
            <p className="italic text-slate-400">
              Interactive terminal ready. Output from <code className="text-amber-300">print()</code>, plots from <code className="text-sky-300">matplotlib.pyplot</code>, and prompts from <code className="text-amber-400 font-semibold">input()</code> appear here live for everyone in this room.
            </p>
            <div className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-lg text-[11px] text-slate-400 max-w-lg space-y-1">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Collaborative Features:
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-400">
                <li>Run Python code with <code className="text-emerald-400">print()</code>, <code className="text-amber-300">input()</code>, and <code className="text-sky-300">matplotlib</code>.</li>
                <li>Plots render with high-DPI resolution, zoom preview, light/dark canvas modes, and PNG downloads.</li>
                <li>All output logs are synchronized across all connected devices in real time.</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-2 w-full">
            {/* Render Log Entries in chronological order */}
            {terminalEntries.map((entry, idx) => {
              const entryKey = entry.id || `entry-${idx}`;
              if (entry.type === 'plot' && entry.plotSource === 'turtle' && entryKey !== latestTurtleEntryKey) {
                return null;
              }

              // Matplotlib Plot Card
              if (entry.type === 'plot' && entry.plotUrl) {
                const isLight = plotBgModes[entryKey] === 'light';
                const isTurtleDrawing = entry.plotSource === 'turtle';
                const imageFormat = entry.plotFormat || 'png';
                return (
                  <div 
                    key={entryKey} 
                    className="my-3 bg-slate-900/90 border border-slate-700/80 rounded-xl overflow-hidden shadow-lg transition-all"
                  >
                    {/* Plot Card Header */}
                    <div className="bg-slate-800/90 px-3 py-2 border-b border-slate-700/70 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 font-mono">
                          <LineChart className="w-3 h-3 text-sky-400" />
                          {isTurtleDrawing ? 'Python Turtle' : 'Matplotlib'}
                        </span>
                        <span className="text-slate-200 font-medium text-xs truncate max-w-[140px] xs:max-w-xs font-mono">
                          {entry.plotTitle || 'Figure'}
                        </span>
                      </div>

                      {/* Plot Actions Toolbar */}
                      <div className="flex items-center gap-1.5">
                        {/* Toggle Canvas Theme */}
                        {!isTurtleDrawing && <button
                          type="button"
                          onClick={() => togglePlotBg(entryKey)}
                          title={isLight ? "Switch to dark canvas" : "Switch to crisp white paper canvas"}
                          className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-700 rounded-md transition cursor-pointer"
                        >
                          {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                        </button>}

                        {/* Fullscreen / Zoom Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveZoomPlot({ url: entry.plotUrl!, title: entry.plotTitle || 'Matplotlib Figure', format: imageFormat });
                            setZoomScale(1);
                          }}
                          title="Open fullscreen zoom view"
                          className="p-1.5 text-slate-400 hover:text-sky-300 hover:bg-slate-700 rounded-md transition cursor-pointer"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>

                        {/* Download PNG Button */}
                        <button
                          type="button"
                          onClick={() => handleDownloadPlot(entry.plotUrl!, entry.plotTitle, imageFormat)}
                          title={`Download ${isTurtleDrawing ? 'vector SVG drawing' : 'high-resolution plot PNG'}`}
                          className="px-2 py-1 bg-slate-700/80 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-md text-[11px] font-mono flex items-center gap-1 transition cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>{imageFormat.toUpperCase()}</span>
                        </button>

                        {/* Download PDF Button */}
                        {entry.plotPdfUrl && (
                          <button
                            type="button"
                            onClick={() => handleDownloadPlot(entry.plotPdfUrl!, entry.plotTitle, 'pdf')}
                            title="Download vector graphic PDF document"
                            className="px-2 py-1 bg-slate-700/80 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-md text-[11px] font-mono flex items-center gap-1 transition cursor-pointer"
                          >
                            <FileType className="w-3 h-3 text-rose-400" />
                            <span>PDF</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Plot Image Container (Scrollable on small screens) */}
                    <div 
                      className={`p-2.5 sm:p-4 flex items-center justify-center overflow-x-auto transition-colors ${
                        isLight ? 'bg-white' : 'bg-slate-950/80'
                      }`}
                      style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                      {isTurtleDrawing ? (
                        <TurtleDrawingImage
                          entry={entry}
                          onOpen={() => {
                            setActiveZoomPlot({ url: entry.plotUrl!, title: entry.plotTitle || 'Python Turtle Drawing', format: imageFormat });
                            setZoomScale(1);
                          }}
                        />
                      ) : (
                        <img
                          src={entry.plotUrl}
                          alt={entry.plotTitle || 'Matplotlib Plot'}
                          referrerPolicy="no-referrer"
                          onClick={() => {
                            setActiveZoomPlot({ url: entry.plotUrl!, title: entry.plotTitle || 'Matplotlib Figure', format: imageFormat });
                            setZoomScale(1);
                          }}
                          className="max-w-full h-auto object-contain rounded-md cursor-pointer hover:opacity-95 transition-opacity"
                          style={{ maxHeight: '380px' }}
                        />
                      )}
                    </div>
                  </div>
                );
              }

              // Generated File Download Card (e.g. download_file, txt, csv, etc.)
              if (entry.type === 'download' && entry.fileDownload) {
                const file = entry.fileDownload;
                const sizeKb = (file.fileSize / 1024).toFixed(1);
                return (
                  <div 
                    key={entryKey} 
                    className="my-3 bg-slate-900/90 border border-emerald-500/30 rounded-xl overflow-hidden shadow-lg"
                  >
                    <div className="bg-slate-800/90 px-3.5 py-2.5 border-b border-slate-700/70 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-slate-100 font-mono font-semibold text-xs truncate">
                            {file.filename}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {sizeKb} KB • Generated by <span className="text-amber-300 font-semibold">{file.triggeredBy || 'Script'}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDownloadFileEvent(file)}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg text-xs font-mono flex items-center gap-1.5 shadow-sm hover:shadow transition cursor-pointer ml-auto"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>

                    {file.previewText && (
                      <div className="p-3 bg-slate-950/70 text-[11px] font-mono text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap select-text border-t border-slate-800/50">
                        {file.previewText}
                        {file.fileSize > 1200 && (
                          <span className="text-slate-500 italic block mt-1">... [truncated preview]</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              if (entry.type === 'input_line') {
                const promptStr = entry.promptText !== undefined ? entry.promptText : '';
                const inputVal = entry.inputValue !== undefined ? entry.inputValue : entry.text;
                return (
                  <div key={entryKey} className="my-1">
                    <div className="text-slate-100 flex flex-wrap items-baseline gap-1 break-words font-mono">
                      {promptStr && (
                        <span className="text-sky-300 font-semibold">{parseAnsiToReact(promptStr)}</span>
                      )}
                      <span className="font-bold text-amber-300">
                        {inputVal}
                      </span>
                    </div>
                    {entry.sender && (
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5 pl-2 select-none">
                        <span className="text-slate-600">↳</span>
                        <span>inputted by</span>
                        <span style={{ color: entry.senderColor || '#f59e0b' }} className="font-semibold">
                          {entry.sender}
                        </span>
                      </div>
                    )}
                  </div>
                );
              }

              if (entry.type === 'stdin') {
                return (
                  <div key={entryKey} className="text-amber-300 bg-amber-950/30 border-l-2 border-amber-500 pl-2 py-0.5 my-1 rounded-r flex flex-wrap items-baseline gap-1.5 font-mono">
                    <span className="text-slate-500 text-[10px]">
                      &gt; [Input by <span style={{ color: entry.senderColor || '#f59e0b' }} className="font-semibold">{entry.sender || 'User'}</span>]:
                    </span>
                    <span className="font-bold text-amber-200 break-all">{entry.text}</span>
                  </div>
                );
              }

              if (entry.type === 'stderr') {
                return (
                  <div key={entryKey} className="my-2 bg-[#130d12] border border-rose-500/40 border-l-4 border-l-rose-500 rounded-lg p-2.5 sm:p-3 text-slate-100 font-mono shadow-md text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap break-words overflow-x-auto">
                    {parseAnsiToReact(entry.text)}
                  </div>
                );
              }

              if (entry.type === 'prompt') {
                return (
                  <div key={entryKey} className="text-sky-300 font-bold bg-sky-950/20 border-l-2 border-sky-500 pl-2 py-0.5 rounded-r font-mono">
                    {parseAnsiToReact(entry.text)}
                  </div>
                );
              }

              if (entry.type === 'system') {
                return (
                  <div key={entryKey} className="text-slate-500 text-[11px] italic border-b border-slate-800/40 pb-0.5 font-mono">
                    {entry.text}
                  </div>
                );
              }

              return (
                <div key={entryKey} className="text-slate-200 break-words leading-relaxed font-mono">
                  {parseAnsiToReact(entry.text)}
                </div>
              );
            })}

            {/* Fallback execution output if terminalEntries is empty */}
            {terminalEntries.length === 0 && executionOutput?.output && (
              <div className={executionOutput.isError ? 'my-2 bg-[#130d12] border border-rose-500/40 border-l-4 border-l-rose-500 rounded-lg p-2.5 sm:p-3 text-slate-100 font-mono shadow-md text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap break-words overflow-x-auto' : 'text-slate-200 font-mono whitespace-pre-wrap break-words'}>
                {parseAnsiToReact(executionOutput.output)}
              </div>
            )}

            {/* Result display */}
            {executionOutput?.result && (
              <div className="text-amber-400 font-bold border-t border-slate-800 pt-1.5 mt-2 flex flex-wrap items-center gap-2">
                <span className="text-slate-500 text-[10px] uppercase font-mono tracking-wider">[Return Value]:</span>
                <span className="text-amber-300">{parseAnsiToReact(executionOutput.result)}</span>
              </div>
            )}

            {/* Live Interactive Input Request Banner */}
            {waitingForInput && (
              <div className="mt-3 p-2.5 bg-amber-500/15 border border-amber-500/40 rounded-lg text-amber-200 space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    Python is waiting for input():
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-amber-400/80 font-normal hidden sm:inline">
                      (Any peer can answer)
                    </span>
                    {onForceStop && (
                      <button
                        type="button"
                        onClick={onForceStop}
                        className="text-[10px] bg-rose-600/80 hover:bg-rose-600 text-white px-2 py-0.5 rounded font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Square className="w-2.5 h-2.5 fill-current" /> Stop
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-xs sm:text-sm font-bold text-white bg-slate-900/90 px-2.5 py-1.5 rounded border border-amber-500/30 font-mono break-all flex items-center">
                  <span className="text-sky-300">{parseAnsiToReact(inputPrompt || "input()")}</span>
                  <span className="inline-block w-2 h-4 bg-amber-400 ml-1.5 animate-pulse shrink-0"></span>
                </div>
              </div>
            )}
            
            <div ref={outputEndRef} className="h-2" />
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom Button for Mobile & Desktop */}
      {isScrolledUp && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-16 right-4 z-20 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1.5 rounded-full shadow-lg text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          <span>Latest output</span>
        </button>
      )}

      {/* Interactive Terminal Input Bar */}
      <form
        onSubmit={handleInputSubmit}
        className={`p-1.5 sm:p-2 bg-slate-950 border-t border-slate-800 flex items-center gap-1.5 sm:gap-2 transition-colors duration-200 shrink-0 min-h-[44px] ${
          waitingForInput ? 'bg-amber-950/25 border-amber-500/50' : ''
        }`}
      >
        <div className="flex items-center pl-1 sm:pl-2 text-slate-500 font-mono text-xs select-none shrink-0">
          {waitingForInput ? (
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <span className="text-xs">&gt;</span>
              <span className="hidden xs:inline">input:</span>
            </span>
          ) : (
            <span className="text-emerald-400 font-bold text-xs">&gt;</span>
          )}
        </div>
        <input
          ref={inputFieldRef}
          type="text"
          value={terminalInputValue}
          onChange={(e) => setTerminalInputValue(e.target.value)}
          placeholder={
            waitingForInput
              ? `Answer: "${String(inputPrompt || 'input()').substring(0, 25)}..."`
              : "Type terminal input or response..."
          }
          autoComplete="off"
          disabled={isKicked}
          className={`flex-1 bg-slate-900 border rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none transition-all placeholder:text-slate-600 min-h-[36px] ${
            waitingForInput
              ? 'border-amber-500 text-amber-200 bg-slate-900/90 shadow-sm shadow-amber-500/20 ring-1 ring-amber-500/30'
              : 'border-slate-700 focus:border-amber-500 text-slate-200'
          }`}
        />
        <button
          type="submit"
          disabled={isKicked}
          title="Send Input to Terminal (Enter)"
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer shadow shrink-0 min-h-[36px] ${
            waitingForInput
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30 animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Send</span>
          <CornerDownLeft className="w-3 h-3 opacity-60 hidden sm:inline" />
        </button>
      </form>

      {/* Full-Screen Matplotlib Plot Zoom Modal */}
      {activeZoomPlot && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-between p-3 sm:p-6 animate-in fade-in">
          {/* Modal Header */}
          <div className="w-full max-w-4xl flex items-center justify-between py-2 text-white border-b border-slate-800">
            <div className="flex items-center gap-2 font-mono text-sm font-semibold text-slate-200 truncate">
              <LineChart className="w-4 h-4 text-sky-400" />
              <span>{activeZoomPlot.title}</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Zoom In / Out Controls */}
              <button
                type="button"
                onClick={() => setZoomScale((s) => Math.min(3, s + 0.25))}
                title="Zoom In"
                className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale((s) => Math.max(0.5, s - 0.25))}
                title="Zoom Out"
                className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(1)}
                title="Reset Zoom"
                className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Download PNG */}
              <button
                type="button"
                onClick={() => handleDownloadPlot(activeZoomPlot.url, activeZoomPlot.title, activeZoomPlot.format)}
                title={`Download ${activeZoomPlot.format.toUpperCase()}`}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Save {activeZoomPlot.format.toUpperCase()}</span>
              </button>

              {/* Close Modal */}
              <button
                type="button"
                onClick={() => setActiveZoomPlot(null)}
                title="Close"
                className="p-1.5 sm:p-2 bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white rounded-md transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Main Stage */}
          <div 
            className="flex-1 w-full max-w-5xl flex items-center justify-center overflow-auto p-2 sm:p-4"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <img 
              src={activeZoomPlot.url} 
              alt={activeZoomPlot.title}
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full object-contain rounded-lg transition-transform duration-150 shadow-2xl bg-white"
              style={{ transform: `scale(${zoomScale})` }}
            />
          </div>

          {/* Modal Footer Note */}
          <div className="text-[11px] text-slate-400 font-mono py-1 select-none text-center">
            Scale: {Math.round(zoomScale * 100)}% • High-resolution Matplotlib export
          </div>
        </div>
      )}

    </div>
  );
};

