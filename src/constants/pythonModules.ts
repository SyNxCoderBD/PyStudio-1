export interface PythonSymbol {
  name: string;
  kind: 'function' | 'class' | 'constant' | 'module' | 'method' | 'keyword' | 'builtin' | 'variable' | 'exception';
  detail?: string;
  doc?: string;
}

export interface ModuleDefinition {
  name: string;
  description: string;
  symbols: PythonSymbol[];
}

export const PYTHON_MODULES_MAP: Record<string, ModuleDefinition> = {
  turtle: {
    name: 'turtle',
    description: 'Browser-compatible Turtle drawing API; drawings sync to the room terminal',
    symbols: [
      { name: 'Turtle', kind: 'class', detail: 'Turtle(shape="classic", undobuffersize=1000, visible=True)', doc: 'Create a browser-rendered turtle pen.' },
      { name: 'Screen', kind: 'function', detail: 'Screen()', doc: 'Get the shared browser drawing surface.' },
      { name: 'forward', kind: 'function', detail: 'forward(distance)', doc: 'Move forward by distance.' },
      { name: 'backward', kind: 'function', detail: 'backward(distance)', doc: 'Move backward by distance.' },
      { name: 'left', kind: 'function', detail: 'left(angle)', doc: 'Turn left by angle degrees.' },
      { name: 'right', kind: 'function', detail: 'right(angle)', doc: 'Turn right by angle degrees.' },
      { name: 'goto', kind: 'function', detail: 'goto(x, y)', doc: 'Move to an absolute position.' },
      { name: 'circle', kind: 'function', detail: 'circle(radius, extent=360, steps=None)', doc: 'Draw a circle or arc.' },
      { name: 'penup', kind: 'function', detail: 'penup()', doc: 'Lift the pen so movement does not draw.' },
      { name: 'pendown', kind: 'function', detail: 'pendown()', doc: 'Lower the pen so movement draws.' },
      { name: 'pencolor', kind: 'function', detail: 'pencolor(color)', doc: 'Set the pen stroke color.' },
      { name: 'fillcolor', kind: 'function', detail: 'fillcolor(color)', doc: 'Set the fill color.' },
      { name: 'color', kind: 'function', detail: 'color(pencolor, fillcolor=None)', doc: 'Set pen and fill colors.' },
      { name: 'pensize', kind: 'function', detail: 'pensize(width)', doc: 'Set the pen width.' },
      { name: 'begin_fill', kind: 'function', detail: 'begin_fill()', doc: 'Start recording a filled shape.' },
      { name: 'end_fill', kind: 'function', detail: 'end_fill()', doc: 'Fill the shape recorded since begin_fill().' },
      { name: 'dot', kind: 'function', detail: 'dot(size=None, color=None)', doc: 'Draw a circular dot.' },
      { name: 'write', kind: 'function', detail: 'write(text, move=False, align="left", font=("Arial", 10, "normal"))', doc: 'Draw text at the current position.' },
      { name: 'bgcolor', kind: 'function', detail: 'bgcolor(color)', doc: 'Set the drawing background color.' },
      { name: 'screensize', kind: 'function', detail: 'screensize(width=None, height=None, bg=None)', doc: 'Set the drawing canvas size.' },
      { name: 'setup', kind: 'function', detail: 'setup(width=None, height=None)', doc: 'Set the drawing canvas size.' },
      { name: 'done', kind: 'function', detail: 'done()', doc: 'Publish the completed drawing to the shared terminal.' },
      { name: 'speed', kind: 'function', detail: 'speed(speed)', doc: 'Accepted for compatibility; drawing renders at completion.' },
      { name: 'hideturtle', kind: 'function', detail: 'hideturtle()', doc: 'Hide the turtle marker.' },
      { name: 'showturtle', kind: 'function', detail: 'showturtle()', doc: 'Show the turtle marker.' },
      { name: 'position', kind: 'function', detail: 'position()', doc: 'Return the current position.' },
      { name: 'heading', kind: 'function', detail: 'heading()', doc: 'Return the current heading.' }
    ]
  },
  math: {
    name: 'math',
    description: 'Mathematical functions (sin, cos, sqrt, pi, etc.)',
    symbols: [
      { name: 'pi', kind: 'constant', detail: '3.141592653589793', doc: 'The mathematical constant π' },
      { name: 'e', kind: 'constant', detail: '2.718281828459045', doc: 'The mathematical constant e' },
      { name: 'tau', kind: 'constant', detail: '6.283185307179586', doc: 'The mathematical constant τ (2π)' },
      { name: 'inf', kind: 'constant', detail: 'math.inf', doc: 'Floating-point positive infinity' },
      { name: 'nan', kind: 'constant', detail: 'math.nan', doc: 'Floating-point Not a Number (NaN)' },
      { name: 'sqrt', kind: 'function', detail: 'sqrt(x)', doc: 'Return the square root of x.' },
      { name: 'isqrt', kind: 'function', detail: 'isqrt(n)', doc: 'Return the integer square root of the nonnegative integer n.' },
      { name: 'sin', kind: 'function', detail: 'sin(x)', doc: 'Return the sine of x (measured in radians).' },
      { name: 'cos', kind: 'function', detail: 'cos(x)', doc: 'Return the cosine of x (measured in radians).' },
      { name: 'tan', kind: 'function', detail: 'tan(x)', doc: 'Return the tangent of x (measured in radians).' },
      { name: 'asin', kind: 'function', detail: 'asin(x)', doc: 'Return the arc sine of x, in radians.' },
      { name: 'acos', kind: 'function', detail: 'acos(x)', doc: 'Return the arc cosine of x, in radians.' },
      { name: 'atan', kind: 'function', detail: 'atan(x)', doc: 'Return the arc tangent of x, in radians.' },
      { name: 'atan2', kind: 'function', detail: 'atan2(y, x)', doc: 'Return arc tangent of y/x in radians.' },
      { name: 'sinh', kind: 'function', detail: 'sinh(x)', doc: 'Return the hyperbolic sine of x.' },
      { name: 'cosh', kind: 'function', detail: 'cosh(x)', doc: 'Return the hyperbolic cosine of x.' },
      { name: 'tanh', kind: 'function', detail: 'tanh(x)', doc: 'Return the hyperbolic tangent of x.' },
      { name: 'exp', kind: 'function', detail: 'exp(x)', doc: 'Return e raised to the power of x.' },
      { name: 'expm1', kind: 'function', detail: 'expm1(x)', doc: 'Return exp(x) - 1 with high precision for small x.' },
      { name: 'log', kind: 'function', detail: 'log(x, [base])', doc: 'Return the logarithm of x to the given base.' },
      { name: 'log2', kind: 'function', detail: 'log2(x)', doc: 'Return the base-2 logarithm of x.' },
      { name: 'log10', kind: 'function', detail: 'log10(x)', doc: 'Return the base-10 logarithm of x.' },
      { name: 'log1p', kind: 'function', detail: 'log1p(x)', doc: 'Return the natural logarithm of 1+x (base e).' },
      { name: 'pow', kind: 'function', detail: 'pow(x, y)', doc: 'Return x raised to power y.' },
      { name: 'ceil', kind: 'function', detail: 'ceil(x)', doc: 'Return the ceiling of x as an Integral.' },
      { name: 'floor', kind: 'function', detail: 'floor(x)', doc: 'Return the floor of x as an Integral.' },
      { name: 'trunc', kind: 'function', detail: 'trunc(x)', doc: 'Truncates the Real value x to the nearest Integral toward 0.' },
      { name: 'fabs', kind: 'function', detail: 'fabs(x)', doc: 'Return the absolute value of the float x.' },
      { name: 'factorial', kind: 'function', detail: 'factorial(n)', doc: 'Find n! (n factorial).' },
      { name: 'gcd', kind: 'function', detail: 'gcd(*integers)', doc: 'Greatest Common Divisor.' },
      { name: 'lcm', kind: 'function', detail: 'lcm(*integers)', doc: 'Least Common Multiple.' },
      { name: 'comb', kind: 'function', detail: 'comb(n, k)', doc: 'Number of ways to choose k items from n items without repetition.' },
      { name: 'perm', kind: 'function', detail: 'perm(n, [k])', doc: 'Number of ways to choose k items from n items with order.' },
      { name: 'radians', kind: 'function', detail: 'radians(deg)', doc: 'Convert angle deg from degrees to radians.' },
      { name: 'degrees', kind: 'function', detail: 'degrees(rad)', doc: 'Convert angle rad from radians to degrees.' },
      { name: 'hypot', kind: 'function', detail: 'hypot(*coordinates)', doc: 'Multidimensional Euclidean distance from origin.' },
      { name: 'dist', kind: 'function', detail: 'dist(p, q)', doc: 'Return Euclidean distance between two points p and q.' },
      { name: 'prod', kind: 'function', detail: 'prod(iterable, *, start=1)', doc: 'Calculate the product of all elements in iterable.' },
      { name: 'fsum', kind: 'function', detail: 'fsum(iterable)', doc: 'Return an accurate floating point sum of values in the iterable.' },
      { name: 'isclose', kind: 'function', detail: 'isclose(a, b, *, rel_tol=1e-9, abs_tol=0.0)', doc: 'Determine whether two floating point numbers are close.' },
      { name: 'isfinite', kind: 'function', detail: 'isfinite(x)', doc: 'Return True if x is neither infinity nor NaN.' },
      { name: 'isinf', kind: 'function', detail: 'isinf(x)', doc: 'Return True if x is positive or negative infinity.' },
      { name: 'isnan', kind: 'function', detail: 'isnan(x)', doc: 'Return True if x is NaN (not a number).' },
      { name: 'remainder', kind: 'function', detail: 'remainder(x, y)', doc: 'Difference between x and the closest integer multiple of y.' }
    ]
  },

  random: {
    name: 'random',
    description: 'Generate pseudo-random numbers and distributions',
    symbols: [
      { name: 'randint', kind: 'function', detail: 'randint(a, b)', doc: 'Return random integer in range [a, b], including both end points.' },
      { name: 'choice', kind: 'function', detail: 'choice(seq)', doc: 'Choose a random element from a non-empty sequence.' },
      { name: 'choices', kind: 'function', detail: 'choices(population, weights=None, *, k=1)', doc: 'Return a k sized list of elements chosen from population with replacement.' },
      { name: 'sample', kind: 'function', detail: 'sample(population, k)', doc: 'Chooses k unique random elements from a population sequence or set.' },
      { name: 'shuffle', kind: 'function', detail: 'shuffle(x)', doc: 'Shuffle list x in place, and return None.' },
      { name: 'random', kind: 'function', detail: 'random()', doc: 'Return the next random floating point number in range [0.0, 1.0).' },
      { name: 'uniform', kind: 'function', detail: 'uniform(a, b)', doc: 'Get a random number in the range [a, b) or [a, b] depending on rounding.' },
      { name: 'randrange', kind: 'function', detail: 'randrange(start, stop=None, step=1)', doc: 'Choose a random item from range(start, stop[, step]).' },
      { name: 'seed', kind: 'function', detail: 'seed(a=None, version=2)', doc: 'Initialize internal state of the random number generator.' },
      { name: 'gauss', kind: 'function', detail: 'gauss(mu=0.0, sigma=1.0)', doc: 'Gaussian distribution.' },
      { name: 'normalvariate', kind: 'function', detail: 'normalvariate(mu=0.0, sigma=1.0)', doc: 'Normal distribution.' },
      { name: 'expovariate', kind: 'function', detail: 'expovariate(lambd=1.0)', doc: 'Exponential distribution.' },
      { name: 'getrandbits', kind: 'function', detail: 'getrandbits(k)', doc: 'Generates an int with k random bits.' },
      { name: 'triangular', kind: 'function', detail: 'triangular(low, high, mode)', doc: 'Triangular distribution.' },
      { name: 'betavariate', kind: 'function', detail: 'betavariate(alpha, beta)', doc: 'Beta distribution.' },
      { name: 'gammavariate', kind: 'function', detail: 'gammavariate(alpha, beta)', doc: 'Gamma distribution.' },
      { name: 'Random', kind: 'class', detail: 'Random(seed=None)', doc: 'Random number generator base class.' },
      { name: 'SystemRandom', kind: 'class', detail: 'SystemRandom()', doc: 'Uses os.urandom() to generate random numbers from sources provided by the OS.' }
    ]
  },

  os: {
    name: 'os',
    description: 'Miscellaneous operating system interfaces',
    symbols: [
      { name: 'path', kind: 'module', detail: 'os.path', doc: 'Common pathname manipulations' },
      { name: 'environ', kind: 'constant', detail: 'environ mapping', doc: 'A mapping object representing the string environment' },
      { name: 'getcwd', kind: 'function', detail: 'getcwd()', doc: 'Return a unicode string representing the current working directory.' },
      { name: 'chdir', kind: 'function', detail: 'chdir(path)', doc: 'Change the current working directory to the specified path.' },
      { name: 'listdir', kind: 'function', detail: 'listdir(path=".")', doc: 'Return a list containing the names of the entries in the directory.' },
      { name: 'mkdir', kind: 'function', detail: 'mkdir(path, mode=0o777)', doc: 'Create a directory named path with numeric mode mode.' },
      { name: 'makedirs', kind: 'function', detail: 'makedirs(name, mode=0o777, exist_ok=False)', doc: 'Super-mkdir; create-directory recursive.' },
      { name: 'remove', kind: 'function', detail: 'remove(path)', doc: 'Remove (delete) the file path.' },
      { name: 'unlink', kind: 'function', detail: 'unlink(path)', doc: 'Remove (delete) the file path (alias of remove).' },
      { name: 'rmdir', kind: 'function', detail: 'rmdir(path)', doc: 'Remove (delete) the directory path.' },
      { name: 'removedirs', kind: 'function', detail: 'removedirs(name)', doc: 'Super-rmdir; remove-directories recursive.' },
      { name: 'rename', kind: 'function', detail: 'rename(src, dst)', doc: 'Rename the file or directory src to dst.' },
      { name: 'replace', kind: 'function', detail: 'replace(src, dst)', doc: 'Rename the file or directory src to dst, replacing destination.' },
      { name: 'walk', kind: 'function', detail: 'walk(top, topdown=True, onerror=None, followlinks=False)', doc: 'Directory tree generator.' },
      { name: 'system', kind: 'function', detail: 'system(command)', doc: 'Execute the command (a string) in a subshell.' },
      { name: 'name', kind: 'constant', detail: 'os.name', doc: 'The name of the OS dependent module imported (e.g. "posix", "nt").' },
      { name: 'sep', kind: 'constant', detail: 'os.sep', doc: 'The character used by the operating system to separate pathname components.' },
      { name: 'linesep', kind: 'constant', detail: 'os.linesep', doc: 'The string used to separate lines on the current platform.' },
      { name: 'pathsep', kind: 'constant', detail: 'os.pathsep', doc: 'The character conventionally used by the OS to separate search path components.' },
      { name: 'curdir', kind: 'constant', detail: 'os.curdir', doc: 'The constant string used by the OS to refer to the current directory (".").' },
      { name: 'pardir', kind: 'constant', detail: 'os.pardir', doc: 'The constant string used by the OS to refer to the parent directory ("..").' },
      { name: 'stat', kind: 'function', detail: 'stat(path)', doc: 'Perform a stat system call on the given path.' },
      { name: 'chmod', kind: 'function', detail: 'chmod(path, mode)', doc: 'Change the mode of path to the numeric mode.' },
      { name: 'cpu_count', kind: 'function', detail: 'cpu_count()', doc: 'Return the number of CPUs in the system.' },
      { name: 'urandom', kind: 'function', detail: 'urandom(size)', doc: 'Return size random bytes suitable for cryptographic use.' },
      { name: 'getpid', kind: 'function', detail: 'getpid()', doc: 'Return the current process id.' }
    ]
  },

  'os.path': {
    name: 'os.path',
    description: 'Common pathname manipulations',
    symbols: [
      { name: 'join', kind: 'function', detail: 'join(path, *paths)', doc: 'Join one or more path components intelligently.' },
      { name: 'split', kind: 'function', detail: 'split(path)', doc: 'Split the pathname path into a pair, (head, tail).' },
      { name: 'splitext', kind: 'function', detail: 'splitext(path)', doc: 'Split the pathname path into a pair (root, ext).' },
      { name: 'basename', kind: 'function', detail: 'basename(path)', doc: 'Returns the final component of a pathname' },
      { name: 'dirname', kind: 'function', detail: 'dirname(path)', doc: 'Returns the directory component of a pathname' },
      { name: 'exists', kind: 'function', detail: 'exists(path)', doc: 'Test whether a path exists. Returns False for broken symbolic links.' },
      { name: 'isfile', kind: 'function', detail: 'isfile(path)', doc: 'Test whether a path is a regular file.' },
      { name: 'isdir', kind: 'function', detail: 'isdir(path)', doc: 'Return true if the pathname refers to an existing directory.' },
      { name: 'islink', kind: 'function', detail: 'islink(path)', doc: 'Test whether a path is a symbolic link.' },
      { name: 'abspath', kind: 'function', detail: 'abspath(path)', doc: 'Return an absolute or normalized path.' },
      { name: 'relpath', kind: 'function', detail: 'relpath(path, start=None)', doc: 'Return a relative version of a path.' },
      { name: 'normpath', kind: 'function', detail: 'normpath(path)', doc: 'Normalize path, eliminating double slashes, etc.' },
      { name: 'getsize', kind: 'function', detail: 'getsize(path)', doc: 'Return the size of a file, reported by os.stat().' },
      { name: 'getmtime', kind: 'function', detail: 'getmtime(path)', doc: 'Return the time of last modification of path.' },
      { name: 'getctime', kind: 'function', detail: 'getctime(path)', doc: 'Return the metadata change time of path.' },
      { name: 'expanduser', kind: 'function', detail: 'expanduser(path)', doc: 'Expand ~ and ~user constructions in path.' }
    ]
  },

  sys: {
    name: 'sys',
    description: 'System-specific parameters and functions',
    symbols: [
      { name: 'version', kind: 'constant', detail: 'sys.version', doc: 'Python version string' },
      { name: 'version_info', kind: 'constant', detail: 'sys.version_info', doc: 'Python version tuple (major, minor, micro, ...)' },
      { name: 'platform', kind: 'constant', detail: 'sys.platform', doc: 'OS platform identifier (e.g. "emscripten", "linux", "win32")' },
      { name: 'argv', kind: 'constant', detail: 'sys.argv', doc: 'Command line arguments passed to Python script' },
      { name: 'path', kind: 'constant', detail: 'sys.path', doc: 'List of directory strings specifying the search path for modules' },
      { name: 'modules', kind: 'constant', detail: 'sys.modules', doc: 'Dictionary of loaded modules' },
      { name: 'executable', kind: 'constant', detail: 'sys.executable', doc: 'Path of the Python interpreter binary' },
      { name: 'exit', kind: 'function', detail: 'exit([arg])', doc: 'Exit the interpreter by raising SystemExit(arg).' },
      { name: 'stdin', kind: 'constant', detail: 'sys.stdin', doc: 'Standard input stream' },
      { name: 'stdout', kind: 'constant', detail: 'sys.stdout', doc: 'Standard output stream' },
      { name: 'stderr', kind: 'constant', detail: 'sys.stderr', doc: 'Standard error stream' },
      { name: 'maxsize', kind: 'constant', detail: 'sys.maxsize', doc: 'Largest positive integer supported by Py_ssize_t' },
      { name: 'getsizeof', kind: 'function', detail: 'getsizeof(object, [default])', doc: 'Return the size of object in bytes.' },
      { name: 'getrecursionlimit', kind: 'function', detail: 'getrecursionlimit()', doc: 'Return the current value of the maximum recursion depth.' },
      { name: 'setrecursionlimit', kind: 'function', detail: 'setrecursionlimit(limit)', doc: 'Set the maximum depth of the Python interpreter stack.' },
      { name: 'byteorder', kind: 'constant', detail: 'sys.byteorder', doc: 'Native byte order ("big" or "little")' }
    ]
  },

  json: {
    name: 'json',
    description: 'JSON encoder and decoder',
    symbols: [
      { name: 'dumps', kind: 'function', detail: 'dumps(obj, *, indent=None, sort_keys=False)', doc: 'Serialize obj to a JSON formatted str.' },
      { name: 'loads', kind: 'function', detail: 'loads(s, *, cls=None, object_hook=None)', doc: 'Deserialize s (a str, bytes or bytearray instance containing a JSON document) to a Python object.' },
      { name: 'dump', kind: 'function', detail: 'dump(obj, fp, *, indent=None)', doc: 'Serialize obj as a JSON formatted stream to fp.' },
      { name: 'load', kind: 'function', detail: 'load(fp, *, cls=None, object_hook=None)', doc: 'Deserialize fp to a Python object.' },
      { name: 'JSONDecoder', kind: 'class', detail: 'JSONDecoder()', doc: 'Simple JSON decoder.' },
      { name: 'JSONEncoder', kind: 'class', detail: 'JSONEncoder()', doc: 'Extensible JSON encoder for Python data structures.' },
      { name: 'JSONDecodeError', kind: 'exception', detail: 'JSONDecodeError(msg, doc, pos)', doc: 'Subclass of ValueError with JSON specific decode attributes.' }
    ]
  },

  datetime: {
    name: 'datetime',
    description: 'Basic date and time types',
    symbols: [
      { name: 'datetime', kind: 'class', detail: 'datetime(year, month, day, hour=0, minute=0, second=0)', doc: 'Combination of date and time objects.' },
      { name: 'date', kind: 'class', detail: 'date(year, month, day)', doc: 'An idealized naive date.' },
      { name: 'time', kind: 'class', detail: 'time(hour=0, minute=0, second=0, microsecond=0)', doc: 'An idealized time, independent of any particular day.' },
      { name: 'timedelta', kind: 'class', detail: 'timedelta(days=0, seconds=0, microseconds=0, milliseconds=0, minutes=0, hours=0, weeks=0)', doc: 'Difference between two date or time instances.' },
      { name: 'timezone', kind: 'class', detail: 'timezone(offset, name=None)', doc: 'Timezone object implementing tzinfo.' },
      { name: 'tzinfo', kind: 'class', detail: 'tzinfo()', doc: 'Abstract base class for time zone information objects.' },
      { name: 'MINYEAR', kind: 'constant', detail: '1', doc: 'Smallest year number allowed in a date or datetime object.' },
      { name: 'MAXYEAR', kind: 'constant', detail: '9999', doc: 'Largest year number allowed in a date or datetime object.' }
    ]
  },

  time: {
    name: 'time',
    description: 'Time access and conversions',
    symbols: [
      { name: 'time', kind: 'function', detail: 'time() -> float', doc: 'Return the current time in seconds since the Epoch as a floating point number.' },
      { name: 'sleep', kind: 'function', detail: 'sleep(secs)', doc: 'Delay execution for a given number of seconds.' },
      { name: 'perf_counter', kind: 'function', detail: 'perf_counter() -> float', doc: 'Performance counter for benchmarking.' },
      { name: 'monotonic', kind: 'function', detail: 'monotonic() -> float', doc: 'Monotonic clock, cannot go backwards.' },
      { name: 'process_time', kind: 'function', detail: 'process_time() -> float', doc: 'Process time for profiling.' },
      { name: 'localtime', kind: 'function', detail: 'localtime([secs])', doc: 'Convert a time expressed in seconds to local struct_time.' },
      { name: 'gmtime', kind: 'function', detail: 'gmtime([secs])', doc: 'Convert a time expressed in seconds to UTC struct_time.' },
      { name: 'strftime', kind: 'function', detail: 'strftime(format[, t])', doc: 'Convert a tuple or struct_time representing a time as returned by gmtime() or localtime() to a string as specified by the format argument.' },
      { name: 'strptime', kind: 'function', detail: 'strptime(string, format)', doc: 'Parse a string representing a time according to a format.' },
      { name: 'ctime', kind: 'function', detail: 'ctime([secs])', doc: 'Convert a time in seconds to a string.' },
      { name: 'asctime', kind: 'function', detail: 'asctime([t])', doc: 'Convert a tuple or struct_time to a string.' },
      { name: 'time_ns', kind: 'function', detail: 'time_ns() -> int', doc: 'Similar to time() but returns time as an integer number of nanoseconds.' }
    ]
  },

  re: {
    name: 're',
    description: 'Regular expression operations',
    symbols: [
      { name: 'search', kind: 'function', detail: 'search(pattern, string, flags=0)', doc: 'Scan through string looking for a match to the pattern.' },
      { name: 'match', kind: 'function', detail: 'match(pattern, string, flags=0)', doc: 'Try to apply the pattern at the start of the string.' },
      { name: 'fullmatch', kind: 'function', detail: 'fullmatch(pattern, string, flags=0)', doc: 'Try to apply the pattern to the entire string.' },
      { name: 'split', kind: 'function', detail: 'split(pattern, string, maxsplit=0, flags=0)', doc: 'Split the source string by the occurrences of the pattern.' },
      { name: 'findall', kind: 'function', detail: 'findall(pattern, string, flags=0)', doc: 'Return a list of all non-overlapping matches in the string.' },
      { name: 'finditer', kind: 'function', detail: 'finditer(pattern, string, flags=0)', doc: 'Return an iterator yielding match objects over all non-overlapping matches.' },
      { name: 'sub', kind: 'function', detail: 'sub(pattern, repl, string, count=0, flags=0)', doc: 'Return the string obtained by replacing the leftmost non-overlapping occurrences of pattern in string with the replacement repl.' },
      { name: 'subn', kind: 'function', detail: 'subn(pattern, repl, string, count=0, flags=0)', doc: 'Perform the same operation as sub(), but return a tuple (new_string, number_of_subs_made).' },
      { name: 'compile', kind: 'function', detail: 'compile(pattern, flags=0)', doc: 'Compile a regular expression pattern into a regular expression object.' },
      { name: 'escape', kind: 'function', detail: 'escape(pattern)', doc: 'Escape special characters in a string.' },
      { name: 'IGNORECASE', kind: 'constant', detail: 're.IGNORECASE (re.I)', doc: 'Perform case-insensitive matching.' },
      { name: 'MULTILINE', kind: 'constant', detail: 're.MULTILINE (re.M)', doc: 'Make begin/end of line match after/before line breaks.' },
      { name: 'DOTALL', kind: 'constant', detail: 're.DOTALL (re.S)', doc: 'Make the "." special character match any character at all, including a newline.' },
      { name: 'VERBOSE', kind: 'constant', detail: 're.VERBOSE (re.X)', doc: 'Allow writing regular expressions that look nicer and are more readable.' },
      { name: 'ASCII', kind: 'constant', detail: 're.ASCII (re.A)', doc: 'Make \\w, \\W, \\b, \\B, \\d, \\D, \\s and \\S perform ASCII-only matching.' }
    ]
  },

  collections: {
    name: 'collections',
    description: 'High-performance container datatypes',
    symbols: [
      { name: 'Counter', kind: 'class', detail: 'Counter(iterable_or_mapping=None)', doc: 'Dict subclass for counting hashable items.' },
      { name: 'defaultdict', kind: 'class', detail: 'defaultdict(default_factory=None)', doc: 'Dict subclass that calls a factory function to supply missing values.' },
      { name: 'OrderedDict', kind: 'class', detail: 'OrderedDict()', doc: 'Dict subclass that remembers the order entries were added.' },
      { name: 'deque', kind: 'class', detail: 'deque([iterable[, maxlen]])', doc: 'List-like container with fast appends and pops on either end.' },
      { name: 'namedtuple', kind: 'function', detail: 'namedtuple(typename, field_names)', doc: 'Returns a new subclass of tuple with named fields.' },
      { name: 'ChainMap', kind: 'class', detail: 'ChainMap(*maps)', doc: 'Dict-like class for creating a single view of multiple mappings.' },
      { name: 'UserDict', kind: 'class', detail: 'UserDict()', doc: 'Class that wraps dict objects for easier subclassing.' },
      { name: 'UserList', kind: 'class', detail: 'UserList()', doc: 'Class that wraps list objects for easier subclassing.' },
      { name: 'UserString', kind: 'class', detail: 'UserString()', doc: 'Class that wraps string objects for easier subclassing.' }
    ]
  },

  itertools: {
    name: 'itertools',
    description: 'Functions creating iterators for efficient looping',
    symbols: [
      { name: 'count', kind: 'function', detail: 'count(start=0, step=1)', doc: 'Make an iterator that returns evenly spaced values starting with start.' },
      { name: 'cycle', kind: 'function', detail: 'cycle(iterable)', doc: 'Make an iterator returning elements from the iterable and saving a copy of each.' },
      { name: 'repeat', kind: 'function', detail: 'repeat(object[, times])', doc: 'Make an iterator that returns object over and over again.' },
      { name: 'accumulate', kind: 'function', detail: 'accumulate(iterable[, func, *, initial=None])', doc: 'Make an iterator that returns accumulated sums or binary function results.' },
      { name: 'chain', kind: 'function', detail: 'chain(*iterables)', doc: 'Make an iterator that returns elements from the first iterable until it is exhausted.' },
      { name: 'compress', kind: 'function', detail: 'compress(data, selectors)', doc: 'Filter elements from data returning only those with corresponding true selector.' },
      { name: 'dropwhile', kind: 'function', detail: 'dropwhile(predicate, iterable)', doc: 'Drop items from the iterable while predicate(item) is true.' },
      { name: 'takewhile', kind: 'function', detail: 'takewhile(predicate, iterable)', doc: 'Make an iterator that returns elements from the iterable as long as the predicate is true.' },
      { name: 'filterfalse', kind: 'function', detail: 'filterfalse(predicate, iterable)', doc: 'Make an iterator that filters elements from iterable returning only those for which the predicate is False.' },
      { name: 'groupby', kind: 'function', detail: 'groupby(iterable, key=None)', doc: 'Make an iterator that returns consecutive keys and groups from the iterable.' },
      { name: 'islice', kind: 'function', detail: 'islice(iterable, [start,] stop [, step])', doc: 'Make an iterator that returns selected elements from the iterable.' },
      { name: 'starmap', kind: 'function', detail: 'starmap(function, iterable)', doc: 'Make an iterator that computes the function using arguments obtained from the iterable.' },
      { name: 'tee', kind: 'function', detail: 'tee(iterable, n=2)', doc: 'Return n independent iterators from a single iterable.' },
      { name: 'zip_longest', kind: 'function', detail: 'zip_longest(*iterables, fillvalue=None)', doc: 'Make an iterator that aggregates elements from each of the iterables with padding.' },
      { name: 'product', kind: 'function', detail: 'product(*iterables, repeat=1)', doc: 'Cartesian product of input iterables.' },
      { name: 'permutations', kind: 'function', detail: 'permutations(iterable, r=None)', doc: 'Return successive r length permutations of elements in the iterable.' },
      { name: 'combinations', kind: 'function', detail: 'combinations(iterable, r)', doc: 'Return r length subsequences of elements from the input iterable.' },
      { name: 'combinations_with_replacement', kind: 'function', detail: 'combinations_with_replacement(iterable, r)', doc: 'Return r length subsequences of elements from the input iterable allowing individual elements to be repeated.' }
    ]
  },

  functools: {
    name: 'functools',
    description: 'Higher-order functions and operations on callable objects',
    symbols: [
      { name: 'reduce', kind: 'function', detail: 'reduce(function, iterable[, initializer])', doc: 'Apply function of two arguments cumulatively to the items of iterable.' },
      { name: 'lru_cache', kind: 'function', detail: 'lru_cache(maxsize=128, typed=False)', doc: 'Decorator to wrap a function with a memoizing callable (Least Recently Used).' },
      { name: 'cache', kind: 'function', detail: 'cache(user_function)', doc: 'Simple unbounded function cache. Equivalent to lru_cache(maxsize=None).' },
      { name: 'partial', kind: 'class', detail: 'partial(func, /, *args, **keywords)', doc: 'Return a new partial object which when called will behave like func called with args and keywords.' },
      { name: 'wraps', kind: 'function', detail: 'wraps(wrapped, assigned=WRAPPER_ASSIGNMENTS, updated=WRAPPER_UPDATES)', doc: 'Decorator factory to update a wrapper function to look like wrapped function.' },
      { name: 'total_ordering', kind: 'function', detail: 'total_ordering(cls)', doc: 'Class decorator that fills in missing ordering methods.' },
      { name: 'singledispatch', kind: 'function', detail: 'singledispatch(func)', doc: 'Transform a function into a generic single-dispatch function.' },
      { name: 'cached_property', kind: 'class', detail: 'cached_property(func)', doc: 'Transform a method into a property whose value is computed once and cached.' },
      { name: 'cmp_to_key', kind: 'function', detail: 'cmp_to_key(mycmp)', doc: 'Convert a cmp= function into a key= function.' }
    ]
  },

  statistics: {
    name: 'statistics',
    description: 'Mathematical statistics functions',
    symbols: [
      { name: 'mean', kind: 'function', detail: 'mean(data)', doc: 'Return the sample arithmetic mean of data.' },
      { name: 'fmean', kind: 'function', detail: 'fmean(data, weights=None)', doc: 'Convert data to floats and compute the arithmetic mean.' },
      { name: 'geometric_mean', kind: 'function', detail: 'geometric_mean(data)', doc: 'Convert data to floats and compute the geometric mean.' },
      { name: 'harmonic_mean', kind: 'function', detail: 'harmonic_mean(data, weights=None)', doc: 'Return the harmonic mean of data.' },
      { name: 'median', kind: 'function', detail: 'median(data)', doc: 'Return the median (middle value) of numeric data.' },
      { name: 'median_low', kind: 'function', detail: 'median_low(data)', doc: 'Return the low median of numeric data.' },
      { name: 'median_high', kind: 'function', detail: 'median_high(data)', doc: 'Return the high median of numeric data.' },
      { name: 'median_grouped', kind: 'function', detail: 'median_grouped(data, interval=1)', doc: 'Return the median of grouped data.' },
      { name: 'mode', kind: 'function', detail: 'mode(data)', doc: 'Return the most common data point from discrete or nominal data.' },
      { name: 'multimode', kind: 'function', detail: 'multimode(data)', doc: 'Return a list of the most frequently occurring values.' },
      { name: 'pstdev', kind: 'function', detail: 'pstdev(data, mu=None)', doc: 'Return the population standard deviation.' },
      { name: 'pvariance', kind: 'function', detail: 'pvariance(data, mu=None)', doc: 'Return the population variance of data.' },
      { name: 'stdev', kind: 'function', detail: 'stdev(data, xbar=None)', doc: 'Return the sample standard deviation (the square root of the sample variance).' },
      { name: 'variance', kind: 'function', detail: 'variance(data, xbar=None)', doc: 'Return the sample variance of data.' },
      { name: 'quantiles', kind: 'function', detail: 'quantiles(data, *, n=4, method="exclusive")', doc: 'Divide data into n continuous intervals with equal probability.' },
      { name: 'correlation', kind: 'function', detail: 'correlation(x, y, /)', doc: 'Return Pearson’s correlation coefficient for two inputs.' },
      { name: 'covariance', kind: 'function', detail: 'covariance(x, y, /)', doc: 'Return the sample covariance of two variables x and y.' },
      { name: 'linear_regression', kind: 'function', detail: 'linear_regression(x, y, /)', doc: 'Return the slope and intercept of simple linear regression parameters.' }
    ]
  },

  typing: {
    name: 'typing',
    description: 'Support for type hints',
    symbols: [
      { name: 'List', kind: 'class', detail: 'List[T]', doc: 'Generic list type' },
      { name: 'Dict', kind: 'class', detail: 'Dict[K, V]', doc: 'Generic dictionary type' },
      { name: 'Set', kind: 'class', detail: 'Set[T]', doc: 'Generic set type' },
      { name: 'Tuple', kind: 'class', detail: 'Tuple[T, ...]', doc: 'Generic tuple type' },
      { name: 'Optional', kind: 'class', detail: 'Optional[T]', doc: 'Optional[T] is equivalent to Union[T, None]' },
      { name: 'Union', kind: 'class', detail: 'Union[T1, T2, ...]', doc: 'Union type; Union[X, Y] means either X or Y' },
      { name: 'Any', kind: 'class', detail: 'Any', doc: 'Special type indicating an unconstrained type' },
      { name: 'Callable', kind: 'class', detail: 'Callable[[Args], Ret]', doc: 'Callable type; Callable[[int], str] takes int and returns str' },
      { name: 'Iterable', kind: 'class', detail: 'Iterable[T]', doc: 'Generic iterable type' },
      { name: 'Iterator', kind: 'class', detail: 'Iterator[T]', doc: 'Generic iterator type' },
      { name: 'Generator', kind: 'class', detail: 'Generator[YieldType, SendType, ReturnType]', doc: 'Generator type' },
      { name: 'TypeVar', kind: 'function', detail: 'TypeVar(name, *constraints, bound=None)', doc: 'Type variable for generic types' },
      { name: 'Generic', kind: 'class', detail: 'Generic[*TypeVars]', doc: 'Abstract base class for generic types' },
      { name: 'Protocol', kind: 'class', detail: 'Protocol', doc: 'Base class for protocol classes (structural subtyping)' },
      { name: 'Literal', kind: 'class', detail: 'Literal[Values]', doc: 'Type that represents literal values' },
      { name: 'Final', kind: 'class', detail: 'Final[T]', doc: 'Special typing construct to indicate that a name cannot be re-assigned' },
      { name: 'ClassVar', kind: 'class', detail: 'ClassVar[T]', doc: 'Special type construct to mark class variables' },
      { name: 'TypedDict', kind: 'class', detail: 'TypedDict(typename, fields)', doc: 'Specialized dictionary with value types corresponding to specific string keys' },
      { name: 'NamedTuple', kind: 'class', detail: 'NamedTuple(typename, fields)', doc: 'Typed version of collections.namedtuple' },
      { name: 'overload', kind: 'function', detail: 'overload(func)', doc: 'Decorator for creating overloaded functions' },
      { name: 'cast', kind: 'function', detail: 'cast(typ, val)', doc: 'Cast a value to a type for type checkers' },
      { name: 'Sequence', kind: 'class', detail: 'Sequence[T]', doc: 'Generic sequence type' },
      { name: 'Mapping', kind: 'class', detail: 'Mapping[K, V]', doc: 'Generic mapping type' },
      { name: 'NoReturn', kind: 'class', detail: 'NoReturn', doc: 'Special type indicating that a function never returns' }
    ]
  },

  numpy: {
    name: 'numpy',
    description: 'The fundamental package for scientific computing with Python',
    symbols: [
      { name: 'array', kind: 'function', detail: 'array(object, dtype=None)', doc: 'Create a numpy ndarray from an array-like object.' },
      { name: 'zeros', kind: 'function', detail: 'zeros(shape, dtype=float)', doc: 'Return a new array of given shape and type, filled with zeros.' },
      { name: 'ones', kind: 'function', detail: 'ones(shape, dtype=None)', doc: 'Return a new array of given shape and type, filled with ones.' },
      { name: 'empty', kind: 'function', detail: 'empty(shape, dtype=float)', doc: 'Return a new array of given shape and type, without initializing entries.' },
      { name: 'full', kind: 'function', detail: 'full(shape, fill_value, dtype=None)', doc: 'Return a new array of given shape and type, filled with fill_value.' },
      { name: 'eye', kind: 'function', detail: 'eye(N, M=None, k=0, dtype=float)', doc: 'Return a 2-D array with ones on the diagonal and zeros elsewhere.' },
      { name: 'arange', kind: 'function', detail: 'arange([start,] stop[, step,], dtype=None)', doc: 'Return evenly spaced values within a given interval.' },
      { name: 'linspace', kind: 'function', detail: 'linspace(start, stop, num=50, endpoint=True)', doc: 'Return evenly spaced numbers over a specified interval.' },
      { name: 'logspace', kind: 'function', detail: 'logspace(start, stop, num=50, base=10.0)', doc: 'Return numbers spaced evenly on a log scale.' },
      { name: 'reshape', kind: 'function', detail: 'reshape(a, newshape, order="C")', doc: 'Gives a new shape to an array without changing its data.' },
      { name: 'transpose', kind: 'function', detail: 'transpose(a, axes=None)', doc: 'Reverse or permute the axes of an array.' },
      { name: 'dot', kind: 'function', detail: 'dot(a, b, out=None)', doc: 'Dot product of two arrays.' },
      { name: 'matmul', kind: 'function', detail: 'matmul(x1, x2)', doc: 'Matrix product of two arrays.' },
      { name: 'concatenate', kind: 'function', detail: 'concatenate((a1, a2, ...), axis=0)', doc: 'Join a sequence of arrays along an existing axis.' },
      { name: 'vstack', kind: 'function', detail: 'vstack(tup)', doc: 'Stack arrays in sequence vertically (row wise).' },
      { name: 'hstack', kind: 'function', detail: 'hstack(tup)', doc: 'Stack arrays in sequence horizontally (column wise).' },
      { name: 'mean', kind: 'function', detail: 'mean(a, axis=None, dtype=None)', doc: 'Compute the arithmetic mean along the specified axis.' },
      { name: 'std', kind: 'function', detail: 'std(a, axis=None, dtype=None)', doc: 'Compute the standard deviation along the specified axis.' },
      { name: 'var', kind: 'function', detail: 'var(a, axis=None, dtype=None)', doc: 'Compute the variance along the specified axis.' },
      { name: 'sum', kind: 'function', detail: 'sum(a, axis=None, dtype=None)', doc: 'Sum of array elements over a given axis.' },
      { name: 'prod', kind: 'function', detail: 'prod(a, axis=None, dtype=None)', doc: 'Return the product of array elements over a given axis.' },
      { name: 'min', kind: 'function', detail: 'min(a, axis=None)', doc: 'Return the minimum of an array or minimum along an axis.' },
      { name: 'max', kind: 'function', detail: 'max(a, axis=None)', doc: 'Return the maximum of an array or maximum along an axis.' },
      { name: 'argmin', kind: 'function', detail: 'argmin(a, axis=None)', doc: 'Returns the indices of the minimum values along an axis.' },
      { name: 'argmax', kind: 'function', detail: 'argmax(a, axis=None)', doc: 'Returns the indices of the maximum values along an axis.' },
      { name: 'clip', kind: 'function', detail: 'clip(a, a_min, a_max)', doc: 'Clip (limit) the values in an array.' },
      { name: 'where', kind: 'function', detail: 'where(condition, [x, y])', doc: 'Return elements chosen from x or y depending on condition.' },
      { name: 'random', kind: 'module', detail: 'numpy.random', doc: 'Random sampling subpackage' },
      { name: 'linalg', kind: 'module', detail: 'numpy.linalg', doc: 'Linear algebra subpackage' },
      { name: 'ndarray', kind: 'class', detail: 'ndarray(shape, dtype=float)', doc: 'N-dimensional array object' },
      { name: 'float64', kind: 'class', detail: 'float64', doc: '64-bit precision floating point number type' },
      { name: 'int32', kind: 'class', detail: 'int32', doc: '32-bit integer type' },
      { name: 'int64', kind: 'class', detail: 'int64', doc: '64-bit integer type' },
      { name: 'pi', kind: 'constant', detail: '3.141592653589793', doc: 'NumPy π constant' },
      { name: 'e', kind: 'constant', detail: '2.718281828459045', doc: 'NumPy e constant' }
    ]
  },

  pandas: {
    name: 'pandas',
    description: 'Powerful data structures for data analysis and manipulation',
    symbols: [
      { name: 'DataFrame', kind: 'class', detail: 'DataFrame(data=None, index=None, columns=None)', doc: 'Two-dimensional, size-mutable, tabular data structure with labeled axes.' },
      { name: 'Series', kind: 'class', detail: 'Series(data=None, index=None, dtype=None)', doc: 'One-dimensional ndarray with axis labels.' },
      { name: 'read_csv', kind: 'function', detail: 'read_csv(filepath_or_buffer, ...)', doc: 'Read a comma-separated values (csv) file into DataFrame.' },
      { name: 'read_json', kind: 'function', detail: 'read_json(path_or_buf=None, ...)', doc: 'Convert a JSON string to pandas object.' },
      { name: 'read_excel', kind: 'function', detail: 'read_excel(io, sheet_name=0, ...)', doc: 'Read an Excel file into a pandas DataFrame.' },
      { name: 'read_sql', kind: 'function', detail: 'read_sql(sql, con, ...)', doc: 'Read SQL query or database table into a DataFrame.' },
      { name: 'concat', kind: 'function', detail: 'concat(objs, axis=0, join="outer", ...)', doc: 'Concatenate pandas objects along a particular axis.' },
      { name: 'merge', kind: 'function', detail: 'merge(left, right, how="inner", on=None, ...)', doc: 'Merge DataFrame or named Series objects with a database-style join.' },
      { name: 'to_datetime', kind: 'function', detail: 'to_datetime(arg, errors="raise", ...)', doc: 'Convert argument to datetime.' },
      { name: 'date_range', kind: 'function', detail: 'date_range(start=None, end=None, periods=None, freq=None)', doc: 'Return a fixed frequency DatetimeIndex.' },
      { name: 'isna', kind: 'function', detail: 'isna(obj)', doc: 'Detect missing values for an array-like object.' },
      { name: 'notna', kind: 'function', detail: 'notna(obj)', doc: 'Detect non-missing values for an array-like object.' },
      { name: 'pivot_table', kind: 'function', detail: 'pivot_table(data, values=None, index=None, columns=None, aggfunc="mean")', doc: 'Create a spreadsheet-style pivot table as a DataFrame.' },
      { name: 'crosstab', kind: 'function', detail: 'crosstab(index, columns, values=None, rownames=None, colnames=None)', doc: 'Compute a simple cross tabulation of two (or more) factors.' },
      { name: 'cut', kind: 'function', detail: 'cut(x, bins, right=True, labels=None)', doc: 'Bin values into discrete intervals.' },
      { name: 'qcut', kind: 'function', detail: 'qcut(x, q, labels=None)', doc: 'Quantile-based discretization function.' },
      { name: 'get_dummies', kind: 'function', detail: 'get_dummies(data, prefix=None, ...)', doc: 'Convert categorical variable into dummy/indicator variables.' }
    ]
  },

  'matplotlib.pyplot': {
    name: 'matplotlib.pyplot',
    description: 'MATLAB-like plotting framework',
    symbols: [
      { name: 'plot', kind: 'function', detail: 'plot(*args, scalex=True, scaley=True, data=None, **kwargs)', doc: 'Plot y versus x as lines and/or markers.' },
      { name: 'scatter', kind: 'function', detail: 'scatter(x, y, s=None, c=None, marker=None, ...)', doc: 'A scatter plot of y vs. x with varying marker size and/or color.' },
      { name: 'bar', kind: 'function', detail: 'bar(x, height, width=0.8, bottom=None, *, align="center", ...)', doc: 'Make a bar plot.' },
      { name: 'barh', kind: 'function', detail: 'barh(y, width, height=0.8, left=None, *, align="center", ...)', doc: 'Make a horizontal bar plot.' },
      { name: 'hist', kind: 'function', detail: 'hist(x, bins=None, range=None, density=False, ...)', doc: 'Compute and plot a histogram.' },
      { name: 'pie', kind: 'function', detail: 'pie(x, explode=None, labels=None, autopct=None, ...)', doc: 'Plot a pie chart.' },
      { name: 'boxplot', kind: 'function', detail: 'boxplot(x, notch=None, sym=None, vert=None, ...)', doc: 'Draw a box and whisker plot.' },
      { name: 'imshow', kind: 'function', detail: 'imshow(X, cmap=None, norm=None, aspect=None, ...)', doc: 'Display data as an image, i.e., on a 2D regular raster.' },
      { name: 'figure', kind: 'function', detail: 'figure(num=None, figsize=None, dpi=None, ...)', doc: 'Create a new figure, or activate an existing figure.' },
      { name: 'subplots', kind: 'function', detail: 'subplots(nrows=1, ncols=1, *, sharex=False, sharey=False, ...)', doc: 'Create a figure and a set of subplots.' },
      { name: 'subplot', kind: 'function', detail: 'subplot(*args, **kwargs)', doc: 'Add an Axes to the current figure or retrieve an existing Axes.' },
      { name: 'title', kind: 'function', detail: 'title(label, fontdict=None, loc=None, pad=None, ...)', doc: 'Set a title for the Axes.' },
      { name: 'xlabel', kind: 'function', detail: 'xlabel(xlabel, fontdict=None, labelpad=None, ...)', doc: 'Set the label for the x-axis.' },
      { name: 'ylabel', kind: 'function', detail: 'ylabel(ylabel, fontdict=None, labelpad=None, ...)', doc: 'Set the label for the y-axis.' },
      { name: 'xlim', kind: 'function', detail: 'xlim(*args, **kwargs)', doc: 'Get or set the x limits of the current axes.' },
      { name: 'ylim', kind: 'function', detail: 'ylim(*args, **kwargs)', doc: 'Get or set the y limits of the current axes.' },
      { name: 'grid', kind: 'function', detail: 'grid(visible=None, which="major", axis="both", ...)', doc: 'Configure the grid lines.' },
      { name: 'legend', kind: 'function', detail: 'legend(*args, **kwargs)', doc: 'Place a legend on the Axes.' },
      { name: 'show', kind: 'function', detail: 'show(*, block=None)', doc: 'Display all open figures.' },
      { name: 'savefig', kind: 'function', detail: 'savefig(*args, **kwargs)', doc: 'Save the current figure.' },
      { name: 'clf', kind: 'function', detail: 'clf()', doc: 'Clear the current figure.' },
      { name: 'close', kind: 'function', detail: 'close([fig])', doc: 'Close a figure window.' },
      { name: 'tight_layout', kind: 'function', detail: 'tight_layout(*, pad=1.08, h_pad=None, w_pad=None, rect=None)', doc: 'Adjust the padding between and around subplots.' },
      { name: 'axhline', kind: 'function', detail: 'axhline(y=0, xmin=0, xmax=1, ...)', doc: 'Add a horizontal line across the axis.' },
      { name: 'axvline', kind: 'function', detail: 'axvline(x=0, ymin=0, ymax=1, ...)', doc: 'Add a vertical line across the axis.' },
      { name: 'colorbar', kind: 'function', detail: 'colorbar(mappable=None, cax=None, ax=None, ...)', doc: 'Add a colorbar to a plot.' }
    ]
  },

  requests: {
    name: 'requests',
    description: 'HTTP for Humans',
    symbols: [
      { name: 'get', kind: 'function', detail: 'get(url, params=None, **kwargs)', doc: 'Sends a GET request. Returns Response object.' },
      { name: 'post', kind: 'function', detail: 'post(url, data=None, json=None, **kwargs)', doc: 'Sends a POST request.' },
      { name: 'put', kind: 'function', detail: 'put(url, data=None, **kwargs)', doc: 'Sends a PUT request.' },
      { name: 'delete', kind: 'function', detail: 'delete(url, **kwargs)', doc: 'Sends a DELETE request.' },
      { name: 'patch', kind: 'function', detail: 'patch(url, data=None, **kwargs)', doc: 'Sends a PATCH request.' },
      { name: 'head', kind: 'function', detail: 'head(url, **kwargs)', doc: 'Sends a HEAD request.' },
      { name: 'request', kind: 'function', detail: 'request(method, url, **kwargs)', doc: 'Constructs and sends a Request.' },
      { name: 'Session', kind: 'class', detail: 'Session()', doc: 'A Requests session.' },
      { name: 'Response', kind: 'class', detail: 'Response()', doc: 'The Response object, which contains a server’s response to an HTTP request.' },
      { name: 'codes', kind: 'constant', detail: 'requests.codes', doc: 'Lookup dictionary for HTTP status codes (e.g. requests.codes.ok)' }
    ]
  },

  colorama: {
    name: 'colorama',
    description: 'Cross-platform colored terminal text',
    symbols: [
      { name: 'Fore', kind: 'class', detail: 'Fore (RED, GREEN, BLUE, YELLOW, CYAN, MAGENTA, WHITE, RESET...)', doc: 'Foreground ANSI color codes' },
      { name: 'Back', kind: 'class', detail: 'Back (RED, GREEN, BLUE, YELLOW, CYAN, MAGENTA, WHITE, RESET...)', doc: 'Background ANSI color codes' },
      { name: 'Style', kind: 'class', detail: 'Style (BRIGHT, DIM, NORMAL, RESET_ALL)', doc: 'ANSI style codes' },
      { name: 'Cursor', kind: 'class', detail: 'Cursor (UP, DOWN, FORWARD, BACK, POS)', doc: 'Terminal cursor positioning helper' },
      { name: 'init', kind: 'function', detail: 'init(autoreset=False, convert=None, strip=None, wrap=True)', doc: 'Initialize colorama for terminal ANSI color translation' },
      { name: 'deinit', kind: 'function', detail: 'deinit()', doc: 'De-initialize colorama' },
      { name: 'reinit', kind: 'function', detail: 'reinit()', doc: 'Re-initialize colorama' },
      { name: 'just_fix_windows_console', kind: 'function', detail: 'just_fix_windows_console()', doc: 'Enable ANSI escape codes on Windows consoles' },
      { name: 'AnsiToWin32', kind: 'class', detail: 'AnsiToWin32(stream)', doc: 'Wrapper for streams to translate ANSI codes' }
    ]
  },

  'colorama.Fore': {
    name: 'colorama.Fore',
    description: 'Foreground ANSI color codes',
    symbols: [
      { name: 'BLACK', kind: 'constant', detail: 'Fore.BLACK = "\\033[30m"', doc: 'Black foreground text color' },
      { name: 'RED', kind: 'constant', detail: 'Fore.RED = "\\033[31m"', doc: 'Red foreground text color' },
      { name: 'GREEN', kind: 'constant', detail: 'Fore.GREEN = "\\033[32m"', doc: 'Green foreground text color' },
      { name: 'YELLOW', kind: 'constant', detail: 'Fore.YELLOW = "\\033[33m"', doc: 'Yellow foreground text color' },
      { name: 'BLUE', kind: 'constant', detail: 'Fore.BLUE = "\\033[34m"', doc: 'Blue foreground text color' },
      { name: 'MAGENTA', kind: 'constant', detail: 'Fore.MAGENTA = "\\033[35m"', doc: 'Magenta foreground text color' },
      { name: 'CYAN', kind: 'constant', detail: 'Fore.CYAN = "\\033[36m"', doc: 'Cyan foreground text color' },
      { name: 'WHITE', kind: 'constant', detail: 'Fore.WHITE = "\\033[37m"', doc: 'White foreground text color' },
      { name: 'RESET', kind: 'constant', detail: 'Fore.RESET = "\\033[39m"', doc: 'Reset foreground text color to default' },
      { name: 'LIGHTBLACK_EX', kind: 'constant', detail: 'Fore.LIGHTBLACK_EX = "\\033[90m"', doc: 'Bright/Light Black (Gray) foreground color' },
      { name: 'LIGHTRED_EX', kind: 'constant', detail: 'Fore.LIGHTRED_EX = "\\033[91m"', doc: 'Bright/Light Red foreground color' },
      { name: 'LIGHTGREEN_EX', kind: 'constant', detail: 'Fore.LIGHTGREEN_EX = "\\033[92m"', doc: 'Bright/Light Green foreground color' },
      { name: 'LIGHTYELLOW_EX', kind: 'constant', detail: 'Fore.LIGHTYELLOW_EX = "\\033[93m"', doc: 'Bright/Light Yellow foreground color' },
      { name: 'LIGHTBLUE_EX', kind: 'constant', detail: 'Fore.LIGHTBLUE_EX = "\\033[94m"', doc: 'Bright/Light Blue foreground color' },
      { name: 'LIGHTMAGENTA_EX', kind: 'constant', detail: 'Fore.LIGHTMAGENTA_EX = "\\033[95m"', doc: 'Bright/Light Magenta foreground color' },
      { name: 'LIGHTCYAN_EX', kind: 'constant', detail: 'Fore.LIGHTCYAN_EX = "\\033[96m"', doc: 'Bright/Light Cyan foreground color' },
      { name: 'LIGHTWHITE_EX', kind: 'constant', detail: 'Fore.LIGHTWHITE_EX = "\\033[97m"', doc: 'Bright/Light White foreground color' }
    ]
  },

  'colorama.Back': {
    name: 'colorama.Back',
    description: 'Background ANSI color codes',
    symbols: [
      { name: 'BLACK', kind: 'constant', detail: 'Back.BLACK = "\\033[40m"', doc: 'Black background color' },
      { name: 'RED', kind: 'constant', detail: 'Back.RED = "\\033[41m"', doc: 'Red background color' },
      { name: 'GREEN', kind: 'constant', detail: 'Back.GREEN = "\\033[42m"', doc: 'Green background color' },
      { name: 'YELLOW', kind: 'constant', detail: 'Back.YELLOW = "\\033[43m"', doc: 'Yellow background color' },
      { name: 'BLUE', kind: 'constant', detail: 'Back.BLUE = "\\033[44m"', doc: 'Blue background color' },
      { name: 'MAGENTA', kind: 'constant', detail: 'Back.MAGENTA = "\\033[45m"', doc: 'Magenta background color' },
      { name: 'CYAN', kind: 'constant', detail: 'Back.CYAN = "\\033[46m"', doc: 'Cyan background color' },
      { name: 'WHITE', kind: 'constant', detail: 'Back.WHITE = "\\033[47m"', doc: 'White background color' },
      { name: 'RESET', kind: 'constant', detail: 'Back.RESET = "\\033[49m"', doc: 'Reset background color to default' },
      { name: 'LIGHTBLACK_EX', kind: 'constant', detail: 'Back.LIGHTBLACK_EX = "\\033[100m"', doc: 'Bright/Light Black background color' },
      { name: 'LIGHTRED_EX', kind: 'constant', detail: 'Back.LIGHTRED_EX = "\\033[101m"', doc: 'Bright/Light Red background color' },
      { name: 'LIGHTGREEN_EX', kind: 'constant', detail: 'Back.LIGHTGREEN_EX = "\\033[102m"', doc: 'Bright/Light Green background color' },
      { name: 'LIGHTYELLOW_EX', kind: 'constant', detail: 'Back.LIGHTYELLOW_EX = "\\033[103m"', doc: 'Bright/Light Yellow background color' },
      { name: 'LIGHTBLUE_EX', kind: 'constant', detail: 'Back.LIGHTBLUE_EX = "\\033[104m"', doc: 'Bright/Light Blue background color' },
      { name: 'LIGHTMAGENTA_EX', kind: 'constant', detail: 'Back.LIGHTMAGENTA_EX = "\\033[105m"', doc: 'Bright/Light Magenta background color' },
      { name: 'LIGHTCYAN_EX', kind: 'constant', detail: 'Back.LIGHTCYAN_EX = "\\033[106m"', doc: 'Bright/Light Cyan background color' },
      { name: 'LIGHTWHITE_EX', kind: 'constant', detail: 'Back.LIGHTWHITE_EX = "\\033[107m"', doc: 'Bright/Light White background color' }
    ]
  },

  'colorama.Style': {
    name: 'colorama.Style',
    description: 'ANSI text style codes',
    symbols: [
      { name: 'BRIGHT', kind: 'constant', detail: 'Style.BRIGHT = "\\033[1m"', doc: 'Bright / Bold text style' },
      { name: 'DIM', kind: 'constant', detail: 'Style.DIM = "\\033[2m"', doc: 'Dim / faint text style' },
      { name: 'NORMAL', kind: 'constant', detail: 'Style.NORMAL = "\\033[22m"', doc: 'Normal text intensity' },
      { name: 'RESET_ALL', kind: 'constant', detail: 'Style.RESET_ALL = "\\033[0m"', doc: 'Reset all colors and text formatting' }
    ]
  },

  termcolor: {
    name: 'termcolor',
    description: 'ANSII Color formatting for output in terminal',
    symbols: [
      { name: 'colored', kind: 'function', detail: 'colored(text, color=None, on_color=None, attrs=None, *, no_color=None, force_color=None)', doc: 'Colorize text with optional background color and style attributes' },
      { name: 'cprint', kind: 'function', detail: 'cprint(text, color=None, on_color=None, attrs=None, *, no_color=None, force_color=None, **kwargs)', doc: 'Print colorized text directly to standard output' },
      { name: 'COLORS', kind: 'constant', detail: 'dict of available foreground colors', doc: 'Available foreground color names: red, green, yellow, blue, magenta, cyan, white, grey...' },
      { name: 'HIGHLIGHTS', kind: 'constant', detail: 'dict of available background highlights', doc: 'Available background highlight names: on_red, on_green, on_blue, on_yellow...' },
      { name: 'ATTRIBUTES', kind: 'constant', detail: 'dict of available text attributes', doc: 'Available text attributes: bold, dark, underline, blink, reverse, concealed, strike' }
    ]
  },

  colored: {
    name: 'colored',
    description: 'Simple library for color and formatting in terminal',
    symbols: [
      { name: 'Fore', kind: 'class', detail: 'Fore.red, Fore.green, Fore.blue...', doc: 'Foreground color palette' },
      { name: 'Back', kind: 'class', detail: 'Back.red, Back.green, Back.blue...', doc: 'Background color palette' },
      { name: 'Style', kind: 'class', detail: 'Style.bold, Style.underline, Style.reset...', doc: 'Text style formatting palette' },
      { name: 'fg', kind: 'function', detail: 'fg(color)', doc: 'Get foreground color escape code by name or 256-color number' },
      { name: 'bg', kind: 'function', detail: 'bg(color)', doc: 'Get background color escape code by name or 256-color number' },
      { name: 'attr', kind: 'function', detail: 'attr(style)', doc: 'Get text attribute/style code' },
      { name: 'stylize', kind: 'function', detail: 'stylize(text, style)', doc: 'Format text with specified style' }
    ]
  },

  rich: {
    name: 'rich',
    description: 'Rich text and beautiful formatting in the terminal',
    symbols: [
      { name: 'print', kind: 'function', detail: 'print(*objects, sep=" ", end="\\n", ...)', doc: 'Print rich markup and syntax-highlighted data to the terminal' },
      { name: 'inspect', kind: 'function', detail: 'inspect(obj, ...)', doc: 'Inspect any Python object with rich formatting and documentation' },
      { name: 'Console', kind: 'class', detail: 'Console()', doc: 'High-level console object for printing rich styled text and renderables' },
      { name: 'Table', kind: 'class', detail: 'Table(title=None)', doc: 'Render tabular data with borders, columns, and color styles' },
      { name: 'Panel', kind: 'class', detail: 'Panel(renderable, title=None)', doc: 'Draw a decorative border panel around text or renderables' },
      { name: 'Text', kind: 'class', detail: 'Text(text="", style=None)', doc: 'A string with character-level styling and colors' }
    ]
  },

  'rich.console': {
    name: 'rich.console',
    description: 'Rich Console module',
    symbols: [
      { name: 'Console', kind: 'class', detail: 'Console()', doc: 'High-level terminal console object' },
      { name: 'ConsoleOptions', kind: 'class', detail: 'ConsoleOptions', doc: 'Console rendering options' }
    ]
  },

  'rich.table': {
    name: 'rich.table',
    description: 'Rich Table module',
    symbols: [
      { name: 'Table', kind: 'class', detail: 'Table(title=None)', doc: 'Render formatted data in ASCII/Unicode tables' },
      { name: 'Column', kind: 'class', detail: 'Column(header=None)', doc: 'Table column definition' }
    ]
  },

  'rich.panel': {
    name: 'rich.panel',
    description: 'Rich Panel module',
    symbols: [
      { name: 'Panel', kind: 'class', detail: 'Panel(renderable, title=None, subtitle=None)', doc: 'Draw a styled border box around content' }
    ]
  },

  'rich.text': {
    name: 'rich.text',
    description: 'Rich Text module',
    symbols: [
      { name: 'Text', kind: 'class', detail: 'Text(text="", style=None)', doc: 'Text with character-level color styling' }
    ]
  },

  pyfiglet: {
    name: 'pyfiglet',
    description: 'Generate ASCII art text banners from plain strings',
    symbols: [
      { name: 'figlet_format', kind: 'function', detail: 'figlet_format(text, font="standard")', doc: 'Render string into large ASCII art text banner' },
      { name: 'Figlet', kind: 'class', detail: 'Figlet(font="standard")', doc: 'Figlet renderer class instance' }
    ]
  }
};

