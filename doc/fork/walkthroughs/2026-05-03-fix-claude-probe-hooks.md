# Walkthrough: Fix Claude adapter probe with SessionStart hooks

## What Changed

The Claude adapter's hello probe (`POST /companies/:id/adapters/claude_local/test-environment`) no longer fails when the user has Claude plugins that register `SessionStart` hooks in `~/.claude/settings.json`.

Specifically, we updated the stream-json parser to safely ignore unrecognized `system` events (like `hook_started` and `hook_response`), rather than letting them break the parsing state.

## Implementation Details

1. **Parser Fix**: Modified `parseClaudeStreamJson()` in `packages/adapters/claude-local/src/server/parse.ts` to `continue` and skip any event where `type === "system"` but the `subtype` is not `"init"`.
2. **Tests**: Added unit tests in `server/src/__tests__/claude-local-adapter-environment.test.ts` to verify the parser correctly extracts the final `result` event even when `hook_started` and `hook_response` events appear first in the stream.

## Verification Results

- Unit tests for `parseClaudeStreamJson` pass successfully.
- Full workspace test suite passes.
- Workspace typecheck passes.
- You can now test the adapter in the Paperclip UI and it will succeed.
