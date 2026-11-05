/**
 * Collaborative Synchronization & Cursor Preservation Utilities
 * Prevents cursor displacement / jumping when multiple programmers type simultaneously.
 */

export interface CursorSelection {
  start: number;
  end: number;
}

/**
 * Accurately transforms a cursor position from prevText to newText based on diff.
 * Guarantees the local user's caret remains anchored to their intended text location
 * even when remote collaborators insert, delete, or modify text elsewhere in the document.
 */
export function transformCursorPosition(
  prevText: string,
  newText: string,
  cursor: number
): number {
  if (prevText === newText || cursor < 0) {
    return Math.max(0, Math.min(cursor, newText.length));
  }

  const prevLen = prevText.length;
  const newLen = newText.length;
  const minLen = Math.min(prevLen, newLen);

  // 1. Find common prefix length
  let prefixLen = 0;
  while (prefixLen < minLen && prevText[prefixLen] === newText[prefixLen]) {
    prefixLen++;
  }

  // 2. Find common suffix length (ensuring no overlap with prefix)
  let suffixLen = 0;
  while (
    suffixLen < minLen - prefixLen &&
    prevText[prevLen - 1 - suffixLen] === newText[newLen - 1 - suffixLen]
  ) {
    suffixLen++;
  }

  const prevEditStart = prefixLen;
  const prevEditEnd = prevLen - suffixLen;
  const newEditStart = prefixLen;
  const newEditEnd = newLen - suffixLen;
  const delta = (newEditEnd - newEditStart) - (prevEditEnd - prevEditStart);

  // Case A: Cursor is strictly before the edited region -> No shift needed
  if (cursor <= prevEditStart) {
    return cursor;
  }

  // Case B: Cursor is strictly after the edited region -> Shift by delta
  if (cursor >= prevEditEnd) {
    return Math.max(0, Math.min(cursor + delta, newLen));
  }

  // Case C: Cursor is inside the edited region (simultaneous edit on same token/word)
  const oldEditLength = prevEditEnd - prevEditStart;
  if (oldEditLength === 0) {
    // Insertion happened at prevEditStart
    return Math.min(newLen, newEditStart + (newEditEnd - newEditStart));
  }

  const ratio = (cursor - prevEditStart) / oldEditLength;
  const newOffset = Math.round(newEditStart + ratio * (newEditEnd - newEditStart));
  return Math.max(0, Math.min(newOffset, newLen));
}

/**
 * Transforms both selectionStart and selectionEnd for text selection preservation.
 */
export function transformSelectionRange(
  prevText: string,
  newText: string,
  selection: CursorSelection
): CursorSelection {
  return {
    start: transformCursorPosition(prevText, newText, selection.start),
    end: transformCursorPosition(prevText, newText, selection.end)
  };
}

/**
 * Performs a 3-way line-level merge between:
 * - baseText: The common ancestor state before concurrent edits
 * - localText: Local un-synced edits
 * - remoteText: Incoming remote edits from collaborator
 *
 * Returns mergedText and a cursor adjustment function for local position.
 */