export const COMMON_MODULE_NAMES = [
  'math', 'random', 'sys', 'os', 'os.path', 'json', 'datetime', 'time', 're', 'turtle',
  'collections', 'itertools', 'functools', 'statistics', 'typing', 'numpy',
  'pandas', 'matplotlib', 'matplotlib.pyplot', 'requests', 'colorama', 'termcolor',
  'colored', 'rich', 'rich.console', 'rich.table', 'rich.panel', 'rich.text', 'pyfiglet',
  'scipy', 'sympy', 'sklearn', 'seaborn', 'sqlite3', 'csv', 'io', 'string',
  'copy', 'asyncio', 'queue', 'threading', 'pathlib', 'decimal', 'fractions',
  'bisect', 'heapq', 'urllib', 'urllib.request', 'hashlib', 'base64', 'shutil',
  'glob', 'tempfile', 'unittest', 'dataclasses', 'enum', 'pickle', 'gzip'
];

export const PYTHON_EXCEPTION_SYMBOLS: PythonSymbol[] = [
  { name: 'Exception', kind: 'exception', detail: 'Exception', doc: 'Common base class for all non-exit exceptions.' },
  { name: 'ValueError', kind: 'exception', detail: 'ValueError', doc: 'Inappropriate argument value (of correct type).' },
  { name: 'TypeError', kind: 'exception', detail: 'TypeError', doc: 'Inappropriate argument type.' },
  { name: 'KeyError', kind: 'exception', detail: 'KeyError', doc: 'Mapping key not found.' },
  { name: 'IndexError', kind: 'exception', detail: 'IndexError', doc: 'Sequence index out of range.' },
  { name: 'FileNotFoundError', kind: 'exception', detail: 'FileNotFoundError', doc: 'File or directory does not exist.' },
  { name: 'ZeroDivisionError', kind: 'exception', detail: 'ZeroDivisionError', doc: 'Second argument to a division or modulo operation was zero.' },
  { name: 'AttributeError', kind: 'exception', detail: 'AttributeError', doc: 'Attribute not found in object.' },
  { name: 'ImportError', kind: 'exception', detail: 'ImportError', doc: 'Import can’t find module or name.' },
  { name: 'ModuleNotFoundError', kind: 'exception', detail: 'ModuleNotFoundError', doc: 'Module not found by import statement.' },
  { name: 'RuntimeError', kind: 'exception', detail: 'RuntimeError', doc: 'Unspecified run-time error.' },
  { name: 'StopIteration', kind: 'exception', detail: 'StopIteration', doc: 'Signal that there are no further items produced by an iterator.' },
  { name: 'KeyboardInterrupt', kind: 'exception', detail: 'KeyboardInterrupt', doc: 'Program interrupted by user.' },
  { name: 'NameError', kind: 'exception', detail: 'NameError', doc: 'Name not found globally.' },
  { name: 'UnboundLocalError', kind: 'exception', detail: 'UnboundLocalError', doc: 'Local name referenced but not bound to a value.' },
  { name: 'OverflowError', kind: 'exception', detail: 'OverflowError', doc: 'Result too large to be represented.' },
  { name: 'RecursionError', kind: 'exception', detail: 'RecursionError', doc: 'Maximum recursion depth exceeded.' },
  { name: 'AssertionError', kind: 'exception', detail: 'AssertionError', doc: 'Assertion statement failed.' },
  { name: 'NotImplementedError', kind: 'exception', detail: 'NotImplementedError', doc: 'Method or function hasn’t been implemented yet.' },
  { name: 'TimeoutError', kind: 'exception', detail: 'TimeoutError', doc: 'Timeout expired.' }
];

