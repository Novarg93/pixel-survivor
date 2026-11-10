const root='C:/Users/Novarg/Desktop/PixelSurvivor/art/generated/mage-hooded-idle-v1/';
const state=page=>page.evaluate(()=>globalThis.MAGE_IDLE_STATE),assert=(v,message)=>{if(!v)throw Error(message);};
export async function validate(page){
 const errors=[],report=[];page.on('pageerror',e=>errors.push(e.message));
 for(const protocol of ['file','http'])for(const size of [{width:1280,height:720},{width:390,height:844}]){
  await page.setViewportSize(size);await page.goto(protocol==='file'?'file:///'+root+'viewer.html':'http://127.0.0.1:5173/art/generated/mage-hooded-idle-v1/viewer.html');await page.bringToFront();
  await page.waitForFunction(()=>globalThis.MAGE_IDLE_READY||globalThis.MAGE_IDLE_ERROR,{},{timeout:10000});assert(await page.evaluate(()=>!!globalThis.MAGE_IDLE_READY),'Idle loading failed');
  await page.waitForFunction(()=>[...globalThis.document.images].every(i=>i.complete&&i.naturalWidth>0));
  const speeds=[];
  for(const speed of ['0.25','0.5','1','2']){
   await page.selectOption('#speed',speed);const before=await state(page);
   await page.waitForFunction(a=>globalThis.MAGE_IDLE_STATE.age!==a&&globalThis.MAGE_IDLE_STATE.speed===Number(globalThis.document.querySelector('#speed').value),before.age,{polling:'raf',timeout:3000});
   const after=await state(page);assert(after.speed===Number(speed),'Speed value mismatch');speeds.push({speed,clockAdvanced:true});
  }
  await page.locator('#pause').click();const frozen=await state(page);await page.waitForTimeout(180);assert((await state(page)).age===frozen.age,'Paused idle advances');
  await page.locator('#frame').fill('3');assert((await state(page)).frame===3,'Scrub failed');await page.locator('#next').click();assert((await state(page)).frame===0,'Frame wrap failed');await page.locator('#previous').click();assert((await state(page)).frame===3,'Reverse frame wrap failed');
  await page.selectOption('#speed','2');await page.locator('#pause').click();await page.waitForFunction(()=>globalThis.MAGE_IDLE_STATE.age<500&&!globalThis.MAGE_IDLE_STATE.paused,{polling:'raf',timeout:3000});await page.locator('#pause').click();
  await page.locator('#frame').fill('2');const cards=page.locator('.cards'),animated=await cards.screenshot();await page.locator('#source').check();const original=await cards.screenshot();assert(!animated.equals(original),'Original comparison unchanged');await page.locator('#source').uncheck();
  await page.selectOption('#background','grove');assert(!animated.equals(await cards.screenshot()),'Backdrop unchanged');await page.selectOption('#background','neutral');
  const layout=await page.evaluate(()=>{const {document,innerWidth}=globalThis;return{cards:document.querySelectorAll('canvas[data-id]').length,missing:[...document.images].filter(i=>!i.complete||!i.naturalWidth).length,overflow:document.documentElement.scrollWidth>innerWidth};});assert(layout.cards===4&&!layout.missing&&!layout.overflow,'Layout failure');
  await page.screenshot({path:root+'screenshots/'+protocol+'-'+size.width+'.png',fullPage:true});report.push({protocol,...size,...layout,speeds,pauseFrozen:true,frameControls:true,loopWrapped:true,sourceComparison:true,backgroundChanged:true});
 }
 await page.setViewportSize({width:1344,height:900});await page.goto('http://127.0.0.1:5173/art/generated/mage-hooded-idle-v1/viewer.html');await page.bringToFront();await page.waitForFunction(()=>globalThis.MAGE_IDLE_READY);
 const gifs=await page.evaluate(async()=>{
  const {fetch,ImageDecoder,createImageBitmap,OffscreenCanvas}=globalThis,results=[];
  for(const [id,c]of Object.entries(globalThis.MAGE_IDLE.clips)){
   const decoder=new ImageDecoder({data:await(await fetch(c.gif)).arrayBuffer(),type:'image/gif'});await decoder.tracks.ready;
   if(decoder.tracks.selectedTrack.frameCount!==4||decoder.tracks.selectedTrack.repetitionCount!==Infinity)throw Error('GIF frame/loop count '+id);
   let duration=0,differences=0;
   for(let i=0;i<4;i++){
    const {image}=await decoder.decode({frameIndex:i}),rgba=new Uint8Array(96*96*4);duration+=image.duration;await image.copyTo(rgba,{format:'RGBA'});
    const bitmap=await createImageBitmap(await(await fetch(c.frames[i].file)).blob()),canvas=new OffscreenCanvas(96,96),g=canvas.getContext('2d');g.drawImage(bitmap,0,0);const expected=g.getImageData(0,0,96,96).data;
    for(let k=0;k<rgba.length;k+=4)if(rgba[k+3]!==expected[k+3]||expected[k+3]&&(rgba[k]!==expected[k]||rgba[k+1]!==expected[k+1]||rgba[k+2]!==expected[k+2]))differences++;
    image.close();bitmap.close();
   }
   if(duration!==2000000||differences)throw Error('GIF RGBA/timings '+id);results.push({id,frames:4,periodMs:2000,loop:'infinite',rgbaDifferences:differences});decoder.close();
  }return results;
 });
 await page.locator('#pause').click();await page.locator('#frame').fill('2');await page.locator('.cards').screenshot({path:root+'screenshots/idle-four-views.png'});await page.locator('#sheet').screenshot({path:root+'screenshots/idle-four-poses.png'});await page.locator('#world').screenshot({path:root+'screenshots/game-scale.png'});
 assert(!errors.length,'Browser errors');return{report,gifs,errors,pass:true};
}
