# Pixel Survivor original audio

`catalog.ts` exports the typed cue catalog, budgets, provenance and asset manifest.
`synthesis.ts` creates original mono PCM at 22050Hz; no samples or melodies were
copied or downloaded. The sparse sixteen-second underscore was composed specifically
for this game from sine partials and an original eight-note arrangement. Grove and
Forest have separate eight-second wind/chime/drone textures. Every buffer has a
short attack/release or loop-edge fade. Generated audio is original project content
and may be distributed with the game; no third-party audio attribution is required.

Phaser4 owns the sole AudioContext. The adapter uses its `context`, `destination`
and audio cache (verified in installed4.2.1 source), with five gain buses and a
conservative compressor. PCM is generated lazily and cached once per game. No
audio files, decoders, remote URLs or middleware are needed. Unsupported Web Audio
or synthesis/cache failures result in silence; gameplay keeps running.

Limits:12one-shots total,10SFX,2UI; up to3loop sources including ambient crossfade.
Rate limiting and priority preemption group low-value sounds. The additional
Armageddon impacts use the real impact notifications and reduced gain. World
randomness is never consumed. Audio has its own seeded pitch/volume variation.

Only trusted pointer/keyboard gestures unlock output. Menu is silent apart from UI.
Playing starts the underscore+biome texture. Pause/upgrade fades them out; explicit
Continue starts at a fresh loop boundary. Blur stops all owned sources immediately
to prevent a suspended context replaying a tail on focus. Game over stops the beds
and plays death/sting once. Scene shutdown removes all listeners/nodes but leaves
Phaser's shared context/cache for Phaser to dispose of on game destruction.

Human listening and physical-device checks remain essential: automation can verify
PCM and output energy, but cannot certify musical quality or headphone comfort.
