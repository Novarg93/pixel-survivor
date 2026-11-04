import type { BossKind } from '../config/enemyDefinitions';
export const BOSS_TEXTURE = 'hd-bosses';
export const BOSS_URLS = { image: 'assets/hd/bosses.png', data: 'assets/hd/bosses.json' } as const;
export const HD_BOSS_KINDS = ['charger', 'sorcerer', 'eclipse'] as const;
export const BOSS_CLIPS = { idle: { frames: 3, fps: 3, loop: true }, walk: { frames: 4, fps: 7, loop: true }, hurt: { frames: 3, fps: 14, loop: false }, death: { frames: 6, fps: 10, loop: false }, windup: { frames: 2, fps: 5, loop: true }, attack: { frames: 4, fps: 12, loop: true }, slam: { frames: 6, fps: 10, loop: false }, recover: { frames: 3, fps: 4, loop: false } } as const;
export type BossPose = keyof typeof BOSS_CLIPS;
export type BossFacing = 'left' | 'right';
export function isHdBoss(kind: string): kind is typeof HD_BOSS_KINDS[number] { return (HD_BOSS_KINDS as readonly string[]).includes(kind); }
export function bossFrame(kind: BossKind, facing: BossFacing, pose: BossPose, age: number, stage = 1) {
  const clip = BOSS_CLIPS[pose], n = Math.floor(Math.max(0, age) * clip.fps + 1e-7);
  return `${kind}-${kind === 'eclipse' && stage === 2 ? 2 : 1}-${facing}-${pose}-${clip.loop ? n % clip.frames : Math.min(clip.frames - 1, n)}`;
}
function stages(kind: BossKind) { return kind === 'eclipse' ? [1, 2] : [1]; }
export function bossLayout() {
  let x = 2, y = 2;
  const frames: { name: string; kind: BossKind | 'hostile'; stage: number; facing: BossFacing; pose: BossPose | 'hostile'; index: number; frame: { x: number; y: number; w: number; h: number } }[] = [];
  for (const kind of HD_BOSS_KINDS) for (const stage of stages(kind)) for (const facing of ['right', 'left'] as const) for (const pose of Object.keys(BOSS_CLIPS) as BossPose[]) for (let index = 0; index < BOSS_CLIPS[pose].frames; index++) {
    if (pose === 'slam' && kind !== 'charger') continue;
    if (x + 130 > 2048) { x = 2; y += 132; }
    frames.push({ name: `${kind}-${stage}-${facing}-${pose}-${index}`, kind, stage, facing, pose, index, frame: { x, y, w: 128, h: 128 } }); x += 132;
  }
  x = 2; y += 132;
  for (let index = 0; index < 4; index++) { frames.push({ name: `hostile-${index}`, kind: 'hostile', stage: 1, facing: 'right', pose: 'hostile', index, frame: { x, y, w: 32, h: 32 } }); x += 36; }
  return { width: 2048, height: y + 34, frames };
}
