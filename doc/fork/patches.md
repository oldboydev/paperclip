# Fork Patches

Improvements made on this fork that are not in upstream.
If pulling from upstream, these must be re-applied.

---

## UI Patches (existing)

### issue_fluid_width
- **Files**: `IssueDetail.tsx`, `MarkdownBody.tsx`
- **What**: Replaces hardcoded `max-w-3xl` with `w-full max-w-none` in the issue view container, and uses `max-w-none` on MarkdownBody to override the `.prose` 65ch limit, so the issue view uses the available screen width fully.

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

---

## 2026-05-05 — Fix Claude probe with inherited nesting env vars

- **Plan**: [doc/fork/plans/2026-05-05-fix-claude-probe-nesting-env.md](plans/2026-05-05-fix-claude-probe-nesting-env.md)
- **Status**: Completed
- **Files**:
  - `packages/adapter-utils/src/server-utils.ts`
- **What**: `runChildProcess()` now strips **all** `CLAUDE_CODE_*` env vars (prefix match) instead of a hardcoded list of 4
- **Why**: When `pnpm dev` runs inside a Claude Code terminal, `CLAUDE_CODE_SSE_PORT` leaks into child processes, making the Claude CLI silently exit with code 1

