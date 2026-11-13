import {wardenApprovedHash} from '../helpers/approvedWardenIntegration';
import {test,expect} from '@playwright/test';
import {readFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

test('empty hand throw review works offline, preserves windup and runtime',async({page,context})=>{
 const root='art/generated/warrior-spear-empty-hand-review-v1';
 const hash=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
 const manifest=JSON.parse(readFileSync(`${root}/manifest.json`,'utf8')) as {changes:{index:number;source:string;sourceSHA256:string;editedSHA256:string;clip:string}[]};
 for(const f of manifest.changes){
  expect(hash(f.source)).toBe(f.sourceSHA256);
  expect(hash(`${root}/frames/${f.clip}-${String(f.index).padStart(2,'0')}.png`)).toBe(f.editedSHA256);
  if(f.index<5)expect(f.editedSHA256).toBe(f.sourceSHA256);
 }
 const baseline=JSON.parse(readFileSync(`${root}/source/runtime-baseline.json`,'utf8')) as Record<string,string>;
 for(const [file,sha] of Object.entries(baseline))expect(hash(file)).toBe(wardenApprovedHash(file,sha));
 await context.setOffline(true);const errors:string[]=[],http:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().startsWith('http'))http.push(r.url());});
 await page.goto(pathToFileURL(resolve(`${root}/viewer.html`)).href);
 await expect(page.locator('#loading')).toBeHidden();await page.locator('#play').click();
 mkdirSync('screenshots/warrior-spear-empty-hand-review-v1',{recursive:true});
 for(const direction of ['south','south-east','east','north-east','north','north-west','west','south-west']){
  await page.locator('#direction').selectOption(direction);
  await page.getByRole('button',{name:'Кадр 6',exact:true}).click();
  expect(await page.locator('#original').evaluate(c=>(c as HTMLCanvasElement).toDataURL())).not.toBe(await page.locator('#edited').evaluate(c=>(c as HTMLCanvasElement).toDataURL()));
  await expect(page.locator('#clock')).toContainText('6 / 13');
  if(direction==='south'||direction==='north')await page.screenshot({path:`screenshots/warrior-spear-empty-hand-review-v1/${direction}.png`,fullPage:true});
 }
 await page.locator('#next').click();await expect(page.locator('#clock')).toContainText('7 / 13');
 await page.locator('#previous').click();await expect(page.locator('#clock')).toContainText('6 / 13');
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await page.screenshot({path:'screenshots/warrior-spear-empty-hand-review-v1/mobile.png',fullPage:true});
 expect(http).toEqual([]);expect(errors).toEqual([]);
});

test('ultimate throw keeps an empty hand through release and return in eight directions',async({page,context})=>{
 await context.setOffline(true);const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(resolve('art/generated/warrior-spear-empty-hand-review-v1/viewer.html')).href);
 await expect(page.locator('#loading')).toBeHidden();await page.locator('#play').click();
 await page.getByRole('button',{name:'Таранное копьё · ульта',exact:true}).click();
 const root='screenshots/warrior-spear-empty-hand-review-v1';mkdirSync(root,{recursive:true});
 const pixels=(id:string)=>page.locator(id).evaluate(c=>(c as HTMLCanvasElement).toDataURL());
 for(const direction of ['south','south-east','east','north-east','north','north-west','west','south-west']){
  await page.locator('#direction').selectOption(direction);
  const count=direction.startsWith('north')?13:12;
  await page.getByRole('button',{name:'Кадр 5',exact:true}).click();
  expect(await pixels('#edited')).toBe(await pixels('#original'));
  await page.getByRole('button',{name:'Кадр 6',exact:true}).click();
  await expect(page.locator('#clock')).toContainText(`6 / ${count}`);
  expect(await pixels('#edited')).not.toBe(await pixels('#original'));
  if(direction==='south'||direction==='north')await page.screenshot({path:`${root}/ultimate-${direction}-release.png`,fullPage:true});
  await page.getByRole('button',{name:`Кадр ${count}`,exact:true}).click();
  expect(await pixels('#edited')).not.toBe(await pixels('#original'));
  if(direction==='south')await page.screenshot({path:`${root}/ultimate-south-return.png`,fullPage:true});
 }
 await page.locator('#direction').selectOption('south');await page.getByRole('button',{name:'Кадр 12',exact:true}).click();
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await page.screenshot({path:`${root}/ultimate-mobile.png`,fullPage:true});
 expect(errors).toEqual([]);
});
