import {endgameAt,ENDGAME} from './endgame';
export const SURVIVAL_ENRAGE = {
  from:600, interval:30, noticeDuration:5,
  spawnPerTick:.08, speedPerTick:.03, attackPerTick:.04,
  spawnCap:2, speedCap:1.6, attackCap:1.65,
  runnerSpeedCap:1.35, rusherSpeedCap:1.5,
  bossMovementCap:1.2, bossFrequencyCap:1.3,
} as const;
export function enrageAt(seconds:number) {
  const c=SURVIVAL_ENRAGE, active=Number.isFinite(seconds)&&seconds>=c.from;
  const tick=active?Math.max(0,Math.floor((seconds-c.from+1e-7)/c.interval)):0;
  const baseTick=Math.min(tick,(ENDGAME.from-c.from)/c.interval),late=endgameAt(seconds);
  return {active,tick,spawn:Math.min(c.spawnCap,1+c.spawnPerTick*baseTick)*late.spawn,speed:Math.min(c.speedCap,1+c.speedPerTick*baseTick)*late.speed,attack:Math.min(c.attackCap,1+c.attackPerTick*baseTick)*late.attack,notice:active&&seconds<c.from+c.noticeDuration};
}
