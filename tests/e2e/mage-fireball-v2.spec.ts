import {expect,test} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const directory='screenshots/mage-fireball-pixellab-v1';
for(const width of [1280,390])test(`compact fireball reads in eight directions and dense encounters ${width}`,async({page})=>{
  mkdirSync(directory,{recursive:true});const errors:string[]=[],requests:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  page.on('request',r=>{if(r.url().includes('/assets/hd/mage-fireball-'))requests.push(new URL(r.url()).pathname);});
  await page.setViewportSize({width,height:width===390?844:720});await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();await page.addStyleTag({content:'.overlay{display:none!important}'});
  const evidence:unknown[]=[];
  for(const burning of [false,true]){
    await page.evaluate(burning=>{
      const w=window.__PIXEL__!.world;w.pause();w.clearTemporaryState();w.enemies=[];w.elapsed=burning?915:20;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.experience.level=30;w.player.x=w.player.y=0;w.player.invulnerableUntil=Infinity;
      for(const a of Object.values(w.abilities))a.level=0;
      if(burning)for(let i=0;i<150;i++){const angle=i*2.399963;const e=w.spawn((['grunt','runner','tank','caster','rusher','splitter'] as const)[i%6],{x:Math.cos(angle)*(45+i%10*9),y:Math.sin(angle)*(40+i%10*6)},i%9===0)!;e.speed=0;e.hp=e.maxHp=1e6;}
      for(let i=0;i<8;i++){const angle=i*Math.PI/4;w.shoot({x:Math.cos(angle)*44,y:Math.sin(angle)*44,vx:Math.cos(angle)*270,vy:Math.sin(angle)*270,damage:1,hostile:false,source:'fireball'});}
      for(const p of w.projectiles)p.started=w.elapsed-.31;
    },burning);
    await page.waitForTimeout(100);
    const art=await page.evaluate(()=>window.__PIXEL__!.art()),shots=art.actors.filter(a=>a.texture==='mage-fireball-pixellab-v1'&&a.visible);
    expect(shots).toHaveLength(8);expect(new Set(shots.map(s=>Math.round(s.rotation*100))).size).toBe(8);expect(shots.every(s=>s.frame==='fireball-idle-1'&&s.width===64&&s.height===64)).toBe(true);
    expect(art.clock).toEqual([0,0,0]);expect(art.tweens).toBe(0);
    await page.locator('canvas').screenshot({path:`${directory}/${burning?'burning-crowd':'grove-directions'}-${width}.png`});
    const before=JSON.stringify(shots);await page.waitForTimeout(100);expect(JSON.stringify((await page.evaluate(()=>window.__PIXEL__!.art())).actors.filter(a=>a.texture==='mage-fireball-pixellab-v1'&&a.visible))).toBe(before);
    evidence.push({burning,shots,clock:art.clock,fireball:art.fireball,enemies:await page.evaluate(()=>window.__PIXEL__!.world.enemies.length)});
  }
  for(let i=0;i<3;i++){await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__?.world.status==='menu');expect((await page.evaluate(()=>window.__PIXEL__!.art())).fireball.allocated).toBe(0);expect(await page.evaluate(()=>window.__PIXEL__!.listeners())).toEqual({commands:1,snapshots:1,metrics:1});}
  expect(requests.sort()).toEqual(['/assets/hd/mage-fireball-pixellab-v1/atlas.json','/assets/hd/mage-fireball-pixellab-v1/atlas.png']);expect(errors).toEqual([]);await expect(page.locator('canvas')).toHaveCount(1);
  writeFileSync(`${directory}/directions-${width}.json`,JSON.stringify({evidence,requests,errors},null,2));
});

test('Fireball V2 comparison viewer works over HTTP and offline file URL',async({page})=>{
  mkdirSync(directory,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  for(const url of ['/art/generated/mage-fireball-v2/viewer.html',pathToFileURL(resolve('art/generated/mage-fireball-v2/viewer.html')).href]){
    await page.setViewportSize({width:1280,height:720});await page.goto(url);
    await expect(page.locator('canvas')).toHaveAttribute('data-ready','true');
    await expect(page.getByRole('heading')).toContainText('Fireball V2');await page.getByRole('button',{name:'Пауза',exact:true}).click();
    await expect(page.getByRole('button',{name:'Продолжить',exact:true})).toBeVisible();
    // Browser screenshots also work with offline, origin-tainted file:// images.
    const before=await page.locator('canvas').screenshot();await page.waitForTimeout(120);expect(await page.locator('canvas').screenshot()).toEqual(before);
    await page.getByRole('button',{name:'Следующий кадр'}).click();expect(await page.locator('canvas').screenshot()).not.toEqual(before);
    await page.screenshot({path:`${directory}/comparison-${url.startsWith('file:')?'offline':'http'}.png`});
    await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
    await page.getByLabel('Фон').selectOption('#342421');await page.screenshot({path:`${directory}/comparison-mobile-${url.startsWith('file:')?'offline':'http'}.png`});
  }
  expect(errors).toEqual([]);
});
