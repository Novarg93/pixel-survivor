# Basic Melee South pilot — draft

Two real RetroDiffusion requests; cash $0.00, Starter 84% → 79% by get_balance.
South only. Neither attempt passed weapon/grip/recovery acceptance. Other melee
directions were deliberately not generated. The accepted locomotion pack is intact.

Open `../ash-warden-locomotion-rd-01/viewer.html`, select Directions V1 / Basic Melee.
The viewer works from a local file: its images are embedded data URIs. North/East/West
remain available for accepted Idle/Walk, and are disabled for this draft attack.

`best-attempt.gif` is best **motion**, not approval. `south-02-original.gif` preserves
armor better, but lacks a convincing swing. Full assessment:
`../../../docs/final-boss/BASIC_MELEE_V1_REPORT.md`.

All commands below run from the project root with existing Node dependencies.
They are local and make **no paid API calls**:

```powershell
node art/generated/ash-warden-basic-melee-rd-01/prepare-inputs.mjs
node art/generated/ash-warden-basic-melee-rd-01/decode.mjs south-01
node art/generated/ash-warden-basic-melee-rd-01/decode.mjs south-02
node art/generated/ash-warden-basic-melee-rd-01/publish.mjs
Copy-Item -LiteralPath art/generated/ash-warden-basic-melee-rd-01/viewer-template.html -Destination art/generated/ash-warden-locomotion-rd-01/viewer.html
node art/generated/ash-warden-basic-melee-rd-01/review.mjs
```

The local pixel/PNG and lossless GIF helpers are imported from the accepted
`../ash-warden-directions-v1/` pack. Frames 1–6 are original RD pixels. Only
neutral endpoints 0/7 are replaced by the approved South static base; all durations
are recorded in selection.json. No per-frame scale, fitted bounding boxes,
static-body/blade assembly, generative cleanup, or production integration is used.

`viewer-before.html` is the original viewer backup. `protected-baseline.json`
records pre-task hashes. `generation-manifest.json` contains exact prompts,
parameters, task IDs and sanitized receipts; hosted signed URLs are omitted.
