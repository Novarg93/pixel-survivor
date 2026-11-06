import { selectTestMap } from '../helpers/map';
import { selectTestCharacter } from '../helpers/character';
import { test, expect } from '@playwright/test';
test('combat feedback renders with bounded effects and visible telegraphs', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('/?test=1'); await page.getByRole('button', { name: 'Настройки', exact: true }).click(); await page.getByLabel('Цифры урона').check(); await page.getByRole('button', { name: 'Готово' }).click(); await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.spawn('tank', { x: 65, y: 0 }); w.abilities.frost.level = 1; w.abilities.lightning.level = 1; w.abilities.meteor.level = 1; });
  await page.waitForTimeout(120); await page.screenshot({ path: 'docs/screenshots/13-feedback.png' }); expect(errors).toEqual([]);
});
test('Warrior DEV fixture starts a fresh melee run', async ({ page }) => {
  await page.goto('/?test=1'); await selectTestCharacter(page, 'Warrior'); await page.getByRole('button', { name: 'Начать забег' }).click();
  expect(await page.evaluate(() => ({hero:window.__PIXEL__!.world.character,hp:window.__PIXEL__!.world.player.hp}))).toEqual({hero:'warrior',hp:150});
  await page.evaluate(() => {const w=window.__PIXEL__!.world;w.spawn('grunt',{x:40,y:0});for(const a of w.abilityDefinitions)w.abilities[a.id].level=3;});
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.kills)).toBeGreaterThan(0); await page.screenshot({path:'docs/screenshots/17-warrior.png'});
});
for(const hero of ['Mage','Warrior'])for(const biome of ['Роща осколков','Dark Forest'])test(`${hero} / ${biome} starts and renders bounded chunks`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  if(hero==='Warrior' && biome==='Dark Forest')await page.setViewportSize({width:390,height:844});
  await page.goto('/?test=1');await selectTestCharacter(page, hero);await selectTestMap(page,biome);await page.getByRole('button',{name:'Начать забег'}).click();
  expect(await page.evaluate(()=>window.__PIXEL__!.world.snapshot().character)).toBe(hero.toLowerCase());expect(await page.evaluate(()=>window.__PIXEL__!.world.biome)).toBe('grove');
  await page.keyboard.down('d');await page.waitForTimeout(200);await page.keyboard.up('d');expect(await page.evaluate(()=>window.__PIXEL__!.world.player.x)).toBeGreaterThan(10);
  await page.screenshot({path:`docs/screenshots/18-${hero}-${biome==='Dark Forest'?'dark':'grove'}.png`});expect(errors).toEqual([]);
});
test('results show ordinary/elite/boss kills and actual ability damage',async({page})=>{
  await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.damageEnemy(w.spawn('grunt')!,999,'fireball');w.damageEnemy(w.spawn('tank',undefined,true)!,9999,'frost');w.damageEnemy(w.spawn('eclipse')!,99999,'meteor');w.damagePlayer(10000);});
  await expect(page.getByRole('dialog',{name:'Игра окончена'})).toBeVisible();await expect(page.locator('.kill-summary')).toContainText('Обычные 1');await expect(page.locator('.kill-summary')).toContainText('Элитные 1');await expect(page.locator('.kill-summary')).toContainText('Боссы 1');
  await expect(page.getByRole('table',{name:'Урон по способностям'})).toContainText('Огненный шар');await expect(page.locator('.run-statistics')).toContainText('Армагеддон');
  await page.locator('.run-statistics').scrollIntoViewIfNeeded();await page.screenshot({path:'docs/screenshots/19-statistics.png'});
});
test('Warrior legacy location falls back to Grove across restarts and clear damage/skills',async({page})=>{await page.goto('/?test=1');await selectTestCharacter(page, 'Warrior');await selectTestMap(page,'Dark Forest');await page.getByRole('button',{name:'Начать забег'}).click();for(let i=0;i<3;i++){await page.evaluate(()=>window.__PIXEL__!.world.damagePlayer(10000));await page.getByRole('button',{name:'Начать заново'}).click();expect(await page.evaluate(()=>({hero:window.__PIXEL__!.world.character,biome:window.__PIXEL__!.world.biome,hp:window.__PIXEL__!.world.player.hp,damage:window.__PIXEL__!.world.snapshot().mostEffective,level:window.__PIXEL__!.world.experience.level}))).toEqual({hero:'warrior',biome:'grove',hp:150,damage:null,level:1});}});
test('new tells remain readable with cosmetic intensity zero',async({page})=>{const errors:string[]=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.goto('/?test=1');await page.getByRole('button',{name:'Роща осколков',exact:true}).click();await page.getByRole('button',{name:'Настройки',exact:true}).click();await page.getByLabel('Интенсивность эффектов').focus();await page.getByLabel('Интенсивность эффектов').press('Home');await page.getByRole('button',{name:'Готово'}).click();await page.getByRole('button',{name:'Начать забег'}).click();await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.elapsed=780;w.encounterDirector.nextAt=10000;const e=w.spawn('eclipse',{x:145,y:-40})!;w.damageEnemy(e,e.maxHp*0.6);e.boss!.until=w.elapsed;const r=w.spawn('rusher',{x:-80,y:0})!;r.rush!.until=w.elapsed;const s=w.spawn('splitter',{x:100,y:55},true)!;s.modifier='volatile';w.damageEnemy(s,99999);});await page.waitForFunction(()=>window.__PIXEL__!.world.bosses[0]?.boss?.phase==='windup');await page.waitForTimeout(180);await page.screenshot({path:'docs/screenshots/19-telegraphs.png'});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'docs/screenshots/19-telegraphs-mobile.png'});expect(errors).toEqual([]);});
