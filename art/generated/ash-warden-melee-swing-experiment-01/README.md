# Ash Warden — Full Swing experiment 01

Two new independent RD custom_action jobs: A Golf and B Baseball, each12frames,
native150ms/frame (1800ms). Raw GIFs and PNG pixels are unedited. No old rig used.
C is not generated: Starter79%→70%, job low69%, ceiling10points. Cash spent$0.00.

Neither result is automatically approved. A lacks a clear high opposite-side blade
finish. B is wider and reaches the right-high area, but passes overhead and does not
hold the turned torso follow-through. User chooses after watching the full clips.

Open `../ash-warden-locomotion-rd-01/viewer.html`, select **Melee Swing Candidates**.
Choose A/B, V2 or Cleave reference, native1×/0.5×/0.25×, pause and scrub.
C is explicitly disabled; the comparison C column is a textual budget status,
not a fabricated animation.

Local reproduction from the project root, with existing Node dependencies:

```powershell
node art/generated/ash-warden-melee-swing-experiment-01/decode.mjs A
node art/generated/ash-warden-melee-swing-experiment-01/decode.mjs B
node art/generated/ash-warden-melee-swing-experiment-01/prepare-review.mjs
node art/generated/ash-warden-melee-swing-experiment-01/make-comparison.mjs
Copy-Item -LiteralPath art/generated/ash-warden-melee-swing-experiment-01/viewer-template.html -Destination art/generated/ash-warden-locomotion-rd-01/viewer.html
node art/generated/ash-warden-melee-swing-experiment-01/verify.mjs
```

These scripts do not invoke generation APIs. Exact requests, seeds, billing and
sanitized receipts are in generation-manifest.json. Candidate prompts are in their
folders. planned-C-prompt.txt is explicitly unsubmitted. Common pivot(96,154),
worldScale0.6548310811, same input192px, no per-frame fitting or timing edits.

Report: `../../../docs/final-boss/BASIC_MELEE_FULL_SWING_COMPARISON.md`.
