# Plan: Fluid Width for Issue and Docs View

## Problem
The `IssueDetail` page currently has a hardcoded `max-w-3xl` (48rem / 768px) container width constraint. This prevents the issue content, discussions, and document viewer from adjusting and taking advantage of larger screen sizes, leaving excessive empty space on the sides and cramping information.

## Solution
Update the container classes in `ui/src/pages/IssueDetail.tsx` to use a responsive maximum width that grows with the viewport, allowing it to adapt to larger screens while still providing a readable line length.

- We will replace `max-w-3xl` with a responsive sequence: `max-w-5xl xl:max-w-6xl 2xl:max-w-7xl`.
- This ensures it uses much more of the screen real estate on wide monitors but doesn't become infinitely wide, preserving readability.

## Steps
1. Modify `ui/src/pages/IssueDetail.tsx` to replace `max-w-3xl` in `IssueDetailLoadingState` and the main `IssueDetail` render method.
2. Update `doc/fork/patches.md` to register this UI tweak.
3. Verify the layout change visually (conceptually).
4. Save the walkthrough artifact.
