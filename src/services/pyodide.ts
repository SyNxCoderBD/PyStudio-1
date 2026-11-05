// Pyodide WebAssembly Python Runtime Service with Collaborative Interactive Terminal Input & Rich ANSI Color Output

declare global {
  interface Window {
    loadPyodide?: (config: {
      stdout?: (text: string) => void;
      stderr?: (text: string) => void;
    }) => Promise<any>;
    __py_interactive_input_handler?: (prompt: string) => Promise<string>;
    __py_realtime_sleep_handler?: (seconds: number) => Promise<string | void>;
    pyodideInstance?: any;
  }
}

import { SyntaxErrorInfo } from '../types';
import { formatPythonTraceback } from '../utils/formatError';
import { BROWSER_TURTLE_BOOTSTRAP } from './browserTurtle';
import type { AutocompleteItem } from '../utils/pythonAutocomplete';

export type PyodideStatus = 'idle' | 'loading' | 'ready' | 'running' | 'failed';

let pyodideInstance: any = null;
let isInitializing = false;
let initPromise: Promise<any> | null = null;
const locallyInstalledPackages = new Set<string>();
const runtimeModuleMemberCache = new Map<string, AutocompleteItem[]>();

function isStandardLibraryModule(py: any, moduleName: string): boolean {
  try {
    return Boolean(py.globals.get('__is_stdlib_module')(moduleName));
  } catch {
    return false;
  }
}

function patchWebPackage(py: any, packageName: string): void {
  if (packageName.toLowerCase() === 'colorama') {
    try {
      py.runPython('_patch_colorama()');
    } catch {}
  }
  if (packageName.toLowerCase() === 'matplotlib') {
    try {
      py.runPython('_setup_matplotlib_support()');
    } catch {}
  }
}

function packageInstallError(packageName: string, error: any): Error {
  const message = error?.message || String(error);
  if (/Unsupported content type|text\/plain|404/i.test(message)) {
    return new Error(
      `No compatible PyPI wheel was found for '${packageName}'. Browser Python supports pure-Python packages and WebAssembly-compatible wheels; native packages must be available from the Pyodide package index.`
    );
  }
  return new Error(message);
}

export function isPackageLoadedLocally(packageName: string): boolean {
  return locallyInstalledPackages.has(packageName.toLowerCase().trim());
}

export function markPackageLoadedLocally(packageName: string): void {
  locallyInstalledPackages.add(packageName.toLowerCase().trim());
}

export function getLoadedPackagesLocally(): string[] {
  return Array.from(locallyInstalledPackages);
}

export function getRuntimeModuleAutocomplete(modulePath: string, memberPrefix: string): AutocompleteItem[] | null {
  if (!pyodideInstance) return null;

  try {
    let members = runtimeModuleMemberCache.get(modulePath);
    if (!members) {
      const getMembers = pyodideInstance.globals.get('__get_module_completions');
      if (!getMembers) return null;
      const serialized = getMembers(modulePath);
      members = JSON.parse(serialized) as AutocompleteItem[];
      if (members.length > 0) {
        runtimeModuleMemberCache.set(modulePath, members);
      }
    }

    const prefix = memberPrefix.toLowerCase();
    return members.filter((member) =>
      member.label.toLowerCase().startsWith(prefix) && member.label.toLowerCase() !== prefix
    );
  } catch {
    return null;
  }
}

