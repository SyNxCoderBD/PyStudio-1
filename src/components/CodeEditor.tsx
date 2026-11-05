import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { 
  FileCode, 
  Cloud, 
  RotateCcw, 
  RotateCw, 
  RefreshCw, 
  AlertCircle, 
  Check, 
  AlertTriangle,
  XCircle,
  Sparkles
} from 'lucide-react';
import { UserPresence, SyntaxErrorInfo } from '../types';
import { PYTHON_KEYWORDS, PYTHON_BUILTINS } from '../constants/python';
import { highlightPythonCode, getErrorCharRange, SelectionRange } from '../utils/syntaxHighlight';
import { getRuntimeModuleAutocomplete, validatePythonSyntax } from '../services/pyodide';
import { 
  getPythonAutocomplete, 
  getRuntimeModuleCompletionContext,
  AutocompleteItem, 
  AutocompleteResult 
} from '../utils/pythonAutocomplete';
import { AutocompletePopup } from './AutocompletePopup';
import { transformSelectionRange } from '../utils/collaborativeSync';

interface CodeEditorProps {
  code: string;
  onCodeChange: (newCode: string) => void;
  syncStatus: 'synced' | 'syncing' | 'offline';
  collaborators: Record<string, UserPresence>;
  currentUserId: string;
  onCursorMove: (selection: SelectionRange) => void;
  onRunCode: () => void;
  isKicked: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code: rawCode,
  onCodeChange,
  syncStatus,
  collaborators,
  currentUserId,
  onCursorMove,
  onRunCode,
  isKicked
}) => {
  const code = typeof rawCode === 'string' ? rawCode : '';
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightLayerRef = useRef<HTMLPreElement>(null);
  const highlightContentRef = useRef<HTMLElement>(null);
  const cursorLayerRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const prevCodeRef = useRef<string>(code);
  const lastKnownSelectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const isApplyingRemoteUpdateRef = useRef<boolean>(false);
  const autocompleteRequestRef = useRef(0);

  const [editorSelection, setEditorSelection] = useState<SelectionRange>({ start: 0, end: 0 });
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const isUndoRedoRef = useRef(false);

  // Syntax error state from Python interpreter AST
  const [syntaxError, setSyntaxError] = useState<SyntaxErrorInfo | null>(null);
  const [isHoveringError, setIsHoveringError] = useState(false);
  const [isEditorFocused, setIsEditorFocused] = useState(false);

  // Autocomplete states
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<AutocompleteItem[]>([]);
  const [activeAutoResult, setActiveAutoResult] = useState<AutocompleteResult | null>(null);
  const [selectedAutoIndex, setSelectedAutoIndex] = useState(0);
  const [autoBoxPos, setAutoBoxPos] = useState<{ top: number; left: number } | null>(null);
  const [isAutoMinimized, setIsAutoMinimized] = useState<boolean>(() => {
    try {
      return localStorage.getItem('python_autocomplete_minimized') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleMinimize = (min: boolean) => {
    setIsAutoMinimized(min);
    try {
      localStorage.setItem('python_autocomplete_minimized', String(min));
    } catch {
      // ignore
    }
  };

  const closeAutocomplete = () => {
    autocompleteRequestRef.current += 1;
    setAutoBoxPos(null);
    setAutocompleteSuggestions([]);
    setActiveAutoResult(null);
  };

  // Close autocomplete on click outside editor / popup
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      if (!target.closest('#python-autocomplete-popup') && target !== textareaRef.current) {
        closeAutocomplete();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  // Character width cache for cursor calculation
  const charWidth = 7.808; // 13px Fira Code metric
  const lineHeight = 22;

  // Real-time debounced Python syntax validation
  useEffect(() => {
    let isCurrent = true;
    const timeoutId = setTimeout(async () => {
      try {
        const error = await validatePythonSyntax(code);
        if (isCurrent) {
          setSyntaxError(error);
        }
      } catch (err) {
        if (isCurrent) {
          setSyntaxError(null);
        }
      }
    }, 160);

    return () => {
      isCurrent = false;
      clearTimeout(timeoutId);
    };
  }, [code]);

  // Render line numbers
  const lineCount = useMemo(() => {
    return Math.max(1, code.split('\n').length);
  }, [code]);

  const remoteSelections = useMemo(() =>
    (Object.values(collaborators) as UserPresence[])
      .filter((user) => user.id !== currentUserId && user.cursor)
      .map((user) => ({
        start: Math.max(0, Math.min(user.cursor!.selectionStart ?? user.cursor!.pos, code.length)),
        end: Math.max(0, Math.min(user.cursor!.selectionEnd ?? user.cursor!.pos, code.length)),
        color: user.color
      }))
      .filter((selection) => selection.end > selection.start),
    [collaborators, currentUserId, code.length]
  );

  const highlightedCode = useMemo(
    () => highlightPythonCode(code + (code.endsWith('\n') ? ' ' : ''), syntaxError, editorSelection, remoteSelections),
    [code, syntaxError, editorSelection, remoteSelections]
  );

  // Real-time cursor preservation across remote collaborator updates
  useLayoutEffect(() => {
    if (code === prevCodeRef.current) return;
    const oldCode = prevCodeRef.current;
    const currentSel = lastKnownSelectionRef.current;

    isApplyingRemoteUpdateRef.current = true;

    // Calculate mathematically exact transformed selection based on remote diff
    const newSelection = transformSelectionRange(oldCode, code, currentSel);
    prevCodeRef.current = code;
    lastKnownSelectionRef.current = newSelection;
    setEditorSelection(newSelection);

    // Synchronously restore cursor in DOM textarea before next paint/input
    if (textareaRef.current) {
      try {
        textareaRef.current.setSelectionRange(newSelection.start, newSelection.end);
      } catch {
        // ignore
      }
    }

    // Update status bar Ln / Col metric
    const textBefore = code.substring(0, newSelection.start);
    const lines = textBefore.split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    setCursorPos({ line, col });

    // Release flag on next macrotask so any browser select events fired by DOM value assignment are ignored
    const timer = setTimeout(() => {
      isApplyingRemoteUpdateRef.current = false;
    }, 40);

    return () => {
      clearTimeout(timer);
    };
  }, [code]);

  // Jump cursor to syntax error location
  const handleJumpToError = () => {
    if (!syntaxError || !textareaRef.current) return;
    const lines = code.split('\n');
    let targetPos = 0;
    for (let i = 0; i < syntaxError.line - 1 && i < lines.length; i++) {
      targetPos += lines[i].length + 1;
    }
    targetPos += Math.max(0, Math.min((lines[syntaxError.line - 1] || '').length, (syntaxError.column || 1) - 1));
    
    textareaRef.current.setSelectionRange(targetPos, targetPos);
    textareaRef.current.focus();
    lastKnownSelectionRef.current = { start: targetPos, end: targetPos };
    updateCursorTracking({ start: targetPos, end: targetPos });
  };

  // Synchronize scrolling across layers
  const handleScroll = () => {
    if (!textareaRef.current) return;
    const { scrollTop, scrollLeft } = textareaRef.current;
    if (highlightLayerRef.current) {
      highlightLayerRef.current.scrollTop = scrollTop;
      highlightLayerRef.current.scrollLeft = scrollLeft;
    }
    if (cursorLayerRef.current) {
      cursorLayerRef.current.scrollTop = scrollTop;
      cursorLayerRef.current.scrollLeft = scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop;
    }
    setAutoBoxPos(null);
  };

  const updateCursorTracking = (overridePos?: { start: number; end: number }) => {
    if (isApplyingRemoteUpdateRef.current) return;
    if (!textareaRef.current) return;
    const start = overridePos ? overridePos.start : (textareaRef.current.selectionStart ?? 0);
    const end = overridePos ? overridePos.end : (textareaRef.current.selectionEnd ?? 0);
    lastKnownSelectionRef.current = { start, end };
    setEditorSelection((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));

    const textBefore = code.substring(0, start);
    const lines = textBefore.split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    setCursorPos({ line, col });
    onCursorMove({ start, end });
  };

  const triggerUndo = () => {
    if (undoStack.length === 0 || isKicked) return;
    isUndoRedoRef.current = true;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, code]);
    setUndoStack((u) => u.slice(0, -1));
    onCodeChange(prev);
    isUndoRedoRef.current = false;
  };

  const triggerRedo = () => {
    if (redoStack.length === 0 || isKicked) return;
    isUndoRedoRef.current = true;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, code]);
    setRedoStack((r) => r.slice(0, -1));
    onCodeChange(next);
    isUndoRedoRef.current = false;
  };

  // Autocomplete Trigger
  const showAutocomplete = (currentText: string, selPos: number, result: AutocompleteResult) => {
    setAutocompleteSuggestions(result.suggestions);
    setActiveAutoResult(result);
    setSelectedAutoIndex(0);

    const textBefore = currentText.substring(0, selPos);
    const lines = textBefore.split('\n');
    const lineIndex = lines.length - 1;
    const colIndex = lines[lines.length - 1].length;

    const scrollTop = textareaRef.current?.scrollTop || 0;
    const scrollLeft = textareaRef.current?.scrollLeft || 0;

    // Exact vertical metrics
    const lineTop = lineIndex * lineHeight + 8 - scrollTop;
    const lineBottom = (lineIndex + 1) * lineHeight + 8 - scrollTop;

    const containerHeight = textareaRef.current?.clientHeight || 400;
    const containerWidth = textareaRef.current?.clientWidth || 500;

    // Clearance buffer below the active text line so line text, caret, and descenders are totally unobstructed
    const belowClearance = 8;
    const estimatedPopupHeight = 180;
    let top = lineBottom + belowClearance;

    // If placing below would overflow the visible editor bottom, and there is space above the current line
    if (top + estimatedPopupHeight > containerHeight && lineTop - estimatedPopupHeight - belowClearance >= 4) {
      // Flip above the active line
      top = Math.max(4, lineTop - estimatedPopupHeight - belowClearance);
    } else {
      // Otherwise keep it below, guaranteeing it NEVER overlaps the active line
      top = Math.max(lineBottom + belowClearance, top);
    }

    // Horizontal positioning aligned to cursor column with bounds clamping
    const popupWidth = Math.min(280, containerWidth - 16);
    let left = colIndex * charWidth + 12 - scrollLeft;
    left = Math.max(8, Math.min(left, containerWidth - popupWidth - 8));

    setAutoBoxPos({ top, left });
  };

  const checkAutocomplete = (currentText: string, selPos: number) => {
    const requestId = ++autocompleteRequestRef.current;
    const staticResult = getPythonAutocomplete(currentText, selPos);
    const context = getRuntimeModuleCompletionContext(currentText, selPos);

    if (staticResult && staticResult.suggestions.length > 0) {
      showAutocomplete(currentText, selPos, staticResult);
    } else {
      setAutoBoxPos(null);
      setAutocompleteSuggestions([]);
      setActiveAutoResult(null);
    }

    if (!context) return;

    window.setTimeout(() => {
      if (requestId !== autocompleteRequestRef.current) return;
      const runtimeSuggestions = getRuntimeModuleAutocomplete(context.modulePath, context.memberPrefix);
      if (requestId !== autocompleteRequestRef.current || !runtimeSuggestions?.length) return;

      const baseResult = staticResult || {
        suggestions: [],
        replaceStart: context.replaceStart,
        replaceLength: context.replaceLength,
        triggerContext: 'dot' as const
      };
      const seen = new Set<string>();
      const suggestions = [...runtimeSuggestions, ...(staticResult?.suggestions || [])].filter((item) => {
        const key = item.label.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      showAutocomplete(currentText, selPos, { ...baseResult, suggestions });
    }, 0);
  };

  const applyAutocomplete = (itemToApply: AutocompleteItem) => {
    if (!textareaRef.current || !activeAutoResult) return;
    const { replaceStart, replaceLength } = activeAutoResult;

    const newCode =
      code.substring(0, replaceStart) +
      itemToApply.insertText +
      code.substring(replaceStart + replaceLength);

    const newPos = replaceStart + itemToApply.insertText.length;
    prevCodeRef.current = newCode;
    lastKnownSelectionRef.current = { start: newPos, end: newPos };
    onCodeChange(newCode);

    if (textareaRef.current) {
      textareaRef.current.setSelectionRange(newPos, newPos);
      textareaRef.current.focus();
      updateCursorTracking();
    }

    setAutoBoxPos(null);
    setAutocompleteSuggestions([]);
    setActiveAutoResult(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isKicked) return;
    const start = e.currentTarget.selectionStart;
    const end = e.currentTarget.selectionEnd;

    // Undo / Redo Shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        triggerRedo();
      } else {
        triggerUndo();
      }
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      triggerRedo();
      return;
    }

    // Run code shortcut
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onRunCode();
      return;
    }

    // Dismiss autocomplete when navigating cursor horizontally or jumping
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
      closeAutocomplete();
      requestAnimationFrame(() => updateCursorTracking());
    }

    // Autocomplete Navigation
    if (autoBoxPos && autocompleteSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedAutoIndex((prev) => (prev + 1) % autocompleteSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedAutoIndex(
          (prev) => (prev - 1 + autocompleteSuggestions.length) % autocompleteSuggestions.length
        );
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applyAutocomplete(autocompleteSuggestions[selectedAutoIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeAutocomplete();
        return;
      }
    }

    // Record undo on delimiter
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'Tab') {
      if (!isUndoRedoRef.current) {
        setUndoStack((u) => [...u.slice(-30), code]);
        setRedoStack([]);
      }
    }

    // Tab key indent (4 spaces)
    if (e.key === 'Tab') {
      e.preventDefault();
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      const newPos = start + 4;
      prevCodeRef.current = newCode;
      lastKnownSelectionRef.current = { start: newPos, end: newPos };
      onCodeChange(newCode);
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(newPos, newPos);
        updateCursorTracking();
      }
      return;
    }

    // Enter key auto indent
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentLine = code.substring(0, start).split('\n').pop() || '';
      const matchIndent = currentLine.match(/^(\s*)/);
      let indent = matchIndent ? matchIndent[1] : '';

      if (currentLine.trim().endsWith(':')) {
        indent += '    ';
      }

      const newCode = code.substring(0, start) + '\n' + indent + code.substring(end);
      const newPos = start + 1 + indent.length;
      prevCodeRef.current = newCode;
      lastKnownSelectionRef.current = { start: newPos, end: newPos };
      onCodeChange(newCode);

      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(newPos, newPos);
        updateCursorTracking();
      }
      setAutoBoxPos(null);
      return;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isKicked) return;
    const newCode = e.target.value;
    const start = e.target.selectionStart || 0;
    const end = e.target.selectionEnd || 0;
    prevCodeRef.current = newCode;
    lastKnownSelectionRef.current = { start, end };
    onCodeChange(newCode);
    updateCursorTracking({ start, end });
    checkAutocomplete(newCode, start);
  };

  return (
    <div className="flex flex-col h-full w-full border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950 min-h-0 flex-1 relative select-none overflow-hidden">
      {/* Code Tab & Action Toolbar */}
      <div className="hidden lg:flex h-9 bg-[#0c1017] border-b border-slate-800 items-stretch shrink-0 select-none">
        <div className="px-3 flex items-center gap-2 text-[10px] font-mono text-slate-500 border-r border-slate-800/80">
          <span>WORKSPACE</span>
          <span className="text-slate-700">/</span>
          <span className="text-slate-400">PYTHON</span>
        </div>
        <div className="px-4 flex items-center gap-2 bg-[#0f111a] border-r border-slate-800 border-t-2 border-t-amber-400 text-slate-200 text-xs">
          <FileCode className="w-3.5 h-3.5 text-sky-300" />
          <span className="font-mono">main.py</span>
        </div>
        <div className="ml-auto flex items-center gap-2 px-2.5 border-l border-slate-800/80">
          <span
            className={`flex items-center gap-1.5 text-[10px] font-mono ${
              syncStatus === 'offline' ? 'text-rose-400' : syncStatus === 'syncing' ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {syncStatus === 'syncing' ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : syncStatus === 'offline' ? (
              <AlertTriangle className="w-3 h-3" />
            ) : (
              <Cloud className="w-3 h-3" />
            )}
            {syncStatus === 'syncing' ? 'SYNCING' : syncStatus === 'offline' ? 'OFFLINE' : 'SAVED'}
          </span>
          <span className="h-4 w-px bg-slate-800 mx-1" />
          <button
            onClick={triggerUndo}
            disabled={undoStack.length === 0}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 rounded transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={triggerRedo}
            disabled={redoStack.length === 0}
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 rounded transition cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="lg:hidden bg-slate-900/90 px-3 py-1.5 border-b border-slate-800 flex justify-between items-center text-xs shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="text-slate-300 font-mono flex items-center gap-1.5 font-medium">
            <FileCode className="w-3.5 h-3.5 text-sky-300" /> main.py
          </span>
          <span className={`text-[10px] ${syncStatus === 'offline' ? 'text-rose-400' : syncStatus === 'syncing' ? 'text-amber-400' : 'text-emerald-400'}`}>
            {syncStatus === 'syncing' ? 'Syncing' : syncStatus === 'offline' ? 'Offline' : 'Saved'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={triggerUndo} disabled={undoStack.length === 0} title="Undo (Ctrl+Z)" aria-label="Undo" className="w-8 h-8 flex items-center justify-center text-slate-300 disabled:opacity-30">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={triggerRedo} disabled={redoStack.length === 0} title="Redo (Ctrl+Y)" aria-label="Redo" className="w-8 h-8 flex items-center justify-center text-slate-300 disabled:opacity-30">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor & Line Numbers Area */}
      <div className="flex-1 flex relative overflow-hidden bg-[#0f111a]">
        {/* Line Numbers Column */}
        <div
          ref={lineNumbersRef}
          className="w-9 md:w-11 bg-[#0a0c12] py-2 text-right pr-2 select-none text-slate-600 code-font text-[13px] leading-[22px] border-r border-slate-800/50 overflow-hidden shrink-0"
        >
          {Array.from({ length: lineCount }).map((_, i) => {
            const lineNum = i + 1;
            const isErrorLine = syntaxError && syntaxError.line === lineNum;
            return (
              <div 
                key={i} 
                className={`relative flex items-center justify-end gap-1 font-mono transition-colors ${
                  isErrorLine ? 'text-rose-400 font-bold error-gutter-marker cursor-pointer' : ''
                }`}
                title={isErrorLine ? `${syntaxError.errorType}: ${syntaxError.message}` : undefined}
                onClick={isErrorLine ? handleJumpToError : undefined}
              >
                {isErrorLine && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                )}
                <span>{lineNum}</span>
              </div>
            );
          })}
        </div>

        {/* Multi-Layer Editor Canvas */}
        <div className="flex-1 editor-container relative">
          {/* Syntax Highlight Layer with Red Squiggly Underlines */}
          <pre ref={highlightLayerRef} id="highlight-layer" className="editor-layer select-none">
            <code
              ref={highlightContentRef}
              id="highlight-content"
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          </pre>

          {/* Remote Collaborator Cursors Layer */}
          <div ref={cursorLayerRef} id="cursor-layer" className="editor-layer">
            {isEditorFocused && (
              <div
                aria-hidden="true"
                className="active-line-highlight"
                style={{ transform: `translate3d(0, ${(cursorPos.line - 1) * lineHeight}px, 0)` }}
              />
            )}
            {isEditorFocused && (
              <div
                aria-hidden="true"
                className="local-cursor"
                style={{
                  transform: `translate3d(${(cursorPos.col - 1) * charWidth}px, ${(cursorPos.line - 1) * lineHeight}px, 0)`
                }}
              />
            )}
            {(Object.values(collaborators) as UserPresence[]).map((user) => {
              if (user.id === currentUserId || !user.cursor) return null;
              const isStale = Date.now() - (user.cursor.updatedAt || 0) > 20000;
              if (isStale) return null;

              const textBeforeCursor = code.substring(0, user.cursor.pos);
              const lines = textBeforeCursor.split('\n');
              const lineIndex = lines.length - 1;
              const colIndex = lines[lines.length - 1].length;

              const top = lineIndex * lineHeight + 8 - (textareaRef.current?.scrollTop || 0);
              const left = colIndex * charWidth + 12 - (textareaRef.current?.scrollLeft || 0);

              return (
                <div
                  key={user.id}
                  className="remote-cursor"
                  style={{
                    top: `${top}px`,
                    left: `${left}px`,
                    backgroundColor: user.color || '#3b82f6'
                  }}
                >
                  <div
                    className="remote-cursor-label"
                    style={{ backgroundColor: user.color || '#3b82f6' }}
                  >
                    {user.name || user.id}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Editable Transparent Textarea */}
          <textarea
            ref={textareaRef}
            id="code-editor"
            className="editor-layer select-text"
            spellCheck="false"
            autoComplete="off"
            autoCapitalize="off"
            value={code}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            onSelect={() => {
              if (!isApplyingRemoteUpdateRef.current) {
                updateCursorTracking();
              }
            }}
            onFocus={() => {
              setIsEditorFocused(true);
              if (!isApplyingRemoteUpdateRef.current) {
                updateCursorTracking();
              }
            }}
            onBlur={() => setIsEditorFocused(false)}
            onClick={() => {
              if (!isApplyingRemoteUpdateRef.current) {
                updateCursorTracking();
              }
              closeAutocomplete();
            }}
            onMouseUp={() => {
              if (!isApplyingRemoteUpdateRef.current) {
                updateCursorTracking();
              }
            }}
            onKeyUp={() => {
              if (!isApplyingRemoteUpdateRef.current) {
                updateCursorTracking();
              }
            }}
            placeholder="# Write Python code here..."
          />

          {/* Autocomplete Popup */}
          {autoBoxPos && autocompleteSuggestions.length > 0 && (
            <AutocompletePopup
              suggestions={autocompleteSuggestions}
              selectedIndex={selectedAutoIndex}
              position={autoBoxPos}
              isMinimized={isAutoMinimized}
              onToggleMinimize={handleToggleMinimize}
              onClose={closeAutocomplete}
              onSelect={applyAutocomplete}
              onHoverIndex={setSelectedAutoIndex}
            />
          )}
        </div>
      </div>

      {/* Editor Status Bar with Live Python Syntax Diagnostics */}
      <div className="bg-slate-900/95 border-t border-slate-800/80 px-2.5 sm:px-3 py-1 text-[10px] text-slate-400 flex justify-between items-center font-mono shrink-0 select-none">
        <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
          <div className="shrink-0">
            Ln {cursorPos.line}, Col {cursorPos.col}
          </div>

          {/* Syntax Diagnostic Status */}
          {syntaxError ? (
            <button
              onClick={handleJumpToError}
              title="Click to jump to syntax error in editor"
              className="text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 cursor-pointer transition bg-rose-500/10 hover:bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30 truncate max-w-[200px] xs:max-w-xs sm:max-w-md"
            >
              <AlertCircle className="w-3 h-3 text-rose-400 shrink-0 animate-pulse" />
              <span className="font-semibold">{syntaxError.errorType}:</span>
              <span className="truncate">{syntaxError.message} (Ln {syntaxError.line}, Col {syntaxError.column})</span>
            </button>
          ) : (
            <span className="text-emerald-400/80 hidden xs:flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Python syntax valid</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span>UTF-8</span>
          <span>•</span>
          <span className="text-slate-300 font-medium">Python 3.11</span>
        </div>
      </div>
    </div>
  );
};
