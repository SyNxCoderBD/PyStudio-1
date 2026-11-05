import { PYTHON_KEYWORDS, PYTHON_BUILTINS } from '../constants/python';
import { SyntaxErrorInfo } from '../types';

export interface SelectionRange {
  start: number;
  end: number;
}

export interface RemoteSelectionRange extends SelectionRange {
  color: string;
}

export function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getErrorCharRange(
  code: string,
  error: SyntaxErrorInfo
): { start: number; end: number; message: string; errorType: string } | null {
  if (!code || !error || !error.line) return null;

  const lines = code.split('\n');
  const targetLineIdx = Math.max(0, Math.min(lines.length - 1, error.line - 1));

  let lineStartPos = 0;
  for (let i = 0; i < targetLineIdx; i++) {
    lineStartPos += lines[i].length + 1; // + 1 for \n
  }

  const lineContent = lines[targetLineIdx] || '';

  // Python AST offset is 1-indexed
  let colStart = (error.column !== undefined && error.column !== null) ? error.column - 1 : 0;
  colStart = Math.max(0, Math.min(lineContent.length, colStart));

  let colEnd = colStart + 1;

  if (error.endLine && error.endLine === error.line && error.endColumn) {
    colEnd = Math.max(colStart + 1, Math.min(lineContent.length, error.endColumn - 1));
  } else {
    // If colStart is at end of line (e.g. missing colon after `def foo()`)
    if (colStart >= lineContent.length) {
      const trimmedEnd = lineContent.trimEnd();
      if (trimmedEnd.length > 0) {
        // Highlight last token or last 2 chars
        const lastWordMatch = trimmedEnd.match(/(\S+)$/);
        if (lastWordMatch && lastWordMatch.index !== undefined) {
          colStart = lastWordMatch.index;
          colEnd = trimmedEnd.length;
        } else {
          colStart = Math.max(0, trimmedEnd.length - 1);
          colEnd = trimmedEnd.length;
        }
      } else {
        colStart = 0;
        colEnd = Math.max(1, lineContent.length);
      }
    } else {
      // Find token or word length from colStart
      const remaining = lineContent.slice(colStart);
      const tokenMatch = remaining.match(/^[a-zA-Z0-9_]+|^[^\s\w]+|^\s+/);
      if (tokenMatch && tokenMatch[0].length > 0) {
        colEnd = colStart + tokenMatch[0].length;
      } else {
        colEnd = Math.min(lineContent.length, colStart + 1);
      }
    }
  }

  if (colEnd <= colStart) {
    colEnd = colStart + 1;
  }

  return {
    start: lineStartPos + colStart,
    end: Math.min(code.length, lineStartPos + colEnd),
    message: error.message || 'Syntax error',
    errorType: error.errorType || 'SyntaxError'
  };
}

interface ParsedToken {
  text: string;
  start: number;
  end: number;
  kind:
    | 'comment'
    | 'string'
    | 'decorator'
    | 'number'
    | 'def'
    | 'class'
    | 'keyword'
    | 'builtin'
    | 'operator'
    | 'punctuation'
    | 'identifier';
  name?: string;
  nameStart?: number;
}

interface HighlightSpan {
  start: number;
  end: number;
  type: 'bracket' | 'identifier';
}

const OPEN_TO_CLOSE: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
const CLOSE_TO_OPEN: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