export async function getPyodideInstance(
  onStdout?: (text: string) => void,
  onStderr?: (text: string) => void
): Promise<any> {
  if (pyodideInstance) {
    return pyodideInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    isInitializing = true;
    try {
      // Ensure pyodide script is loaded dynamically without blocking the main parser
      if (typeof window.loadPyodide !== 'function') {
        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector('script[src*="pyodide.js"]') as HTMLScriptElement;
          if (existing) {
            if (typeof window.loadPyodide === 'function') return resolve();
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error('Failed to load Pyodide CDN script')));
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Pyodide CDN script'));
          document.head.appendChild(script);
        });
      }

      // Yield to the event loop so UI paints and animations stay smooth
      await new Promise((r) => setTimeout(r, 60));

      pyodideInstance = await window.loadPyodide!({
        stdout: onStdout || ((text) => console.log('[Py Stdout]:', text)),
        stderr: onStderr || ((text) => console.error('[Py Stderr]:', text))
      });

      // Yield again
      await new Promise((r) => setTimeout(r, 60));

      // Pre-load micropip for package management
      await pyodideInstance.loadPackage('micropip');

      // Yield again
      await new Promise((r) => setTimeout(r, 60));

      // Initialize Python async input bridge, environment variables, TTY emulation, ANSI color support & Matplotlib integration
      await pyodideInstance.runPythonAsync(`
import sys
import os
import ast
import js
import asyncio
import io
import base64

def __is_stdlib_module(name):
  return name.split('.')[0] in sys.stdlib_module_names

def __get_module_completions(module_path):
  import importlib
  import inspect
  import json
  try:
    target = importlib.import_module(module_path)
  except Exception:
    return '[]'
  suggestions = []
  for name in dir(target):
    if name.startswith('_'):
      continue
    try:
      value = getattr(target, name)
    except Exception:
      continue
    if inspect.ismodule(value):
      kind = 'module'
    elif inspect.isclass(value):
      kind = 'class'
    elif callable(value):
      kind = 'function'
    else:
      kind = 'constant' if name.isupper() else 'variable'
    detail = f'{module_path}.{name}'
    if kind == 'function':
      try:
        detail = f'{name}{inspect.signature(value)}'
      except Exception:
        pass
    doc = inspect.getdoc(value) or ''
    suggestions.append({
      'label': name,
      'insertText': name,
      'kind': kind,
      'detail': detail[:180],
      'doc': doc.splitlines()[0][:240] if doc else ''
    })
    if len(suggestions) >= 500:
      break
  return json.dumps(suggestions)

# 1. Configure standard environment variables for full ANSI & TrueColor terminal support
os.environ["TERM"] = "xterm-256color"
os.environ["COLORTERM"] = "truecolor"
os.environ["FORCE_COLOR"] = "1"
os.environ["CLICOLOR"] = "1"
os.environ["CLICOLOR_FORCE"] = "1"
os.environ["PYTHONUNBUFFERED"] = "1"
os.environ["MPLBACKEND"] = "Agg"

# 2. Ensure sys.stdout and sys.stderr identify as interactive TTY so colorama, termcolor, rich, etc. output full ANSI codes
try:
    if hasattr(sys.stdout, 'isatty'):
        sys.stdout.isatty = lambda: True
    else:
        type(sys.stdout).isatty = lambda self: True
except Exception:
    pass

try:
    if hasattr(sys.stderr, 'isatty'):
        sys.stderr.isatty = lambda: True
    else:
        type(sys.stderr).isatty = lambda self: True
except Exception:
    pass

# 3. Patch colorama if and when it is imported so it never strips ANSI codes in this browser environment
def _patch_colorama():
    try:
        import colorama
        import colorama.initialise
        if not getattr(colorama, '_is_web_patched', False):
            orig_init = colorama.initialise.init
            def _web_colorama_init(*args, **kwargs):
                # Always preserve ANSI escape sequences for web rendering
                if 'strip' not in kwargs or kwargs['strip'] is None:
                    kwargs['strip'] = False
                if 'convert' not in kwargs or kwargs['convert'] is None:
                    kwargs['convert'] = False
                if 'wrap' not in kwargs or kwargs['wrap'] is None:
                    kwargs['wrap'] = True
                return orig_init(*args, **kwargs)
            colorama.initialise.init = _web_colorama_init
            colorama.init = _web_colorama_init
            colorama._is_web_patched = True
    except Exception:
        pass

# 4. Patch and configure Matplotlib for responsive, high-resolution rendering
def _setup_matplotlib_support():
    try:
        import matplotlib
        matplotlib.use('Agg', force=True)
        import matplotlib.pyplot as plt
        
        # Configure crisp styling and autolayout
        try:
            plt.rcParams['figure.autolayout'] = True
            plt.rcParams['figure.dpi'] = 160
            plt.rcParams['savefig.dpi'] = 160
        except Exception:
            pass

        def _custom_show(*args, **kwargs):
            _flush_matplotlib_figures()

        plt.show = _custom_show
    except Exception:
        pass

def _flush_matplotlib_figures():
    try:
        import matplotlib.pyplot as plt
        import json
        fignums = plt.get_fignums()
        if not fignums:
            return
        for num in fignums:
            try:
                fig = plt.figure(num)
                facecolor = fig.get_facecolor()
                
                # Render PNG
                buf_png = io.BytesIO()
                fig.savefig(buf_png, format='png', bbox_inches='tight', dpi=160, facecolor=facecolor, edgecolor='none')
                buf_png.seek(0)
                b64_png = base64.b64encode(buf_png.read()).decode('utf-8')
                png_url = f"data:image/png;base64,{b64_png}"

                # Render PDF
                buf_pdf = io.BytesIO()
                fig.savefig(buf_pdf, format='pdf', bbox_inches='tight', facecolor=facecolor, edgecolor='none')
                buf_pdf.seek(0)
                b64_pdf = base64.b64encode(buf_pdf.read()).decode('utf-8')
                pdf_url = f"data:application/pdf;base64,{b64_pdf}"

                # Extract figure title if set
                fig_title = f"Figure {num}"
                try:
                    suptitle = getattr(fig, '_suptitle', None)
                    if suptitle and getattr(suptitle, 'get_text', None):
                        t = suptitle.get_text().strip()
                        if t: fig_title = t
                except Exception:
                    pass
                if fig_title == f"Figure {num}":
                    try:
                        axes = fig.get_axes()
                        if axes and len(axes) > 0 and getattr(axes[0], 'get_title', None):
                            t = axes[0].get_title().strip()
                            if t: fig_title = t
                    except Exception:
                        pass

                payload = {
                    "png": png_url,
                    "pdf": pdf_url,
                    "title": fig_title
                }
                print(f"__PY_PLOT_DATA__:{json.dumps(payload)}")
            except Exception as fig_err:
                print(f"[Matplotlib render error]: {fig_err}")
        plt.close('all')
    except Exception:
        pass

# 5. File Download and Virtual FS generation tracking
_emitted_download_files = set()

def _scan_pyodide_workspace_files():
    import os
    res = {}
    try:
        for fname in os.listdir('.'):
            if fname.startswith('.') or fname.startswith('__') or os.path.isdir(fname):
                continue
            try:
                stat = os.stat(fname)
                res[fname] = (stat.st_mtime, stat.st_size)
            except Exception:
                pass
    except Exception:
        pass
    return res

def _emit_file_download_payload(filepath):
    import os
    import base64
    import json
    import mimetypes
    fn = str(filepath).strip()
    if not os.path.exists(fn) or os.path.isdir(fn):
        return
    try:
        with open(fn, 'rb') as f:
            data_bytes = f.read()
        
        # Leave room for base64 expansion and Firebase record metadata.
        if len(data_bytes) > 10 * 1024 * 1024:
            print(f"[Download notice]: File '{fn}' is {len(data_bytes)/1024/1024:.1f}MB, exceeds 10MB download broadcast limit.")
            return

        b64 = base64.b64encode(data_bytes).decode('utf-8')
        mime = mimetypes.guess_type(fn)[0] or 'application/octet-stream'
        preview = ""
        try:
            preview = data_bytes[:1200].decode('utf-8', errors='ignore')
        except Exception:
            pass

        payload = {
            "filename": os.path.basename(fn),
            "fileSize": len(data_bytes),
            "mimeType": mime,
            "dataBase64": b64,
            "previewText": preview
        }
        print(f"__PY_FILE_DOWNLOAD__:{json.dumps(payload)}")
    except Exception as err:
        print(f"[File download error for '{fn}']: {err}")

def download_file(filename, content=None):
    """
    Save content to a file (or use an existing file) and prompt all room participants to download it.
    Example:
        download_file('results.txt', 'Analysis Output')
        download_file('dataset.csv')
    """
    import os
    fn = str(filename).strip()
    if content is not None:
        if isinstance(content, str):
            with open(fn, 'w', encoding='utf-8') as f:
                f.write(content)
        elif isinstance(content, (bytes, bytearray)):
            with open(fn, 'wb') as f:
                f.write(content)
    if not os.path.exists(fn):
        raise FileNotFoundError(f"File '{fn}' does not exist.")
    _emit_file_download_payload(fn)
    _emitted_download_files.add(os.path.abspath(fn))
    return fn

download = download_file

def _check_and_emit_generated_files(before_snapshot):
    import os
    after_snapshot = _scan_pyodide_workspace_files()
    for fname, after_info in after_snapshot.items():
        abs_path = os.path.abspath(fname)
        if abs_path in _emitted_download_files:
            continue
        before_info = before_snapshot.get(fname)
        if before_info is None or before_info != after_info:
            _emit_file_download_payload(fname)
            _emitted_download_files.add(abs_path)


async def _custom_py_sleep(seconds=0):
    try:
        sec = float(seconds)
        if sec < 0:
            raise ValueError("sleep length must be non-negative")
        # Call JS Promise sleep handler directly
        res = await js.window.__py_realtime_sleep_handler(sec)
        if res == "__PY_STOP_EXECUTION__":
            raise KeyboardInterrupt("Execution stopped by user")
    except Exception as e:
        if "__PY_STOP_EXECUTION__" in str(e) or "KeyboardInterrupt" in str(e) or "cancelled" in str(e).lower():
            raise KeyboardInterrupt("Execution stopped by user")
        raise e

async def _custom_py_input(prompt_text=""):
    prompt_str = str(prompt_text)
    # Call JS Promise handler directly
    try:
        res = await js.window.__py_interactive_input_handler(prompt_str)
        if res == "__PY_STOP_EXECUTION__" or res is None:
            raise KeyboardInterrupt("Execution stopped by user")
        return str(res)
    except Exception as e:
        if "__PY_STOP_EXECUTION__" in str(e) or "KeyboardInterrupt" in str(e) or "cancelled" in str(e).lower():
            raise KeyboardInterrupt("Execution stopped by user")
        raise e

class _AsyncExecutionTransformer(ast.NodeTransformer):
    def __init__(self, time_modules, sleep_names, async_functions):
        super().__init__()
        self.time_modules = time_modules
        self.sleep_names = sleep_names
        self.async_functions = async_functions

    def is_sleep_call(self, node):
        if not isinstance(node, ast.Call):
            return False
        if isinstance(node.func, ast.Attribute):
            if node.func.attr == 'sleep' and isinstance(node.func.value, ast.Name):
                return node.func.value.id in self.time_modules
        elif isinstance(node.func, ast.Name):
            if node.func.id in self.sleep_names or node.func.id == 'sleep':
                return True
        return False

    def is_input_call(self, node):
        if not isinstance(node, ast.Call):
            return False
        return isinstance(node.func, ast.Name) and node.func.id == 'input'

    def is_async_func_call(self, node):
        if not isinstance(node, ast.Call):
            return False
        if isinstance(node.func, ast.Name) and node.func.id in self.async_functions:
            return True
        if isinstance(node.func, ast.Attribute) and node.func.attr in self.async_functions:
            return True
        return False

    def visit_Call(self, node):
        self.generic_visit(node)
        if self.is_sleep_call(node):
            custom_call = ast.Call(
                func=ast.Name(id='_custom_py_sleep', ctx=ast.Load()),
                args=node.args,
                keywords=node.keywords
            )
            return ast.Await(value=custom_call)
        elif self.is_input_call(node):
            custom_call = ast.Call(
                func=ast.Name(id='_custom_py_input', ctx=ast.Load()),
                args=node.args,
                keywords=node.keywords
            )
            return ast.Await(value=custom_call)
        elif self.is_async_func_call(node):
            return ast.Await(value=node)
        return node

    def visit_FunctionDef(self, node):
        self.generic_visit(node)
        if node.name in self.async_functions:
            return ast.AsyncFunctionDef(
                name=node.name,
                args=node.args,
                body=node.body,
                decorator_list=node.decorator_list,
                returns=node.returns,
                type_comment=getattr(node, 'type_comment', None)
            )
        return node

    def visit_Await(self, node):
        self.generic_visit(node)
        if isinstance(node.value, ast.Await):
            return node.value
        return node

def _collect_async_execution_info(parsed_ast):
    time_modules = {'time', 'asyncio'}
    sleep_names = {'sleep'}
    async_functions = set()

    for node in ast.walk(parsed_ast):
        if isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name in ('time', 'asyncio'):
                    time_modules.add(alias.asname or alias.name)
        elif isinstance(node, ast.ImportFrom):
            if node.module in ('time', 'asyncio'):
                for alias in node.names:
                    if alias.name == 'sleep':
                        sleep_names.add(alias.asname or alias.name)

    def is_target_call(n):
        if not isinstance(n, ast.Call):
            return False
        if isinstance(n.func, ast.Attribute):
            if n.func.attr in async_functions:
                return True
            if n.func.attr == 'sleep' and isinstance(n.func.value, ast.Name):
              return n.func.value.id in time_modules
        elif isinstance(n.func, ast.Name):
            if n.func.id == 'input' or n.func.id in sleep_names or n.func.id in async_functions:
                return True
        return False

    changed = True
    while changed:
        changed = False
        for node in ast.walk(parsed_ast):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                if node.name not in async_functions:
                    has_target = any(is_target_call(sub) for sub in ast.walk(node) if sub is not node)
                    if has_target:
                        async_functions.add(node.name)
                        changed = True

    has_async_operations = len(async_functions) > 0 or any(
        is_target_call(node) for node in ast.walk(parsed_ast)
    )

    return time_modules, sleep_names, async_functions, has_async_operations

async def __execute_collaborative_code(user_code_str, user_globals):
    import pyodide
    # Apply colorama patch if colorama was imported
    _patch_colorama()
    # Apply matplotlib patch if matplotlib is imported
    _setup_matplotlib_support()

    # Expose custom async sleep, input & download helpers in globals and builtins
    user_globals['_custom_py_sleep'] = _custom_py_sleep
    user_globals['_custom_py_input'] = _custom_py_input
    user_globals['download_file'] = download_file
    user_globals['download'] = download
    try:
        import builtins
        builtins._custom_py_sleep = _custom_py_sleep
        builtins._custom_py_input = _custom_py_input
        builtins.download_file = download_file
        builtins.download = download
    except Exception:
        pass

    before_files = _scan_pyodide_workspace_files()

    # Parse AST
    parsed = ast.parse(user_code_str, filename="<editor>", mode="exec")
    _begin_browser_turtle_execution()
    
    time_modules, sleep_names, async_functions, has_async = _collect_async_execution_info(parsed)
            
    try:
        if has_async:
            transformer = _AsyncExecutionTransformer(time_modules, sleep_names, async_functions)
            transformed_ast = transformer.visit(parsed)
            ast.fix_missing_locations(transformed_ast)
            unparsed_code = ast.unparse(transformed_ast)
            res = await pyodide.code.eval_code_async(unparsed_code, user_globals, filename="<editor>")
        else:
            res = await pyodide.code.eval_code_async(user_code_str, user_globals, filename="<editor>")
        
        # Flush any active figures that user plotted (even if plt.show() was omitted)
        _flush_matplotlib_figures()
        _flush_browser_turtle()
        # Check and emit any files written/generated during execution
        _check_and_emit_generated_files(before_files)
        return res
    except Exception as e:
        _flush_matplotlib_figures()
        _flush_browser_turtle()
        _check_and_emit_generated_files(before_files)
        raise e

def __check_python_syntax(user_code_str):
    import json
    try:
        ast.parse(user_code_str, filename="<editor>", mode="exec")
        return json.dumps({"valid": True})
    except (SyntaxError, IndentationError, TabError) as e:
        lineno = e.lineno or 1
        offset = e.offset or 1
        end_lineno = getattr(e, 'end_lineno', lineno) or lineno
        end_offset = getattr(e, 'end_offset', None)
        msg = e.msg or str(e)
        text = e.text or ""
        return json.dumps({
            "valid": False,
            "line": int(lineno),
            "column": int(offset),
            "endLine": int(end_lineno),
            "endColumn": int(end_offset) if end_offset is not None else None,
            "message": str(msg),
            "errorType": e.__class__.__name__,
            "text": str(text)
        })
`);

  await pyodideInstance.runPythonAsync(BROWSER_TURTLE_BOOTSTRAP);

      // Preload popular color packages (colorama, termcolor, colored) so they work out of the box
      try {
        const micropip = pyodideInstance.pyimport('micropip');
        await micropip.install(['colorama', 'termcolor', 'colored']);
        markPackageLoadedLocally('colorama');
        markPackageLoadedLocally('termcolor');
        markPackageLoadedLocally('colored');
        pyodideInstance.runPython('_patch_colorama()');
      } catch (colorLoadErr) {
        console.warn('[Pyodide] Note on color packages preload:', colorLoadErr);
      }

      window.pyodideInstance = pyodideInstance;
      return pyodideInstance;
    } catch (err) {
      pyodideInstance = null;
      initPromise = null;
      console.error("Pyodide initialization failed:", err);
      throw err;
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
}

