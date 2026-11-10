import {test,expect,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import type {GameScene} from '../../src/game/scenes/GameScene';
import type {HeldInputTracker} from '../../src/game/input/HeldInputTracker';
const dialog=(p:Page)=>p.getByRole('dialog',{name:'Новый уровень'});
async function start(p:Page){await p.goto('/?test=1');await p.getByRole('button',{name:'Начать забег'}).click();await p.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=1e6;for(const a of Object.values(w.abilities))a.level=0;});}
async function offer(p:Page,count=1){await p.evaluate(count=>{const w=window.__PIXEL__!.world;for(let i=0;i<count;i++)w.gainXp(w.snapshot().xpNext-w.experience.xp);},count);await expect(dialog(p)).toBeVisible();}
async function position(p:Page){return p.evaluate(()=>{const w=window.__PIXEL__!.world;return{x:w.player.x,y:w.player.y,t:w.elapsed,status:w.status,mobility:w.mobility.sequence};});}
async function choose(p:Page,key='2'){await p.keyboard.press(key);await expect(dialog(p)).toHaveCount(0);await expect.poll(()=>p.evaluate(()=>window.__PIXEL__!.world.status)).toBe('playing');}

test('A: W pressed inside upgrade moves immediately after confirmation without another keydown',async({page})=>{
  await start(page);await offer(page);await page.keyboard.down('w');const frozen=await position(page);await page.waitForTimeout(100);expect(await position(page)).toEqual(frozen);
  const firstFrame=await page.evaluateHandle(()=>{const w=window.__PIXEL__!.world,step=w.step,trace:{x:number;y:number;dt:number}[]=[];w.step=function(dt,input){if(this.status==='playing'&&input&&!trace.length)trace.push({...input,dt});return step.call(this,dt,input);};return trace;});
  await choose(page);await expect.poll(async()=> (await position(page)).y).toBeLessThan(frozen.y-10);expect(await firstFrame.jsonValue()).toEqual([{x:0,y:-1,dt:expect.any(Number)}]);await page.keyboard.up('w');
  mkdirSync('screenshots/held-input',{recursive:true});await page.screenshot({path:'screenshots/held-input/after-held-w.png'});writeFileSync('screenshots/held-input/A.json',JSON.stringify({frozen,after:await position(page)},null,2));
});
test('B: D already held in gameplay survives upgrade confirmation',async({page})=>{await start(page);await page.keyboard.down('d');await expect.poll(async()=> (await position(page)).x).toBeGreaterThan(5);await offer(page);const frozen=await position(page);await choose(page);await expect.poll(async()=> (await position(page)).x).toBeGreaterThan(frozen.x+10);await page.keyboard.up('d');});
test('C: keyup inside upgrade cancels prior held movement',async({page})=>{await start(page);await page.keyboard.down('w');await expect.poll(async()=> (await position(page)).y).toBeLessThan(-5);await offer(page);await page.keyboard.up('w');const frozen=await position(page);await choose(page);await page.waitForTimeout(200);const after=await position(page);expect(after.x).toBe(frozen.x);expect(after.y).toBe(frozen.y);});
test('D: W+D diagonal retains the same normalized physical speed',async({page})=>{await start(page);await offer(page);await page.keyboard.down('w');await page.keyboard.down('d');const frozen=await position(page);await choose(page);await expect.poll(async()=> (await position(page)).t).toBeGreaterThan(frozen.t+.25);const after=await position(page),speed=await page.evaluate(()=>window.__PIXEL__!.world.effectiveSpeed);expect(after.x-frozen.x).toBeCloseTo(frozen.y-after.y,4);expect(Math.hypot(after.x-frozen.x,after.y-frozen.y)/(after.t-frozen.t)).toBeCloseTo(speed,4);await page.keyboard.up('w');await page.keyboard.up('d');});
for(const [key,axis,sign] of [['ArrowUp','y',-1],['ArrowDown','y',1],['ArrowLeft','x',-1],['ArrowRight','x',1],['a','x',-1],['s','y',1]] as const)test(`physical ${key} survives modal key capture`,async({page})=>{await start(page);await offer(page);await page.keyboard.down(key);const p=await position(page);await choose(page);await expect.poll(async()=>((await position(page))[axis]-p[axis])*sign).toBeGreaterThan(8);await page.keyboard.up(key);});
test('E: browser blur clears held keys; focus/resume never resurrects an auto-repeat',async({page})=>{
  await start(page);await page.keyboard.down('d');await expect.poll(async()=> (await position(page)).x).toBeGreaterThan(5);
  // Headless Chromium keeps both tabs focused. Exercise the browser focus signal
  // through Phaser's real blur handler; all keyboard events use Playwright input.
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.status)).toBe('paused');
  const paused=await position(page);await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForTimeout(120);expect(await position(page)).toEqual(paused);
  await page.getByRole('button',{name:'Продолжить →'}).click();const p=await position(page);await page.keyboard.down('d');await page.waitForTimeout(200);const after=await position(page);expect(after.x).toBe(p.x);
  await page.keyboard.up('d');await page.keyboard.down('d');await expect.poll(async()=> (await position(page)).x).toBeGreaterThan(p.x+8);await page.keyboard.up('d');
});
test('F: held Space cannot select a card or queue mobility across upgrade',async({page})=>{await start(page);await offer(page);await page.keyboard.down('w');await page.keyboard.down('Space');await page.waitForTimeout(230);await expect(dialog(page)).toBeVisible();expect((await position(page)).mobility).toBe(0);await expect(page.locator('.choice[aria-pressed="true"]')).toHaveCount(0);await choose(page);await page.waitForTimeout(150);await page.keyboard.down('Space');expect((await position(page)).mobility).toBe(0);await page.keyboard.up('Space');await page.keyboard.up('w');});
test('G: queued offers preserve physical updates and ten scene restarts do not accumulate listeners',async({page})=>{
  await page.addInitScript(()=>{const live=new Map<EventListenerOrEventListenerObject,Set<string>>(),add=EventTarget.prototype.addEventListener,remove=EventTarget.prototype.removeEventListener;const key=(t:string,o?:boolean|AddEventListenerOptions|EventListenerOptions)=>t+':'+(typeof o==='boolean'?o:!!o?.capture);EventTarget.prototype.addEventListener=function(t,l,o){if(this===window&&l){const s=live.get(l)??new Set<string>();s.add(key(t,o));live.set(l,s);}Reflect.apply(add,this,[t,l,o]);};EventTarget.prototype.removeEventListener=function(t,l,o){if(this===window&&l){const s=live.get(l);s?.delete(key(t,o));if(!s?.size)live.delete(l);}Reflect.apply(remove,this,[t,l,o]);};Object.defineProperty(window,'__HELD_LISTENERS__',{value:()=>[...live.values()].reduce((n,s)=>n+s.size,0)});});
  await start(page);const listeners=await page.evaluate(()=>Object.getOwnPropertyDescriptor(window,'__HELD_LISTENERS__')!.value());await offer(page,3);await page.keyboard.down('d');const p=await position(page);
  for(let i=0;i<3;i++){const id=await page.evaluate(()=>window.__PIXEL__!.world.offerId);await page.keyboard.press('2');if(i<2){await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.world.offerId)).toBeGreaterThan(id);expect((await position(page)).x).toBe(p.x);}else await expect(dialog(page)).toHaveCount(0);}
  await expect.poll(async()=> (await position(page)).x).toBeGreaterThan(p.x+8);await page.keyboard.up('d');
  for(let i=0;i<10;i++){await page.evaluate(()=>window.__PIXEL__!.restartScene());await expect(page.getByRole('button',{name:'Начать забег'})).toBeVisible();expect(await page.evaluate(()=>Object.getOwnPropertyDescriptor(window,'__HELD_LISTENERS__')!.value())).toBe(listeners);expect(await page.evaluate(()=>window.__PIXEL__!.listeners())).toEqual({commands:1,snapshots:1,metrics:1});}
});
test('release during the 200ms confirmation cancels movement before the first resumed frame',async({page})=>{await start(page);await offer(page);await page.keyboard.down('w');const p=await position(page);await page.keyboard.press('2');await page.keyboard.up('w');await expect(dialog(page)).toHaveCount(0);await page.waitForTimeout(180);const r=await position(page);expect(r.x).toBe(p.x);expect(r.y).toBe(p.y);});
for(const transition of ['pause','menu','death','restart'] as const)test(`${transition} clears physical movement and requires a fresh press`,async({page})=>{await start(page);await page.keyboard.down('d');await expect.poll(async()=> (await position(page)).x).toBeGreaterThan(5);if(transition==='pause'||transition==='menu'){await page.getByRole('button',{name:'Пауза',exact:true}).click();if(transition==='pause')await page.getByRole('button',{name:'Продолжить →'}).click();else{await page.getByRole('button',{name:'В главное меню'}).click();await page.getByRole('button',{name:'Начать забег'}).click();}}else if(transition==='death'){await page.evaluate(()=>window.__PIXEL__!.world.damagePlayer(1e9));await page.getByRole('button',{name:'Начать заново'}).click();}else{await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.getByRole('button',{name:'Начать забег'}).click();}const p=await position(page);await page.keyboard.down('d');await page.waitForTimeout(180);const r=await position(page);expect(r.x).toBe(p.x);expect(r.y).toBe(p.y);expect(r.mobility).toBe(0);await page.keyboard.up('d');await page.keyboard.down('d');await expect.poll(async()=> (await position(page)).x).toBeGreaterThan(p.x+8);await page.keyboard.up('d');});
test('visibility hide during upgrade clears movement without affecting card confirmation',async({page})=>{await start(page);await offer(page);await page.keyboard.down('w');await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});const p=await position(page);await page.evaluate(()=>Reflect.deleteProperty(document,'hidden'));await choose(page);await page.keyboard.down('w');await page.waitForTimeout(180);expect((await position(page)).y).toBe(p.y);await page.keyboard.up('w');});

