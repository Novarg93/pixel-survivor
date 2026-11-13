import type Phaser from 'phaser';
import manifest from './warriorUltimatesManifest.json';
import { ULTIMATE, type WarriorAttackUltimate } from '../config/ultimates';
import { warriorSkillSelection, WARRIOR_SKILLS } from './warriorSkillsPack';
import type { MageDirection } from './MageHeroAnimation';

export const WARRIOR_ULTIMATES = manifest;
export const WARRIOR_ULTIMATE_TEXTURE = 'warrior-ultimates-v1';
export const WARRIOR_ULTIMATE_URLS = { image: 'assets/hd/warrior-ultimates-v1/0.png', data: 'assets/hd/warrior-ultimates-v1/0.json' };
export function preloadWarriorUltimates(scene: Phaser.Scene) {
  if (!scene.textures.exists(WARRIOR_ULTIMATE_TEXTURE)) scene.load.atlas(WARRIOR_ULTIMATE_TEXTURE, import.meta.env.BASE_URL + WARRIOR_ULTIMATE_URLS.image, import.meta.env.BASE_URL + WARRIOR_ULTIMATE_URLS.data);
}
export function warriorUltimateFx(id: 'vfx-earthbreaker' | 'vfx-spear-of-ruin' | 'vfx-war-banner', age: number) {
  const c = manifest.clips[id], index = id !== 'vfx-earthbreaker' ? Math.floor(Math.max(0, age) * 1000 / c.frameMs) % c.frames.length : Math.min(c.frames.length - 1, Math.floor(Math.max(0, age) * 1000 / c.frameMs));
  return c.frames[index];
}
export function warriorUltimateBody(direction: MageDirection, kind: WarriorAttackUltimate | 'banner', age: number) {
  const duration = ULTIMATE[kind].bodyDuration, windup = ULTIMATE[kind].windup;
  const north = direction.startsWith('north'), flip = direction === 'west' || direction === 'south-west' || direction === 'north-west';
  if (north) {
    const skill = kind === 'ruin' ? 'throw' : kind === 'banner' ? 'block' : 'stomp', clip = WARRIOR_SKILLS.clips[kind === 'ruin' ? 'north-throw' : kind === 'banner' ? 'north-block' : 'north-stomp'];
    const contact = kind === 'ruin' ? 5 : kind === 'banner' ? 4 : clip.impactFrame, contactAge = contact * clip.frameMs / 1000;
    const sourceAge = age < windup ? Math.max(0, age) / windup * contactAge : contactAge + (age - windup) / (duration - windup) * (clip.periodMs / 1000 - contactAge);
    return { ...warriorSkillSelection(direction, skill, sourceAge), duration, displaySize: 96, bodySource: 'accepted-north-skill-reuse' as const };
  }
  const id = kind === 'ruin' ? 'gesture-ruin' : kind === 'banner' ? 'gesture-banner' : 'gesture-earthbreaker', c = manifest.clips[id];
  const index = Math.min(c.frames.length - 1, Math.floor(Math.max(0, age) * 1000 / c.frameMs + 1e-7));
  return { id, index, frame: c.frames[index], texture: WARRIOR_ULTIMATE_TEXTURE, flipX: flip, origin: { x: .5, y: c.pivot.y / c.height }, duration, displaySize: 80, slashPhase: undefined, bodySource: 'accepted-front-ultimate' as const };
}
