import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';

const images='screenshots/grove-evolution',report='docs/grove-evolution';
async function start(page: Page) {
  await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));
  await page.goto('/?test=1');await expect(page.getByRole('button',{name:'Dark Forest',exact:true})).toHaveCount(0);
  await expect(page.getByLabel('Локация').getByRole('button')).toHaveCount(1);
  await page.locator('.play-button').click();
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=1e9;for(const a of Object.values(w.abilities))a.level=0;w.pause();});
  await page.addStyleTag({content:'.overlay{display:none!important}'});
  mkdirSync(images,{recursive:true});mkdirSync(report,{recursive:true});
}
async function visualTime(page: Page,time: number) {
  await page.evaluate(time=>window.__PIXEL__!.setVisualTime(time),time);
  await page.waitForFunction(time=>{
    const a=window.__PIXEL__!.atmosphere(),e=a.environment;
    return e.style.tint===a.style.tint && (time===302.5?e.blend===.5:time>=905?e.phase==='burning':time>=605?e.phase==='dying':time>=305?e.phase==='dusk':e.phase==='normal');
  },time);
  await page.waitForTimeout(100);
}
for(const [width,height]of [[1280,720],[844,390]])test(`Grove same camera physical evolution and immutable World ${width}`,async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,viewport:{width,height},hasTouch:width===844}),page=await context.newPage(),errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await start(page);
  await page.evaluate(()=>{
    const w=window.__PIXEL__!.world;
    w.spawn('grunt',{x:60,y:20},true);w.spawn('caster',{x:-60,y:45});w.spawn('charger',{x:110,y:-45});w.spawn('guardian',{x:-110,y:-45});
    w.loot.spawnChest(w,{x:-72,y:-8},'boss');w.loot.drop(w,'fury',{x:72,y:-8});w.dropXp({x:-40,y:62},5);
    w.shoot({x:-25,y:35,vx:20,vy:0,damage:1,hostile:true});
  });
  const before=await page.evaluate(()=>JSON.stringify(window.__PIXEL__!.world)),rows=[];
  let positions:unknown;
  for(const [time,name]of [[240,'normal'],[315,'dusk'],[615,'dying'],[915,'burning']] as const){
    await visualTime(page,time);const a=await page.evaluate(()=>window.__PIXEL__!.atmosphere());
    expect(a.phase).toBe(name);expect(a.environment.surfaces).toBeLessThanOrEqual(a.environment.chunks*2);
    const current=a.terrain.map(t=>({key:t.key,x:t.x,y:t.y}));if(!positions)positions=current;else expect(current).toEqual(positions);
    expect(await page.evaluate(()=>JSON.stringify(window.__PIXEL__!.world))).toBe(before);
    await page.evaluate(time=>{ window.__PIXEL__!.world.elapsed=time; },time); await page.waitForTimeout(120);
    await page.screenshot({path:`${images}/${name}-${width}.png`});
    await page.evaluate(elapsed=>{ window.__PIXEL__!.world.elapsed=elapsed; },JSON.parse(before).elapsed); rows.push(a);
  }
  // Same geometry in negative and positive chunks; target alpha immediately matches on travel.
  await visualTime(page,302.5);
  for(const x of [50000,-50000,0]){
    await page.evaluate(x=>{const w=window.__PIXEL__!.world;w.player.x=x;w.player.y=-x;},x);await page.waitForTimeout(150);
    expect(await page.evaluate(()=>window.__PIXEL__!.atmosphere().terrain.every(t=>t.phase==='normal'&&t.target==='dusk'&&t.blend===.5))).toBe(true);
  }
  const builds=await page.evaluate(()=>window.__PIXEL__!.atmosphere().environment.builds);await page.waitForTimeout(200);
  expect(await page.evaluate(()=>window.__PIXEL__!.atmosphere().environment.builds)).toBe(builds);
  await page.screenshot({path:`${images}/transition-midpoint-${width}.png`});
  // Real run clock, including pause, is the default after removing the presentation-only override.
  await page.evaluate(()=>{const p=window.__PIXEL__!;p.setVisualTime();p.world.elapsed=302.5;});await page.waitForTimeout(120);
  const paused=await page.evaluate(()=>window.__PIXEL__!.atmosphere());await page.waitForTimeout(200);
  expect(await page.evaluate(()=>window.__PIXEL__!.atmosphere().blend)).toBe(paused.blend);
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.player.invulnerableUntil=1e9;w.resume();});await page.waitForTimeout(250);
  expect(await page.evaluate(()=>window.__PIXEL__!.atmosphere().blend)).toBeGreaterThan(paused.blend);
  await page.evaluate(()=>window.__PIXEL__!.world.pause());
  await page.setViewportSize({width:width===1280?844:1280,height:width===1280?390:720});await page.evaluate(()=>document.dispatchEvent(new Event('fullscreenchange')));await page.waitForTimeout(100);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width===1280?844:1280);
  await page.evaluate(async()=>{const url='/src/game/events/bridge.ts';const {commands}=await import(url);commands.emit({type:'restart',biome:'dark-forest'});window.__PIXEL__!.world.pause();});
  await page.waitForFunction(()=>window.__PIXEL__!.atmosphere().phase==='normal');
  expect(await page.evaluate(()=>({biome:window.__PIXEL__!.world.biome,motes:window.__PIXEL__!.atmosphere().motes}))).toEqual({biome:'grove',motes:0});
  expect(errors).toEqual([]);writeFileSync(`${report}/phases-${width}.json`,JSON.stringify({rows,errors},null,2));await context.close();
});

