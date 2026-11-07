import {expect,it} from 'vitest';
import manifest from '../../src/game/art/ashWardenManifest.json';
import {WARDEN,wardenIndex,wardenPose} from '../../src/game/art/ashWardenPack';
import {World} from '../../src/game/systems/World';
import {FINAL_BOSS as C} from '../../src/game/config/finalBoss';
import {freezeForUltimate} from '../../src/game/systems/UltimateFreeze';

function setup(){const w=new World(73,{spawnRate:0});w.practice=true;w.elapsed=1200;w.player.invulnerableUntil=Infinity;w.finalEncounter.begin(w);for(let i=0;i<47;i++)w.step(.05);const f=w.finalEncounter;f.nextCombo=f.nextMeteor=f.nextMelee=Infinity;return w;}
it('uses user-supplied North/South and accepted East GIFs with source timing for all four movement clips',()=>{
  expect(manifest.walking.sourceFiles.north.gif).toBe('art/generated/ash-warden-walk-manual-v1/north/walk/north.gif');
  expect(manifest.walking.sourceFiles.south.gif).toBe('art/generated/ash-warden-walk-manual-v1/south/walk/south.gif');
  expect(manifest.walking.sourceFiles.east.gif).toBe('art/generated/ash-warden-walk-rd-v2/incoming/east/east-walk.gif');
  expect(manifest.walking.losslessFixedReduction).toBe(4);
  for(const facing of ['east','west','south','north']){
    const c=WARDEN.clips[facing+'-walk']!;expect(c.frames).toHaveLength(12);expect(c.durationsMs).toEqual(Array(12).fill(150));expect(c.loop).toBe(true);
    for(let i=0;i<12;i++){expect(wardenIndex(c,i*.15+.001)).toBe(i);for(const l of c.frames[i]!.layers){expect(l.pivot).toEqual([96,154]);expect(l.scale).toBe(.6548310811);}}
    expect(wardenIndex(c,1.8)).toBe(0);
  }
});
it('shares complete East body and pose-matched Phase3 emission with mirrored West',()=>{
  const east=WARDEN.clips['east-walk']!,west=WARDEN.clips['west-walk']!;
  for(let i=0;i<12;i++){expect(west.frames[i]!.layers).toEqual(east.frames[i]!.layers);expect(west.frames[i]!.overlay).toEqual(east.frames[i]!.overlay);expect(west.frames[i]!.flipX).toBe(true);expect(east.frames[i]!.overlay).toBeTruthy();}
});
it('selects approved walking from actual pursuit in four directions while retaining movement speed and shared phase',()=>{
  const w=setup(),f=w.finalEncounter,e=f.boss!;
  for(const [face,dx,dy]of [['east',1,0],['west',-1,0],['south',0,1],['north',0,-1]] as const){
    w.player.x=e.x+dx*250;w.player.y=e.y+dy*250;w.step(.05);const pose=wardenPose(f);
    expect(f.attack.kind).toBe('approach');expect(pose.clip).toBe(face+'-walk');expect(pose.index).toBe(wardenIndex(WARDEN.clips[face+'-walk']!,f.bossClock));expect(pose.presentationDirection).toBe(face);
    expect(f.chaseSpeed).toBe(Math.min(C.chaseMax,Math.max(C.chaseMin,w.effectiveSpeed*C.chaseMultiplier)));
  }
});
it('holds new movement and emission under freeze/pause and returns to existing idle when motion stops',()=>{
  const w=setup(),f=w.finalEncounter,e=f.boss!;f.phase='phase3';f.nextVolley=Infinity;w.player.x=e.x+250;w.player.y=e.y;w.step(.05);const before=wardenPose(f);
  freezeForUltimate(e,w.elapsed,w.elapsed+1);for(let i=0;i<10;i++)w.step(.05);expect(wardenPose(f)).toEqual(before);
  w.pause();for(let i=0;i<10;i++)w.step(.05);expect(wardenPose(f)).toEqual(before);w.resume();
  for(let i=0;i<11;i++)w.step(.05);w.player.x=e.x+20;w.player.y=e.y;w.step(.05);expect(wardenPose(f).clip).toBe('east-idle');
});
