// Here is a code example that simulates multiple events triggering at the exact same millisecond. It demonstrates how JavaScript prioritizes them using the Event Loop, Task Queue, and Microtask Queue (VIP line).
// You can copy and run this snippet in your browser's developer console or a Node.js environment:

console.log("1. Script starts.");

// 1. Regular Task: A timer set to 0 milliseconds
setTimeout(() => {
  console.log("4. Regular Task: setTimeout (0ms) executed.");
}, 0);

// 2. Microtask (VIP Line): A resolved Promise
Promise.resolve().then(() => {
  console.log("3. Microtask: Promise executed.");
});

// 3. Regular Task: A simulated click event triggered immediately
const button = { listener: null };
button.listener = () => console.log("5. Regular Task: Click event executed.");
setTimeout(() => button.listener(), 0); 

console.log("2. Script ends.");

// Why did it happen in this order? The Main Script (1 & 2): JavaScript executes the synchronous code line-by-line first. The timers and promises are scheduled, but their inner code has to wait.The VIP Microtask (3): As soon as the main script finishes, the Event Loop checks the high-priority Microtask Queue first. The Promise callback cuts ahead of the regular events.The Regular Tasks (4 & 5): Once the VIP queue is empty, the Event Loop processes the regular Task Queue one by one in a first-come, first-served order. Even though the setTimeout and the simulated click were ready at the same time, they execute sequentially, never in parallel.

