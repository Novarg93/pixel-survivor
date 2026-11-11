import { expect,test } from '@playwright/test';
import { mkdirSync,writeFileSync } from 'node:fs';
const directory='screenshots/fire-radius/after',report='docs/fire-radius';
for(const [width,height]of [[1280,720],[844,390]])test(`Fire doubled area and exclusive flame silhouette on actual Canvas ${width}`,async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,viewport:{width,height},hasTouch:width===844}),page=await context.newPage(),errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined}));
  await page.goto('/?test=1');await page.getByRole('button',{name:'Роща осколков',exact:true}).click();await page.getByRole('button',{name:/^Начать забег/}).click();
  await page.evaluate(()=>{
    const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.elapsed=601;w.experience.level=40;w.encounterDirector.nextAt=1e9;w.enemies=[];
    for(const a of Object.values(w.abilities))a.level=0;
    w.abilities.shield.level=5;w.abilities.shield.readyAt=1e9;w.shield.refreshAbsorb(50,w.elapsed+30);w.mobility.variant='absorb-shield';w.mobility.rank=3;w.mobility.refreshAbsorb(25,w.elapsed+30);
    for(const[x,y]of [[130,0],[-130,0],[0,130],[0,-130],[220,0],[-220,0]]){const e=w.spawn('tank',{x,y})!;e.speed=0;e.hp=e.maxHp=1e6;}
    w.ultimate.choose(w,'fire');w.ultimate.activate(w);
    w.effect('shield',w.player,25,0xa5c4ff,20);w.effect('shield',w.player,90,0xa5c4ff,20);
  });
  await page.waitForFunction(()=>window.__PIXEL__!.world.elapsed-window.__PIXEL__!.world.ultimate.started>=.8);
  mkdirSync(directory,{recursive:true});mkdirSync(report,{recursive:true});await page.screenshot({path:`${directory}/form-hud-${width}.png`});
  const result=await page.evaluate(async()=>{
    const w=window.__PIXEL__!.world,canvas=document.querySelector('canvas')!,copy=document.createElement('canvas'),zoom=canvas.width/w.ultimate.viewport.width;
    // Read the rendered silhouette, excluding the intentionally preserved HP/Absorb bar.
    copy.width=Math.round(56*zoom);copy.height=Math.round(52*zoom);const g=copy.getContext('2d')!;
    const snapshot=()=>new Promise<{pixels:Uint8ClampedArray;png:string}>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
      g.clearRect(0,0,copy.width,copy.height);g.drawImage(canvas,Math.round(canvas.width/2-28*zoom),Math.round(canvas.height/2-26*zoom),copy.width,copy.height,0,0,copy.width,copy.height);
      resolve({pixels:g.getImageData(0,0,copy.width,copy.height).data,png:canvas.toDataURL('image/png')});
    })));
    const difference=(a:Uint8ClampedArray,b:Uint8ClampedArray)=>a.reduce((count,value,i)=>count+Number(value!==b[i]),0);
    w.pause();const effects=w.effects,arcane={amount:w.shield.absorbValue(w.elapsed),until:w.shield.absorbUntil},blink={amount:w.mobility.absorbValue(w.elapsed),until:w.mobility.absorbUntil};
    const form=window.__PIXEL__!.art().ultimate.fire,hp=w.player.hp,health=window.__PIXEL__!.art().playerHealth,enemies=w.enemies.map(e=>({x:e.x,y:e.y,hp:e.hp}));
    const active=await snapshot();w.shield.clearAbsorb();w.mobility.clearAbsorb();w.effects=effects.filter(e=>e.kind!=='shield');const bare=await snapshot();
    w.shield.refreshAbsorb(arcane.amount,arcane.until);w.mobility.refreshAbsorb(blink.amount,blink.until);w.effects=effects;
    w.elapsed=w.ultimate.activeUntil+.2;const fading=await snapshot();w.shield.clearAbsorb();w.mobility.clearAbsorb();w.effects=effects.filter(e=>e.kind!=='shield');const fadeBare=await snapshot();
    w.shield.refreshAbsorb(arcane.amount,arcane.until);w.mobility.refreshAbsorb(blink.amount,blink.until);w.effects=effects;
    w.elapsed=w.ultimate.activeUntil+.45;const restored=await snapshot();w.shield.clearAbsorb();w.mobility.clearAbsorb();w.effects=effects.filter(e=>e.kind!=='shield');const restoredBare=await snapshot();
    return{form,hp,health,enemies,activeDifference:difference(active.pixels,bare.pixels),fadeDifference:difference(fading.pixels,fadeBare.pixels),restoredDifference:difference(restored.pixels,restoredBare.pixels),png:active.png,fade:fading.png,restored:restored.png};
  });
  expect(result.form).toMatchObject({radius:164,phase:'form',burning:4,bodyFlames:7});expect(result.form.glowWidth).toBeGreaterThan(400);expect(result.form.glowWidth).toBeLessThan(460);expect(result.form.glowHeight).toBeGreaterThan(300);
  expect(result.enemies.slice(0,4).every(e=>e.hp<1e6)).toBe(true);expect(result.enemies.slice(4).every(e=>e.hp===1e6)).toBe(true);
  expect(result.hp).toBe(100);expect(result.health.absorb).toBe(.75);expect(result.activeDifference).toBe(0);expect(result.fadeDifference).toBe(0);
  // The approved PixelLab shield returns after Fire's exclusive silhouette and fade end.
  expect(result.restoredDifference).toBeGreaterThan(0);
  for(const [label,png]of [['flame-only',result.png],['fade-no-shell',result.fade],['shield-restored',result.restored]])writeFileSync(`${directory}/${label}-${width}.png`,Buffer.from(png.split(',')[1],'base64'));
  writeFileSync(`${report}/canvas-${width}.json`,JSON.stringify({...result,png:undefined,fade:undefined,restored:undefined,errors},null,2));expect(errors).toEqual([]);await context.close();
});
