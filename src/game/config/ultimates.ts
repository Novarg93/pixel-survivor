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
  { id: 'lightning', name: 'Гнев Небес', description: 'Катастрофический разряд: мгновенная разветвлённая паутина. Первый заряд готов; затем 10 успешных Blink.', icon: 'ϟ', color: '#458FFF' },
  { id: 'frost', name: 'Абсолютный Ноль', description: 'Руна замораживает даже боссов и Guardian на 4 секунды, затем ещё 4 секунды льда. После каста ледяная лавина расходится к краям: 180 урона, боссам и Guardian — не более 8% HP. Первый заряд готов; затем 10 успешных Blink.', icon: '❄', color: '#D9F3F7' },
  { id: 'fire', name: 'Погребальное Пламя', description: '10 секунд пламени: сжигает снаряды, обжигает врагов и лечит 20% HP/с. Каждые 2 секунды радиус +10% от исходного. Первый заряд готов; затем 10 успешных Blink.', icon: '♨', color: '#F05252' },
] as const;
export const WAR_BANNER_DEFINITION={id:'banner',name:'Знамя авангарда',description:'Знамя на 15 секунд. В радиусе 140px восстанавливает 10% максимального HP в секунду. Первый заряд готов; затем 10 успешных рывков.',icon:'⚑',color:'#9BC5A5'} as const;
export const WARRIOR_ULTIMATE_DEFINITIONS = [
  WAR_BANNER_DEFINITION,
  { id: 'earthbreaker', name: 'Три ветви разлома', description: 'Три ветви вперёд на 280px: 4 последовательные волны по 100 урона. Одна цель — один удар за волну; боссам и Хранителям суммарно не более 16% maxHP. Первый заряд готов; затем 10 успешных рывков.', icon: '⋔', color: '#D4B37B' },
  { id: 'ruin', name: 'Таранное копьё', description: 'Тяжёлое копьё пробивает врагов на 560px: 420 урона. В конце пути — удар 140 урона в радиусе 48px по ещё не задетым целям. Боссам и Хранителям не более 18% maxHP за применение. Первый заряд готов; затем 10 успешных рывков.', icon: '➶', color: '#BFD3D9' },
] as const;
export function ultimateDefinitions(character:CharacterId){return character==='warrior'?WARRIOR_ULTIMATE_DEFINITIONS:ULTIMATE_DEFINITIONS;}
export function isWarriorAttackUltimate(id: string | null): id is WarriorAttackUltimate { return id === 'earthbreaker' || id === 'ruin'; }
export function isUltimateId(id: string): id is UltimateId { return [...ULTIMATE_DEFINITIONS,...WARRIOR_ULTIMATE_DEFINITIONS].some(d => d.id === id); }
