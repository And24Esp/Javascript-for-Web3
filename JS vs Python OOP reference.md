# JavaScript vs Python — Object-Oriented Syntax Reference

A side-by-side reference for OOP syntax differences between JavaScript and Python, with special focus on `this` vs `self`, binding, and callback context.

---

## 1. Class Definition & Constructor

| Concept | JavaScript | Python |
|---|---|---|
| Class keyword | `class` | `class` |
| Constructor | `constructor(...)` | `__init__(self, ...)` |
| Instantiation | `new Dog("Rex")` | `Dog("Rex")` |

```javascript
// JavaScript
class Dog {
  constructor(name) {
    this.name = name;      // "this" is bound at call time
  }

  bark() {
    console.log(`${this.name} says woof`);
  }
}

const rex = new Dog("Rex");
rex.bark(); // "Rex says woof"
```

```python
# Python
class Dog:
    def __init__(self, name):
        self.name = name    # "self" is an explicit parameter

    def bark(self):
        print(f"{self.name} says woof")

rex = Dog("Rex")
rex.bark()  # "Rex says woof"
```

---

## 2. `this` vs `self` — The Core Difference

This is the single biggest source of confusion moving between the two languages.

| | `this` (JavaScript) | `self` (Python) |
|---|---|---|
| Nature | Implicit keyword | Explicit first parameter (name is convention, not syntax) |
| Determined by | **How** the function is called (call-site binding) | **Which instance** the method is accessed through — resolved automatically by the descriptor protocol |
| Can be lost? | **Yes** — passing a method as a callback detaches it from its object | **No** — `self` is bound as soon as you access `instance.method`, because Python creates a *bound method* object |
| Fix when lost | `.bind()`, arrow functions, or wrapper functions | Not needed |

```javascript
class Counter {
  constructor() { this.count = 0; }
  increment() { this.count++; }
}

const c = new Counter();
const fn = c.increment;
fn(); // ❌ TypeError: Cannot read properties of undefined
       // "this" is undefined/global here — context was lost
```

```python
class Counter:
    def __init__(self):
        self.count = 0

    def increment(self):
        self.count += 1

c = Counter()
fn = c.increment
fn()  # ✅ works fine — fn is already a "bound method",
      # self is permanently attached to c
```

**Why:** In JS, `this` is resolved dynamically based on the call site (`obj.method()` vs `method()` vs `new method()` vs `.call()/.apply()`). In Python, `instance.method` immediately returns a bound method object (via `__get__` on the function descriptor), so the instance travels with the function reference.

---

## 3. Binding: `bind`, `call`, `apply` (JS) vs Nothing Needed (Python)

```javascript
class Counter {
  constructor() { this.count = 0; }
  increment() { this.count++; }
}

const c = new Counter();

// Fix 1: bind — creates a new function with "this" permanently set
const boundIncrement = c.increment.bind(c);
boundIncrement(); // ✅ works

// call/apply — invoke immediately with a given "this"
c.increment.call(c);   // args passed individually
c.increment.apply(c, []); // args passed as array

// Fix 2: arrow function wrapper (captures enclosing "this" lexically)
const wrapped = () => c.increment();
wrapped(); // ✅ works
```

```python
class Counter:
    def __init__(self):
        self.count = 0
    def increment(self):
        self.count += 1

c = Counter()

# No bind/call/apply equivalent needed for basic use.
increment_ref = c.increment
increment_ref()  # ✅ self is already bound

# Python DOES have functools.partial for pre-filling arguments,
# but that's for currying, not "this"-binding:
from functools import partial
def add(self, x, y): ...
```

> **Mental model:** JS methods are *plain functions* that happen to live on an object — `this` is only attached when you call them through the object. Python methods are *descriptors* — accessing them through an instance auto-generates a bound method, permanently pairing the function with `self`.

---

## 4. Callback / Event-Handler Context

This is where the `this`-loss problem shows up most often in real code.

```javascript
class Button {
  constructor(label) {
    this.label = label;
  }

  // ❌ Problem: regular method loses "this" when used as a callback
  handleClickBroken() {
    console.log(`Clicked: ${this.label}`);
  }

  // ✅ Fix 1: arrow function as class field (auto-binds "this")
  handleClickFixed = () => {
    console.log(`Clicked: ${this.label}`);
  }

  // ✅ Fix 2: bind in constructor (older/common pattern)
  constructor_bind_example() {
    this.handleClickBroken = this.handleClickBroken.bind(this);
  }
}

const b = new Button("Submit");
setTimeout(b.handleClickBroken, 1000); // ❌ "this" is undefined
setTimeout(b.handleClickFixed, 1000);  // ✅ works — arrow field
setTimeout(() => b.handleClickBroken(), 1000); // ✅ works — wrapped call
```

```python
import threading

class Button:
    def __init__(self, label):
        self.label = label

    def handle_click(self):
        print(f"Clicked: {self.label}")

b = Button("Submit")
# No wrapping needed — self stays bound regardless of how
# the reference is passed around.
threading.Timer(1.0, b.handle_click).start()  # ✅ just works
```

