import { 
  PYTHON_MODULES_MAP, 
  COMMON_MODULE_NAMES, 
  PYTHON_EXCEPTION_SYMBOLS,
  PYTHON_DATA_TYPE_METHODS,
  PythonSymbol 
} from '../constants/pythonModules';
import { PYTHON_KEYWORDS, PYTHON_BUILTINS } from '../constants/python';
import { KEYWORD_DOCS } from '../constants/pythonKeywords';

export interface AutocompleteItem {
  label: string;
  insertText: string;
  kind: 'function' | 'class' | 'constant' | 'module' | 'method' | 'keyword' | 'builtin' | 'variable' | 'exception';
  detail: string;
  doc?: string;
  example?: string;
  source?: string;
}

export interface AutocompleteResult {
  suggestions: AutocompleteItem[];
  replaceStart: number;
  replaceLength: number;
  triggerContext: 'dot' | 'import' | 'from' | 'from-import' | 'identifier';
}

// Built-in function details dictionary
const BUILTIN_DOCS: Record<string, { detail: string; doc: string; example?: string }> = {
  print: { detail: 'print(*values, sep=" ", end="\\n", file=sys.stdout, flush=False)', doc: 'Prints values to a stream, or to sys.stdout by default.', example: 'print("Hello, world!", sep=" ")' },
  input: { detail: 'input(prompt="") -> str', doc: 'Read a string from standard input. The trailing newline is stripped.', example: 'name = input("Enter your name: ")' },
  len: { detail: 'len(s) -> int', doc: 'Return the number of items in a container or sequence.', example: 'total = len([1, 2, 3, 4])' },
  range: { detail: 'range(stop) or range(start, stop[, step])', doc: 'Return an object that produces a sequence of integers from start (inclusive) to stop (exclusive).', example: 'for i in range(1, 6):\n    print(i)' },
  str: { detail: 'str(object="") -> str', doc: 'Create a new string object from the given object.', example: 'text = str(12345)' },
  int: { detail: 'int(x=0, [base]) -> int', doc: 'Convert a number or string to an integer, or return 0 if no arguments.', example: 'count = int("42")' },
  float: { detail: 'float(x=0.0) -> float', doc: 'Convert a string or number to a floating point number.', example: 'val = float("3.1415")' },
  list: { detail: 'list([iterable]) -> list', doc: 'Built-in mutable sequence datatype.', example: 'items = list(range(5))' },
  dict: { detail: 'dict(**kwargs) or dict(mapping, **kwargs)', doc: 'Built-in dictionary key-value mapping datatype.', example: 'user = dict(name="Alex", age=25)' },
  set: { detail: 'set([iterable]) -> set', doc: 'Built-in mutable unordered collection of unique elements.', example: 'unique = set([1, 2, 2, 3])' },
  tuple: { detail: 'tuple([iterable]) -> tuple', doc: 'Built-in immutable sequence datatype.', example: 'coords = tuple([10, 20])' },
  type: { detail: 'type(object) -> type of object', doc: 'Return the type of an object.', example: 'print(type(42))  # <class "int">' },
  open: { detail: 'open(file, mode="r", encoding=None)', doc: 'Open file and return a stream.', example: 'with open("data.txt", "r") as f:\n    data = f.read()' },
  sum: { detail: 'sum(iterable, /, start=0)', doc: 'Return the sum of a start value plus an iterable of numbers.', example: 'total = sum([10, 20, 30])' },
  min: { detail: 'min(iterable, *[, key, default])', doc: 'With a single iterable argument, return its smallest item.', example: 'smallest = min(15, 3, 9)' },
  max: { detail: 'max(iterable, *[, key, default])', doc: 'With a single iterable argument, return its largest item.', example: 'largest = max(15, 3, 9)' },
  abs: { detail: 'abs(x) -> number', doc: 'Return the absolute value of the argument.', example: 'distance = abs(-42)' },
  round: { detail: 'round(number, ndigits=None)', doc: 'Round a number to a given precision in decimal digits.', example: 'val = round(3.14159, 2)' },
  enumerate: { detail: 'enumerate(iterable, start=0)', doc: 'Return an enumerate object with (index, value) pairs.', example: 'for i, item in enumerate(["a", "b"]):\n    print(i, item)' },
  zip: { detail: 'zip(*iterables, strict=False)', doc: 'Iterate over several iterables in parallel, producing tuples with an item from each one.', example: 'for x, y in zip([1, 2], ["a", "b"]):\n    print(x, y)' },
  map: { detail: 'map(function, *iterables)', doc: 'Make an iterator that computes the function using arguments from each of the iterables.', example: 'squares = list(map(lambda x: x**2, [1, 2, 3]))' },
  filter: { detail: 'filter(function or None, iterable)', doc: 'Return an iterator yielding those items of iterable for which function(item) is true.', example: 'evens = list(filter(lambda x: x % 2 == 0, [1, 2, 3, 4]))' },
  sorted: { detail: 'sorted(iterable, *, key=None, reverse=False)', doc: 'Return a new list containing all items from the iterable in ascending order.', example: 'ordered = sorted([3, 1, 4, 1, 5])' },
  reversed: { detail: 'reversed(sequence)', doc: 'Return a reverse iterator over the values of the given sequence.', example: 'for item in reversed([1, 2, 3]):\n    print(item)' },
  any: { detail: 'any(iterable) -> bool', doc: 'Return True if bool(x) is True for any x in the iterable.', example: 'has_positive = any(x > 0 for x in [0, -1, 5])' },
  all: { detail: 'all(iterable) -> bool', doc: 'Return True if bool(x) is True for all values x in the iterable.', example: 'all_positive = all(x > 0 for x in [1, 2, 3])' },
  isinstance: { detail: 'isinstance(obj, class_or_tuple) -> bool', doc: 'Return whether an object is an instance of a class or of a subclass thereof.', example: 'is_num = isinstance(42, int)' },
  issubclass: { detail: 'issubclass(C, B) -> bool', doc: 'Return whether class C is a subclass of class B.', example: 'is_sub = issubclass(bool, int)' },
  super: { detail: 'super([type [,object-or-type]])', doc: 'Return a proxy object that delegates method calls to a parent or sibling class.', example: 'class Child(Parent):\n    def __init__(self):\n        super().__init__()' },
  help: { detail: 'help([object])', doc: 'Execute the built-in help system.', example: 'help(print)' },
  bin: { detail: 'bin(number) -> str', doc: 'Return the binary representation of an integer with prefix "0b".', example: 'bin(10)  # "0b1010"' },
  hex: { detail: 'hex(number) -> str', doc: 'Return the hexadecimal representation of an integer with prefix "0x".', example: 'hex(255)  # "0xff"' },
  oct: { detail: 'oct(number) -> str', doc: 'Return the octal representation of an integer with prefix "0o".', example: 'oct(8)  # "0o10"' },
  chr: { detail: 'chr(i) -> str', doc: 'Return the string representing a character whose Unicode code point is integer i.', example: 'chr(65)  # "A"' },
  ord: { detail: 'ord(c) -> int', doc: 'Given a string representing one Unicode character, return an integer representing the Unicode code point.', example: 'ord("A")  # 65' },
  id: { detail: 'id(object) -> int', doc: 'Return the identity of an object. This is guaranteed to be unique among simultaneously existing objects.', example: 'mem_id = id([1, 2, 3])' }
};

