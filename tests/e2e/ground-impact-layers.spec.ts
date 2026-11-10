import {expect,test,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';

async function advance(page:Page,seconds:number){
  await page.evaluate(seconds=>{
    const w=window.__PIXEL__!.world;w.resume();
    for(let t=0;t<seconds-1e-8;t+=.01)w.step(Math.min(.01,seconds-t));
    w.pause();
  },seconds);
  await page.waitForTimeout(70);
}

for(const viewport of [{width:1280,height:720},{width:390,height:844}]){
  test(`Mage ground impacts stay behind enemies, including north of origin ${viewport.width}`,async({page})=>{
    const directory=`screenshots/ground-impact-layers/${viewport.width}`;
    mkdirSync(directory,{recursive:true});const errors:string[]=[],evidence:unknown[]=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.setViewportSize(viewport);await page.goto('/?test=1');
    await page.getByRole('button',{name:'Начать забег'}).click();
    await page.addStyleTag({content:'.overlay{display:none!important}'});
    for(const y of [0,-6000]){
      await page.evaluate(async y=>{
        const w=window.__PIXEL__!.world;w.pause();w.clearTemporaryState();w.enemies=[];
        w.elapsed+=3;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;
        w.experience.level=30;w.player.x=0;w.player.y=y;w.player.invulnerableUntil=Infinity;
        for(const a of Object.values(w.abilities))a.level=0;
        w.abilities.meteor.level=5;w.abilities.fireball.level=5;
        w.abilities.meteor.readyAt=w.abilities.fireball.readyAt=Infinity;
        for(const [x,dy]of [[42,0],[40,-24],[66,18]]){
          const e=w.spawn('tank',{x,y:y+dy})!;e.speed=0;e.hp=e.maxHp=10000;
        }
        const meteorPath='/src/game/abilities/meteor.ts',fireballPath='/src/game/abilities/fireball.ts';
        const {meteor}=await import(meteorPath),{fireball}=await import(fireballPath);
        w.resume();meteor(w);fireball(w);w.impacts=w.impacts.slice(0,1);w.pause();
      },y);
      await page.waitForTimeout(70);
      const shot=async(name:string)=>{
        const art=await page.evaluate(()=>window.__PIXEL__!.art());
        const enemies=art.actors.filter(a=>String(a.frame).startsWith('tank-'));
        expect(enemies).toHaveLength(3);
        for(const impact of [...art.mageAbilities.active.filter(v=>!v.frame.startsWith('mage-meteor-flight-')),...art.fireball.active]){
          for(const enemy of enemies)expect(impact.depth).toBeLessThan(enemy.depth);
        }
        await page.locator('canvas').screenshot({path:`${directory}/${y}-${name}.png`});
        evidence.push({y,name,meteor:art.mageAbilities.active,fireball:art.fireball.active,enemies});return art;
      };
      let art=await shot('fall');
      expect(art.mageAbilities.active.some(v=>v.frame==='mage-meteor-flight-0'&&v.depth===14.2)).toBe(true);
      await advance(page,.24);art=await shot('landing-and-fireball');
      expect(art.mageAbilities.active.some(v=>v.frame==='mage-meteor-impact-0')).toBe(true);
      expect(art.fireball.active.length).toBeGreaterThan(0);
      const landingPaused=JSON.stringify([art.mageAbilities.active,art.fireball.active]);
      await page.waitForTimeout(100);
      expect(await page.evaluate(()=>JSON.stringify([window.__PIXEL__!.art().mageAbilities.active,window.__PIXEL__!.art().fireball.active]))).toBe(landingPaused);
      await advance(page,.2);art=await shot('explosions');
      expect(art.mageAbilities.active.some(v=>v.frame.startsWith('mage-meteor-impact-'))).toBe(true);
      expect(art.fireball.active.length).toBeGreaterThan(0); // Approved AI impact lasts630ms.
      const paused=JSON.stringify([art.mageAbilities.active,art.fireball.active]);
      await page.waitForTimeout(100);
      expect(await page.evaluate(()=>JSON.stringify([window.__PIXEL__!.art().mageAbilities.active,window.__PIXEL__!.art().fireball.active]))).toBe(paused);
      await advance(page,.46);art=await shot('crater');
      expect(art.mageAbilities.active.some(v=>v.frame.startsWith('mage-meteor-ground-'))).toBe(true);
      expect(art.mageAbilities.active.some(v=>v.frame.startsWith('mage-meteor-impact-'))).toBe(false);
      await advance(page,.35);
      expect(await page.evaluate(()=>window.__PIXEL__!.art().mageAbilities.active)).toEqual([]);
      expect(await page.evaluate(()=>window.__PIXEL__!.art().fireball.active)).toEqual([]);
    }
    await page.evaluate(()=>window.__PIXEL__!.restartScene());
    await page.waitForFunction(()=>window.__PIXEL__?.world.status==='menu');
    expect(await page.evaluate(()=>[window.__PIXEL__!.art().mageAbilities.allocated,window.__PIXEL__!.art().fireball.allocated])).toEqual([0,0]);
    expect(errors).toEqual([]);writeFileSync(`${directory}/evidence.json`,JSON.stringify(evidence,null,2));
  });
}