/**
 * Extracts top-level module names from Python import statements in code
 */
function extractImportedModules(code: string): string[] {
  const modules = new Set<string>();
  const lines = code.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    // `import pkg1, pkg2`
    const importMatch = line.match(/^import\s+([a-zA-Z0-9_.,\s]+)/);
    if (importMatch && !line.startsWith('from ')) {
      const parts = importMatch[1].split(',');
      for (const part of parts) {
        const mod = part.trim().split(/\s+as\s+/)[0].split('.')[0].trim();
        if (mod) modules.add(mod);
      }
    }

    // `from pkg import ...`
    const fromMatch = line.match(/^from\s+([a-zA-Z0-9_.]+)\s+import/);
    if (fromMatch) {
      const mod = fromMatch[1].split('.')[0].trim();
      if (mod) modules.add(mod);
    }
  }

  return Array.from(modules);
}

/**
 * Automatically loads or installs imported packages on the fly
 */
async function autoInstallImportedPackages(py: any, code: string, onLog?: (msg: string) => void): Promise<void> {
  const importedModules = extractImportedModules(code);
  if (importedModules.includes('turtle') && onLog) {
    onLog('[Package Manager] Browser Turtle is active; completed drawings will appear in the shared room terminal.');
  }
  const stdlibAndBuiltins = new Set([
    'math', 'random', 'sys', 'os', 'json', 'datetime', 'time', 're',
    'collections', 'itertools', 'functools', 'statistics', 'typing',
    'sqlite3', 'csv', 'io', 'string', 'copy', 'asyncio', 'queue',
    'threading', 'pathlib', 'decimal', 'fractions', 'bisect', 'heapq',
    'urllib', 'hashlib', 'base64', 'shutil', 'glob', 'tempfile',
    'unittest', 'dataclasses', 'enum', 'pickle', 'gzip', 'js', 'pyodide',
    'ast', 'micropip'
  ]);

  const toInstall = importedModules.filter(
    (mod) => !stdlibAndBuiltins.has(mod) && !isStandardLibraryModule(py, mod) && !isPackageLoadedLocally(mod)
  );

  if (toInstall.length === 0) return;

  for (const pkg of toInstall) {
    try {
      if (onLog) onLog(`[Package Manager] Installing '${pkg}'...`);

      // Prefer Pyodide's curated WebAssembly wheels before querying PyPI.
      try {
        await py.loadPackage(pkg);
        markPackageLoadedLocally(pkg);
        patchWebPackage(py, pkg);
        if (onLog) onLog(`[Package Manager] ✓ '${pkg}' loaded successfully.`);
        continue;
      } catch {
        // Fall back to PyPI for packages not in the Pyodide index.
      }

      const micropip = py.pyimport('micropip');
      await micropip.install(pkg);
      markPackageLoadedLocally(pkg);
      patchWebPackage(py, pkg);
      if (onLog) onLog(`[Package Manager] ✓ '${pkg}' installed successfully.`);
    } catch (err: any) {
      const installError = packageInstallError(pkg, err);
      if (onLog) onLog(`[Package Manager] ✗ ${installError.message}`);
      console.warn(`Auto-install failed for '${pkg}':`, installError);
    }
  }
}

