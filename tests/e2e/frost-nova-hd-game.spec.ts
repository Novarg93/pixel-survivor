import {expect,test} from '@playwright/test';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';

const pack=JSON.parse(readFileSync('src/game/art/mageShieldNovaManifestPixellab.json','utf8')) as {canvas:number;clips:{'frost-nova':{source:string;frameCount:number}}};
for(const viewport of [{width:1280,height:720},{width:390,height:844}])test(`approved HD Nova in the actual boss-practice build ${viewport.width}`,async({page})=>{
  const dir=`screenshots/frost-nova-hd-game/${viewport.width}`;mkdirSync(dir,{recursive:true});const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.setViewportSize(viewport);await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));
  await page.goto('/?test=1');await page.getByRole('button',{name:/Бой со Стражем/}).click();
  await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.phase==='phase1');
  const fixture=await page.evaluate(async()=>{
    const w=window.__PIXEL__!.world;w.pause();w.player.invulnerableUntil=Infinity;w.effects=[];w.impacts=[];w.projectiles=[];
    for(const a of Object.values(w.abilities))a.readyAt=Infinity;
    const path='/src/game/abilities/frostNova.ts',{frostNova}=await import(path),boss=w.finalEncounter.boss!;
    // On portrait the initial boss is outside the legal ground-target viewport; approach it.
    w.player.x=boss.x-45;w.player.y=boss.y+70;
    const hp=boss.hp;w.resume();const fired=frostNova(w);w.pause();
    return {fired,rank:w.abilities.frost.level,area:w.stats.area,level:w.experience.level,nova:{...w.effects.find(e=>e.kind==='frost')!},bossHpBefore:hp,bossHpAfter:boss.hp};
  });
  expect(fixture.fired).toBe(true);expect(fixture.rank).toBe(4);expect(fixture.level).toBe(54);expect(fixture.area).toBeCloseTo(1.45);
  expect(fixture.nova.radius).toBeCloseTo(127.02);expect(fixture.bossHpAfter).toBeLessThan(fixture.bossHpBefore);
  expect(pack.clips['frost-nova']).toMatchObject({source:'frost-nova-burst-compact',frameCount:17});
  await page.addStyleTag({content:'.overlay{display:none!important}'});const frames=[];
  for(const i of [3,5,8,12,16]){
    await page.evaluate(({started,i})=>{window.__PIXEL__!.world.elapsed=started+i*.07+.001;},{started:fixture.nova.started,i});
    await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().mageAbilities.active.find(v=>v.frame.startsWith('mage-frost-nova-'))?.frame)).toBe(`mage-frost-nova-${i}`);
    const art=await page.evaluate(()=>window.__PIXEL__!.art()),v=art.mageAbilities.active.find(v=>v.frame.startsWith('mage-frost-nova-'))!;frames.push(v);
    expect(v.size*96/128).toBeCloseTo(254.04);expect(v.alpha).toBe(.7);expect(v.tint).toBe(0xffffff);expect(v.blendMode).toBe(0);expect([v.x,v.y]).toEqual([fixture.nova.x,fixture.nova.y]);
    expect(art.textureBytes).toBeLessThan(144*1024*1024);expect(art.clock).toEqual([0,0,0]);expect(art.tweens).toBe(0);
    if(i!==16)await page.locator('canvas').screenshot({path:`${dir}/nova-${i}.png`});
  }
  const paused=await page.evaluate(()=>window.__PIXEL__!.art().mageAbilities);await page.waitForTimeout(100);
  expect(await page.evaluate(()=>window.__PIXEL__!.art().mageAbilities)).toEqual(paused);
  await page.evaluate(started=>{window.__PIXEL__!.world.elapsed=started+1.2;},fixture.nova.started);
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().mageAbilities.active.some(v=>v.frame.startsWith('mage-frost-nova-')))).toBe(false);
  expect(errors).toEqual([]);writeFileSync(`${dir}/evidence.json`,JSON.stringify({fixture,frames,atlas:pack.clips['frost-nova'],errors},null,2));
});
