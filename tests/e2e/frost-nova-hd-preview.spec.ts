import {expect,test} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';

test('native 512 Frost Nova export: all frames, alpha, exact practice size and preview controls',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.setViewportSize({width:1280,height:820});await page.goto('/art/generated/frost-nova-hd-v1/viewer.html');
  await expect(page.locator('#status')).toContainText('508.08 px');await page.getByRole('button',{name:'Пауза',exact:true}).click();
  const sources=await page.evaluate(async()=>{
    const base='/art/main-hero-mage/abilities/frost-nova-hd-v1/frost-nova-hd';
    const data=await (await fetch(base+'.json')).json() as {frames:{frame:{x:number;y:number;w:number;h:number};duration:number}[]},image=new Image();image.src=base+'.png';await image.decode();
    const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d')!;
    const frames=data.frames.map((f:{frame:{x:number;y:number;w:number;h:number};duration:number})=>{
      ctx.clearRect(0,0,512,512);ctx.drawImage(image,f.frame.x,f.frame.y,f.frame.w,f.frame.h,0,0,512,512);const p=ctx.getImageData(0,0,512,512).data;
      let visible=0,partial=0,border=0;for(let y=0;y<512;y++)for(let x=0;x<512;x++){const a=p[(y*512+x)*4+3]!;if(a){visible++;if(a<255)partial++;if(x===0||y===0||x===511||y===511)border++;}}
      return {width:f.frame.w,height:f.frame.h,duration:f.duration,visible,partial,border};
    });return {sheet:{width:image.width,height:image.height},frames};
  });
  expect(sources.sheet).toEqual({width:2560,height:2560});expect(sources.frames).toHaveLength(24);
  expect(sources.frames.every(f=>f.width===512&&f.height===512&&f.duration===50&&f.border===0)).toBe(true);
  expect(sources.frames.slice(0,23).every(f=>f.visible>0&&f.partial>0)).toBe(true);expect(sources.frames[23]!.visible).toBe(0);
  const dir='screenshots/frost-nova-hd-v1';mkdirSync(dir,{recursive:true});
  await page.getByLabel('Кадр',{exact:true}).fill('11');await expect(page.locator('#position')).toHaveText('12 / 24');
  const paused=await page.locator('#old').evaluate((c:HTMLCanvasElement)=>c.toDataURL());await page.waitForTimeout(120);
  expect(await page.locator('#old').evaluate((c:HTMLCanvasElement)=>c.toDataURL())).toBe(paused);
  await page.screenshot({path:`${dir}/comparison-camera-2.png`,fullPage:true});
  await page.getByLabel('Масштаб камеры').selectOption('3');await expect(page.locator('#status')).toContainText('762.12 px');
  expect(await page.locator('#hd').evaluate((c:HTMLCanvasElement)=>c.width)).toBe(811);
  await page.locator('#hd').screenshot({path:`${dir}/hd-camera-3.png`});
  await page.getByLabel('Масштаб камеры').selectOption('2');await page.getByRole('button',{name:'Воспроизвести',exact:true}).click();
  await expect.poll(()=>page.locator('#position').textContent()).not.toBe('12 / 24');
  await page.getByRole('button',{name:'Пауза',exact:true}).click();await page.getByLabel('Кадр',{exact:true}).fill('23');
  for(const id of ['old','hd'])expect(await page.locator('#'+id).evaluate((c:HTMLCanvasElement)=>{const p=c.getContext('2d')!.getImageData(0,0,c.width,c.height).data;return p.some((v,i)=>i%4===3&&v>0);})).toBe(false);
  expect(errors).toEqual([]);writeFileSync(`${dir}/validation.json`,JSON.stringify({sources,errors,practice:{rank:4,area:1.45,radius:127.02,diameterAtZoom2:508.08,oldPixelAtZoom2:3.48,newPixelAtZoom2:508.08/512}},null,2));
});
