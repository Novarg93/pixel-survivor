const root='C:/Users/Novarg/Desktop/PixelSurvivor/art/generated/mage-hooded-front-back-cast-v2/';
const state=page=>page.evaluate(()=>globalThis.FRONT_BACK_STATE),assert=(x,m)=>{if(!x)throw Error(m);};
export async function validate(page){
 const errors=[],report=[];page.on('pageerror',e=>errors.push(e.message));
 for(const protocol of ['file','http'])for(const size of [{width:1280,height:720},{width:390,height:844}]){
  await page.setViewportSize(size);await page.goto(protocol==='file'?'file:///'+root+'viewer.html':'http://127.0.0.1:5173/art/generated/mage-hooded-front-back-cast-v2/viewer.html');
  await page.waitForFunction(()=>globalThis.FRONT_BACK_READY||globalThis.FRONT_BACK_ERROR,{},{timeout:10000});assert(await page.evaluate(()=>!!globalThis.FRONT_BACK_READY),'Loading failed');
  await page.waitForFunction(()=>[...globalThis.document.images].every(i=>i.complete&&i.naturalWidth>0));
  const speeds=[];for(const speed of ['0.25','0.5','1','2']){
   await page.selectOption('#direction','e');await page.selectOption('#speed',speed);const a=await state(page);await page.waitForTimeout(140);const b=await state(page),delta=(b.age-a.age+880)%880;assert(delta>0,'No animation advance');speeds.push({speed,deltaMs:delta});
  }
  await page.locator('#pause').click();const a=await state(page);await page.waitForTimeout(180);assert((await state(page)).age===a.age,'Pause advances');
  const directions=[];
  for(const key of ['n','ne','e','se','s','sw','w','nw']){
   await page.selectOption('#direction',key);await page.locator('#frame').fill('3');let s=await state(page);
   const body=['n','ne','nw'].includes(key)?'north':'front',mirror=['ne','w','sw'].includes(key);
   assert(s.target===key&&s.body===body&&s.flipX===mirror&&s.frame===3,'Wrong body/target mapping');
   await page.locator('#next').click();assert((await state(page)).frame===4,'Next frame failed');await page.locator('#previous').click();s=await state(page);assert(s.frame===3,'Previous failed');
   directions.push({target:key,body:s.body,flipX:s.flipX,baseFile:s.baseFile});
  }
  const canvas=page.locator('#stage');await page.selectOption('#background','neutral');const p=await canvas.screenshot();await page.selectOption('#background','grove');assert(!p.equals(await canvas.screenshot()),'Backdrop did not change');
  await page.locator('#targetMode').check();
  for(const [key,x,y]of [['n',900,20],['ne',1100,50],['e',1150,250],['se',1100,450],['s',900,500],['sw',700,450],['w',650,250],['nw',700,50]]){
   const box=await canvas.boundingBox();await canvas.dispatchEvent('pointerdown',{clientX:box.x+x*box.width/1280,clientY:box.y+y*box.height/560});assert((await state(page)).target===key,'Target click failed '+key);
  }
  await page.selectOption('#direction','e');await page.locator('#frame').fill('3');await page.selectOption('#background','neutral');
  const layout=await page.evaluate(()=>{const {document,innerWidth}=globalThis;return{images:document.images.length,missing:[...document.images].filter(i=>!i.complete||!i.naturalWidth).length,overflow:document.documentElement.scrollWidth>innerWidth};});assert(!layout.missing&&!layout.overflow,'Layout failure');
  await page.screenshot({path:root+'screenshots/'+protocol+'-'+size.width+'.png',fullPage:true});report.push({protocol,...size,...layout,speeds,pauseFrozen:true,frameControls:true,directions,targetCases:8,backgroundChanged:true});
 }
 await page.setViewportSize({width:1344,height:900});await page.goto('http://127.0.0.1:5173/art/generated/mage-hooded-front-back-cast-v2/viewer.html');await page.waitForFunction(()=>globalThis.FRONT_BACK_READY);
 const gifs=await page.evaluate(async()=>{
  const {fetch,ImageDecoder,createImageBitmap,OffscreenCanvas}=globalThis,results=[];
  for(const [key,c]of Object.entries(globalThis.FRONT_BACK_CAST.clips)){
   const decoder=new ImageDecoder({data:await(await fetch(c.gif)).arrayBuffer(),type:'image/gif'});await decoder.tracks.ready;
   if(decoder.tracks.selectedTrack.frameCount!==6||decoder.tracks.selectedTrack.repetitionCount!==0)throw Error('GIF frames/loop '+key);
   let duration=0,differences=0;
   for(let i=0;i<6;i++){
    const {image}=await decoder.decode({frameIndex:i}),rgba=new Uint8Array(96*96*4);duration+=image.duration;await image.copyTo(rgba,{format:'RGBA'});
    const bitmap=await createImageBitmap(await(await fetch(c.frames[i].file)).blob()),canvas=new OffscreenCanvas(96,96),g=canvas.getContext('2d');g.drawImage(bitmap,0,0);const expected=g.getImageData(0,0,96,96).data;
    for(let k=0;k<rgba.length;k+=4)if(rgba[k+3]!==expected[k+3]||expected[k+3]&&(rgba[k]!==expected[k]||rgba[k+1]!==expected[k+1]||rgba[k+2]!==expected[k+2]))differences++;
    image.close();bitmap.close();
   }
   if(duration!==480000||differences)throw Error('GIF RGBA/timing '+key);results.push({key,frames:6,durationMs:480,repetitionCount:0,rgbaDifferences:differences});decoder.close();
  }return results;
 });
 await page.locator('#pause').click();for(const key of ['e','se','s','sw','w','nw','n','ne']){
  await page.selectOption('#direction',key);await page.locator('#frame').fill('3');await page.locator('#stage').screenshot({path:root+'screenshots/'+key+'-base-and-release.png'});await page.locator('#sheet').screenshot({path:root+'screenshots/'+key+'-poses.png'});
 }
 await page.locator('#compass').screenshot({path:root+'screenshots/eight-directions.png'});await page.locator('#world').screenshot({path:root+'screenshots/game-scale.png'});assert(!errors.length,'Browser errors');return{report,gifs,errors,pass:true};
}
