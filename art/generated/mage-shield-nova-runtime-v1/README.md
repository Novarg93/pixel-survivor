# Approved PixelLab Shield / ordinary Frost Nova runtime

Built by `scripts/build-shield-nova-runtime.mjs` from the exact accepted raw PNG.
34native128²cels:8shieldloop,9shieldfade,17Nova;atlas792²,padding2,2509056RGBAbytes.
No new inference,painting,trim or palette changes. Source SHA256 and decoded pixel
hashes are recorded in audit.json;integration-verification.json checks the scope
against the historical325file preview baseline. Frost Ultimate art/timing remains
unchanged. Its48original cels are loaded from a smaller lossless retained atlas,
using the same frame names and existing trim/sourceSize metadata. The superseded
ordinary spell cels stay in the archived shared atlas. `retained-ultimate-audit.json`
records all48payload pixel hashes and source file hashes. Total texture memory
is reduced by15240192bytes including the new Shield/Nova atlas;144MiB gate kept.

Report: `docs/art/PIXELLAB_SHIELD_NOVA_RUNTIME_V1.md`.