---

## 5. Arrow Functions vs Regular Functions (JS-only nuance)

Python has no equivalent distinction — `self` binding is uniform. JS has two flavors of function with different `this` behavior:

```javascript
class Widget {
  constructor() {
    this.value = 42;

    // Regular function: "this" depends on call site
    this.regular = function () {
      console.log(this.value); // undefined if called detached
    };

    // Arrow function: "this" is captured lexically from
    // the enclosing scope at definition time — never rebindable
    this.arrow = () => {
      console.log(this.value); // always 42, regardless of call site
    };
  }
}

const w = new Widget();
const { regular, arrow } = w;
regular(); // ❌ undefined ("this" is lost)
arrow();   // ✅ 42 ("this" was captured when the class ran)
```

**Rule of thumb:** Use arrow functions (or class fields) for anything that will be passed as a callback (`onClick`, `setTimeout`, `addEventListener`, `.then()`, etc.).

---

## 6. Static Methods & Class-Level Members

| | JavaScript | Python |
|---|---|---|
| Keyword | `static` | `@staticmethod` / `@classmethod` |
| Access to instance | No `this` (refers to the class itself) | `@staticmethod` → no `self`; `@classmethod` → gets `cls` |

```javascript
class MathUtils {
  static square(x) {
    return x * x; // "this" here refers to MathUtils, not an instance
  }
}
MathUtils.square(4); // 16
```

```python
class MathUtils:
    @staticmethod
    def square(x):
        return x * x  # no self, no cls — pure function scoped to the class

    @classmethod
    def describe(cls):
        return f"This is {cls.__name__}"

MathUtils.square(4)     # 16
MathUtils.describe()    # "This is MathUtils"
```

---

## 7. Inheritance & `super`

```javascript
class Animal {
  constructor(name) { this.name = name; }
  speak() { console.log(`${this.name} makes a sound`); }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);        // must call super() before using "this"
    this.breed = breed;
  }
  speak() {
    super.speak();       // call parent method explicitly
    console.log(`${this.name} barks`);
  }
}
```

```python
class Animal:
    def __init__(self, name):
        self.name = name
    def speak(self):
        print(f"{self.name} makes a sound")

class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)   # no "must be first line" enforcement,
        self.breed = breed        # but it's the standard convention

    def speak(self):
        super().speak()
        print(f"{self.name} barks")
```

---

## 8. Getters / Setters / Properties

```javascript
class Circle {
  constructor(radius) { this._radius = radius; }

  get area() {
    return Math.PI * this._radius ** 2;
  }

  set radius(value) {
    if (value < 0) throw new Error("Invalid radius");
    this._radius = value;
  }
}

const c = new Circle(5);
console.log(c.area);   // accessed like a property, no parens
c.radius = 10;          // setter invoked like assignment
```

```python
class Circle:
    def __init__(self, radius):
        self._radius = radius

    @property
    def area(self):
        return 3.14159 * self._radius ** 2

    @radius.setter
    def radius(self, value):
        if value < 0:
            raise ValueError("Invalid radius")
        self._radius = value

c = Circle(5)
print(c.area)   # accessed like an attribute
c.radius = 10   # setter invoked like assignment
```

---

## 9. Private Members

```javascript
class Account {
  #balance = 0;              // true private field (ES2022+)

  deposit(amount) {
    this.#balance += amount;
  }
  get balance() {
    return this.#balance;
  }
}
```

```python
class Account:
    def __init__(self):
        self._balance = 0    # "protected" by convention only (single underscore)
        self.__secret = 0    # name-mangled to _Account__secret (weak privacy)

    def deposit(self, amount):
        self._balance += amount
```

> Python has no true private fields — privacy is convention (`_x`) or name-mangling (`__x`), both of which remain accessible if you really want to reach them.

---

## 10. Quick Cheat Sheet

| JavaScript | Python | Purpose |
|---|---|---|
| `this` | `self` | Reference to the current instance |
| implicit, call-site dependent | explicit first parameter | How the reference is supplied |
| `.bind(obj)` | *(not needed)* | Permanently attach an instance to a function |
| `.call(obj, ...args)` | *(not needed)* | Invoke immediately with a given instance |
| `.apply(obj, [args])` | *(not needed)* | Same as `.call`, args as array |
| arrow function `() => {}` | *(not needed)* | Lexically capture `this` so it can't be lost |
| `static` | `@staticmethod` / `@classmethod` | Class-level members |
| `super()` / `super.method()` | `super().__init__()` / `super().method()` | Access parent class |
| `get`/`set` | `@property` / `@x.setter` | Computed / validated attributes |
| `#field` | `_field` / `__field` | Private-ish members |

---

### Key Takeaway

> **JS** treats methods as detachable functions where `this` is decided *at call time* — leading to the classic "lost context" bug in callbacks, which `bind`/arrow functions exist to solve.
> **Python** treats methods as descriptors that *auto-bind* `self` the moment you access them through an instance — so the equivalent problem simply doesn't occur, and there's no `bind`/`call`/`apply` machinery needed.
