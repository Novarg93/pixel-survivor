import {resolve} from 'node:path';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import process from 'node:process';
import {Buffer} from 'node:buffer';
import {ashLayout,ASH_CLIPS} from '../src/game/art/ashGuardPack.ts';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test'),browser=await chromium.launch({channel:'chromium',headless:true});
try{
  const page=await browser.newPage(),layout=ashLayout(),png=readFileSync('public/assets/hd/ash-guard.png').toString('base64');
  const magePng=readFileSync('public/assets/hd/mage.png').toString('base64'),mageFrame=JSON.parse(readFileSync('public/assets/hd/mage.json','utf8')).frames['mage-down-idle-0'].frame;
  const result=await page.evaluate(async({layout,png,clips,magePng,mageFrame})=>{
    const atlas=new globalThis.Image();atlas.src='data:image/png;base64,'+png;await atlas.decode();
    const canvas=globalThis.document.createElement('canvas');canvas.width=1120;canvas.height=Object.keys(clips).length*250;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#243139';c.fillRect(0,0,canvas.width,canvas.height);
    const audit=[];
    for(const [row,pose]of Object.keys(clips).entries()){
      c.fillStyle='#e8dcbf';c.font='15px monospace';c.fillText(pose,12,row*250+18);
      const selected=layout.frames.filter(f=>f.pose===pose&&f.facing==='down');
      for(const [i,index]of [0,Math.floor((selected.length-1)/2),selected.length-1].entries()){
        const f=selected[index];c.drawImage(atlas,f.frame.x,f.frame.y,128,128,10+i*270,row*250+25,224,224);
      }
      const up=layout.frames.find(f=>f.pose===pose&&f.facing==='up'&&f.index===Math.floor((selected.length-1)/2));c.drawImage(atlas,up.frame.x,up.frame.y,128,128,820,row*250+25,224,224);
    }
    const tile=globalThis.document.createElement('canvas');tile.width=tile.height=128;const tc=tile.getContext('2d');
    for(const f of layout.frames){tc.clearRect(0,0,128,128);tc.drawImage(atlas,f.frame.x,f.frame.y,128,128,0,0,128,128);const d=tc.getImageData(0,0,128,128).data;let edge=0,occupied=0;for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(d[(y*128+x)*4+3]){occupied++;if(x===0||y===0||x===127||y===127)edge++;}audit.push({name:f.name,edge,occupied,pixels:tile.toDataURL()});}
    const mage=new globalThis.Image();mage.src='data:image/png;base64,'+magePng;await mage.decode();
    const scale=globalThis.document.createElement('canvas');scale.width=720;scale.height=340;const sc=scale.getContext('2d');sc.imageSmoothingEnabled=false;sc.fillStyle='#243139';sc.fillRect(0,0,720,340);sc.strokeStyle='#677778';sc.beginPath();sc.moveTo(30,270);sc.lineTo(690,270);sc.stroke();
    const idle=layout.frames.find(f=>f.pose==='idle'&&f.facing==='down'&&f.index===0).frame;
    sc.drawImage(atlas,idle.x,idle.y,128,128,370,62,256,256);sc.drawImage(mage,mageFrame.x,mageFrame.y,64,80,154,225,48,60);
    sc.fillStyle='#e8dcbf';sc.font='18px monospace';sc.fillText('Actual game scale x2',30,30);sc.font='14px monospace';sc.fillText('Mage',154,315);sc.fillText('Ash Grove Warden',390,315);
    return{sheet:canvas.toDataURL(),scaleComparison:scale.toDataURL(),audit};
  },{layout,png,clips:ASH_CLIPS,magePng,mageFrame});
  mkdirSync('docs/final-boss',{recursive:true});mkdirSync('screenshots/final-boss',{recursive:true});
  writeFileSync('screenshots/final-boss/contact-sheet.png',Buffer.from(result.sheet.split(',')[1],'base64'));
  writeFileSync('screenshots/final-boss/scale-comparison.png',Buffer.from(result.scaleComparison.split(',')[1],'base64'));
  const rows=result.audit.map(({pixels,...r})=>({...r,bytes:pixels.length})),unique=new Set(result.audit.map(r=>r.pixels)).size;
  writeFileSync('docs/final-boss/art-audit.json',JSON.stringify({unique,frames:rows.length,edge:rows.filter(r=>r.edge),rows},null,2));globalThis.console.log({unique,frames:rows.length,clipped:rows.filter(r=>r.edge).map(r=>r.name)});
}finally{await browser.close();}
