import {expect,test,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
async function advance(page:Page,seconds:number){
  await page.evaluate(seconds=>{const w=window.__PIXEL__!.world;w.resume();for(let t=0;t<seconds-1e-8;t+=.025)w.step(Math.min(.025,seconds-t));w.pause();},seconds);
  await page.waitForTimeout(65);
}
for(const burning of [false,true])for(const viewport of [{width:1280,height:720},{width:844,height:390}])test(`Briar Beast walking, melee, charge, horizontal mirror and cleanup ${burning?'burning':'grove'} ${viewport.width}`,async({page})=>{
  const directory=`screenshots/briar-beast-v1/${burning?'burning':'grove'}-${viewport.width}`;mkdirSync(directory,{recursive:true});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||m.type()==='warning'&&/Texture|Frame/.test(m.text()))errors.push(m.text());});
  await page.setViewportSize(viewport);await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();await page.addStyleTag({content:'.overlay{display:none!important}'});
  await page.evaluate(burning=>{
    const w=window.__PIXEL__!.world;w.pause();w.elapsed=burning?915:180;w.experience.level=30;w.enemies=[];w.clearHostileThreats();w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.player.invulnerableUntil=Infinity;
    for(const a of Object.values(w.abilities))a.level=0;w.spawn('charger',{x:240,y:-20})!.boss!.until=1e6;
  },burning);
  const actor=()=>page.evaluate(()=>window.__PIXEL__!.art().actors.find(a=>a.texture==='briar-beast-v1')!);
  const shot=async(name:string)=>page.locator('canvas').screenshot({path:`${directory}/${name}.png`});
  await advance(page,.025);const walkStart=await page.evaluate(()=>{const e=window.__PIXEL__!.world.bosses[0]!;return {x:e.x,y:e.y,speed:e.speed,pursuit:e.speed*2*(e.boss!.aggression?.movement??1)};});
  await advance(page,.18);const walkEnd=await page.evaluate(()=>{const e=window.__PIXEL__!.world.bosses[0]!;return {x:e.x,y:e.y};});
  expect(walkStart.speed).toBeCloseTo(31.2);expect(Math.hypot(walkEnd.x-walkStart.x,walkEnd.y-walkStart.y)).toBeCloseTo(walkStart.pursuit*.18,6);
  let view=await actor();expect(String(view.frame)).toMatch(/^charger-1-left-walk-\d+$/);expect(view.width).toBeCloseTo(57.6);expect(view.height).toBeCloseTo(57.6);expect(view.rotation).toBe(0);await shot('walk-left');
  await page.evaluate(()=>{window.__PIXEL__!.world.bosses[0]!.x=-240;});await advance(page,.025);await advance(page,.18);view=await actor();expect(String(view.frame)).toMatch(/^charger-1-right-walk-\d+$/);await shot('walk-right');
  // Vertical pursuit retains the last horizontal projection and never rotates the body.
  await page.evaluate(()=>{const e=window.__PIXEL__!.world.bosses[0]!;e.x=0;e.y=-140;});await advance(page,.025);await advance(page,.025);expect((await actor()).rotation).toBe(0);expect(String((await actor()).frame)).toMatch(/-(left|right)-walk-/);
  // The existing close-range contact gesture plays all twelve supplied attack frames.
  await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.bosses[0]!;e.x=30;e.y=0;e.boss!.until=1e6;});await advance(page,.025);expect(String((await actor()).frame)).toMatch(/-attack-0$/);await shot('melee-load');
  await advance(page,.3);expect(String((await actor()).frame)).toMatch(/-attack-6$/);await shot('melee-hit');
  await advance(page,.26);expect(String((await actor()).frame)).toMatch(/-attack-11$/);await shot('melee-recover');await advance(page,.05);
  const rows=[];
  for(const sign of [1,-1]){
    const facing=sign===1?'left':'right';
    await page.evaluate(sign=>{const w=window.__PIXEL__!.world,e=w.bosses[0]!;e.x=sign*180;e.y=0;e.boss!.phase='approach';e.boss!.until=w.elapsed;},sign);
    await advance(page,.025);expect(String((await actor()).frame)).toBe(`charger-1-${facing}-charge-0`);await shot(`${facing}-windup`);
    await advance(page,.3);expect(String((await actor()).frame)).toBe(`charger-1-${facing}-charge-1`);await shot(`${facing}-load`);
    const paused=await actor();await page.waitForTimeout(130);expect(await actor()).toEqual(paused);
    await advance(page,.201);expect(String((await actor()).frame)).toBe(`charger-1-${facing}-charge-3`);await shot(`${facing}-charge-start`);
    const before=await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.bosses[0]!;return {x:e.x,y:e.y,until:e.boss!.until,speed:e.boss!.charge!.speed,remaining:e.boss!.charge!.remaining};});
    await advance(page,.3);view=await actor();expect(String(view.frame)).toMatch(new RegExp(`^charger-1-${facing}-charge-[4-9]$`));expect(view.rotation).toBe(0);await shot(`${facing}-charge-travel`);
    const hitFrame=view.frame;await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.damageEnemy(w.bosses[0]!,1);});await page.waitForTimeout(65);expect((await actor()).frame).toBe(hitFrame);await shot(`${facing}-charge-hurt`);
    const moving=await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.bosses[0]!;return {x:e.x,y:e.y,until:e.boss!.until};});expect(Math.abs(moving.x-before.x)).toBeCloseTo(before.speed*.3,6);
    // Real scene ticking must hold the frame and charge distance through an Ultimate freeze.
    const frozen=await actor();await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.bosses[0]!;e.ultimateFreeze={until:w.elapsed+.4,updated:w.elapsed,visualAt:w.elapsed};});await advance(page,.3);expect((await actor()).frame).toBe(frozen.frame);expect((await actor()).x).toBe(frozen.x);await shot(`${facing}-freeze`);await advance(page,.1);
    const rest=await page.evaluate(()=>{const w=window.__PIXEL__!.world;return Math.max(0,w.bosses[0]!.boss!.until-w.elapsed);});await advance(page,rest+.001);
    expect(await page.evaluate(()=>window.__PIXEL__!.world.bosses[0]!.boss!.phase)).toBe('recover');expect(String((await actor()).frame)).toBe(`charger-1-${facing}-charge-10`);await shot(`${facing}-brake`);rows.push({facing,before,moving});
    const recovery=await page.evaluate(()=>{const w=window.__PIXEL__!.world;return w.bosses[0]!.boss!.until-w.elapsed;});await advance(page,recovery*.75);expect(String((await actor()).frame)).toBe(`charger-1-${facing}-charge-11`);await advance(page,recovery*.25+.001);
  }
  // Ordinary runs retain immediate score/chest rewards and the new-model death fade.
  const death=await page.evaluate(()=>{const w=window.__PIXEL__!.world,e=w.bosses[0]!,score=w.score;w.resume();w.damageEnemy(e,1e9);w.pause();return {score:w.score-score,chests:w.loot.chests.length};});expect(death).toEqual({score:1000,chests:1});
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().bosses.activeDeaths)).toBe(1);await advance(page,.2);
  expect(await page.evaluate(()=>window.__PIXEL__!.art().bosses.corpses[0]!.frame)).toMatch(/^charger-1-(left|right)-idle-0$/);await shot('death-fade');await advance(page,.5);
  const art=await page.evaluate(()=>window.__PIXEL__!.art());expect(art.bosses.activeDeaths).toBe(0);expect(art.clock).toEqual([0,0,0]);expect(art.tweens).toBe(0);
  await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__?.world.status==='menu');const restarted=await page.evaluate(()=>window.__PIXEL__!.art());
  expect(restarted.textures.filter(t=>t==='briar-beast-v1')).toHaveLength(1);expect(restarted.textureBytes).toBe(art.textureBytes);expect(restarted.bosses.tracked).toBe(0);expect(restarted.bosses.allocatedDeaths).toBe(0);expect(await page.evaluate(()=>window.__PIXEL__!.listeners())).toEqual({commands:1,snapshots:1,metrics:1});await expect(page.locator('canvas')).toHaveCount(1);expect(errors).toEqual([]);
  writeFileSync(`${directory}/evidence.json`,JSON.stringify({walkStart,walkEnd,rows,death,textureBytes:art.textureBytes,restarted:{objects:restarted.objects,textures:restarted.textures},errors},null,2));
});
