"""Reproduce the accepted local WAV extraction without changing user originals."""
from pathlib import Path
import array
import wave

source = Path('art/main-hero-mage-v2/sounds/fire-ult')
target = Path('public/assets/audio/fire-ultimate-v1')
target.mkdir(parents=True, exist_ok=True)
(target / 'static.wav').write_bytes((source / 'static.wav').read_bytes())
with wave.open(str(source / 'pulse.wav')) as recording:
    assert recording.getframerate() == 48000
    assert recording.getnchannels() == 2 and recording.getsampwidth() == 2
    params = recording.getparams()
    recording.setpos(int(3.55 * 48000))
    samples = array.array('h', recording.readframes(int(1.8 * 48000)))
frames = len(samples) // 2
for frame in range(frames):
    level = min(1, frame / (.008 * 48000), (frames - 1 - frame) / (.12 * 48000))
    for channel in range(2):
        samples[frame * 2 + channel] = round(samples[frame * 2 + channel] * level)
with wave.open(str(target / 'pulse.wav'), 'wb') as output:
    output.setparams(params)
    output.writeframes(samples.tobytes())
