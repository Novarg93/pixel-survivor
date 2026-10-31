export const BALANCE = {
  playerSpeed: 135, playerHp: 100, regularCap: 150, projectileCap: 96, effectCap: 96, orbCap: 240,
  fireballDamage: 24, fireballCooldown: 0.8, fireballSpeed: 270, fireballRange: 310,
  invulnerability: 0.85, spawnInterval: 1.25, despawnDistance: 1100,
} as const;

export const LOOT_BALANCE = {
  regularDropChance: 0.003, eliteDropChance: 0.12,
  itemCap: 6, itemLifetime: 25, pickupRadius: 15,
  healFraction: 0.3, hasteMultiplier: 1.5, furyMultiplier: 1.5,
  hasteDuration: 10, furyDuration: 10,
  chestCap: 4, chestLifetime: 60, chestOpenRadius: 22,
  pickupNoticeDuration: 2, trailCap: 12, trailInterval: 0.075, trailLifetime: 0.45,
} as const;

export const GUARDIAN_BALANCE = {
  intervalMin: 120, intervalMax: 240, cap: 1, retry: 5, spawnPadding: 56,
  radarDistanceMin: 0.6, radarDistanceMax: 0.85,
  lifetime: 8 * 60, abandonRadiusMultiplier: 2.5, noticeDuration: 5,
} as const;
export const ARTIFACT_BALANCE = {
  maxStacks: 3, itemCap: 3, lifetime: 180, pickupRadius: 16, noticeDuration: 4,
  health: 0.1, damage: 0.08, speed: 0.07, cooldown: 0.06, experience: 0.15,
} as const;
export const RADAR_BALANCE = { hz: 5, radiusMultiplier: 2, minRadius: 128, desktopSize: 180, mobileSize: 112 } as const;
