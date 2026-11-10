# Ash Warden Directional B V1 — manual review pack

User decision: South/East share the approved front upper and sword; West mirrors
East; North keeps the existing back model. Candidate B is the approved Basic
Melee motion reference. Candidate A and previous experiments are preserved.

12clips /96PNG: each direction Idle4, Walk8, Melee12. Melee1200ms, all12B poses
retained; South interior1–10 pixel-identical, endpoints0/11 aligned to Idle.
One new RD custom_action for North, source back model, seed6110651. Cash$0.00,
Starter68→64% (4points). Raw North GIF/frames are independent of cleaned exports.

Open `../ash-warden-locomotion-rd-01/viewer.html`, default **Directional B V1**.
Compare South/East, East/West, all four, or B/A. Pause, scrub, FPS/rate,
Idle→Melee→Idle are available. Gameplay remains unchanged.

Reproduce local processing from the project root, existing Node dependencies:

```powershell
node art/generated/ash-warden-directional-melee-b-v1/decode.mjs north-rd
node art/generated/ash-warden-directional-melee-b-v1/build-pack.mjs
node art/generated/ash-warden-directional-melee-b-v1/previews.mjs
Copy-Item -LiteralPath art/generated/ash-warden-directional-melee-b-v1/viewer-template.html -Destination art/generated/ash-warden-locomotion-rd-01/viewer.html
node art/generated/ash-warden-directional-melee-b-v1/verify.mjs
```

These scripts make no paid inference calls. The paid North request and sanitized
result are in generation-manifest.json; source inputs and approvedB copy are in
originals/. `prepare-input.mjs` prepares inputs and backs up the current viewer;
it does not generate art and is not required to rebuild the existing results.

Virtual canvas192, pivot(96,154), worldScale0.6548310811. Atlas trimming records
original offsets, never scales/fits bodies. One atlas81unique textures; South/East
share upper layers and West shares East textures with root-centered flipX.
Full PNG/GIF copies are review exports. `clips.json` carries layer offsets and
separate presentation/combat-facing metadata; `events.json` dispatches one visual
hit at650ms per attack instance, without game damage integration.

North has two blade-like artifact removals (292/422opaque pixels in2/7), documented
in north-cleanup.json and before/after sheet. Mild sourceB armor morphing and the
old high-speed Walk cap remain. All new directional exports await manual review.

Report: `../../../docs/final-boss/DIRECTIONAL_MELEE_B_V1_REPORT.md`.
