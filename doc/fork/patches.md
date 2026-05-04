# Fork Patches

Improvements made on this fork that are not in upstream.
If pulling from upstream, these must be re-applied.

---

## UI Patches (existing)

### stderr_group
- **Files**: `RunTranscriptView.tsx`
- **What**: Amber accordion for MCP init noise in transcript view

### tool_group
- **Files**: `RunTranscriptView.tsx`
- **What**: Accordion for consecutive non-terminal tools (write, read, search, browser)

### Dashboard excerpt
- **Files**: `LatestRunCard`
- **What**: Strips markdown, shows first 3 lines / 280 chars

---

## 2026-05-03 — Fix Claude probe with SessionStart hooks

- **Issue**: [paperclipai/paperclip#4439](https://github.com/paperclipai/paperclip/issues/4439)
- **Plan**: [doc/fork/plans/2026-05-03-fix-claude-probe-hooks.md](plans/2026-05-03-fix-claude-probe-hooks.md)
- **Status**: Completed
- **Files**:
  - `packages/adapters/claude-local/src/server/parse.ts`
  - `server/src/__tests__/claude-local-adapter-environment.test.ts`
- **What**: Parser now skips unknown `system` events (`hook_started`, `hook_response`) in Claude stream-json output
- **Why**: Probe failed for users with Claude plugins that register `SessionStart` hooks
