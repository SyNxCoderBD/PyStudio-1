import React from 'react';
import { Download, FileText, X, HardDrive, Eye } from 'lucide-react';
import { FileDownloadEvent } from '../types';

interface FileDownloadModalProps {
  downloadEvent: FileDownloadEvent | null;
  onClose: () => void;
}

export const FileDownloadModal: React.FC<FileDownloadModalProps> = ({
  downloadEvent,
  onClose
}) => {
  if (!downloadEvent) return null;

  const sizeFormatted = downloadEvent.fileSize < 1024 * 1024
    ? `${(downloadEvent.fileSize / 1024).toFixed(1)} KB`
    : `${(downloadEvent.fileSize / (1024 * 1024)).toFixed(2)} MB`;

  const handleDownload = () => {
    let downloadUrl = downloadEvent.dataUrl;
    if (!downloadUrl && downloadEvent.dataBase64) {
      downloadUrl = `data:${downloadEvent.mimeType || 'application/octet-stream'};base64,${downloadEvent.dataBase64}`;
    }
    if (!downloadUrl) return;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = downloadEvent.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 overflow-y-auto animate-in fade-in duration-200">
      <div className="neu-raised border border-slate-700/80 rounded-2xl max-w-md w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-slate-800/80 px-5 py-4 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-slate-100 font-semibold text-sm">
                Download File
              </h3>
              <p className="text-slate-400 text-xs font-mono">
                Triggered by <span className="text-amber-300 font-semibold">{downloadEvent.triggeredBy || 'Participant'}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
            <div className="p-2.5 bg-slate-800/80 border border-slate-700/60 rounded-lg text-emerald-400 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-slate-100 font-mono font-bold text-sm truncate" title={downloadEvent.filename}>
                {downloadEvent.filename}
              </div>
              <div className="text-slate-400 text-xs font-mono flex items-center gap-2 mt-0.5">
                <span>{sizeFormatted}</span>
                <span>•</span>
                <span className="text-slate-500 truncate max-w-[150px]">{downloadEvent.mimeType}</span>
              </div>
            </div>
          </div>

          {/* Text Preview if available */}
          {downloadEvent.previewText && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                <span>File Preview</span>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap select-text">
                {downloadEvent.previewText}
                {downloadEvent.fileSize > 1200 && (
                  <span className="text-slate-500 italic block mt-1">... [truncated]</span>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400 leading-relaxed">
            Would you like to save this file to your device?
          </p>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-800/50 px-5 py-3.5 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            Dismiss
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-xs font-mono flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download ({sizeFormatted})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
