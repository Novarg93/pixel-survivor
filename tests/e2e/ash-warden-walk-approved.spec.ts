import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='art/generated/ash-warden-walk-integrated-v1/screenshots';
for(const [width,height]of [[1280,720],[844,390]])test(`approved movement, complete cycles and phase3 on game Canvas ${width}`,async({browser,baseURL})=>{
  test.setTimeout(45000);mkdirSync(out,{recursive:true});
  const context=await browser.newContext({baseURL,viewport:{width,height},hasTouch:width<1000}),page=await context.newPage(),errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||m.type()==='warning'&&/Texture|Frame/.test(m.text()))errors.push(m.text());});
  await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));
  await page.goto('/?test=1');await page.locator('.play-button').click();
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.practice=true;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.elapsed=1200;w.experience.level=70;w.player.invulnerableUntil=1e9;for(const a of Object.values(w.abilities))a.level=0;w.finalEncounter.begin(w);});
  await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.phase==='phase1');
  const directions=[['east',1,0],['west',-1,0],['south',0,1],['north',0,-1]]as const,results=[];
  for(const [face,dx,dy]of directions){
    await page.evaluate(()=>{const w=window.__PIXEL__!.world,f=w.finalEncounter;f.nextCombo=f.nextMelee=f.nextMeteor=Infinity;w.resume();});
    const samples=await page.evaluate(async({dx,dy})=>{
      const rows:{clip:string;index:number;clock:number;x:number;y:number;speed:number}[]=[];
      await new Promise<void>(resolve=>{const started=performance.now();function follow(){const p=window.__PIXEL__!,w=p.world,f=w.finalEncounter,e=f.boss!;w.player.x=e.x+dx*130;w.player.y=e.y+dy*130;const pose=p.art().finalBoss.pose;if(pose)rows.push({clip:pose.clip,index:pose.index,clock:f.bossClock,x:e.x,y:e.y,speed:f.chaseSpeed});if(performance.now()-started<2000)requestAnimationFrame(follow);else resolve();}requestAnimationFrame(follow);});return rows;
    },{dx,dy});
    const moving=samples.filter(s=>s.clip===face+'-walk');expect([...new Set(moving.map(s=>s.index))].sort((a,b)=>a-b)).toEqual(Array.from({length:12},(_,i)=>i));expect(moving.at(-1)!.x!==moving[0]!.x||moving.at(-1)!.y!==moving[0]!.y).toBe(true);
    results.push({face,samples:moving});
    // Inspect a real paused game pose; move only the test camera target/player nearer
    // so the entire boss fits. The pause dialog is hidden only for the Canvas capture.
    await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.finalEncounter.boss!;w.pause();w.player.x=e.x+18;w.player.y=e.y+24;});
    await page.waitForTimeout(65);await page.locator('canvas').screenshot({path:`${out}/${width}-${face}-walk.png`,style:'.overlay{visibility:hidden!important}'});
  }
  await page.evaluate(()=>{const w=window.__PIXEL__!.world,f=w.finalEncounter,e=f.boss!;w.player.x=e.x+130;w.player.y=e.y;w.resume();});
  await page.waitForFunction(()=>window.__PIXEL__!.art().finalBoss.pose?.clip==='east-walk');
  const frozen=await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.finalEncounter.boss!;e.ultimateFreeze={until:w.elapsed+2,updated:w.elapsed,visualAt:w.elapsed};return{clock:w.finalEncounter.bossClock,pose:window.__PIXEL__!.art().finalBoss.pose};});
  await page.waitForTimeout(280);expect(await page.evaluate(()=>window.__PIXEL__!.world.finalEncounter.bossClock)).toBe(frozen.clock);expect(await page.evaluate(()=>window.__PIXEL__!.art().finalBoss.pose)).toEqual(frozen.pose);
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;delete w.finalEncounter.boss!.ultimateFreeze;w.pause();});const paused=await page.evaluate(()=>window.__PIXEL__!.world.finalEncounter.bossClock);await page.waitForTimeout(150);expect(await page.evaluate(()=>window.__PIXEL__!.world.finalEncounter.bossClock)).toBe(paused);
  for(const [face,dx,dy]of directions){
    await page.evaluate(({dx,dy})=>{const w=window.__PIXEL__!.world,f=w.finalEncounter,e=f.boss!;f.phase='phase3';f.pending=null;f.nextVolley=Infinity;f.moving=true;f.attack={...f.attack,kind:'approach',direction:{x:dx,y:dy}};f.bossClock=.601;w.player.x=e.x+18;w.player.y=e.y+24;},{dx,dy});
    await expect.poll(()=>page.evaluate(()=>{const pose=window.__PIXEL__!.art().finalBoss.pose;return{clip:pose?.clip,index:pose?.index};})).toEqual({clip:face+'-walk',index:4});
    const pose=await page.evaluate(()=>window.__PIXEL__!.art().finalBoss.pose);expect(pose!.index).toBe(4);expect(pose!.frame.layers.length).toBe(1);
    await page.locator('canvas').screenshot({path:`${out}/${width}-${face}-phase3.png`,style:'.overlay{visibility:hidden!important}'});
  }
  await page.evaluate(()=>{const f=window.__PIXEL__!.world.finalEncounter;f.moving=false;});await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().finalBoss.pose?.clip)).toBe('north-idle');
  expect((await page.evaluate(()=>window.__PIXEL__!.art().finalBoss)).atlasBytes).toBeLessThanOrEqual(16*1024*1024);expect(errors).toEqual([]);
  writeFileSync(`art/generated/ash-warden-walk-integrated-v1/game-validation-${width}.json`,JSON.stringify({viewport:[width,height],results,freezeHeld:true,pauseHeld:true,idleRestored:true,errors},null,2));await context.close();
});
