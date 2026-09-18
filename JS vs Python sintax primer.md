# JavaScript vs Python — Syntax Primer (Preface)

A rookie-friendly cheat sheet covering the basic syntax differences between JavaScript and Python.

---

## 1. Variables

| Concept | JavaScript | Python | Notes |
|---|---|---|---|
| Declare a variable | `let x = 5;` | `x = 5` | No declaration keyword needed in Python |
| Constant (won't be reassigned) | `const x = 5;` | `x = 5` *(convention: `X = 5`, no enforcement)* | Python has no true constants — `ALL_CAPS` is just a naming convention |
| Multiple assignment | `let a = 1, b = 2;` | `a, b = 1, 2` | Python's is true tuple unpacking |
| Statement terminator | `;` (optional but recommended) | none — newline ends the statement | |

---

## 2. Functions

| Concept | JavaScript | Python |
|---|---|---|
| Named function | `function greet(name) { return "Hi " + name; }` | `def greet(name):`<br>`    return "Hi " + name` |
| Call it | `greet("Ana")` | `greet("Ana")` |
| Default parameter | `function greet(name = "there") {}` | `def greet(name="there"):` |
| Return value | explicit `return` (or nothing → `undefined`) | explicit `return` (or nothing → `None`) |
| Block delimiter | curly braces `{ }` | indentation (no braces) |

---

## 3. Arrow Functions vs `lambda`

| | JS Arrow Function | Python `lambda` |
|---|---|---|
| Syntax | `x => x * 2` | `lambda x: x * 2` |
| What it is | A shorthand way to write **any** function — short one-liners *or* full multi-statement logic | A shorthand **only** for a single expression — no `if`, loops, or multiple statements allowed |
| Typical use | Quick, throwaway functions — often passed directly as arguments to things like `.map()` / `.filter()` | Same idea: quick inline functions passed to things like `map()` / `filter()` |
| The bigger reason it exists | Also solves JS's `this`-binding problem (see OOP reference, §2–5) — this makes it a genuinely important architectural tool, not just shorthand | No such problem exists in Python, so `lambda` stays a minor convenience with no deeper purpose |

```javascript
[1, 2, 3].map(x => x * 2);        // [2, 4, 6]
```
```python
list(map(lambda x: x * 2, [1, 2, 3]))   # [2, 4, 6]
# more idiomatic in Python:
[x * 2 for x in [1, 2, 3]]              # [2, 4, 6]
```

---

## 4. Conditionals

| | JavaScript | Python |
|---|---|---|
| If / else if / else | `if (x > 0) {`<br>`} else if (x === 0) {`<br>`} else {}` | `if x > 0:`<br>`elif x == 0:`<br>`else:` |
| Ternary | `x > 0 ? "pos" : "neg"` | `"pos" if x > 0 else "neg"` |
| Logical AND / OR / NOT | `&&` / `\|\|` / `!` | `and` / `or` / `not` |
| Truthy "empty" values | `0, "", null, undefined, NaN` → falsy | `0, "", None, [], {}, ()` → falsy |

---

## 5. Equality

| | JavaScript | Python |
|---|---|---|
| Value equality | `==` (loose, does type coercion — **avoid**) vs `===` (strict — **use this**) | `==` (value equality, no coercion surprises like JS) |
| Identity (same object in memory) | `Object.is(a, b)` (rare) | `a is b` |
| "Is null/none" check | `x === null` / `x === undefined` | `x is None` |

> **Rule of thumb:** Always use `===`/`!==` in JS, never `==`/`!=` — this sidesteps a long list of classic JS type-coercion bugs (`"" == 0` is `true`, for example). Python's `==` doesn't have this problem.

---

## 6. Loops

| | JavaScript | Python |
|---|---|---|
| Counting loop | `for (let i = 0; i < 5; i++) {}` | `for i in range(5):` |
| Loop over array/list values | `for (const v of arr) {}` | `for v in my_list:` |
| Loop over object/dict keys | `for (const k in obj) {}` | `for k in my_dict:` |
| Loop over object/dict entries | `Object.entries(obj).forEach(([k, v]) => {})` | `for k, v in my_dict.items():` |
| While loop | `while (cond) {}` | `while cond:` |

---

## 7. Core Data Structures

| Concept | JavaScript | Python |
|---|---|---|
| Ordered list | Array: `[1, 2, 3]` | List: `[1, 2, 3]` |
| Key-value store | Object: `{ name: "Ana" }` or `Map` | Dict: `{"name": "Ana"}` |
| Fixed/immutable sequence | no true equivalent (arrays are always mutable) | Tuple: `(1, 2, 3)` |
| Unique values only | `Set` | `set()` / `{1, 2, 3}` |
| Access a property/key | `obj.name` or `obj["name"]` | `d["name"]` (dot notation is NOT valid for dict keys) |
| Add to a list/array | `arr.push(4)` | `my_list.append(4)` |
| Length | `arr.length` | `len(my_list)` |
| String interpolation | `` `Hello ${name}` `` | `f"Hello {name}"` |
| Stack (LIFO) | No dedicated type — an array is a stack: `arr.push(x)` / `arr.pop()` | No dedicated type — a list is a stack: `my_list.append(x)` / `my_list.pop()` |
| Linked list | No built-in type — hand-rolled with objects: `` { value, next } `` nodes | No built-in type — hand-rolled with a class: `Node(value, next)`; `collections.deque` is a built-in doubly-linked list if you just need the behavior, not a custom node structure f"Hello {name}" |

---

## 8. Comments & "Nothing" Values

| | JavaScript | Python |
|---|---|---|
| Single-line comment | `// comment` | `# comment` |
| Multi-line comment | `/* comment */` | `""" comment """` (technically a string, used by convention) |
| "No value" | `null` (intentional empty) / `undefined` (never assigned) — two flavors | `None` — one flavor, covers both cases |
| Boolean literals | `true` / `false` (lowercase) | `True` / `False` (capitalized) |

---

## 9. Imports / Modules

| | JavaScript (ES Modules) | Python |
|---|---|---|
| Import everything from a module | `import * as utils from "./utils.js";` | `import utils` |
| Import specific names | `import { add, sub } from "./utils.js";` | `from utils import add, sub` |
| Export | `export function add() {}` or `export default ...` | nothing needed — anything top-level is importable |
