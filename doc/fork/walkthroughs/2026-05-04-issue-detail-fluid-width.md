# Walkthrough: Fluid Width for Issue and Docs View

## Overview
The `IssueDetail` page layout has been updated to use responsive max-widths instead of a fixed `max-w-3xl` value. Additionally, the Markdown renderer constraint has been lifted so text content fully utilizes the screen.

## Changes Made
- Modified `ui/src/pages/IssueDetail.tsx` to replace `max-w-3xl` with `w-full max-w-none`.
- Modified `ui/src/components/MarkdownBody.tsx` to replace `max-w-full` with `max-w-none` on the markdown wrapper class. This properly disables Tailwind Typography's default `65ch` max-width limit on `.prose` containers, allowing text to stretch cleanly to the borders.
- Registered the patch in `doc/fork/patches.md` under "UI Patches".

## Verification
- Running `pnpm dev`, opening the UI, and navigating to an issue will now present a fully fluid layout. The issue text and documents will stretch seamlessly across wide monitors up to the right-side properties panel without breaking arbitrarily at 65 characters.
