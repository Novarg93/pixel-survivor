import manifest from './guardianManifest.json';
export const GUARDIAN_TEXTURE = 'hd-guardian';
export const GUARDIAN_URLS = { image: 'assets/hd/guardian.png', data: 'assets/hd/guardian.json' } as const;
export const GUARDIAN_MANIFEST = manifest;
export const GUARDIAN_CLIPS = {
  idle: { first: 0, last: manifest.clips.idle.frameCount - 1, source: 'idle' },
  cast: { first: 0, last: manifest.releaseFrame - 1, source: 'cast' },
  release: { first: manifest.releaseFrame, last: manifest.clips.cast.frameCount - 1, source: 'cast' },
} as const;
export type GuardianPose = keyof typeof GUARDIAN_CLIPS;
export function guardianDuration(pose: GuardianPose) {
  const c = GUARDIAN_CLIPS[pose];
  return manifest.clips[c.source].durationsMs.slice(c.first, c.last + 1).reduce((a, b) => a + b, 0) / 1000;
}
export function guardianFrame(pose: GuardianPose, age: number) {
  const c = GUARDIAN_CLIPS[pose];
  let ms = Math.max(0, age) * 1000;
  if (pose === 'idle') ms %= guardianDuration(pose) * 1000;
  for (let i = c.first; i <= c.last; i++) {
    if (ms < manifest.clips[c.source].durationsMs[i]! - 1e-7) return `guardian-${c.source}-${i}`;
    ms -= manifest.clips[c.source].durationsMs[i]!;
  }
  return `guardian-${c.source}-${c.last}`;
}
export function guardianWindupFrame(progress: number) {
  return guardianFrame('cast', Math.max(0, Math.min(1, progress)) * guardianDuration('cast'));
}
export function guardianLayout() {
  const names = (['idle', 'cast'] as const).flatMap(pose => Array.from({ length: manifest.clips[pose].frameCount }, (_, index) => ({ name: `guardian-${pose}-${index}`, pose, index })));
  return { width: manifest.width, height: manifest.height, frames: names.map((f, i) => ({ ...f, frame: { x: manifest.padding + i % manifest.columns * manifest.cell, y: manifest.padding + Math.floor(i / manifest.columns) * manifest.cell, w: manifest.canvas, h: manifest.canvas } })) };
}
