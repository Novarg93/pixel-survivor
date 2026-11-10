import { test, expect } from '@playwright/test';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

test('built approved variant2 boss music streams through the single audio context and stops on pause',async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined});
    const monitor={players:[]as HTMLAudioElement[],contexts:0};Object.defineProperty(window,'__BUILT_MUSIC__',{value:monitor});
    window.Audio=new Proxy(window.Audio,{construct(target,args){const a=Reflect.construct(target,args) as HTMLAudioElement;monitor.players.push(a);return a;}});
    window.AudioContext=new Proxy(window.AudioContext,{construct(target,args){monitor.contexts++;return Reflect.construct(target,args);}});
  });
  const errors:string[]=[],external:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().startsWith('http')&&!r.url().startsWith('http://127.0.0.1:'))external.push(r.url());});
  await page.goto('/');await page.getByRole('button',{name:/Бой со Стражем/}).click();
  await expect.poll(()=>page.evaluate(()=>{const m=Reflect.get(window,'__BUILT_MUSIC__')as{players:HTMLAudioElement[]};return m.players.some(a=>!a.paused&&a.currentTime>.3&&a.src.endsWith('/music-v1/boss.mp3'));})).toBe(true);
  const state=await page.evaluate(()=>{const m=Reflect.get(window,'__BUILT_MUSIC__')as{players:HTMLAudioElement[];contexts:number};return{contexts:m.contexts,players:m.players.length,playing:m.players.filter(a=>!a.paused).length};});expect(state).toEqual({contexts:1,players:2,playing:1});
  await page.getByRole('button',{name:'Пауза',exact:true}).click();await expect.poll(()=>page.evaluate(()=>{const m=Reflect.get(window,'__BUILT_MUSIC__')as{players:HTMLAudioElement[]};return m.players.every(a=>a.paused);})).toBe(true);
  const manifest=JSON.parse(readFileSync('art/generated/music-runtime-v1/manifest.json','utf8'))as{entries:{id:string;sha256:string;variant:number}[]};for(const e of manifest.entries){expect(e.variant).toBe(2);const r=await page.request.get(`/assets/audio/music-v1/${e.id}.mp3`);expect(r.ok()).toBe(true);expect(createHash('sha256').update(await r.body()).digest('hex')).toBe(e.sha256);}
  expect(await page.evaluate(()=>window.__PIXEL__)).toBeUndefined();expect(errors).toEqual([]);expect(external).toEqual([]);
});

