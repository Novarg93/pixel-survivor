import { expect, it } from 'vitest';
import { biomePhaseNotice } from '../../src/ui/biomePhaseNotice';
import { World } from '../../src/game/systems/World';

for (const [start, phase, title] of [[300,'dusk','Сумеречная роща'],[600,'dying','Умирающая роща'],[900,'burning','Горящая роща']] as const) {
  it(`announces ${phase} exactly at its milestone for five run seconds`, () => {
    const sample = (elapsed: number) => biomePhaseNotice({ biome:'grove',elapsed,status:'playing' });
    expect(sample(start-.001)).toBeNull();
    expect(sample(start)).toMatchObject({ phase,title,remaining:1,opacity:1 });
    expect(sample(start+2.5)).toMatchObject({ phase,title,remaining:.5,opacity:1 });
    expect(sample(start+4.75)).toMatchObject({ phase,title,opacity:.5 });
    expect(sample(start+5)).toBeNull();expect(sample(start+15)).toBeNull();
  });
}
it('uses the paused/upgrade run clock without replay, timers, simulation or config mutations', () => {
  const w=new World(21);w.elapsed=602;w.pause();
  const state=w.snapshot(),before=JSON.stringify(w),notice=biomePhaseNotice(state);
  for(let i=0;i<20;i++)expect(biomePhaseNotice(state)).toEqual(notice);
  expect(biomePhaseNotice({...state,status:'upgrade'})).toEqual(notice);
  expect(JSON.stringify(w)).toBe(before);
});
it('clears at death, menu and a fresh run, and never announces normal or the old pretransition windows', () => {
  for(const elapsed of [0,240,270,285,570,585,870,885])expect(biomePhaseNotice({biome:'grove',elapsed,status:'playing'})).toBeNull();
  for(const status of ['menu','over'] as const)expect(biomePhaseNotice({biome:'grove',elapsed:901,status})).toBeNull();
  expect(biomePhaseNotice(new World().snapshot())).toBeNull();
});
