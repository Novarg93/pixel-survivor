export const GUARDIAN_TEXTURE = 'hd-guardian';
export const GUARDIAN_URLS = { image: 'assets/hd/guardian.png', data: 'assets/hd/guardian.json' } as const;
export const GUARDIAN_CLIPS = { idle: { frames: 3, fps: 3 }, hurt: { frames: 3, fps: 14 }, death: { frames: 6, fps: 10 } } as const;
export type GuardianPose = keyof typeof GUARDIAN_CLIPS;
export function guardianFrame(pose: GuardianPose, age: number) {
  const clip = GUARDIAN_CLIPS[pose], n = Math.floor(Math.max(0, age) * clip.fps + 1e-7);
  return `guardian-${pose}-${pose === 'idle' ? n % clip.frames : Math.min(clip.frames - 1, n)}`;
}
export function guardianLayout() {
  const frames: { name: string; pose: GuardianPose; index: number; frame: { x: number; y: number; w: number; h: number } }[] = [];
  let n = 0;
  for (const pose of Object.keys(GUARDIAN_CLIPS) as GuardianPose[]) for (let index = 0; index < GUARDIAN_CLIPS[pose].frames; index++, n++) frames.push({ name: `guardian-${pose}-${index}`, pose, index, frame: { x: 2 + n % 5 * 100, y: 2 + Math.floor(n / 5) * 116, w: 96, h: 112 } });
  return { width: 502, height: 350, frames };
}
