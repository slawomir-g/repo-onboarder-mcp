# Project Rules & Technical Standards

**Context:** Expert Backend Engineer specializing in Node.js 22+, TypeScript, and MCP.
**Strictly follow the 2025/2026 technical standards.**

## 1. Tech Stack & Runtime Environment

- **Runtime:** Use Node.js 22+ native features exclusively.
- **Forbidden Tools:** DO NOT use or suggest `ts-node`, `nodemon`, `babel`, or `webpack` for backend logic.
- **Execution Strategy:**
  - **Dev:** `node --watch --experimental-strip-types --env-file=.env src/index.ts`
  - **Prod:** `node dist/index.js` (compiled JS)
- **Modules:** Always use ESM (`"type": "module"` in `package.json`).

## 2. TypeScript Configuration & Best Practices

- **Config:** Enforce `module: nodenext`, `moduleResolution: nodenext`, and `verbatimModuleSyntax: true` in `tsconfig.json`.
- **Imports:** Always include file extensions in imports (e.g., `import { x } from './utils.js'`).
- **NO Enums:** Strictly forbid `enum`. Replace with `as const` objects (POJO).
  ```typescript
  // CORRECT
  export const Role = { USER: "user", ADMIN: "admin" } as const;
  export type Role = (typeof Role)[keyof typeof Role];
  ```
- **Error Handling:** DO NOT use `throw` for business logic flow control. Use the Result Pattern:
  ```typescript
  type Result<T, E> =
    | { success: true; value: T }
    | { success: false; error: E };
  ```

## 3. Architecture (Clean Architecture / Hexagonal)

- **Structure:** Enforce strict layer separation:
  - `domain/` (Entities, pure TS, no deps).
  - `application/` (Use Cases, Ports/Interfaces).
  - `interface/` (Adapters, MCP Tools, Zod Schemas).
  - `infrastructure/` (DB Drivers, External APIs, Server setup).
- **Dependency Rule:** Inner layers define interfaces; outer layers implement them (DIP).
- **MCP Role:** An MCP Tool definition (`server.tool()`) is an Interface Adapter/Controller. It must NOT contain business logic. It strictly maps Zod input -> Use Case -> LLM output.

## 4. MCP Server Implementation Specifics

- **Zod as Documentation:** Every Zod schema field MUST have a `.describe("...")` method. This is the primary documentation for the LLM.
- **Rule:** Descriptions must be context-aware and instruct the LLM on how to use the parameter.
- **Transport Agnostic:** Logic must be decoupled from transport (Stdio vs. SSE).
- **Logging:** When using Stdio transport, NEVER log to stdout. All application logs must go to stderr (configure Pino/Logger accordingly) to preserve JSON-RPC integrity.
- **Security:**
  - Implement "Parse, Don't Validate" using Zod.
  - Assume all inputs from LLM are untrusted (guard against Prompt Injection/Path Traversal).

## 5. Testing & Tooling

- **Test Runner:** Use Vitest exclusively (native ESM support).
- **Linter:** Use Biome instead of ESLint/Prettier.
- **MCP Inspector:** Recommend `npx @modelcontextprotocol/inspector` for debugging.
