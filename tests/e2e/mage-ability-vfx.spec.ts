import {expect,test,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';

async function advance(page:Page,seconds:number){
  await page.evaluate(seconds=>{const w=window.__PIXEL__!.world;w.resume();for(let t=0;t<seconds-.0001;t+=.05)w.step(Math.min(.05,seconds-t));w.pause();},seconds);
  await page.waitForTimeout(70);
}
for(const burning of [false,true])for(const size of [{width:1280,height:720},{width:844,height:390}])test(`Nova lighting, Meteor, pause and restart ${burning?'burning':'grove'} ${size.width}`,async({page})=>{
  const directory=`screenshots/mage-ability-vfx-v1/meteor-v2/${burning?'burning':'grove'}`;
  mkdirSync(directory,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.setViewportSize(size);await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();
  const fixture=await page.evaluate(async(burning)=>{
    const w=window.__PIXEL__!.world;w.pause();w.elapsed=burning?915:20;w.options.spawnRate=0;w.encounterDirector.nextAt=1e6;w.enemies=[];w.impacts=[];w.effects=[];w.zones=[];
    for(const a of Object.values(w.abilities))a.level=0;
    const x=w.width<300?35:100,y=w.width<300?60:15;
    for(let i=0;i<3;i++){const e=w.spawn('tank',{x:x+i*2,y:y+i*2})!;e.speed=0;e.hp=e.maxHp=10000;}
    w.abilities.frost.level=w.abilities.meteor.level=1;
    const frostModule='/src/game/abilities/frostNova.ts',meteorModule='/src/game/abilities/meteor.ts';
    // Keep simulation paused while imports yield, so auto-casting cannot duplicate the fixture.
    const {frostNova}=await import(frostModule),{meteor}=await import(meteorModule);w.resume();frostNova(w);meteor(w);
    // Manual cast once; retain real ability damage, root, radius and impact scheduling.
    w.abilities.frost.readyAt=w.abilities.meteor.readyAt=1e6;w.pause();
    return {nova:w.effects.find(e=>e.kind==='frost')!,impact:w.impacts[0]!,hp:w.enemies.map(e=>e.hp),novaCount:w.effects.filter(e=>e.kind==='frost').length,meteorCount:w.impacts.length};
  },burning);
  expect(fixture.novaCount).toBe(1);expect(fixture.meteorCount).toBe(1);
  await page.addStyleTag({content:'.overlay{display:none!important}'});
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().mageAbilities.active.some(v=>v.frame==='meteor-fall-0'))).toBe(true);
  await page.locator('canvas').screenshot({path:`${directory}/nova-start-${size.width}.png`});
  expect(fixture.impact.landAt-fixture.impact.launchAt!).toBeCloseTo(.85/(1.5*1.3*2));
  await advance(page,.075);
  let art=await page.evaluate(()=>window.__PIXEL__!.art());
  const frost=art.mageAbilities.active.find(v=>v.texture==='mage-nova-soft-light')!;
  expect(frost.frame).toBe('__BASE');expect(frost.alpha).toBeCloseTo(.35);expect([frost.x,frost.y]).toEqual([fixture.nova.x,fixture.nova.y]);
  expect(frost.size).toBe(fixture.nova.radius*2);expect(frost.blendMode).toBe(1);expect(frost.tint).toBe(0x68caff);
  expect(art.mageAbilities.active.some(v=>v.frame.startsWith('frost-'))).toBe(false);
  expect(art.mageAbilities.active.some(v=>v.frame.startsWith('meteor-explosion-impact-')||v.frame.startsWith('meteor-ground-impact-'))).toBe(false);
  expect(art.mageAbilities.active.some(v=>v.frame.startsWith('meteor-fall-'))).toBe(true);
  const earlyFall=art.mageAbilities.active.find(v=>v.frame==='meteor-fall-0')!;
  expect(earlyFall.size).toBe(30.9375);expect(earlyFall.rotation).toBe(0);
  const flightDuration=fixture.impact.landAt-fixture.impact.launchAt!;
  const remaining=1-.075/flightDuration;
  expect((fixture.impact.y-earlyFall.y)/(148*Math.cos(46.55*Math.PI/180)*remaining)).toBeCloseTo(1.3);
  expect(await page.evaluate(()=>window.__PIXEL__!.world.enemies.map(e=>e.hp))).toEqual(fixture.hp);
  await page.locator('canvas').screenshot({path:`${directory}/fall-nova-${size.width}.png`});
  const stable=JSON.stringify(art.mageAbilities);await page.waitForTimeout(180);expect(JSON.stringify(await page.evaluate(()=>window.__PIXEL__!.art().mageAbilities))).toBe(stable);
  await advance(page,.075);art=await page.evaluate(()=>window.__PIXEL__!.art());
  expect(art.mageAbilities.active.find(v=>v.texture==='mage-nova-soft-light')).toEqual(frost);
  const laterFall=art.mageAbilities.active.find(v=>v.frame==='meteor-fall-0')!;
  expect(laterFall.x).toBeLessThan(earlyFall.x);expect(laterFall.y).toBeGreaterThan(earlyFall.y);
  expect(Math.atan2(earlyFall.x-laterFall.x,laterFall.y-earlyFall.y)*180/Math.PI).toBeCloseTo(46.55);
  const observedSpeed=Math.hypot(laterFall.x-earlyFall.x,laterFall.y-earlyFall.y)/.075;
  expect(observedSpeed/(192.4/(.85/(1.5*1.3)))).toBeCloseTo(2);
  await page.locator('canvas').screenshot({path:`${directory}/nova-mid-${size.width}.png`});
  await advance(page,.1);art=await page.evaluate(()=>window.__PIXEL__!.art());
  expect(art.mageAbilities.active.some(v=>v.frame==='meteor-ground-impact-0')).toBe(true);
  const ground=art.mageAbilities.active.find(v=>v.frame==='meteor-ground-impact-0')!;
  expect(ground.size).toBe(60.328125);expect(ground.depth).toBeLessThan(0);expect(ground.originY).toBe(86/132);
  expect(art.mageAbilities.active.some(v=>v.frame.startsWith('meteor-fall-'))).toBe(false);
  const explosion=art.mageAbilities.active.find(v=>v.frame==='meteor-explosion-impact-0')!;
  for(const v of [ground,explosion]){expect([v.x,v.y]).toEqual([fixture.impact.x,fixture.impact.y]);expect(v.size).toBe(60.328125);expect(v.originY).toBe(86/132);expect(v.rotation).toBe(0);expect(v.blendMode).toBe(0);expect(v.tint).toBe(0xffffff);}
  expect(explosion.depth).toBeGreaterThan(ground.depth);
  expect(art.mageAbilities.active.some(v=>v.frame.startsWith('meteor-impact-')||v.frame.startsWith('meteor-collision-'))).toBe(false);
  expect(await page.evaluate(()=>window.__PIXEL__!.world.enemies.map(e=>e.hp))).toEqual(fixture.hp.map(hp=>hp-80));
  await page.locator('canvas').screenshot({path:`${directory}/impact-${size.width}.png`});
  await page.waitForTimeout(100);expect(await page.evaluate(()=>window.__PIXEL__!.art().mageAbilities.active.find(v=>v.frame==='meteor-explosion-impact-0'))).toEqual(explosion);
  await advance(page,.175);art=await page.evaluate(()=>window.__PIXEL__!.art());
  expect(art.mageAbilities.active.some(v=>v.frame==='meteor-explosion-impact-2')).toBe(true);
  expect(art.mageAbilities.active.some(v=>v.frame==='meteor-ground-impact-2')).toBe(true);
  await page.locator('canvas').screenshot({path:`${directory}/explosion-burst-${size.width}.png`});
  await advance(page,.05);art=await page.evaluate(()=>window.__PIXEL__!.art());
  expect(art.mageAbilities.active.some(v=>v.frame==='meteor-explosion-impact-3')).toBe(true);
  await page.locator('canvas').screenshot({path:`${directory}/explosion-peak-${size.width}.png`});
  await advance(page,.1);art=await page.evaluate(()=>window.__PIXEL__!.art());
  expect(art.mageAbilities.active.find(v=>v.texture==='mage-nova-soft-light')!.alpha).toBeCloseTo(.35/6);
  await page.locator('canvas').screenshot({path:`${directory}/nova-fade-${size.width}.png`});
  await advance(page,.175);art=await page.evaluate(()=>window.__PIXEL__!.art());
  expect(art.mageAbilities.active.some(v=>v.texture==='mage-nova-soft-light')).toBe(false);
  expect(await page.evaluate(()=>{const w=window.__PIXEL__!.world;return w.enemies.every(e=>(e.freezeUntil??0)>w.elapsed);})).toBe(true);
  expect(art.mageAbilities.active.some(v=>v.frame==='meteor-ground-impact-6'&&v.size===60.328125)).toBe(true);
  expect(art.mageAbilities.active.some(v=>v.frame==='meteor-explosion-impact-6')).toBe(true);
  await page.locator('canvas').screenshot({path:`${directory}/ground-decay-${size.width}.png`});
  await advance(page,.25);art=await page.evaluate(()=>window.__PIXEL__!.art());
  expect(art.mageAbilities.active.some(v=>v.frame==='meteor-explosion-impact-10'&&v.alpha<.7)).toBe(true);
  await page.locator('canvas').screenshot({path:`${directory}/explosion-fade-${size.width}.png`});
  await advance(page,.1);art=await page.evaluate(()=>window.__PIXEL__!.art());
  expect(art.mageAbilities.active.some(v=>v.frame==='meteor-ground-impact-11'&&v.alpha<.7)).toBe(true);
  expect(art.mageAbilities.active.some(v=>v.frame.startsWith('meteor-explosion-impact-'))).toBe(false);
  expect(await page.evaluate(()=>window.__PIXEL__!.world.enemies.map(e=>e.hp))).toEqual(fixture.hp.map(hp=>hp-80));
  const meteor=art.mageAbilities.active.find(v=>v.frame==='meteor-ground-impact-11')!;expect(meteor.blendMode).toBe(0);expect(meteor.tint).toBe(0xffffff);
  await page.locator('canvas').screenshot({path:`${directory}/embers-${size.width}.png`});
  await advance(page,.15);art=await page.evaluate(()=>window.__PIXEL__!.art());expect(art.mageAbilities.active).toEqual([]);
  expect(art.clock).toEqual([0,0,0]);expect(art.tweens).toBe(0);expect(art.mageAbilities.allocated).toBeLessThanOrEqual(3);
  const old=await page.evaluateHandle(()=>window.__PIXEL__!.world);await page.evaluate(()=>window.__PIXEL__!.restartScene());
  await page.waitForFunction(()=>window.__PIXEL__?.world.status==='menu');
  expect(await old.evaluate(w=>[w.effects.length,w.impacts.length,w.zones.length])).toEqual([0,0,0]);
  expect(await page.evaluate(()=>window.__PIXEL__!.art().mageAbilities)).toEqual({active:[],allocated:0,tracked:0,atlasBytes:1672704,glowTextureBytes:65536});
  expect(await page.evaluate(()=>window.__PIXEL__!.art().textures.filter(t=>t==='mage-nova-soft-light').length)).toBe(1);
  expect(await page.evaluate(()=>window.__PIXEL__!.listeners())).toEqual({commands:1,snapshots:1,metrics:1});
  expect(errors).toEqual([]);writeFileSync(`${directory}/evidence-${size.width}.json`,JSON.stringify({fixture,final:art,errors},null,2));
});

