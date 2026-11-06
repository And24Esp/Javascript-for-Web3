## Convertion

You can convert hexadecimal numbers to decimal values using online tools like https://www.binaryhexconverter.com/hex-to-decimal-converter or by multiplying each digit by 16 raised to its position power.

**Conversion Formula**

To convert a hex number (base-16) to a decimal number (base-10):
1. Map letters to values: A = 10, B = 11, C = 12, D = 13, E = 14, F = 15.
2. Assign powers: Start from the rightmost digit (power 0) and increase the power of 16 by 1 for each step to the left (\(16^0, 16^1, 16^2, \dots\)).
3. Multiply and sum: Multiply each digit by its corresponding power of 16 and add the results together.

Example: Converting 3B₁₆ to Decimal
• Rightmost digit (B = 11): 11 × 16⁰ = 11 × 1 = 11
• Next digit (3): 3 × 16¹ = 3 × 16 = 48
• Sum the results: 48 + 11 = 59₁₀

Other example: 0xb443 hexadecimal number to decimal conversion :
3 x 16 0 = 3 x 1 = 3
4 x 16 1 = 4 x 16 = 64
4 x 16 2 = 4 x 256 = 1024
B x 16 3 = 11 x 4096 = 45,056
3 + 64 + 1024 + 45056 = 46,147

## Opcodes

• **Definition:** Opcodes (operation codes) are the EVM's native machine-readable instructions. Each opcode tells the EVM to perform a specific, atomic operation.

• **Structure:** Most opcodes are encoded as a single byte (0 to 255, represented in hex as 0x00 to 0xFF). The exception is PUSH instructions (PUSH1 through PUSH32), which are followed by 1 to 32 bytes of immediate data.

• **Stack-Based Execution:** The EVM operates as a Last-In, First-Out (LIFO) stack machine with a 256-bit word size. Opcodes pop operands off the top of the stack, perform a calculation or state change, and push the result back onto the stack.

• **Gas Costs:** Every opcode has a designated gas cost to prevent infinite loops, resource abuse, and spam, driving deterministic state transitions across all network nodes.

This reference consolidates EVM opcode information from the yellow paper, stack exchange, solidity source, parity source, evm-opcode-gas-costs and Manticore: https://github.com/crytic/evm-opcodes

