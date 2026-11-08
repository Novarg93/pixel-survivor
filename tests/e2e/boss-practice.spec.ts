import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {mockGamepads,connectPad,padFocus,pressPad} from '../helpers/gamepad';
const profile=JSON.stringify({version:2,settings:{volume:.3,muted:true,pixelScale:2},records:[{id:'earlier-run',score:1234,kills:12,elapsed:60,level:3,finishedAt:'2026-11-06T10:00:00Z',abilities:['fireball'],outcome:'defeat',byKind:{ashGuard:0,guardian:0,grunt:12,runner:0,tank:0,caster:0,rusher:0,splitter:0,charger:0,sorcerer:0,eclipse:0}}],lastPlayed:{id:'earlier-run',at:'2026-11-06T10:00:00Z'},statistics:{runs:1,kills:12,seconds:60}});
for(const [width,height]of [[1280,720],[844,390],[740,360]])test(`menu boss practice starts a lawful fight and preserves records ${width}`,async({browser,baseURL})=>{
 test.setTimeout(35000);mkdirSync('screenshots/final-boss',{recursive:true});
 const context=await browser.newContext({baseURL,viewport:{width,height},hasTouch:width<1000}),page=await context.newPage(),errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(profile=>{localStorage.setItem('pixel-survivor-v1',profile);Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined});},profile);
 await page.goto('/?test=1');const button=page.getByRole('button',{name:/Бой со Стражем/});await expect(button).toBeInViewport({ratio:1});await expect(page.getByRole('button',{name:/Бой с Хранителем затмения/})).toBeInViewport({ratio:1});
 if(width===1280){const best=await page.locator('.best').boundingBox(),footer=await page.locator('.menu-footer').boundingBox();expect(footer!.y-best!.y-best!.height).toBeGreaterThanOrEqual(8);}
 await page.screenshot({path:`screenshots/final-boss/practice-menu-${width}.png`});
 if(width===1280){await button.focus();await page.keyboard.press('Enter');}else await button.tap();
 await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.phase==='intro');
 const entry=await page.evaluate(()=>{const w=window.__PIXEL__!.world;return{practice:w.snapshot().practice,level:w.experience.level,hp:w.player.hp,ultimate:w.ultimate.selected,charge:w.ultimate.charge,bossHp:w.finalEncounter.boss!.hp,enemies:w.enemies.length,protectedUntil:w.player.invulnerableUntil,run:w.runId};});
 expect(entry).toMatchObject({practice:true,level:54,hp:200,ultimate:'frost',charge:10,bossHp:108000,enemies:1,protectedUntil:0});
 await page.screenshot({path:`screenshots/final-boss/practice-intro-${width}.png`});await expect(page.locator('.run-clock')).toContainText('Тренировка Стража');
 await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.phase==='phase1');
 await page.getByRole('button',{name:'Пауза',exact:true}).click();const clock=await page.evaluate(()=>window.__PIXEL__!.world.elapsed);await page.waitForTimeout(100);expect(await page.evaluate(()=>window.__PIXEL__!.world.elapsed)).toBe(clock);
 await page.getByRole('button',{name:'Продолжить →'}).click();
 // Terminal fixtures verify storage/UI, not boss balance or survival.
 if(width===1280)await page.evaluate(()=>{const w=window.__PIXEL__!.world,f=w.finalEncounter;w.damageEnemy(f.boss!,1e9);for(let i=0;i<18;i++)w.step(.05);for(const g of [...w.guardians])w.damageEnemy(g,1e9);w.damageEnemy(f.boss!,1e9);for(let i=0;i<37;i++)w.step(.05);w.damageEnemy(f.boss!,1e9);});
 else await page.evaluate(()=>window.__PIXEL__!.world.damagePlayer(1e9));
 expect(await page.evaluate(()=>window.__PIXEL__!.world.outcome)).toBe(width===1280?'victory':'defeat');
 await expect(page.getByText('Тренировка · результат не записывается в рекорды.',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('pixel-survivor-v1'))).toBe(profile);
 await page.getByRole('button',{name:'Начать заново',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.runId)).not.toBe(entry.run);
 expect(await page.evaluate(()=>window.__PIXEL__!.world.practice)).toBe(true);
 await page.getByRole('button',{name:'Пауза',exact:true}).click();await page.getByRole('button',{name:'В главное меню',exact:true}).click();await page.locator('.play-button').click();
 expect(await page.evaluate(()=>({practice:window.__PIXEL__!.world.practice,level:window.__PIXEL__!.world.experience.level,hp:window.__PIXEL__!.world.player.hp,elapsed:window.__PIXEL__!.world.elapsed}))).toMatchObject({practice:false,level:1,hp:100});
 expect(await page.evaluate(()=>window.__PIXEL__!.world.elapsed)).toBeLessThan(2);expect(errors).toEqual([]);await context.close();
});
test('controller starts boss practice through the real menu button',async({page})=>{
 await mockGamepads(page);await page.goto('/?test=1');await connectPad(page);await padFocus(page,page.getByRole('button',{name:/Бой со Стражем/}));await pressPad(page,'confirm');
 await page.waitForFunction(()=>window.__PIXEL__!.world.finalEncounter.phase==='intro');expect(await page.evaluate(()=>window.__PIXEL__!.world.practice)).toBe(true);
 await expect(page.locator('.mobility-slot')).toHaveAttribute('aria-label',/X/);
});
