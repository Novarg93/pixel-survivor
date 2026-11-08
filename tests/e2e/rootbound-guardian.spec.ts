import {expect,test,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
async function advance(page:Page,seconds:number){
  await page.evaluate(seconds=>{const w=window.__PIXEL__!.world;w.resume();for(let t=0;t<seconds-1e-8;t+=.025)w.step(Math.min(.025,seconds-t));w.pause();},seconds);await page.waitForTimeout(65);
}
for(const burning of [false,true])for(const viewport of [{width:1280,height:720},{width:844,height:390}])test(`Rootbound Guardian idle/cast, Astral homing, freeze, reward and restart ${burning?'burning':'grove'} ${viewport.width}`,async({page})=>{
  const directory=`screenshots/rootbound-guardian-v1/${burning?'burning':'grove'}-${viewport.width}`;mkdirSync(directory,{recursive:true});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||m.type()==='warning'&&/Texture|Frame/.test(m.text()))errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.setViewportSize(viewport);await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();await page.addStyleTag({content:'.overlay{display:none!important}'});
  await page.evaluate(burning=>{const w=window.__PIXEL__!.world;w.elapsed=burning?915:20;w.experience.level=30;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.player.invulnerableUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;w.spawn('guardian',{x:140,y:-40});w.pause();},burning);
  const art=()=>page.evaluate(()=>window.__PIXEL__!.art()),body=()=>page.evaluate(()=>window.__PIXEL__!.art().actors.find(a=>a.texture==='hd-guardian')!);
  const records:{name:string;frame:string;projectiles:number}[]=[];
  const shot=async(name:string)=>{await page.locator('canvas').screenshot({path:`${directory}/${name}.png`});records.push({name,frame:String((await body())?.frame??(await art()).guardian.frame),projectiles:await page.evaluate(()=>window.__PIXEL__!.world.projectiles.length)});};
  await page.waitForTimeout(80);expect(String((await body()).frame)).toMatch(/^guardian-idle-/);expect(await body()).toMatchObject({width:67.2,height:67.2,originX:.5,originY:.5,visible:true,rotation:0});await shot('idle');
  if(viewport.width===844){
    await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{const e=window.__PIXEL__!.world.guardians[0]!;e.x=55;e.y=45;});await page.waitForTimeout(65);await shot('portrait-idle');
    await page.evaluate(()=>{const e=window.__PIXEL__!.world.guardians[0]!;e.x=140;e.y=-40;});await page.setViewportSize(viewport);await page.waitForTimeout(65);
  }
  await advance(page,.451);expect((await body()).frame).toBe('guardian-cast-0');await shot('cast-start');
  await advance(page,.3);expect((await body()).frame).toBe('guardian-cast-3');await shot('cast-gather');
  const beforeHit=(await body()).frame;await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.damageEnemy(w.guardians[0]!,1);});await page.waitForTimeout(65);expect((await body()).frame).toBe(beforeHit);expect((await body()).tint).toBe(0xffe5b3);await shot('cast-hit');
  await advance(page,.25);expect((await body()).frame).toBe('guardian-cast-5');await shot('cast-ready');
  await advance(page,.05);expect((await body()).frame).toBe('guardian-cast-6');
  expect(await page.evaluate(()=>window.__PIXEL__!.world.projectiles[0]!.appearance)).toBe('astral-volley');expect((await art()).actors.some(a=>a.frame==='volley-static'&&a.visible)).toBe(true);await shot('release');
  await advance(page,.08);expect((await art()).actors.some(a=>String(a.frame).startsWith('volley-flight-')&&a.visible)).toBe(true);await shot('flight');
  const frozen=(await body()).frame;await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.guardians[0]!;e.ultimateFreeze={until:w.elapsed+.4,updated:w.elapsed,visualAt:w.elapsed};});await advance(page,.35);expect((await body()).frame).toBe(frozen);await shot('release-frozen');
  await advance(page,.051);expect((await body()).frame).toBe(frozen);await advance(page,.31);expect((await body()).frame).toBe('guardian-cast-9');await shot('release-recover');
  await advance(page,.39);expect((await body()).frame).toBe('guardian-cast-12');await shot('cast-end');await advance(page,.14);expect(String((await body()).frame)).toMatch(/^guardian-idle-/);await shot('idle-return');
  // Exercise an actual second (fast) release without changing its timing/speed.
  await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.guardians[0]!,s=w.guardianSystem.encounters.get(e.id)!;w.clearOwnedEffects(e.id);s.nextOrbAt=w.elapsed+.6;s.until=w.elapsed;});await advance(page,.025);await advance(page,.6);
  expect(await page.evaluate(()=>window.__PIXEL__!.world.projectiles[0]!.homing?.variant)).toBe('fast');expect((await art()).actors.find(a=>a.frame==='volley-static')?.width).toBeCloseTo(48);await shot('fast-release');
  await page.evaluate(()=>{const w=window.__PIXEL__!.world,p=w.projectiles[0]!;p.x=w.player.x;p.y=w.player.y;w.player.invulnerableUntil=0;});await advance(page,.025);
  expect(await page.evaluate(()=>window.__PIXEL__!.world.player.hp)).toBeLessThan(100);expect((await art()).astralRevenant.active.some(a=>a.frame==='volley-impact-5')).toBe(true);await shot('impact');
  const paused=JSON.stringify((await art()).astralRevenant.active);await page.waitForTimeout(100);expect(JSON.stringify((await art()).astralRevenant.active)).toBe(paused);
  // A dead owner removes its homing/impact immediately; the new body fades.
  const reward=await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.resume();w.damageEnemy(w.guardians[0]!,1e9);w.pause();return {artifacts:w.artifacts.snapshot().reduce((n,a)=>n+a.stacks,0),kills:w.snapshot().guardianKills,shots:w.projectiles.length,owned:w.effects.filter(e=>e.ownerId!==undefined).length};});expect(reward).toEqual({artifacts:1,kills:1,shots:0,owned:0});
  await page.waitForTimeout(65);expect((await art()).guardian.activeDeaths).toBe(1);expect((await art()).guardian.frame).toMatch(/^guardian-(idle|cast)-/);await shot('death-fade');await advance(page,.61);expect((await art()).guardian.activeDeaths).toBe(0);
  if(viewport.width===844){await page.setViewportSize({width:390,height:844});await shot('portrait-reward');}
  await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__?.world.status==='menu');expect((await art()).guardian.allocatedDeaths).toBe(0);expect((await art()).clock).toEqual([0,0,0]);await expect(page.locator('canvas')).toHaveCount(1);
  expect(errors).toEqual([]);writeFileSync(`${directory}/evidence.json`,JSON.stringify({records,errors},null,2));
});

