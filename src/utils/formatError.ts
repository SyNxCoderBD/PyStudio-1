/**
 * Python Error & Traceback Formatter
 * 
 * Cleans up noisy Pyodide WebAssembly runtime wrappers (<exec>, ast.py, /lib/python312.zip)
 * and formats syntax errors and runtime tracebacks into clean, readable terminal outputs
 * with ANSI colors and helpful hints.
 */

const COMMON_ERROR_TIPS: Record<string, string> = {
  SyntaxError: 'Check for missing colons (:), unclosed parentheses/quotes, or misspelled keywords.',
  IndentationError: 'Python relies on consistent indentation. Check for mismatched spaces or tabs.',
  TabError: 'Inconsistent use of tabs and spaces in indentation. Use 4 spaces consistently.',
  NameError: 'Check spelling and ensure the variable or function is defined or imported first.',
  ZeroDivisionError: 'A number cannot be divided by zero. Check your denominator variable.',
  IndexError: 'List index is out of bounds. Check the length using len().',
  KeyError: 'Key was not found in dictionary. Consider using dict.get(key, default).',
  TypeError: 'Mismatched data types in operation or incorrect number of function arguments.',
  ValueError: 'Argument has the right type but an inappropriate value (e.g. int("abc")).',
  AttributeError: 'The object does not have the specified attribute or method.',
  FileNotFoundError: 'The requested file path does not exist in the working directory.',
  ModuleNotFoundError: 'The module could not be found. Check spelling or install it via pip.',
  UnboundLocalError: 'Local variable referenced before assignment. Use "global" or define it before use.',
  RecursionError: 'Maximum recursion depth exceeded. Check for base cases in recursive functions.'
};

interface TracebackFrame {
  filename: string;
  lineNum: number;
  scope: string;
  codeSnippet?: string;
  pointerSnippet?: string;
}

