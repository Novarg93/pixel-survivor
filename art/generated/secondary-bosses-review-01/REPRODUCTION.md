# Reproduction — staging only

Generation uses the authenticated RetroDiffusion MCP, not a new API integration.
No API keys or expiring private output URLs are written here. Each request has its
prompt, exact model/style, seed, parameters, balance/quote preflight and job ID.

1. Read `model-requests.json`, `motion-plan.json`, `generation-manifest.json` and
   each `request.json` / `job.json`. Do not automatically resubmit a recorded job.
2. Before any new paid generation: `get_balance`, `list_inference_jobs`,
   `estimate_inference_cost`. Enforce total cash <=5 USD, each request <=0.50,
   reserve at least5 USD of the initial10 USD, and no more than2 active plan jobs.
3. Static style: `rd_pro__default`, native128. All animation inputs use the same
   selected model padded at a constant(32,32) into192, with a flat gray matte.
   Load the PNG named by `input_image` as base64. Advanced Animation
   `frames_duration=12` is the frame-count selection, **not milliseconds**.
   Actual returned GIF timings are authoritative. The three invalid150 requests
   are recorded, not hidden; they failed with502 and no balance charge.
4. Start once with `start_inference_job`, persist the task ID immediately, poll
   `get_inference_job`. After timeout recover by ID, never retry a paid call.
5. Save output bytes under `original.png` / `original.gif` and optional unremoved
   `raw-1.png`. Downloads use existing permitted browser access. Do not retain
   signed URLs. Any functional replacement has a separate attempt directory.
6. Rebuild derived assets locally, from the repository root:

```powershell
node art/generated/secondary-bosses-review-01/prepare.mjs models
node art/generated/secondary-bosses-review-01/prepare.mjs clips
node art/generated/secondary-bosses-review-01/prepare-context.mjs
node art/generated/secondary-bosses-review-01/build-review.mjs
node art/generated/secondary-bosses-review-01/qa.mjs
```

If a recovered motion lives under `attempt-2`, pass that folder explicitly to
`prepare.mjs clips`. All originals are immutable; generated PNGs use unmodified
decoded pixels, fixed padding, no per-frame fitting or body scaling. PNG/GIF tools
are reused from the accepted Ash Warden preparation workflow, read-only.

`prepare-context.mjs` bundles the **existing** Grove drawing functions in memory
and exports a review background; it does not modify game code or current atlases.
Body animations and local preview rune/orb effects remain separate. Teleport
relocation is allowed in the viewer only during the explicitly assembled invisible
presentation interval. Disable VFX to inspect the unchanged generated body clip.
Unsuccessful or incomplete candidates remain explicitly identified in metadata.

The viewer can open locally (`viewer.html`, embedded `review-data.js`, no fetch
required for display) or through the development server at
`/art/generated/secondary-bosses-review-01/viewer.html`.

Do not edit a loaded staging JS entry on the shared Vite server while gameplay
E2E is running: an unaccepted HMR update broadcasts a full page reload and
destroys the active DEV bridge. Use this pack's isolated QA server, or finish
editing before starting the game regression. This interrupted one otherwise
unmodified gamepad test at the exact timestamp of a viewer.js update; no gameplay
fix or assertion relaxation is appropriate for that interruption.

QA uses real Chromium Canvas at1280×720 and844×390, original GIF decoding versus
PNG pixels, alpha/dimensions/timings/edge checks, pause/scrub/speed, all image
references, and hashes of all protected gameplay/public/accepted Ash Warden files.
These are art-preview checks, not gameplay E2E claims.
