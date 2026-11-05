export interface UserPresence {
  id: string;
  name: string;
  color: string;
  cursor?: {
    pos: number;
    selectionStart?: number;
    selectionEnd?: number;
    updatedAt: number;
  };
  online: boolean;
  lastActive?: number;
}

export interface ChatMessage {
  id?: string;
  userId: string;
  userName: string;
  userColor: string;
  text: string;
  timestamp: number;
}

export interface TerminalEntry {
  id?: string;
  type: 'stdout' | 'stderr' | 'stdin' | 'prompt' | 'input_line' | 'system' | 'result' | 'plot' | 'download' | 'file_download';
  text: string;
  plotUrl?: string;
  plotAnimationUrl?: string;
  plotAnimationDuration?: number;
  plotPdfUrl?: string;
  plotTitle?: string;
  plotFormat?: 'png' | 'svg';
  plotSource?: 'matplotlib' | 'turtle';
  fileDownload?: {
    filename: string;
    fileSize: number;
    mimeType: string;
    dataBase64?: string;
    dataUrl?: string;
    previewText?: string;
    triggeredBy?: string;
    generatedBy?: string;
  };
  promptText?: string;
  inputValue?: string;
  sender?: string;
  senderColor?: string;
  timestamp: number;
}

export interface ExecutionOutput {
  output: string;
  result?: string;
  isError: boolean;
  executedBy: string;
  timestamp: number;
  waitingForInput?: boolean;
  inputPrompt?: string;
  currentInputRequestId?: string;
  isStopped?: boolean;
}

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  iconClass?: string;
  iconColorClass?: string;
  duration?: number;
}

export interface RoomPackage {
  id?: string;
  name: string;
  installedBy: string;
  installedByColor?: string;
  installedAt: number;
}

export interface HandRaiseEvent {
  id?: string;
  requestedBy: string;
  requestedByName: string;
  requestedByColor?: string;
  message?: string;
  timestamp: number;
  activeUntil: number;
}

export interface SyntaxErrorInfo {
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  message: string;
  errorType: string;
  text?: string;
}

export interface FileDownloadEvent {
  id?: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  dataBase64?: string;
  dataUrl?: string;
  previewText?: string;
  triggeredBy?: string;
  generatedBy?: string;
  generatedByColor?: string;
  timestamp: number;
}