test('art atlas changes silhouettes and details; chunk edges agree in all four phases',async({page})=>{
  await start(page);
  const evidence=await page.evaluate(async()=>{
    const url='/src/game/art/groveArtPack.ts';const {createGroveArtAtlas,paintGroveRegion,GROVE_ART_PHASES}=await import(url);
    const atlas:HTMLCanvasElement=createGroveArtAtlas(),g=atlas.getContext('2d')!;
    const masks=GROVE_ART_PHASES.map((_phase:string,i:number)=>Array.from(g.getImageData(0,i*224+32,64,64).data).filter((_v,j)=>j%4===3));
    const seams=GROVE_ART_PHASES.map((phase:string)=>{
      const whole:HTMLCanvasElement=paintGroveRegion(atlas,phase,-8,-8,16,16),wg=whole.getContext('2d')!;let different=0;
      for(let x=0;x<2;x++)for(let y=0;y<2;y++){
        const chunk:HTMLCanvasElement=paintGroveRegion(atlas,phase,-8+x*8,-8+y*8),a=chunk.getContext('2d')!.getImageData(0,0,256,256).data,b=wg.getImageData(x*256,y*256,256,256).data;
        for(let i=0;i<a.length;i++)if(a[i]!==b[i])different++;
      }return different;
    });
    return{masks,seams,atlas:atlas.toDataURL('image/png')};
  });
  expect(evidence.seams).toEqual([0,0,0,0]);
  for(const i of [1,2,3])expect(evidence.masks[i]).not.toEqual(evidence.masks[0]);
  expect(evidence.masks[2]).not.toEqual(evidence.masks[3]);
  writeFileSync(`${images}/art-atlas.png`,Buffer.from(evidence.atlas.split(',')[1],'base64'));
});

for(const [width,height]of [[1280,720],[844,390]])test(`readability and texture budget in Fire/Burning and Frost/Dying ${width}`,async({browser,baseURL})=>{
  test.setTimeout(40000);const context=await browser.newContext({baseURL,viewport:{width,height},hasTouch:width===844}),page=await context.newPage(),errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));await start(page);
  const rows=[];
  for(const [time,ultimate]of [[615,'frost'],[915,'fire']] as const){
    await page.evaluate(async()=>{const url='/src/game/events/bridge.ts';const {commands}=await import(url);commands.emit({type:'restart'});});
    await page.evaluate(({time,ultimate})=>{
      const p=window.__PIXEL__!,w=p.world;p.setVisualTime();w.elapsed=time;w.status='playing';w.player.invulnerableUntil=1e9;w.experience.level=40;w.enemies=[];
      w.ultimate.choose(w,ultimate);
      for(let i=0;i<150;i++){const e=w.spawn((['grunt','runner','tank','caster'] as const)[i%4],{x:(i%15-7)*26,y:(Math.floor(i/15)-5)*24},i%31===0)!;e.hp=e.maxHp=1e9;}
      for(const [i,kind]of (['charger','sorcerer','eclipse','guardian'] as const).entries()){const e=w.spawn(kind,{x:(i-1.5)*105,y:85})!;e.hp=e.maxHp=1e9;}
      w.ultimate.activate(w);
    },{time,ultimate});
    await page.waitForTimeout(1500);expect(await page.evaluate(ultimate=>window.__PIXEL__!.art().ultimate[ultimate].phase,ultimate)).toBe(ultimate==='fire'?'form':'field');await page.screenshot({path:`${images}/${ultimate}-${width}.png`});
    const result=await page.evaluate(async()=>{
      const frameMs:number[]=[],updateMs:number[]=[],started=performance.now();let last=started;
      await new Promise<void>(resolve=>{const frame=(now:number)=>{frameMs.push(now-last);last=now;updateMs.push(window.__PIXEL__!.metrics().updateMs);if(now-started<4500)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
      const p=window.__PIXEL__!;p.world.pause();return{frameMs,updateMs,environment:p.atmosphere().environment,art:p.art(),metrics:p.metrics(),heap:Reflect.get(performance,'memory')?.usedJSHeapSize};
    });
    expect(result.metrics.enemies).toBe(150);expect(result.environment.surfaces).toBe(result.environment.chunks);
    expect(result.environment.estimatedResidentBytes).toBeLessThan(48*1024*1024);
    const sorted=result.frameMs.slice().sort((a,b)=>a-b);expect(sorted[Math.floor(sorted.length*.95)]).toBeLessThan(100);
    expect(result.art.clock).toEqual([0,0,0]);expect(result.art.tweens).toBe(0);rows.push({ultimate,...result});
  }
  expect(errors).toEqual([]);writeFileSync(`${report}/combat-${width}.json`,JSON.stringify({cpu:cpus()[0]?.model,browser:browser.version(),viewport:{width,height},rows,errors},null,2));await context.close();
});

test('legacy Dark Forest history remains labelled and separate after a new Grove result',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('pixel-survivor-v1',JSON.stringify({version:2,settings:{volume:0,muted:true,pixelScale:2},statistics:{runs:7,kills:13,seconds:1000},records:[{id:'legacy-dark',score:10123,kills:13,elapsed:315,level:8,finishedAt:'2026-11-01T00:00:00Z',abilities:['fireball'],byKind:{grunt:13,runner:0,tank:0,caster:0,rusher:0,splitter:0,charger:0,sorcerer:0,eclipse:0,guardian:0},details:{character:'mage',biome:'dark-forest',regularKills:13,eliteKills:0,bossKills:0,damage:[]}}]}));
  });
  await page.goto('/?test=1&biome=dark-forest');await expect(page.getByRole('button',{name:'Dark Forest',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Локальные рекорды ↗'}).click();await expect(page.locator('.local-records')).toContainText('Dark Forest');
  await page.getByRole('button',{name:'Назад',exact:true}).click();await page.locator('.play-button').click();
  expect(await page.evaluate(()=>window.__PIXEL__!.world.biome)).toBe('grove');await page.evaluate(()=>window.__PIXEL__!.world.damagePlayer(1e9));
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('pixel-survivor-v1')!).records.length===2);
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('pixel-survivor-v1')!));
  expect(stored.records.find((r:{id:string})=>r.id==='legacy-dark').details.biome).toBe('dark-forest');expect(stored.records.filter((r:{details:{biome:string}})=>r.details.biome==='grove')).toHaveLength(1);expect(stored.statistics.runs).toBe(8);
});

