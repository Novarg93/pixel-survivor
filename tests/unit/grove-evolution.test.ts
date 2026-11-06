import { expect, it } from 'vitest';
import { AVAILABLE_MAPS, playableMap } from '../../src/game/config/biomes';
import { AtmospherePhaseController } from '../../src/game/systems/AtmospherePhaseController';
import { groveDecoration, GROVE_ART_BUDGET } from '../../src/game/art/groveArtPack';
import { World } from '../../src/game/systems/World';
import { loadProfile, runRecord, saveProfile, withRun } from '../../src/game/services/storage';

it.each([
  [0,'normal','normal',1],[299.99,'normal','normal',1],[300,'normal','dusk',0],[302.5,'normal','dusk',.5],
  [305,'dusk','dusk',1],[315,'dusk','dusk',1],[600,'dusk','dying',0],[602.5,'dusk','dying',.5],[605,'dying','dying',1],
  [615,'dying','dying',1],[900,'dying','burning',0],[902.5,'dying','burning',.5],[905,'burning','burning',1],[915,'burning','burning',1],
] as const)('Grove presentation at %ss', (time, phase, target, blend) => {
  expect(new AtmospherePhaseController().sample(time)).toMatchObject({ phase, target, blend });
});
it('keeps coordinate identity and simulation RNG untouched through all art phases', () => {
  const w=new World(293),reference=new World(293),controller=new AtmospherePhaseController();
  w.spawn('tank',{x:40,y:20});reference.spawn('tank',{x:40,y:20});
  const before=JSON.stringify(w),layout=[];
  for(let y=-30;y<30;y++)for(let x=-30;x<30;x++)layout.push(groveDecoration(x,y));
  for(const time of [0,302.5,315,602.5,615,902.5,915]){
    controller.sample(time);
    const current=[];for(let y=-30;y<30;y++)for(let x=-30;x<30;x++)current.push(groveDecoration(x,y));
    expect(current).toEqual(layout);
  }
  expect(JSON.stringify(w)).toBe(before);expect(w.rng.next()).toBe(reference.rng.next());
  expect(GROVE_ART_BUDGET.atlasWidth*GROVE_ART_BUDGET.atlasHeight*4).toBeLessThan(2*1024*1024);
});
it('supports a map-specific presentation schedule without changing the controller', () => {
  const phases=AVAILABLE_MAPS[0].presentation.phases;
  const custom=new AtmospherePhaseController([phases[0],{...phases[3],start:60,end:80}]);
  expect(custom.sample(70)).toMatchObject({phase:'normal',target:'burning',blend:.5});
});
it('retains legacy records and totals verbatim, while legacy and unknown starts use Grove', () => {
  const record=runRecord(new World(129).snapshot());record.id='old-dark';record.details!.biome='dark-forest';record.score=500;
  let json=JSON.stringify({version:2,records:[record],statistics:{runs:9,kills:39,seconds:2500},lastPlayed:{id:record.id,at:record.finishedAt}});
  const storage={getItem:()=>json,setItem:(_key:string,value:string)=>{json=value;}};
  const profile=loadProfile(storage);expect(profile.records).toEqual([record]);
  expect(profile.statistics).toEqual({runs:9,kills:39,seconds:2500});
  expect(AVAILABLE_MAPS.map(m=>m.id)).toEqual(['grove']);
  for(const id of ['dark-forest','missing',null,undefined])expect(playableMap(id)).toBe('grove');
  const w=new World(22,{biome:'dark-forest'});expect(w.biome).toBe('grove');
  const next=withRun(profile,runRecord(w.snapshot()));saveProfile(next,storage);
  expect(loadProfile(storage).records.find(r=>r.id==='old-dark')).toEqual(record);
  expect(loadProfile(storage).records.filter(r=>r.details?.biome==='grove')).toHaveLength(1);
});
