export const GUARDIAN_ENCOUNTER = {
  awakening: 1.2, beamWarning: 1.35, beamDuration: 2.8, beamTurnSpeed: .55,
  beamWidth: 12, beamMaxLength: 220, beamDamage: 14, damageInterval: .35,
  meteorWarning: 1.4, meteorCount: 3, meteorMaxRadius: 32, meteorDamage: 22,
  recovery: 2.4, maxDuration: 75, minLeash: 260, leashViewportFactor: 1.1,
} as const;
export const MOBILITY = {
  warrior: { name: 'Dash', cooldown: 4, distance: 96, duration: .18, protection: .22, color: 0xffd58c },
  mage: { name: 'Blink', cooldown: 6, distance: 112, duration: 0, protection: .18, color: 0xbcb2ff },
  viewportFraction: .38, visualDuration: .32,
} as const;
