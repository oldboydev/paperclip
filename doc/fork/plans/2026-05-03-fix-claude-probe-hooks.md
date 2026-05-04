# Fix: Claude adapter probe fails with SessionStart hooks

- **Date**: 2026-05-03
- **Issue**: [paperclipai/paperclip#4439](https://github.com/paperclipai/paperclip/issues/4439)
- **Status**: Planned

## Problem

The Claude Code adapter's hello probe (`POST /companies/:id/adapters/claude_local/test-environment`) fails with "Claude hello probe failed" when the user has any plugin that registers a `SessionStart` hook in `~/.claude/settings.json`.

Claude itself works fine — the probe's stream-json parser treats hook events as a failure because it doesn't recognize `system` events with subtypes other than `init`.

### Stream output with hooks

```
{"type":"system","subtype":"hook_started","hook_event":"SessionStart", ...}
{"type":"system","subtype":"hook_response","hook_event":"SessionStart", ...}
{"type":"system","subtype":"init", ...}
{"type":"assistant","message":{...,"content":[{"type":"text","text":"Hello!"}]}}
{"type":"result","subtype":"success","result":"Hello!", ...}
```

## Root Cause

In `parseClaudeStreamJson()` (parse.ts line 30), only `system:init` is explicitly handled. Other `system` subtypes fall through and are not skipped, causing the parser to not properly extract the result when hooks are present.

## Fix

### parse.ts — Skip all system events except init

```diff
     const type = asString(event.type, "");
-    if (type === "system" && asString(event.subtype, "") === "init") {
+    if (type === "system") {
+      const subtype = asString(event.subtype, "");
+      if (subtype === "init") {
         sessionId = asString(event.session_id, sessionId ?? "") || sessionId;
         model = asString(event.model, model);
-      continue;
+      }
+      continue;
     }
```

### Tests — Verify parser handles hook events

Add unit tests for `parseClaudeStreamJson` with hook events in the stream:

1. **Parses output with SessionStart hooks** — verify `summary`, `resultJson`, `sessionId`, `model` are correctly extracted
2. **Parses output with failed hook** — verify parser still extracts the final result even if a hook has non-zero exit code

## Verification

```bash
pnpm vitest run server/src/__tests__/claude-local-adapter-environment.test.ts
pnpm test:run
pnpm -r typecheck
```

## Risk

- **Low**: The change only adds a `continue` for already-unhandled event types
- The parser already ignores lines it can't parse — this just makes it explicitly skip known system events
- Future Claude CLI system events will also be safely skipped
