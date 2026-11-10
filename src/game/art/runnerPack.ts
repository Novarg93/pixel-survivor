export const RUNNER_TEXTURE = 'hd-runner';
export const RUNNER_URLS = { image: 'assets/hd/runner.png', data: 'assets/hd/runner.json' } as const;
export const RUNNER_CLIPS = { idle: { frames: 3, fps: 3, loop: true }, walk: { frames: 6, fps: 12, loop: true }, hurt: { frames: 3, fps: 16, loop: false }, death: { frames: 6, fps: 12, loop: false } } as const;
export const RUNNER_CORPSE_CAP = 24;
export type RunnerPose = keyof typeof RUNNER_CLIPS;
export type RunnerFacing = 'left' | 'right';
export interface RunnerPlayback { pose: RunnerPose; facing: RunnerFacing; started: number }
export function runnerFrame(pose: RunnerPose, facing: RunnerFacing, age: number) {
  const clip = RUNNER_CLIPS[pose], index = Math.floor(Math.max(0, age) * clip.fps + 1e-7);
  return `runner-${facing}-${pose}-${clip.loop ? index % clip.frames : Math.min(clip.frames - 1, index)}`;
}
export function runnerLayout() {
  let x = 2, y = 2;
  const frames: { name: string; pose: RunnerPose; facing: RunnerFacing; index: number; frame: { x: number; y: number; w: number; h: number } }[] = [];
  for (const facing of ['right', 'left'] as const) for (const pose of Object.keys(RUNNER_CLIPS) as RunnerPose[]) for (let index = 0; index < RUNNER_CLIPS[pose].frames; index++) {
    if (x + 66 > 512) { x = 2; y += 68; }
    frames.push({ name: `runner-${facing}-${pose}-${index}`, pose, facing, index, frame: { x, y, w: 64, h: 64 } }); x += 68;
  }
  return { width: 512, height: y + 66, frames };
}
