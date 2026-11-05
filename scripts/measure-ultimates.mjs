import { register } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
register('./ts-art-loader.mjs', import.meta.url);
const { World } = await import('../src/game/systems/World.ts');
const { applyUpgrade } = await import('../src/game/systems/UpgradeSystem.ts');
const hp = [900, 1020, 1200].map(time => {
  const w = new World(12345, { spawnRate: 0 }); w.elapsed = time;
  const rows = [];
  for (const kind of ['grunt','runner','tank','caster','rusher','splitter','charger','sorcerer','eclipse','guardian']) for (const elite of kind === 'guardian' || ['charger','sorcerer','eclipse'].includes(kind) ? [false] : [false,true]) {
    const e = w.spawn(kind, { x: 180, y: 0 }, elite); rows.push({kind,elite,hp:e.maxHp}); w.enemies = [];
  }
  return {time,rows};
});
const dps = [];
for (const build of ['V','V-damage','V-damage-artifacts']) {
  const w = new World(12345, { spawnRate: 0 }); w.elapsed = 900; w.experience.level = 60; w.encounterDirector.nextAt = 1e9; w.player.invulnerableUntil = 1e9;
  for (const d of w.abilityDefinitions) w.abilities[d.id].level = 5;
  if (build !== 'V') for (const [id,n] of Object.entries({damage:5,cooldown:5,projectiles:3,area:4})) for(let i=0;i<n;i++) applyUpgrade(w,id);
  if (build.endsWith('artifacts')) for(const id of ['damage','cooldown']) for(let i=0;i<3;i++) w.artifacts.grant(w,id);
  const e = w.spawn('tank', {x:65,y:0}); e.hp=e.maxHp=1e9;
  const blink=[]; let total=0; const damage=w.damageEnemy.bind(w); w.damageEnemy=(enemy,n,source)=>{const before=enemy.hp;const result=damage(enemy,n,source);total+=before-enemy.hp;return result;};
  for(let i=0;i<1200;i++) { e.x=65;e.y=0; w.step(.05); w.feedbackEvents=[];w.sounds=[]; if (w.mobility.activate(w,{x:0,y:1})) {blink.push(w.elapsed);w.player.x=w.player.y=0;} }
  dps.push({build,dps:total/60,blinkInterval:blink.length>1?blink[1]-blink[0]:null,effectiveDamage:w.effectiveDamage,effectiveCooldown:w.effectiveCooldown,fixture:'60s fixed20Hz, five rankV; stationary immortal single tank65px, Blink returns only in measurement; no evolutions, no buffs, no incoming damage'});
}
mkdirSync('docs/ultimates',{recursive:true});writeFileSync('docs/ultimates/baseline.json',JSON.stringify({hp,dps},null,2));globalThis.console.log(JSON.stringify({hp,dps},null,2));
