import { expect, test } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { copyFileSync, mkdirSync } from 'node:fs';

const source='art/generated/warrior-ultimates-animation-review-v1/viewer.html';
const directory='screenshots/warrior-ultimates-animation-review-v1';
test('one copied HTML works offline with three ultimates and all24 directional views',async({browser})=>{
  mkdirSync('.tmp/standalone-ultimate-review',{recursive:true});
  const copied='.tmp/standalone-ultimate-review/viewer.html';copyFileSync(source,copied);
  const context=await browser.newContext({offline:true,viewport:{width:1440,height:1000}}),page=await context.newPage(),errors:string[]=[],network:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
  try{
    await page.goto(pathToFileURL(resolve(copied)).href);await expect(page.locator('#loading')).toBeHidden();
    await expect(page.locator('iframe,script[src],link[rel="stylesheet"]')).toHaveCount(0);
    await page.locator('#play').click();mkdirSync(directory,{recursive:true});
    for(const kind of ['ruin','earthbreaker','banner']){
      await page.locator(`[data-ultimate="${kind}"]`).click();await page.locator('#direction').selectOption('all');
      await page.locator('#time').fill(kind==='banner'?'600':'900');
      await expect(page.locator('.view:visible')).toHaveCount(8);await expect(page.locator('canvas:visible')).toHaveCount(8);
      const pixels=await page.locator('canvas').evaluateAll(nodes=>nodes.map(node=>(node as HTMLCanvasElement).toDataURL()));
      expect(new Set(pixels).size).toBeGreaterThanOrEqual(6);
      const frozen=await page.locator('#time').inputValue();await page.waitForTimeout(100);expect(await page.locator('#time').inputValue()).toBe(frozen);
      await page.screenshot({path:`${directory}/${kind}-eight-1440.png`,fullPage:true});
      await page.locator('#step').click();expect(Number(await page.locator('#time').inputValue())-Number(frozen)).toBe(75);
      await page.locator('#direction').selectOption('north-west');await expect(page.locator('.view:visible')).toHaveCount(1);
      await expect(page.locator('.view:visible')).toHaveAttribute('data-direction','north-west');
      await page.locator('#effects').uncheck();const body=await page.locator('canvas:visible').evaluate(node=>(node as HTMLCanvasElement).toDataURL());
      await page.locator('#effects').check();expect(await page.locator('canvas:visible').evaluate(node=>(node as HTMLCanvasElement).toDataURL())).not.toBe(body);
      await page.screenshot({path:`${directory}/${kind}-north-west-focus.png`,fullPage:true});
    }
    await page.locator('#speed').selectOption('.25');await page.locator('#play').click();const before=Number(await page.locator('#time').inputValue());
    await page.waitForTimeout(200);await page.locator('#play').click();const advanced=Number(await page.locator('#time').inputValue())-before;
    expect(advanced).toBeGreaterThan(0);expect(advanced).toBeLessThan(200);expect(network).toEqual([]);expect(errors).toEqual([]);
  }finally{await context.close();}
});
test('offline animation grid and focused view fit390px',async({browser})=>{
  const context=await browser.newContext({offline:true,viewport:{width:390,height:844}}),page=await context.newPage();
  try{
    await page.goto(pathToFileURL(resolve(source)).href);await expect(page.locator('#loading')).toBeHidden();
    await page.locator('#play').click();await page.locator('[data-ultimate="earthbreaker"]').click();await page.locator('#time').fill('850');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    mkdirSync(directory,{recursive:true});await page.screenshot({path:`${directory}/grid-390.png`,fullPage:true});
    await page.getByRole('button',{name:'Увеличить: Север',exact:true}).click();await expect(page.locator('canvas:visible')).toHaveCount(1);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`${directory}/focus-390.png`,fullPage:true});
  }finally{await context.close();}
});
