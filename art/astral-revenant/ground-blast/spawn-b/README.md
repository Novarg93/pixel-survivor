# Accepted necrotic flame appearance B

Selected by the user on2026-11-08 from the three PixelLab previews.
Provider:PixelLab `animate_image`, seed84122.
Job:d741db08-8db1-412b-8149-da4be717fb0a.
Gallery asset:1291a690-8d59-5183-99c4-b6515431c38f.

`spawn.png` is the original exported3×3 sheet, nine128×128 RGBA frames.
`spawn.gif` contains the same nine frames at100ms each. Both are unchanged
PixelLab exports. The starting ember and final reference came from the user's
existing flame-spawn12 and flame-idle0 frames.

Runtime uses this clip forward for appearance, then the user's original idle,
then the user's original spawn clip forward for disappearance. The native0.9s
appearance fits the existing0.6s gameplay clock; no damage during appearance.

Motion prompt:

> A tiny cold ember ignites in a quick vertical jet from the floor. A compact
> upward flare grows rapidly, then the upper flame curls and settles into the
> mature flame. Keep the flash inside the flame's silhouette, with no outward
> explosion. One isolated pixel-art necrotic flame wall segment, mint white
> core and teal edges matching the supplied target flame. Grow from the tiny
> ember in the first frame into the exact full flame silhouette of the final
> reference. Keep the floor anchor fixed at x64 y104 on the128x128 transparent
> canvas, locked camera, no translation, no floor decal, no circle, no ring,
> no ground glow, no character, no text. One-shot SPAWN only, never fade out
> at the end.

The generated short ring is part of the variant the user selected. The
separate procedural floor glow remains a warning before appearance only.
