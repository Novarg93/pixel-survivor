# South Basic Melee — simple pilot 02

8 frames / 650 ms. Local articulated rig using the accepted RetroDiffusion South.
No new AI generations, no cash or quota spend. South only, no runtime integration.
Candidate for manual review; not fully artistically accepted. Mechanical elbows
and flatter restored cuirass need manual attention, especially frames 3–5.

Open `../ash-warden-locomotion-rd-01/viewer.html` and select
Directions V1 / Simple South v2 / Basic Melee. Previous RD draft remains selectable.
Use Idle → Attack → Idle to review transitions with the accepted locomotion base.

Local reproduction from project root (existing Node dependencies only):

```powershell
node art/generated/ash-warden-basic-melee-south-02/build.mjs
node art/generated/ash-warden-basic-melee-south-02/previews.mjs
Copy-Item -LiteralPath art/generated/ash-warden-basic-melee-south-02/viewer-template.html -Destination art/generated/ash-warden-locomotion-rd-01/viewer.html
node art/generated/ash-warden-basic-melee-south-02/review.mjs
```

These commands make no paid calls. Geometry/masks/timing are in rig.mjs. The
sword/guard/grip/two gauntlets are one rigid source assembly. Arm plates rotate
without axial texture scaling; joint and torso backfill use source palette colors.
First/last frames exactly equal the approved static source pixels. Canvas192,
pivot(96,154), scale0.6548310811; no per-frame bbox fitting, no VFX.

Report: `../../../docs/final-boss/BASIC_MELEE_SOUTH_SIMPLE_02_REPORT.md`.
