# Ash Warden — approved movement integration

Runtime source package for the user-approved East/West and user-supplied manual North/South. Originals remain in their original directories. See `metadata.json` for paths, hashes, timing and per-frame validation.

All directions contain 12 real frames at 150 ms/frame (1.8 s/loop). GIF pixels and timing are authoritative. The 768×768 GIF frames consist of exact repeated 4×4 blocks: a fixed lossless integer reduction produces logical 192×192 frames with pivot (96,154), scale 0.6548310811. No fitting, recentering or per-frame scaling is applied. Reference PNG sheets have matching alpha/order but different RGB, so their pixels are not mixed into the GIF frames.

West is a complete horizontal mirror; runtime reuses East textures with `flipX`. Phase 3 emission masks are derived from each new pose using the existing magma-color rule.

Run from the project root using the already-installed dependencies:

```sh
node art/generated/ash-warden-walk-integrated-v1/import.mjs
node scripts/build-ash-warden-runtime.mjs
node art/generated/ash-warden-walk-integrated-v1/verify.mjs
```

`prepare.mjs` captured the pre-integration protection baseline. Keep `protected-baseline.json` and `previous-runtime-clips.json`; do not replace them with a post-change baseline.

The default verifier checks all packaged runtime source hashes, 48 reconstructed movement poses/masks and all 47 previous non-Walk clips. The full historical workstation audit additionally reads the original local art experiments, which are not required by the game and are not published. On the original workstation run `node art/generated/ash-warden-walk-integrated-v1/verify.mjs --audit-originals` to check all 3401 protected files. Screenshots and browser telemetry remain local review evidence.

Validation:

```sh
npm run check
npx playwright test tests/e2e/ash-warden-walk-approved.spec.ts --workers=1
npx playwright test tests/e2e/ash-warden-integration-v1.spec.ts --workers=1
git diff --check
```

On Windows PowerShell use `npm.cmd` / `npx.cmd` if script execution policy blocks the `.ps1` wrappers. `pixel-validation.json` records the pixel/hash checks; `game-validation-*.json` and `screenshots/` contain actual game Canvas verification at desktop/mobile sizes.

Detailed report: `docs/final-boss/ASH_WARDEN_APPROVED_WALK_INTEGRATION.md`.
