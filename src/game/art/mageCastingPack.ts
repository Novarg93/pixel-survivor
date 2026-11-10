import { mageFrame, mageLayout } from './magePack';
import type { MageGesture as MageSpell } from './MageCastingController';
import { castingHands, CAST_COLORS, type CastDirection } from './mageCastingPoses';
export type { CastDirection } from './mageCastingPoses';

export const MAGE_CAST_TEXTURE = 'hd-mage-casting';
export const MAGE_CAST_URLS = { image: 'assets/hd/mage-casting.png', data: 'assets/hd/mage-casting.json' } as const;
export const CAST_VARIANTS = ['fireball', 'fireball-strong', 'frost', 'lightning', 'lightning-strong', 'meteor', 'shield', 'ultimate-lightning', 'ultimate-frost', 'ultimate-fire'] as const;
export function castingVariant(ability: MageSpell, rank: number) { return (ability === 'fireball' || ability === 'lightning') && rank >= 4 ? `${ability}-strong` : ability; }
export function castingArmFrame(ability: MageSpell, rank: number, direction: CastDirection, frame: number) { return `arms-${castingVariant(ability, rank)}-${direction}-${Math.max(0, Math.min(5, frame))}`; }
export function castingBodyFrame(facing: 'down' | 'up' | 'side', moving: boolean, elapsed: number, recoil = false) { return `body-${recoil ? 'lean-' : ''}${mageFrame(facing, moving ? 'walk' : 'idle', elapsed)}`; }
export function castingBob(moving: boolean, elapsed: number) {
  const index = Math.floor(Math.max(0, elapsed) * (moving ? 9 : 3) + 1e-7) % (moving ? 6 : 3);
  return (moving ? Math.cos(index * Math.PI * 2 / 3) * .22 : [0, -.18, .1][index]) * 1.5;
}
export function castingDirection(dx: number, dy: number): CastDirection { return Math.abs(dx) >= Math.abs(dy) ? dx < 0 ? 'left' : 'right' : dy < 0 ? 'up' : 'down'; }

export function mageCastingLayout() {
  const body = mageLayout().frames.filter(f => f.pose === 'idle' || f.pose === 'walk').flatMap(f => [false,true].map(recoil => ({ ...f, name: `body-${recoil ? 'lean-' : ''}${f.name}`, layer: 'body', variant: '', direction: '', torsoLean: recoil ? -.28 : 0 })));
  const arms = CAST_VARIANTS.flatMap(variant => (['down','up','left','right'] as const).flatMap(direction => Array.from({ length: 6 }, (_, index) => { const spell=variant.replace('-strong','') as MageSpell; return { name: `arms-${variant}-${direction}-${index}`, pose: 'arms', facing: '', index, layer: 'arms', variant, direction, hands: castingHands(spell,variant.endsWith('-strong')?5:1,direction,index), color:CAST_COLORS[spell], frame: { x: 0, y: 0, w: 64, h: 80 } }; })));
  const frames = [...body, ...arms].map((entry, i) => ({ ...entry, frame: { x: 2 + i % 15 * 68, y: 2 + Math.floor(i / 15) * 84, w: 64, h: 80 } }));
  return { width: 1024, height: 2 + Math.ceil(frames.length / 15) * 84, frames };
}
