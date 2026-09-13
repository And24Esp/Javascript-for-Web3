# JavaScript vs Python — Object-Oriented Syntax Reference

A side-by-side reference for OOP syntax differences between JavaScript and Python, with special focus on `this` vs `self`, binding, callback context, the prototype chain, and how each concept shows up in Web3 development.

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

> **Web3 relevance:** Every SDK you'll touch — `ethers.js` `Contract`/`Wallet`/`Provider`, `web3.js` objects — is a `class` under this same syntax. Reading SDK source or docs on GitHub means recognizing this shape immediately.

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

> **Web3 relevance:** This is the #1 real-world bug source when wiring up wallet connections. `window.ethereum.on('accountsChanged', myHandler)` passes `myHandler` by reference — if it relies on `this` and isn't bound or an arrow function, it silently breaks the first time the wallet emits an event.

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

> **Web3 relevance:** `.call()` in this JS sense (setting `this`) is unrelated to a *contract's* `.call()` (a read-only, no-gas invocation of a smart contract method) — same word, totally different concept. Don't let the naming collision confuse you when reading `ethers.js`/`web3.js` docs. `.bind(this)` shows up constantly in transaction-status callback plumbing and older React class-component dApp front ends.

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

> **Web3 relevance:** Transaction lifecycle handling is all callbacks: `contract.on('Transfer', handler)`, `tx.wait().then(handler)`, polling loops for confirmation status. Any of these passed as a bare method reference from a class instance is a candidate for the lost-context bug.

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

> **Web3 relevance:** Modern `ethers.js` example code and dApp tutorials almost always use arrow functions for event handlers and hooks for exactly this reason — it's the de facto convention in Web3 front-end code, so recognizing *why* saves you from cargo-culting it blindly.

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

> **Web3 relevance:** Utility conversions you'll use constantly — `ethers.utils.formatEther()`, `ethers.utils.parseUnits()` — are static-style helpers, not instance methods. You call them on the namespace/class, not on a wallet or contract object.

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