export interface RunOptions {
  code: string;
  onStdout: (text: string) => void;
  onStderr: (text: string) => void;
  onInputPrompt: (prompt: string, requestId: string) => Promise<string>;
  onSleep?: (seconds: number) => Promise<void>;
}

export async function executePythonCode(options: RunOptions): Promise<{
  output: string;
  result?: string;
  isError: boolean;
}> {
  const { code, onStdout, onStderr, onInputPrompt, onSleep } = options;

  let capturedStdout = "";
  let capturedStderr = "";

  const py = await getPyodideInstance();

  py.setStdout({
    batched: (str: string) => {
      capturedStdout += str + "\n";
      onStdout(str);
    }
  });

  py.setStderr({
    batched: (str: string) => {
      capturedStderr += str + "\n";
      onStderr(str);
    }
  });

  // Setup interactive input handler bridge
  window.__py_interactive_input_handler = async (promptText: string) => {
    const requestId = 'req_' + Math.random().toString(36).substring(2, 9);
    return await onInputPrompt(promptText, requestId);
  };

  // Setup real-time sleep handler bridge
  window.__py_realtime_sleep_handler = async (seconds: number) => {
    if (onSleep) {
      return await onSleep(seconds);
    }
    return new Promise<void>((resolve) => {
      setTimeout(resolve, Math.max(0, Math.round(seconds * 1000)));
    });
  };

  // Auto-detect and install any required pip packages from user code (e.g. colorama, termcolor, rich, sympy, etc.)
  await autoInstallImportedPackages(py, code, onStdout);

  try {
    // Create dedicated execution namespace
    const pyGlobals = py.globals.get("dict")();
    pyGlobals.set("__name__", "__main__");
    pyGlobals.set("_custom_py_input", py.globals.get("_custom_py_input"));
    pyGlobals.set("_custom_py_sleep", py.globals.get("_custom_py_sleep"));

    const executor = py.globals.get("__execute_collaborative_code");
    const result = await executor(code, pyGlobals);

    let resultString: string | undefined = undefined;
    if (result !== undefined && result !== null) {
      resultString = String(result);
    }

    return {
      output: capturedStdout || (capturedStderr ? "" : "Program finished with no output."),
      result: resultString,
      isError: false
    };
  } catch (err: any) {
    const errorMsg = err.message || String(err);
    if (errorMsg.includes("__PY_STOP_EXECUTION__") || errorMsg.includes("KeyboardInterrupt") || errorMsg.includes("Execution stopped")) {
      return {
        output: capturedStdout ? `${capturedStdout}\n⛔ [Execution stopped]` : "⛔ [Execution stopped]",
        isError: true
      };
    }

    // Check if error is a ModuleNotFoundError, and attempt auto-install recovery
    const moduleNotFoundMatch = errorMsg.match(/No module named ['"]([^'"]+)['"]/);
    if (moduleNotFoundMatch) {
      const missingMod = moduleNotFoundMatch[1].split('.')[0];
      try {
        onStdout(`\n[Auto-recovery] Installing missing package '${missingMod}' via micropip...`);
        const micropip = py.pyimport('micropip');
        await micropip.install(missingMod);
        markPackageLoadedLocally(missingMod);
        onStdout(`[Auto-recovery] ✓ Successfully installed '${missingMod}'. Re-executing...\n`);

        const pyGlobals = py.globals.get("dict")();
        pyGlobals.set("__name__", "__main__");
        pyGlobals.set("_custom_py_input", py.globals.get("_custom_py_input"));
        pyGlobals.set("_custom_py_sleep", py.globals.get("_custom_py_sleep"));

        const executor = py.globals.get("__execute_collaborative_code");
        const retryResult = await executor(code, pyGlobals);

        let retryResultString: string | undefined = undefined;
        if (retryResult !== undefined && retryResult !== null) {
          retryResultString = String(retryResult);
        }

        return {
          output: capturedStdout || "Program finished with no output.",
          result: retryResultString,
          isError: false
        };
      } catch (recoveryErr: any) {
        console.warn('Auto-recovery install error:', recoveryErr);
      }
    }

    const cleanError = formatPythonTraceback(errorMsg, code);
    onStderr(cleanError);
    return {
      output: capturedStdout ? `${capturedStdout}\n${cleanError}` : cleanError,
      isError: true
    };
  }
}

