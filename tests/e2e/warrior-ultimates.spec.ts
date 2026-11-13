import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const root = 'screenshots/warrior-ultimates-v1';
const directions = [['south',0,1],['south-east',1,1],['east',1,0],['north-east',1,-1],['north',0,-1],['north-west',-1,-1],['west',-1,0],['south-west',-1,1]] as const;
async function quiet(page: Page, x = 1, y = 0) {
  await page.goto('/?test=1'); await page.getByRole('button', { name: /^Warrior/ }).click();
  await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(({ x, y }) => {
    const w = window.__PIXEL__!.world, len = Math.hypot(x,y); w.options.spawnRate=0; w.encounterDirector.nextAt=Infinity;
    for(const a of Object.values(w.abilities))a.level=0;
    w.elapsed=300;w.experience.level=29;w.facing={x:x/len,y:y/len};w.player.invulnerableUntil=Infinity;
    for(const along of [45,100,170,240])for(const side of [-1,0,1]){
      const e=w.spawn('tank',{x:w.facing.x*along-w.facing.y*along*.3*side,y:w.facing.y*along+w.facing.x*along*.3*side})!;
      e.hp=e.maxHp=5000;e.speed=e.damage=0;
    }
    w.gainXp(w.snapshot().xpNext);
  },{x,y});
  await expect(page.locator('[data-upgrade^="ultimate-"]')).toHaveCount(3);
}
async function at(page: Page, age: number) {
  await page.evaluate(age=>{
    const w=window.__PIXEL__!.world,end=w.ultimate.started+age;w.resume();
    for(let i=0;i<1000&&w.elapsed<end-1e-7&&w.status==='playing';i++)w.step(Math.min(.01,end-w.elapsed));
    w.pause();
  },age);
}
for(const kind of ['earthbreaker','ruin']as const)test(`${kind}: actual choice/Q, contact and eight directional body/VFX routes`,async({page})=>{
  test.setTimeout(90000);mkdirSync(root,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));const evidence=[];
  for(const [direction,x,y]of directions){
    await quiet(page,x,y);await page.locator(`[data-upgrade="ultimate-${kind}"]`).click();
    await expect(page.getByRole('dialog',{name:'Новый уровень'})).toHaveCount(0);
    await expect(page.locator('.ultimate-control')).toContainText('10/10');await page.locator('canvas').click();await page.keyboard.press('q');
    await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.ultimate.sequence)).toBe(1);
    await at(page,.3);expect(await page.evaluate(()=>{const u=window.__PIXEL__!.world.snapshot().ultimateDamage;return (u?.ruin??0)+(u?.earthbreaker??0);})).toBe(0);
    const hide=await page.addStyleTag({content:'.overlay{visibility:hidden!important}'});
    if(direction==='east')await page.locator('canvas').screenshot({path:`${root}/${kind}-windup-1280.png`});
    await at(page,.85);await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.art().warrior?.motion)).toBe(`ultimate-${kind}`);
    await expect.poll(()=>page.evaluate(kind=>window.__PIXEL__!.art().ultimate.warrior[kind==='earthbreaker'?'earthbreaker':'spear'],kind)).toBe(true);
    const state=await page.evaluate(()=>{const w=window.__PIXEL__!.world,u=w.snapshot().ultimateDamage;return {pose:window.__PIXEL__!.art().warrior,fx:window.__PIXEL__!.art().ultimate.warrior,damage:(u?.ruin??0)+(u?.earthbreaker??0),origin:{...w.ultimate.warrior.origin},aim:{...w.ultimate.warrior.direction},wave:w.ultimate.warrior.wave};});
    expect(state.damage).toBeGreaterThan(0);expect(state.fx.allocated).toBe(3);expect(state.pose?.direction).toBe(direction);
    if(kind==='earthbreaker')expect(state.fx.earthbreaker).toBe(true);else expect(state.fx.spear).toBe(true);
    await page.locator('canvas').screenshot({path:`${root}/${kind}-${direction}-1280.png`});
    if(direction==='east'){
      const frozen=await page.evaluate(()=>window.__PIXEL__!.world.elapsed);await page.waitForTimeout(100);expect(await page.evaluate(()=>window.__PIXEL__!.world.elapsed)).toBe(frozen);
      await at(page,kind==='ruin'?1.9:1.15);await page.locator('canvas').screenshot({path:`${root}/${kind}-aftermath-1280.png`});
    }
    await at(page,4);expect(await page.evaluate(()=>{const u=window.__PIXEL__!.world.ultimate.warrior;return [u.pulses.length,u.spear];})).toEqual([0,null]);
    await hide.evaluate(el=>el.parentNode?.removeChild(el));evidence.push({direction,...state});
  }
  await page.evaluate(()=>window.__PIXEL__!.restartScene());await expect(page.getByRole('button',{name:'Начать забег'})).toBeVisible();
  expect(await page.evaluate(()=>window.__PIXEL__!.world.ultimate.warrior.kind)).toBeNull();expect(await page.locator('canvas').count()).toBe(1);
  expect(await page.evaluate(()=>window.__PIXEL__!.listeners())).toEqual({commands:1,snapshots:1,metrics:1});expect(errors).toEqual([]);
  writeFileSync(`${root}/${kind}-evidence.json`,JSON.stringify({evidence,errors},null,2));
});
for(const kind of ['earthbreaker','ruin']as const)test(`${kind}: mobile choice, touch ultimate and resize/pause cleanup`,async({page})=>{
  mkdirSync(root,{recursive:true});await page.setViewportSize({width:390,height:844});await quiet(page);
  await page.locator(`[data-upgrade="ultimate-${kind}"]`).click();await expect(page.getByRole('dialog',{name:'Новый уровень'})).toHaveCount(0);
  await page.locator('.ultimate-control').click();await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.ultimate.sequence)).toBe(1);
  await at(page,.85);const hide=await page.addStyleTag({content:'.overlay{visibility:hidden!important}'});
  await page.screenshot({path:`${root}/${kind}-hud-390.png`});await page.locator('canvas').screenshot({path:`${root}/${kind}-canvas-390.png`});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.setViewportSize({width:844,height:390});await page.waitForTimeout(70);await page.locator('canvas').screenshot({path:`${root}/${kind}-canvas-844.png`});
  await hide.evaluate(el=>el.parentNode?.removeChild(el));await page.evaluate(()=>window.__PIXEL__!.restartScene());
  await expect(page.getByRole('button',{name:'Начать забег'})).toBeVisible();
});
for(const width of [1440,390])test(`review demo controls run the real game, slow motion and single frame / ${width}`,async({page})=>{
  test.setTimeout(60000);mkdirSync(root,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:width===390?1100:1100});
  await page.goto('/art/generated/warrior-ultimates-gameplay-review-v1/viewer.html');
  await expect(page.locator('#loading')).toBeHidden({timeout:30000});
  const game=page.frames().find(f=>f.url().includes('?test=1'))!;expect(game).toBeTruthy();
  expect(await game.evaluate(()=>window.__PIXEL__!.world.practice)).toBe(true);
  for(const kind of ['ruin','earthbreaker','banner']as const){
    await page.locator(`[data-ultimate="${kind}"]`).click();await expect(page.locator('#loading')).toBeHidden();
    await expect.poll(()=>game.evaluate(()=>window.__PIXEL__!.world.ultimate.selected)).toBe(kind);
    await page.locator('#cast').click();await expect.poll(()=>game.evaluate(()=>window.__PIXEL__!.world.ultimate.sequence)).toBe(1);
    await page.locator('#pause').click();await expect.poll(()=>game.evaluate(()=>window.__PIXEL__!.world.status)).toBe('paused');
    const before=await game.evaluate(()=>window.__PIXEL__!.world.elapsed);await page.locator('#step').click();
    const after=await game.evaluate(()=>window.__PIXEL__!.world.elapsed);expect(after-before).toBeCloseTo(1/60,5);
    await page.locator('#refill').click();expect(await game.evaluate(()=>window.__PIXEL__!.world.ultimate.charge)).toBe(10);
  }
  await page.locator('#direction').selectOption('north-west');await expect(page.locator('#cast')).toBeEnabled();
  await page.locator('#rate').selectOption('.25');await page.locator('#cast').click();await page.locator('#pause').click();
  await page.screenshot({path:`${root}/review-${width}.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
