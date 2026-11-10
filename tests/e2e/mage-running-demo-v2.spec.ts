import {test,expect,type Page} from '@playwright/test';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdirSync,writeFileSync} from 'node:fs';

const folder='art/main-hero-mage-v2/animation/runing',screens=resolve(folder,'screenshots');
interface DemoState{stage:string;sourceFrame:number;index:number;paused:boolean;runAge:number;travel:number;mode:string;direction:string}
const state=(page:Page)=>page.evaluate(()=>Reflect.get(globalThis,'MAGE_RUN_STATE') as DemoState);
async function open(page:Page,url:string){
 await page.goto(url);await page.waitForFunction(()=>Reflect.get(globalThis,'MAGE_RUN_READY'));
 await expect(page.locator('#status')).not.toHaveClass(/error/);
}
test('running demo plays the full sequence and its three authored transitions on Canvas',async({page})=>{
 mkdirSync(screens,{recursive:true});const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await open(page,'/'+folder+'/viewer.html');await page.selectOption('#speed','2');
 const phases:string[]=[];
 for(const phase of ['start','loop','stop','idle']){
  await page.waitForFunction(stage=>Reflect.get(globalThis,'MAGE_RUN_STATE')?.stage===stage,phase);
  phases.push((await state(page)).stage);
  await page.screenshot({path:resolve(screens,'sequence-'+phase+'-1280.png')});
 }
 expect(phases).toEqual(['start','loop','stop','idle']);expect(errors).toEqual([]);
 await page.selectOption('#mode','loop');await page.getByRole('button',{name:'Пауза',exact:true}).click();
 const a=await state(page);await page.waitForTimeout(250);expect(await state(page)).toEqual(a);
 await page.getByRole('button',{name:'Следующий кадр',exact:true}).click();
 expect((await state(page)).index).toBe((a.index+1)%8);
 await page.getByRole('button',{name:'Предыдущий кадр',exact:true}).click();expect((await state(page)).index).toBe(a.index);
 await page.selectOption('#background','checker');await page.screenshot({path:resolve(screens,'checker-paused-1280.png')});
 await page.selectOption('#background','field');await page.selectOption('#mode','raw-loop');
 await page.locator('#frames button').first().click();expect((await state(page)).sourceFrame).toBe(1);
 await page.getByRole('button',{name:'Бежать',exact:true}).click();expect((await state(page)).stage).toBe('start');
 await page.waitForFunction(()=>Reflect.get(globalThis,'MAGE_RUN_STATE')?.stage==='loop');
 await page.getByRole('button',{name:'Остановиться',exact:true}).click();
 await page.waitForFunction(()=>Reflect.get(globalThis,'MAGE_RUN_STATE')?.stage==='idle');
 expect((await state(page)).mode).toBe('sequence');expect(errors).toEqual([]);
 writeFileSync(resolve(screens,'sequence-evidence.json'),JSON.stringify({phases,pauseUnchanged:true,frameStep:true,manualRunStop:true,errors},null,2));
});
for(const [width,height]of [[1280,720],[390,844],[844,390]])test(`standalone file viewer at ${width}×${height} keeps all 8 phases and controls usable`,async({page})=>{
 mkdirSync(screens,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.setViewportSize({width,height});await open(page,pathToFileURL(resolve(folder,'viewer.html')).href);
 await page.selectOption('#mode','loop');await page.getByRole('button',{name:'Пауза',exact:true}).click();
 await expect(page.locator('#frames .removed')).toHaveCount(5);
 const frames:number[]=[];
 for(let i=0;i<8;i++){
  await page.locator('#frame').evaluate((el,value)=>{const input=el as HTMLInputElement;input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));},i);
  frames.push((await state(page)).sourceFrame);
  if(i===0||i===7)await page.locator('#scene').screenshot({path:resolve(screens,`loop-frame-${i===0?4:11}-${width}.png`)});
 }
 expect(frames).toEqual([4,5,6,7,8,9,10,11]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:resolve(screens,`file-viewer-${width}.png`),fullPage:true});
 await page.locator('#scene').click();await page.keyboard.press('Space');expect((await state(page)).paused).toBe(false);
 await page.waitForTimeout(180);await page.keyboard.press('Space');expect((await state(page)).paused).toBe(true);
 expect(errors).toEqual([]);
 writeFileSync(resolve(screens,`file-evidence-${width}.json`),JSON.stringify({width,height,frames,overflow:false,keyboardPause:true,errors},null,2));
});
test('north demo plays all phases and switches views without retaining old frame indices',async({page})=>{
 const output=resolve(folder,'north/screenshots');mkdirSync(output,{recursive:true});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await open(page,'/'+folder+'/north/viewer.html');expect((await state(page)).direction).toBe('north');
 await page.selectOption('#speed','2');const phases:string[]=[];
 for(const phase of ['start','loop','stop','idle']){
  await page.waitForFunction(stage=>Reflect.get(globalThis,'MAGE_RUN_STATE')?.stage===stage,phase);
  phases.push((await state(page)).stage);await page.screenshot({path:resolve(output,'sequence-'+phase+'-1280.png')});
 }
 await page.selectOption('#mode','raw-loop');await page.getByRole('button',{name:'Кадр 13',exact:true}).click();
 expect((await state(page)).sourceFrame).toBe(13);
 for(let i=0;i<10;i++){
  await page.selectOption('#view',i%2?'north':'front');expect((await state(page)).index).toBeLessThan(13);
 }
 await page.selectOption('#mode','loop');await page.getByRole('button',{name:'Пауза',exact:true}).click();
 expect((await state(page)).direction).toBe('north');
 const snapshot=await state(page);await page.waitForTimeout(250);expect(await state(page)).toEqual(snapshot);
 await page.getByRole('button',{name:'Бежать',exact:true}).click();await page.waitForFunction(()=>Reflect.get(globalThis,'MAGE_RUN_STATE')?.stage==='loop');
 await page.getByRole('button',{name:'Остановиться',exact:true}).click();await page.waitForFunction(()=>Reflect.get(globalThis,'MAGE_RUN_STATE')?.stage==='idle');
 expect(errors).toEqual([]);writeFileSync(resolve(output,'sequence-evidence.json'),JSON.stringify({phases,pause:true,viewSwitches:10,manualStop:true,errors},null,2));
});
for(const [width,height]of [[1280,720],[390,844],[844,390]])test(`north standalone viewer at ${width}×${height} renders all six running poses`,async({page})=>{
 const output=resolve(folder,'north/screenshots');mkdirSync(output,{recursive:true});const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.setViewportSize({width,height});await open(page,pathToFileURL(resolve(folder,'north/viewer.html')).href);
 expect((await state(page)).direction).toBe('north');await page.selectOption('#mode','loop');
 await page.getByRole('button',{name:'Пауза',exact:true}).click();await expect(page.locator('#frames .removed')).toHaveCount(7);
 const frames:number[]=[];
 for(let i=0;i<6;i++){
  await page.locator('#frame').evaluate((el,value)=>{const input=el as HTMLInputElement;input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));},i);
  frames.push((await state(page)).sourceFrame);
  await page.locator('#scene').screenshot({path:resolve(output,`loop-frame-${i+4}-${width}.png`)});
 }
 expect(frames).toEqual([4,5,6,7,8,9]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:resolve(output,`file-viewer-${width}.png`),fullPage:true});
 await page.selectOption('#background','checker');await page.locator('#scene').screenshot({path:resolve(output,`checker-${width}.png`)});
 expect(errors).toEqual([]);writeFileSync(resolve(output,`file-evidence-${width}.json`),JSON.stringify({width,height,direction:'north',frames,overflow:false,errors},null,2));
});
test('north-east demo joins separate source sheets and safely switches all three views and raw modes',async({page})=>{
 const output=resolve(folder,'north-east/screenshots');mkdirSync(output,{recursive:true});const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await open(page,'/'+folder+'/north-east/viewer.html');expect((await state(page)).direction).toBe('north-east');await page.selectOption('#speed','2');
 const phases:string[]=[];
 for(const phase of ['start','loop','stop','idle']){
  await page.waitForFunction(stage=>Reflect.get(globalThis,'MAGE_RUN_STATE')?.stage===stage,phase);
  phases.push((await state(page)).stage);await page.screenshot({path:resolve(output,'sequence-'+phase+'-1280.png')});
 }
 await page.selectOption('#mode','raw-start-end');await page.getByRole('button',{name:'Кадр 13',exact:true}).click();expect((await state(page)).sourceFrame).toBe(13);
 await page.selectOption('#view','front');expect((await state(page)).mode).toBe('sequence');
 await page.selectOption('#view','north');expect((await state(page)).mode).toBe('sequence');
 await page.selectOption('#view','north-east');await page.selectOption('#mode','raw-loop');
 await page.getByRole('button',{name:'Кадр 1',exact:true}).click();expect((await state(page)).sourceFrame).toBe(1);
 for(const view of ['front','north','north-east','front','north','north-east']){await page.selectOption('#view',view);expect((await state(page)).direction).toBe(view);}
 await page.getByRole('button',{name:'Бежать',exact:true}).click();await page.waitForFunction(()=>Reflect.get(globalThis,'MAGE_RUN_STATE')?.stage==='loop');
 await page.getByRole('button',{name:'Остановиться',exact:true}).click();await page.waitForFunction(()=>Reflect.get(globalThis,'MAGE_RUN_STATE')?.stage==='idle');
 expect(errors).toEqual([]);writeFileSync(resolve(output,'sequence-evidence.json'),JSON.stringify({phases,bothRawSheets:true,modeFallback:true,manualStop:true,viewSwitches:9,errors},null,2));
});
for(const [width,height]of [[1280,720],[390,844],[844,390]])test(`north-east standalone viewer at ${width}×${height} renders the trimmed cycle and pauses`,async({page})=>{
 const output=resolve(folder,'north-east/screenshots');mkdirSync(output,{recursive:true});const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.setViewportSize({width,height});await open(page,pathToFileURL(resolve(folder,'north-east/viewer.html')).href);
 expect((await state(page)).direction).toBe('north-east');await page.selectOption('#mode','loop');
 await page.getByRole('button',{name:'Пауза',exact:true}).click();await expect(page.locator('#frames .removed')).toHaveCount(7);
 const frames:number[]=[];
 for(let i=0;i<6;i++){
  await page.locator('#frame').evaluate((el,value)=>{const input=el as HTMLInputElement;input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));},i);
  frames.push((await state(page)).sourceFrame);await page.locator('#scene').screenshot({path:resolve(output,`loop-frame-${i+5}-${width}.png`)});
 }
 expect(frames).toEqual([5,6,7,8,9,10]);const stopped=await state(page);await page.waitForTimeout(180);expect(await state(page)).toEqual(stopped);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:resolve(output,`file-viewer-${width}.png`),fullPage:true});
 await page.selectOption('#background','checker');await page.locator('#scene').screenshot({path:resolve(output,`checker-${width}.png`)});
 expect(errors).toEqual([]);writeFileSync(resolve(output,`file-evidence-${width}.json`),JSON.stringify({width,height,direction:'north-east',frames,pause:true,overflow:false,errors},null,2));
});