export const PYTHON_DATA_TYPE_METHODS: Record<string, PythonSymbol[]> = {
  string: [
    { name: 'split', kind: 'method', detail: 's.split(sep=None, maxsplit=-1)', doc: 'Return a list of the words in s, using sep as the delimiter string.' },
    { name: 'join', kind: 'method', detail: 's.join(iterable)', doc: 'Concatenate any number of strings with s as delimiter.' },
    { name: 'replace', kind: 'method', detail: 's.replace(old, new[, count])', doc: 'Return a copy with all occurrences of substring old replaced by new.' },
    { name: 'strip', kind: 'method', detail: 's.strip([chars])', doc: 'Return a copy of s with leading and trailing whitespace removed.' },
    { name: 'lstrip', kind: 'method', detail: 's.lstrip([chars])', doc: 'Return a copy of s with leading whitespace removed.' },
    { name: 'rstrip', kind: 'method', detail: 's.rstrip([chars])', doc: 'Return a copy of s with trailing whitespace removed.' },
    { name: 'lower', kind: 'method', detail: 's.lower()', doc: 'Return a copy of s converted to lowercase.' },
    { name: 'upper', kind: 'method', detail: 's.upper()', doc: 'Return a copy of s converted to uppercase.' },
    { name: 'title', kind: 'method', detail: 's.title()', doc: 'Return a version of s where each word is titlecased.' },
    { name: 'capitalize', kind: 'method', detail: 's.capitalize()', doc: 'Return a capitalized version of s.' },
    { name: 'startswith', kind: 'method', detail: 's.startswith(prefix[, start[, end]])', doc: 'Return True if s starts with the specified prefix.' },
    { name: 'endswith', kind: 'method', detail: 's.endswith(suffix[, start[, end]])', doc: 'Return True if s ends with the specified suffix.' },
    { name: 'find', kind: 'method', detail: 's.find(sub[, start[, end]])', doc: 'Return the lowest index in s where substring sub is found (-1 on failure).' },
    { name: 'rfind', kind: 'method', detail: 's.rfind(sub[, start[, end]])', doc: 'Return the highest index in s where substring sub is found (-1 on failure).' },
    { name: 'count', kind: 'method', detail: 's.count(sub[, start[, end]])', doc: 'Return the number of non-overlapping occurrences of substring sub.' },
    { name: 'format', kind: 'method', detail: 's.format(*args, **kwargs)', doc: 'Perform a string formatting operation.' },
    { name: 'encode', kind: 'method', detail: 's.encode(encoding="utf-8", errors="strict")', doc: 'Encode the string using the codec registered for encoding.' },
    { name: 'isdigit', kind: 'method', detail: 's.isdigit()', doc: 'Return True if all characters in s are digits.' },
    { name: 'isalpha', kind: 'method', detail: 's.isalpha()', doc: 'Return True if all characters in s are alphabetic.' },
    { name: 'isalnum', kind: 'method', detail: 's.isalnum()', doc: 'Return True if all characters in s are alphanumeric.' },
    { name: 'isspace', kind: 'method', detail: 's.isspace()', doc: 'Return True if all characters in s are whitespace.' },
    { name: 'splitlines', kind: 'method', detail: 's.splitlines(keepends=False)', doc: 'Return a list of the lines in s, breaking at line boundaries.' },
    { name: 'center', kind: 'method', detail: 's.center(width[, fillchar])', doc: 'Return centered in a string of length width.' },
    { name: 'zfill', kind: 'method', detail: 's.zfill(width)', doc: 'Pad a numeric string s with zeros on the left, to fill a given width.' }
  ],
  list: [
    { name: 'append', kind: 'method', detail: 'list.append(item)', doc: 'Append item to the end of the list.' },
    { name: 'extend', kind: 'method', detail: 'list.extend(iterable)', doc: 'Extend the list by appending all the items from the iterable.' },
    { name: 'insert', kind: 'method', detail: 'list.insert(i, item)', doc: 'Insert an item at a given position i.' },
    { name: 'remove', kind: 'method', detail: 'list.remove(item)', doc: 'Remove the first item from the list whose value is equal to item.' },
    { name: 'pop', kind: 'method', detail: 'list.pop([i])', doc: 'Remove the item at the given position in the list, and return it.' },
    { name: 'clear', kind: 'method', detail: 'list.clear()', doc: 'Remove all items from the list.' },
    { name: 'index', kind: 'method', detail: 'list.index(item, [start, [stop]])', doc: 'Return zero-based index in the list of the first item whose value is equal to item.' },
    { name: 'count', kind: 'method', detail: 'list.count(item)', doc: 'Return the number of times item appears in the list.' },
    { name: 'sort', kind: 'method', detail: 'list.sort(key=None, reverse=False)', doc: 'Sort the items of the list in place.' },
    { name: 'reverse', kind: 'method', detail: 'list.reverse()', doc: 'Reverse the elements of the list in place.' },
    { name: 'copy', kind: 'method', detail: 'list.copy()', doc: 'Return a shallow copy of the list.' }
  ],
  dict: [
    { name: 'keys', kind: 'method', detail: 'dict.keys()', doc: 'Return a new view of the dictionary’s keys.' },
    { name: 'values', kind: 'method', detail: 'dict.values()', doc: 'Return a new view of the dictionary’s values.' },
    { name: 'items', kind: 'method', detail: 'dict.items()', doc: 'Return a new view of the dictionary’s items ((key, value) pairs).' },
    { name: 'get', kind: 'method', detail: 'dict.get(key[, default])', doc: 'Return the value for key if key is in the dictionary, else default.' },
    { name: 'pop', kind: 'method', detail: 'dict.pop(key[, default])', doc: 'If key is in the dictionary, remove it and return its value, else return default.' },
    { name: 'popitem', kind: 'method', detail: 'dict.popitem()', doc: 'Remove and return a (key, value) pair from the dictionary in LIFO order.' },
    { name: 'update', kind: 'method', detail: 'dict.update([other])', doc: 'Update the dictionary with the key/value pairs from other, overwriting existing keys.' },
    { name: 'clear', kind: 'method', detail: 'dict.clear()', doc: 'Remove all items from the dictionary.' },
    { name: 'setdefault', kind: 'method', detail: 'dict.setdefault(key[, default])', doc: 'If key is in the dictionary, return its value. If not, insert key with a value of default.' },
    { name: 'copy', kind: 'method', detail: 'dict.copy()', doc: 'Return a shallow copy of the dictionary.' }
  ],
  set: [
    { name: 'add', kind: 'method', detail: 'set.add(elem)', doc: 'Add element elem to the set.' },
    { name: 'remove', kind: 'method', detail: 'set.remove(elem)', doc: 'Remove element elem from the set. Raises KeyError if elem is not contained in the set.' },
    { name: 'discard', kind: 'method', detail: 'set.discard(elem)', doc: 'Remove element elem from the set if it is present.' },
    { name: 'pop', kind: 'method', detail: 'set.pop()', doc: 'Remove and return an arbitrary element from the set. Raises KeyError if the set is empty.' },
    { name: 'clear', kind: 'method', detail: 'set.clear()', doc: 'Remove all elements from the set.' },
    { name: 'union', kind: 'method', detail: 'set.union(*others)', doc: 'Return a new set with elements from the set and all others.' },
    { name: 'intersection', kind: 'method', detail: 'set.intersection(*others)', doc: 'Return a new set with elements common to the set and all others.' },
    { name: 'difference', kind: 'method', detail: 'set.difference(*others)', doc: 'Return a new set with elements in the set that are not in the others.' },
    { name: 'symmetric_difference', kind: 'method', detail: 'set.symmetric_difference(other)', doc: 'Return a new set with elements in either the set or other but not both.' },
    { name: 'issubset', kind: 'method', detail: 'set.issubset(other)', doc: 'Test whether every element in the set is in other.' },
    { name: 'issuperset', kind: 'method', detail: 'set.issuperset(other)', doc: 'Test whether every element in other is in the set.' },
    { name: 'isdisjoint', kind: 'method', detail: 'set.isdisjoint(other)', doc: 'Return True if the set has no elements in common with other.' },
    { name: 'update', kind: 'method', detail: 'set.update(*others)', doc: 'Update the set, adding elements from all others.' }
  ]
};
