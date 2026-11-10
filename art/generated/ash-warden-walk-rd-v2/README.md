# Ash Warden — RetroDiffusion Walking V2

User-approved East GIF is the sole new motion/color basis. Aseprite variants are comparison-only.
East/West retain native768×768 frames. Their grid is exactly4×192 and Viewer uses
one fixed0.25 presentation factor; source files are not resized or fitted per frame.
South/North are native192×192, actual Walking preset,12unique frames each.
All four cycles are12×150ms=1800ms. Pivot96,154 and scale0.6548310811 are logical coordinates.

**North is technically valid but has weak visible leg motion. It is not artistically approved.**
Nothing is installed in production. No new inference is authorized automatically.

Open `viewer.html` locally or start the isolated server from the project root:

```powershell
node art/generated/ash-warden-walk-rd-v2/serve.mjs
```

http://127.0.0.1:5198/viewer.html — no Vite HMR, serves only this directory.

Files:

- `incoming/east/`: untouched user originals; GIF and sheet have matching alpha/order but different RGB.
- `east/`: canonical frames extracted ONLY from the approved GIF, unchanged GIF and separate originals.
- `west/`: exact native-size horizontal mirror; no RD call.
- `south/`, `north/`: original returned GIFs plus real RGBA frames and sheets.
- `mcp/`: actual preflight responses, exact prompt/settings, task IDs, seeds, costs and result responses.
- `animation-metadata.json`: native/logical sizes, timing, phases, facing, pivot, scale and provisional speed guidance.
- `expenses.json`: exactly2jobs ×$0.14=$0.28; budget$0.40, no automatic retries or extra variants.
- `comparisons/`: sheets, desktop/mobile screenshots and source comparison.

Local processing (no paid calls):

```powershell
node art/generated/ash-warden-walk-rd-v2/prepare.mjs
node art/generated/ash-warden-walk-rd-v2/decode-east.mjs
node art/generated/ash-warden-walk-rd-v2/make-west.mjs
node art/generated/ash-warden-walk-rd-v2/decode-clip.mjs south
node art/generated/ash-warden-walk-rd-v2/decode-clip.mjs north
node art/generated/ash-warden-walk-rd-v2/build-data.mjs
node art/generated/ash-warden-walk-rd-v2/verify.mjs
```

Run the separate server before verify.mjs. Existing dependencies only; background
is rendered from the unchanged production Burning Grove painter, Mage from its atlas.
`request-body.mjs` only constructs the recorded MCP request, never submits it.
For retained outputs use the recorded task ID; do not restart a paid generation after a download error.

World-speed mode scrolls the actual ground at72/120/180/255 while preserving native
cadence. It is a diagnostic, not a claim of foot-contact locking or a high-speed Run replacement.
Final Russian report: `docs/final-boss/RETRODIFFUSION_WALK_V2_REPORT.md`.