export async function installPipPackage(
  packageName: string,
  onLog: (msg: string) => void
): Promise<boolean> {
  const cleanName = packageName.trim();
  if (!cleanName) throw new Error('Enter a package name to install.');
  const py = await getPyodideInstance();
  try {
    onLog(`> Installing '${cleanName}'...`);

    const packageMatch = cleanName.match(/^([a-zA-Z0-9][a-zA-Z0-9_.-]*)/);
    const moduleName = packageMatch?.[1] || cleanName;
    const normalizedName = moduleName.toLowerCase();

    if (normalizedName === 'turtle') {
      markPackageLoadedLocally(moduleName);
      onLog('✓ Browser Turtle is ready; drawings sync to all room participants.');
      return true;
    }

    if (isStandardLibraryModule(py, moduleName)) {
      throw new Error(`'${moduleName}' is part of Python's standard library and does not need pip installation.`);
    }

    // Load any package shipped as a compatible WebAssembly wheel by Pyodide.
    if (/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(cleanName)) {
      try {
        await py.loadPackage(cleanName);
        markPackageLoadedLocally(cleanName);
        patchWebPackage(py, cleanName);
        onLog(`✓ Successfully loaded package: ${cleanName}`);
        return true;
      } catch (loadErr) {
        // Fall back to PyPI for packages not in the Pyodide index.
      }
    }

    const micropip = py.pyimport("micropip");
    await micropip.install(cleanName);
    markPackageLoadedLocally(cleanName);
    patchWebPackage(py, cleanName);

    onLog(`✓ Successfully installed package: ${cleanName}`);
    return true;
  } catch (err: any) {
    const installError = packageInstallError(cleanName, err);
    onLog(`✗ Installation failed: ${installError.message}`);
    throw installError;
  }
}

