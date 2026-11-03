import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
for(const width of [1280,390])test(`boss teleport, volleys and Guardian orbs150+3+3 performance ${width}`,async({page})=>{
  test.setTimeout(45000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:width===390?844:720});await page.goto('/?test=1');await page.getByRole('button',{name:'Начать забег'}).click();
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.elapsed=900;w.experience.level=56;w.options.spawnRate=0;w.encounterDirector.nextAt=1e6;w.player.invulnerableUntil=1e6;w.stats.cooldown=.01;
    for(let i=0;i<6;i++){w.spawn('charger',{x:180,y:0});w.enemies=[];}
    for(const d of w.abilityDefinitions)w.abilities[d.id].level=5;
    for(let i=0;i<150;i++)w.spawn((['grunt','runner','tank','caster','rusher','splitter'] as const)[i%6],{x:(i%15-7)*18,y:(Math.floor(i/15)-4)*22});
    for(const [i,kind] of (['charger','sorcerer','eclipse'] as const).entries())w.spawn(kind,{x:90*(i-1),y:-85});
    for(let i=0;i<3;i++)w.spawn('guardian',{x:i===1?80:-30,y:(i-1)*130});
    for(const g of w.guardians){g.discovered=true;w.damageEnemy(g,1);}for(const e of w.enemies)e.hp=e.maxHp=1e6;
  });
  const samples=[];
  for(let i=0;i<15;i++){const key=['d','s','a','w'][i%4];await page.keyboard.down(key);await page.waitForTimeout(1000);await page.keyboard.up(key);
    const s=await page.evaluate(()=>({metrics:window.__PIXEL__!.metrics(),art:window.__PIXEL__!.art(),orbs:window.__PIXEL__!.world.projectiles.filter(p=>'homing'in p&&p.homing).length}));
    expect(s.metrics.enemies).toBe(150);expect(s.metrics.bosses).toBe(3);expect(s.metrics.guardians).toBe(3);expect(s.metrics.projectiles).toBeLessThanOrEqual(96);expect(s.orbs).toBeLessThanOrEqual(6);samples.push(s);
  }
  mkdirSync('screenshots/boss-guardian',{recursive:true});await page.screenshot({path:`screenshots/boss-guardian/stress-${width}.png`});
  const restarts=[];for(let i=0;i<5;i++){await page.evaluate(()=>window.__PIXEL__!.restartScene());await expect(page.getByRole('button',{name:'Начать забег'})).toBeVisible();await page.waitForTimeout(100);restarts.push(await page.evaluate(()=>{const a=window.__PIXEL__!.art();return{objects:a.objects,textures:a.textures.length,bytes:a.textureBytes,clock:a.clock,tweens:a.tweens,blur:a.blurListeners,bridge:window.__PIXEL__!.listeners()};}));}
  for(const row of restarts)expect(row).toEqual(restarts[0]);expect(errors).toEqual([]);
  const fps=samples.slice(2).map(s=>s.metrics.fps).sort((a,b)=>a-b),ms=samples.slice(2).map(s=>s.metrics.updateMs).sort((a,b)=>a-b);
  mkdirSync('docs/boss-guardian',{recursive:true});writeFileSync(`docs/boss-guardian/${process.env.PIXEL_BOSS_PHASE??'after'}-performance-${width}.json`,JSON.stringify({fixture:'15:00,successive max-tier bosses,150mixed+3boss+3Guardian,5skillsV,max legal CDR; invulnerability and enemy HP ONLY for constant performance load',medianFps:fps[Math.floor(fps.length/2)],sampledP95UpdateMs:ms.at(-1),samples,restarts,errors},null,2));
});
