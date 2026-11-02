import type { World } from '../../src/game/systems/World';
import { direction, distance, type Point } from '../../src/game/utils/math';
import { guardianBeamEnd } from '../../src/game/systems/GuardianEncounter';

export interface PilotState { target: number; blinks: number }
// Test-only positioning pilot. It reads visible simulation hazards and uses the
// same movement/mobility methods as Phaser; it never grants HP or invulnerability.
export function encounterPilot(w: World, state: PilotState) {
  let target = w.enemies.find(e => e.id === state.target && (e.boss || e.kind === 'guardian'));
  if (!target) {
    target = [...w.guardians, ...w.bosses].sort((a,b)=>distance(a,w.player)-distance(b,w.player))[0];
    state.target = target?.id ?? 0;
  }
  const aim = target ? direction(target.x-w.player.x,target.y-w.player.y) : direction(Math.cos(w.elapsed*.15),Math.sin(w.elapsed*.15));
  const radius = target?.kind === 'guardian' ? target.discovered ? Math.min(220,Math.max(100,Math.min(w.width,w.height)*.65))+38 : 50 : 170;
  const d = target ? distance(target,w.player) : radius;
  const radial = d>radius+20 ? 1 : d<radius-20 ? -1 : 0;
  let x=aim.x*radial-aim.y,y=aim.y*radial+aim.x,danger=0;
  const repel=(p:Point,r:number,weight=4)=>{const dist=distance(p,w.player);if(dist>=r)return;let v=direction(w.player.x-p.x,w.player.y-p.y);if(!v.x&&!v.y)v={x:0,y:-1};const force=weight*(1-dist/r);x+=v.x*force;y+=v.y*force;danger+=force;};
  const avoidSegment=(a:Point,b:Point,r:number)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((w.player.x-a.x)*dx+(w.player.y-a.y)*dy)/(dx*dx+dy*dy||1)));repel({x:a.x+dx*t,y:a.y+dy*t},r,7);};
  for(const i of w.impacts)if(i.hostile)repel(i,i.radius+38,8);
  for(const g of w.guardians){const s=w.guardianSystem.encounters.get(g.id);if(s&&(s.phase==='beam-warning'||s.phase==='beam')){avoidSegment(g,guardianBeamEnd(g,s),35);}}
  for(const b of w.bosses)if(b.kind==='charger'&&(b.boss!.phase==='windup'||b.boss!.phase==='charge'))avoidSegment(b,b.boss!.aim,b.radius+38);
  for(const p of w.projectiles)if(p.hostile)avoidSegment(p,{x:p.x+p.vx*.35,y:p.y+p.vy*.35},30);
  for(const e of w.enemies)repel(e,e.radius+26,5);
  const input=direction(x,y);
  if(danger>.3&&w.mobility.activate(w,input))state.blinks++;
  return input;
}