interface ImportedScope {
  // Map of alias -> module name (e.g. 'np' -> 'numpy', 'math' -> 'math')
  moduleAliases: Map<string, string>;
  // Map of symbol name -> symbol definition (from `from math import sqrt, pi`)
  importedSymbols: Map<string, PythonSymbol>;
  // User defined functions / classes / variables
  userSymbols: Map<string, AutocompleteItem>;
}

export function parsePythonScope(code: string): ImportedScope {
  const moduleAliases = new Map<string, string>();
  const importedSymbols = new Map<string, PythonSymbol>();
  const userSymbols = new Map<string, AutocompleteItem>();

  const lines = code.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    // 1. `import module [as alias]` OR `import mod1, mod2`
    const importMatch = line.match(/^import\s+([a-zA-Z0-9_.,\s]+)/);
    if (importMatch && !line.startsWith('from ')) {
      const parts = importMatch[1].split(',');
      for (const part of parts) {
        const item = part.trim();
        const asMatch = item.match(/^([a-zA-Z0-9_.]+)(?:\s+as\s+([a-zA-Z0-9_]+))?$/);
        if (asMatch) {
          const modName = asMatch[1];
          const alias = asMatch[2] || modName;
          moduleAliases.set(alias, modName);
        }
      }
    }

    // 2. `from module import sym1 [as a1], sym2`
    const fromMatch = line.match(/^from\s+([a-zA-Z0-9_.]+)\s+import\s+([a-zA-Z0-9_.,\s*]+)/);
    if (fromMatch) {
      const modName = fromMatch[1];
      const symbolsStr = fromMatch[2].trim();
      const modDef = PYTHON_MODULES_MAP[modName];

      if (symbolsStr === '*') {
        // Import all symbols if wildcard
        if (modDef) {
          for (const sym of modDef.symbols) {
            importedSymbols.set(sym.name, sym);
          }
        }
      } else {
        const items = symbolsStr.split(',');
        for (const item of items) {
          const symMatch = item.trim().match(/^([a-zA-Z0-9_]+)(?:\s+as\s+([a-zA-Z0-9_]+))?$/);
          if (symMatch) {
            const symName = symMatch[1];
            const symAlias = symMatch[2] || symName;
            
            // Check if this imported symbol is itself a submodule (e.g. `from os import path`)
            const subModKey = `${modName}.${symName}`;
            if (PYTHON_MODULES_MAP[subModKey]) {
              moduleAliases.set(symAlias, subModKey);
            }

            const existing = modDef?.symbols.find(s => s.name === symName);
            if (existing) {
              importedSymbols.set(symAlias, { ...existing, name: symAlias });
            } else {
              importedSymbols.set(symAlias, {
                name: symAlias,
                kind: 'function',
                detail: `${symName} (from ${modName})`,
                doc: `Imported symbol from ${modName}`
              });
            }
          }
        }
      }
    }

    // 3. User function definitions: `def func_name(a, b):`
    const defMatch = line.match(/^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)/);
    if (defMatch) {
      const name = defMatch[1];
      const args = defMatch[2];
      userSymbols.set(name, {
        label: name,
        insertText: name,
        kind: 'function',
        detail: `def ${name}(${args})`,
        doc: `User-defined function in current file`,
        source: 'local'
      });
    }

    // 4. User class definitions: `class ClassName:`
    const classMatch = line.match(/^class\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (classMatch) {
      const name = classMatch[1];
      userSymbols.set(name, {
        label: name,
        insertText: name,
        kind: 'class',
        detail: `class ${name}`,
        doc: `User-defined class in current file`,
        source: 'local'
      });
    }

    // 5. User top-level variables: `var_name = ...`
    const varMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=(?!=)/);
    if (varMatch) {
      const name = varMatch[1];
      if (!userSymbols.has(name) && !PYTHON_KEYWORDS.includes(name)) {
        userSymbols.set(name, {
          label: name,
          insertText: name,
          kind: 'variable',
          detail: `${name}: variable`,
          doc: `User-defined variable`,
          source: 'local'
        });
      }
    }
  }

  return { moduleAliases, importedSymbols, userSymbols };
}

