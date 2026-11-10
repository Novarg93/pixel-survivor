import {test,expect} from '@playwright/test';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root='art/generated/music-ambient-review-v1';
for(const width of [1280,390])for(const protocol of ['http','file'])test(`ambient music gallery variants, local playback and sequence ${protocol}/${width}`,async({page})=>{
  test.setTimeout(40000);mkdirSync(`${root}/screenshots`,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:width===390?844:900});await page.goto(protocol==='file'?pathToFileURL(resolve(`${root}/viewer.html`)).href:`/${root}/viewer.html`);
  const cards=page.locator('.track');await expect(cards).toHaveCount(5);await expect(page.locator('.variants button')).toHaveCount(20);
  for(const card of await cards.all())await expect(card.locator('.format')).toContainText('1:00');
  expect(await page.locator('audio').evaluateAll(es=>es.every(e=>(e as HTMLAudioElement).paused))).toBe(true);
  for(let i=0;i<5;i++){
    const card=cards.nth(i),audio=card.locator('audio');await card.getByRole('button',{name:'Вариант 4',exact:true}).click();await expect(audio).toHaveAttribute('data-variant','4');await expect(card.locator('.download')).toHaveAttribute('href',/-4\.mp3$/);
    await audio.evaluate(async e=>{await(e as HTMLAudioElement).play();});await expect.poll(()=>audio.evaluate(e=>(e as HTMLAudioElement).currentTime)).toBeGreaterThan(0);
    await expect.poll(()=>audio.evaluate(e=>(e as HTMLAudioElement).duration)).toBeGreaterThan(55);
    expect(await page.locator('audio').evaluateAll(es=>es.filter(e=>!(e as HTMLAudioElement).paused).length)).toBe(1);
  }
  await page.getByLabel('Повторять трек').check();expect(await cards.nth(4).locator('audio').evaluate(e=>(e as HTMLAudioElement).loop)).toBe(true);
  await page.getByRole('button',{name:'▶ Слушать пять тем по порядку'}).click();await expect(page.locator('#sequence')).toHaveAttribute('aria-pressed','true');
  await expect.poll(()=>cards.nth(0).locator('audio').evaluate(e=>(e as HTMLAudioElement).paused)).toBe(false);await expect(page.getByLabel('Повторять трек')).not.toBeChecked();
  await cards.nth(0).locator('audio').evaluate(e=>{const a=e as HTMLAudioElement;a.currentTime=a.duration-.08;});
  await expect.poll(()=>cards.nth(1).locator('audio').evaluate(e=>(e as HTMLAudioElement).paused)).toBe(false);
  await page.locator('#sequence').click();expect(await page.locator('audio').evaluateAll(es=>es.every(e=>(e as HTMLAudioElement).paused))).toBe(true);
  if(protocol==='http'){
    const download=page.waitForEvent('download');await cards.nth(0).locator('.download').click();expect((await download).suggestedFilename()).toBe('01-first-sparks-v4.mp3');
  }else{
    await expect(cards.nth(0).locator('.download')).toHaveText('Открыть MP3 ↗');await expect(cards.nth(0).locator('.download')).toHaveAttribute('target','_blank');
    const popup=page.waitForEvent('popup');await cards.nth(0).locator('.download').click();const source=await popup;await expect.poll(()=>source.url()).toMatch(/01-first-sparks-4\.mp3$/);await source.close();
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);await page.screenshot({path:`${root}/screenshots/${protocol}-${width}.png`,fullPage:true});expect(errors).toEqual([]);
});
test('all20 original MP3 downloads match the stored SHA256',async({request})=>{
  const m=JSON.parse(readFileSync(`${root}/manifest.json`,'utf8')) as{tracks:{takes:{file:string;sha256:string}[]}[]};
  for(const take of m.tracks.flatMap(t=>t.takes)){const response=await request.get(`/${root}/${take.file}`);expect(response.ok(),take.file).toBe(true);expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(take.sha256);}
});
