import {test,expect,type Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root='art/generated/mage-shield-nova-pixellab-v1',screens=root+'/screenshots';
interface ReviewState{loaded:boolean;paused:boolean;time:number;mode:string;selected:string;index:number;runtimeIntegration:boolean;ultimateChanged:boolean}
const state=(page:Page)=>page.evaluate(()=>Reflect.get(globalThis,'SHIELD_NOVA_STATE') as ReviewState);
const seek=(page:Page,time:number)=>page.locator('#seek').evaluate((el,time)=>{(el as HTMLInputElement).valueAsNumber=time;el.dispatchEvent(new Event('input',{bubbles:true}));},time);
for(const offline of [false,true])test(`Shield and ordinary Nova PixelLab preview ${offline?'offline':'HTTP'}: source frames, hollow centre and responsive canvas`,async({page})=>{
 mkdirSync(screens,{recursive:true});const errors:string[]=[],external:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(!/^(file:|http:\/\/127\.0\.0\.1:|data:)/.test(r.url()))external.push(r.url());});
 await page.setViewportSize({width:1280,height:1000});await page.goto(offline?pathToFileURL(resolve(root,'viewer.html')).href:'/'+root+'/viewer.html');await expect(page.locator('#stage')).toHaveAttribute('data-ready','true');
 expect(await state(page)).toMatchObject({runtimeIntegration:true,ultimateChanged:false});await page.getByRole('button',{name:'Пауза',exact:true}).click();await seek(page,.57);
 const before=await page.locator('#stage').screenshot();await page.waitForTimeout(130);expect(await page.locator('#stage').screenshot()).toEqual(before);
 await page.screenshot({path:`${screens}/both-${offline?'offline':'http'}.png`,fullPage:true});
 await page.getByLabel('Режим',{exact:true}).selectOption('shield');await seek(page,.9);const actor=await page.locator('#stage').screenshot();await page.getByLabel('Показать мага',{exact:true}).uncheck();expect(await page.locator('#stage').screenshot()).not.toEqual(actor);await page.locator('#stage').screenshot({path:`${screens}/shield-hollow-${offline?'offline':'http'}.png`});await page.getByLabel('Показать мага',{exact:true}).check();
 await page.getByLabel('Режим',{exact:true}).selectOption('nova');await seek(page,.64);const peak=await page.locator('#stage').screenshot();await page.locator('#stage').screenshot({path:`${screens}/nova-peak-${offline?'offline':'http'}.png`});await seek(page,1.4);expect(await page.locator('#stage').screenshot()).not.toEqual(peak);
 for(const [id,index,count]of [['arcane-shield-loop',4,9],['arcane-shield-fade',8,9],['frost-nova-burst-compact',16,17]] as const){await page.getByLabel('Клип',{exact:true}).selectOption(id);await expect(page.locator('#frames button')).toHaveCount(count);await page.getByRole('button',{name:'Кадр '+index,exact:true}).click();expect(await state(page)).toMatchObject({mode:'frames',selected:id,index,paused:true});await expect(page.locator('#download-frame')).toHaveAttribute('href',new RegExp('/'+String(index).padStart(2,'0')+'\\.png$'));}
 await page.getByRole('button',{name:'Кадр 5',exact:true}).click();await page.getByLabel('Фон',{exact:true}).selectOption('checker');await page.locator('#stage').screenshot({path:`${screens}/nova-native-${offline?'offline':'http'}.png`});
 for(const viewport of [{width:390,height:844},{width:844,height:390}]){await page.setViewportSize(viewport);await page.getByLabel('Режим',{exact:true}).selectOption('both');await page.getByLabel('Фон',{exact:true}).selectOption('forest');await seek(page,.57);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(viewport.width);await page.screenshot({path:`${screens}/viewer-${viewport.width}-${offline?'offline':'http'}.png`,fullPage:true});}
 expect(errors).toEqual([]);expect(external).toEqual([]);
});
test('new spell preview respects reduced motion and can be restarted',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/'+root+'/viewer.html');await expect(page.locator('#stage')).toHaveAttribute('data-ready','true');expect((await state(page)).paused).toBe(true);await page.waitForTimeout(130);expect((await state(page)).time).toBe(0);await page.getByRole('button',{name:'Продолжить',exact:true}).click();await expect.poll(async()=>(await state(page)).time).toBeGreaterThan(.08);await page.getByRole('button',{name:'Пауза',exact:true}).click();await page.getByRole('button',{name:'Сначала',exact:true}).click();expect((await state(page)).time).toBe(0);
});
