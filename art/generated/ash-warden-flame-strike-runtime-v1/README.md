# Selected C runtime integration

The user selected C and requested integration as a straight, narrow Flame Strike with soft orange floor illumination. Candidate source packs remain unchanged. See `docs/final-boss/FLAME_STRIKE_VARIANT_C_INTEGRATION.md`.

From the project root:

```sh
node scripts/build-ash-warden-flame-strike.mjs
node art/generated/ash-warden-flame-strike-runtime-v1/verify.mjs
npm run check
```

The packager reads the12 existing C prepared PNGs, emits a separate lossless atlas and preserves fixed source canvas/pivot. It makes no network or generation requests. Runtime timings are600ms, with90ms peak propagation inside the existing150ms hit window; source timing is retained separately. Damage/AI code is unchanged. The additional atlas is capped at1MiB.

`protected-baseline.json` is the original workstation audit of3689 existing files, including candidate art and gameplay. Do not replace it after changes. `validation.json`, `game-validation-1280.json`, `game-validation-844.json`, and `screenshots/` record the checks. Browser fixtures pause the real game and hide the pause dialog only for screenshot capture; they do not alter production UI. The game remains playable from the local build server on port5200.
