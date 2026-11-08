import { test, expect } from '@playwright/test';
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
  expect(artRequests.sort()).toEqual(['/assets/hd/lightning-ultimate-v1/atlas.png','/assets/hd/lightning-ultimate-v1/atlas.json','/assets/hd/regular-lightning-v1/atlas.png','/assets/hd/regular-lightning-v1/atlas.json','/assets/hd/mage-fireball-v1/atlas.png','/assets/hd/mage-fireball-v1/atlas.json','/assets/hd/astral-revenant-v1/atlas.json','/assets/hd/astral-revenant-v1/atlas.png','/assets/hd/briar-beast-v1/atlas.json','/assets/hd/briar-beast-v1/atlas.png','/assets/hd/rune-warden-v1/atlas.json','/assets/hd/rune-warden-v1/atlas.png','/assets/hd/mage-ability-vfx-v1/atlas.json','/assets/hd/mage-ability-vfx-v1/atlas.png','/assets/hd/ash-warden-flame-strike-v1/atlas.json','/assets/hd/ash-warden-flame-strike-v1/atlas.png','/assets/hd/ash-warden-melee-combo-v1/atlas.json','/assets/hd/ash-warden-melee-combo-v1/atlas.png',...Array.from({length:4},(_,i)=>[`/assets/hd/ash-warden-v1/${i}.json`,`/assets/hd/ash-warden-v1/${i}.png`]).flat(), '/assets/hd/bosses.json', '/assets/hd/bosses.png', '/assets/hd/core.json', '/assets/hd/core.png', '/assets/hd/enemies.json', '/assets/hd/enemies.png', '/assets/hd/guardian.json', '/assets/hd/guardian.png', '/assets/hd/loot.json', '/assets/hd/loot.png', '/assets/hd/mage-casting.json', '/assets/hd/mage-casting.png', '/assets/hd/mage.json', '/assets/hd/mage.png', '/assets/hd/runner.json', '/assets/hd/runner.png'].sort());
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