> **Web3 relevance:** Solidity itself has an `is`/`super` inheritance model that mirrors this (e.g. an ERC-20 token contract extending OpenZeppelin's base `ERC20` contract). Understanding `extends`/`super` in JS gives you a head start reading Solidity contract inheritance, even though the languages differ.

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

> **Web3 relevance:** Wallet/provider SDKs commonly expose computed state this way — e.g. a wrapped balance or network object accessed like a property rather than a method call — so getters are worth recognizing even if you won't often write your own for dApp glue code.

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

> **Web3 relevance:** Note the naming collision risk — Solidity also has `private`/`internal` visibility modifiers on contract state variables, but they mean something different and weaker than you'd expect: "private" in Solidity hides a variable from other *contracts*, not from the blockchain itself, since all contract storage is publicly readable on-chain. Don't assume JS-style (or even true OOP-style) privacy guarantees carry over.

---

## 10. Prototype Chain (Pre-ES2015 & Under the Hood)

Before ES2015 (2015), JavaScript had no `class` keyword at all. Objects inherited behavior through **prototypal inheritance**: every object has an internal link (`[[Prototype]]`, accessible via `__proto__` or `Object.getPrototypeOf()`) to another object it delegates to when a property or method isn't found on itself. `class` syntax introduced in ES2015 is **syntactic sugar** over this exact mechanism — it does not replace it.

```javascript
// Pre-ES2015 style: constructor function + prototype
function Dog(name) {
  this.name = name;
}

// Methods go on the prototype, not the instance,
// so every Dog shares one copy of the function in memory
Dog.prototype.bark = function () {
  console.log(`${this.name} says woof`);
};

const rex = new Dog("Rex");
rex.bark(); // "Rex says woof"

// What actually happens when you call rex.bark():
// 1. JS looks for "bark" directly on rex → not found
// 2. JS looks at rex.__proto__ (== Dog.prototype) → found it there
// 3. Executes it with "this" set to rex

console.log(rex.__proto__ === Dog.prototype); // true
console.log(rex.hasOwnProperty("bark"));       // false — it's inherited, not own

// Prototypal inheritance chain (pre-ES2015 "subclassing"):
function Puppy(name) {
  Dog.call(this, name);   // manually invoke "parent constructor" with this
}
Puppy.prototype = Object.create(Dog.prototype); // link the chain
Puppy.prototype.constructor = Puppy;

const p = new Puppy("Buddy");
p.bark(); // "Buddy says woof" — resolved by walking up the prototype chain
```

```javascript
// Modern ES2015+ class syntax — IDENTICAL mechanism underneath
class Dog2 {
  constructor(name) { this.name = name; }
  bark() { console.log(`${this.name} says woof`); }
}

const rex2 = new Dog2("Rex");
console.log(typeof Dog2);                          // "function" — classes ARE functions
console.log(rex2.__proto__ === Dog2.prototype);     // true — same chain as before
console.log(Object.getPrototypeOf(rex2) === Dog2.prototype); // true, preferred over __proto__
```

Python has **no prototype chain**. Its inheritance model is fundamentally different: classes look up attributes through the **Method Resolution Order (MRO)** — a linearized list of classes computed from the class hierarchy (using the C3 linearization algorithm), not a live chain of object links.

```python
class Dog:
    def bark(self):
        print(f"{self.name} says woof")

class Puppy(Dog):
    def __init__(self, name):
        self.name = name

p = Puppy("Buddy")
p.bark()                    # resolved via MRO, not a prototype chain
print(Puppy.__mro__)        # (<class 'Puppy'>, <class 'Dog'>, <class 'object'>)
```

| | JavaScript | Python |
|---|---|---|
| Underlying model | Prototype chain (live link between objects) | Method Resolution Order / linearized class hierarchy |
| `class` keyword | Syntactic sugar — no new inheritance mechanism | The actual, original inheritance mechanism |
| Shared methods | Live on `.prototype`, one copy shared by all instances | Live on the class `__dict__`, resolved via MRO |
| Inspect the chain | `Object.getPrototypeOf(obj)`, `obj.__proto__` (legacy) | `type(obj).__mro__`, `ClassName.__mro__` |
| Can you change it at runtime? | Yes — prototypes are mutable, even after instances exist (dynamic, sometimes fragile) | Class hierarchy is fixed structurally, though monkey-patching individual attributes is still possible |

> **Web3 relevance:** You'll see prototype-chain-style code directly in two common situations: (1) some `ethers.js`/`web3.js` internals and older libraries still use `Prototype.method = function(){}` patterns rather than `class`; (2) "extending" a built-in like `Error` for custom exceptions (e.g. a custom `InsufficientGasError`) touches prototype mechanics under the hood, and gotchas around `instanceof` checks failing on transpiled/older code trace directly back to prototype-chain quirks. Knowing this saves you from being confused by GitHub code that predates 2015 syntax, which is still common in older, widely-forked Web3 tooling repos.

---

## 11. Quick Cheat Sheet

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
| `.prototype` / prototype chain | MRO (`__mro__`) | How inherited methods are actually resolved |

---

### Key Takeaway

> **JS** treats methods as detachable functions where `this` is decided *at call time* — leading to the classic "lost context" bug in callbacks, which `bind`/arrow functions exist to solve. Underneath, this is all built on a **prototype chain**: `class` is sugar over the same object-linking mechanism JS has always had.
>
> **Python** treats methods as descriptors that *auto-bind* `self` the moment you access them through an instance — so the equivalent problem simply doesn't occur — and resolves inheritance through a structurally computed **MRO** rather than a live, mutable chain. In other words, there's no `bind/call/apply` machinery needed. 

**For Web3 work specifically:** you'll encounter both eras of JS syntax in the wild (pre-2015 prototype-based libraries and modern `class`-based SDKs), so recognizing that they're the same mechanism — rather than two unrelated inheritance systems — will save you real confusion when reading contract-interaction code on GitHub.
