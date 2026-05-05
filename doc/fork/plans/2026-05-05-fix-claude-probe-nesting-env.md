# Fix: Claude probe fails when server inherits CLAUDE_CODE_SSE_PORT

- **Date**: 2026-05-05
- **Status**: Done

## Problem

The Claude Code adapter's hello probe fails with exit code 1 and **empty stdout/stderr** when the Paperclip server (`pnpm dev`) is started from a terminal spawned by Claude Code or Codex.

The Claude CLI detects the inherited `CLAUDE_CODE_SSE_PORT` environment variable and silently refuses to run, treating it as a nested session.

## Root Cause

`runChildProcess()` in `packages/adapter-utils/src/server-utils.ts` had a hardcoded list of Claude Code nesting guard variables to strip:

```typescript
const CLAUDE_CODE_NESTING_VARS = [
  "CLAUDECODE",
  "CLAUDE_CODE_ENTRYPOINT",
  "CLAUDE_CODE_SESSION",
  "CLAUDE_CODE_PARENT_SESSION",
] as const;
```

`CLAUDE_CODE_SSE_PORT` was not in this list. Claude CLI v2.1+ uses this variable to detect nesting and exits immediately with code 1 when it's present.

## Fix

Replace the hardcoded list with a prefix-based cleanup that catches **all** `CLAUDE_CODE_*` environment variables:

```diff
-    const CLAUDE_CODE_NESTING_VARS = [
-      "CLAUDECODE",
-      "CLAUDE_CODE_ENTRYPOINT",
-      "CLAUDE_CODE_SESSION",
-      "CLAUDE_CODE_PARENT_SESSION",
-    ] as const;
-    for (const key of CLAUDE_CODE_NESTING_VARS) {
-      delete rawMerged[key];
+    for (const key of Object.keys(rawMerged)) {
+      if (key === "CLAUDECODE" || key.startsWith("CLAUDE_CODE_")) {
+        delete rawMerged[key];
+      }
     }
```

This future-proofs against new Claude CLI nesting guard variables.

## Verification

- Start `pnpm dev` from a Claude Code terminal (with `CLAUDE_CODE_SSE_PORT` in env)
- Run adapter test-environment probe → should pass
- Manual: `claude --print - --output-format stream-json --verbose --dangerously-skip-permissions` → responds correctly

## Risk

- **Low**: Only removes `CLAUDE_CODE_*` vars from spawned child processes, not from the server process itself
- These vars have no legitimate use in spawned agent processes
