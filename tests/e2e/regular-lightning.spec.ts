import {expect,test,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
async function advance(page:Page,seconds:number){await page.evaluate(s=>{const w=window.__PIXEL__!.world;w.resume();for(let t=0;t<s-1e-8;t+=.01)w.step(Math.min(.01,s-t));w.pause();},seconds);await page.waitForTimeout(60);}
for(const rank of [1,5])for(const viewport of [{width:1280,height:720},{width:844,height:390}])test(`regular lightning chain rank${rank} native animation, endpoints, pause and cleanup ${viewport.width}`,async({page})=>{
  const directory=`screenshots/regular-lightning-v1/rank-${rank}-${viewport.width}`;mkdirSync(directory,{recursive:true});const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||m.type()==='warning'&&/Texture|Frame/.test(m.text()))errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.setViewportSize(viewport);await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();await page.addStyleTag({content:'.overlay{display:none!important}'});
  await page.evaluate(async rank=>{const w=window.__PIXEL__!.world;w.pause();w.elapsed=rank===5?915:20;w.clearTemporaryState();w.enemies=[];w.effects=[];w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.player.invulnerableUntil=Infinity;w.experience.level=30;for(const a of Object.values(w.abilities))a.level=0;w.abilities.lightning.level=rank;w.abilities.lightning.readyAt=Infinity;
    for(const [x,y]of [[70,0],[100,-60],[20,-90],[-60,-50],[-90,10],[-30,60],[45,65]]){const e=w.spawn('tank',{x,y})!;e.speed=0;e.hp=e.maxHp=1e4;}
    const path='/src/game/abilities/chainLightning.ts';const {chainLightning}=await import(path);chainLightning(w);},rank);
  const art=()=>page.evaluate(()=>window.__PIXEL__!.art()),shot=async(name:string)=>page.locator('canvas').screenshot({path:`${directory}/${name}.png`});
  await page.waitForTimeout(65);expect((await art()).regularLightning.active).toHaveLength(rank+2);await shot('start');await advance(page,.045);expect((await art()).regularLightning.active.every(v=>v.frame==='regular-lightning-6'&&v.height===36)).toBe(true);await shot('strike');
  await advance(page,.055);expect((await art()).regularLightning.active.every(v=>v.frame==='regular-lightning-14')).toBe(true);await shot('hold');
  const paused=JSON.stringify((await art()).regularLightning.active);await page.waitForTimeout(100);expect(JSON.stringify((await art()).regularLightning.active)).toBe(paused);
  if(viewport.width===844){await page.setViewportSize({width:390,height:844});await page.waitForTimeout(65);await shot('portrait');await page.setViewportSize(viewport);}
  await advance(page,.05);await shot('fade');await advance(page,.071);expect((await art()).regularLightning.active).toEqual([]);await shot('done');
  // Regular renderer stays empty when only the lightning ultimate is running.
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.abilities.lightning.level=0;w.elapsed=Math.max(601,w.elapsed);w.ultimate.choose(w,'lightning');w.resume();w.ultimate.activate(w);w.pause();});await advance(page,.05);expect((await art()).regularLightning.active).toEqual([]);expect(await page.evaluate(()=>window.__PIXEL__!.world.ultimate.casting)).toBe(true);await shot('ultimate-separate');
  await page.evaluate(()=>window.__PIXEL__!.restartScene());await page.waitForFunction(()=>window.__PIXEL__?.world.status==='menu');expect((await art()).regularLightning.allocated).toBe(0);expect((await art()).clock).toEqual([0,0,0]);await expect(page.locator('canvas')).toHaveCount(1);expect(errors).toEqual([]);writeFileSync(`${directory}/evidence.json`,JSON.stringify({rank,viewport,errors},null,2));
});
