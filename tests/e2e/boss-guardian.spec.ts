import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const dir='screenshots/boss-guardian';
for(const width of [1280,390])test(`distinct boss teleport warnings, volleys, slow/fast orbs and owner cleanup ${width}`,async({page})=>{
  test.setTimeout(35000);mkdirSync(dir,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:width===390?844:720});await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.elapsed=900;w.options.spawnRate=0;w.encounterDirector.nextAt=1e6;w.player.invulnerableUntil=1e6;for(const a of Object.values(w.abilities))a.level=0;
    for(let i=0;i<6;i++){w.spawn('charger',{x:190,y:0});w.enemies=[];}
    for(const [i,kind] of (['sorcerer','eclipse'] as const).entries()){const e=w.spawn(kind,{x:i?140:-140,y:i?90:-90})!;e.hp=e.maxHp=1e6;e.boss!.until=Infinity;e.boss!.magic!.nextAt=w.elapsed+.4;}
    for(let i=0;i<3;i++)w.spawn('guardian',{x:i===1?70:-50,y:i===2?130:-130});for(const e of w.guardians){e.hp=e.maxHp=1e6;e.discovered=true;w.damageEnemy(e,1);}
  });
  await expect(page.getByText('Хранитель пробуждён! Уклоняйтесь от магических сфер')).toBeVisible();await page.waitForFunction(()=>window.__PIXEL__!.world.bosses.some(e=>e.boss!.magic?.phase==='signal'));await page.evaluate(()=>window.__PIXEL__!.world.pause());const hide=await page.addStyleTag({content:'.overlay{display:none!important}'});await page.screenshot({path:`${dir}/teleport-signal-${width}.png`});
  const signal=await page.evaluate(()=>window.__PIXEL__!.world.bosses.map(e=>({kind:e.kind,x:e.x,y:e.y,boss:e.boss})));for(const s of signal){expect(s.boss!.enrageIndex).toBeGreaterThanOrEqual(7);expect(s.boss!.magic!.target).toBeDefined();}
  await page.evaluate(()=>window.__PIXEL__!.world.resume());await page.waitForFunction(()=>window.__PIXEL__!.world.bosses.some(e=>e.boss!.magic?.phase==='prepare'));await page.evaluate(()=>window.__PIXEL__!.world.pause());await page.screenshot({path:`${dir}/teleport-arrival-${width}.png`});
  await page.evaluate(()=>window.__PIXEL__!.world.resume());await page.waitForFunction(()=>window.__PIXEL__!.world.projectiles.filter(p=>p.hostile&&!p.homing).length>=6);await page.screenshot({path:`${dir}/boss-volleys-${width}.png`});
  await page.waitForFunction(()=>window.__PIXEL__!.world.projectiles.some(p=>p.homing?.variant==='slow'));await page.screenshot({path:`${dir}/orb-slow-${width}.png`});
  await page.waitForFunction(()=>window.__PIXEL__!.world.projectiles.some(p=>p.homing?.variant==='fast'));await page.screenshot({path:`${dir}/orb-fast-${width}.png`});
  const data=await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.pause();return{projectiles:w.projectiles.map(p=>({...p,homing:p.homing&&{...p.homing}})),guardians:w.guardians.map(g=>g.id),metrics:window.__PIXEL__!.metrics(),art:window.__PIXEL__!.art()};});
  expect(data.projectiles.filter(p=>p.hostile).length).toBeLessThanOrEqual(48);for(const id of data.guardians)expect(data.projectiles.filter(p=>p.ownerId===id&&p.homing).length).toBeLessThanOrEqual(2);
  await page.waitForTimeout(180);expect(await page.evaluate(()=>window.__PIXEL__!.world.projectiles)).toEqual(data.projectiles);
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.resume();for(const e of [...w.bosses,...w.guardians])w.damageEnemy(e,1e9);});expect(await page.evaluate(()=>window.__PIXEL__!.world.projectiles)).toEqual([]);
  await hide.evaluate(el=>el.parentNode?.removeChild(el));for(let i=0;i<5;i++){await page.evaluate(()=>window.__PIXEL__!.restartScene());await expect(page.getByRole('button',{name:'Начать забег'})).toBeVisible();expect(await page.evaluate(()=>window.__PIXEL__!.listeners())).toEqual({commands:1,snapshots:1,metrics:1});expect(await page.evaluate(()=>window.__PIXEL__!.world.encounterDirector.enrageSpawns)).toBe(0);}
  expect(errors).toEqual([]);writeFileSync(`${dir}/visual-lifecycle-${width}.json`,JSON.stringify({signal,data,errors},null,2));
});
for(const width of [1280,390])for(const mode of ['afk','move','blink'] as const)test(`Mage56 allV actual HP12min ${mode} ${width}`,async({page})=>{
  test.setTimeout(65000);mkdirSync(dir,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:width===390?844:720});await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();
  const h=await page.evaluateHandle(async mode=>{const path='/tests/helpers/bossGuardian.ts',{setupBossGuardianLive}=await import(path);const w=window.__PIXEL__!.world;return setupBossGuardianLive(w,mode,w.width,w.height);},mode);
  const samples=[];let captured=false;for(let i=0;i<60;i++){await page.waitForTimeout(1000);const s=await h.evaluate(s=>({...s}));samples.push(s);if(!captured&&s.seconds>=10){await page.screenshot({path:`${dir}/survival-${mode}-${width}.png`});captured=true;}if(s.status==='over'||s.seconds>=45)break;}
  const result=await h.evaluate(s=>({...s}));expect(result.invalidInvulnerability).toBe(false);expect(result.peakRegular).toBeLessThanOrEqual(150);expect(result.peakBosses).toBeLessThanOrEqual(3);expect(result.peakGuardians).toBeLessThanOrEqual(3);expect(result.kills).toBeGreaterThan(30);
  if(mode==='afk')expect(result.blinks).toBe(0);else{expect(result.status).not.toBe('over');expect(result.seconds).toBeGreaterThanOrEqual(45);if(mode==='blink')expect(result.blinks).toBeGreaterThan(0);else expect(result.blinks).toBe(0);}expect(errors).toEqual([]);
  writeFileSync(`${dir}/survival-${mode}-${width}.json`,JSON.stringify({fixture:'Real RAF,legal Mage56/allV+5evolutions/8artifacts,45s from12:00,actual prior successful birth history; no test invulnerability, fixed build',result,samples,errors},null,2));
});