test('direct Phaser scene destruction clears the tracker and removes capture listeners',async({page})=>{
  await start(page);
  const scene=await page.evaluateHandle(async()=>{
    const path='/src/game/scenes/GameScene.ts';
    const liveUrl=performance.getEntriesByType('resource').map(e=>e.name).find(url=>new URL(url).pathname===path)??path;
    const {GameScene}=await import(liveUrl),create=GameScene.prototype.create;
    const ready=new Promise<GameScene>(resolve=>{GameScene.prototype.create=function(this:GameScene){GameScene.prototype.create=create;create.call(this);resolve(this);};});
    window.__PIXEL__!.restartScene();return ready;
  });
  await page.getByRole('button',{name:'Начать забег'}).click();await page.keyboard.down('w');
  const held=await scene.evaluateHandle(s=>Object.getOwnPropertyDescriptor(s,'heldInput')!.value as HeldInputTracker);
  expect(await held.evaluate(h=>h.input())).toEqual({x:0,y:-1});
  await scene.evaluate(s=>s.scene.remove('field'));
  await expect.poll(()=>held.evaluate(h=>h.input())).toEqual({x:0,y:0});
  await page.keyboard.up('w');await page.keyboard.down('w');expect(await held.evaluate(h=>h.input())).toEqual({x:0,y:0});await page.keyboard.up('w');
});
