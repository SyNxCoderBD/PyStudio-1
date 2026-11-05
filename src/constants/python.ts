export const PYTHON_KEYWORDS = [
  "and", "as", "assert", "async", "await", "break", "class", "continue",
  "def", "del", "elif", "else", "except", "False", "finally", "for",
  "from", "global", "if", "import", "in", "is", "lambda", "None",
  "nonlocal", "not", "or", "pass", "raise", "return", "True", "try",
  "while", "with", "yield"
];

export const PYTHON_BUILTINS = [
  "print", "len", "range", "input", "str", "int", "float", "list",
  "dict", "set", "tuple", "type", "open", "sum", "min", "max",
  "abs", "enumerate", "zip", "super", "isinstance", "map", "filter",
  "help", "sorted", "reversed", "any", "all", "bin", "hex", "oct"
];

export const USER_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
];

export const DEFAULT_CODE = `# Real-time Collaborative Python IDE
# Supports full ANSI color formatting & interactive input()

# 1. Vibrant Colorful Terminal Output
print("\\033[1;36m=== Python Collaborative Terminal ===\\033[0m")
print("\\033[92m✔ Engine Ready\\033[0m | \\033[93m⚡ Realtime Sync Active\\033[0m\\n")

# 2. Interactive Input
name = input("What's your name? ")
age_str = input(f"Hello \\033[1;33m{name}\\033[0m! How old are you? ")

try:
    age = int(age_str)
    years_to_100 = 100 - age
    print(f"\\033[92mAwesome, {name}! You will turn 100 in {years_to_100} years.\\033[0m")
except ValueError:
    print(f"\\033[91mNotice: '{age_str}' was not a valid number, but nice meeting you {name}!\\033[0m")

# 3. Colorful Statistics Summary
import math
dataset = [12, 45, 67, 89, 34, 23, 56, 78, 90]
mean = sum(dataset) / len(dataset)
std_dev = math.sqrt(sum((x - mean) ** 2 for x in dataset) / len(dataset))

print(f"\\n\\033[1;35mDataset Summary:\\033[0m {dataset}")
print(f"\\033[94mMean:\\033[0m {mean:.2f} | \\033[94mStd Dev:\\033[0m {std_dev:.2f}")
`;
