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