for(const size of [{width:1280,height:720},{width:844,height:390}])test(`Meteor V2 landing and stone keep fixed sizes at every rank and Area ${size.width}`,async({page})=>{
  const directory='screenshots/mage-ability-vfx-v1/meteor-v2/fixed-size-comparison';
  mkdirSync(directory,{recursive:true});const evidence:unknown[]=[],errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(size);await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();
  await page.addStyleTag({content:'.overlay{display:none!important}'});
  for(const [rank,area] of [[1,1],[5,1],[5,2]] as const){
    const fixture=await page.evaluate(async({rank,area})=>{
      const w=window.__PIXEL__!.world;w.pause();w.elapsed+=2;w.options.spawnRate=0;w.encounterDirector.nextAt=1e6;
      w.enemies=[];w.impacts=[];w.effects=[];w.zones=[];for(const a of Object.values(w.abilities))a.level=0;
      w.abilities.meteor.level=rank;w.stats.area=area;
      const e=w.spawn('tank',{x:30,y:0})!;e.speed=0;e.hp=e.maxHp=10000;
      const module='/src/game/abilities/meteor.ts', {meteor}=await import(module);w.resume();meteor(w);w.abilities.meteor.readyAt=1e6;
      // Isolate the first genuine hit so the other rank-V meteors do not obscure its footprint.
      w.impacts=w.impacts.slice(0,1);w.pause();return {impact:{...w.impacts[0]!},hp:e.hp};
    },{rank,area});
    await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().mageAbilities.active.some(v=>v.frame==='meteor-fall-0'))).toBe(true);
    const fall=await page.evaluate(()=>window.__PIXEL__!.art().mageAbilities.active.find(v=>v.frame==='meteor-fall-0')!);
    expect(fall.size).toBe(30.9375);expect(fixture.impact.radius).toBe((48+rank*7)*area);
    await advance(page,.25);
    const landed=await page.evaluate(()=>window.__PIXEL__!.art().mageAbilities.active);
    expect(landed.find(v=>v.frame==='meteor-ground-impact-0')!.size).toBe(60.328125);
    expect(landed.find(v=>v.frame==='meteor-explosion-impact-0')!.size).toBe(60.328125);
    expect(landed.every(v=>v.originY===86/132)).toBe(true);
    expect(await page.evaluate(()=>window.__PIXEL__!.world.enemies[0]!.hp)).toBe(fixture.hp-(55+rank*25));
    await advance(page,.175);
    const peak=await page.evaluate(()=>window.__PIXEL__!.art().mageAbilities.active.find(v=>v.frame==='meteor-explosion-impact-2')!);
    expect(peak.size).toBe(60.328125);
    expect([peak.x,peak.y]).toEqual([fixture.impact.x,fixture.impact.y]);
    await page.locator('canvas').screenshot({path:`${directory}/rank-${rank}-area-${area}-${size.width}.png`});
    evidence.push({rank,area,fixture,fall,peak});
  }
  expect(errors).toEqual([]);writeFileSync(`${directory}/evidence-${size.width}.json`,JSON.stringify({evidence,errors},null,2));
});
