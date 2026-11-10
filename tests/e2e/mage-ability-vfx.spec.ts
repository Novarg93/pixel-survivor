import {expect,test,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const pack=JSON.parse(readFileSync('src/game/art/mageAbilityRuntimeManifest.json','utf8')) as {rgbaBytes:number};
const shieldNovaPack=JSON.parse(readFileSync('src/game/art/mageShieldNovaManifestPixellab.json','utf8')) as {rgbaBytes:number};
const meteorPack=JSON.parse(readFileSync('src/game/art/mageMeteorManifestPixellab.json','utf8')) as {rgbaBytes:number};
async function advance(page:Page,seconds:number){
 await page.evaluate(seconds=>{const w=window.__PIXEL__!.world;w.resume();for(let t=0;t<seconds-1e-8;t+=.01)w.step(Math.min(.01,seconds-t));w.pause();},seconds);await page.waitForTimeout(70);
}
for(const burning of [false,true])for(const size of [{width:1280,height:720},{width:390,height:844}])test(`Nova and Mage Meteor V3: illumination, angle, real hit, pause and restart ${burning?'burning':'grove'} ${size.width}`,async({page})=>{
 const directory=`screenshots/mage-meteor-pixellab-v1/${burning?'burning':'grove'}-${size.width}`;mkdirSync(directory,{recursive:true});const errors:string[]=[],requests:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 page.on('request',r=>{if(r.url().includes('/mage-meteor-pixellab-v1/'))requests.push(new URL(r.url()).pathname);});
 await page.setViewportSize(size);await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();
 const fixture=await page.evaluate(async burning=>{
  const w=window.__PIXEL__!.world;w.pause();w.elapsed=burning?915:20;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.enemies=[];w.clearTemporaryState();w.experience.level=30;w.player.invulnerableUntil=Infinity;
  for(const a of Object.values(w.abilities))a.level=0;
  const x=w.width<300?35:100,y=w.width<300?60:15;
  for(let i=0;i<3;i++){const e=w.spawn('tank',{x:x+i*2,y:y+i*2})!;e.speed=0;e.hp=e.maxHp=10000;}
  w.abilities.frost.level=w.abilities.meteor.level=1;
  const frostModule='/src/game/abilities/frostNova.ts',meteorModule='/src/game/abilities/meteor.ts';const {frostNova}=await import(frostModule),{meteor}=await import(meteorModule);
  w.resume();frostNova(w);meteor(w);w.abilities.frost.readyAt=w.abilities.meteor.readyAt=Infinity;w.pause();
  return {nova:{...w.effects.find(e=>e.kind==='frost')!},impact:{...w.impacts[0]!},hp:w.enemies.map(e=>e.hp)};
 },burning);
 await page.addStyleTag({content:'.overlay{display:none!important}'});
 const art=()=>page.evaluate(()=>window.__PIXEL__!.art()),capture=async(name:string)=>{await page.locator('canvas').screenshot({path:`${directory}/${name}.png`});return art();};
 await expect.poll(async()=>(await art()).mageAbilities.active.filter(v=>v.frame.startsWith('mage-meteor-flight-')).length).toBe(1);
 expect(fixture.impact.landAt-fixture.impact.launchAt!).toBeCloseTo(.85/(1.5*1.3*2));
 await advance(page,.075);let a=await capture('flight-light');
 const frost=a.mageAbilities.active.find(v=>v.frame.startsWith('mage-frost-nova-'))!,early=a.mageAbilities.active.find(v=>v.frame.startsWith('mage-meteor-flight-'))!,glow=a.mageAbilities.active.find(v=>v.frame.startsWith('mage-meteor-illumination-'))!;
 expect(frost.frame).toBe('mage-frost-nova-1');expect(frost.size).toBe(fixture.nova.radius*128/48);expect(frost.blendMode).toBe(0);expect(frost.tint).toBe(0xffffff);
 expect(early.size).toBe(128);expect(early.rotation).toBe(0);expect(early.originY).toBe(68/128);
 expect([glow.x,glow.y]).toEqual([fixture.impact.x,fixture.impact.y]);expect(glow.size).toBeCloseTo(fixture.impact.radius*2*128/120);expect(glow.depth).toBeLessThan(0);expect(glow.blendMode).toBe(3);
 expect(await page.evaluate(()=>window.__PIXEL__!.world.enemies.map(e=>e.hp))).toEqual(fixture.hp);
 const stable=JSON.stringify(a.mageAbilities);await page.waitForTimeout(120);expect(JSON.stringify((await art()).mageAbilities)).toBe(stable);
 await advance(page,.075);a=await capture('approach');const late=a.mageAbilities.active.find(v=>v.frame.startsWith('mage-meteor-flight-'))!;
 expect(Math.atan2(early.x-late.x,late.y-early.y)*180/Math.PI).toBeCloseTo(Math.atan2(32,28)*180/Math.PI);
 expect(a.mageAbilities.active.find(v=>v.frame.startsWith('mage-frost-nova-'))!.frame).toBe('mage-frost-nova-2');
 expect(a.mageAbilities.active.some(v=>v.frame.startsWith('mage-meteor-impact-'))).toBe(false);
 await advance(page,.1);a=await capture('landing');
 expect(a.mageAbilities.active.some(v=>v.frame.startsWith('mage-meteor-flight-'))).toBe(false);
 for(const name of ['mage-meteor-impact-0','mage-meteor-ground-0']){
  const v=a.mageAbilities.active.find(v=>v.frame===name)!;expect([v.x,v.y]).toEqual([fixture.impact.x,fixture.impact.y]);expect(v.size).toBe(128);expect(v.originY).toBe(68/128);expect(v.rotation).toBe(0);expect(v.tint).toBe(0xffffff);expect(v.blendMode).toBe(0);
  for(const e of a.actors.filter(v=>String(v.frame).startsWith('tank-')))expect(v.depth).toBeLessThan(e.depth);
 }
 expect(await page.evaluate(()=>window.__PIXEL__!.world.enemies.map(e=>e.hp))).toEqual(fixture.hp.map(hp=>hp-80));
 await advance(page,.1);await capture('small-impact');await advance(page,.64);a=await capture('dry-residue');
 expect(a.mageAbilities.active.some(v=>v.frame.startsWith('mage-meteor-illumination-')||v.frame.startsWith('mage-meteor-impact-'))).toBe(false);
 expect(a.mageAbilities.active.some(v=>v.frame.startsWith('mage-meteor-ground-'))).toBe(true);
 await advance(page,.9);a=await capture('cleared');expect(a.mageAbilities.active).toEqual([]);expect(a.clock).toEqual([0,0,0]);expect(a.tweens).toBe(0);expect(a.mageAbilities.allocated).toBeLessThanOrEqual(4);
 const old=await page.evaluateHandle(()=>window.__PIXEL__!.world);await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__?.world.status==='menu');
 expect(await old.evaluate(w=>[w.effects.length,w.impacts.length,w.zones.length])).toEqual([0,0,0]);
 expect((await art()).mageAbilities).toEqual({active:[],allocated:0,tracked:0,atlasBytes:pack.rgbaBytes+meteorPack.rgbaBytes+shieldNovaPack.rgbaBytes});
 expect(await page.evaluate(()=>window.__PIXEL__!.listeners())).toEqual({commands:1,snapshots:1,metrics:1});expect(errors).toEqual([]);
 expect(requests.sort()).toEqual(['/assets/hd/mage-meteor-pixellab-v1/atlas.json','/assets/hd/mage-meteor-pixellab-v1/atlas.png']);
 writeFileSync(`${directory}/evidence.json`,JSON.stringify({fixture,early,late,glow,requests,errors},null,2));
});
for(const size of [{width:1280,height:720},{width:390,height:844}])test(`Mage Meteor V3 fixed body/impact and true Area lighting ${size.width}`,async({page})=>{
 const directory=`screenshots/mage-meteor-pixellab-v1/ranks-${size.width}`;mkdirSync(directory,{recursive:true});const evidence:unknown[]=[],errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize(size);await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();await page.addStyleTag({content:'.overlay{display:none!important}'});
 for(const [rank,area]of [[1,1],[5,1],[5,2]] as const){
  const fixture=await page.evaluate(async({rank,area})=>{
   const w=window.__PIXEL__!.world;w.pause();w.elapsed+=2;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.experience.level=30;w.clearTemporaryState();w.enemies=[];for(const a of Object.values(w.abilities))a.level=0;
   w.abilities.meteor.level=rank;w.stats.area=area;const e=w.spawn('tank',{x:30,y:30})!;e.speed=0;e.hp=e.maxHp=10000;
   const module='/src/game/abilities/meteor.ts',{meteor}=await import(module);w.resume();meteor(w);w.abilities.meteor.readyAt=Infinity;w.impacts=w.impacts.slice(0,1);w.pause();return {impact:{...w.impacts[0]!},hp:e.hp};
  },{rank,area});
  await advance(page,.15);let active=await page.evaluate(()=>window.__PIXEL__!.art().mageAbilities.active);
  expect(active.find(v=>v.frame.startsWith('mage-meteor-flight-'))!.size).toBe(128);const light=active.find(v=>v.frame.startsWith('mage-meteor-illumination-'))!;
  expect(fixture.impact.radius).toBe((48+rank*7)*area);expect(light.size).toBeCloseTo(fixture.impact.radius*2*128/120);
  await page.locator('canvas').screenshot({path:`${directory}/light-rank${rank}-area${area}.png`});
  await advance(page,.1);active=await page.evaluate(()=>window.__PIXEL__!.art().mageAbilities.active);
  const impact=active.find(v=>v.frame==='mage-meteor-impact-0')!;expect(impact.size).toBe(128);expect(impact.originY).toBe(68/128);expect(await page.evaluate(()=>window.__PIXEL__!.world.enemies[0]!.hp)).toBe(fixture.hp-(55+rank*25));
  await page.locator('canvas').screenshot({path:`${directory}/impact-rank${rank}-area${area}.png`});evidence.push({rank,area,fixture,light,impact});
 }
 expect(errors).toEqual([]);writeFileSync(`${directory}/evidence.json`,JSON.stringify({evidence,errors},null,2));
});
