import {test,expect,type Page} from '@playwright/test';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdirSync,writeFileSync} from 'node:fs';

const root='art/generated/mage-blink-v1',screens=resolve(root,'screenshots');
interface State{mode:string;time:number;age:number;active:boolean;index:number|null;phase:string;heroPoint:string|null;paused:boolean;scale:number;groundScale:number;background:string;screenDistance:number}
const state=(p:Page)=>p.evaluate(()=>Reflect.get(globalThis,'MAGE_BLINK_STATE') as State);
function errors(page:Page){const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});return errors;}
async function open(page:Page,url:string){await page.goto(url);await page.waitForFunction(()=>Reflect.get(globalThis,'MAGE_BLINK_READY'));await expect(page.locator('#status')).not.toHaveClass('error');}
async function seek(page:Page,index:number){await page.locator('#frame').evaluate((el,value)=>{const input=el as HTMLInputElement;input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));},index);}
test('Blink HTTP demo transfers the hero at activation, pauses, steps and finishes each one-shot',async({page})=>{
 mkdirSync(screens,{recursive:true});const issues=errors(page);await page.setViewportSize({width:1280,height:720});await open(page,'/'+root+'/viewer.html');
 await page.selectOption('#speed','0.25');await page.locator('#auto').uncheck();await page.locator('#blink').click();
 expect(await state(page)).toMatchObject({heroPoint:'B',phase:'blink',active:true});
 await page.locator('#pause').click();const frozen=await state(page);await page.waitForTimeout(220);expect(await state(page)).toEqual(frozen);
 await seek(page,0);const evidence:State[]=[];
 for(let i=0;i<8;i++){await seek(page,i);expect(await state(page)).toMatchObject({index:i,age:i*40,paused:true,heroPoint:'B'});evidence.push(await state(page));const opaque=await page.locator('#departure-preview').evaluate(c=>Array.from((c as HTMLCanvasElement).getContext('2d')!.getImageData(0,0,256,256).data).filter((v,i)=>i%4===3&&v>0).length);expect(opaque>0).toBe(i<7);if([0,3,6,7].includes(i))await page.locator('#scene').screenshot({path:resolve(screens,`sequence-frame-${i+1}-1280.png`)});}
 await page.getByRole('button',{name:'Следующий кадр',exact:true}).click();expect((await state(page)).index).toBe(0);await page.getByRole('button',{name:'Предыдущий кадр',exact:true}).click();expect((await state(page)).index).toBe(7);
 await page.selectOption('#speed','2');await page.locator('#blink').click();await page.waitForFunction(()=>Reflect.get(globalThis,'MAGE_BLINK_STATE')?.phase==='settled');await page.waitForTimeout(600);expect(await state(page)).toMatchObject({phase:'settled',heroPoint:'B',index:null});
 await page.locator('#restart').click();expect(await state(page)).toMatchObject({phase:'ready',heroPoint:'A'});
 expect(issues).toEqual([]);writeFileSync(resolve(screens,'http-evidence.json'),JSON.stringify({frames:evidence,instantTransfer:true,pauseFrozen:true,oneShotFinished:true,errors:issues},null,2));
});
for(const [width,height]of [[1280,720],[390,844],[844,390]])test(`standalone Blink viewer ${width}×${height}: both backgrounds, modes, depth and frame controls`,async({page})=>{
 mkdirSync(screens,{recursive:true});const issues=errors(page);await page.setViewportSize({width,height});await open(page,pathToFileURL(resolve(root,'viewer.html')).href);
 await page.selectOption('#mode','compare');await seek(page,3);await expect(page.locator('.frames button')).toHaveCount(16);
 for(const bg of ['grove','forest','checker','neutral']){await page.selectOption('#background',bg);expect(await state(page)).toMatchObject({background:bg,index:3,paused:true});await page.locator('#scene').screenshot({path:resolve(screens,`${bg}-canvas-${width}.png`)});}
 await page.selectOption('#background','forest');await page.screenshot({path:resolve(screens,`viewer-${width}.png`),fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 for(const mode of ['departure','arrival']){await page.selectOption('#mode',mode);await page.getByRole('button',{name:`${mode==='departure'?'A':'B'} · кадр 4`,exact:true}).click();expect(await state(page)).toMatchObject({mode,index:3,paused:true,heroPoint:mode==='departure'?null:'B'});}
 await page.selectOption('#mode','compare');await seek(page,2);const withHero=await page.locator('#scene').screenshot();await page.locator('#hero').uncheck();expect((await page.locator('#scene').screenshot()).equals(withHero)).toBe(false);await page.locator('#hero').check();
 await page.selectOption('#scale','world');expect((await state(page)).scale).toBeCloseTo(46.35814889336016/96);expect((await state(page)).groundScale).toBe(.5);expect(Math.abs((await state(page)).screenDistance-112)).toBeLessThanOrEqual(1);await page.locator('#scene').screenshot({path:resolve(screens,`world-scale-${width}.png`)});
 await page.selectOption('#scale','2');await page.locator('#scene').click();await page.keyboard.press('Space');expect((await state(page)).paused).toBe(false);await page.waitForTimeout(150);await page.keyboard.press('Space');expect((await state(page)).paused).toBe(true);
 expect(issues).toEqual([]);writeFileSync(resolve(screens,`file-evidence-${width}.json`),JSON.stringify({viewport:[width,height],backgrounds:4,frameButtons:16,modeSwitch:true,heroToggleChangesCanvas:true,overflow:false,worldDistance:112,keyboardPause:true,errors:issues},null,2));
});
