import type { World } from '../../src/game/systems/World';
import { direction, distance, segmentDistance, type Point } from '../../src/game/utils/math';
import { guardianBeamEnd } from '../../src/game/systems/GuardianEncounter';
import {bossVolleyAngles} from '../../src/game/systems/BossMagic';
import {MOBILITY} from '../../src/game/config/encounters';

export interface PilotState { target: number; blinks: number }
// Test-only positioning pilot. It reads visible simulation hazards and uses the
// same movement/mobility methods as Phaser; it never grants HP or invulnerability.
export function encounterPilot(w: World, state: PilotState, allowBlink = true) {
  let target = w.enemies.find(e => e.id === state.target && (e.boss || e.kind === 'guardian'));
  if (!target) {
    target = [...w.guardians, ...w.bosses].sort((a,b)=>distance(a,w.player)-distance(b,w.player))[0];
    state.target = target?.id ?? 0;
  }
  const aim = target ? direction(target.x-w.player.x,target.y-w.player.y) : direction(Math.cos(w.elapsed*.15),Math.sin(w.elapsed*.15));
  const radius = target?.kind === 'guardian' ? target.discovered ? 90 : 50 : 170;
  const d = target ? distance(target,w.player) : radius;
  const radial = d>radius+20 ? 1 : d<radius-20 ? -1 : 0;
  let x=aim.x*radial-aim.y,y=aim.y*radial+aim.x,danger=0;
  const repel=(p:Point,r:number,weight=4)=>{const dist=distance(p,w.player);if(dist>=r)return;let v=direction(w.player.x-p.x,w.player.y-p.y);if(!v.x&&!v.y)v={x:0,y:-1};const force=weight*(1-dist/r);x+=v.x*force;y+=v.y*force;danger+=force;};
  const avoidSegment=(a:Point,b:Point,r:number)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((w.player.x-a.x)*dx+(w.player.y-a.y)*dy)/(dx*dx+dy*dy||1)));repel({x:a.x+dx*t,y:a.y+dy*t},r,7);};
  for(const i of w.impacts)if(i.hostile)repel(i,i.radius+38,8);
  for(const g of w.guardians){const s=w.guardianSystem.encounters.get(g.id);if(s&&(s.phase==='beam-warning'||s.phase==='beam')){avoidSegment(g,guardianBeamEnd(g,s),35);}}
  for(const b of w.bosses)if(b.kind==='charger'&&(b.boss!.phase==='windup'||b.boss!.phase==='charge'))avoidSegment(b,b.boss!.aim,b.radius+38);
  for(const b of w.bosses)if(b.boss!.magic?.phase==='signal'&&b.boss!.magic.target)repel(b.boss!.magic.target,b.radius+60,6);
  for(const b of w.bosses)if(b.boss!.enrageIndex&&b.kind!=='charger'&&b.boss!.phase==='windup'&&b.boss!.magic?.phase!=='signal')for(const a of bossVolleyAngles(b))avoidSegment(b,{x:b.x+Math.cos(a)*310,y:b.y+Math.sin(a)*310},24);
  for(const p of w.projectiles)if(p.hostile)avoidSegment(p,{x:p.x+p.vx*.35,y:p.y+p.vy*.35},30);
  for(const e of w.enemies)repel(e,e.radius+26,5);
  const desired=direction(x,y);
  const cost=(v:Point)=>{
    const p={x:w.player.x+v.x*w.effectiveSpeed*.25,y:w.player.y+v.y*w.effectiveSpeed*.25};let score=.4*(1-v.x*desired.x-v.y*desired.y);
    for(const e of w.enemies)score+=Math.max(0,1-distance(p,e)/(e.radius+28))*7;
    for(const shot of w.projectiles)if(shot.hostile)score+=Math.max(0,1-segmentDistance(p,shot,{x:shot.x+shot.vx*.4,y:shot.y+shot.vy*.4})/28)*12;
    for(const i of w.impacts)if(i.hostile)score+=Math.max(0,1-distance(p,i)/(i.radius+24))*8;
    return score;
  };
  const input=[desired,...Array.from({length:8},(_,i)=>({x:Math.cos(i*Math.PI/4),y:Math.sin(i*Math.PI/4)}))].sort((a,b)=>cost(a)-cost(b))[0];
  const blinkDistance=Math.min(MOBILITY[w.character].distance,Math.max(24,Math.min(w.width,w.height)*MOBILITY.viewportFraction)),landing={x:w.player.x+input.x*blinkDistance,y:w.player.y+input.y*blinkDistance};
  const unsafe=w.impacts.some(i=>i.hostile&&distance(landing,i)<i.radius+20)||w.enemies.some(e=>distance(landing,e)<e.radius+22)||w.projectiles.some(p=>p.hostile&&segmentDistance(landing,p,{x:p.x+p.vx*.35,y:p.y+p.vy*.35})<24);
  if(allowBlink&&danger>.3&&!unsafe&&w.mobility.activate(w,input))state.blinks++;
  return input;
}
