# Ash Warden East Aseprite Live Pilot 01

Experimental; manual review pending. No production integration.

Open `viewer.html` locally or run from the project root:

```powershell
node art/generated/ash-warden-run-aseprite-pilot-01/serve.mjs
```

Then open http://127.0.0.1:5197/viewer.html.
The separate server has no Vite HMR and serves only this pilot directory.

Editable documents: `source/east-walk-source.aseprite`,
`walk/east-walk.aseprite`, `run/east-run.aseprite`.
Each variant keeps its original Reference hidden/locked; four material layers are editable.
Canvas192×192, pivot96,154, worldScale0.6548310811, no fitting.

`polish.lua` is the actual Live authoring script. Execute via Aseprite MCP
run_lua backend=live, with args.root pointing to this directory. It does not
close documents. Reusing existing pilot IDs preserves the first draft before edits.
`prepare.mjs` only prepares local source copies; it performs no inference.

After Live PNG export, `finalize-gifs.mjs` provides lossless GIF format encoding.
The native Aseprite GIFs are preserved in analysis/ because near-black colors
changed slightly in its exporter. Canonical GIFs exactly match the Live PNGs.

Validation: `analyze.mjs`, `verify-viewer.mjs` (requires the local server).
The latter exports13Canvas screenshots and verifies28GIF frames,84scrub positions,
four speeds, three rates and three viewports. Validation artifacts contain actual results.

Known art risks: Run2→3 knee transfer is abrupt, hidden armor is simplified,
Run at255 retains approximately1.4% nominal slip with a24FPS cap. Original Walk
is unchanged and remains the accepted option until review.

Full Russian report: `docs/final-boss/ASEPRITE_RUN_POLISH_PILOT.md` in the project.
