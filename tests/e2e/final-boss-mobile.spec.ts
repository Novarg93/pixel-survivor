import {test,expect} from '@playwright/test';
test('final arena pauses on portrait, blur and upgrade and keeps geometry on resize',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,viewport:{width:844,height:390},hasTouch:true}),page=await context.newPage();
 await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));await page.goto('/?test=1');await page.locator('.play-button').click();
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=1e9;w.elapsed=1200;w.experience.level=70;for(const a of Object.values(w.abilities))a.level=0;w.finalEncounter.begin(w);w.finalEncounter.phase='phase3';w.finalEncounter.nextVolley=w.finalEncounter.clock+.2;});
 await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.meteors.length===9);
 await page.setViewportSize({width:390,height:844});await expect(page.getByRole('dialog',{name:'Поверните устройство горизонтально'})).toBeVisible();
 await page.waitForFunction(()=>window.__PIXEL__!.world.status==='paused');
 const stopped=await page.evaluate(()=>{const w=window.__PIXEL__!.world;return{time:w.elapsed,encounter:JSON.stringify(w.finalEncounter)};});await page.waitForTimeout(200);
 expect(await page.evaluate(()=>{const w=window.__PIXEL__!.world;return{time:w.elapsed,encounter:JSON.stringify(w.finalEncounter)};})).toEqual(stopped);
 await page.setViewportSize({width:740,height:360});await page.waitForFunction(()=>window.__PIXEL__!.world.status==='playing');
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.waitForFunction(()=>window.__PIXEL__!.world.status==='paused');
 const frozen=await page.evaluate(()=>window.__PIXEL__!.world.elapsed);await page.waitForTimeout(150);expect(await page.evaluate(()=>window.__PIXEL__!.world.elapsed)).toBe(frozen);
 await page.evaluate(()=>window.__PIXEL__!.world.resume());
 await page.evaluate(()=>{window.__PIXEL__!.world.status='upgrade';});const pending=await page.evaluate(()=>window.__PIXEL__!.world.finalEncounter.clock);await page.waitForTimeout(150);expect(await page.evaluate(()=>window.__PIXEL__!.world.finalEncounter.clock)).toBe(pending);
 await context.close();
});
test('native fullscreen atDPR2 retains the final arena, ritual supports and active Fire state',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,viewport:{width:1280,height:720},deviceScaleFactor:2}),page=await context.newPage();
 await page.goto('/?test=1');await page.locator('.play-button').click();
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=1e9;w.elapsed=1200;w.experience.level=70;for(const a of Object.values(w.abilities))a.level=0;w.finalEncounter.begin(w);});
 await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.phase==='phase1');await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.damageEnemy(w.finalEncounter.boss!,1e9);});await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.supports.size===3);
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.ultimate.choose(w,'fire');w.ultimate.activate(w);w.pause();});
 const before=await page.evaluate(()=>{const w=window.__PIXEL__!.world;return JSON.stringify({final:w.finalEncounter,supports:[...w.finalEncounter.supports],actors:w.guardians.map(e=>({id:e.id,x:e.x,y:e.y,hp:e.hp})),player:w.player,ultimate:{...w.ultimate,viewport:undefined},run:w.runId});});
 await page.evaluate(()=>{const button=document.createElement('button');button.id='native-final-proof';button.textContent='Fullscreen proof';button.style.cssText='position:fixed;z-index:9999;top:0;left:0';button.onclick=()=>void document.documentElement.requestFullscreen();document.body.append(button);});await page.locator('#native-final-proof').click();await page.waitForFunction(()=>document.fullscreenElement===document.documentElement);
 expect(await page.evaluate(()=>devicePixelRatio)).toBe(2);await page.setViewportSize({width:1024,height:768});
 expect(await page.evaluate(()=>{const w=window.__PIXEL__!.world;return JSON.stringify({final:w.finalEncounter,supports:[...w.finalEncounter.supports],actors:w.guardians.map(e=>({id:e.id,x:e.x,y:e.y,hp:e.hp})),player:w.player,ultimate:{...w.ultimate,viewport:undefined},run:w.runId});})).toBe(before);
 await page.evaluate(()=>document.exitFullscreen());await page.waitForFunction(()=>!document.fullscreenElement);expect(await page.evaluate(()=>window.__PIXEL__!.world.guardians.length)).toBe(3);await context.close();
});