export function formatPythonTraceback(rawError: string, userCode?: string): string {
  if (!rawError || typeof rawError !== 'string') return '';

  // 1. Strip JS / Pyodide error wrappers
  let clean = rawError
    .replace(/^PythonError:\s*/i, '')
    .replace(/^JsException:\s*/i, '')
    .trim();

  // If already user-formatted, return directly
  if (clean.includes('✖') && clean.includes('-->')) {
    return clean;
  }

  const lines = clean.split('\n');

  // 2. Identify the exception type and message from the bottom of the error
  let errorType = '';
  let errorMessage = '';
  let errorLineIdx = -1;

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    // Match Python exception header (e.g. "SyntaxError: invalid syntax", "ZeroDivisionError: division by zero")
    const m = line.match(/^([A-Z][a-zA-Z0-9_]*(?:Error|Exception|Warning|Interrupt))(?::\s*(.*))?$/);
    if (m) {
      errorType = m[1];
      errorMessage = (m[2] || '').trim();
      errorLineIdx = i;
      break;
    }
  }

  // If no standard Python exception could be matched, fall back to cleaning internal filenames
  if (!errorType || errorLineIdx === -1) {
    return clean
      .replace(/File\s+["']<editor>["']/g, 'File "main.py"')
      .replace(/\s*File\s+["']<exec>["'].*\n?/g, '')
      .replace(/\s*File\s+["']\/lib\/python\S+["'].*\n?/g, '');
  }

  const isSyntaxError = ['SyntaxError', 'IndentationError', 'TabError'].includes(errorType);

  // 3. Handle Syntax Errors (clean single-point diagnostic display)
  if (isSyntaxError) {
    let targetLineNum = 1;
    let codeSnippet = '';
    let pointerSnippet = '';

    for (let i = errorLineIdx - 1; i >= 0; i--) {
      const line = lines[i];
      const fileMatch = line.match(/File\s+["'](?:<editor>|main\.py|.*?)["'],\s+line\s+(\d+)/);
      if (fileMatch) {
        targetLineNum = parseInt(fileMatch[1], 10);
        
        // Scan following lines for code snippet and caret pointer
        let nextIdx = i + 1;
        while (nextIdx < errorLineIdx) {
          const nextLine = lines[nextIdx];
          if (nextLine.includes('^')) {
            pointerSnippet = nextLine.trimEnd();
          } else if (nextLine.trim() && !nextLine.trim().startsWith('File ')) {
            codeSnippet = nextLine.trim();
          }
          nextIdx++;
        }
        break;
      }
    }

    // If code snippet wasn't included in traceback, recover from user code buffer
    if (!codeSnippet && userCode) {
      const codeLines = userCode.split('\n');
      if (codeLines[targetLineNum - 1] !== undefined) {
        codeSnippet = codeLines[targetLineNum - 1].trim();
      }
    }

    // Build clean pointer alignment
    if (pointerSnippet && codeSnippet) {
      const leadingCaretMatch = pointerSnippet.match(/^(\s*)(\^+)/);
      if (leadingCaretMatch) {
        const caretSpaces = leadingCaretMatch[1].length;
        const caretChars = leadingCaretMatch[2];
        pointerSnippet = ' '.repeat(Math.max(0, caretSpaces)) + caretChars;
      }
    }

    const pad = Math.max(2, String(targetLineNum).length);
    const linePrefix = String(targetLineNum).padStart(pad, ' ');
    const emptyPrefix = ' '.repeat(pad);

    let out = `\x1b[1;31m✖ ${errorType}\x1b[0m: \x1b[1;37m${errorMessage || 'invalid syntax'}\x1b[0m\n`;
    out += `  \x1b[90m-->\x1b[0m \x1b[36mmain.py\x1b[0m:\x1b[33m${targetLineNum}\x1b[0m\n`;
    out += `   \x1b[90m${emptyPrefix}│\x1b[0m\n`;

    if (codeSnippet) {
      out += ` \x1b[90m${linePrefix} │\x1b[0m ${codeSnippet}\n`;
      if (pointerSnippet) {
        out += `   \x1b[90m${emptyPrefix}│\x1b[0m \x1b[1;31m${pointerSnippet}\x1b[0m\n`;
      }
      out += `   \x1b[90m${emptyPrefix}│\x1b[0m\n`;
    }

    const tip = COMMON_ERROR_TIPS[errorType];
    if (tip) {
      out += `\x1b[90m💡 Tip: ${tip}\x1b[0m`;
    }

    return out;
  }

  // 4. Handle Runtime Traceback Errors (filter internal runtime frames and preserve user call stack)
  const frames: TracebackFrame[] = [];
  let i = 0;

  while (i < errorLineIdx) {
    const line = lines[i];
    const frameMatch = line.match(/^\s*File\s+["']([^"']+)["'],\s+line\s+(\d+)(?:,\s+in\s+(.*))?/);

    if (frameMatch) {
      const rawFilename = frameMatch[1];
      const lineNum = parseInt(frameMatch[2], 10);
      const scope = (frameMatch[3] || '<module>').trim();

      // Check if this frame is internal Pyodide plumbing
      const isInternal = 
        rawFilename === '<exec>' ||
        rawFilename === '<string>' ||
        rawFilename.includes('ast.py') ||
        rawFilename.includes('/lib/python') ||
        rawFilename.includes('pyodide') ||
        scope.includes('__execute_collaborative_code') ||
        scope.includes('_custom_py_');

      i++;
      let codeSnippet = '';
      let pointerSnippet = '';

      while (i < errorLineIdx && !lines[i].match(/^\s*File\s+/)) {
        const subLine = lines[i];
        if (subLine.includes('^') || subLine.includes('~')) {
          pointerSnippet = subLine.trimEnd();
        } else if (subLine.trim()) {
          codeSnippet = subLine.trim();
        }
        i++;
      }

      if (!isInternal) {
        const filename = rawFilename === '<editor>' ? 'main.py' : rawFilename;
        frames.push({
          filename,
          lineNum,
          scope,
          codeSnippet,
          pointerSnippet
        });
      }
    } else {
      i++;
    }
  }

  // Construct formatted traceback
  let out = '';

  if (frames.length > 0) {
    out += `\x1b[1;31mTraceback (most recent call last):\x1b[0m\n`;
    for (const f of frames) {
      out += `  File "\x1b[36m${f.filename}\x1b[0m", line \x1b[33m${f.lineNum}\x1b[0m, in \x1b[35m${f.scope}\x1b[0m\n`;
      if (f.codeSnippet) {
        out += `    \x1b[37m${f.codeSnippet}\x1b[0m\n`;
      }
      if (f.pointerSnippet) {
        out += `    \x1b[1;31m${f.pointerSnippet}\x1b[0m\n`;
      }
    }
    out += '\n';
  }

  out += `\x1b[1;31m✖ ${errorType}\x1b[0m: \x1b[1;37m${errorMessage || 'error occurred'}\x1b[0m`;

  const tip = COMMON_ERROR_TIPS[errorType];
  if (tip) {
    out += `\n\x1b[90m💡 Tip: ${tip}\x1b[0m`;
  }

  return out;
}
