import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='art/generated/ash-warden-player-meteors-v1/flame-vfx/';
for(const [width,height]of [[1280,720],[844,390]])test(`C Flame Strike ground warning and upright chain on game Canvas ${width}`,async({browser,baseURL})=>{
  test.setTimeout(45000);mkdirSync(out+'screenshots',{recursive:true});const context=await browser.newContext({baseURL,viewport:{width,height},hasTouch:width<1000}),page=await context.newPage(),errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='warning'&&/Texture|Frame/.test(m.text()))errors.push(m.text());});
  await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));await page.goto('/?test=1');await page.locator('.play-button').click();
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.practice=true;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.elapsed=1200;w.player.invulnerableUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;w.finalEncounter.begin(w);});await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.phase==='phase1');
  const snapshots=[];
  for(const [face,dx,dy]of [['east',1,0],['west',-1,0],['south',0,1],['north',0,-1]]as const){
    for(const [kind,age,label]of [['swordWindup',.55/1.5,'warning'],['swordActive',.09,'impact'],['recovery',.35,'decay']]as const){
      await page.evaluate(({dx,dy,kind,age})=>{const w=window.__PIXEL__!.world,f=w.finalEncounter,e=f.boss!;w.pause();e.x=f.center.x;e.y=f.center.y;w.player.x=e.x+dx*140;w.player.y=e.y+dy*140-35;f.nextCombo=f.nextMelee=f.nextMeteor=Infinity;f.attack={...f.attack,kind,age,duration:kind==='swordWindup'?.6:kind==='swordActive'?.15:.75,direction:{x:dx,y:dy},contacted:false};},{dx,dy,kind,age});
      const expected=kind==='swordWindup'?age-.6:kind==='swordActive'?age:.15+age;
      await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().finalBoss.flameStrike.view?.impactAge)).toBeCloseTo(expected,5);
      const art=await page.evaluate(()=>window.__PIXEL__!.art().finalBoss.flameStrike);expect(art.pooledImages).toBeLessThanOrEqual(11);expect(art.activeImages).toBeLessThanOrEqual(11);
      if(label==='warning'){expect(art.groundLight.visible).toBe(true);expect(art.groundLight.alpha).toBeLessThan(.21);expect(art.segments).toHaveLength(0);}else if(label==='impact')expect(art.segments).toHaveLength(10);
      for(const s of art.segments){expect(s.rotation).toBe(0);expect(s.scale).toBe(.58);expect((s.x-art.view!.origin.x)*dy-(s.y-art.view!.origin.y)*dx).toBeCloseTo(0,5);}
      snapshots.push({face,label,art});await page.locator('canvas').screenshot({path:`${out}screenshots/${width}-${face}-${label}.png`,style:'.overlay{visibility:hidden!important}'});
    }
  }
  // Reduced decoration must retain the floor warning and active damage signal.
  await page.evaluate(async()=>{const path='/src/game/events/bridge.ts',{commands}=await import(path);commands.emit({type:'settings',value:{volume:0,muted:true,pixelScale:2,effectsIntensity:0,reducedMotion:true,reducedFlash:true}});const w=window.__PIXEL__!.world,f=w.finalEncounter;f.attack={...f.attack,kind:'swordWindup',age:.3,duration:.6};});
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().finalBoss.flameStrike.view?.impactAge)).toBeCloseTo(-.3,5);expect(await page.evaluate(()=>window.__PIXEL__!.art().finalBoss.flameStrike.groundLight.visible)).toBe(true);await page.locator('canvas').screenshot({path:`${out}screenshots/${width}-zero-effects-warning.png`,style:'.overlay{visibility:hidden!important}'});
  await page.evaluate(()=>{const w=window.__PIXEL__!.world,f=w.finalEncounter;f.attack={...f.attack,kind:'swordWindup',age:.44,duration:.6,direction:{x:1,y:0}};w.resume();});
  const playback=await page.evaluate(async()=>{const rows:ReturnType<NonNullable<Window['__PIXEL__']>['art']>['finalBoss']['flameStrike'][]=[];await new Promise<void>(resolve=>{const started=performance.now();function sample(){rows.push(window.__PIXEL__!.art().finalBoss.flameStrike);if(performance.now()-started<950)requestAnimationFrame(sample);else resolve();}requestAnimationFrame(sample);});return rows;});
  expect(playback.some(r=>r.segments.length===10)).toBe(true);expect(playback.some(r=>new Set(r.segments.map(s=>s.frame)).size>1)).toBe(true);expect(playback.at(-1)!.activeImages).toBe(0);
  // Real personal-clock freeze + global pause preserve the same visual pose.
  await page.evaluate(()=>{const w=window.__PIXEL__!.world,f=w.finalEncounter,e=f.boss!;f.attack={...f.attack,kind:'swordWindup',age:.54,duration:.6};e.ultimateFreeze={until:w.elapsed+2,updated:w.elapsed,visualAt:w.elapsed};});
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().finalBoss.flameStrike.view?.impactAge)).toBeCloseTo(-.06,5);const frozen=await page.evaluate(()=>window.__PIXEL__!.art().finalBoss.flameStrike);await page.waitForTimeout(160);expect(await page.evaluate(()=>window.__PIXEL__!.art().finalBoss.flameStrike)).toEqual(frozen);
  await page.evaluate(()=>window.__PIXEL__!.world.pause());await page.waitForTimeout(100);expect(await page.evaluate(()=>window.__PIXEL__!.art().finalBoss.flameStrike)).toEqual(frozen);
  await page.evaluate(()=>{const f=window.__PIXEL__!.world.finalEncounter;f.phase='dying';f.attack.kind='death';f.attack.age=0;});await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().finalBoss.flameStrike.activeImages)).toBe(0);
  const initial=await page.evaluate(()=>window.__PIXEL__!.art().objects);await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__!.world.status==='menu');const after=await page.evaluate(()=>({art:window.__PIXEL__!.art(),listeners:window.__PIXEL__!.listeners()}));expect(after.art.finalBoss.flameStrike.activeImages).toBe(0);expect(after.art.objects).toBeLessThan(initial);expect(after.listeners).toEqual({commands:1,snapshots:1,metrics:1});expect(errors).toEqual([]);
  writeFileSync(out+`game-validation-${width}.json`,JSON.stringify({viewport:[width,height],snapshots,playback,freezeHeld:true,pauseHeld:true,deathCleared:true,restart:after,errors},null,2));await context.close();
});
