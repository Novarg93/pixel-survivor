# Pixel Survivor original audio

`catalog.ts` exports the typed cue catalog, budgets, provenance and asset manifest.
`synthesis.ts` creates original fallback mono PCM at 22050Hz. The sparse
sixteen-second underscore was composed specifically
for this game from sine partials and an original eight-note arrangement. Grove and
Forest have separate eight-second wind/chime/drone textures. Every buffer has a
short attack/release or loop-edge fade. Generated audio is original project content
and remains the source for UI, enemies and fallback music/effects.

`musicTracks.ts` selects the five user-approved second takes: normal0–300s,
dusk300–600s, dying600–900s, burning900s+, and boss. A nearby living boss,
an active nearby Guardian, final encounter or practice takes priority; a2s
simulation-time release hold prevents flicker at encounter boundaries.
`StreamingMusic.ts` uses at most2 native streaming decoders routed through
Phaser's existing context/music bus. Phase transitions and the last1.5s of each
minute-long repeat crossfade; Phaser update drives scheduling without intervals.
Playback gain balances the selected takes; original MP3 bytes remain unchanged.
Streaming music replaces the procedural underscore/wind beds. Frost/fire SFX
beds still work, keeping total active loops≤3 and one-shots≤12. MP3 failures
fall back to procedural music once per failed track; a later valid phase recovers.
Pause, upgrade, blur, mute, music0, game over and scene shutdown stop playback
and invalidate pending play promises. Two stream nodes are destroyed on shutdown.
All source IDs, accepted variant2, MP3 hashes and runtime audit are retained in
`art/generated/music-runtime-v1/`. No full-minute PCM buffers are cached.

`mageSamples.ts` maps eleven local ElevenLabs-generated WAVs to Fireball launch/hit,
chain lightning, Meteor impact, Arcane Shield, Frost Nova, Blink, and four phases
of the lightning ultimate. All44 original MP3 variants, prompts, generation IDs,
cost receipts, selection metrics and SHA256 hashes are retained in
`art/generated/mage-sfx-elevenlabs-v1/`; its `viewer.html` previews every variant.
The selected files are mono16-bit WAV at44100Hz, with trimmed phase durations,
bounded peaks and short edge fades. Runtime performs no ElevenLabs requests.

Seven user-uploaded WAVs now override Blink, chain lightning, Fireball cast,
Meteor impact, Arcane Shield, Frost Nova and lightning ultimate release. `thunder/thunder.wav` is the
ultimate, played once at the real discharge after preparation. The other four
existing Mage cues (Fireball impact and three charge phases)
remain in use. Sources in `art/main-hero-mage-v2/sounds/` are copied byte-for-byte
to `public/assets/audio/mage-sfx-uploaded-v1/`. Uploaded cues have hash-versioned
cache keys and bounded playback gain; no trimming or transcoding is applied.
Provenance, decoded metrics and the exact scope guard live in
`art/generated/mage-uploaded-sounds-v1/`.

Arcane Shield uses the new soft WAV in `sounds/arcaneshield/` for both cast
and absorbed-hit feedback. Its playback gain is0.55 (about-5.2dB), without
boosting the already quiet original or changing its bytes. Its source SHA,
metrics and later integration proof live in `art/generated/arcane-shield-sound-v1/`.

Frost Nova uses `sounds/frost_nova/frost_nova.wav` at the existing
`frostNova.cast` event. The one-second stereo48kHz PCM source is preserved
byte-for-byte in `assets/audio/mage-sfx-uploaded-v1/frost-nova.wav`.
Playback gain1.757563 follows the existing Mage upload policy (peak≤0.751,
gain≤2); the source is not trimmed or transcoded. Its source SHA, signal
metrics and exact later scope guard live in `art/generated/frost-nova-sound-v1/`.

`samples.ts` also registers five user-supplied Ash Warden WAVs from
`art/final-boss/sound/`, copied byte-for-byte into `assets/audio/ash-warden-uploaded-v1/`.
Both horizontal melee variants use swing; South/North use slam, chosen from
the latched combat direction at the actual contact. Swing plays its first300ms
during the final windup, then the remaining buffer at contact. Meteor similarly
plays its first200ms before landing and its remaining buffer only on impact.
These are playback ranges in shared original buffers with4ms edge fades, not
edited files or scheduled future impacts. Presentation uses simulation ages,
deduplicates per attack/meteor and respects pause, freeze and cancellation.
Charge starts on travel and already includes braking, so the old extra stop thud
is suppressed. Flame Strike plays once at cleaveImpact for the whole fan.
Meteor impact gap120ms retains the150ms stagger; normal voice budgets still apply.
All16 Mage/boss samples share the existing loader, cache and procedural fallback.
Hashes, signal metrics and the exact integration scope are recorded in
`art/generated/ash-warden-uploaded-sounds-v1/`.

Phaser4 owns the sole AudioContext. The adapter uses its `context`, `destination`
and audio cache (verified in installed4.2.1 source), with five gain buses and a
conservative compressor. PCM is generated lazily and cached once per game. No
remote URLs or middleware are needed. The sixteen local files are fetched and
decoded into Phaser's shared audio cache once; a scene shutdown aborts outstanding
fetches and prevents late decode callbacks from writing to the cache. If a sample
is not ready or fails, its procedural patch plays immediately, without queueing
or replaying it later. Unsupported Web Audio fails silently; gameplay keeps running.

Limits:12one-shots total,10SFX,2UI; up to3loop sources including ambient crossfade.
Rate limiting and priority preemption group low-value sounds. The additional
Armageddon impacts use the real impact notifications and reduced gain. World
randomness is never consumed. Audio has its own seeded pitch/volume variation.

Only trusted pointer/keyboard gestures unlock output. Menu is silent apart from UI.
Playing starts the selected phase music. Pause/upgrade stops music and fades SFX
out; explicit Continue starts the track again. Blur stops all owned sources immediately
to prevent a suspended context replaying a tail on focus. Game over stops the beds
and plays death/sting once. Scene shutdown removes all listeners/nodes but leaves
Phaser's shared context/cache for Phaser to dispose of on game destruction.

Human listening and physical-device checks remain essential: automation can verify
PCM and output energy, but cannot certify musical quality or headphone comfort.