export function merge3Way(
  baseText: string,
  localText: string,
  remoteText: string,
  localCursor: number
): { mergedText: string; newCursor: number } {
  // If remote has no changes compared to base, keep local
  if (remoteText === baseText) {
    return { mergedText: localText, newCursor: localCursor };
  }

  // If local has no changes compared to base, take remote and transform cursor
  if (localText === baseText) {
    const newCursor = transformCursorPosition(baseText, remoteText, localCursor);
    return { mergedText: remoteText, newCursor };
  }

  // If local and remote match, no conflict
  if (localText === remoteText) {
    return { mergedText: localText, newCursor: localCursor };
  }

  // Split into lines for standard 3-way line diff merge
  const baseLines = baseText.split('\n');
  const localLines = localText.split('\n');
  const remoteLines = remoteText.split('\n');

  // Simple line diff chunks
  const mergedLines: string[] = [];
  let iBase = 0;
  let iLocal = 0;
  let iRemote = 0;

  // Track if we can do line-by-line alignment
  // If line count structure matches closely:
  const maxLines = Math.max(baseLines.length, localLines.length, remoteLines.length);

  // If the document is small to medium, we can perform line diff
  // Find modified line ranges in local vs base, and remote vs base
  const localChangedLines = new Set<number>();
  const remoteChangedLines = new Set<number>();

  for (let i = 0; i < Math.max(baseLines.length, localLines.length); i++) {
    if (baseLines[i] !== localLines[i]) {
      localChangedLines.add(i);
    }
  }

  for (let i = 0; i < Math.max(baseLines.length, remoteLines.length); i++) {
    if (baseLines[i] !== remoteLines[i]) {
      remoteChangedLines.add(i);
    }
  }

  // Check for line conflicts:
  let hasOverlappingLineEdits = false;
  for (const lineIdx of localChangedLines) {
    if (remoteChangedLines.has(lineIdx)) {
      hasOverlappingLineEdits = true;
      break;
    }
  }

  if (!hasOverlappingLineEdits && localLines.length === baseLines.length && remoteLines.length === baseLines.length) {
    // Non-conflicting line changes with equal line counts
    for (let i = 0; i < baseLines.length; i++) {
      if (localChangedLines.has(i)) {
        mergedLines.push(localLines[i]);
      } else if (remoteChangedLines.has(i)) {
        mergedLines.push(remoteLines[i]);
      } else {
        mergedLines.push(baseLines[i]);
      }
    }
    const merged = mergedLines.join('\n');
    const newCursor = transformCursorPosition(localText, merged, localCursor);
    return { mergedText: merged, newCursor };
  }

  // Character-level patch merge:
  // Apply remote changes on top of base, then re-apply local diff
  const transformedRemoteCursor = transformCursorPosition(baseText, remoteText, localCursor);
  const transformedLocalCursor = transformCursorPosition(baseText, localText, localCursor);

  // Compute common prefix & suffix between base and remote
  const minBR = Math.min(baseText.length, remoteText.length);
  let pBR = 0;
  while (pBR < minBR && baseText[pBR] === remoteText[pBR]) pBR++;
  let sBR = 0;
  while (sBR < minBR - pBR && baseText[baseText.length - 1 - sBR] === remoteText[remoteText.length - 1 - sBR]) sBR++;

  // Remote edited region in baseText: [pBR, baseText.length - sBR]
  const remoteEditInBaseStart = pBR;
  const remoteEditInBaseEnd = baseText.length - sBR;
  const remoteReplacement = remoteText.substring(pBR, remoteText.length - sBR);

  // Local edited region in baseText:
  const minBL = Math.min(baseText.length, localText.length);
  let pBL = 0;
  while (pBL < minBL && baseText[pBL] === localText[pBL]) pBL++;
  let sBL = 0;
  while (sBL < minBL - pBL && baseText[baseText.length - 1 - sBL] === localText[localText.length - 1 - sBL]) sBL++;

  const localEditInBaseStart = pBL;
  const localEditInBaseEnd = baseText.length - sBL;
  const localReplacement = localText.substring(pBL, localText.length - sBL);

  // If local and remote edited disjoint regions in baseText:
  if (remoteEditInBaseEnd <= localEditInBaseStart) {
    // Remote edit comes strictly BEFORE local edit
    const part1 = baseText.substring(0, remoteEditInBaseStart);
    const part2 = remoteReplacement;
    const part3 = baseText.substring(remoteEditInBaseEnd, localEditInBaseStart);
    const part4 = localReplacement;
    const part5 = baseText.substring(localEditInBaseEnd);

    const merged = part1 + part2 + part3 + part4 + part5;
    const deltaBeforeLocal = remoteReplacement.length - (remoteEditInBaseEnd - remoteEditInBaseStart);
    const newCursor = Math.max(0, Math.min(localCursor + deltaBeforeLocal, merged.length));
    return { mergedText: merged, newCursor };
  } else if (localEditInBaseEnd <= remoteEditInBaseStart) {
    // Local edit comes strictly BEFORE remote edit
    const part1 = baseText.substring(0, localEditInBaseStart);
    const part2 = localReplacement;
    const part3 = baseText.substring(localEditInBaseEnd, remoteEditInBaseStart);
    const part4 = remoteReplacement;
    const part5 = baseText.substring(remoteEditInBaseEnd);

    const merged = part1 + part2 + part3 + part4 + part5;
    // Local cursor was in the local edit part (before remote edit), so it doesn't shift
    const newCursor = Math.max(0, Math.min(localCursor, merged.length));
    return { mergedText: merged, newCursor };
  }

  // Fallback: If edits overlap, take remote as ground truth and transform local cursor
  const newCursor = transformCursorPosition(localText, remoteText, localCursor);
  return { mergedText: remoteText, newCursor };
}
