import {expect,it} from 'vitest';
import {MageRunAnimation} from '../../src/game/art/MageRunAnimation';
import {MAGE_DIRECTIONS} from '../../src/game/art/MageHeroAnimation';
import {MAGE_HERO,mageHeroFrame,mageRunStopFrames} from '../../src/game/art/mageHeroPack';

it.each(MAGE_DIRECTIONS)('plays one start then steady loops and finishes from the displayed %s stride',direction=>{
 const a=new MageRunAnimation();expect(a.current()).toBeUndefined();
 expect(a.view(.01,1.35,direction,true)?.motion).toBe('run-start');
 const loopFrames:string[]=[];
 for(let i=0;i<200;i++){const pose=a.view(.01,1.35,direction,true)!;expect(pose.motion).not.toBe('run-stop');if(pose.motion==='run')loopFrames.push(mageHeroFrame({...pose,casting:false}));}
 expect(new Set(loopFrames).size).toBe(8);expect(loopFrames.filter((f,i)=>i>0&&f.endsWith('-0')&&loopFrames[i-1]!.endsWith('-7')).length).toBeGreaterThanOrEqual(3);
 const previous=mageHeroFrame({...a.current()!,casting:false}),stop=a.view(.01,0,direction,false)!;
 expect(stop.motion).toBe('run-stop');expect(mageHeroFrame({...stop,casting:false})).toBe(previous);
 const route=mageRunStopFrames(previous);expect(route.at(-1)).toBe(`mage-v2-run-stop-${direction}-4`);
 for(let i=0;i<30;i++)a.view(.01,0,direction,false);expect(a.current()).toBeUndefined();
 expect(a.view(.01,1.35,direction,true)?.motion).toBe('run-start');
});
it('resumes an interrupted stop immediately and turns without replaying the start',()=>{
 const a=new MageRunAnimation();for(let i=0;i<40;i++)a.view(.01,1.35,'east',true);
 a.view(.01,0,'east',false);a.view(.02,0,'east',false);
 const resumed=a.view(.01,1.35,'east',true)!;expect(resumed.motion).toBe('run');
 const turned=a.view(.01,1.35,'north',true)!;expect(turned.motion).toBe('run');expect(turned.direction).toBe('north');expect(turned.age).toBeGreaterThan(resumed.age);
 a.clear();expect(a.current()).toBeUndefined();
});
it('settles a short tap and freezes every transition with a zero simulation delta',()=>{
 const a=new MageRunAnimation(),start=a.view(.01,.3,'west',true)!;
 expect(a.view(0,0,'west',true)).toEqual(start);const stop=a.view(.01,0,'west',false)!;
 expect(stop.motion).toBe('run-stop');expect(a.view(0,0,'west',false)).toEqual(stop);
 for(let i=0;i<30;i++)a.view(.01,0,'west',false);expect(a.current()).toBeUndefined();
});
it('packs distinct loop and transition clips, excludes Walk, and limits every stop to 200ms',()=>{
 for(const direction of MAGE_DIRECTIONS){
  const clips=MAGE_HERO.clips as Record<string,{frames:string[];loop:boolean;sourceFiles:string[]}>;
  expect(clips['walk-'+direction]).toBeUndefined();expect(clips['run-'+direction]!.loop).toBe(true);
  expect(clips['run-start-'+direction]!.loop).toBe(false);expect(clips['run-stop-'+direction]!.loop).toBe(false);
  for(const frame of [...clips['run-'+direction]!.frames,...clips['run-start-'+direction]!.frames]){
   const route=mageRunStopFrames(frame);expect(route[0]).toBe(frame);expect(route.length/30).toBeLessThanOrEqual(.2);
   for(const f of route)expect((MAGE_HERO.locations as Record<string,number>)[f]).toBeDefined();
  }
 }
});
