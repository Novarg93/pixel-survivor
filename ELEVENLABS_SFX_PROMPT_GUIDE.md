# Pixel Survivor — ElevenLabs SFX Prompt Guide

**Status:** Production playbook for Codex. **Scope:** sound effect prompting, iterations, review, and sound-to-event mapping; not music composition or automatic production integration.

## 0. Prime directive

**Describe a concrete audible event and its texture, not an epic cinematic scene.** A good prompt usually identifies: source/action → primary material/timbre → transient → tail → constraints. Generate **one isolatable sound** unless a true sequential cue is required. Preview it in the game’s actual mix before accepting.

## 1. Decide the cue type before writing

| Cue | Example | Approach |
|---|---|---|
| Frequent one-shot | Mage Fireball, Chain Lightning | Short, restrained, dry, no tail, several mild variations |
| High-priority one-shot | Ash Warden stone slam, Meteor impact | One strong transient and short decay; distinct from frequent casts |
| Movement / foley | Thornwood Beast walking, Charge | Emphasize physical material and movement; optionally separate start/contact |
| Ambient / idle | Rune Warden rune hum | Quiet continuous texture, loop-safe, minimal distractors; spatialize later |
| Multi-stage ultimate | Lightning sky strike → hand discharge | Generate separate synchronization-ready stems; compose in game |
| Long evolving effect | Fire Ultimate, 10 seconds | Separate ignition / burning bed / periodic surges for deterministic pacing |

Do not automatically mix `cast`, `flight`, `impact` and `afterburn` into one file. Game events may happen at different times or targets. A sound may contain multiple microtextures when they describe **one** event.

## 2. Effective prompt structure

Preferred English formula:

`[Specific event and source]. [2–3 concrete sonic textures, in audible order]. [Weight/brightness and decay]. [Only important exclusions].`

Aim for **one short paragraph (~30–65 English words)**. For the ElevenLabs website keep prompts **at or below 450 characters** (its documented text-box limit); API/MCP limits may differ. Do not waste characters on “incredibly epic, extremely powerful, devastating, cinematic, professional”. Use actual acoustic material: *dry electrical snap, small sizzling crackle, metal scraping on stone, hollow wooden thud, roots creaking, deep airy whoosh, brittle ice cracks*.

**Positive instruction > long negative list.** For example “a single dry electric snap with instant fade” matters more than listing twelve things it must not sound like. If necessary, close with “No voice or music.” A single specific negative (“no metallic clang”) can correct an observed failure.

**Duration is a generation parameter, not just text.** Explicit `duration_seconds` in the current ElevenLabs Sound Effects API schema is **0.5–30 seconds**. If the game needs 0.2–0.3 second SFX, generate >=0.5s, then precisely trim/process with fades offline. Different UI docs may summarize ranges differently; follow the selected endpoint's current schema. Choose `model_id=eleven_text_to_sound_v3` explicitly; the API may otherwise default to deprecated v2. Prompt influence controls literalness, not quality; keep the setting recorded per attempt.

References: https://elevenlabs.io/docs/overview/capabilities/sound-effects ; https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert ; https://elevenlabs.io/docs/eleven-creative/playground/sound-effects .

## 3. Good examples ready for reuse

**Mage: single Chain Lightning discharge (frequent; target in-game ~0.2–0.3s)**

> One sharp electric zap, like a spark jumping between two metal contacts. A crisp snapping crack, a tiny dry sizzle and an instant fade. Light, clean and not thunderous. Single isolated game sound, no voice or music.

**Mage: Arcane Blink (frequent; target ~0.3s)**

> A quick airy magical whoosh with a short, bright crystalline shimmer. A soft spatial pop as a wizard vanishes and instantly reappears. Light, clean, delicate and fast, with almost no tail. No voice or music.

**Mage: Arcane Shield (background-level; target ~0.3s)**

> A faint magical shield forming around a wizard: a soft airy pulse, a tiny glassy shimmer and a very short gentle fade. Quiet, lightweight and understated, without a heavy impact. No voice or music.

**Ash Warden: overhead slam into rock (strong one-shot; target ~0.7–0.9s)**

> A huge sword crashes straight into solid stone. One deep crushing thud, an immediate sharp crack of rock splitting open, then gritty chunks crumbling and scattering. Heavy stone fracture dominates, not the sword swing. Short decay. No voice or music.

**Thornwood Beast: heavy step (foley; target ~0.5–0.8s)**

> One enormous wooden foot lands on hard soil: a deep hollow wooden thud, dry bark cracking and thick roots creaking under the weight. Organic and heavy, with a short gritty finish. No metal, voice or music.

**Rune Warden: arcane volley (cast-only; target ~0.5–0.7s)**

> A rune sorcerer releases several arcane bolts together. One bright crystalline magical snap, a quick layered energy whoosh and a faint violet-sounding shimmer that fades rapidly. Clean and precise, no impact explosion. No voice or music.

**Ash Warden: flame wave (one event; target ~0.8–1.2s)**

> A huge blade strikes the ground and ignites a wide advancing wave of fire. One heavy contact thud turns into a broad rushing flame roar with dense crackles, then quickly fades. Focus on the sweeping fire wave, not an ordinary explosion. No voice or music.

**Warrior: shield block trigger (understated; target ~0.3–0.5s)**

> A sturdy magical guard activates: a soft compact metallic click under a low, muted protective pulse, then a brief fading shimmer. Controlled and quiet, not a sword hit or explosion. No voice or music.

These are **starting prompts**, not guaranteed recipes. Compare with approved reference audio and adapt the main sonic material one variable at a time.

