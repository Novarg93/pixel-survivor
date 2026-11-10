import {test,expect,type Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root='art/generated/mage-spells-pixellab-ai-v1',screens=root+'/screenshots';
interface ReviewState{loaded:boolean;mode:string;paused:boolean;time:number;selected:string;selectedFrame:number;zoom:number;background:string;runtimeIntegration:boolean;rawPath:string}
const state=(page:Page)=>page.evaluate(()=>Reflect.get(globalThis,'PIXELLAB_REVIEW_STATE') as ReviewState);
const seek=(page:Page,time:number)=>page.locator('#seek').evaluate((el,time)=>{(el as HTMLInputElement).valueAsNumber=time;el.dispatchEvent(new Event('input',{bubbles:true}));},time);
for(const offline of [false,true])test(`PixelLab AI preview ${offline?'offline file':'HTTP'}: effects, sources, light and three viewports`,async({page})=>{
 mkdirSync(screens,{recursive:true});const errors:string[]=[],external:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('request',r=>{if(!r.url().startsWith('file:')&&!r.url().startsWith('http://127.0.0.1:')&&!r.url().startsWith('data:'))external.push(r.url());});
 await page.setViewportSize({width:1280,height:1000});await page.goto(offline?pathToFileURL(resolve(root,'viewer.html')).href:'/'+root+'/viewer.html');await expect(page.locator('#stage')).toHaveAttribute('data-ready','true');
 expect((await state(page)).runtimeIntegration).toBe(true);await expect(page.getByText('Одобрено · эффекты в игре')).toBeVisible();await page.getByRole('button',{name:'Пауза',exact:true}).click();await seek(page,.36);
 const before=await page.locator('#stage').screenshot();await page.waitForTimeout(130);expect(await page.locator('#stage').screenshot()).toEqual(before);
 await page.screenshot({path:`${screens}/compare-${offline?'offline':'http'}.png`,fullPage:true});
 await page.getByLabel('Режим',{exact:true}).selectOption('fireball');await seek(page,.96);await page.locator('#stage').screenshot({path:`${screens}/fireball-impact-${offline?'offline':'http'}.png`});
 await page.getByLabel('Режим',{exact:true}).selectOption('meteor');await seek(page,.38);await page.locator('#stage').screenshot({path:`${screens}/meteor-flight-${offline?'offline':'http'}.png`});
 await seek(page,.98);await page.locator('#stage').screenshot({path:`${screens}/meteor-impact-${offline?'offline':'http'}.png`});
 await page.getByLabel('Режим',{exact:true}).selectOption('light');await seek(page,0);const lit=await page.locator('#stage').screenshot();await seek(page,.8);expect(await page.locator('#stage').screenshot()).not.toEqual(lit);
 await seek(page,0);await page.locator('#stage').screenshot({path:`${screens}/light-${offline?'offline':'http'}.png`});
 for(const id of ['fireball-flight','meteor-flight','meteor-impact','meteor-impact-first','landing-light-fade']){
  await page.getByLabel('Клип',{exact:true}).selectOption(id);await page.getByRole('button',{name:'Кадр 4',exact:true}).click();expect(await state(page)).toMatchObject({mode:'frames',paused:true,selected:id,selectedFrame:4});await expect(page.locator('#download-frame')).toHaveAttribute('href',/\/04\.png$/);
 }
 await page.getByLabel('Масштаб',{exact:true}).selectOption('3');await page.getByLabel('Фон',{exact:true}).selectOption('checker');await page.locator('#stage').screenshot({path:`${screens}/native-frames-${offline?'offline':'http'}.png`});
 for(const viewport of [{width:390,height:844},{width:844,height:390}]){await page.setViewportSize(viewport);await page.getByLabel('Режим',{exact:true}).selectOption('compare');await page.getByLabel('Фон',{exact:true}).selectOption('forest');await page.getByLabel('Масштаб',{exact:true}).selectOption('2');await seek(page,.4);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(viewport.width);await page.screenshot({path:`${screens}/viewer-${viewport.width}-${offline?'offline':'http'}.png`,fullPage:true});}
 expect(errors).toEqual([]);expect(external).toEqual([]);
});
test('PixelLab preview respects reduced motion, then plays only after an explicit click',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/'+root+'/viewer.html');await expect(page.locator('#stage')).toHaveAttribute('data-ready','true');expect((await state(page)).paused).toBe(true);await page.waitForTimeout(130);expect((await state(page)).time).toBe(0);
 await page.getByRole('button',{name:'Продолжить',exact:true}).click();await expect.poll(async()=>(await state(page)).time).toBeGreaterThan(.08);await page.getByRole('button',{name:'Пауза',exact:true}).click();await page.getByRole('button',{name:'Сначала',exact:true}).click();expect((await state(page)).time).toBe(0);
});
