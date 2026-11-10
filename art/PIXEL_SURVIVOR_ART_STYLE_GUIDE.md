# Pixel Survivor — Art Style Guide

## 1. Purpose

This document defines the visual style direction for Pixel Survivor.
Its purpose is to keep all characters, bosses, minibosses, skills, VFX,
telegraphs and animations visually consistent.

This guide must be used as the baseline for all future art generation,
animation work, VFX reworks and polish tasks.

---

## 2. Core Visual Direction

Pixel Survivor should use a medium-detail pixel-art style:
- readable silhouettes
- limited color count
- controlled contrast
- clear gameplay readability
- expressive but compact VFX
- short readable animations
- no over-rendered or overly cinematic assets

The game should not use hyper-detailed sprites or ultra-smooth effects
that visually break away from the rest of the project.

---

## 3. Gold Standard References

### Primary reference for boss / skill / VFX quality
- Ash Warden model
- Ash Warden Meteor
- Ash Warden Flame Strike

These are the current gold-standard references for:
- spell readability
- impact timing
- VFX density
- color intensity
- animation complexity
- gameplay telegraph clarity

### Additional reference
- Hound is a strong reference for creature styling and miniboss quality,
  but not the main reference for magic-style spell VFX.

---

## 4. Character Style Rules

### General rules
- medium-detail pixel art
- clean silhouette first
- no unnecessary micro-detail
- limited color palette
- clear class fantasy
- readable at gameplay scale
- strong outline/shape separation where needed

### Hero
The hero should be visually downgraded from the recent over-detailed version.
The hero should fit the same world and quality bar as:
- Ash Warden
- Hound
- accepted minibosses

The hero must:
- use fewer colors
- use fewer tiny decorative details
- keep a readable silhouette
- work well with simplified directional movement
- support simple left/right-based animation logic

### Minibosses
Minibosses should follow the same style family as Ash Warden and Hound:
- readable shape
- clear gameplay role
- not too many tiny moving elements
- VFX style consistent with the boss package

---

## 5. Skill / VFX Style Rules

### General VFX direction
All skill effects should be reworked toward the Ash Warden benchmark,
especially Meteor and Flame Strike.

Desired VFX qualities:
- readable in active combat
- compact and intentional
- strong shape language
- medium-detail pixel art
- limited frame count
- limited palette
- no cheap primitive circles if a proper animated effect can replace them
- no overly modern / over-polished effects that clash with the game

### VFX benchmark
Use Ash Warden:
- Meteor warning / fall / impact
- Flame Strike wave / ground fire

as the main style target for:
- main hero skills
- miniboss spell effects
- environment spell telegraphs
- spell impacts and lingering aftermaths

### Explicit rework targets
The following should be visually aligned to the Ash Warden skill standard:
- hero meteor warning / impact
- hero frost nova
- hero lightning-related effects
- blink effects
- fire-related hero skills
- non-Hound miniboss spell effects

---

## 6. Animation Rules

### General
Animations should be:
- readable
- gameplay-first
- not over-animated
- not too smooth compared to the rest of the game
- compact in timing and silhouette changes

### Recommended complexity
- Idle: 4 frames
- Walk: 6–8 frames
- Cast: 4–6 frames
- Basic attack: 6–8 frames
- Heavy / special attack: 8–12 frames
- VFX: only as many frames as needed for readability and impact

### Avoid
- excessive frame counts
- too much secondary motion
- overly cinematic motion for basic gameplay actions
- morphing that breaks silhouette consistency

---

## 7. Palette and Detail Rules

- prefer controlled, game-readable palettes
- avoid excessive hue noise
- avoid too many tiny highlight pixels
- keep material readability strong
- use brighter accent colors only for key magical energy or impact moments

For magic:
- fire = strong orange / yellow / ember contrast
- meteor = ash, magma, ember, impact crack language
- frost = pale cyan / icy mist / soft cold glow
- arcane = controlled violet / blue / rune energy
- lightning = sharp bright energy with readable branching structure

---

## 8. What Does NOT Fit the Project

The following should generally be avoided:
- hyper-detailed hero sprites
- very polished HD-looking effects
- primitive placeholder circles when a proper effect exists
- extremely smooth / high-frame animation if the rest of the game is simpler
- effects that visually overpower gameplay readability
- assets with much higher detail than Ash Warden / Hound style

---

## 9. Practical Art Hierarchy

Use this hierarchy when making visual decisions:

1. Gameplay readability
2. Style consistency
3. Silhouette clarity
4. Effect clarity
5. Detail
6. Extra polish

If a more detailed or more complex asset harms readability or consistency,
it should be simplified.

---

## 10. Rework Direction

### Immediate rework targets
- Main hero model downgrade
- Main hero spell VFX rework
- Non-Hound miniboss spell VFX rework
- Legacy primitive telegraphs and circles replacement

### Style anchor set
The project’s anchor set should be:
- Ash Warden sprite set
- Ash Warden Meteor
- Ash Warden Flame Strike
- Hound model
- accepted minibosses that match this level

Any new asset should be judged against this anchor set.

---

## 11. Acceptance Rule

A new sprite / animation / VFX can be accepted only if:
- it matches the project’s medium-detail pixel-art direction
- it does not exceed the style complexity of the anchor set too much
- it remains readable at gameplay scale
- it feels like it belongs in the same world as Ash Warden and Hound