## 4. Multi-stage and rhythmic cues: prefer layering to relying on exact AI timing

Examples:

- **Lightning ultimate**: separate *sky-strike* (~0.5–1s), *charging bed* (loop/short texture), *hand discharge* (~0.8–1.2s), and optional *impact*. Trigger at actual gameplay cues.
- **Fire ultimate, 10s**: separate *initial fire ignition*, *continuous burning bed*, and *single rhythmic fire surge*. Phaser can schedule surges every 1–2 seconds and dynamically increase gain. Don't expect a model to obey exact pulse counts or times.
- **Boss charge**: *movement start / armored rush* and optional *collision impact* if those moments diverge in the game.

ElevenLabs notes that exact repetition counts are not consistently obeyed; for synchronized gameplay, **timing belongs in the game engine**.

## 5. Correct iterative workflow

1. Inspect real event/ability and VFX: `cast`, release, flight, contact, status effect. Identify whether the sample is frequent, boss-priority, or ambience.
2. Select an approved reference sound if available. Create a **one-sentence audio brief**: e.g., “Slam must sound like stone splitting, not an explosion.”
3. Draft **Prompt A** focusing on 1 primary texture and **Prompt B** varying only 1 sound-design dimension (e.g., more rock fracture vs less low-frequency boom). Keep both concise.
4. Set model, duration, looping, influence; log exact endpoint/tool and intended cost. **No paid generation without explicit user authorization or a previously approved capped budget.**
5. Generate few variants; listen at original loudness and at plausible game mix. Do not judge from peak loudness alone.
6. Classify the failure instead of writing a longer prompt: wrong material, poor transient, tail too long, too busy, too weak, multiple unwanted sounds, wrong timing, harsh treble.
7. Fix only the relevant phrase. Examples: “explosion” → “rock fracture and collapsing stone”; “huge epic pulse” → “soft airy magic shimmer”; “five repeated zaps” → “one single dry electrical snap”.
8. Prepare source WAV/MP3 and processed production candidate (trim, short fade, gain normalization, optional EQ), preserving unmodified original. For web playback, verify codec support and compression; do not simply rename MP3 to OGG.
9. Create `audio-viewer.html` or equivalent A/B player with original/processed, volume and repeat preview. Have the user approve **by ear** before integration.
10. Map accepted SFX to current cue events (`src/game/audio/catalog.ts`, `AudioPresentation.ts`) and keep bus priority, voice limits, throttling and fallback. Avoid concurrent sounds per enemy; use spatial/distance attenuation for low-priority boss idle/footsteps.

## 6. SFX quality checklist

- Can identify the event without seeing it.
- Primary material is correct (steel/stone/wood/ice/fire/arcane/electric).
- Start transient aligns with animation/contact; tail doesn't obscure the next cast.
- No voice/music/unwanted environment, accidental multiple hits or cinematic swell.
- No audible click, clipping, harsh high-frequency whistle or muddy bass.
- Loudness is suitable **relative to** Fireball/Chain Lightning/Blink/Ash Warden references, not necessarily loud in isolation.
- For loops: ends meet cleanly, no periodic peak click, and the volume remains unobtrusive.
- Repeated casts stay pleasant over ~30 seconds of playback; vary sample/pitch subtly when appropriate.
- Original and output format, duration, prompt, rights/plan, provider and cost are recorded; do not promise license coverage without verification.

## 7. Failure patterns and corrections

| Bad output | Rewrite direction |
|---|---|
| “Generic cinematic explosion” instead of rock impact | State *stone floor fractures, rock chunks crumble*; ban explosion once |
| Sword swing makes a hit noise | Describe *air whoosh only, blade does not hit anything* |
| Mage shield is aggressive | Replace *deep punch / strong pulse* with *faint airy shimmer / soft activation* |
| Chain Lightning sounds like thunder | Emphasize *single electrical contact snap*, no cloud/thunder |
| Forest beast sounds metallic | Emphasize *hollow wood, creaking bark, roots*, remove steel words |
| Arcane teleport sounds like Fireball | Emphasize *short spatial pop / crystalline chime*, no flames |
| Multiple disjoint sounds in a 0.5s cast | Reduce sequence to a single transient + very short decay |
| AI generates the wrong 10s ramp/pulse rhythm | Generate layers, schedule/automate gain in Phaser |

## 8. Record every attempt

```yaml
cue: fireball.cast
status: Ready for Review # not automatically Approved
brief: "Short punchy fiery launch, no impact"
model: eleven_text_to_sound_v3
tool: actual_mcp_or_api_method
duration_requested_seconds: 0.5
loop: false
prompt_influence: actual_value_or_null
prompt: "A quick magical ignition ..."
variant: A-02
actual_output_duration_seconds: measured
processed_duration_seconds: measured_or_null
source_path: art/generated/.../original.wav
candidate_path: art/generated/.../processed.wav
license_plan_checked: yes_no_and_details
cost: actual_cost_or_unknown
user_feedback: "too bass-heavy"
changed_variable: "reduced low-frequency punch"
```

## 9. Safe Codex behavior

- **Prompt-only tasks:** never call ElevenLabs or charge credits. Return two concise A/B prompts and parameters.
- **Generation tasks:** require explicitly agreed budget; cap attempts, document cost and failures. Never silently generate dozens of takes.
- **Audio review tasks:** preserve master files and produce isolated `viewer` before touching production.
- **Integration tasks:** only integrate approved files and synchronize with actual sound events; run browser/device playback tests.
- No API keys in prompt logs, source files, commits, or browser bundles. No commit/push/deploy unless requested.
