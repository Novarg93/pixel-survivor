export type UltimateId = 'lightning' | 'frost' | 'fire';
export const ULTIMATE = {
  level: 30, time: 300, charges: 10,
  lightning: { damage: 480, bossFraction: .12, invocation: .34, skyStrike: .065, preparation: .52, reveal: .075, hold: .125, fade: .12, recovery: .4, recoil: .2, branches: 4, targetCap: 156, ashCap: 48, spawnQuiet: 2, spawnRecovery: .7, groundDuration: 2, groundMargin: 24 },
  frost: { invocation: .45, creation: .25, activation: .2, duration: 4, residual: 4, radiusDiagonalRatio: .25, waveDelay: .2, waveDuration: .8, damage: 180, bossFraction: .08 },
  fire: { damage: 62, bossFraction: .24, duration: 10, interval: .5, radius: 164, growthInterval: 2, radiusGrowth: .1, healFraction: .2, trailWidth: 38, trailDuration: 2, trailCap: 12, trailStep: 18 },
} as const;
export const ULTIMATE_DEFINITIONS = [
  { id: 'lightning', name: 'Гнев Небес', description: 'Катастрофический разряд: мгновенная разветвлённая паутина. Первый заряд готов; затем 10 успешных Blink.', icon: 'ϟ', color: '#458FFF' },
  { id: 'frost', name: 'Абсолютный Ноль', description: 'Руна замораживает даже боссов и Guardian на 4 секунды, затем ещё 4 секунды льда. После каста ледяная лавина расходится к краям: 180 урона, боссам и Guardian — не более 8% HP. Первый заряд готов; затем 10 успешных Blink.', icon: '❄', color: '#D9F3F7' },
  { id: 'fire', name: 'Погребальное Пламя', description: '10 секунд пламени: сжигает снаряды, обжигает врагов и лечит 20% HP/с. Каждые 2 секунды радиус +10% от исходного. Первый заряд готов; затем 10 успешных Blink.', icon: '♨', color: '#F05252' },
] as const;
export function isUltimateId(id: string): id is UltimateId { return ULTIMATE_DEFINITIONS.some(d => d.id === id); }
