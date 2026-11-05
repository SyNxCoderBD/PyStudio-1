import React, { useState } from 'react';
import { 
  Box, 
  Download, 
  X, 
  Loader2, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  ShieldCheck, 
  RefreshCw,
  Layers,
  Users
} from 'lucide-react';
import { RoomPackage } from '../types';
import { isPackageLoadedLocally } from '../services/pyodide';

interface PipModalProps {
  isOpen: boolean;
  onClose: () => void;
  isKicked: boolean;
  roomId: string;
  roomPackages: Record<string, RoomPackage>;
  onInstallPackage: (packageName: string, onLog: (msg: string) => void) => Promise<boolean>;
  onRemovePackage: (packageName: string) => Promise<void>;
  onLogToast?: (title: string, msg: string) => void;
}

const POPULAR_PACKAGES = [
  'turtle', 'colorama', 'termcolor', 'rich', 'numpy', 'sympy', 'pandas', 'matplotlib', 'colored', 'pyfiglet', 'scipy', 'requests'
];

export const PipModal: React.FC<PipModalProps> = ({ 
  isOpen, 
  onClose, 
  isKicked, 
  roomId,
  roomPackages,
  onInstallPackage,
  onRemovePackage,
  onLogToast 
}) => {
  const [pkgName, setPkgName] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [removingPkg, setRemovingPkg] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([
    'Micropip package synchronization service active.',
    `Room #${roomId} persistent storage connected.`
  ]);

  if (!isOpen) return null;

  const appendLog = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
  };

  const handleInstall = async (targetPkg?: string) => {
    const pkgToInstall = (targetPkg || pkgName).trim();
    if (!pkgToInstall || isInstalling || isKicked) return;

    setIsInstalling(true);
    appendLog(`\n> Requesting package installation for '${pkgToInstall}'...`);

    try {
      await onInstallPackage(pkgToInstall, appendLog);
      appendLog(`✓ Package '${pkgToInstall}' is now active and preserved in room #${roomId}!`);
      if (onLogToast) {
        onLogToast('Room Package Saved', `'${pkgToInstall}' is preserved for all participants in #${roomId}`);
      }
      if (!targetPkg) setPkgName('');
    } catch (err: any) {
      appendLog(`✗ Error installing '${pkgToInstall}': ${err.message || String(err)}`);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleRemove = async (packageName: string) => {
    if (isKicked || removingPkg) return;
    try {
      setRemovingPkg(packageName);
      appendLog(`> Removing package '${packageName}' from room storage...`);
      await onRemovePackage(packageName);
      appendLog(`✓ Package '${packageName}' removed from room.`);
      if (onLogToast) {
        onLogToast('Package Removed', `'${packageName}' removed from room #${roomId}`);
      }
    } catch (err: any) {
      appendLog(`✗ Failed to remove package: ${err.message || String(err)}`);
    } finally {
      setRemovingPkg(null);
    }
  };

  const packagesList: RoomPackage[] = Object.values(roomPackages || {});

  return (
    <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="neu-raised border border-slate-800 rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl space-y-4 max-h-[calc(100dvh-1.5rem)] sm:max-h-[90dvh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
                Room Package Manager (Pip)
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Room <span className="text-amber-400 font-semibold">#{roomId}</span> • Persistent WASM Environment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Preservation Banner */}
        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-start gap-2.5 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-emerald-200 block">
              Permanent Room Synchronization
            </span>
            <p className="text-[11px] text-emerald-300/80 leading-relaxed">
              Pyodide packages and compatible pure-Python wheels sync to everyone in this room. Turtle graphics run in the browser and sync as shared drawings; other native extensions need WebAssembly builds.
            </p>
          </div>
        </div>

        {/* Scrollable Middle Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          
          {/* Section: Installed Room Packages */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Preserved Room Packages ({packagesList.length})
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Auto-syncing to all peers
              </span>
            </div>

            {packagesList.length === 0 ? (
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 text-center text-xs text-slate-400">
                <p>No custom packages installed in this room yet.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Install a library below and it will be permanently attached to room <span className="font-mono text-slate-400">#{roomId}</span>.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                {packagesList.map((pkg) => {
                  const isLoaded = isPackageLoadedLocally(pkg.name);
                  const isRemoving = removingPkg === pkg.name;

                  return (
                    <div 
                      key={pkg.name}
                      className="flex items-center justify-between bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="font-mono font-bold text-amber-300 truncate">
                          {pkg.name}
                        </span>
                        <span className="text-[10px] text-slate-400 hidden sm:inline truncate">
                          by <span style={{ color: pkg.installedByColor || '#cbd5e1' }} className="font-semibold">{pkg.installedBy || 'Collaborator'}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isLoaded ? (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Ready
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleInstall(pkg.name)}
                            disabled={isInstalling}
                            className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Sync now
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemove(pkg.name)}
                          disabled={isRemoving || isKicked}
                          title="Remove from room"
                          className="text-slate-500 hover:text-rose-400 p-1 hover:bg-rose-500/10 rounded transition cursor-pointer"
                        >
                          {isRemoving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Add Popular Packages */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Quick Add Popular Libraries:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_PACKAGES.map((pkg) => {
                const isAlreadyInRoom = !!roomPackages[pkg.toLowerCase().replace(/[^a-z0-9_-]/g, '_')];
                return (
                  <button
                    key={pkg}
                    type="button"
                    disabled={isInstalling || isAlreadyInRoom}
                    onClick={() => handleInstall(pkg)}
                    className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition cursor-pointer disabled:cursor-not-allowed ${
                      isAlreadyInRoom
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30 opacity-80'
                        : 'bg-slate-800/80 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/40 text-slate-300 border-slate-700'
                    }`}
                  >
                    {isAlreadyInRoom ? `✓ ${pkg}` : `+ ${pkg}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Package Form */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-semibold block">
              Install Custom Package to Room:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pkgName}
                onChange={(e) => setPkgName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInstall();
                }}
                placeholder="e.g. sympy, regex, requests-mock, mpmath"
                disabled={isInstalling}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs md:text-sm text-slate-200 focus:outline-none focus:border-amber-500 font-mono placeholder:text-slate-600"
              />
              <button
                onClick={() => handleInstall()}
                disabled={isInstalling || !pkgName.trim()}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md shadow-amber-500/20"
              >
                {isInstalling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Installing
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" /> Install to Room
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Installation & Sync Logs */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>Sync Log Output:</span>
              <button
                type="button"
                onClick={() => setLogs(['Cleared logs.'])}
                className="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                Clear
              </button>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 code-font text-[11px] text-slate-300 h-28 overflow-y-auto whitespace-pre-wrap select-text font-mono">
              {logs.map((line, idx) => (
                <div
                  key={idx}
                  className={
                    line.includes('✓')
                      ? 'text-emerald-400 font-medium'
                      : line.includes('✗')
                      ? 'text-rose-400'
                      : line.startsWith('>')
                      ? 'text-amber-300 font-semibold'
                      : 'text-slate-400'
                  }
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
