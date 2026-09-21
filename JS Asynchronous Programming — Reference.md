# JavaScript Asynchronous Programming — Reference

A syntax and concept reference for callbacks, promises, and `async`/`await` in JavaScript — written for someone coming from Python's synchronous world (plus some Pygame-style event handling and browser `addEventListener` experience), heading into Web3 development where async code is unavoidable.

---

## 0. Mental Model First: You Already Know Part of This

You've actually seen the shape of this problem twice already, just without the vocabulary:

- **Pygame's game loop:** `while running: for event in pygame.event.get(): ...` — your code doesn't know *when* the user will click or press a key. It just registers "if this happens, do that" and lets the loop poll for it, frame by frame.
- **Browser `addEventListener`:** `button.addEventListener("click", handleClick)` — same idea. You hand the browser a function and say "call this *later*, whenever a click happens." You don't control when — the browser's own loop does.

JavaScript's async model (callbacks → promises → `async`/`await`) is the **same underlying idea — "run this later, when something is ready"** — generalized beyond just user-input events to cover *anything* that takes unpredictable time: network requests, file reads, timers, and — critically for Web3 — waiting for a blockchain to mine a transaction.

The mechanism that makes this possible is JavaScript's **event loop**: JS is single-threaded, but instead of blocking (freezing) while waiting for something slow, it hands the waiting off, keeps running other code, and comes back to your function once the result is ready. Pygame's `while running:` loop is manual and visible; JS's event loop does the equivalent thing automatically, under the hood, for every async operation in the language.

> **Python note:** Python's `asyncio` module (`async def`, `await`) is a direct, deliberate cousin of JS's model — same event-loop concept, similar `async`/`await` keywords. If you explore it later, most of what's below will transfer directly. The difference is exposure: JS's model is unavoidable from day one (even loading a webpage involves it), while Python code can go a long way without ever touching `asyncio`.

---

## 1. Callback Functions — The Original Pattern

A callback is just a function passed as an argument, to be invoked later.

```javascript
// You've already done this exact pattern with addEventListener:
button.addEventListener("click", () => {
  console.log("Clicked!");
});

// The general form — passing a function to be called when something finishes:
function fetchData(callback) {
  setTimeout(() => {
    callback("here is your data");
  }, 1000);
}

fetchData((result) => {
  console.log(result); // "here is your data" — logged ~1 second later
});
```

### The problem: "Callback Hell"

When one async step depends on the result of another, callbacks nest — and readability collapses fast.

```javascript
getUser(userId, (user) => {
  getBalance(user.wallet, (balance) => {
    getTransactionHistory(balance.account, (history) => {
      console.log(history); // 3 levels deep just to get here, and no error handling yet
    });
  });
});
```

This exact pain point is *why* Promises were introduced.

---

## 2. Promises — A Container for "A Value That Isn't Ready Yet"

A `Promise` represents a value that will exist *eventually* — either successfully (**resolved**) or unsuccessfully (**rejected**). It's always in one of three states:

| State | Meaning |
|---|---|
| `pending` | Still waiting — neither succeeded nor failed yet |
| `fulfilled` | Succeeded — has a resulting value |
| `rejected` | Failed — has a reason/error |

### Creating a Promise

```javascript
const promise = new Promise((resolve, reject) => {
  const success = true;

  setTimeout(() => {
    if (success) {
      resolve("Data loaded!");   // moves to "fulfilled"
    } else {
      reject(new Error("Failed to load")); // moves to "rejected"
    }
  }, 1000);
});
```

### Consuming a Promise: `.then()` / `.catch()` / `.finally()`

```javascript
promise
  .then((result) => {
    console.log(result); // runs if resolved
  })
  .catch((error) => {
    console.error(error); // runs if rejected
  })
  .finally(() => {
    console.log("Done — runs either way"); // always runs
  });
```

### Chaining: solving Callback Hell

Each `.then()` returns a new Promise, so steps can be chained flat instead of nested.

```javascript
getUser(userId)
  .then((user) => getBalance(user.wallet))
  .then((balance) => getTransactionHistory(balance.account))
  .then((history) => console.log(history))
  .catch((error) => console.error("Something failed:", error)); // catches ANY failure in the chain
```

---

## 3. `async` / `await` — Promises, But Readable

`async`/`await` is syntax sugar over Promises — it lets asynchronous code *read* like ordinary synchronous, top-to-bottom code, while still being non-blocking under the hood.

```javascript
// A function marked "async" always returns a Promise
async function loadUserHistory(userId) {
  try {
    const user = await getUser(userId);               // pauses here until resolved
    const balance = await getBalance(user.wallet);     // then here
    const history = await getTransactionHistory(balance.account);
    console.log(history);
    return history;
  } catch (error) {
    // catches a rejection from ANY of the awaited calls above
    console.error("Something failed:", error);
  }
}
```

| | Promise chain (`.then`) | `async`/`await` |
|---|---|---|
| Error handling | `.catch()` | `try { } catch { }` |
| Reads like | Chained callbacks | Ordinary sequential code |
| Under the hood | — | Still 100% Promises — this is sugar, not a different mechanism |
| `await` only works | Inside an `async function` (or top-level in modules) | |

> **Rule of thumb:** Reach for `async`/`await` by default for readability. Fall back to raw `.then()`/`.catch()` chains when you need to run several independent async operations concurrently (see §4).

---

## 4. Running Multiple Promises Together

