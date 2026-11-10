import {expect,test} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';

for(const viewport of [{width:1280,height:720},{width:844,height:390},{width:390,height:844}])test(`authored Frost clips: every frame, pause, ground layers and restart ${viewport.width}`,async({page})=>{
  const dir=`screenshots/frost-nova-art/${viewport.width}`;mkdirSync(dir,{recursive:true});
  const errors:string[]=[],loads:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  page.on('request',r=>{if(r.url().includes('/assets/hd/mage-frost-ultimate-runtime-v1/'))loads.push(r.url());});
  await page.setViewportSize(viewport);await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));
  await page.goto('/?test=1');await page.getByRole('button',{name:/^Начать забег/}).click();
  await page.addStyleTag({content:'.overlay{display:none!important}'});
  const ordinary=await page.evaluate(async()=>{
    const w=window.__PIXEL__!.world;w.pause();w.clearTemporaryState();w.enemies=[];w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;
    w.elapsed=900;w.player.y=-6000;w.player.invulnerableUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;
    const e=w.spawn('tank',{x:45,y:-6015})!;e.speed=0;e.hp=e.maxHp=10000;w.abilities.frost.level=1;
    const path='/src/game/abilities/frostNova.ts',{frostNova}=await import(path);w.resume();frostNova(w);w.abilities.frost.readyAt=Infinity;w.pause();
    return {effect:{...w.effects.find(e=>e.kind==='frost')!},hp:e.hp};
  });
  expect(ordinary.hp).toBeLessThan(10000);const normalFrames=[];
  for(let i=0;i<17;i++){
    await page.evaluate(({started,i})=>{window.__PIXEL__!.world.elapsed=started+i*.07+.001;},{started:ordinary.effect.started,i});
    await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().mageAbilities.active[0]?.frame)).toBe(`mage-frost-nova-${i}`);
    const art=await page.evaluate(()=>window.__PIXEL__!.art()),v=art.mageAbilities.active[0]!;normalFrames.push(v);
    expect(v).toMatchObject({texture:'mage-shield-nova-pixellab-v1',frame:`mage-frost-nova-${i}`,x:ordinary.effect.x,y:ordinary.effect.y,alpha:.7,blendMode:0,tint:0xffffff,originY:.5});
    expect(v.size).toBe(ordinary.effect.radius*128/48);expect(v.depth).toBeLessThan(art.actors.find(a=>String(a.frame).startsWith('tank-'))!.depth);
    if([3,5,8,12].includes(i))await page.locator('canvas').screenshot({path:`${dir}/normal-${i}.png`});
  }
  const paused=await page.evaluate(()=>window.__PIXEL__!.art().mageAbilities);await page.waitForTimeout(130);
  expect(await page.evaluate(()=>window.__PIXEL__!.art().mageAbilities)).toEqual(paused);
  await page.evaluate(started=>{window.__PIXEL__!.world.elapsed=started+1.2;},ordinary.effect.started);
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().mageAbilities.active.length)).toBe(0);
  const ultimate=await page.evaluate(()=>{
    const w=window.__PIXEL__!.world;w.effects=[];w.abilities.frost.level=0;w.experience.level=40;w.resume();w.ultimate.choose(w,'frost');w.ultimate.activate(w);w.pause();
    const f=w.ultimate.frost;return {started:f.started,radius:f.radius,origin:{...f.origin},hp:w.enemies[0]!.hp};
  });
  const ultimateFrames=[];
  for(let i=0;i<48;i++){
    await page.evaluate(({started,i})=>{const w=window.__PIXEL__!.world;w.elapsed=started+i*.05+.001;w.resume();w.ultimate.update(w);w.pause();},{started:ultimate.started,i});
    await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().ultimate.frost.nova?.frame)).toBe(`frost-nova-ultimate-${i}`);
    const art=await page.evaluate(()=>window.__PIXEL__!.art()),v=art.ultimate.frost.nova!;ultimateFrames.push(v);
    expect(v).toMatchObject({x:ultimate.origin.x,y:ultimate.origin.y,alpha:.7});expect(v.size).toBe(ultimate.radius*2*150/146);
    expect(v.depth).toBeLessThan(art.actors.find(a=>String(a.frame).startsWith('tank-'))!.depth);
    if([8,18,24,32,42].includes(i))await page.locator('canvas').screenshot({path:`${dir}/ultimate-${i}.png`});
  }
  const frozen=await page.evaluate(()=>({elapsed:window.__PIXEL__!.world.elapsed,art:window.__PIXEL__!.art().ultimate.frost}));
  await page.waitForTimeout(130);expect(await page.evaluate(()=>({elapsed:window.__PIXEL__!.world.elapsed,art:window.__PIXEL__!.art().ultimate.frost}))).toEqual(frozen);
  expect(await page.evaluate(()=>window.__PIXEL__!.world.enemies[0]!.hp)).toBe(ultimate.hp-180);
  await page.evaluate(started=>{window.__PIXEL__!.world.elapsed=started+2.4;},ultimate.started);
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().ultimate.frost.nova)).toBeNull();
  expect(await page.evaluate(()=>window.__PIXEL__!.art().ultimate.frost.phase)).toBe('field');
  const restarts=[];
  for(let i=0;i<3;i++){
    await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__!.world.status==='menu');
    const art=await page.evaluate(()=>{const a=window.__PIXEL__!.art();return {frost:a.ultimate.frost,mage:a.mageAbilities,clock:a.clock,tweens:a.tweens,textures:a.textures.filter(t=>t.includes('frost')||t.includes('nova')||t==='hd-mage-abilities'),listeners:window.__PIXEL__!.listeners()};});restarts.push(art);
    expect(art.frost).toMatchObject({phase:'idle',nova:null,frozen:0});expect(art.mage).toMatchObject({active:[],allocated:0,tracked:0});expect(art.clock).toEqual([0,0,0]);expect(art.tweens).toBe(0);
  }
  expect(restarts[1]).toEqual(restarts[0]);expect(restarts[2]).toEqual(restarts[0]);expect(restarts[0]!.textures.sort()).toEqual(['hd-mage-abilities','mage-shield-nova-pixellab-v1']);
  expect(loads).toHaveLength(2);expect(errors).toEqual([]);
  writeFileSync(`${dir}/evidence.json`,JSON.stringify({viewport,ordinary,ultimate,normalFrames,ultimateFrames,restarts,loads,errors},null,2));
});
