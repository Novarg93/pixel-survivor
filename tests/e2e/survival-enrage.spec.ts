import { expect,test } from '@playwright/test';
import { mkdirSync,writeFileSync } from 'node:fs';
const directory='screenshots/survival-enrage';
for(const width of [1280,390])test(`Enrage onset, finite Arcane HP layer, pause and clean restarts ${width}`,async({page})=>{
  test.setTimeout(45000);mkdirSync(directory,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:width===390?844:720});await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=600;w.elapsed=599.95;for(const a of Object.values(w.abilities))a.level=0;});
  await expect(page.locator('.enrage-start')).toBeVisible();expect(await page.evaluate(()=>window.__PIXEL__!.world.status)).toBe('playing');
  const at=await page.evaluate(()=>window.__PIXEL__!.world.elapsed);await page.waitForTimeout(250);expect(await page.evaluate(()=>window.__PIXEL__!.world.elapsed)).toBeGreaterThan(at);
  const onset=await page.evaluate(()=>({clock:document.querySelector('.run-clock')!.getBoundingClientRect().bottom,boss:document.querySelector('.boss-bars')!.getBoundingClientRect().top}));expect(onset.clock).toBeLessThanOrEqual(onset.boss);
  await page.screenshot({path:`${directory}/enrage-start-${width}.png`});await page.locator('canvas').screenshot({path:`${directory}/enrage-start-canvas-${width}.png`});
  expect(await page.evaluate(()=>window.__PIXEL__!.world.bosses.length)).toBe(0);
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.player.maxHp=w.player.hp=200;w.abilities.shield.level=3;w.abilities.shield.readyAt=0;});
  await expect(page.getByRole('progressbar',{name:'Absorb',exact:true})).toHaveAttribute('aria-valuenow','50');
  const bar=await page.evaluate(()=>window.__PIXEL__!.art().playerHealth);expect(bar!.absorb).toBe(.25);expect(bar!.hp).toBe(1);
  await page.screenshot({path:`${directory}/arcane-50-${width}.png`});await page.locator('canvas').screenshot({path:`${directory}/arcane-50-canvas-${width}.png`});
  const before=await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.pause();return{elapsed:w.elapsed,pool:{...w.shield},tick:w.snapshot().enrage.tick};});await page.waitForTimeout(250);
  expect(await page.evaluate(()=>{const w=window.__PIXEL__!.world;return{elapsed:w.elapsed,pool:{...w.shield},tick:w.snapshot().enrage.tick};})).toEqual(before);
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.resume();w.mobility.protectedUntil=w.player.invulnerableUntil=0;w.damagePlayer(70);});
  await expect(page.getByRole('progressbar',{name:'Absorb',exact:true})).toHaveCount(0);await expect(page.getByRole('progressbar',{name:'Здоровье',exact:true})).toHaveAttribute('aria-valuenow','180');
  expect(await page.evaluate(()=>window.__PIXEL__!.art().playerHealth!.absorb)).toBe(0);
  await page.screenshot({path:`${directory}/arcane-overflow-${width}.png`});
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.elapsed=900;w.encounterDirector.nextAt=900;w.encounterDirector.update(w);w.encounterDirector.nextAt=1e6;for(const kind of ['charger','sorcerer','eclipse'] as const)if(!w.bosses.some(e=>e.kind===kind))w.spawn(kind);w.player.invulnerableUntil=1e6;});
  await expect(page.locator('.enrage-indicator')).toHaveText('ENRAGE · 10');expect(await page.evaluate(()=>window.__PIXEL__!.world.bosses.length)).toBe(3);
  const boxes=await page.evaluate(()=>{const rect=(s:string)=>{const r=document.querySelector(s)!.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};return{enrage:rect('.run-clock'),bosses:rect('.boss-bars'),skills:rect('.skill-dock')};});
  expect(boxes.enrage.y+boxes.enrage.height).toBeLessThanOrEqual(boxes.bosses.y);expect(boxes.enrage.y+boxes.enrage.height).toBeLessThan(boxes.skills.y);
  await page.screenshot({path:`${directory}/enrage-15min-${width}.png`});
  const cycles=[];for(let i=0;i<10;i++){await page.evaluate(()=>window.__PIXEL__!.restartScene());await expect(page.getByRole('button',{name:'Начать забег'})).toBeVisible();await page.waitForTimeout(70);cycles.push(await page.evaluate(()=>{const a=window.__PIXEL__!.art();return{objects:a.objects,textures:a.textures,bytes:a.textureBytes,clock:a.clock,tweens:a.tweens,bridge:window.__PIXEL__!.listeners(),enrage:window.__PIXEL__!.world.snapshot().enrage,absorb:window.__PIXEL__!.world.absorb};}));}
  for(const row of cycles){expect(row).toEqual(cycles[0]);expect(row.enrage.active).toBe(false);expect(row.absorb).toBe(0);expect(row.clock).toEqual([0,0,0]);}
  expect(errors).toEqual([]);writeFileSync(`${directory}/ui-pause-restarts-${width}.json`,JSON.stringify({bar,before,boxes,cycles,errors},null,2));
});
for(const width of [1280,390])for(const mode of ['afk','move','blink'] as const)test(`real HP Mage40 Enrage ${mode} ${width}`,async({page})=>{
  const duration=mode==='afk'?90:45;
  test.setTimeout(duration*1000+25000);mkdirSync(directory,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:width===390?844:720});await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();
  const handle=await page.evaluateHandle(async({mode,duration})=>{const path='/tests/helpers/survivalEnrage.ts',{setupLiveSurvival}=await import(path);const w=window.__PIXEL__!.world;return setupLiveSurvival(w,mode,w.width,w.height,duration);},{mode,duration});
  const samples=[];let captured=false;
  for(let i=0;i<duration+15;i++){await page.waitForTimeout(1000);const sample=await handle.evaluate(s=>({...s}));samples.push({...sample,metrics:await page.evaluate(()=>window.__PIXEL__!.metrics())});
    if(!captured&&sample.seconds>10){await page.screenshot({path:`${directory}/survival-${mode}-${width}.png`});await page.locator('canvas').screenshot({path:`${directory}/survival-canvas-${mode}-${width}.png`});captured=true;}
    if(sample.status==='over'||sample.seconds>=duration)break;
  }
  const result=await handle.evaluate(s=>({...s}));expect(result.invalidInvulnerability).toBe(false);expect(result.peakRegular).toBeLessThanOrEqual(150);expect(result.peakBosses).toBeLessThanOrEqual(3);expect(result.peakGuardians).toBeLessThanOrEqual(3);expect(result.kills).toBeGreaterThan(20);
  if(mode==='afk'){expect(result.damageTaken).toBeGreaterThan(0);expect(result.blinks).toBe(0);expect(result.status).toBe('over');}else{expect(result.status).not.toBe('over');expect(result.seconds).toBeGreaterThanOrEqual(duration);if(mode==='move')expect(result.blinks).toBe(0);else expect(result.blinks).toBeGreaterThan(0);}
  expect(errors).toEqual([]);writeFileSync(`${directory}/survival-${mode}-${width}.json`,JSON.stringify({fixture:`Actual Phaser RAF, seed12345, same fixed Mage40 build as deterministic comparisons,${duration}s maximum, no test invulnerability; future encounters follow real director`,result,samples,errors},null,2));
});