export async function validatePythonSyntax(code: string): Promise<SyntaxErrorInfo | null> {
  if (!code.trim()) return null;

  // Try Pyodide real Python AST parser first if available
  if (pyodideInstance) {
    try {
      const checker = pyodideInstance.globals.get("__check_python_syntax");
      if (checker) {
        const resJsonStr = checker(code);
        const parsed = JSON.parse(resJsonStr);
        if (parsed.valid) {
          return null;
        }
        return {
          line: parsed.line || 1,
          column: parsed.column || 1,
          endLine: parsed.endLine || parsed.line || 1,
          endColumn: parsed.endColumn,
          message: parsed.message || 'Syntax error',
          errorType: parsed.errorType || 'SyntaxError',
          text: parsed.text || ''
        };
      }
    } catch (err) {
      console.warn("Python AST check error:", err);
    }
  }

  // If Pyodide is still initializing, use fallback syntax checker
  return checkSyntaxFallback(code);
}

function checkSyntaxFallback(code: string): SyntaxErrorInfo | null {
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines & comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Check indentation of first line
    if (i === 0 && /^[\t ]+/.test(line)) {
      return {
        line: 1,
        column: 1,
        message: 'unexpected indent',
        errorType: 'IndentationError',
        text: line
      };
    }

    // Check statements requiring colons
    const colonKeywords = /^(def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(.*?\)|class\s+[a-zA-Z_][a-zA-Z0-9_]*(\(.*?\))?|if\s+.+|elif\s+.+|else|for\s+.+\s+in\s+.+|while\s+.+|try|except(\s+.+)?|finally|with\s+.+)\s*$/;
    if (colonKeywords.test(trimmed) && !trimmed.endsWith(':')) {
      return {
        line: lineNum,
        column: line.length,
        message: "expected ':'",
        errorType: 'SyntaxError',
        text: line
      };
    }
  }

  return null;
}
