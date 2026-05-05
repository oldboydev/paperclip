# Walkthrough: Fix Claude probe failure from inherited CLAUDE_CODE_SSE_PORT

## What Changed

The Claude adapter probe (`POST /companies/:id/adapters/claude_local/test-environment`) no longer fails when the Paperclip server is started from a terminal owned by Claude Code or Codex.

## Root Cause

When `pnpm dev` runs inside a Claude Code terminal, the env variable `CLAUDE_CODE_SSE_PORT` leaks into the server process. When the probe spawns `claude --print ...`, the CLI detects this variable, treats it as a nested session, and exits immediately with code 1 and empty output.

The existing nesting guard in `runChildProcess()` had a hardcoded list of 4 variables but was missing `CLAUDE_CODE_SSE_PORT` (added in Claude CLI v2.1+).

## Implementation

Modified `packages/adapter-utils/src/server-utils.ts` — replaced the hardcoded `CLAUDE_CODE_NESTING_VARS` array with a prefix-based cleanup that deletes any env key matching `CLAUDECODE` or starting with `CLAUDE_CODE_*`. This ensures future Claude CLI nesting variables are also covered.

## Diagnostic Method

1. Added temporary debug logging to `test.ts` to capture probe result details to `/tmp/claude-probe-debug.json`
2. Discovered `exitCode: 1, stdout: "", stderr: ""` — the CLI was dying silently
3. Added env dump — found `CLAUDE_CODE_SSE_PORT=37066` in the server's `process.env`
4. Confirmed that starting the server with `env -u CLAUDE_CODE_SSE_PORT pnpm dev` resolved the probe failure
5. Applied the prefix-based fix to permanently resolve the issue

## Verification

- Probe succeeds when server is started from Claude Code terminal
- Debug code removed after diagnosis
