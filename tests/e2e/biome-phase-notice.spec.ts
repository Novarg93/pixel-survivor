import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const images='screenshots/biome-notice',report='docs/biome-notice';
const phases=[[300,'dusk','Сумеречная роща'],[600,'dying','Умирающая роща'],[900,'burning','Горящая роща']] as const;
for(const [width,height]of [[1280,720],[844,390]])test(`five-second biome changes and notices use run time without obstructing combat ${width}`,async({browser,baseURL})=>{
  test.setTimeout(35000);mkdirSync(images,{recursive:true});mkdirSync(report,{recursive:true});
  const context=await browser.newContext({baseURL,viewport:{width,height},hasTouch:width===844}),page=await context.newPage(),errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));
  await page.goto('/?test=1');await page.locator('.play-button').click();
  await page.evaluate(()=>{
    const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=1e9;w.player.invulnerableUntil=1e9;
    for(const a of Object.values(w.abilities))a.level=0;
    w.spawn('charger',{x:110,y:-45});w.spawn('guardian',{x:-110,y:-45});
    for(let i=0;i<24;i++)w.spawn(i%2?'tank':'caster',{x:(i%8-4)*45,y:60+Math.floor(i/8)*25});
    w.pause();
  });
  await page.addStyleTag({content:'.overlay{display:none!important}'});
  const notice=page.locator('.biome-phase-notice'),rows=[];
  for(const [start,phase,title]of phases){
    await page.evaluate(time=>{window.__PIXEL__!.world.elapsed=time;},start-.1);
    await expect(page.locator('.run-clock>b')).toHaveText(start===300?'04:59':start===600?'09:59':'14:59');
    await expect(notice).toHaveCount(0);
    await page.evaluate(time=>{window.__PIXEL__!.world.elapsed=time;},start);
    await expect(notice).toBeVisible();await expect(notice).toHaveAttribute('data-phase',phase);await expect(notice).toContainText(title);
    expect(await page.evaluate(()=>window.__PIXEL__!.atmosphere().blend)).toBe(0);
    await page.evaluate(time=>{window.__PIXEL__!.world.elapsed=time;},start+2.5);
    await page.waitForFunction(()=>window.__PIXEL__!.atmosphere().blend===.5);
    await page.waitForTimeout(120);
    const html=await notice.evaluate(el=>el.outerHTML),state=await page.evaluate(()=>JSON.stringify(window.__PIXEL__!.world));
    await page.waitForTimeout(220);expect(await notice.evaluate(el=>el.outerHTML)).toBe(html);
    expect(await page.evaluate(()=>JSON.stringify(window.__PIXEL__!.world))).toBe(state);
    const box=(await notice.boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);
    expect(box.y).toBe(width===844?86:116);expect(box.width).toBe(width===844?280:360);
    expect(await page.locator('main').evaluate(el=>getComputedStyle(el).width)).toBe(`${width}px`);
    expect(await notice.evaluate(el=>getComputedStyle(el.parentElement!).pointerEvents)).toBe('none');
    for(const selector of ['.run-clock','.boss-bars','.skill-dock','.mobility-control']){
      const control=page.locator(selector).first();if(!await control.isVisible())continue;
      const other=await control.boundingBox();if(!other||other.width===0||other.height===0)continue;
      expect(box.x>=other.x+other.width||box.x+box.width<=other.x||box.y>=other.y+other.height||box.y+box.height<=other.y,selector).toBe(true);
    }
    await page.screenshot({path:`${images}/${phase}-${width}.png`});rows.push(await page.evaluate(()=>window.__PIXEL__!.atmosphere()));
    await page.evaluate(time=>{window.__PIXEL__!.world.elapsed=time;},start+5);
    await expect(notice).toHaveCount(0);
    expect(await page.evaluate(()=>window.__PIXEL__!.atmosphere().phase)).toBe(phase);
  }
  // Cross a real threshold: the notification appears once, freezes on pause, and expires after resume.
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.elapsed=899.9;w.resume();});
  await expect(notice).toHaveAttribute('data-phase','burning');
  await page.evaluate(()=>window.__PIXEL__!.world.pause());await page.waitForTimeout(120);
  const frozen=await notice.evaluate(el=>el.outerHTML);await page.waitForTimeout(220);expect(await notice.evaluate(el=>el.outerHTML)).toBe(frozen);
  await page.evaluate(()=>window.__PIXEL__!.world.resume());await expect(notice).toHaveCount(0,{timeout:7000});
  expect(await page.evaluate(()=>window.__PIXEL__!.atmosphere().phase)).toBe('burning');
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.pause();w.elapsed=901;});await expect(notice).toBeVisible();
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.player.invulnerableUntil=0;w.resume();w.damagePlayer(1e9);});await expect(notice).toHaveCount(0);
  await page.evaluate(async()=>{const url='/src/game/events/bridge.ts';const {commands}=await import(url);commands.emit({type:'restart'});window.__PIXEL__!.world.pause();});
  await expect(notice).toHaveCount(0);expect(await page.evaluate(()=>window.__PIXEL__!.atmosphere().phase)).toBe('normal');
  await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__?.world.status==='menu');
  await expect(page.locator('.biome-phase-announcer')).toHaveCount(0);
  expect(errors).toEqual([]);writeFileSync(`${report}/${width}.json`,JSON.stringify({rows,errors},null,2));await context.close();
});
