import React from 'react';

// Standard 16 ANSI Color Palette (optimized for dark terminal background)
const ANSI_COLORS_NORMAL: Record<number, string> = {
  30: '#64748b', // Black -> Dark Slate / Gray for readability on dark background
  31: '#f87171', // Red
  32: '#4ade80', // Green
  33: '#facc15', // Yellow / Amber
  34: '#60a5fa', // Blue
  35: '#e879f9', // Magenta / Fuchsia
  36: '#22d3ee', // Cyan
  37: '#f1f5f9', // White / Slate 100
};

const ANSI_COLORS_BRIGHT: Record<number, string> = {
  90: '#94a3b8', // Bright Black (Slate 400)
  91: '#ff6b6b', // Bright Red
  92: '#22c55e', // Bright Green
  93: '#fef08a', // Bright Yellow
  94: '#93c5fd', // Bright Blue
  95: '#f472b6', // Bright Magenta / Pink
  96: '#67e8f9', // Bright Cyan
  97: '#ffffff', // Bright White
};

const ANSI_BG_NORMAL: Record<number, string> = {
  40: '#1e293b', // Black BG
  41: '#7f1d1d', // Red BG
  42: '#14532d', // Green BG
  43: '#713f12', // Yellow BG
  44: '#1e3a8a', // Blue BG
  45: '#701a75', // Magenta BG
  46: '#164e63', // Cyan BG
  47: '#cbd5e1', // White/Light Gray BG
};

const ANSI_BG_BRIGHT: Record<number, string> = {
  100: '#334155', // Bright Black BG
  101: '#991b1b', // Bright Red BG
  102: '#166534', // Bright Green BG
  103: '#854d0e', // Bright Yellow BG
  104: '#1e40af', // Bright Blue BG
  105: '#86198f', // Bright Magenta BG
  106: '#155e75', // Bright Cyan BG
  107: '#f8fafc', // Bright White BG
};

// Convert 256-color index to RGB hex/string
function get256Color(index: number): string {
  if (index < 0 || index > 255) return '#ffffff';
  if (index < 8) return ANSI_COLORS_NORMAL[30 + index] || '#f1f5f9';
  if (index < 16) return ANSI_COLORS_BRIGHT[90 + (index - 8)] || '#ffffff';

  // 16..231: 6x6x6 color cube
  if (index >= 16 && index <= 231) {
    const code = index - 16;
    const r = Math.floor(code / 36) * 51;
    const g = Math.floor((code % 36) / 6) * 51;
    const b = (code % 6) * 51;
    return `rgb(${r}, ${g}, ${b})`;
  }

  // 232..255: grayscale ramp
  const gray = 8 + (index - 232) * 10;
  return `rgb(${gray}, ${gray}, ${gray})`;
}

interface SpanStyle {
  color?: string;
  backgroundColor?: string;
  fontWeight?: 'bold' | 'normal';
  fontStyle?: 'italic' | 'normal';
  textDecoration?: string;
  opacity?: number;
  inverted?: boolean;
}

interface TextSegment {
  text: string;
  style: SpanStyle;
}

/**
 * Parses a string containing ANSI escape codes into styled React elements.
 * Supports Colorama, Termcolor, Rich, Colored, 16-color, 256-color, and TrueColor RGB.
 */
