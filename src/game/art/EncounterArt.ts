import type Phaser from 'phaser';
import { GUARDIAN_ENCOUNTER as C, MOBILITY } from '../config/encounters';
import { showPlayerShieldShell } from './playerShieldVisuals';
import { guardianBeamEnd, type GuardianEncounter } from '../systems/GuardianEncounter';
import type { MobilitySystem } from '../systems/MobilitySystem';
import type { World } from '../systems/World';
import type { Enemy } from '../entities/types';
import { CHARGE_BOSS } from '../config/chargeBoss';
import {GUARDIAN_ORBS} from '../config/guardianOrbs';

export function drawChargePreparation(g: Phaser.GameObjects.Graphics, w: World, e: Enemy) {
  if (w.status === 'over' || e.hp <= 0 || e.kind !== 'charger' || e.boss?.phase !== 'windup') return;
  const flash = e.boss.until - w.elapsed <= CHARGE_BOSS.flashDuration;
  // Local stepped sparks around the raised arms. No target/path geometry.
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
    const x = Math.round(e.x + side * (10 + i * 3)), y = Math.round(e.y - 12 - (i % 2) * 4);
    g.fillStyle(flash ? 0xffeed3 : 0xf0ac79, flash ? 1 : .75).fillRect(x, y, i % 2 ? 2 : 3, 2);
  }
}

// Enemy danger belongs to the existing depth-20 batch and ignores cosmetic intensity.
export function drawGuardianDanger(g: Phaser.GameObjects.Graphics, w: World, state: GuardianEncounter | null, owner = state?.ownerId) {
  const e = owner === undefined ? w.rareGuardian : w.guardians.find(e => e.id === owner); if (!e) return;
  if (!state || state.ownerId !== e.id) return;
  if (state.phase === 'beam-warning' || state.phase === 'beam') {
    const end = guardianBeamEnd(e, state), active = state.phase === 'beam';
    g.lineStyle(C.beamWidth + 2, 0x251f3a, .8).lineBetween(e.x, e.y, end.x, end.y);
    g.lineStyle(C.beamWidth, active ? 0xff648e : 0xe893a7, active ? .8 : .24).lineBetween(e.x, e.y, end.x, end.y);
    g.lineStyle(active ? 3 : 1, active ? 0xfff0ba : 0xffb9b1, 1).lineBetween(e.x, e.y, end.x, end.y);
    const tipAngle = state.angle + .45, r = Math.min(58, state.length * .55);
    g.lineStyle(2, 0xffd698).beginPath().arc(e.x, e.y, r, state.angle, tipAngle).strokePath();
    const x = e.x + Math.cos(tipAngle) * r, y = e.y + Math.sin(tipAngle) * r;
    const tx = -Math.sin(tipAngle), ty = Math.cos(tipAngle);
    g.fillStyle(0xffd698).fillTriangle(x + tx * 4, y + ty * 4, x - tx * 3 - ty * 3, y - ty * 3 + tx * 3, x - tx * 3 + ty * 3, y - ty * 3 - tx * 3);
  }
}
export function drawEnrageDanger(g:Phaser.GameObjects.Graphics,w:World){
  if(w.status==='over')return;
  for(const p of w.projectiles)if(p.homing&&!p.appearance&&p.expires>w.elapsed){
    const c=GUARDIAN_ORBS[p.homing.variant],r=c.radius,x=Math.round(p.x),y=Math.round(p.y),speed=Math.hypot(p.vx,p.vy)||1;
    for(let i=1;i<=4;i++)g.fillStyle(c.color,(1-i/5)*.7).fillRect(Math.round(x-p.vx/speed*i*4)-1,Math.round(y-p.vy/speed*i*4)-1,3,3);
    g.fillStyle(0x132330,1).fillRect(x-r-2,y-r,2*r+4,2*r).fillRect(x-r,y-r-2,2*r,2*r+4);
    g.fillStyle(c.color,1).fillRect(x-r,y-r+2,2*r,2*r-4).fillRect(x-r+2,y-r,2*r-4,2*r);
    g.fillStyle(0xf2ffff,1).fillRect(x-1,y-2,3,4);
    if(p.homing.variant==='fast')g.fillStyle(0xffe8a1,1).fillRect(x-r-3,y-1,2,2).fillRect(x+r+2,y-1,2,2);
  }
}
export function drawMobility(g: Phaser.GameObjects.Graphics, w: World, mobility: MobilitySystem, intensity: number) {
  drawMobilityUpgrade(g, w, mobility, intensity);
  const t = (w.elapsed - mobility.started) / MOBILITY.visualDuration;
  if (t < 0 || t >= 1 || w.status === 'over') return;
  const alpha = (1 - t) * Math.max(.25, intensity), color = MOBILITY[w.character].color;
  const { from, to } = mobility;
  if (w.character === 'mage') {
    for (const p of [from, to]) {
      g.lineStyle(2, color, alpha).strokeCircle(p.x, p.y, 9 + t * 10);
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + t, r = 12 + t * 9; g.fillStyle(0xe9e2ff, alpha).fillRect(p.x + Math.cos(a) * r - 1, p.y + Math.sin(a) * r - 1, 2, 3); }
    }
    g.lineStyle(1, color, alpha * .35).lineBetween(from.x, from.y, to.x, to.y);
  } else {
    const normal = { x: -mobility.direction.y, y: mobility.direction.x };
    for (let i = -1; i <= 1; i++) g.lineStyle(i ? 2 : 4, i ? 0xf4e5c4 : color, alpha * .6).lineBetween(from.x + normal.x * i * 5, from.y + normal.y * i * 5, w.player.x + normal.x * i * 5, w.player.y + normal.y * i * 5);
  }
}