test('native fullscreen and art phases retain build, Blink, charge and an active Fire Ultimate',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  // Use the real fullscreen API in the isolated desktop browser, without the mobile fixture shim.
  await page.goto('/?test=1');await page.locator('.play-button').click();
  await page.evaluate(()=>{
    const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=1e9;
    w.elapsed=315;w.experience.level=38;w.experience.xp=13;w.player.hp=64;
    for(const a of Object.values(w.abilities))a.level=0;
    w.abilities.fireball.level=4;w.abilities.fireball.readyAt=340;
    w.ultimate.choose(w,'fire');w.mobility.activate(w,{x:1,y:0});w.ultimate.charge=4;
    w.spawn('tank',{x:w.player.x+80,y:40});w.dropXp({x:w.player.x-80,y:20},5);
    w.shoot({x:w.player.x-50,y:50,vx:20,vy:0,damage:1,hostile:true});w.pause();
  });
  await page.addStyleTag({content:'.overlay{display:none!important}'});await page.waitForTimeout(120);
  const before=await page.evaluate(()=>JSON.stringify(window.__PIXEL__!.world));
  for(const time of [240,302.5,315,615,915]){await visualTime(page,time);expect(await page.evaluate(()=>JSON.stringify(window.__PIXEL__!.world))).toBe(before);}
  await page.evaluate(()=>document.addEventListener('pointerdown',()=>{
    void document.documentElement.requestFullscreen().catch(error=>{document.documentElement.dataset.fullscreenError=String(error);});
  },{once:true}));
  await page.mouse.click(300,350);
  await page.waitForFunction(()=>document.fullscreenElement!==null||!!document.documentElement.dataset.fullscreenError);
  expect(await page.evaluate(()=>document.documentElement.dataset.fullscreenError)).toBeUndefined();
  expect(await page.evaluate(()=>document.fullscreenElement===document.documentElement)).toBe(true);
  expect(await page.evaluate(()=>JSON.stringify(window.__PIXEL__!.world))).toBe(before);
  await page.screenshot({path:`${images}/native-fullscreen.png`});
  await page.evaluate(()=>document.exitFullscreen());await page.waitForFunction(()=>!document.fullscreenElement);
  expect(await page.evaluate(()=>window.__PIXEL__!.atmosphere().phase)).toBe('burning');
  expect(await page.evaluate(()=>{
    const w=window.__PIXEL__!.world;w.ultimate.charge=10;w.resume();const activated=w.ultimate.activate(w);w.pause();return activated;
  })).toBe(true);
  // Settle the existing one-shot audio queue before comparing persistent run state.
  await page.waitForTimeout(120);
  const active=await page.evaluate(()=>JSON.stringify(window.__PIXEL__!.world));
  for(const time of [240,315,615,915]){await visualTime(page,time);expect(await page.evaluate(()=>JSON.stringify(window.__PIXEL__!.world))).toBe(active);}
  expect(errors).toEqual([]);
});
