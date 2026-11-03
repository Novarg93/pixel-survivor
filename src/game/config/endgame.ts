export const ENDGAME={from:900,interval:30,spawnStep:.05,speedStep:.03,attackStep:.04,projectileStep:.03,
  spawnCap:4,speedCap:1.6,attackCap:3,projectileCap:1.6,
  regularMax:170,runnerMax:190,rusherMax:175,
  bossMoveStep:.04,bossAttackStep:.06,birthMoveStep:.005,birthAttackStep:.01,
  bossMoveCap:1.6,meleeMoveCap:1.45,bossAttackCap:3,chargeMax:320,
  recoveryMin:.2,approachMin:.25,teleportMin:2.8,warningMin:.5,volleyMax:11,
} as const;
export function endgameAt(seconds:number){
  const active=Number.isFinite(seconds)&&seconds>=ENDGAME.from,tick=active?Math.max(0,Math.floor((seconds-ENDGAME.from+1e-7)/ENDGAME.interval)):0;
  return{active,tick,spawn:Math.min(ENDGAME.spawnCap,1+tick*ENDGAME.spawnStep),speed:Math.min(ENDGAME.speedCap,1+tick*ENDGAME.speedStep),attack:Math.min(ENDGAME.attackCap,1+tick*ENDGAME.attackStep),projectile:Math.min(ENDGAME.projectileCap,1+tick*ENDGAME.projectileStep)};
}
export function lateBossProfile(seconds:number,index:number,melee=false){
  const p=endgameAt(seconds),n=Math.max(0,index-1);
  return{index,movement:Math.min(melee?ENDGAME.meleeMoveCap:ENDGAME.bossMoveCap,1+p.tick*ENDGAME.bossMoveStep+n*ENDGAME.birthMoveStep),
    frequency:Math.min(ENDGAME.bossAttackCap,1+p.tick*ENDGAME.bossAttackStep+n*ENDGAME.birthAttackStep),
    projectile:Math.min(ENDGAME.projectileCap,1+p.tick*ENDGAME.projectileStep+n*.003),
    volley:Math.min(ENDGAME.volleyMax,7+Math.floor(n/6+p.tick/8))};
}
