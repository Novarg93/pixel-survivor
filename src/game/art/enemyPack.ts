export const ENEMY_TEXTURE = 'hd-enemies';
export const ENEMY_URLS = { image: 'assets/hd/enemies.png', data: 'assets/hd/enemies.json' } as const;
export const HD_ENEMY_KINDS = ['tank', 'caster', 'rusher', 'splitter'] as const;
export type HdEnemyKind = typeof HD_ENEMY_KINDS[number];
export const ENEMY_CLIPS = { idle: { frames: 3, fps: 3, loop: true }, walk: { frames: 4, fps: 7, loop: true }, hurt: { frames: 3, fps: 14, loop: false }, death: { frames: 6, fps: 12, loop: false }, windup: { frames: 2, fps: 5, loop: true }, attack: { frames: 2, fps: 12, loop: true }, recover: { frames: 2, fps: 4, loop: true } } as const;
export type EnemyPose = keyof typeof ENEMY_CLIPS;
export type EnemyFacing = 'left' | 'right';
export interface EnemyPlayback { pose: EnemyPose; facing: EnemyFacing; started: number }
export function isHdEnemy(kind: string): kind is HdEnemyKind { return (HD_ENEMY_KINDS as readonly string[]).includes(kind); }
export function packedEnemyFrame(kind: HdEnemyKind, facing: EnemyFacing, pose: EnemyPose, age: number) {
  const clip = ENEMY_CLIPS[pose], index = Math.floor(Math.max(0, age) * clip.fps + 1e-7);
  return `${kind}-${facing}-${pose}-${clip.loop ? index % clip.frames : Math.min(clip.frames - 1, index)}`;
}
export function enemyPackLayout() {
  let x = 2, y = 2;
  const frames: { name: string; kind: HdEnemyKind; facing: EnemyFacing; pose: EnemyPose; index: number; frame: { x: number; y: number; w: number; h: number } }[] = [];
  for (const kind of HD_ENEMY_KINDS) for (const facing of ['right', 'left'] as const) for (const pose of Object.keys(ENEMY_CLIPS) as EnemyPose[]) for (let index = 0; index < ENEMY_CLIPS[pose].frames; index++) {
    if (x + 66 > 1024) { x = 2; y += 68; }
    frames.push({ name: `${kind}-${facing}-${pose}-${index}`, kind, facing, pose, index, frame: { x, y, w: 64, h: 64 } }); x += 68;
  }
  return { width: 1024, height: y + 66, frames };
}
