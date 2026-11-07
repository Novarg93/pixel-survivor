import {test,expect} from '@playwright/test';
test('victory persists before presentation ends and held/repeated Space cannot restart the run',async({page})=>{
 await page.goto('/?test=1');await page.locator('.play-button').click();
 await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.elapsed=1200;w.experience.level=70;w.options.spawnRate=0;for(const a of Object.values(w.abilities))a.level=0;w.finalEncounter.begin(w);w.finalEncounter.phase='phase3';});
 await page.keyboard.down('Space');
 const id=await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.damageEnemy(w.finalEncounter.boss!,1e9);return w.runId;});
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('pixel-survivor-v1')!)?.records[0]?.completionKind)).toBe('final-boss');
 await expect(page.getByRole('heading',{name:'Победа!',exact:true})).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'Победа!',exact:true})).toBeVisible();await page.keyboard.down('Space');await page.keyboard.up('Space');await page.waitForTimeout(150);
 expect(await page.evaluate(()=>window.__PIXEL__!.world.runId)).toBe(id);expect(await page.evaluate(()=>window.__PIXEL__!.world.status)).toBe('over');
 await page.keyboard.press('Enter');await page.waitForFunction(old=>window.__PIXEL__!.world.runId!==old,id);
});
test('closing the page during death presentation retains exactly one final victory record',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL}),page=await context.newPage();await page.goto('/?test=1');await page.locator('.play-button').click();
 const id=await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.elapsed=1200;w.experience.level=70;w.options.spawnRate=0;for(const a of Object.values(w.abilities))a.level=0;w.finalEncounter.begin(w);w.finalEncounter.phase='phase3';w.damageEnemy(w.finalEncounter.boss!,1e9);return w.runId;});
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('pixel-survivor-v1')!)?.records[0]?.completionKind)).toBe('final-boss');await expect(page.getByRole('heading',{name:'Победа!',exact:true})).toHaveCount(0);await page.close();
 const reopened=await context.newPage();await reopened.goto('/?test=1');const saved=await reopened.evaluate(()=>JSON.parse(localStorage.getItem('pixel-survivor-v1')!));expect(saved.records.filter((r:{id:string})=>r.id===id)).toHaveLength(1);expect(saved.statistics.runs).toBe(1);expect(saved.records[0].finalEncounter.killed).toBe(true);await context.close();
});
test('a lethal Nova upgrade resolves victory through the real Vue choice pipeline',async({page})=>{
 await page.goto('/?test=1');await page.locator('.play-button').click();
 await page.evaluate(async()=>{const path='/src/game/systems/UpgradeSystem.ts',{SUPPLIES}=await import(path),w=window.__PIXEL__!.world;w.elapsed=1200;w.experience.level=70;w.options.spawnRate=0;for(const a of Object.values(w.abilities))a.level=0;w.finalEncounter.begin(w);w.finalEncounter.phase='phase3';const e=w.finalEncounter.boss!;e.hp=100;w.player.x=e.x;w.player.y=e.y;w.experience.pending=1;w.choices=[...SUPPLIES];w.status='upgrade';});
 await page.locator('[data-upgrade="nova"]').click();await page.waitForFunction(()=>window.__PIXEL__!.world.outcome==='victory');
 expect(await page.evaluate(()=>window.__PIXEL__!.world.finalEncounter.phase)).toBe('dying');expect(await page.evaluate(()=>window.__PIXEL__!.world.experience.pending)).toBe(0);await expect(page.getByRole('heading',{name:'Победа!',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('pixel-survivor-v1')!).records[0].byKind.ashGuard)).toBe(1);
});