for(const viewport of [{width:1280,height:720},{width:844,height:390}])test(`Rootbound ritual supports cast and release the shared projectile ${viewport.width}`,async({page})=>{
  const directory=`screenshots/rootbound-guardian-v1/ritual-${viewport.width}`;mkdirSync(directory,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();await page.addStyleTag({content:'.overlay{display:none!important}'});
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.elapsed=1200;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.experience.level=70;w.player.invulnerableUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;w.finalEncounter.begin(w);w.pause();});await advance(page,2.31);
  expect(await page.evaluate(()=>window.__PIXEL__!.world.finalEncounter.phase)).toBe('phase1');
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.damageEnemy(w.finalEncounter.boss!,1e9);});await advance(page,.81);
  expect(await page.evaluate(()=>window.__PIXEL__!.world.finalEncounter.supports.size)).toBe(3);
  await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.guardians[0]!,s=w.finalEncounter.supports.get(e.id)!;w.player.x=e.x-110;w.player.y=e.y;s.next=s.clock+.65;});await advance(page,.025);
  const body=()=>page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.guardians[0]!;return window.__PIXEL__!.art().actors.find(a=>a.texture==='hd-guardian'&&a.x===Math.round(e.x)&&a.y===Math.round(e.y))!;});
  expect((await body()).frame).toBe('guardian-cast-0');await page.locator('canvas').screenshot({path:`${directory}/cast-start.png`});
  await advance(page,.3);expect((await body()).frame).toBe('guardian-cast-3');const frame=(await body()).frame;await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.guardians[0]!;e.ultimateFreeze={until:w.elapsed+.4,updated:w.elapsed,visualAt:w.elapsed};});await advance(page,.35);expect((await body()).frame).toBe(frame);await page.locator('canvas').screenshot({path:`${directory}/frozen-cast.png`});
  await advance(page,.05);await advance(page,.325);expect((await body()).frame).toBe('guardian-cast-6');
  expect(await page.evaluate(()=>{const w=window.__PIXEL__!.world;return w.projectiles.some(p=>p.ownerId===w.guardians[0]!.id&&p.homing&&p.appearance==='astral-volley');})).toBe(true);await page.locator('canvas').screenshot({path:`${directory}/release.png`});
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.resume();for(const e of [...w.guardians])w.damageEnemy(e,1e9);w.pause();});await page.waitForTimeout(65);
  expect(await page.evaluate(()=>window.__PIXEL__!.world.projectiles.filter(p=>p.homing).length)).toBe(0);expect(await page.evaluate(()=>window.__PIXEL__!.world.finalEncounter.supports.size)).toBe(0);expect((await page.evaluate(()=>window.__PIXEL__!.art())).guardian.activeDeaths).toBe(3);
  await advance(page,.61);expect((await page.evaluate(()=>window.__PIXEL__!.art())).guardian.activeDeaths).toBe(0);expect(errors).toEqual([]);
});
