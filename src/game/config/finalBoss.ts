const CHARGE_SPEED_MULTIPLIER=1.3;
export const FINAL_BOSS = {
  at:1200, intro:2.3, firstCombo:3, hp:108000, guardianHp:1800,
  arenaRadius:800, guardianRadius:550, bodyRadius:28, speed:256,
  meleeRange:50, meleeRadius:115, meleeAngle:100*Math.PI/180, meleeHit:.65, meleeDuration:1.2, meleeCooldown:2.2, meleeDamage:32, meleeASpeedMultiplier:1.3, meleeSpeedMultiplier:1.15,
  comboInterval:8, phase2ComboInterval:4, chargeWindup:.65, chargeSpeedMultiplier:CHARGE_SPEED_MULTIPLIER, chargeDuration:.42/CHARGE_SPEED_MULTIPLIER, chargeDistance:300,
  chargeBrake:.3, swordWindup:.9/1.5, swordActive:.15, swordRadius:280, swordWidth:44,
  swordAnglesPhase2:[0,-22.5,22.5], swordAnglesPhase3:[0,-22.5,22.5,-45,45],
  recovery:.75, shieldBreak:3, repeatAfter:50,
  transition:.8, phase3Transform:1.8, ritualEnter:.9, meteorCast:1.44, meteorInterval:8, meteorRange:300, meteorWarning:1.3, meteorRadius:42, phase2MeteorCount:3,
  ritualInterval:18, ritualCast:1.2, ritualRelease:.33, meteorTail:.5, meteorStagger:.15, maxMeteors:12,
  armageddonInterval:15, armageddonFirst:3,
  chargeDamage:48, swordDamage:64, meteorDamage:54, orbDamage:24,
  orbInterval:8, orbWarning:.65, orbSpeed:86, orbTurn:.65, orbLifetime:20,
  deathDuration:2.2,
} as const;