// Bounded pixel clusters, drawn in the existing friendly batch below hostile tells.
export function drawMobilityUpgrade(g: Phaser.GameObjects.Graphics, w: World, m: MobilitySystem, intensity: number) {
  if (w.status === 'over' || !m.variant) return;
  for (const zone of w.zones) if (zone.wall && zone.expires > w.elapsed) {
    const wall = zone.wall, dx = wall.to.x-wall.from.x, dy = wall.to.y-wall.from.y, length = Math.hypot(dx,dy), steps = Math.max(1,Math.ceil(length/5));
    const nx = -dy/length, ny = dx/length, cold = wall.variant === 'slowing-flame';
    const fade = Math.min(1,(zone.expires-w.elapsed)*4)*Math.max(.35,intensity);
    for(let i=0;i<=steps;i++)for(const side of [-1,0,1]){
      const t=i/steps,x=Math.round(wall.from.x+dx*t+nx*side*wall.width*.28),y=Math.round(wall.from.y+dy*t+ny*side*wall.width*.28);
      const rise=3+((Math.floor(w.elapsed*9+i*1.7+side*.9)%4+4)%4)*2;
      g.fillStyle(cold?0x568f9d:0xb95743,fade*.8).fillRect(x-2,y-rise,4,rise+2);
      g.fillStyle(cold?0x9bdfe5:0xf59e46,fade).fillRect(x-1,y-rise,2,rise);
      g.fillStyle(cold?0xd9f3f7:0xffe2a3,fade).fillRect(x,y-rise+1,1,2);
    }
  }
  const sprint=w.buffs.remaining('arcane-sprint',w.elapsed)>0,berserk=w.buffs.remaining('berserk',w.elapsed)>0,absorb=m.absorbValue(w.elapsed)>0;
  if(absorb&&showPlayerShieldShell(w))for(const side of [-1,1])g.fillStyle(0xb9eeff,.65*intensity).fillRect(w.player.x+side*12-1,w.player.y-10,2,13).fillRect(w.player.x+side*10-1,w.player.y-13,3,3);
  if(sprint||berserk)for(let i=0;i<6;i++){
    const a=i*Math.PI/3+w.elapsed*3,r=sprint?16:13;
    g.fillStyle(sprint?0xb58cfa:0xf5a76b,.85*intensity).fillRect(Math.round(w.player.x+Math.cos(a)*r),Math.round(w.player.y+Math.sin(a)*r),2,3);
  }
  const age=w.elapsed-m.upgradeStarted;
  if(m.variant==='cleaving-dash' && age>=0&&age<.3)for(let i=0;i<10;i++){
    const t=i/9,x=m.from.x+(m.arrival.x-m.from.x)*t,y=m.from.y+(m.arrival.y-m.from.y)*t;
    g.fillStyle(0xffe0a5,(1-age/.3)*intensity).fillRect(Math.round(x)-1,Math.round(y)-3,2,6);
  }
}
