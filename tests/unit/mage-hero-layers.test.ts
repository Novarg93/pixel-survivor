import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import waists from '../../src/game/art/mageHeroWaists.json';
import {mageMovingLayers} from '../../src/game/art/mageHeroLayers';
import {MAGE_HERO,mageHeroSelection} from '../../src/game/art/mageHeroPack';
import {MAGE_DIRECTIONS,type MageHeroPose} from '../../src/game/art/MageHeroAnimation';

it('registers every atlas frame against this exact source manifest within a small belt offset',()=>{
  expect(waists.manifestHash).toBe(createHash('sha256').update(readFileSync('src/game/art/mageHeroManifest.json')).digest('hex'));
  expect(waists.canvas).toBe(MAGE_HERO.canvas);expect(Object.keys(waists.frames)).toHaveLength(MAGE_HERO.frameCount);
  for(const clip of Object.values(MAGE_HERO.clips))for(const frame of clip.frames){
    const a=(waists.frames as Record<string,{x:number;y:number}>)[frame]!;
    expect(a.x).toBeGreaterThanOrEqual(51);expect(a.x).toBeLessThanOrEqual(61);
    expect(a.y).toBeGreaterThanOrEqual(54);expect(a.y).toBeLessThanOrEqual(62);
  }
});
it.each(MAGE_DIRECTIONS)('joins the two independent clips in %s with exactly one pixel of waist overlap',direction=>{
  for(const motion of ['fireball','lightning','meteor','defensive'] as const)for(const gait of ['run-start','run','run-stop'] as const)for(const progress of [0,.2,.5,.8,1]){
    const pose:MageHeroPose={motion,direction,age:progress,progress,casting:true,locomotion:{motion:gait,direction,age:progress*.73}};
    const l=mageMovingLayers(pose)!;expect(l.lower).toEqual(mageHeroSelection({...pose.locomotion!,casting:false}));
    expect(l.upper).toEqual(mageHeroSelection(pose));expect(l.offset.x+l.upperWaist.x).toBe(l.lowerWaist.x);
    expect(l.offset.y+l.upperCrop.height-l.lowerCrop.y).toBe(1);
    expect(l.lowerCrop.y+l.lowerCrop.height).toBe(MAGE_HERO.canvas);
  }
});
it('keeps stationary, interrupted and death poses whole and leaves both animation clocks independent',()=>{
  const pose:MageHeroPose={motion:'meteor',direction:'west',age:.1,progress:.1,casting:true};
  expect(mageMovingLayers(pose)).toBeUndefined();expect(mageMovingLayers({...pose,casting:false})).toBeUndefined();
  expect(mageMovingLayers({...pose,motion:'death',casting:false})).toBeUndefined();
  const first={...pose,locomotion:{motion:'run' as const,direction:'west' as const,age:.1}},a=mageMovingLayers(first)!;
  const b=mageMovingLayers({...first,locomotion:{...first.locomotion,age:.2}})!;
  expect(a.upper).toEqual(b.upper);expect(a.lower).not.toEqual(b.lower);
  const c=mageMovingLayers({...first,progress:.6})!;expect(a.lower).toEqual(c.lower);expect(a.upper).not.toEqual(c.upper);
});
