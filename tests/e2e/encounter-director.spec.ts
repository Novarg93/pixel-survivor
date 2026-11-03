import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const directory='screenshots/encounter-director-2';
for(const width of [1280,390])test(`three independent Guardians, minute notice, wave reward and cleanup at${width}`,async({page})=>{
  test.setTimeout(40000);mkdirSync(directory,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:width===390?844:720});await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();
  const ids=await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;for(const a of Object.values(w.abilities))a.level=0;w.player.invulnerableUntil=1e6;w.experience.level=39;w.elapsed=660;w.encounterDirector.nextAt=660;w.encounterDirector.update(w);w.encounterDirector.nextAt=1e6;
    // Reposition only for the Canvas inspection; safe automatic spawn is covered separately.
    w.guardians.forEach((g,i)=>{g.x=i===1?65:-20;g.y=(i-1)*165;g.discovered=true;w.damageEnemy(g,1);});w.guardianSystem.finalizePlacement(w,w.guardians.map(g=>g.id));return w.guardians.map(g=>g.id);});
  await expect(page.locator('[data-marker="guardian"]')).toHaveCount(3);await expect(page.locator('.run-notice')).toContainText('Endgame Encounter');
  await expect(page.getByLabel('Волны Guardian')).toContainText('1 АРТЕФАКТ ЗА ВОЛНУ');
  expect(await page.evaluate(()=>window.__PIXEL__!.world.bosses.length)).toBe(1);
  await page.waitForFunction(()=>[...window.__PIXEL__!.world.guardianSystem.encounters.values()].filter(s=>s.phase==='orbs').length===3);
  await page.evaluate(()=>window.__PIXEL__!.world.pause());await page.addStyleTag({content:'.overlay{display:none!important}'});await page.waitForTimeout(100);
  await page.screenshot({path:`${directory}/three-orbs-slow-${width}.png`});await page.locator('canvas').screenshot({path:`${directory}/three-orbs-slow-canvas-${width}.png`});
  const frozen=await page.evaluate(()=>JSON.stringify([...window.__PIXEL__!.world.guardianSystem.encounters.values()]));await page.waitForTimeout(120);expect(await page.evaluate(()=>JSON.stringify([...window.__PIXEL__!.world.guardianSystem.encounters.values()]))).toBe(frozen);
  await page.evaluate(()=>window.__PIXEL__!.world.resume());await page.waitForFunction(()=>window.__PIXEL__!.world.projectiles.some(p=>p.homing?.variant==='fast'));
  await page.evaluate(()=>window.__PIXEL__!.world.pause());await page.waitForTimeout(60);await page.screenshot({path:`${directory}/three-orbs-fast-${width}.png`});await page.locator('canvas').screenshot({path:`${directory}/three-orbs-fast-canvas-${width}.png`});
  await page.evaluate(id=>{const w=window.__PIXEL__!.world;w.resume();w.damageEnemy(w.guardians.find(g=>g.id===id)!,1e9);},ids[0]);await expect(page.locator('[data-marker="guardian"]')).toHaveCount(2);
  expect(await page.evaluate(id=>window.__PIXEL__!.world.impacts.some(i=>i.ownerId===id),ids[0])).toBe(false);
  expect(await page.evaluate(id=>window.__PIXEL__!.world.projectiles.some(p=>p.ownerId===id),ids[0])).toBe(false);
  expect(await page.evaluate(()=>window.__PIXEL__!.world.artifacts.snapshot().reduce((n,a)=>n+a.stacks,0))).toBe(0);
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;for(const g of [...w.guardians])w.damageEnemy(g,1e9);});await expect(page.locator('[data-marker="guardian"]')).toHaveCount(0);
  expect(await page.evaluate(()=>{const w=window.__PIXEL__!.world;return{artifacts:w.artifacts.snapshot().reduce((n,a)=>n+a.stacks,0),kills:w.snapshot().guardianKills,waves:w.guardianSystem.completedWaves,states:w.guardianSystem.encounters.size,corpses:window.__PIXEL__!.art().guardian.activeDeaths};})).toMatchObject({artifacts:1,kills:3,waves:1,states:0});
  await page.screenshot({path:`${directory}/wave-reward-${width}.png`});
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().guardian.allocatedDeaths)).toBe(3);
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.guardianSystem.spawnWave(w,3,12);w.player.invulnerableUntil=0;w.damagePlayer(1e9);});
  expect(await page.evaluate(()=>{const w=window.__PIXEL__!.world;return[w.guardians.length,w.guardianSystem.encounters.size,w.guardianSystem.waves.size,w.impacts.length,w.projectiles.length];})).toEqual([0,0,0,0,0]);
  await page.evaluate(()=>{for(const s of document.querySelectorAll('style'))if(s.textContent==='.overlay{display:none!important}')s.remove();});
  for(let i=0;i<5;i++){await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.getByRole('button',{name:'Начать забег'}).click();expect(await page.evaluate(()=>window.__PIXEL__!.listeners())).toEqual({commands:1,snapshots:1,metrics:1});expect(await page.evaluate(()=>window.__PIXEL__!.art().clock)).toEqual([0,0,0]);expect(await page.evaluate(()=>window.__PIXEL__!.world.guardianSystem.completedWaves)).toBe(0);}
  expect(errors).toEqual([]);writeFileSync(`${directory}/three-guardians-${width}.json`,JSON.stringify({ids,errors},null,2));
});
for(const hero of ['Mage','Warrior'])for(const width of [1280,390])test(`150 regulars plus3 bosses plus3 Guardians, all skills, ${hero}/${width}`,async({page})=>{
  test.setTimeout(40000);mkdirSync(directory,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:width===390?844:720});await page.goto('/?test=1');await page.getByRole('button',{name:new RegExp('^'+hero)}).click();await page.getByRole('button',{name:'Начать забег'}).click();
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.elapsed=720;w.experience.level=39;w.player.invulnerableUntil=1e6;w.encounterDirector.nextAt=720;w.encounterDirector.update(w);w.encounterDirector.nextAt=1e6;
    for(const kind of ['charger','sorcerer','eclipse'] as const)if(!w.bosses.some(e=>e.kind===kind))w.spawn(kind);
    // Constant-load fixture: safe-position search may legally skip a random slot.
    for(let i=w.guardians.length;i<3;i++)w.spawn('guardian',{x:-20,y:(i-1)*165});
    for(const a of w.abilityDefinitions)w.abilities[a.id].level=5;for(let i=0;i<3;i++)w.mobility.upgrade(w,w.character==='mage'?'flame-trail':'cleaving-dash');
    for(let i=0;i<150;i++)w.spawn((['grunt','runner','tank','caster','rusher','splitter'] as const)[i%6],{x:(i%15-7)*24,y:(Math.floor(i/15)-4)*24},i%11===0);
    w.guardians.forEach((g,i)=>{g.x=i===1?65:-20;g.y=(i-1)*165;g.discovered=true;w.damageEnemy(g,1);});for(const e of w.enemies)e.hp=e.maxHp=1e6;w.mobility.activate(w,{x:1,y:0});
      w.guardianSystem.finalizePlacement(w,w.guardians.map(g=>g.id));
  });
  const samples=[];
  for(let i=0;i<12;i++){const key=['d','s','a','w'][i%4];await page.keyboard.down(key);await page.waitForTimeout(1000);await page.keyboard.up(key);
    const s=await page.evaluate(()=>{const w=window.__PIXEL__!.world;return{...window.__PIXEL__!.metrics(),impacts:w.impacts.length,zones:w.zones.length,states:w.guardianSystem.encounters.size,clock:window.__PIXEL__!.art().clock};});samples.push(s);expect(s.enemies).toBe(150);expect(s.bosses).toBe(3);expect(s.guardians).toBe(3);expect(s.projectiles).toBeLessThanOrEqual(96);expect(s.effects).toBeLessThanOrEqual(96);expect(s.impacts+s.zones).toBeLessThanOrEqual(24);expect(s.clock).toEqual([0,0,0]);}
  await page.screenshot({path:`${directory}/stress-${hero}-${width}.png`});await page.locator('canvas').screenshot({path:`${directory}/stress-canvas-${hero}-${width}.png`});
  const fps=samples.slice(2).map(s=>s.fps).sort((a,b)=>a-b),ms=samples.slice(2).map(s=>s.updateMs).sort((a,b)=>a-b);
  writeFileSync(`${directory}/stress-${hero}-${width}.json`,JSON.stringify({fixture:'12s real RAF,150highHP regulars+3bosses+3active Guardians+rankV skills; invulnerability only to hold performance load',medianFps:fps[Math.floor(fps.length/2)],p95UpdateMs:ms[Math.floor(ms.length*.95)],samples,errors},null,2));expect(errors).toEqual([]);
});
