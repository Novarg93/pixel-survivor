import {test,expect} from '@playwright/test';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdirSync} from 'node:fs';

test('Mage Meteor V3 viewer compares the real boss and plays a separate soft light clip offline',async({page})=>{
 const root='art/generated/mage-meteor-v3',screens=root+'/screenshots';mkdirSync(screens,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const seek=(time:number)=>page.locator('#seek').evaluate((element,time)=>{(element as HTMLInputElement).valueAsNumber=time;element.dispatchEvent(new Event('input',{bubbles:true}));},time);
 for(const url of ['/'+root+'/viewer.html',pathToFileURL(resolve(root,'viewer.html')).href]){
  await page.setViewportSize({width:1280,height:1000});await page.goto(url);await expect(page.locator('canvas')).toHaveAttribute('data-ready','true');await page.getByRole('button',{name:'Пауза',exact:true}).click();
  await seek(.12);
  const stable=await page.locator('canvas').screenshot();await page.waitForTimeout(120);expect(await page.locator('canvas').screenshot()).toEqual(stable);
  await page.screenshot({path:screens+`/comparison-${url.startsWith('file:')?'offline':'http'}.png`});
  await page.getByLabel('Режим').selectOption('illumination');await seek(0);
  if(!url.startsWith('file:')){
   const sample=()=>page.locator('canvas').evaluate(el=>{const ctx=(el as HTMLCanvasElement).getContext('2d')!;return{center:[...ctx.getImageData(512,462,1,1).data],edge:[...ctx.getImageData(646,462,1,1).data]};});
   const dark=await sample();await seek(.28);const lit=await sample();expect(lit.center[0]!).toBeGreaterThan(dark.center[0]!);expect(lit.edge).toEqual(dark.edge);
  }else{await seek(.28);}
  await page.screenshot({path:screens+`/light-${url.startsWith('file:')?'offline':'http'}.png`});await page.getByRole('button',{name:'Кадр +'}).click();
  await page.setViewportSize({width:390,height:844});await page.getByLabel('Фон').selectOption('forest');expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);await page.screenshot({path:screens+`/viewer-390-${url.startsWith('file:')?'offline':'http'}.png`});
 }
 expect(errors).toEqual([]);
});
