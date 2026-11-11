"""Remove the quiet lead-in; retain the freeze effect and its natural tail."""
import array
import hashlib
import json
import math
import wave
from pathlib import Path

source = Path('art/main-hero-mage-v2/sounds/frost-ult/frost.wav')
target = Path('public/assets/audio/frost-ultimate-v1/frost.wav')
target.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(source)) as recording:
    assert recording.getframerate() == 48000
    assert recording.getnchannels() == 2 and recording.getsampwidth() == 2
    params = recording.getparams()
    recording.setpos(53760)  # 1.12s: onset of the actual effect.
    samples = array.array('h', recording.readframes(recording.getnframes() - 53760))
frames = len(samples) // 2
for frame in range(frames):
    level = min(1, frame / (0.004 * 48000), (frames - 1 - frame) / (0.024 * 48000))
    for channel in range(2):
        samples[frame * 2 + channel] = round(samples[frame * 2 + channel] * level)
with wave.open(str(target), 'wb') as output:
    output.setparams(params)
    output.writeframes(samples.tobytes())
manifest = dict(source=source.as_posix(), file=target.as_posix(),
                sourceSHA256=hashlib.sha256(source.read_bytes()).hexdigest(),
                sha256=hashlib.sha256(target.read_bytes()).hexdigest(),
                trim=[1.12, 2.88], seconds=frames / 48000, gain=0.8,
                peak=max(map(abs, samples)) / 32768,
                rms=math.sqrt(sum(v*v for v in samples) / len(samples)) / 32768,
                fadeIn=0.004, fadeOut=0.024)
Path('art/generated/frost-ultimate-runtime-v1/audio-manifest.json').write_text(
    json.dumps(manifest, indent=2), encoding='utf-8')
print(json.dumps(manifest))
