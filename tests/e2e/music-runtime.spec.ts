import {test,expect,type Page,type Route} from '@playwright/test';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const root='screenshots/music-runtime-v1';
async function start(page:Page){
  await page.addInitScript(()=>{
    Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined});
    const monitor={players:[]as HTMLAudioElement[],contexts:0};Object.defineProperty(window,'__MUSIC_TEST__',{value:monitor});
    window.Audio=new Proxy(window.Audio,{construct(target,args){const element=Reflect.construct(target,args) as HTMLAudioElement;monitor.players.push(element);return element;}});
    window.AudioContext=new Proxy(window.AudioContext,{construct(target,args){monitor.contexts++;return Reflect.construct(target,args);}});
  });
  await page.goto('/?test=1');await page.waitForFunction(()=>!!window.__PIXEL__);expect(await page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);
  await page.getByRole('button',{name:'Начать забег'}).click();
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.player.invulnerableUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;});
}
for(const[width,height]of [[1280,720],[844,390]])test(`approved variant2 stage music, boss priority, repeat and teardown ${width}`,async({page})=>{
  test.setTimeout(50000);mkdirSync(root,{recursive:true});const errors:string[]=[],external:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().startsWith('http')&&!r.url().startsWith('http://127.0.0.1:'))external.push(r.url());});await page.setViewportSize({width,height});await start(page);
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().music?.current)).toBe('normal');await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().music?.decks.some(d=>d.time>.4))).toBe(true);
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().rms)).toBeGreaterThan(.0001);
  for(const[time,track]of [[300,'dusk'],[600,'dying'],[900,'burning']]as const){
    await page.evaluate(time=>{window.__PIXEL__!.world.elapsed=time;},time);await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().music?.current)).toBe(track);
    expect(await page.evaluate(()=>window.__PIXEL__!.audio().music!.playing)).toBeLessThanOrEqual(2);await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().music!.playing)).toBe(1);
  }
  await page.evaluate(()=>{const w=window.__PIXEL__!.world,boss=w.spawn('charger',{x:w.player.x+60,y:w.player.y})!;boss.speed=0;boss.hp=boss.maxHp=1e6;});await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().music?.current)).toBe('burning');
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.bosses[0]!.x=5000;w.elapsed=910;});await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().music?.current)).toBe('burning');await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().music?.playing)).toBe(1);
  await page.evaluate(()=>{const monitor=Reflect.get(window,'__MUSIC_TEST__') as{players:HTMLAudioElement[]};const active=monitor.players.find(a=>!a.paused&&a.src.endsWith('/burning.mp3'))!;active.currentTime=active.duration-1;});
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().music?.repeats??0)).toBeGreaterThan(0);await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().music?.playing)).toBe(1);
  const audio=await page.evaluate(()=>window.__PIXEL__!.audio());expect(audio.music!.players).toBe(2);expect(audio.music!.failed).toEqual([]);expect(audio.loops).toBeLessThanOrEqual(3);expect(audio.decodedBytes).toBeLessThan(26e6);expect(audio.nodes).toBeLessThanOrEqual(37);
  await page.locator('canvas').screenshot({path:`${root}/playing-${width}.png`});await page.keyboard.press('Escape');await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);
  await page.getByRole('button',{name:'Настройки',exact:true}).click();await page.getByLabel('Музыка',{exact:true}).evaluate(e=>{(e as HTMLInputElement).value='0';e.dispatchEvent(new Event('input',{bubbles:true}));});await page.getByRole('button',{name:'Готово',exact:true}).click();await page.getByRole('button',{name:'Продолжить →'}).click();
  await page.keyboard.press('Space');await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().played['player.blink']??0)).toBeGreaterThan(0);expect(await page.evaluate(()=>window.__PIXEL__!.audio().music!.playing)).toBe(0);
  for(let i=0;i<3;i++){await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__?.world.status==='menu');expect(await page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);}
  const monitor=await page.evaluate(()=>{const m=Reflect.get(window,'__MUSIC_TEST__') as{players:HTMLAudioElement[];contexts:number};return{contexts:m.contexts,playing:m.players.filter(a=>!a.paused).length,retainedSources:m.players.filter(a=>a.getAttribute('src')).length};});expect(monitor).toEqual({contexts:1,playing:0,retainedSources:0});expect(external).toEqual([]);expect(errors).toEqual([]);
  writeFileSync(`${root}/evidence-${width}.json`,JSON.stringify({audio,monitor,external,errors},null,2));
});
test('missing phase MP3 falls back once and a later valid phase recovers',async({page})=>{
  let failed=0;await page.route('**/assets/audio/music-v1/normal.mp3',route=>{failed++;return route.abort();});await start(page);
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().music?.failed)).toContain('normal');await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().loops)).toBe(2);await page.waitForTimeout(150);const before=failed;await page.waitForTimeout(150);expect(failed).toBe(before);
  await page.evaluate(()=>{window.__PIXEL__!.world.elapsed=300;});await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().music?.current)).toBe('dusk');await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().loops)).toBe(1);
});
test('pause invalidates a pending media play and never starts it after the file arrives',async({page})=>{
  const pending:Route[]=[];await page.route('**/assets/audio/music-v1/normal.mp3',route=>{pending.push(route);});await start(page);await expect.poll(()=>pending.length).toBeGreaterThan(0);
  await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().music?.pending)).toBe(1);await page.keyboard.press('Escape');await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().music?.pending)).toBe(0);
  const bytes=readFileSync('public/assets/audio/music-v1/normal.mp3');for(const route of pending)await route.fulfill({status:200,contentType:'audio/mpeg',body:bytes});await page.waitForTimeout(250);
  expect(await page.evaluate(()=>window.__PIXEL__!.audio().sources)).toBe(0);await page.getByRole('button',{name:'Продолжить →'}).click();await expect.poll(()=>page.evaluate(()=>window.__PIXEL__!.audio().music?.current)).toBe('normal');
});
