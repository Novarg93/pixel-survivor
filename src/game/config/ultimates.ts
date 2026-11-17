import type {CharacterId} from './characters';
export type WarriorAttackUltimate = 'earthbreaker' | 'ruin';
export type UltimateId = 'lightning' | 'frost' | 'fire' | 'banner' | WarriorAttackUltimate;
export const ULTIMATE = {
  level: 30, time: 300, charges: 10,
  lightning: { damage: 480, bossFraction: .12, invocation: .34, skyStrike: .065, preparation: .52, reveal: .075, hold: .125, fade: .12, recovery: .4, recoil: .2, branches: 4, targetCap: 156, ashCap: 48, spawnQuiet: 2, spawnRecovery: .7, groundDuration: 2, groundMargin: 24 },
  frost: { invocation: .45, creation: .25, activation: .2, duration: 4, residual: 4, radiusDiagonalRatio: .25, waveDelay: .2, waveDuration: .8, damage: 180, bossFraction: .08 },
  fire: { damage: 62, bossFraction: .24, duration: 10, interval: .5, radius: 164, growthInterval: 2, radiusGrowth: .1, healFraction: .2, trailWidth: 38, trailDuration: 2, trailCap: 12, trailStep: 18 },
  banner:{duration:15,radius:140,healFraction:.1,windup:.45,bodyDuration:.81,placement:38},
  earthbreaker: { windup: .54, bodyDuration: 1.17, range: 280, waves: 4, waveInterval: .18, halfWidth: 12, damage: 100, bossFraction: .16, aftermath: 1.17 },
  ruin: { windup: .54, bodyDuration: 1.08, range: 560, speed: 440, hitRadius: 16, damage: 420, impactRadius: 48, impactDamage: 140, bossFraction: .18, aftermath: .4 },
} as const;
export const ULTIMATE_DEFINITIONS = [
  { id: 'lightning', name: 'Heavenly Wrath', description: 'A devastating discharge: an instant branching web of lightning. The first charge is ready; recharge with 10 successful Blinks.', icon: 'ϟ', color: '#458FFF' },
  { id: 'frost', name: 'Absolute Zero', description: 'A rune freezes even bosses and Guardians for 4 seconds, followed by 4 seconds of ice. An ice avalanche spreads outward after casting: 180 damage, capped at 8% HP for bosses and Guardians. The first charge is ready; recharge with 10 successful Blinks.', icon: '❄', color: '#D9F3F7' },
  { id: 'fire', name: 'Funeral Pyre', description: '10 seconds of fire: burns projectiles, scorches enemies and heals 20% HP/s. Every 2 seconds the radius grows by 10% of its original size. The first charge is ready; recharge with 10 successful Blinks.', icon: '♨', color: '#F05252' },
] as const;
export const WAR_BANNER_DEFINITION={id:'banner',name:'Vanguard Banner',description:'A banner lasts 15 seconds. Restores 10% maxHP per second within 140px. The first charge is ready; recharge with 10 successful dashes.',icon:'⚑',color:'#9BC5A5'} as const;
export const WARRIOR_ULTIMATE_DEFINITIONS = [
  WAR_BANNER_DEFINITION,
  { id: 'earthbreaker', name: 'Threefold Fissure', description: 'Three branches extend 280px forward: 4 successive waves of 100 damage. Each target is hit once per wave; total damage to bosses and Guardians is capped at 16% maxHP. The first charge is ready; recharge with 10 successful dashes.', icon: '⋔', color: '#D4B37B' },
  { id: 'ruin', name: 'Battering Spear', description: 'A heavy spear pierces enemies over 560px: 420 damage. At its endpoint, deals 140 damage within 48px to targets not already hit. Bosses and Guardians take at most 18% maxHP per cast. The first charge is ready; recharge with 10 successful dashes.', icon: '➶', color: '#BFD3D9' },
] as const;
export function ultimateDefinitions(character:CharacterId){return character==='warrior'?WARRIOR_ULTIMATE_DEFINITIONS:ULTIMATE_DEFINITIONS;}
export function isWarriorAttackUltimate(id: string | null): id is WarriorAttackUltimate { return id === 'earthbreaker' || id === 'ruin'; }
export function isUltimateId(id: string): id is UltimateId { return [...ULTIMATE_DEFINITIONS,...WARRIOR_ULTIMATE_DEFINITIONS].some(d => d.id === id); }
