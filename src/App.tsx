import React, { lazy, Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { onValue, off } from 'firebase/database';
import {
  UserPresence,
  ChatMessage,
  ExecutionOutput,
  TerminalEntry,
  ToastItem,
  RoomPackage,
  HandRaiseEvent,
  FileDownloadEvent
} from './types';
import { DEFAULT_CODE, USER_COLORS } from './constants/python';
import {
  getRoomCodeRef,
  getRoomPresenceRef,
  getRoomChatRef,
  getRoomChatQuery,
  getRoomOutputRef,
  getRoomTerminalEntriesRef,
  getRoomTerminalEntriesQuery,
  getRoomInputResponseRef,
  getRoomPackagesRef,
  getRoomHandRaiseRef,
  getRoomFileDownloadRef,
  setRoomCode,
  setUserPresence,
  removeUserPresence,
  updateUserCursor,
  sendChatMessage,
  updateExecutionOutput,
  appendTerminalEntry,
  clearTerminalEntries,
  submitTerminalInputResponse,
  addRoomPackage,
  removeRoomPackage,
  broadcastHandRaise,
  broadcastFileDownload
} from './services/firebase';
import type { PyodideStatus } from './services/pyodide';
import type { WorkspaceViewMode } from './components/Header';
import { MainMenu } from './components/MainMenu';
import { Hand, Square, X } from 'lucide-react';
import { merge3Way } from './utils/collaborativeSync';

const Header = lazy(() => import('./components/Header').then(({ Header }) => ({ default: Header })));
const CodeEditor = lazy(() => import('./components/CodeEditor').then(({ CodeEditor }) => ({ default: CodeEditor })));
const TerminalOutput = lazy(() => import('./components/TerminalOutput').then(({ TerminalOutput }) => ({ default: TerminalOutput })));
const ChatPanel = lazy(() => import('./components/ChatPanel').then(({ ChatPanel }) => ({ default: ChatPanel })));
const PipModal = lazy(() => import('./components/PipModal').then(({ PipModal }) => ({ default: PipModal })));
const KickModal = lazy(() => import('./components/KickModal').then(({ KickModal }) => ({ default: KickModal })));
const FileDownloadModal = lazy(() => import('./components/FileDownloadModal').then(({ FileDownloadModal }) => ({ default: FileDownloadModal })));
const ToastContainer = lazy(() => import('./components/ToastContainer').then(({ ToastContainer }) => ({ default: ToastContainer })));
const LoadingScreen = lazy(() => import('./components/LoadingScreen').then(({ LoadingScreen }) => ({ default: LoadingScreen })));


const USER_KICK_LIMIT_MS = 5 * 60 * 1000; // 5 minutes

export default function App() {
  const [isRoomInvite] = useState(() =>
    typeof window !== 'undefined' && Boolean(new URLSearchParams(window.location.search).get('room')?.trim())
  );

  // View mode: 'split' | 'editor' | 'terminal'
  const [viewMode, setViewMode] = useState<WorkspaceViewMode>(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches ? 'editor' : 'split'
  );

  // Generate stable local user identity with customizable name and color
  const [currentUser, setCurrentUser] = useState<UserPresence>(() => {
    const id = 'user_' + Math.random().toString(36).substring(2, 7);
    const name = isRoomInvite ? '' : 'Coder-' + id.substring(5, 8).toUpperCase();
    const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
    return { id, name, color, online: true };
  });

  // Room state & Main Menu Navigation
  const [hasJoinedRoom, setHasJoinedRoom] = useState<boolean>(false);
  const [roomId, setRoomId] = useState<string>('101');
  const [roomInputValue, setRoomInputValue] = useState<string>('101');
  const [roomPackages, setRoomPackages] = useState<Record<string, RoomPackage>>({});
  const syncingPackagesRef = useRef<Set<string>>(new Set());

  // Room joining load state - ONLY active when connecting/switching to a room
  const [isJoiningRoomLoading, setIsJoiningRoomLoading] = useState<boolean>(false);
  const [isCodeLoaded, setIsCodeLoaded] = useState<boolean>(false);

  // Hand Raise State & 20s Cooldown
  const [handRaiseCooldown, setHandRaiseCooldown] = useState<number>(0);
  const [activeHandRaiseAlert, setActiveHandRaiseAlert] = useState<HandRaiseEvent | null>(null);

  // Editor code & sync
  const [code, setCode] = useState<string>(DEFAULT_CODE);
  const currentCodeRef = useRef<string>(code);
  currentCodeRef.current = code;
  const lastSyncedCodeRef = useRef<string>(code);

  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const isRemoteUpdateRef = useRef<boolean>(false);
  const codeSyncDebounceRef = useRef<any>(null);

  // Collaboration state
  const [collaborators, setCollaborators] = useState<Record<string, UserPresence>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const isChatOpenRef = useRef<boolean>(isChatOpen);
  isChatOpenRef.current = isChatOpen;

  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const roomJoinTimeRef = useRef<number>(Date.now());
  const currentUserRef = useRef<UserPresence>(currentUser);
  currentUserRef.current = currentUser;

  // Execution & Terminal state
  const [pyStatus, setPyStatus] = useState<PyodideStatus>('idle');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionOutput, setExecutionOutput] = useState<ExecutionOutput | null>(null);
  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>([]);
  const [waitingForInput, setWaitingForInput] = useState<boolean>(false);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const activeInputResolverRef = useRef<((val: string) => void) | null>(null);
  const activeInputRejecterRef = useRef<((err: any) => void) | null>(null);
  const activeInputRequestIdRef = useRef<string | null>(null);
  const activeSleepRejecterRef = useRef<(() => void) | null>(null);
  const isStopRequestedRef = useRef<boolean>(false);

  // Inactivity & Modals
  const [isKicked, setIsKicked] = useState<boolean>(false);
  const [isPipModalOpen, setIsPipModalOpen] = useState<boolean>(false);
  const [activeFileDownloadPrompt, setActiveFileDownloadPrompt] = useState<FileDownloadEvent | null>(null);
  const dismissedDownloadIdsRef = useRef<Set<string>>(new Set());
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const lastActivityTimeRef = useRef<number>(Date.now());

  // Helper: show toast notification
  const addToast = useCallback((
    title: string,
    message: string,
    iconClass?: string,
    iconColorClass?: string,
    duration = 3500
  ) => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, iconClass, iconColorClass, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  // Cooldown countdown timer for Raise Hand
  useEffect(() => {
    if (handRaiseCooldown <= 0) return;
    const timer = setInterval(() => {
      setHandRaiseCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [handRaiseCooldown]);

  // Track User Activity for Inactivity Kick
  const registerActivity = useCallback(() => {
    if (!isKicked) {
      lastActivityTimeRef.current = Date.now();
    }
  }, [isKicked]);

  useEffect(() => {
    if (!hasJoinedRoom) return;

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((evt) => window.addEventListener(evt, registerActivity, { passive: true }));

    const interval = setInterval(() => {
      if (!isKicked && Date.now() - lastActivityTimeRef.current >= USER_KICK_LIMIT_MS) {
        setIsKicked(true);
        if (roomId) {
          removeUserPresence(roomId, currentUser.id);
        }
      }
    }, 2000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, registerActivity));
      clearInterval(interval);
    };
  }, [hasJoinedRoom, isKicked, roomId, currentUser.id, registerActivity]);

  // Read Room ID from URL (Prefill, but stay on Main Menu unless user joins)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && roomParam.trim()) {
      setRoomId(roomParam.trim());
      setRoomInputValue(roomParam.trim());
    }
  }, []);

  // Firebase Room Synchronization Listeners
  useEffect(() => {
    if (!hasJoinedRoom || !roomId || isKicked) return;

    let hasLoadedInitialRoomCode = false;
    roomJoinTimeRef.current = Date.now();
    const joinTime = roomJoinTimeRef.current;
    const user = currentUserRef.current;
    setUserPresence(roomId, user);

    const codeRef = getRoomCodeRef(roomId);
    const presenceRef = getRoomPresenceRef(roomId);
    const chatQuery = getRoomChatQuery(roomId, 60);
    const outputRef = getRoomOutputRef(roomId);
    const terminalEntriesQuery = getRoomTerminalEntriesQuery(roomId, 80);
    const packagesRef = getRoomPackagesRef(roomId);
    const handRaiseRef = getRoomHandRaiseRef(roomId);

    // 1. Code Sync
    const unsubCode = onValue(codeRef, (snapshot) => {
      const val = snapshot.val();
      if (val === null) {
        setRoomCode(roomId, DEFAULT_CODE);
        lastSyncedCodeRef.current = DEFAULT_CODE;
      } else if (val !== currentCodeRef.current) {
        const baseCode = lastSyncedCodeRef.current || currentCodeRef.current;
        const localCode = currentCodeRef.current;
        const remoteCode = val;

        if (localCode === baseCode) {
          // No local unsynced edits: update directly to remote code
          isRemoteUpdateRef.current = true;
          lastSyncedCodeRef.current = remoteCode;
          setCode(remoteCode);
          setSyncStatus('synced');
          setTimeout(() => {
            isRemoteUpdateRef.current = false;
          }, 50);
        } else {
          // Concurrent typing by both programmers: Perform 3-way merge to preserve both developers' edits
          const { mergedText } = merge3Way(baseCode, localCode, remoteCode, 0);
          isRemoteUpdateRef.current = true;
          lastSyncedCodeRef.current = remoteCode;
          setCode(mergedText);
          setTimeout(() => {
            isRemoteUpdateRef.current = false;
          }, 50);

          // Auto-sync merged result to Firebase
          if (codeSyncDebounceRef.current) {
            clearTimeout(codeSyncDebounceRef.current);
          }
          codeSyncDebounceRef.current = setTimeout(async () => {
            try {
              await setRoomCode(roomId, mergedText);
              lastSyncedCodeRef.current = mergedText;
              setSyncStatus('synced');
            } catch (err) {
              console.error("Failed to sync merged code:", err);
            }
          }, 150);
        }
      } else {
        lastSyncedCodeRef.current = val;
      }

      // ONLY on initial room connection / room switch:
      if (!hasLoadedInitialRoomCode) {
        hasLoadedInitialRoomCode = true;
        setIsCodeLoaded(true);
        lastSyncedCodeRef.current = val || DEFAULT_CODE;
        setTimeout(() => {
          setIsJoiningRoomLoading(false);
        }, 400);
      }
    });

    // 2. Presence & Collaborators
    const unsubPresence = onValue(presenceRef, (snapshot) => {
      const data = snapshot.val() || {};
      setCollaborators(data);
    });

    // 3. Chat Messages (Efficient Query)
    const unsubChat = onValue(chatQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgList: ChatMessage[] = Object.entries(data).map(([key, val]: [string, any]) => ({
          id: key,
          ...val
        }));
        msgList.sort((a, b) => a.timestamp - b.timestamp);
        setChatMessages(msgList);

        // Check for new incoming message
        const lastMsg = msgList[msgList.length - 1];
        if (lastMsg && lastMsg.timestamp > joinTime && lastMsg.userId !== user.id) {
          if (!isChatOpenRef.current) {
            setUnreadChatCount((prev) => prev + 1);
            addToast(`Message from ${lastMsg.userName}`, lastMsg.text, undefined, 'text-amber-400');
          }
        }
      } else {
        setChatMessages([]);
      }
    });

    // 4. Output & Live Input Prompts
    const unsubOutput = onValue(outputRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setExecutionOutput(data);
        const isWaiting = !!data.waitingForInput && !data.isStopped;
        setWaitingForInput(isWaiting);
        setInputPrompt(isWaiting ? (data.inputPrompt || '') : '');
        activeInputRequestIdRef.current = isWaiting ? (data.currentInputRequestId || null) : null;

        // If execution was stopped or is no longer waiting for input, reject any local input promise immediately
        if ((!data.waitingForInput || data.isStopped) && activeInputRejecterRef.current) {
          try {
            activeInputRejecterRef.current(new Error("__PY_STOP_EXECUTION__"));
          } catch {}
          activeInputRejecterRef.current = null;
          activeInputResolverRef.current = null;
          activeInputRequestIdRef.current = null;
          setIsRunning(false);
          setPyStatus('ready');
        }

        if (data.timestamp && data.timestamp > joinTime && data.executedBy !== user.name) {
          addToast('Code Executed', `${data.executedBy} ran the Python code!`, undefined, 'text-emerald-400');
        }
      }
    });

    // 5. Terminal Entries Stream (Efficient Query)
    const unsubTerminal = onValue(terminalEntriesQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entries: TerminalEntry[] = Object.entries(data).map(([key, val]: [string, any]) => ({
          id: key,
          ...val
        }));
        entries.sort((a, b) => a.timestamp - b.timestamp);
        setTerminalEntries(entries);
      } else {
        setTerminalEntries([]);
      }
    });

    // 6. Room Packages (Preserved Forever & Synced to all participants)
    const unsubPackages = onValue(packagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data && typeof data === 'object') {
        setRoomPackages(data);
      } else {
        setRoomPackages({});
      }
    });

    // 7. Realtime Hand Raise Broadcast Listener
    const unsubHandRaise = onValue(handRaiseRef, (snapshot) => {
      const data = snapshot.val() as HandRaiseEvent | null;
      if (data && data.requestedBy !== user.id && Date.now() < data.activeUntil) {
        setActiveHandRaiseAlert(data);
        addToast(
          `✋ ${data.requestedByName} Raised Hand`,
          `Requested everyone to pause: "${data.message || 'I want to edit code.'}"`,
          undefined,
          'text-amber-400',
          6000
        );
      } else if (!data || (data && Date.now() >= data.activeUntil)) {
        setActiveHandRaiseAlert(null);
      }
    });

    // 8. Room File Download Broadcast Listener (All participants confirmation dialog)
    const fileDownloadRef = getRoomFileDownloadRef(roomId);
    const unsubFileDownload = onValue(fileDownloadRef, (snapshot) => {
      const data = snapshot.val() as FileDownloadEvent | null;
      if (data && data.id && !dismissedDownloadIdsRef.current.has(data.id)) {
        if (Date.now() - data.timestamp < 5 * 60 * 1000) {
          setActiveFileDownloadPrompt(data);
        }
      }
    });

    return () => {
      unsubCode();
      unsubPresence();
      unsubChat();
      unsubOutput();
      unsubTerminal();
      unsubPackages();
      unsubHandRaise();
      unsubFileDownload();
      removeUserPresence(roomId, user.id);
    };
  }, [hasJoinedRoom, roomId, isKicked, addToast]);

  // Auto-install and compile room packages for all participants
  useEffect(() => {
    if (!hasJoinedRoom || pyStatus !== 'ready' || isKicked) return;

    const packages: RoomPackage[] = Object.values(roomPackages || {});
    if (packages.length === 0) return;

    void import('./services/pyodide').then(({ isPackageLoadedLocally, installPipPackage }) => {
      packages.forEach(async (pkg: RoomPackage) => {
        const cleanName = pkg.name.trim();
        if (!cleanName) return;

        if (!isPackageLoadedLocally(cleanName) && !syncingPackagesRef.current.has(cleanName)) {
          syncingPackagesRef.current.add(cleanName);
          try {
            console.log(`[Pyodide] Auto-syncing package '${cleanName}' from room #${roomId}...`);
            await installPipPackage(cleanName, (msg) => {
              console.log(`[Pip Sync: ${cleanName}]`, msg);
            });
            addToast(
              'Room Package Ready',
              `Package '${cleanName}' synchronized & active for execution`,
              undefined,
              'text-emerald-400',
              3000
            );
          } catch (err: any) {
            console.warn(`[Pyodide] Failed to auto-install package '${cleanName}':`, err);
          } finally {
            syncingPackagesRef.current.delete(cleanName);
          }
        }
      });
    });
  }, [hasJoinedRoom, pyStatus, roomPackages, roomId, isKicked, addToast]);

  // Install package to room and local runtime
  const handleInstallRoomPackage = async (
    packageName: string, 
    onLog: (msg: string) => void
  ): Promise<boolean> => {
    registerActivity();
    const cleanName = packageName.trim();
    if (!cleanName || !roomId) return false;

    // 1. Install via micropip into local Pyodide runtime
    setPyStatus('loading');
    try {
      const { installPipPackage } = await import('./services/pyodide');
      await installPipPackage(cleanName, onLog);
      setPyStatus('ready');
    } catch (error) {
      setPyStatus('failed');
      throw error;
    }

    // 2. Persist package into room database permanently
    await addRoomPackage(roomId, cleanName, currentUser.name, currentUser.color);

    // 3. Log to room terminal stream so all participants are notified
    await appendTerminalEntry(roomId, {
      type: 'system',
      text: `📦 [Package Manager] ${currentUser.name} installed '${cleanName}' (synced & preserved in room #${roomId})`,
      timestamp: Date.now()
    });

    return true;
  };

  // Remove package from room persistent storage
  const handleRemoveRoomPackage = async (packageName: string) => {
    registerActivity();
    const cleanName = packageName.trim();
    if (!cleanName || !roomId) return;

    await removeRoomPackage(roomId, cleanName);

    await appendTerminalEntry(roomId, {
      type: 'system',
      text: `🗑️ [Package Manager] ${currentUser.name} removed '${cleanName}' from room #${roomId}`,
      timestamp: Date.now()
    });
  };

  // Code Change Handler (Local)
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    registerActivity();

    if (isRemoteUpdateRef.current || isKicked || !roomId) return;

    setSyncStatus('syncing');
    if (codeSyncDebounceRef.current) {
      clearTimeout(codeSyncDebounceRef.current);
    }
    codeSyncDebounceRef.current = setTimeout(async () => {
      try {
        await setRoomCode(roomId, newCode);
        lastSyncedCodeRef.current = newCode;
        setSyncStatus('synced');
      } catch (err) {
        console.error("Failed to sync code:", err);
        setSyncStatus('offline');
      }
    }, 150);
  };

  // Cursor Move Handler
  const lastBroadcastSelectionRef = useRef<{ start: number; end: number } | null>(null);
  const pendingCursorSelectionRef = useRef<{ start: number; end: number } | null>(null);
  const cursorSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    lastBroadcastSelectionRef.current = null;
    pendingCursorSelectionRef.current = null;
    return () => {
      if (cursorSyncTimerRef.current) {
        clearTimeout(cursorSyncTimerRef.current);
        cursorSyncTimerRef.current = null;
      }
    };
  }, [roomId, currentUser.id]);

  const handleCursorMove = (selection: { start: number; end: number }) => {
    if (isKicked || !roomId) return;
    registerActivity();
    const lastSelection = lastBroadcastSelectionRef.current;
    if (lastSelection?.start === selection.start && lastSelection.end === selection.end) {
      if (cursorSyncTimerRef.current) {
        clearTimeout(cursorSyncTimerRef.current);
        cursorSyncTimerRef.current = null;
      }
      pendingCursorSelectionRef.current = null;
      return;
    }
    const pendingSelection = pendingCursorSelectionRef.current;
    if (pendingSelection?.start === selection.start && pendingSelection.end === selection.end) return;
    pendingCursorSelectionRef.current = selection;
    if (cursorSyncTimerRef.current) return;

    cursorSyncTimerRef.current = setTimeout(() => {
      cursorSyncTimerRef.current = null;
      const pendingSelection = pendingCursorSelectionRef.current;
      pendingCursorSelectionRef.current = null;
      if (!pendingSelection || isKicked || !roomId) return;
      lastBroadcastSelectionRef.current = pendingSelection;
      void updateUserCursor(roomId, currentUser.id, pendingSelection);
    }, 100);
  };

  // Send Chat Message
  const handleSendChatMessage = async (text: string) => {
    if (isKicked || !roomId) return;
    registerActivity();
    await sendChatMessage(roomId, {
      userId: currentUser.id,
      userName: currentUser.name,
      userColor: currentUser.color,
      text,
      timestamp: Date.now()
    });
  };

  // Join or Create Room from Main Menu or Header Switcher
  const handleEnterRoom = (targetRoomId: string) => {
    const trimmed = targetRoomId.trim();
    if (!trimmed) return;
    setIsJoiningRoomLoading(true);
    setIsCodeLoaded(false);
    setRoomId(trimmed);
    setRoomInputValue(trimmed);
    setHasJoinedRoom(true);
    lastActivityTimeRef.current = Date.now();

    const newUrl = `${window.location.pathname}?room=${encodeURIComponent(trimmed)}`;
    window.history.replaceState(null, '', newUrl);
  };

  // Leave room and return to Main Menu
  const handleLeaveRoom = async () => {
    if (roomId) {
      await removeUserPresence(roomId, currentUser.id);
    }
    setHasJoinedRoom(false);
    setCollaborators({});
    setChatMessages([]);
    setTerminalEntries([]);
    setExecutionOutput(null);
    setWaitingForInput(false);
    window.history.replaceState(null, '', window.location.pathname);
  };

  // Switch Room from Header inline form
  const handleJoinRoom = () => {
    const trimmed = roomInputValue.trim();
    if (trimmed && trimmed !== roomId) {
      handleEnterRoom(trimmed);
      addToast('Room Changed', `Switched to room: ${trimmed}`, undefined, 'text-amber-400');
    }
  };

  // Copy Room Link
  const handleCopyRoomLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomId)}`;
    navigator.clipboard.writeText(url).then(() => {
      addToast('Link Copied', `Room link for '${roomId}' copied to clipboard!`, undefined, 'text-emerald-400');
    });
  };

  // Rejoin after kick
  const handleRejoin = () => {
    setIsKicked(false);
    lastActivityTimeRef.current = Date.now();
    setUserPresence(roomId, currentUser);
    addToast('Reconnected', `Rejoined room: ${roomId}`, undefined, 'text-emerald-400');
  };

  // Clear Terminal Output
  const handleClearOutput = async () => {
    registerActivity();
    if (!roomId) return;
    await clearTerminalEntries(roomId);
    await updateExecutionOutput(roomId, {
      output: '',
      result: '',
      isError: false,
      executedBy: currentUser.name,
      timestamp: Date.now()
    });
    setTerminalEntries([]);
  };

  // Submit Terminal Input (from Terminal Input Bar)
  const handleSubmitTerminalInput = async (inputText: string) => {
    registerActivity();
    if (!roomId) return;

    // 1. If Python is currently waiting for input() locally or remotely
    if (activeInputRequestIdRef.current) {
      const reqId = activeInputRequestIdRef.current;
      const currentPrompt = inputPrompt;

      // Optimistically reset waiting UI immediately so terminal is responsive
      setWaitingForInput(false);
      setInputPrompt('');

      // Submit response: writes input_line to terminal entries stream FIRST, then sets responseRef in RTDB
      await submitTerminalInputResponse(
        roomId,
        reqId,
        inputText,
        currentUser.name,
        currentUser.color,
        currentPrompt
      );

      // If local runner didn't resolve yet via RTDB listener, resolve directly if request matches
      if (activeInputResolverRef.current && activeInputRequestIdRef.current === reqId) {
        const resolver = activeInputResolverRef.current;
        activeInputResolverRef.current = null;
        activeInputRequestIdRef.current = null;
        resolver(inputText);
      }
    } else {
      // General terminal entry
      await appendTerminalEntry(roomId, {
        type: 'stdin',
        text: inputText,
        sender: currentUser.name,
        senderColor: currentUser.color,
        timestamp: Date.now()
      });
    }
  };

  // Force Stop Execution (Terminates running instance, clears input requests, resets state)
  const handleForceStop = async () => {
    if (!roomId) return;
    registerActivity();
    isStopRequestedRef.current = true;

    // 1. Immediately terminate active input or sleep rejecter to abort Python execution
    if (activeInputRejecterRef.current) {
      try {
        activeInputRejecterRef.current(new Error("__PY_STOP_EXECUTION__"));
      } catch {}
      activeInputRejecterRef.current = null;
    }
    if (activeSleepRejecterRef.current) {
      try {
        activeSleepRejecterRef.current();
      } catch {}
      activeSleepRejecterRef.current = null;
    }
    activeInputResolverRef.current = null;
    activeInputRequestIdRef.current = null;

    // 2. Set execution state to stopped locally immediately
    setIsRunning(false);
    setPyStatus('ready');
    setWaitingForInput(false);
    setInputPrompt('');

    // 3. Update Firebase output & broadcast system termination
    await updateExecutionOutput(roomId, {
      output: '⛔ [Execution was forcefully stopped]',
      result: '',
      isError: true,
      executedBy: currentUser.name,
      timestamp: Date.now(),
      waitingForInput: false,
      inputPrompt: '',
      currentInputRequestId: '',
      isStopped: true
    });

    await appendTerminalEntry(roomId, {
      type: 'system',
      text: `⛔ [Execution] Stopped forcefully by ${currentUser.name}`,
      timestamp: Date.now()
    });

    addToast(
      'Execution Stopped',
      'Python execution was forcefully terminated in 1 click.',
      undefined,
      'text-rose-400',
      3000
    );
  };

  // Raise Hand Handler (Requests other participants to stop running/waiting so user can edit)
  const handleRaiseHand = async () => {
    if (handRaiseCooldown > 0 || !roomId || isKicked) return;
    registerActivity();
    setHandRaiseCooldown(20);

    const event: HandRaiseEvent = {
      requestedBy: currentUser.id,
      requestedByName: currentUser.name,
      requestedByColor: currentUser.color,
      message: 'Please pause/stop execution so I can edit the code.',
      timestamp: Date.now(),
      activeUntil: Date.now() + 15000
    };

    await broadcastHandRaise(roomId, event);

    await appendTerminalEntry(roomId, {
      type: 'system',
      text: `✋ [Raise Hand] ${currentUser.name} requested everyone to pause/stop running because they want to edit the code.`,
      timestamp: Date.now()
    });

    addToast(
      'Hand Raised',
      'Requested everyone to pause execution while you edit (20s cooldown)',
      undefined,
      'text-amber-400',
      4000
    );
  };

  // Execute Python Code
  const handleRunCode = async () => {
    if (isRunning || pyStatus === 'loading' || isKicked || !roomId) return;
    registerActivity();
    isStopRequestedRef.current = false;
    setIsRunning(true);
    setPyStatus('loading');

    // Notify terminal stream
    await appendTerminalEntry(roomId, {
      type: 'system',
      text: `--- [${currentUser.name} started execution] ---`,
      timestamp: Date.now()
    });

    let runtimeInitialized = false;
    try {
      const pyodide = await import('./services/pyodide');
      await pyodide.getPyodideInstance();
      runtimeInitialized = true;
      setPyStatus('running');

      const result = await pyodide.executePythonCode({
        code,
        onStdout: (str: string) => {
          if (str.startsWith('__PY_TURTLE_DATA__:')) {
            try {
              const payload = JSON.parse(str.replace('__PY_TURTLE_DATA__:', '').trim());
              const title = payload.title || 'Turtle drawing';
              appendTerminalEntry(roomId, {
                type: 'plot',
                text: `[Turtle Drawing Generated: ${title}]`,
                plotUrl: `data:image/svg+xml;base64,${payload.svg}`,
                plotAnimationUrl: payload.animationSvg
                  ? `data:image/svg+xml;base64,${payload.animationSvg}`
                  : undefined,
                plotAnimationDuration: payload.animationDuration || 900,
                plotTitle: title,
                plotFormat: 'svg',
                plotSource: 'turtle',
                timestamp: Date.now()
              });
            } catch (err) {
              console.error('Error sharing Turtle drawing:', err);
            }
          } else if (str.startsWith('__PY_PLOT_DATA__:')) {
            const rawData = str.replace('__PY_PLOT_DATA__:', '').trim();
            let pngUrl = rawData;
            let pdfUrl: string | undefined = undefined;
            let title = `Plot ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
            try {
              const parsed = JSON.parse(rawData);
              if (parsed.png) pngUrl = parsed.png;
              if (parsed.pdf) pdfUrl = parsed.pdf;
              if (parsed.title) title = parsed.title;
            } catch {}

            appendTerminalEntry(roomId, {
              type: 'plot',
              text: `[Matplotlib Plot Generated: ${title}]`,
              plotUrl: pngUrl,
              plotPdfUrl: pdfUrl,
              plotTitle: title,
              plotFormat: 'png',
              plotSource: 'matplotlib',
              timestamp: Date.now()
            });
          } else if (str.startsWith('__PY_FILE_DOWNLOAD__:')) {
            const rawData = str.replace('__PY_FILE_DOWNLOAD__:', '').trim();
            try {
              const filePayload = JSON.parse(rawData);
              const downloadEvent: FileDownloadEvent = {
                id: 'dl_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
                filename: filePayload.filename || 'download.txt',
                fileSize: filePayload.fileSize || 0,
                mimeType: filePayload.mimeType || 'application/octet-stream',
                dataBase64: filePayload.dataBase64 || '',
                previewText: filePayload.previewText || '',
                triggeredBy: currentUser.name,
                timestamp: Date.now()
              };

              // Broadcast to all participants in the room via RTDB
              broadcastFileDownload(roomId, downloadEvent);

              // Add download entry in terminal output
              appendTerminalEntry(roomId, {
                type: 'download',
                text: `[File Ready for Download: ${downloadEvent.filename} (${(downloadEvent.fileSize / 1024).toFixed(1)} KB)]`,
                fileDownload: downloadEvent,
                timestamp: Date.now()
              });
            } catch (err) {
              console.error('Error broadcasting file download:', err);
            }
          } else {
            appendTerminalEntry(roomId, {
              type: 'stdout',
              text: str,
              timestamp: Date.now()
            });
          }
        },
        onStderr: (str: string) => {
          appendTerminalEntry(roomId, {
            type: 'stderr',
            text: str,
            timestamp: Date.now()
          });
        },
        onInputPrompt: async (promptText: string, requestId: string) => {
          if (isStopRequestedRef.current) {
            throw new Error("__PY_STOP_EXECUTION__");
          }

          // Broadcast waitingForInput state and active prompt to the room
          await updateExecutionOutput(roomId, {
            output: promptText,
            isError: false,
            executedBy: currentUser.name,
            timestamp: Date.now(),
            waitingForInput: true,
            inputPrompt: promptText,
            currentInputRequestId: requestId,
            isStopped: false
          });

          // Create a promise waiting for response either from local submit OR remote participant submit via RTDB
          return new Promise<string>((resolve, reject) => {
            activeInputResolverRef.current = resolve;
            activeInputRejecterRef.current = reject;
            activeInputRequestIdRef.current = requestId;

            if (isStopRequestedRef.current) {
              activeInputResolverRef.current = null;
              activeInputRejecterRef.current = null;
              activeInputRequestIdRef.current = null;
              reject(new Error("__PY_STOP_EXECUTION__"));
              return;
            }

            // Listen to RTDB response ref
            const responseRef = getRoomInputResponseRef(roomId, requestId);
            const unsub = onValue(responseRef, (snap) => {
              if (isStopRequestedRef.current) {
                unsub();
                off(responseRef);
                reject(new Error("__PY_STOP_EXECUTION__"));
                return;
              }
              const resp = snap.val();
              if (resp && resp.value !== undefined) {
                unsub();
                off(responseRef);
                if (activeInputRequestIdRef.current === requestId) {
                  activeInputResolverRef.current = null;
                  activeInputRejecterRef.current = null;
                  activeInputRequestIdRef.current = null;
                }
                resolve(resp.value);
              }
            });
          });
        },
        onSleep: (seconds: number) => {
          return new Promise<void>((resolve, reject) => {
            if (isStopRequestedRef.current) {
              reject(new Error("__PY_STOP_EXECUTION__"));
              return;
            }
            const ms = Math.max(0, Math.round(seconds * 1000));
            const timer = setTimeout(() => {
              activeSleepRejecterRef.current = null;
              resolve();
            }, ms);

            activeSleepRejecterRef.current = () => {
              clearTimeout(timer);
              reject(new Error("__PY_STOP_EXECUTION__"));
            };
          });
        }
      });

      if (isStopRequestedRef.current) {
        isStopRequestedRef.current = false;
        return;
      }

      // Update final execution output
      await updateExecutionOutput(roomId, {
        output: result.output,
        result: result.result,
        isError: result.isError,
        executedBy: currentUser.name,
        timestamp: Date.now(),
        waitingForInput: false,
        inputPrompt: '',
        currentInputRequestId: '',
        isStopped: false
      });

      setPyStatus(runtimeInitialized ? 'ready' : 'failed');
    } catch (err: any) {
      if (isStopRequestedRef.current) {
        isStopRequestedRef.current = false;
        return;
      }
      const errorMsg = err.message || String(err);
      if (errorMsg.includes("__PY_STOP_EXECUTION__") || errorMsg.includes("KeyboardInterrupt")) {
        isStopRequestedRef.current = false;
        return;
      }
      await updateExecutionOutput(roomId, {
        output: `Execution error: ${errorMsg}`,
        isError: true,
        executedBy: currentUser.name,
        timestamp: Date.now(),
        waitingForInput: false,
        inputPrompt: '',
        currentInputRequestId: '',
        isStopped: false
      });
      setPyStatus(runtimeInitialized ? 'ready' : 'failed');
    } finally {
      setIsRunning(false);
      setWaitingForInput(false);
      setInputPrompt('');
      activeSleepRejecterRef.current = null;
      isStopRequestedRef.current = false;
    }
  };

  // If user hasn't joined a room yet, render the Main Menu
  if (!hasJoinedRoom) {
    return (
      <MainMenu
        initialRoomNumber={roomId}
        isRoomInvite={isRoomInvite}
        userName={currentUser.name}
        userColor={currentUser.color}
        onUserNameChange={(newName) => setCurrentUser((prev) => ({ ...prev, name: newName }))}
        onUserColorChange={(newColor) => setCurrentUser((prev) => ({ ...prev, color: newColor }))}
        onJoinRoom={handleEnterRoom}
      />
    );
  }

  return (
    <Suspense fallback={<div className="h-[100dvh] w-full bg-slate-950" />}>
    <div className="bg-slate-950 text-slate-100 h-[100dvh] max-h-[100dvh] min-h-[100dvh] w-full flex flex-col font-sans overflow-hidden select-none relative pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} />

      {/* Hand Raise Broadcast Alert Banner for Collaborators */}
      {activeHandRaiseAlert && activeHandRaiseAlert.requestedBy !== currentUser.id && (
        <div className="bg-amber-950/95 border-b border-amber-500/60 px-3 sm:px-4 py-2 text-xs text-amber-200 flex items-center justify-between gap-2.5 z-40 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-amber-500 text-slate-950 p-1 rounded-full animate-bounce shrink-0 shadow">
              <Hand className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <span 
                style={{ color: activeHandRaiseAlert.requestedByColor || '#fbbf24' }} 
                className="font-bold mr-1.5"
              >
                {activeHandRaiseAlert.requestedByName}
              </span>
              <span className="text-amber-100 font-medium">
                raised their hand: "Please stop/pause execution so I can edit code."
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleForceStop}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer shadow"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Force Stop</span>
            </button>
            <button
              onClick={() => setActiveHandRaiseAlert(null)}
              title="Dismiss Alert"
              className="p-1 hover:bg-amber-900/60 text-amber-300 hover:text-white rounded-md transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header Navigation */}
      <Header
        pyStatus={pyStatus}
        roomId={roomId}
        roomInputValue={roomInputValue}
        onRoomInputChange={setRoomInputValue}
        onJoinRoom={handleJoinRoom}
        onCopyRoomLink={handleCopyRoomLink}
        collaborators={collaborators}
        currentUserId={currentUser.id}
        isChatOpen={isChatOpen}
        unreadChatCount={unreadChatCount}
        onToggleChat={() => {
          setIsChatOpen((prev) => !prev);
          setUnreadChatCount(0);
        }}
        onOpenPipModal={() => setIsPipModalOpen(true)}
        isRunning={isRunning}
        onRunCode={handleRunCode}
        onForceStop={handleForceStop}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        roomPackageCount={Object.keys(roomPackages).length}
        onRaiseHand={handleRaiseHand}
        handRaiseCooldown={handRaiseCooldown}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* Main Workspace Area */}
      <div data-view-mode={viewMode} className={`workspace-main flex-1 overflow-hidden relative min-h-0 w-full flex ${
        viewMode === 'split' 
          ? 'flex-col lg:flex-row' 
          : 'flex-col'
      }`}>
        {/* Python Code Editor Container (Persistently mounted) */}
        <div
          data-pane="editor"
          className={`workspace-pane overflow-hidden flex flex-col min-h-0 ${
            viewMode === 'editor'
              ? 'flex-1 min-h-0 w-full'
              : viewMode === 'split'
              ? 'flex-1 min-h-0 lg:w-1/2 w-full'
              : 'hidden'
          }`}
        >
          <CodeEditor
            code={code}
            onCodeChange={handleCodeChange}
            syncStatus={syncStatus}
            collaborators={collaborators}
            currentUserId={currentUser.id}
            onCursorMove={handleCursorMove}
            onRunCode={handleRunCode}
            isKicked={isKicked}
          />
        </div>

        {/* Interactive Shared Terminal Container (Persistently mounted) */}
        <div
          data-pane="terminal"
          className={`workspace-pane overflow-hidden flex flex-col min-h-0 ${
            viewMode === 'editor'
              ? 'shrink-0 w-full'
              : viewMode === 'split'
              ? 'flex-1 min-h-0 lg:w-1/2 w-full border-t lg:border-t-0 lg:border-l border-slate-800'
              : 'flex-1 min-h-0 w-full'
          }`}
        >
          <TerminalOutput
            executionOutput={executionOutput}
            terminalEntries={terminalEntries}
            waitingForInput={waitingForInput}
            inputPrompt={inputPrompt}
            onClearOutput={handleClearOutput}
            onSubmitTerminalInput={handleSubmitTerminalInput}
            currentUserName={currentUser.name}
            currentUserColor={currentUser.color}
            isKicked={isKicked}
            terminalViewMode={viewMode === 'editor' ? 'collapsed' : viewMode === 'terminal' ? 'expanded' : 'split'}
            onViewModeChange={(m) => setViewMode(m === 'collapsed' ? 'editor' : m === 'expanded' ? 'terminal' : 'split')}
            onRunCode={handleRunCode}
            isRunning={isRunning}
            onForceStop={handleForceStop}
          />
        </div>

        {/* Real-time Room Chat Panel Drawer */}
        <ChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={chatMessages}
          currentUserId={currentUser.id}
          onSendMessage={handleSendChatMessage}
        />
      </div>

      {/* Micropip Package Manager Modal */}
      <PipModal
        isOpen={isPipModalOpen}
        onClose={() => setIsPipModalOpen(false)}
        isKicked={isKicked}
        roomId={roomId}
        roomPackages={roomPackages}
        onInstallPackage={handleInstallRoomPackage}
        onRemovePackage={handleRemoveRoomPackage}
        onLogToast={addToast}
      />

      {/* Inactivity Kick Overlay Modal */}
      <KickModal
        isOpen={isKicked}
        roomId={roomId}
        onRejoin={handleRejoin}
      />

      {/* Full-screen Loading Screen for Room Joining Only */}
      <LoadingScreen
        isLoading={isJoiningRoomLoading}
        roomId={roomId}
        pyStatus={pyStatus}
        isCodeLoaded={isCodeLoaded}
      />

      {/* File Download Confirmation Modal for all participants */}
      <FileDownloadModal
        downloadEvent={activeFileDownloadPrompt}
        onClose={() => {
          if (activeFileDownloadPrompt) {
            dismissedDownloadIdsRef.current.add(activeFileDownloadPrompt.id);
          }
          setActiveFileDownloadPrompt(null);
        }}
      />
    </div>
    </Suspense>
  );
}
