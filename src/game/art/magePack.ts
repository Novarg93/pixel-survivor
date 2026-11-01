export const MAGE_TEXTURE = 'hd-mage';
export const MAGE_URLS = { image: 'assets/hd/mage.png', data: 'assets/hd/mage.json' } as const;
export const MAGE_CLIPS = { idle: { frames: 3, fps: 3, loop: true }, walk: { frames: 6, fps: 9, loop: true }, hurt: { frames: 3, fps: 12, loop: false }, death: { frames: 6, fps: 10, loop: false } } as const;
export type MagePose = keyof typeof MAGE_CLIPS;
export function mageFrame(facing: 'up' | 'down' | 'side', pose: MagePose, age: number) {
  const clip = MAGE_CLIPS[pose], n = Math.floor(Math.max(0, age) * clip.fps + 1e-7);
  return `mage-${facing}-${pose}-${clip.loop ? n % clip.frames : Math.min(clip.frames - 1, n)}`;
}
export function mageLayout() {
  const frames: { name: string; facing: string; pose: string; index: number; frame: { x: number; y: number; w: number; h: number } }[] = [];
  let x = 2, y = 2;
  for (const facing of ['down', 'up', 'side']) for (const pose of Object.keys(MAGE_CLIPS) as MagePose[]) for (let index = 0; index < MAGE_CLIPS[pose].frames; index++) {
    if (x + 66 > 1024) { x = 2; y += 84; }
    frames.push({ name: `mage-${facing}-${pose}-${index}`, facing, pose, index, frame: { x, y, w: 64, h: 80 } }); x += 68;
  }
  y += 84; x = 2;
  for (let index = 0; index < 4; index++) { frames.push({ name: `fireball-${index}`, facing: '', pose: 'fireball', index, frame: { x, y, w: 32, h: 32 } }); x += 36; }
  return { width: 1024, height: y + 34, frames };
}