test('built Mage audio loads11 local WAVs and plays lightning ultimate from the menu',async({page,baseURL})=>{
  const root='screenshots/mage-sfx-elevenlabs-v1';mkdirSync(root,{recursive:true});const errors:string[]=[],external:string[]=[],audio:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{const url=new URL(r.url());if(url.origin!==new URL(baseURL!).origin&&url.protocol!=='data:')external.push(r.url());});
  page.on('response',r=>{if(r.url().includes('/assets/audio/mage-sfx-v1/')||r.url().includes('/assets/audio/mage-sfx-uploaded-v1/')){audio.push(new URL(r.url()).pathname);if(r.status()!==200)errors.push(`audio HTTP ${r.status()}`);}});
  await page.addInitScript(()=>{
    Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined});
    const started:{duration:number;loop:boolean}[]=[],start=AudioBufferSourceNode.prototype.start;
    Object.defineProperty(window,'__MAGE_SFX_OUTPUT__',{value:started});
    AudioBufferSourceNode.prototype.start=function(...args){started.push({duration:this.buffer?.duration??0,loop:this.loop});return Reflect.apply(start,this,args);};
  });
  await page.goto('/');await expect(page.getByRole('button',{name:/Бой со Стражем/})).toContainText('Гнев Небес');await expect.poll(()=>audio.length).toBe(11);
  await page.screenshot({path:root+'/production-menu.png'});await page.getByRole('button',{name:/Бой со Стражем/}).click();await expect(page.locator('.ultimate-control')).toContainText('10/10');
  await page.waitForTimeout(2800);await page.keyboard.press('q');
  await expect.poll(()=>page.evaluate(()=>{
    const rows=Reflect.get(window,'__MAGE_SFX_OUTPUT__') as{duration:number;loop:boolean}[];
    return rows.some(row=>!row.loop&&Math.abs(row.duration-2)<.01);
  })).toBe(true);
  await page.screenshot({path:root+'/production-ultimate.png'});expect(await page.evaluate(()=>window.__PIXEL__)).toBeUndefined();
  const manifest=JSON.parse(readFileSync('art/generated/mage-sfx-elevenlabs-v1/manifest.json','utf8')) as{entries:{id:string;file:string;sha256:string}[]};
  const overrides=JSON.parse(readFileSync('art/generated/mage-uploaded-sounds-v1/manifest.json','utf8')) as{entries:{id:string;file:string;sha256:string}[]};
  for(const entry of manifest.entries){const override=overrides.entries.find(e=>e.id===entry.id),url=override?override.file.replace('public/','/'):'/assets/audio/mage-sfx-v1/'+entry.file;const r=await page.request.get(url);expect(r.ok()).toBe(true);expect(createHash('sha256').update(await r.body()).digest('hex')).toBe(override?.sha256??entry.sha256);}
  expect(external).toEqual([]);expect(errors).toEqual([]);writeFileSync(root+'/production-evidence.json',JSON.stringify({audio,external,errors,harnessAbsent:true,generatedUltimatePlayed:true},null,2));
});
const MAGE_HERO=JSON.parse(readFileSync('src/game/art/mageHeroManifest.json','utf8')) as {pages:{index:number}[]};
for(const width of [1280,390])test(`built public PixelLab Blink while casting north-east ${width}`,async({page})=>{
 const root=`screenshots/mage-blink-v1/production/${width}`;mkdirSync(root,{recursive:true});const errors:string[]=[],assets:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);if(r.url().includes('/assets/hd/mage-blink-v1/'))assets.push(new URL(r.url()).pathname);});
 await page.setViewportSize({width,height:width===390?844:720});await page.goto('/');await page.getByRole('button',{name:'Начать забег'}).click();
 await page.keyboard.down('w');await page.keyboard.down('d');await page.waitForTimeout(100);await page.keyboard.press('Space');await page.waitForTimeout(80);await page.keyboard.up('w');await page.keyboard.up('d');await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog',{name:'Пауза',exact:true})).toBeVisible();await expect(page.locator('.mobility-slot')).not.toHaveClass(/ready/);await page.addStyleTag({content:'.overlay{display:none!important}'});await page.locator('canvas').screenshot({path:root+'/north-east-paused.png'});
 expect(await page.evaluate(()=>window.__PIXEL__)).toBeUndefined();expect(assets.sort()).toEqual(['/assets/hd/mage-blink-v1/atlas.json','/assets/hd/mage-blink-v1/atlas.png']);expect(errors).toEqual([]);writeFileSync(root+'/evidence.json',JSON.stringify({viewport:[width,width===390?844:720],keyboardBlink:true,cooldownActive:true,paused:true,devHarnessAbsent:true,assets,errors},null,2));
});
import { mockGamepads, connectPad, pressPad, stick, padFocus } from '../helpers/gamepad';
test('built menu excludes temporary DEV ultimate launchers',async({page})=>{
  await page.goto('/');await expect(page.getByRole('button',{name:/^Начать забег/})).toBeVisible();await expect(page.locator('[data-dev-ultimate]')).toHaveCount(0);await expect(page.getByLabel('DEV — тест ультимейтов')).toHaveCount(0);
});
test('built main menu starts the real boss practice without a DEV harness',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:/Бой со Стражем/}).click();
 await expect(page.locator('.final-boss-bar')).toBeVisible();await expect(page.locator('.hero-name')).toHaveText('✦ MAGE');await expect(page.locator('.level-line')).toContainText('54');
 await expect(page.locator('.run-clock')).toContainText('20:');await expect(page.getByRole('progressbar',{name:'Здоровье',exact:true})).toHaveAttribute('aria-valuemax','200');
 expect(await page.evaluate(()=>window.__PIXEL__)).toBeUndefined();await expect(page.locator('.final-boss-bar')).toHaveAttribute('data-phase','phase1',{timeout:6000});
});
test('built menu starts the isolated Rootbound Guardian duel without a DEV harness',async({page})=>{
  await page.goto('/');await expect(page.getByRole('button',{name:/Бой с Хранителем затмения/})).toHaveCount(0);await page.getByRole('button',{name:/Бой с Хранителем/}).click();
  await expect(page.locator('.run-clock')).toContainText('Корневой хранитель · 1×1');await expect(page.locator('.level-line')).toContainText('54');
  await expect(page.locator('[data-marker="guardian"]')).toHaveCount(1);await expect(page.locator('.boss-bar')).toHaveCount(0);await expect(page.locator('.guardian-waves')).toHaveCount(0);await expect(page.locator('.final-boss-bar')).toHaveCount(0);
  await page.locator('canvas').screenshot({path:'screenshots/rootbound-guardian-v1/practice/production.png'});
  expect(await page.evaluate(()=>window.__PIXEL__)).toBeUndefined();await page.getByRole('button',{name:'Пауза',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Пауза',exact:true})).toBeVisible();
});
for(const hero of ['Mage','Warrior'])for(const biome of ['grove','dark'])test('built public '+hero+' attempt '+biome+' starts, attacks, pauses, resizes and needs no external resources', async ({ page, baseURL }) => {
  const errors: string[] = [], external: string[] = [], artRequests: string[] = [];
  // Observe the real output without shipping a production test hook.
  await page.addInitScript(() => {
    const analysers: AnalyserNode[] = [];
    const create = AudioContext.prototype.createAnalyser;
    AudioContext.prototype.createAnalyser = function() { const node = create.call(this); analysers.push(node); return node; };
    Object.defineProperty(window, '__AUDIO_OUTPUT_RMS__', { value: () => {
      let peak = 0;
      for (const analyser of analysers) {
        const data = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(data);
        peak = Math.max(peak, Math.sqrt(data.reduce((sum, value) => sum + value * value, 0) / data.length));
      }
      return peak;
    } });
  });
  page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  page.on('request', request => { const url = new URL(request.url()); if (url.protocol !== 'data:' && url.origin !== new URL(baseURL!).origin) external.push(request.url()); if (url.pathname.startsWith('/assets/') && /\.(?:json|png|webp|jpe?g|gif|svg)$/.test(url.pathname)) artRequests.push(url.pathname); });
  await page.goto('/?test=1&visual=1' + (biome==='dark'?'&biome=dark-forest&visualTime=915':'')); await expect(page.getByRole('button', { name: 'Начать забег' })).toBeVisible();
  await expect(page.getByLabel('Визуальный стиль')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Dark Forest',exact:true})).toHaveCount(0);await expect(page.getByLabel('Локация').getByRole('button')).toHaveCount(1);
  await page.getByRole('button',{name:new RegExp('^'+hero)}).click({force:true}); if(hero==='Warrior'){await expect(page.getByText('Warrior находится в разработке',{exact:true})).toBeVisible(); await expect(page.getByRole('button',{name:/^Mage/})).toHaveAttribute('aria-pressed','true');} await page.getByRole('button',{name:biome==='dark'?'Роща осколков':'\u0420\u043e\u0449\u0430 \u043e\u0441\u043a\u043e\u043b\u043a\u043e\u0432',exact:true}).click();
  expect(await page.evaluate(() => window.__PIXEL__)).toBeUndefined();
  await page.screenshot({ path: `docs/screenshots/19-production-${hero}-${biome}-menu.png` });
  await page.getByRole('button', { name: 'Начать забег' }).click(); await expect(page.locator('.hero-name')).toContainText('MAGE');
  await expect.poll(() => page.evaluate(() => {
    const rms = Object.getOwnPropertyDescriptor(window, '__AUDIO_OUTPUT_RMS__')!.value as () => number; return rms();
  })).toBeGreaterThan(.0001);
  await expect.poll(async () => Number((await page.locator('.run-score b').textContent())?.replace(/\D/g, '') ?? 0), { timeout: 20000 }).toBeGreaterThan(0);
  await page.keyboard.down('d'); await page.waitForTimeout(250); await page.keyboard.up('d');
  await page.screenshot({ path: `docs/screenshots/19-production-${hero}-${biome}-desktop.png` });
  await page.getByRole('button', { name: 'Пауза', exact: true }).click(); await expect(page.getByRole('dialog', { name: 'Пауза', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const rms = Object.getOwnPropertyDescriptor(window, '__AUDIO_OUTPUT_RMS__')!.value as () => number; return rms();
  })).toBeLessThan(.00001);
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(150);
  await expect(page.getByLabel('Сенсорный джойстик')).toBeVisible();
  await page.screenshot({ path: `docs/screenshots/19-production-${hero}-${biome}-mobile.png` });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390); expect(external).toEqual([]); expect(errors).toEqual([]);
expect(artRequests.sort()).toEqual([...['north','meteor'].flatMap(id=>['json','png'].map(ext=>`/assets/hd/ash-warden-pixellab-v1/${id}.${ext}`)),'/assets/hd/mage-shield-nova-pixellab-v1/atlas.png','/assets/hd/mage-shield-nova-pixellab-v1/atlas.json','/assets/hd/mage-blink-v1/atlas.png','/assets/hd/mage-blink-v1/atlas.json','/assets/hd/mage-moving-cast-v2/upper.png','/assets/hd/mage-moving-cast-v2/upper.json','/assets/hd/mage-cast-v2/atlas.png','/assets/hd/mage-cast-v2/atlas.json','/assets/hd/mage-run-v2/atlas.png','/assets/hd/mage-run-v2/atlas.json','/assets/hd/mage-idle-v2/atlas.png','/assets/hd/mage-idle-v2/atlas.json','/assets/hd/mage-phantom-v1/atlas.png','/assets/hd/mage-phantom-v1/atlas.json','/assets/hd/lightning-ultimate-v1/atlas.png','/assets/hd/lightning-ultimate-v1/atlas.json','/assets/hd/regular-lightning-v1/atlas.png','/assets/hd/regular-lightning-v1/atlas.json','/assets/hd/mage-meteor-pixellab-v1/atlas.png','/assets/hd/mage-meteor-pixellab-v1/atlas.json','/assets/hd/mage-fireball-pixellab-v1/atlas.png','/assets/hd/mage-fireball-pixellab-v1/atlas.json','/assets/hd/astral-flame-pixellab-v1/atlas.json','/assets/hd/astral-flame-pixellab-v1/atlas.png','/assets/hd/astral-projectile-pixellab-v1/atlas.json','/assets/hd/astral-projectile-pixellab-v1/atlas.png','/assets/hd/astral-revenant-v1/atlas.json','/assets/hd/astral-revenant-v1/atlas.png','/assets/hd/briar-beast-v1/atlas.json','/assets/hd/briar-beast-v1/atlas.png','/assets/hd/rune-warden-pixellab-v1/atlas.png','/assets/hd/rune-warden-pixellab-v1/atlas.json','/assets/hd/rune-warden-v1/atlas.json','/assets/hd/rune-warden-v1/atlas.png','/assets/hd/mage-frost-ultimate-runtime-v1/atlas.json','/assets/hd/mage-frost-ultimate-runtime-v1/atlas.png','/assets/hd/ash-warden-flame-strike-v1/atlas.json','/assets/hd/ash-warden-flame-strike-v1/atlas.png','/assets/hd/ash-warden-melee-combo-v1/atlas.json','/assets/hd/ash-warden-melee-combo-v1/atlas.png',...Array.from({length:4},(_,i)=>[`/assets/hd/ash-warden-v1/${i}.json`,`/assets/hd/ash-warden-v1/${i}.png`]).flat(), '/assets/hd/bosses.json', '/assets/hd/bosses.png', '/assets/hd/core.json', '/assets/hd/core.png', '/assets/hd/enemies.json', '/assets/hd/enemies.png', '/assets/hd/guardian.json', '/assets/hd/guardian.png', '/assets/hd/loot.json', '/assets/hd/loot.png', ...MAGE_HERO.pages.flatMap(p=>[`/assets/hd/mage-hero-v2/${p.index}.json`,`/assets/hd/mage-hero-v2/${p.index}.png`]), '/assets/hd/runner.json', '/assets/hd/runner.png'].sort());
});

for (const width of [1280, 390]) test(`built controller-only shell, movement, mobility and pause ${width}`, async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await mockGamepads(page); await page.goto('/');
  await expect(page.getByRole('button', { name: 'Начать забег' })).toBeVisible(); await connectPad(page);
  await padFocus(page, page.getByRole('button', { name: /^Warrior/ })); await pressPad(page, 'confirm'); await expect(page.getByText('Warrior находится в разработке', { exact: true })).toBeVisible(); await expect(page.getByRole('button', { name: /^Warrior/ })).toHaveAttribute('aria-disabled', 'true');
  await padFocus(page, page.getByRole('button', { name: 'Начать забег' })); await pressPad(page, 'confirm');
  await expect(page.locator('.hero-name')).toContainText('MAGE');
  await stick(page, .6, -.4); await page.waitForTimeout(150); await pressPad(page, 'mobility'); await stick(page, 0, 0);
  await expect(page.locator('.mobility-slot')).toHaveAttribute('aria-label', /Blink · X ·/);
  await pressPad(page, 'pause'); await expect(page.getByRole('dialog', { name: 'Пауза', exact: true })).toBeVisible();
  await padFocus(page, page.getByRole('button', { name: 'Настройки', exact: true })); await pressPad(page, 'confirm');
  await pressPad(page, 'right'); await padFocus(page, page.getByRole('button', { name: 'Готово' })); await pressPad(page, 'confirm');
  await expect(page.getByRole('button', { name: 'Продолжить →' })).toBeFocused(); await pressPad(page, 'confirm');
  await page.screenshot({ path: `screenshots/gamepad/${width}-production.png` });
  expect(await page.evaluate(() => window.__PIXEL__)).toBeUndefined(); expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width); expect(errors).toEqual([]);
});
