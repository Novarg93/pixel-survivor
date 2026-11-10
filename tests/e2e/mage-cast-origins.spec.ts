import {expect,test} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const targets=[{id:'north',x:0,y:-1},{id:'north-east',x:1,y:-1},{id:'east',x:1,y:0},{id:'south-east',x:1,y:1},{id:'south',x:0,y:1},{id:'south-west',x:-1,y:1},{id:'west',x:-1,y:0},{id:'north-west',x:-1,y:-1}];
test('actual autocasts spawn at the selected authored hand and only the first Lightning link follows it',async({page})=>{
  test.setTimeout(60000);const root='screenshots/mage-cast-origins';mkdirSync(root,{recursive:true});const records:unknown[]=[],errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();await page.addStyleTag({content:'.overlay{display:none!important}'});
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;w.enemies=[];w.mobility.protectedUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;});
  await page.keyboard.down('w');await page.waitForFunction(()=>window.__PIXEL__!.art().casting.pose?.motion==='run'&&(window.__PIXEL__!.art().casting.pose?.age??0)>.2);
  for(const target of targets)for(const ability of ['fireball','lightning'] as const){
    const birth=await page.evaluate(async({target,ability})=>{
      const w=window.__PIXEL__!.world;w.elapsed+=1;w.enemies=[];
      for(const e of w.effects)e.expires=-1;for(const p of w.projectiles)p.expires=-1;
      w.resume();w.step(0);w.pause();w.feedbackEvents.length=0;
      const length=Math.hypot(target.x,target.y),x=w.player.x+target.x/length*120,y=w.player.y+target.y/length*120;
      for(let i=0;i<(ability==='lightning'?3:1);i++){const e=w.spawn('tank',{x:x-target.y/length*i*45,y:y+target.x/length*i*45})!;e.speed=0;e.hp=e.maxHp=1e7;}
      w.resume();window.dispatchEvent(new KeyboardEvent('keydown',{key:'w',code:'KeyW'}));w.abilities[ability].level=1;w.abilities[ability].readyAt=0;
      return await new Promise<ReturnType<NonNullable<Window['__PIXEL__']>['art']>>(resolve=>{
        const inspect=()=>{const art=window.__PIXEL__!.art(),fresh=ability==='fireball'?art.spellOrigins.projectiles.some(p=>p.captured===w.elapsed):art.spellOrigins.lightning.some(e=>e.started===w.elapsed);
          if(fresh){w.abilities[ability].level=0;w.pause();resolve(art);}else requestAnimationFrame(inspect);};requestAnimationFrame(inspect);
      });
    },{target,ability});
    expect(birth.casting.pose?.phantom).toBeUndefined();expect(birth.casting.pose?.direction).toBe(target.id);expect(birth.casting.authoredCast).toBeDefined();expect(birth.casting.pose?.locomotion?.direction).toBe('north');
    const hand=birth.casting.hands[0]!;expect(hand).toBeDefined();
    if(ability==='fireball'){
      const launch=birth.spellOrigins.projectiles[0]!,sprite=birth.actors.find(a=>a.frame.toString().startsWith('fireball-forming-'))!;
      expect(Math.hypot(sprite.x-hand.x,sprite.y-hand.y)).toBeLessThan(.72);expect(launch.hand).toEqual(hand);expect(launch.hand.y).toBeLessThan(launch.ground.y-5);
    }else{
      expect(birth.spellOrigins.lightning).toHaveLength(1);expect(birth.regularLightning.active[0]).toMatchObject({x:hand.x,y:hand.y});
    }
    await page.screenshot({path:root+'/'+ability+'-to-'+target.id+'-birth.png',clip:{x:1280/2-100,y:720/2-105,width:200,height:170}});
    if(ability==='lightning'){
      await page.evaluate(()=>{window.__PIXEL__!.world.resume();window.dispatchEvent(new KeyboardEvent('keydown',{key:'w',code:'KeyW'}));});
      await page.waitForFunction(()=>{const a=window.__PIXEL__!.art().casting;if((a.pose?.age??0)<.12)return false;window.__PIXEL__!.world.pause();return true;});
      const later=await page.evaluate(()=>{const s=window.__PIXEL__!,a=s.art();return {hands:a.casting.hands,views:a.regularLightning.active,effects:s.world.effects.filter(e=>e.kind==='lightning')};});
      expect(later.views).toHaveLength(3);expect(later.views[0]).toMatchObject(later.hands[0]!);
      for(let i=1;i<3;i++)expect(later.views[i]).toMatchObject({x:later.effects[i]!.x,y:later.effects[i]!.y,toX:later.effects[i]!.target!.x,toY:later.effects[i]!.target!.y});
      await page.screenshot({path:root+'/'+ability+'-to-'+target.id+'-gesture.png',clip:{x:1280/2-100,y:720/2-105,width:200,height:170}});
    }
    records.push({ability,target:target.id,mode:'authored',hand,launches:birth.spellOrigins});
  }
  expect(errors).toEqual([]);writeFileSync(root+'/evidence.json',JSON.stringify({records,errors},null,2));
});

test('standing uses the native body and auto-shots during hurt still start at a physical hand',async({page})=>{
  const records:unknown[]=[];await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;});
  for(const hurt of [false,true])for(const ability of ['fireball','lightning'] as const){
    const snapshot=await page.evaluate(async({hurt,ability})=>{
      const w=window.__PIXEL__!.world;w.elapsed+=1;w.enemies=[];for(const e of w.effects)e.expires=-1;for(const p of w.projectiles)p.expires=-1;w.resume();w.step(0);w.feedbackEvents.length=0;
      const enemy=w.spawn('tank',{x:w.player.x,y:w.player.y+120})!;enemy.speed=0;enemy.hp=enemy.maxHp=1e7;
      if(hurt){w.player.invulnerableUntil=w.mobility.protectedUntil=0;w.damagePlayer(20);}
      w.abilities[ability].level=1;w.abilities[ability].readyAt=0;
      return await new Promise<{art:ReturnType<NonNullable<Window['__PIXEL__']>['art']>;player:{x:number;y:number}}>(resolve=>{
        const sample=()=>{const art=window.__PIXEL__!.art(),fresh=ability==='fireball'?art.spellOrigins.projectiles.some(p=>p.captured===w.elapsed):art.spellOrigins.lightning.some(e=>e.started===w.elapsed);
          if(fresh){w.abilities[ability].level=0;w.pause();resolve({art,player:{x:w.player.x,y:w.player.y}});}else requestAnimationFrame(sample);};requestAnimationFrame(sample);
      });
    },{hurt,ability});
    const a=snapshot.art;expect(a.casting.phantom.visible).toBe(false);expect(a.casting.bodyCropped).toBe(false);
    if(hurt)expect(a.casting.mode).toBe('hurt');else expect(a.heroFrame).toContain('mage-cast-v2-south-');
    if(ability==='fireball'){
      const launch=a.spellOrigins.projectiles[0]!,sprite=a.actors.find(s=>s.frame.toString().startsWith('fireball-forming-'))!;
      expect(launch.hand.y).toBeLessThan(snapshot.player.y-8);expect(Math.hypot(sprite.x-launch.hand.x,sprite.y-launch.hand.y)).toBeLessThan(.72);
    }else expect(a.regularLightning.active[0]!.y).toBeLessThan(snapshot.player.y-8);
    records.push({hurt,ability,...snapshot});
  }
  mkdirSync('screenshots/mage-cast-origins',{recursive:true});writeFileSync('screenshots/mage-cast-origins/fallback.json',JSON.stringify(records,null,2));
});