export function highlightPythonCode(
  code: string,
  syntaxError?: SyntaxErrorInfo | null,
  selection?: SelectionRange | null,
  remoteSelections: RemoteSelectionRange[] = []
): string {
  if (!code) return '';

  const errorRange = syntaxError ? getErrorCharRange(code, syntaxError) : null;
  const errorTitle = errorRange
    ? escapeHTML(`${errorRange.errorType}: ${errorRange.message}`)
    : '';

  // 1. Tokenize the entire code buffer
  const fullRegex = /#.*|"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|@[a-zA-Z_][a-zA-Z0-9_]*|\b0x[0-9a-fA-F]+\b|\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b|\b(?:def|class)\s+[a-zA-Z_][a-zA-Z0-9_]*|\b[a-zA-Z_][a-zA-Z0-9_]*\b|[+\-*\/%=&|^~<>!]+|[\(\)\[\]\{\}:;,\.]/g;

  const tokens: ParsedToken[] = [];
  let match: RegExpExecArray | null;

  while ((match = fullRegex.exec(code)) !== null) {
    const tokenText = match[0];
    const start = match.index;
    const end = start + tokenText.length;

    if (tokenText.startsWith('#')) {
      tokens.push({ text: tokenText, start, end, kind: 'comment' });
    } else if (tokenText.startsWith('"') || tokenText.startsWith("'")) {
      tokens.push({ text: tokenText, start, end, kind: 'string' });
    } else if (tokenText.startsWith('@')) {
      tokens.push({ text: tokenText, start, end, kind: 'decorator' });
    } else if (/^\d/.test(tokenText) || tokenText.startsWith('0x')) {
      tokens.push({ text: tokenText, start, end, kind: 'number' });
    } else if (tokenText.startsWith('def ') || tokenText.startsWith('class ')) {
      const isDef = tokenText.startsWith('def ');
      const kw = isDef ? 'def' : 'class';
      const name = tokenText.slice(kw.length).trim();
      const nameStart = start + tokenText.indexOf(name, kw.length);
      tokens.push({
        text: tokenText,
        start,
        end,
        kind: isDef ? 'def' : 'class',
        name,
        nameStart
      });
    } else if (PYTHON_KEYWORDS.includes(tokenText)) {
      tokens.push({ text: tokenText, start, end, kind: 'keyword' });
    } else if (PYTHON_BUILTINS.includes(tokenText)) {
      tokens.push({ text: tokenText, start, end, kind: 'builtin' });
    } else if (/[+\-*\/%=&|^~<>!]/.test(tokenText)) {
      tokens.push({ text: tokenText, start, end, kind: 'operator' });
    } else if (/[\(\)\[\]\{\}:;,\.]/.test(tokenText)) {
      tokens.push({ text: tokenText, start, end, kind: 'punctuation' });
    } else {
      tokens.push({ text: tokenText, start, end, kind: 'identifier' });
    }
  }

  // 2. Build paired brackets map (ignoring brackets in strings or comments)
  const bracketStack: { char: string; pos: number }[] = [];
  const bracketPairs = new Map<number, number>();

  for (const t of tokens) {
    if (t.kind === 'punctuation') {
      if (OPEN_TO_CLOSE[t.text]) {
        bracketStack.push({ char: t.text, pos: t.start });
      } else if (CLOSE_TO_OPEN[t.text]) {
        const expectedOpen = CLOSE_TO_OPEN[t.text];
        let matchIdx = -1;
        for (let i = bracketStack.length - 1; i >= 0; i--) {
          if (bracketStack[i].char === expectedOpen) {
            matchIdx = i;
            break;
          }
        }
        if (matchIdx !== -1) {
          const openPos = bracketStack[matchIdx].pos;
          bracketPairs.set(openPos, t.start);
          bracketPairs.set(t.start, openPos);
          bracketStack.splice(matchIdx);
        }
      }
    }
  }

  // 3. Resolve active selection/cursor highlight spans
  const highlightSpans: HighlightSpan[] = [];

  if (selection && selection.start >= 0 && selection.end >= 0) {
    const { start: selStart, end: selEnd } = selection;
    const isRange = selStart !== selEnd;

    // A. Check for bracket targeting
    let targetedBracketPos = -1;

    if (isRange) {
      if (selEnd - selStart === 1 && bracketPairs.has(selStart)) {
        targetedBracketPos = selStart;
      } else if (bracketPairs.has(selStart)) {
        targetedBracketPos = selStart;
      } else if (bracketPairs.has(selEnd - 1)) {
        targetedBracketPos = selEnd - 1;
      }
    } else {
      const pos = selStart;
      // Prioritize bracket immediately before caret (e.g., cursor right after typing or clicking ')')
      if (pos > 0 && bracketPairs.has(pos - 1)) {
        targetedBracketPos = pos - 1;
      } else if (pos < code.length && bracketPairs.has(pos)) {
        targetedBracketPos = pos;
      }
    }

    if (targetedBracketPos !== -1) {
      const partnerPos = bracketPairs.get(targetedBracketPos);
      if (partnerPos !== undefined) {
        highlightSpans.push({
          start: targetedBracketPos,
          end: targetedBracketPos + 1,
          type: 'bracket'
        });
        highlightSpans.push({
          start: partnerPos,
          end: partnerPos + 1,
          type: 'bracket'
        });
      }
    }

    // B. Check for variable, function, keyword, or identifier occurrence targeting
    let targetIdentifier: string | null = null;

    if (isRange) {
      const selectedRaw = code.slice(selStart, selEnd).trim();
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(selectedRaw)) {
        targetIdentifier = selectedRaw;
      }
    } else if (targetedBracketPos === -1) {
      // Caret is blinking and not on a bracket: check for identifier surrounding caret
      const pos = selStart;
      let wStart = pos;
      while (wStart > 0 && /[a-zA-Z0-9_]/.test(code[wStart - 1])) {
        wStart--;
      }
      let wEnd = pos;
      while (wEnd < code.length && /[a-zA-Z0-9_]/.test(code[wEnd])) {
        wEnd++;
      }
      if (wEnd > wStart) {
        const candidate = code.slice(wStart, wEnd);
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(candidate)) {
          targetIdentifier = candidate;
        }
      }
    }

    // Find all occurrences of the target identifier across tokens
    if (targetIdentifier) {
      for (const t of tokens) {
        if (t.kind === 'identifier' || t.kind === 'builtin' || t.kind === 'keyword') {
          if (t.text === targetIdentifier) {
            highlightSpans.push({ start: t.start, end: t.end, type: 'identifier' });
          }
        } else if (t.kind === 'def' || t.kind === 'class') {
          if (t.name === targetIdentifier && t.nameStart !== undefined) {
            highlightSpans.push({
              start: t.nameStart,
              end: t.nameStart + t.name.length,
              type: 'identifier'
            });
          }
          const kw = t.kind;
          if (targetIdentifier === kw) {
            highlightSpans.push({
              start: t.start,
              end: t.start + kw.length,
              type: 'identifier'
            });
          }
        }
      }
    }
  }

  // 4. Render segments into formatted HTML
  const renderRawSegment = (text: string, segStart: number, className?: string): string => {
    if (!text) return '';
    const segEnd = segStart + text.length;

    const isHighlighted = highlightSpans.some(
      (h) => Math.max(segStart, h.start) < Math.min(segEnd, h.end)
    );
    const highlightClass = isHighlighted ? 'related-syntax-highlight' : '';
    const baseClass = [className, highlightClass].filter(Boolean).join(' ');

    // No error overlap
    if (!errorRange || segEnd <= errorRange.start || segStart >= errorRange.end) {
      const esc = escapeHTML(text);
      return baseClass ? `<span class="${baseClass}">${esc}</span>` : esc;
    }

    // Overlap exists with syntax error squiggly
    let result = '';
    const overlapStart = Math.max(segStart, errorRange.start) - segStart;
    const overlapEnd = Math.min(segEnd, errorRange.end) - segStart;

    // Before error overlap
    if (overlapStart > 0) {
      const beforeText = escapeHTML(text.slice(0, overlapStart));
      result += baseClass ? `<span class="${baseClass}">${beforeText}</span>` : beforeText;
    }

    // Erroneous overlap segment
    if (overlapEnd > overlapStart) {
      const errText = escapeHTML(text.slice(overlapStart, overlapEnd));
      const squigglyClass = baseClass
        ? `${baseClass} syntax-error-squiggly`
        : 'syntax-error-squiggly';
      result += `<span class="${squigglyClass}" title="${errorTitle}">${errText}</span>`;
    }

    // After error overlap
    if (overlapEnd < text.length) {
      const afterText = escapeHTML(text.slice(overlapEnd));
      result += baseClass ? `<span class="${baseClass}">${afterText}</span>` : afterText;
    }

    return result;
  };

  const renderSegment = (text: string, segStart: number, className?: string): string => {
    if (!text || remoteSelections.length === 0) {
      return renderRawSegment(text, segStart, className);
    }

    const segEnd = segStart + text.length;
    const boundaries = new Set([segStart, segEnd]);
    for (const remoteSelection of remoteSelections) {
      if (remoteSelection.end <= segStart || remoteSelection.start >= segEnd) continue;
      boundaries.add(Math.max(segStart, remoteSelection.start));
      boundaries.add(Math.min(segEnd, remoteSelection.end));
    }

    const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);
    let rendered = '';
    for (let index = 0; index < sortedBoundaries.length - 1; index++) {
      const start = sortedBoundaries[index];
      const end = sortedBoundaries[index + 1];
      const content = renderRawSegment(text.slice(start - segStart, end - segStart), start, className);
      const activeSelection = remoteSelections.find((range) => range.start <= start && range.end >= end);
      if (!activeSelection) {
        rendered += content;
        continue;
      }

      const color = /^#[\da-f]{6}$/i.test(activeSelection.color) ? activeSelection.color : '#60a5fa';
      rendered += `<span class="remote-selection-highlight" style="--remote-selection-color:${color};--remote-selection-fill:${color}55">${content}</span>`;
    }

    return rendered;
  };

  let html = '';
  let cursor = 0;

  for (const t of tokens) {
    if (t.start > cursor) {
      const gapText = code.slice(cursor, t.start);
      html += renderSegment(gapText, cursor);
    }

    if (t.kind === 'comment') {
      html += renderSegment(t.text, t.start, 'token-comment');
    } else if (t.kind === 'string') {
      html += renderSegment(t.text, t.start, 'token-string');
    } else if (t.kind === 'decorator') {
      html += renderSegment(t.text, t.start, 'token-decorator');
    } else if (t.kind === 'number') {
      html += renderSegment(t.text, t.start, 'token-number');
    } else if (t.kind === 'def' || t.kind === 'class') {
      const kw = t.kind;
      const kwEnd = t.start + kw.length;
      html += renderSegment(kw, t.start, 'token-keyword');
      if (t.nameStart !== undefined && t.nameStart > kwEnd) {
        html += renderSegment(code.slice(kwEnd, t.nameStart), kwEnd);
        if (t.name) {
          html += renderSegment(t.name, t.nameStart, 'token-def');
        }
      }
    } else if (t.kind === 'keyword') {
      html += renderSegment(t.text, t.start, 'token-keyword');
    } else if (t.kind === 'builtin') {
      html += renderSegment(t.text, t.start, 'token-builtin');
    } else if (t.kind === 'operator') {
      html += renderSegment(t.text, t.start, 'token-operator');
    } else if (t.kind === 'punctuation') {
      html += renderSegment(t.text, t.start, 'token-punctuation');
    } else {
      html += renderSegment(t.text, t.start);
    }

    cursor = t.end;
  }

  if (cursor < code.length) {
    const tailText = code.slice(cursor);
    html += renderSegment(tailText, cursor);
  }

  return html;
}

