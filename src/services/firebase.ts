import { initializeApp, getApps } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  set, 
  onValue, 
  push, 
  onDisconnect, 
  remove, 
  get, 
  query, 
  limitToLast,
  off,
  update
} from 'firebase/database';
import { UserPresence, ChatMessage, ExecutionOutput, TerminalEntry, RoomPackage, HandRaiseEvent, FileDownloadEvent } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyAmdzmJa23bpeVdBBxnzbLHBtiuu5gGBAI",
  authDomain: "mydatabase100-d45ff.firebaseapp.com",
  databaseURL: "https://mydatabase100-d45ff-default-rtdb.firebaseio.com",
  projectId: "mydatabase100-d45ff",
  storageBucket: "mydatabase100-d45ff.appstorage.com",
  messagingSenderId: "995667612707",
  appId: "1:995667612707:web:6843132a481e76808a4d96",
  measurementId: "G-TNXWZ6F3CW"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const rtdb = getDatabase(app);

export function getRoomCodeRef(roomId: string) {
  return ref(rtdb, `rooms/${roomId}/code`);
}

export function getRoomPresenceRef(roomId: string) {
  return ref(rtdb, `rooms/${roomId}/presence`);
}

export function getRoomChatRef(roomId: string) {
  return ref(rtdb, `rooms/${roomId}/chat`);
}

export function getRoomChatQuery(roomId: string, limit = 80) {
  return query(ref(rtdb, `rooms/${roomId}/chat`), limitToLast(limit));
}

export function getRoomOutputRef(roomId: string) {
  return ref(rtdb, `rooms/${roomId}/output`);
}

export function getRoomTerminalEntriesRef(roomId: string) {
  return ref(rtdb, `rooms/${roomId}/terminal_entries`);
}

export function getRoomTerminalEntriesQuery(roomId: string, limit = 100) {
  return query(ref(rtdb, `rooms/${roomId}/terminal_entries`), limitToLast(limit));
}

export function getRoomInputResponseRef(roomId: string, requestId: string) {
  return ref(rtdb, `rooms/${roomId}/terminal_inputs/${requestId}`);
}

export async function setRoomCode(roomId: string, code: string) {
  const codeRef = getRoomCodeRef(roomId);
  return set(codeRef, code);
}

export async function setUserPresence(roomId: string, user: UserPresence) {
  const userRef = ref(rtdb, `rooms/${roomId}/presence/${user.id}`);
  await set(userRef, user);
  onDisconnect(userRef).remove();
}

export async function removeUserPresence(roomId: string, userId: string) {
  const userRef = ref(rtdb, `rooms/${roomId}/presence/${userId}`);
  return remove(userRef);
}

export async function updateUserCursor(roomId: string, userId: string, selection: { start: number; end: number }) {
  const cursorRef = ref(rtdb, `rooms/${roomId}/presence/${userId}/cursor`);
  return set(cursorRef, {
    pos: selection.start,
    selectionStart: selection.start,
    selectionEnd: selection.end,
    updatedAt: Date.now()
  });
}

export async function sendChatMessage(roomId: string, message: Omit<ChatMessage, 'id'>) {
  const chatRef = getRoomChatRef(roomId);
  return push(chatRef, message);
}

export async function updateExecutionOutput(roomId: string, outputData: Partial<ExecutionOutput>) {
  const outputRef = getRoomOutputRef(roomId);
  return update(outputRef, outputData);
}

export async function appendTerminalEntry(roomId: string, entry: Omit<TerminalEntry, 'id'>) {
  const entriesRef = getRoomTerminalEntriesRef(roomId);
  return push(entriesRef, {
    ...entry,
    timestamp: Date.now()
  });
}

export async function clearTerminalEntries(roomId: string) {
  const entriesRef = getRoomTerminalEntriesRef(roomId);
  return set(entriesRef, null);
}

export async function submitTerminalInputResponse(
  roomId: string, 
  requestId: string, 
  inputText: string, 
  submittedBy: string,
  userColor?: string,
  promptText?: string
) {
  // 1. Log unified interactive input line entry to terminal stream FIRST
  // This guarantees chronological consistency before subsequent output/print statements
  const prompt = promptText || '';
  await appendTerminalEntry(roomId, {
    type: 'input_line',
    text: prompt ? `${prompt}${inputText}` : inputText,
    promptText: prompt,
    inputValue: inputText,
    sender: submittedBy,
    senderColor: userColor,
    timestamp: Date.now()
  });

  // 2. Set response value in RTDB to resume the input promise
  const responseRef = getRoomInputResponseRef(roomId, requestId);
  await set(responseRef, {
    value: inputText,
    submittedBy,
    timestamp: Date.now()
  });
}

export function getRoomPackagesRef(roomId: string) {
  return ref(rtdb, `rooms/${roomId}/packages`);
}

export function getRoomPackageRef(roomId: string, pkgKey: string) {
  return ref(rtdb, `rooms/${roomId}/packages/${pkgKey}`);
}

export async function addRoomPackage(
  roomId: string,
  pkgName: string,
  installedBy: string,
  installedByColor?: string
): Promise<RoomPackage> {
  const cleanName = pkgName.trim();
  const safeKey = cleanName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const pkgRef = getRoomPackageRef(roomId, safeKey);
  const pkgData: RoomPackage = {
    name: cleanName,
    installedBy,
    installedByColor,
    installedAt: Date.now()
  };
  await set(pkgRef, pkgData);
  return pkgData;
}

export async function removeRoomPackage(roomId: string, pkgName: string) {
  const cleanName = pkgName.trim();
  const safeKey = cleanName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const pkgRef = getRoomPackageRef(roomId, safeKey);
  return remove(pkgRef);
}

export function getRoomHandRaiseRef(roomId: string) {
  return ref(rtdb, `rooms/${roomId}/hand_raise`);
}

export async function broadcastHandRaise(roomId: string, event: HandRaiseEvent) {
  const handRef = getRoomHandRaiseRef(roomId);
  return set(handRef, event);
}

export async function clearHandRaise(roomId: string) {
  const handRef = getRoomHandRaiseRef(roomId);
  return set(handRef, null);
}

export function getRoomFileDownloadRef(roomId: string) {
  return ref(rtdb, `rooms/${roomId}/latest_file_download`);
}

export async function broadcastFileDownload(roomId: string, event: FileDownloadEvent) {
  const fileRef = getRoomFileDownloadRef(roomId);
  return set(fileRef, event);
}

export async function clearFileDownload(roomId: string) {
  const fileRef = getRoomFileDownloadRef(roomId);
  return set(fileRef, null);
}

