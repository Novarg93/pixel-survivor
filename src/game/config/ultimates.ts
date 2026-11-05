export type UltimateId = 'lightning' | 'frost' | 'fire';
export const ULTIMATE = {
  level: 40, time: 600, charges: 10,
  lightning: { damage: 480, bossFraction: .12, invocation: .34, skyStrike: .065, preparation: .52, reveal: .075, hold: .125, fade: .12, recovery: .4, recoil: .2, branches: 4, targetCap: 156, ashCap: 48 },
  frost: { damage: 220, bossFraction: .08, duration: 1.1, widthFraction: .7, lengthScreens: .9, root: 2 },
  fire: { damage: 62, bossFraction: .24, duration: 10, interval: .5, radius: 82, trailWidth: 38, trailDuration: 2, trailCap: 12, trailStep: 18 },
} as const;
export const ULTIMATE_DEFINITIONS = [
  { id: 'lightning', name: 'Гнев Небес', description: 'Катастрофический разряд: мгновенная разветвлённая паутина. Первый заряд готов; затем 10 успешных Blink.', icon: 'ϟ', color: '#458FFF' },
  { id: 'frost', name: 'Абсолютный Ноль', description: 'Широкая ледяная лавина вперёд: урон и Root. Первый заряд готов; затем 10 успешных Blink.', icon: '❄', color: '#D9F3F7' },
  { id: 'fire', name: 'Погребальное Пламя', description: '10 секунд огненного воплощения, аура и след. Первый заряд готов; затем 10 успешных Blink.', icon: '♨', color: '#F05252' },
] as const;
export function isUltimateId(id: string): id is UltimateId { return ULTIMATE_DEFINITIONS.some(d => d.id === id); }