| Method | Behavior | Use case |
|---|---|---|
| `Promise.all([...])` | Waits for **all** to resolve; rejects immediately if **any one** rejects | You need every result, and any failure should abort the whole batch |
| `Promise.allSettled([...])` | Waits for **all** to finish (success or failure), never rejects — gives you a status per item | You want every result *and* every error, without one failure wiping out the rest |
| `Promise.race([...])` | Resolves/rejects as soon as the **first** one settles | Timeouts — e.g. race a request against a timer |
| `Promise.any([...])` | Resolves as soon as the **first one succeeds**; only rejects if *all* fail | Try multiple sources, accept the first success |

```javascript
// Fetch balances for 3 wallets in parallel instead of one-by-one
const balances = await Promise.all([
  getBalance(wallet1),
  getBalance(wallet2),
  getBalance(wallet3),
]);

// Same, but don't let one bad wallet address kill the whole batch
const results = await Promise.allSettled([
  getBalance(wallet1),
  getBalance(badWallet),
  getBalance(wallet3),
]);
// results: [{status: "fulfilled", value: ...}, {status: "rejected", reason: ...}, {status: "fulfilled", value: ...}]
```

---

## 5. Where Async Actually Shows Up

| Scenario | Why it's async |
|---|---|
| `fetch(url)` — HTTP requests | Network round-trip time is unpredictable |
| Reading a file (`fs.promises.readFile`) | Disk I/O takes time, shouldn't block everything else |
| `setTimeout` / `setInterval` | Deliberately delayed/repeated execution |
| User input events (click, keypress) | Genuinely unknown timing — same idea as Pygame's event loop |
| Database queries | Round-trip to another process/server |
| **Blockchain reads/writes** | Waiting on network propagation and block confirmation — see §6 |

---

## 6. Web3-Specific Relevance

This is where async stops being optional — nearly every meaningful Web3 operation is asynchronous, because it involves waiting on a network of nodes rather than a local, instant computation.

```javascript
async function sendAndTrack() {
  // Reading a wallet's balance — a network call, always a Promise
  const balance = await provider.getBalance(address);

  // Sending a transaction returns IMMEDIATELY with a "pending" tx object —
  // it does NOT wait for the transaction to be mined
  const tx = await contract.transfer(recipient, amount);
  console.log("Submitted, hash:", tx.hash);

  // tx.wait() is a SEPARATE async step — it resolves only once
  // the transaction is actually confirmed/mined
  const receipt = await tx.wait();
  console.log("Confirmed in block:", receipt.blockNumber);
}
```

| Web3 operation | Async pattern used |
|---|---|
| Reading contract state (`contract.balanceOf(addr)`) | `await` a single Promise — resolves once the node responds |
| Submitting a transaction | Two-step: `await contract.method()` (submission) → `await tx.wait()` (confirmation) — these are genuinely two different waits |
| Listening for contract events | Callback pattern, not a Promise — `contract.on("Transfer", (from, to, amt) => {...})`, conceptually identical to `addEventListener` |
| Fetching off-chain data (metadata, IPFS content) | `fetch()` → `.json()`, both Promise-based, often chained with `await` |
| Multiple parallel reads (e.g. several token balances) | `Promise.all([...])` — don't await them one at a time if they don't depend on each other |
| Wallet connection request (`eth_requestAccounts`) | A Promise that resolves once the *user* approves in their wallet UI — can be pending for an arbitrary amount of real time |

> **Common beginner mistake:** Treating `contract.transfer(...)` as "done" once it resolves. It isn't — that resolution just means the transaction was *submitted* to the mempool. You still need `await tx.wait()` before you can trust the transfer actually happened on-chain.

---

## 7. Useful Libraries & Utilities

| Library / API | What it's for |
|---|---|
| **Native `fetch`** | Built into modern JS (browser + Node 18+); Promise-based HTTP requests — no install needed |
| **`ethers.js`** | Nearly every method (`provider.getBalance`, `contract.method()`, `tx.wait()`) is Promise-based by design — this is the primary async surface for Ethereum-style Web3 work |
| **`web3.js`** | Same idea as `ethers.js`, alternative library, also fully Promise-based |
| **`axios`** | Popular `fetch` alternative — Promise-based HTTP client with more built-in convenience (interceptors, automatic JSON parsing, timeouts) |
| **`p-limit`** | Cap how many Promises run concurrently — useful when batch-fetching many balances/NFTs without hammering an RPC endpoint |
| **`p-retry`** | Automatically retry a failing async operation (e.g. a flaky RPC call) with backoff |
| **`AbortController`** | Native API to cancel an in-flight `fetch()` — e.g. abandon a stale request if the user navigates away |
| **Node's `util.promisify`** | Converts old callback-style Node APIs into Promise-based ones so they work with `async`/`await` |

---

## 8. Quick Cheat Sheet

| Concept | Syntax |
|---|---|
| Create a Promise | `new Promise((resolve, reject) => { ... })` |
| Consume (chain style) | `promise.then(onSuccess).catch(onError).finally(onDone)` |
| Consume (async/await style) | `const result = await promise;` inside `async function` |
| Error handling with await | `try { await ... } catch (e) { ... }` |
| Run in parallel, need all | `await Promise.all([p1, p2, p3])` |
| Run in parallel, tolerate failures | `await Promise.allSettled([p1, p2, p3])` |
| Event-based (not Promise-based) | `emitter.on("eventName", callback)` |

---

### Key Takeaway

> You're not starting from zero here: Pygame's event loop and JS's `addEventListener` already taught you the core idea — *hand over a function, let the runtime call it back when something happens*. Promises and `async`/`await` are that same idea extended to cover network calls, timers, and blockchain confirmations, with better tools for chaining steps and handling failure. The one genuinely new habit for Web3 specifically: submitting a transaction and having it *confirmed* are two separate async steps (`await contract.method()` vs `await tx.wait()`), and conflating them is the most common bug this reference is meant to help you avoid.
