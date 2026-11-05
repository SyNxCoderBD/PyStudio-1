export interface KeywordDocInfo {
  detail: string;
  doc: string;
  example: string;
}

export const KEYWORD_DOCS: Record<string, KeywordDocInfo> = {
  def: {
    detail: 'def function_name(param1, param2=default):',
    doc: 'Defines a reusable function with specified parameters and return value.',
    example: 'def calculate_area(width, height=10):\n    return width * height\n\nprint(calculate_area(5))'
  },
  class: {
    detail: 'class ClassName(BaseClass):',
    doc: 'Defines a user-created class that serves as a blueprint for objects with attributes and methods.',
    example: 'class Dog:\n    def __init__(self, name):\n        self.name = name\n\n    def bark(self):\n        return f"{self.name} says Woof!"'
  },
  return: {
    detail: 'return [value]',
    doc: 'Terminates execution of the current function and returns a result value to the caller.',
    example: 'def add(a, b):\n    return a + b\n\ntotal = add(10, 20)'
  },
  for: {
    detail: 'for item in iterable:',
    doc: 'Iterates over elements of a sequence (such as a list, tuple, dictionary, or range).',
    example: 'fruits = ["apple", "banana", "cherry"]\nfor index, fruit in enumerate(fruits):\n    print(f"{index}: {fruit}")'
  },
  while: {
    detail: 'while condition:',
    doc: 'Repeats an indented block of code as long as the test condition evaluates to True.',
    example: 'count = 3\nwhile count > 0:\n    print(f"Countdown: {count}")\n    count -= 1'
  },
  if: {
    detail: 'if condition:',
    doc: 'Executes a block of code conditionally if the boolean expression evaluates to True.',
    example: 'age = 20\nif age >= 18:\n    print("Eligible to vote")'
  },
  elif: {
    detail: 'elif condition:',
    doc: 'Conditional branch (else if) evaluated when the preceding if/elif conditions are False.',
    example: 'score = 85\nif score >= 90:\n    print("Grade A")\nelif score >= 80:\n    print("Grade B")'
  },
  else: {
    detail: 'else:',
    doc: 'Default fallback branch executed when all preceding if/elif conditions evaluate to False.',
    example: 'logged_in = False\nif logged_in:\n    print("Welcome back!")\nelse:\n    print("Please log in.")'
  },
  try: {
    detail: 'try:',
    doc: 'Encloses statements that might throw exceptions to catch and handle them safely.',
    example: 'try:\n    val = int("hello")\nexcept ValueError as err:\n    print(f"Conversion error: {err}")'
  },
  except: {
    detail: 'except ExceptionType as err:',
    doc: 'Catches and handles a specific exception or error raised inside a try block.',
    example: 'try:\n    result = 10 / 0\nexcept ZeroDivisionError:\n    result = 0'
  },
  finally: {
    detail: 'finally:',
    doc: 'Clean-up block that is guaranteed to run after try/except, whether an error occurred or not.',
    example: 'try:\n    file = open("data.txt")\nfinally:\n    file.close()'
  },
  with: {
    detail: 'with context_manager as resource:',
    doc: 'Context manager that automatically handles resource allocation and release (e.g. closing files or releasing locks).',
    example: 'with open("notes.txt", "w") as f:\n    f.write("Collaborative notes")'
  },
  as: {
    detail: 'import ... as alias / with ... as var',
    doc: 'Creates an alias name for an imported module, or assigns a context resource / exception variable.',
    example: 'import math as m\nprint(m.sqrt(25))'
  },
  import: {
    detail: 'import module_name [as alias]',
    doc: 'Loads an external module or library package into the current namespace.',
    example: 'import random\nlucky_number = random.randint(1, 100)'
  },
  from: {
    detail: 'from module_name import symbol',
    doc: 'Imports specific functions, classes, or variables directly from a module into the local namespace.',
    example: 'from datetime import datetime\nprint(datetime.now().strftime("%Y-%m-%d"))'
  },
  lambda: {
    detail: 'lambda arg1, arg2: expression',
    doc: 'Constructs an anonymous inline function with arguments and a single returned expression.',
    example: 'numbers = [1, 2, 3, 4]\nsquared = list(map(lambda x: x ** 2, numbers))'
  },
  yield: {
    detail: 'yield value',
    doc: 'Pauses function execution and yields a value to the caller, producing a Python generator.',
    example: 'def fibonacci(limit):\n    a, b = 0, 1\n    while a < limit:\n        yield a\n        a, b = b, a + b'
  },
  raise: {
    detail: "raise ExceptionType('message')",
    doc: 'Intentionally throws an exception or error, halting normal execution unless caught.',
    example: 'def set_age(age):\n    if age < 0:\n        raise ValueError("Age cannot be negative")\n    return age'
  },
  assert: {
    detail: "assert condition, 'Error message'",
    doc: 'Internal test statement that raises an AssertionError if the test condition evaluates to False.',
    example: 'def divide(a, b):\n    assert b != 0, "Denominator cannot be zero"\n    return a / b'
  },
  break: {
    detail: 'break',
    doc: 'Immediately terminates the innermost enclosing for or while loop.',
    example: 'for num in [1, 2, 3, 4, 5]:\n    if num == 3:\n        break\n    print(num)  # prints 1, 2'
  },
  continue: {
    detail: 'continue',
    doc: 'Skips the remainder of the current loop iteration and moves directly to the next cycle.',
    example: 'for i in range(5):\n    if i == 2:\n        continue\n    print(i)  # prints 0, 1, 3, 4'
  },
  pass: {
    detail: 'pass',
    doc: 'Null placeholder statement used when Python syntax requires an indented block but no action is needed.',
    example: 'def placeholder_function():\n    pass  # To be implemented later'
  },
  in: {
    detail: 'item in sequence / for x in iterable',
    doc: 'Tests for membership inside a sequence/container, or specifies the sequence in a for-loop.',
    example: 'colors = ["red", "green", "blue"]\nif "green" in colors:\n    print("Color found!")'
  },
  is: {
    detail: 'obj1 is obj2 / obj is not None',
    doc: 'Identity comparison operator that tests if two references point to the exact same memory object.',
    example: 'current_user = None\nif current_user is None:\n    print("Guest mode")'
  },
  not: {
    detail: 'not condition',
    doc: 'Logical NOT operator that inverts the boolean truth value of an expression.',
    example: 'is_finished = False\nif not is_finished:\n    print("Still processing...")'
  },
  and: {
    detail: 'expr1 and expr2',
    doc: 'Logical AND operator that returns True only if both expressions are truthy.',
    example: 'has_key = True\ndoor_unlocked = False\nif has_key and not door_unlocked:\n    print("Unlocking door...")'
  },
  or: {
    detail: 'expr1 or expr2',
    doc: 'Logical OR operator that returns True if at least one expression is truthy.',
    example: 'status = "error"\nif status == "error" or status == "failed":\n    print("Task failed.")'
  },
  global: {
    detail: 'global var_name',
    doc: 'Declares that an identifier inside a local function scope refers to the module-level global variable.',
    example: 'counter = 0\n\ndef update_counter():\n    global counter\n    counter += 1'
  },
  nonlocal: {
    detail: 'nonlocal var_name',
    doc: 'Declares that a variable inside an inner function binds to the nearest enclosing non-global scope variable.',
    example: 'def outer():\n    count = 0\n    def inner():\n        nonlocal count\n        count += 1\n        return count\n    return inner'
  },
  del: {
    detail: 'del variable / del dict[key]',
    doc: 'Deletes variables, attributes, or elements from mutable collections like lists and dicts.',
    example: 'cache = {"id": 101, "temp": True}\ndel cache["temp"]'
  },
  async: {
    detail: 'async def function_name():',
    doc: 'Declares an asynchronous coroutine function or async context manager.',
    example: 'import asyncio\n\nasync def fetch_user():\n    await asyncio.sleep(0.1)\n    return {"id": 1, "name": "Alice"}'
  },
  await: {
    detail: 'await coroutine_or_future',
    doc: 'Suspends execution of the enclosing coroutine until the awaited asynchronous task completes.',
    example: 'async def main():\n    result = await fetch_user()\n    print(result)'
  },
  True: {
    detail: 'True (bool)',
    doc: 'Boolean literal representing truth, integer equivalent to 1.',
    example: 'server_running = True\nif server_running:\n    print("Online")'
  },
  False: {
    detail: 'False (bool)',
    doc: 'Boolean literal representing falsity, integer equivalent to 0.',
    example: 'has_error = False\nif not has_error:\n    print("All tests passed.")'
  },
  None: {
    detail: 'None (NoneType)',
    doc: 'Special singleton object representing the absence of a value or null state.',
    example: 'result = None\nif result is None:\n    result = "Computed default"'
  }
};