export function parseAnsiToReact(rawText: string): React.ReactNode {
  if (!rawText) return null;

  // Quick check: if no ANSI escape codes, return plain string directly
  if (!rawText.includes('\x1b') && !rawText.includes('\u001b')) {
    return rawText;
  }

  // Strip non-SGR control codes (e.g. cursor moves \x1b[2K, \x1b[?25h, \x1b[1G, etc.)
  const cleanInput = rawText.replace(/(?:\x1b|\u001b)\[[0-9;?]*[A-LN-Za-ln-z]/g, '');

  const segments: TextSegment[] = [];
  let currentStyle: SpanStyle = {};

  // Regex matching ANSI SGR escape sequences: ESC [ ... m
  const ansiRegex = /(?:\x1b|\u001b)\[([0-9;:]*)m/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = ansiRegex.exec(cleanInput)) !== null) {
    const textChunk = cleanInput.slice(lastIndex, match.index);
    if (textChunk.length > 0) {
      segments.push({
        text: textChunk,
        style: { ...currentStyle }
      });
    }

    const codeStr = match[1] || '0';
    // Split by semicolons or colons
    const codes = codeStr.split(/[;:]+/).map((c) => parseInt(c, 10) || 0);

    let i = 0;
    while (i < codes.length) {
      const code = codes[i];

      if (code === 0) {
        // Reset all styles
        currentStyle = {};
      } else if (code === 1) {
        // Bold / Bright
        currentStyle.fontWeight = 'bold';
      } else if (code === 2) {
        // Dim
        currentStyle.opacity = 0.65;
      } else if (code === 3) {
        // Italic
        currentStyle.fontStyle = 'italic';
      } else if (code === 4) {
        // Underline
        currentStyle.textDecoration = currentStyle.textDecoration
          ? `${currentStyle.textDecoration} underline`
          : 'underline';
      } else if (code === 7) {
        // Reverse / Invert video
        currentStyle.inverted = true;
      } else if (code === 9) {
        // Strikethrough
        currentStyle.textDecoration = currentStyle.textDecoration
          ? `${currentStyle.textDecoration} line-through`
          : 'line-through';
      } else if (code === 22) {
        // Normal intensity (not bold, not dim)
        currentStyle.fontWeight = 'normal';
        currentStyle.opacity = undefined;
      } else if (code === 23) {
        // Not italic
        currentStyle.fontStyle = 'normal';
      } else if (code === 24 || code === 29) {
        // Underline / Strikethrough off
        currentStyle.textDecoration = undefined;
      } else if (code === 27) {
        // Positive (not inverted)
        currentStyle.inverted = false;
      } else if (code >= 30 && code <= 37) {
        // Normal FG Color (Colorama Fore.RED, Fore.GREEN, etc.)
        currentStyle.color = ANSI_COLORS_NORMAL[code];
      } else if (code === 39) {
        // Default FG Color (Colorama Fore.RESET)
        currentStyle.color = undefined;
      } else if (code >= 40 && code <= 47) {
        // Normal BG Color (Colorama Back.RED, Back.GREEN, etc.)
        currentStyle.backgroundColor = ANSI_BG_NORMAL[code];
      } else if (code === 49) {
        // Default BG Color (Colorama Back.RESET)
        currentStyle.backgroundColor = undefined;
      } else if (code >= 90 && code <= 97) {
        // Bright FG Color (Colorama Fore.LIGHTRED_EX, etc.)
        currentStyle.color = ANSI_COLORS_BRIGHT[code];
      } else if (code >= 100 && code <= 107) {
        // Bright BG Color (Colorama Back.LIGHTRED_EX, etc.)
        currentStyle.backgroundColor = ANSI_BG_BRIGHT[code];
      } else if (code === 38) {
        // Extended FG Color (256 or TrueColor)
        if (codes[i + 1] === 5 && codes[i + 2] !== undefined) {
          currentStyle.color = get256Color(codes[i + 2]);
          i += 2;
        } else if (codes[i + 1] === 2 && codes[i + 4] !== undefined) {
          const r = codes[i + 2];
          const g = codes[i + 3];
          const b = codes[i + 4];
          currentStyle.color = `rgb(${r}, ${g}, ${b})`;
          i += 4;
        }
      } else if (code === 48) {
        // Extended BG Color (256 or TrueColor)
        if (codes[i + 1] === 5 && codes[i + 2] !== undefined) {
          currentStyle.backgroundColor = get256Color(codes[i + 2]);
          i += 2;
        } else if (codes[i + 1] === 2 && codes[i + 4] !== undefined) {
          const r = codes[i + 2];
          const g = codes[i + 3];
          const b = codes[i + 4];
          currentStyle.backgroundColor = `rgb(${r}, ${g}, ${b})`;
          i += 4;
        }
      }

      i++;
    }

    lastIndex = ansiRegex.lastIndex;
  }

  // Trailing text chunk
  const remainingText = cleanInput.slice(lastIndex);
  if (remainingText.length > 0) {
    segments.push({
      text: remainingText,
      style: { ...currentStyle }
    });
  }

  return (
    <>
      {segments.map((seg, idx) => {
        let fgColor = seg.style.color;
        let bgColor = seg.style.backgroundColor;

        // If inverted style
        if (seg.style.inverted) {
          const temp = fgColor || '#f1f5f9';
          fgColor = bgColor || '#0f172a';
          bgColor = temp;
        } else if (bgColor && !fgColor) {
          // If background is set but foreground is not, ensure high contrast
          if (bgColor === ANSI_BG_NORMAL[47] || bgColor === ANSI_BG_BRIGHT[107]) {
            fgColor = '#0f172a';
          }
        }

        const hasCustomStyle = 
          fgColor !== undefined || 
          bgColor !== undefined || 
          seg.style.fontWeight || 
          seg.style.fontStyle || 
          seg.style.textDecoration || 
          seg.style.opacity !== undefined;

        if (!hasCustomStyle) {
          return <span key={idx}>{seg.text}</span>;
        }

        return (
          <span
            key={idx}
            style={{
              color: fgColor,
              backgroundColor: bgColor,
              fontWeight: seg.style.fontWeight,
              fontStyle: seg.style.fontStyle,
              textDecoration: seg.style.textDecoration,
              opacity: seg.style.opacity,
              padding: bgColor ? '0.5px 3px' : undefined,
              borderRadius: bgColor ? '3px' : undefined,
            }}
          >
            {seg.text}
          </span>
        );
      })}
    </>
  );
}
