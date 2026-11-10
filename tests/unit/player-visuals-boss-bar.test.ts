import {expect,it,vi} from 'vitest';
import type Phaser from 'phaser';
import {World} from '../../src/game/systems/World';
import {arcaneShield} from '../../src/game/abilities/arcaneShield';
import {drawMageMagic} from '../../src/game/art/MageMagic';
import {drawMobility,drawMobilityUpgrade} from '../../src/game/art/EncounterArt';
import {showPlayerShieldShell} from '../../src/game/art/playerShieldVisuals';
import {PLAYER_VISUALS} from '../../src/game/config/playerVisuals';
import {playerHealthLayout} from '../../src/game/art/PlayerHealthBar';
import {selectedBossBar} from '../../src/ui/bossBar';

it('enables accepted PixelLab Blink/Shield while keeping archived primitive geometry hidden',()=>{
 const w=new World(31,{spawnRate:0});for(const a of Object.values(w.abilities))a.level=0;w.abilities.shield.level=5;
 expect(PLAYER_VISUALS).toEqual({arcaneBlink:true,legacyArcaneBlink:false,arcaneShield:true,legacyArcaneShield:false});expect(arcaneShield(w)).toBe(true);
 const shield=w.shield.absorbValue(w.elapsed);expect(shield).toBeGreaterThan(0);expect(playerHealthLayout(w).absorb).toBeGreaterThan(0);
 w.mobility.variant='absorb-shield';w.mobility.rank=3;expect(w.mobility.activate(w,{x:1,y:0})).toBe(true);expect(w.player.x).toBeGreaterThan(0);
 const fn=vi.fn(),g=new Proxy({}, {get:()=>fn}) as Phaser.GameObjects.Graphics;fn.mockReturnValue(g);
 const before=JSON.stringify(w);drawMageMagic(g,w,1);drawMobility(g,w,w.mobility,1);drawMobilityUpgrade(g,w,w.mobility,1);
 expect(fn).not.toHaveBeenCalled();expect(showPlayerShieldShell(w)).toBe(false);expect(JSON.stringify(w)).toBe(before);
 w.elapsed=w.mobility.protectedUntil+.01;w.player.invulnerableUntil=0;w.damagePlayer(10);expect(w.player.hp).toBe(100);expect(w.absorb).toBeGreaterThan(0);
});
it('leaves Warrior mobility graphics enabled',()=>{
 const w=new World(32,{character:'warrior',spawnRate:0}),fn=vi.fn(),g=new Proxy({}, {get:()=>fn}) as Phaser.GameObjects.Graphics;fn.mockReturnValue(g);
 w.mobility.activate(w,{x:1,y:0});drawMobility(g,w,w.mobility,1);expect(fn).toHaveBeenCalled();expect(showPlayerShieldShell(w)).toBe(true);
});
function setup(){const w=new World(33,{spawnRate:0});const bosses=(['charger','sorcerer','eclipse'] as const).map((kind,i)=>w.spawn(kind,{x:i*100,y:0})!);return{w,bosses};}
it('selects one miniboss before damage and switches to the last actual hit even within the same tick',()=>{
 const {w,bosses:[a,b,c]}=setup();const target=()=>selectedBossBar(w.snapshot().bosses);
 expect(target()?.id).toBe(a!.id);w.damageEnemy(c!,1);expect(target()?.id).toBe(c!.id);
 w.damageEnemy(b!,2);expect(target()?.id).toBe(b!.id);w.damageEnemy(c!,1);expect(target()?.id).toBe(c!.id);
 expect(w.snapshot().bosses).toHaveLength(3);expect(w.snapshot().bosses.map(e=>e.damageOrder)).toEqual([0,2,3]);
});
it('does not switch for zero/invalid damage or regular mobs and falls back to the last hit living miniboss',()=>{
 const {w,bosses:[a,b,c]}=setup(),target=()=>selectedBossBar(w.snapshot().bosses);
 w.damageEnemy(b!,1);w.damageEnemy(c!,1);w.damageEnemy(a!,0);w.damageEnemy(a!,NaN);w.damageEnemy(w.spawn('tank')!,10);
 expect(target()?.id).toBe(c!.id);w.damageEnemy(c!,1e9);expect(target()?.id).toBe(b!.id);
 w.enemies=w.enemies.filter(e=>e.id!==b!.id);expect(target()?.id).toBe(a!.id);
 w.damageEnemy(a!,1e9);expect(target()).toBeUndefined();expect(selectedBossBar(new World().snapshot().bosses)).toBeUndefined();
});