/**
 * Main Autocomplete Query Engine
 */
export function getPythonAutocomplete(code: string, cursorPos: number): AutocompleteResult | null {
  if (!code || typeof code !== 'string' || cursorPos <= 0 || cursorPos > code.length) return null;

  // If cursor is in the middle of an identifier (e.g. alphanumeric char directly after cursor), do not show autocomplete
  const charAfterCursor = code.charAt(cursorPos);
  if (/[a-zA-Z0-9_]/.test(charAfterCursor)) {
    return null;
  }

  const textBeforeCursor = code.substring(0, cursorPos);
  const currentLine = textBeforeCursor.split('\n').pop() || '';

  // Check if cursor is inside a comment line or inline comment
  const commentIdx = currentLine.indexOf('#');
  if (commentIdx !== -1) {
    const beforeHash = currentLine.substring(0, commentIdx);
    const singleQuotes = (beforeHash.match(/'/g) || []).length;
    const doubleQuotes = (beforeHash.match(/"/g) || []).length;
    // If quotes are balanced before '#', then '#' begins a comment
    if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0) {
      return null;
    }
  }

  // Check if cursor is inside an open string literal on the current line
  const lineQuotesSingle = (currentLine.match(/'/g) || []).length;
  const lineQuotesDouble = (currentLine.match(/"/g) || []).length;
  if (lineQuotesSingle % 2 !== 0 || lineQuotesDouble % 2 !== 0) {
    return null;
  }

  // If user is actively typing a new function/class name right after `def ` or `class `, do not autocomplete
  if (/^\s*(def|class)\s+[a-zA-Z0-9_]*$/.test(currentLine)) {
    return null;
  }

  // 1. Check if inside `import ...`
  const importKeywordMatch = currentLine.match(/(?:^|\s+)import\s+([a-zA-Z0-9_.]*)$/);
  if (importKeywordMatch) {
    const typed = importKeywordMatch[1] || '';
    const suggestions: AutocompleteItem[] = COMMON_MODULE_NAMES
      .filter(mod => mod.toLowerCase().startsWith(typed.toLowerCase()) && mod.toLowerCase() !== typed.toLowerCase())
      .map(mod => ({
        label: mod,
        insertText: mod,
        kind: 'module',
        detail: `Module ${mod}`,
        doc: PYTHON_MODULES_MAP[mod]?.description || `Python package ${mod}`
      }));

    if (suggestions.length === 0) return null;

    return {
      suggestions,
      replaceStart: cursorPos - typed.length,
      replaceLength: typed.length,
      triggerContext: 'import'
    };
  }

  // 2. Check if inside `from <module> import ...`
  const fromImportMatch = currentLine.match(/(?:^|\s+)from\s+([a-zA-Z0-9_.]+)\s+import\s+([a-zA-Z0-9_,\s]*)$/);
  if (fromImportMatch) {
    const modName = fromImportMatch[1];
    const afterImport = fromImportMatch[2] || '';
    const lastToken = afterImport.split(',').pop()?.trim() || '';

    const modDef = PYTHON_MODULES_MAP[modName];
    if (modDef) {
      const suggestions: AutocompleteItem[] = modDef.symbols
        .filter(s => s.name.toLowerCase().startsWith(lastToken.toLowerCase()) && s.name.toLowerCase() !== lastToken.toLowerCase())
        .map(s => ({
          label: s.name,
          insertText: s.name,
          kind: s.kind,
          detail: s.detail || s.name,
          doc: s.doc
        }));

      if (suggestions.length > 0) {
        return {
          suggestions,
          replaceStart: cursorPos - lastToken.length,
          replaceLength: lastToken.length,
          triggerContext: 'from-import'
        };
      }
    }
  }

  // 3. Check if inside `from ...`
  const fromKeywordMatch = currentLine.match(/(?:^|\s+)from\s+([a-zA-Z0-9_.]*)$/);
  if (fromKeywordMatch) {
    const typed = fromKeywordMatch[1] || '';
    const suggestions: AutocompleteItem[] = COMMON_MODULE_NAMES
      .filter(mod => mod.toLowerCase().startsWith(typed.toLowerCase()) && mod.toLowerCase() !== typed.toLowerCase())
      .map(mod => ({
        label: mod,
        insertText: mod,
        kind: 'module',
        detail: `Module ${mod}`,
        doc: PYTHON_MODULES_MAP[mod]?.description || `Python package ${mod}`
      }));

    if (suggestions.length === 0) return null;

    return {
      suggestions,
      replaceStart: cursorPos - typed.length,
      replaceLength: typed.length,
      triggerContext: 'from'
    };
  }

  // 4. Dot Completion: `<object>.<member>` (e.g. `math.`, `np.`, `os.path.`, `s.`, `list.`)
  const dotMatch = currentLine.match(/([a-zA-Z_][a-zA-Z0-9_.]*)\.([a-zA-Z0-9_]*)$/);
  if (dotMatch) {
    const objectPath = dotMatch[1];
    const memberPrefix = dotMatch[2] || '';

    const scope = parsePythonScope(code);
    let resolvedModName: string | undefined = scope.moduleAliases.get(objectPath);

    // If objectPath itself is a submodule of an imported module (e.g. `import os` and typed `os.path.`)
    if (!resolvedModName) {
      const parts = objectPath.split('.');
      if (parts.length > 1 && scope.moduleAliases.has(parts[0])) {
        const fullModPath = `${scope.moduleAliases.get(parts[0])}.${parts.slice(1).join('.')}`;
        if (PYTHON_MODULES_MAP[fullModPath]) {
          resolvedModName = fullModPath;
        } else if (PYTHON_MODULES_MAP[objectPath]) {
          resolvedModName = objectPath;
        }
      }
    }

    let symbolPool: PythonSymbol[] = [];

    // ONLY provide module symbols if the module was actually imported in the code!
    if (resolvedModName && PYTHON_MODULES_MAP[resolvedModName]) {
      symbolPool = PYTHON_MODULES_MAP[resolvedModName].symbols;
    } else if (PYTHON_DATA_TYPE_METHODS[objectPath.toLowerCase()]) {
      // Allow explicit built-in type names like `list.`, `str.`, `dict.`, `set.`
      symbolPool = PYTHON_DATA_TYPE_METHODS[objectPath.toLowerCase()];
    } else {
      // Unimported modules do NOT show recommendations
      return null;
    }

    const filtered = symbolPool.filter(s => 
      s.name.toLowerCase().startsWith(memberPrefix.toLowerCase()) && 
      s.name.toLowerCase() !== memberPrefix.toLowerCase()
    );

    if (filtered.length > 0) {
      const suggestions: AutocompleteItem[] = filtered.map(s => ({
        label: s.name,
        insertText: s.name,
        kind: s.kind,
        detail: s.detail || `${objectPath}.${s.name}`,
        doc: s.doc
      }));

      return {
        suggestions,
        replaceStart: cursorPos - memberPrefix.length,
        replaceLength: memberPrefix.length,
        triggerContext: 'dot'
      };
    }
  }

  // 5. General Identifier / Word Completion
  const wordMatch = currentLine.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/);
  if (!wordMatch || wordMatch[1].length < 1) {
    return null;
  }

  const prefix = wordMatch[1];
  const prefixLower = prefix.toLowerCase();
  const scope = parsePythonScope(code);
  const pool: AutocompleteItem[] = [];
  const seenLabels = new Set<string>();

  const addItem = (item: AutocompleteItem) => {
    const itemLabelLower = item.label.toLowerCase();
    // Do NOT suggest an item if it is already an exact case-insensitive match for the current typed prefix
    if (!seenLabels.has(item.label) && itemLabelLower !== prefixLower) {
      seenLabels.add(item.label);
      pool.push(item);
    }
  };

  // A. Add User-defined symbols in the file
  for (const userSym of scope.userSymbols.values()) {
    if (userSym.label.toLowerCase().startsWith(prefixLower)) {
      addItem(userSym);
    }
  }

  // B. Add explicitly imported symbols (from `from x import y`)
  for (const sym of scope.importedSymbols.values()) {
    if (sym.name.toLowerCase().startsWith(prefixLower)) {
      addItem({
        label: sym.name,
        insertText: sym.name,
        kind: sym.kind,
        detail: sym.detail || sym.name,
        doc: sym.doc,
        source: 'imported'
      });
    }
  }

  // C. Add imported module aliases / names ONLY if actually imported (e.g. `np`, `math`, `plt`, `random`)
  for (const [alias, modName] of scope.moduleAliases.entries()) {
    if (alias.toLowerCase().startsWith(prefixLower)) {
      addItem({
        label: alias,
        insertText: alias,
        kind: 'module',
        detail: `Module ${modName}${alias !== modName ? ` as ${alias}` : ''}`,
        doc: PYTHON_MODULES_MAP[modName]?.description,
        source: 'imported'
      });
    }
  }

  // D. Add Python Keywords with real function, syntax, and usage example
  for (const kw of PYTHON_KEYWORDS) {
    if (kw.toLowerCase().startsWith(prefixLower)) {
      const kwInfo = KEYWORD_DOCS[kw];
      addItem({
        label: kw,
        insertText: kw,
        kind: 'keyword',
        detail: kwInfo?.detail || `keyword ${kw}`,
        doc: kwInfo?.doc || `Python keyword ${kw}`,
        example: kwInfo?.example
      });
    }
  }

  // E. Add Python Built-ins with signatures, documentation, and usage examples
  const ALL_BUILTINS = [
    ...PYTHON_BUILTINS,
    'round', 'chr', 'ord', 'id', 'issubclass', 'iter', 'next', 'pow', 'repr', 'slice', 'vars'
  ];
  for (const bi of ALL_BUILTINS) {
    if (bi.toLowerCase().startsWith(prefixLower)) {
      const docInfo = BUILTIN_DOCS[bi];
      addItem({
        label: bi,
        insertText: bi,
        kind: 'builtin',
        detail: docInfo?.detail || `${bi}()`,
        doc: docInfo?.doc || `Python built-in function ${bi}`,
        example: docInfo?.example
      });
    }
  }

  // F. Add Standard Python Exceptions
  for (const exc of PYTHON_EXCEPTION_SYMBOLS) {
    if (exc.name.toLowerCase().startsWith(prefixLower)) {
      addItem({
        label: exc.name,
        insertText: exc.name,
        kind: 'exception',
        detail: exc.detail || exc.name,
        doc: exc.doc
      });
    }
  }

  if (pool.length === 0) return null;

  // Prioritize exact prefix matches over case-insensitive matches, and user/imported items first
  const sorted = pool.sort((a, b) => {
    const aExact = a.label.startsWith(prefix);
    const bExact = b.label.startsWith(prefix);
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    // Prioritize imported/local items
    const aPriority = a.source === 'local' ? 3 : a.source === 'imported' ? 2 : 1;
    const bPriority = b.source === 'local' ? 3 : b.source === 'imported' ? 2 : 1;
    if (aPriority !== bPriority) return bPriority - aPriority;

    return a.label.localeCompare(b.label);
  });

  return {
    suggestions: sorted.slice(0, 30), // Limit top 30 most relevant
    replaceStart: cursorPos - prefix.length,
    replaceLength: prefix.length,
    triggerContext: 'identifier'
  };
}
