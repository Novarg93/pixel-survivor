import {ASTRAL_VFX} from '../config/astralRevenant';
import {NecroticFlameWalls} from './NecroticFlameWalls';
import { FinalEncounter } from './FinalEncounter';
import { UltimateSystem } from '../ultimates/UltimateSystem';
import { FINAL_BOSS } from '../config/finalBoss';
import { advanceUltimateFreeze, ultimateFrozen } from './UltimateFreeze';
import { enemyShielded, onSpecialDeath } from './SpecialEnemies';
import { BALANCE, GUARDIAN_BALANCE } from '../config/gameBalance';
import { ENEMIES, ENEMY_NAMES, isBossKind, type EnemyKind } from '../config/enemyDefinitions';
import type { Enemy, Projectile, Effect, XpOrb, Impact, Zone, DamageSource } from '../entities/types';
import { evolved, shieldPulse } from '../abilities/evolutions';
import { SeededRandom } from '../utils/SeededRandom';
import { direction, distance, nearest, segmentDistance, type Point } from '../utils/math';
import { spawnPerimeter } from './SpawnSystem';
import { receiveDamage } from './CombatSystem';
import { ExperienceSystem, xpThreshold } from './ExperienceSystem';
import { ObjectPool } from './ObjectPool';
import { chooseUpgrades, applyUpgrade, type UpgradeDefinition } from './UpgradeSystem';
import { initialAbilities, ABILITIES, abilitiesFor } from '../abilities/definitions';
import { CHARACTERS, type CharacterId } from '../config/characters';
import { playableMap, type BiomeId } from '../config/biomes';
import { tickAbilities } from '../abilities/tickAbilities';
import { profileAt, pickEnemy, scalesAt, spawnCadenceAt } from './DifficultyDirector';
import { enrageAt } from '../config/survivalEnrage';
import { AbsorbPool } from './AbsorbPool';
import {ENDGAME,lateBossProfile} from '../config/endgame';
import {GUARDIAN_ORBS} from '../config/guardianOrbs';
import {steerGuardianOrb} from './GuardianOrbs';
import { EnemySystem } from './EnemySystem';
import { BOSS_CAP } from './BossSystem';
import { EncounterDirector } from './EncounterDirector';
import { bossBirthAggression, BOSS_MAGIC } from '../config/bossEnrage';
import { CHARGE_BOSS } from '../config/chargeBoss';
import { RUNE_WARDEN_VFX } from '../config/runeWarden';
import { duelPractice, type PracticeBoss } from '../config/bossPractice';
import { MOBILITY_UPGRADES } from '../config/mobilityUpgrades';
import type { LegacyCue, GameFeedback } from '../events/gameFeedback';
import { ScoreSystem } from './ScoreSystem';
import { SpawnClock } from './SpawnClock';
import { BuffSystem } from '../loot/BuffSystem';
import { LootSystem } from '../loot/LootSystem';
import { ArtifactSystem } from '../loot/ArtifactSystem';
import { RareGuardianSystem, guardianVisible } from './RareGuardianSystem';
import { MobilitySystem } from './MobilitySystem';
import { formationEdge, pressureAt } from './EndgamePressure';
import type { MovementInput } from '../input/movement';
export interface RunOptions { spawnRate?: number; character?: CharacterId; biome?: BiomeId }

// Phaser Scene is the sole runtime caller; this state has no timers, DOM or render dependencies.
export class World {
  readonly rng: SeededRandom;
  readonly buffs = new BuffSystem();
  readonly loot: LootSystem;
  readonly artifacts: ArtifactSystem;
  readonly guardianSystem: RareGuardianSystem;
  readonly mobility = new MobilitySystem();
  readonly ultimate = new UltimateSystem();
  readonly necroticFlames = new NecroticFlameWalls();
  readonly finalEncounter = new FinalEncounter();
  facing = { x: 0, y: 1 };
  get effectiveSpeed() { return this.player.speed * this.artifacts.multiplier('speed') * this.buffs.multiplier('haste', this.elapsed) * this.buffs.modifier('speed', this.elapsed); }
  get effectiveDamage() { return this.stats.damage * this.artifacts.multiplier('damage') * this.buffs.multiplier('fury', this.elapsed) * this.buffs.modifier('damage', this.elapsed); }
  get effectiveCooldown() { return this.stats.cooldown * this.artifacts.multiplier('cooldown') * this.buffs.modifier('cooldown', this.elapsed); }
  get effectiveMaxHp() { return Math.round(this.player.maxHp * this.artifacts.multiplier('health') * 100) / 100; }
  get absorb(){return this.shield.absorbValue(this.elapsed)+this.mobility.absorbValue(this.elapsed);}
  get guardians() { return this.enemies.filter(e => e.kind === 'guardian'); }
  get rareGuardian() { return this.guardians[0]; }
  get combatTargets() { return this.enemies.filter(e => this.canDamageTarget(e) && (e.kind !== 'guardian' || e.discovered || guardianVisible(this, e)));  }
  get regularCount() { return this.enemies.filter(e => !e.boss && e.kind !== 'guardian').length; }
  canDamageTarget(e: Enemy) { return e.hp > 0 && this.finalEncounter.canTarget(e); }
  clearHostileThreats() { this.necroticFlames.clear();this.retainProjectiles(p=>!p.hostile);this.impacts=this.impacts.filter(i=>!i.hostile);this.zones=this.zones.filter(z=>z.ownerId===undefined);this.effects=this.effects.filter(e=>{if(e.ownerId===undefined)return true;this.effectPool.release(e);return false;}); }
  clearTemporaryState() {
    this.finalEncounter.cancel();
    this.necroticFlames.clear();
    this.feedbackEvents = []; this.sounds = []; this.shield.clearAbsorb(); this.ultimate.clear();
    for (const e of this.enemies) {
      delete e.ultimateFreeze;
      e.mobilitySlowUntil = e.freezeUntil = e.freezeImmuneUntil = e.novaSlowUntil = e.novaResistUntil = e.frostUntil = e.frostStacks = e.frostEvolutionReadyAt = 0;
      if (e.boss) { e.boss.phase = 'recover'; e.boss.until = Infinity; e.boss.charge = undefined; e.boss.magic=undefined;e.boss.contactSafeUntil=undefined;e.shootingAt = 0; }
    }
    this.effects = this.effects.filter(e => { if (e.kind !== 'frost' && e.kind !== 'meteor' && e.ownerId === undefined) return true; this.effectPool.release(e); return false; });
    this.buffs.clear(); this.loot.clear(); this.artifacts.clear(); this.guardianSystem.clear(this); this.encounterDirector.clear(); this.impacts = []; this.zones = []; this.retainProjectiles(() => false); this.mobility.clear(); this.enemies = this.enemies.filter(e => e.kind !== 'guardian'); this.player.hp = Math.min(this.player.hp, this.effectiveMaxHp);
  }
  player = { x: 0, y: 0, hp: 100, maxHp: 100, speed: BALANCE.playerSpeed as number, invulnerableUntil: 0 };
  status: 'menu' | 'playing' | 'paused' | 'upgrade' | 'over' = 'playing';
  outcome:'victory'|'defeat'|null=null;
  practice=false;
  practiceBoss:PracticeBoss|null=null;
  get practiceDuel(){return duelPractice(this.practiceBoss);}
  sounds: LegacyCue[] = [];
  feedbackEvents: GameFeedback[] = [];
  feedback(event: GameFeedback) {
    if (this.feedbackEvents.length >= 32) return;
    const key = (e: GameFeedback) => e.type === 'ability' ? e.type + e.ability : e.type === 'impact' ? e.type + e.source : e.type + e.kind;
    if (!this.feedbackEvents.some(e => key(e) === key(event))) this.feedbackEvents.push(event);
  }
  sound(cue: LegacyCue) { if(cue.startsWith('final-')){if(this.sounds.length>=16)this.sounds.pop();this.sounds.unshift(cue);}else if (this.sounds.length < 16) this.sounds.push(cue); }
  pause() { if (this.status === 'playing') this.status = 'paused'; }
  resume() { if (this.status === 'paused') this.status = 'playing'; }
  experience = new ExperienceSystem();
  get upgradeLevel() { return this.experience.pending > 0 ? this.experience.level - this.experience.pending + 1 : this.experience.level; }
  upgrades: Record<string, number> = {};
  choices: UpgradeDefinition[] = [];
  offerId = 0;
  stats = { damage: 1, cooldown: 1, projectiles: 1, area: 1, pickup: 55 };
  abilities = initialAbilities();
  readonly shield = new AbsorbPool();
  warrior = { whirlwindUntil: 0, whirlwindTick: 0, bladesUntil: 0, bladesTick: 0, ironUntil: 0 };
  get character() { return this.options.character ?? 'mage'; }
  get biome() { return playableMap(this.options.biome); }
  get abilityDefinitions() { return abilitiesFor(this.character); }
  impacts: Impact[] = [];
  zones: Zone[] = [];
  addZone(at: Point, radius: number, damage: number, duration: number, source: DamageSource) {
    if (this.zones.length + this.impacts.length >= 24) return false;
    this.zones.push({ x: at.x, y: at.y, id: this.id(), radius, damage, expires: this.elapsed + Math.min(5, duration), nextTick: this.elapsed + 0.5, source }); return true;
  }
  orbs: XpOrb[] = [];
  private orbPool = new ObjectPool<XpOrb>(BALANCE.orbCap);
  private projectilePool = new ObjectPool<Projectile>(BALANCE.projectileCap);
  private effectPool = new ObjectPool<Effect>(BALANCE.effectCap);
  get allocations() { return { orbs: this.orbPool.allocated, projectiles: this.projectilePool.allocated, effects: this.effectPool.allocated }; }
  private enemySystem = new EnemySystem();
  readonly encounterDirector = new EncounterDirector();
  get bosses() { return this.enemies.filter(e => e.boss); }
  get hostileProjectileSlots(){return Math.max(0,Math.min(BALANCE.projectileCap-this.projectiles.length,GUARDIAN_ORBS.hostileCap-this.projectiles.filter(p=>p.hostile).length));}
  enemies: Enemy[] = []; projectiles: Projectile[] = []; effects: Effect[] = [];
  readonly runId = globalThis.crypto.randomUUID();
  elapsed = 0;
  private scoring = new ScoreSystem();
  get kills() { return this.scoring.kills; }
  get score() { return this.scoring.score; }
  width = 640; height = 360;
  spawnedRegular = 0;
  private serial = 0; private cosmeticSerial = 0; private spawnClock = new SpawnClock();
  constructor(seed = 12345, readonly options: RunOptions = {}) { this.rng = new SeededRandom(seed); this.loot = new LootSystem(seed); this.artifacts = new ArtifactSystem(seed); this.guardianSystem = new RareGuardianSystem(seed); const hero=CHARACTERS[this.character]; this.player.hp=this.player.maxHp=hero.hp; this.player.speed=hero.speed; this.abilities=initialAbilities(this.character); }
  id() { return ++this.serial; }
  spawn(kind: EnemyKind, at?: Point, elite = false, guardianWaveId?: number): Enemy | undefined {
    if(this.practiceDuel&&(this.outcome||kind!==this.practiceDuel.kind||this.enemies.length>0))return;
    if (this.finalEncounter.active || this.finalEncounter.phase==='defeated' || kind==='ashGuard') return;
    const boss = isBossKind(kind);
    if (!boss && kind !== 'guardian' && this.ultimate.regularSpawnFactor(this.elapsed) === 0) return;
    if (kind === 'guardian' ? this.guardians.length >= GUARDIAN_BALANCE.cap : boss ? this.bosses.length >= BOSS_CAP : this.regularCount >= Math.min(BALANCE.regularCap, profileAt(this.elapsed).cap)) return;
    if (kind === 'guardian') elite = false;
    const p = at ?? (kind === 'guardian' ? this.guardianSystem.spawnPoint(this) : spawnPerimeter(this.player, this.width, this.height, this.rng)), definition = ENEMIES[kind];
    if (!p || !Number.isFinite(p.x+p.y)) return;
    const enrageIndex=boss&&this.elapsed>=BOSS_MAGIC.from?this.encounterDirector.enrageSpawns+1:0;
    const aggression = bossBirthAggression(this.elapsed / 60,kind,enrageIndex);
    const scale = scalesAt(this.elapsed), hp = definition.hp * (boss||kind==='guardian'?scale.hp:scalesAt(Math.min(this.elapsed,ENDGAME.from)).hp) * (elite ? 2 : 1);
    const enemy: Enemy = { ...p, born: this.elapsed, modifier: elite ? (['frenzy', 'shielded', 'volatile'] as const)[this.rng.int(3)] : undefined, rush: kind === 'rusher' ? { phase: 'approach', until: this.elapsed + 1, direction: { x: 0, y: 0 }, aim: { x: 0, y: 0 } } : undefined, id: this.id(), kind, hp, maxHp: hp, radius: definition.radius * (elite ? 1.25 : 1), hitUntil: 0, slowUntil: 0, slowFactor: 1, elite, speed: definition.speed * (elite ? 1.15 : 1), damage: definition.damage * scale.damage * (elite ? 1.4 : 1), score: definition.score * (elite ? 3 : 1), xp: definition.xp * (elite ? 2 : 1), shootAt: this.elapsed + (kind === 'caster' ? pressureAt(this.elapsed).casterFirstShot : 2), shootingAt: 0, boss: boss ? { aggression, phase: 'approach', until: this.elapsed + (kind === 'charger' ? CHARGE_BOSS.initialDelay : 2) / aggression.frequency, direction: { x: 0, y: 0 }, aim: { x: 0, y: 0 } } : null };
    if(boss&&enrageIndex){this.encounterDirector.enrageSpawns++;enemy.boss!.enrageIndex=enrageIndex;if(kind!=='charger')enemy.boss!.magic={nextAt:this.elapsed+BOSS_MAGIC.initialTeleport,teleports:0};}
    if(boss&&this.elapsed>=ENDGAME.from){const late=lateBossProfile(this.elapsed,++this.encounterDirector.endgameSpawns,kind==='charger');enemy.boss!.late=late;enemy.boss!.aggression={...aggression,movement:aggression.movement*late.movement,frequency:aggression.frequency*late.frequency};}
    this.enemies.push(enemy); if (kind === 'guardian') this.guardianSystem.spawned(this, enemy, guardianWaveId); else if (!boss) this.spawnedRegular++; return enemy;
  }
  effect(kind: Effect['kind'], p: Point, radius: number, color: number, duration = 0.22, target?: Point, amount?: number, source?: DamageSource, ownerId?: number) {
    if(ownerId!==undefined&&this.status==='over')return;
    if (this.effects.length < BALANCE.effectCap) { const effect = this.effectPool.acquire({ x: p.x, y: p.y, id: kind==='arcane-impact'||kind==='rune-blink'||kind==='astral-impact'?--this.cosmeticSerial:this.id(), kind, radius, color, expires: this.elapsed + duration, started: this.elapsed, duration, amount, target: target && { x: target.x, y: target.y }, source, ownerId }); if (effect) this.effects.push(effect); }
  }
  shoot(shot: Omit<Projectile, 'id' | 'expires'>) {
    if(shot.homing&&(!shot.hostile||!this.guardians.some(e=>e.id===shot.ownerId)||this.projectiles.filter(p=>p.homing&&p.ownerId===shot.ownerId&&p.expires>this.elapsed).length>=GUARDIAN_ORBS.perOwner))return;
    if (this.projectiles.length >= BALANCE.projectileCap || (shot.hostile && this.hostileProjectileSlots===0)) return;
    const projectile = this.projectilePool.acquire({ ...shot, appearance:shot.appearance, started:this.elapsed, homing:shot.homing, id: this.id(), expires: this.elapsed + (shot.homing?(shot.homing.lifetime??GUARDIAN_ORBS[shot.homing.variant].lifetime):2.5), hits: [], ownerId: shot.ownerId, pierce: shot.pierce ?? 0, source: shot.source, exploded: false });
    if (projectile) this.projectiles.push(projectile);
  }
  damageEnemy(enemy: Enemy, amount: number, source: DamageSource = 'unknown', maxDamage = Infinity, executeRegular = false) {
    if (this.outcome || this.status === 'over' || amount <= 0 || !Number.isFinite(amount) || enemy.hp <= 0 || !this.enemies.includes(enemy)) return false;
    if (enemy.kind === 'guardian' && !enemy.finalRole) { if (!enemy.discovered && !guardianVisible(this, enemy)) return false; enemy.discovered = true; this.guardianSystem.awaken(this, enemy); }
    if(!this.canDamageTarget(enemy)){this.finalEncounter.diagnostics.blocked++;return false;}
    const before = enemy.hp;
    if (source === 'fireball' || source === 'cleave') this.feedback({ type: 'impact', source });
    const devastation=executeRegular&&source==='ultimate-lightning'&&!enemy.boss&&enemy.kind!=='guardian';
    const resolved=Math.min(maxDamage, amount * this.artifacts.multiplier('damage') * this.buffs.multiplier('fury', this.elapsed) * this.buffs.modifier('damage', this.elapsed) * (enemyShielded(enemy, this.elapsed) ? 0.35 : 1) * (enemy.boss?.phase === 'recover' ? 1.25 : 1));
    enemy.hp = devastation ? 0 : Math.max(0, enemy.hp - this.finalEncounter.limitDamage(enemy,resolved));
    this.finalEncounter.afterDamage(this,enemy); enemy.hitUntil = this.elapsed + 0.12;
    this.scoring.recordDamage(source, before-enemy.hp);
    this.effect('hit', enemy, 8, 0xffe1ad, 0.32, undefined, before - enemy.hp);
    if (!enemy.boss && enemy.kind !== 'guardian'&&!ultimateFrozen(enemy,this.elapsed)) { const away = direction(enemy.x - this.player.x, enemy.y - this.player.y), kick = enemy.kind === 'tank' ? 2 : 5; enemy.x += away.x * kick; enemy.y += away.y * kick; }
    if (enemy.hp === 0) {
      this.scoring.recordKill(enemy.kind, enemy.elite);
      if(this.practiceDuel&&enemy.kind===this.practiceDuel.kind){
        enemy.deathSource=source;this.sound('kill');this.effect('death',enemy,12,ENEMIES[enemy.kind].color,.45);
        this.clearOwnedEffects(enemy.id);this.enemies.splice(this.enemies.indexOf(enemy),1);
        this.outcome='victory';this.status='over';this.clearTemporaryState();return true;
      }
      if(enemy.finalRole==='boss'){enemy.deathSource=source;this.finalEncounter.finish(this);return true;}
      this.sound('kill');
      enemy.deathSource = source;
      if (source !== 'ultimate-lightning') this.effect('death', enemy, 12, ENEMIES[enemy.kind].color, 0.45);
      this.dropXp(enemy, enemy.xp);
      if(!enemy.finalRole)this.loot.onEnemyDeath(this, enemy);
      if (enemy.boss) { this.clearOwnedEffects(enemy.id); enemy.boss.charge = undefined; }
      if(enemy.finalRole==='guardian')this.finalEncounter.supportRemoved(this,enemy.id);
      else if (enemy.kind === 'guardian') this.guardianSystem.complete(this, enemy.id);
      this.enemies.splice(this.enemies.indexOf(enemy), 1); if(!enemy.finalRole)onSpecialDeath(this, enemy); return true;
    }
    return false;
  }
  private retainProjectiles(keep: (projectile: Projectile) => boolean, dissipate = false) { this.projectiles = this.projectiles.filter(p => { if (keep(p)) return true; if(dissipate&&p.appearance)this.effect(p.appearance==='astral-volley'?'astral-impact':'arcane-impact',p,16,0xffffff,p.appearance==='astral-volley'?ASTRAL_VFX.impact:RUNE_WARDEN_VFX.impact,{x:p.vx,y:p.vy},undefined,undefined,p.ownerId);this.projectilePool.release(p); return false; }); }
  clearOwnedEffects(ownerId: number) { this.impacts = this.impacts.filter(i => i.ownerId !== ownerId); this.zones = this.zones.filter(z => z.ownerId !== ownerId);if(!this.zones.some(z=>z.necrotic))this.necroticFlames.clear(); this.retainProjectiles(p => p.ownerId !== ownerId);this.effects=this.effects.filter(e=>{if(e.ownerId!==ownerId)return true;this.effectPool.release(e);return false;}); }
  dropXp(at: Point, value: number) {
    const orb = this.orbPool.acquire({ x: at.x, y: at.y, id: this.id(), value, expires: this.elapsed + 50 });
    if (orb) this.orbs.push(orb);
    else { const old = nearest(at, this.orbs, Infinity); if (old) old.value += value; }
  }
  gainXp(amount: number) { if(this.outcome||this.status==='over'||this.status==='menu')return; const level = this.experience.level; this.experience.gain(amount * this.artifacts.multiplier('experience')); if (this.experience.level > level) this.sound('level'); this.openUpgrade(); }
  private openUpgrade() {
    if (this.status === 'playing' && this.experience.pending > 0) { this.status = 'upgrade'; this.offerId++; this.choices = chooseUpgrades(this); }
  }
  selectUpgrade(id: string, offer = this.offerId) {
    if (offer !== this.offerId || this.status !== 'upgrade' || !this.choices.some(c => c.id === id) || !applyUpgrade(this, id)) return false;
    this.experience.pending--; this.choices = [];
    // Supply effects can resolve a terminal encounter during the choice itself.
    if(this.outcome)return true;
    this.status = 'playing'; this.openUpgrade(); return true;
  }
  collectAllOrbs() { const value = this.orbs.reduce((sum, o) => sum + (o.expires > this.elapsed ? o.value : 0), 0); for (const orb of this.orbs) this.orbPool.release(orb); this.orbs = []; this.gainXp(value); }
  damagePlayer(amount: number) {
    if (this.outcome || this.status !== 'playing' || this.player.hp <= 0 || this.elapsed < this.player.invulnerableUntil || this.elapsed < this.mobility.protectedUntil || this.ultimate.protected(this.elapsed) || amount <= 0 || !Number.isFinite(amount)) return false;
    const mitigation = this.warrior.ironUntil > this.elapsed ? .5 : 1;
    const incoming = amount * (1 - CHARACTERS[this.character].armor) * mitigation;
    const arcane=this.shield.absorbDamage(this.elapsed,incoming);
    const mobility=this.mobility.absorbDamage(this.elapsed,incoming-arcane),absorbed=arcane+mobility;
    if(arcane>0){this.feedback({type:'impact',source:'shield',strength:arcane});if(this.shield.absorbValue(this.elapsed)===0)shieldPulse(this);}
    const hpHit = receiveDamage(this.player, incoming - absorbed, this.elapsed);
    const hit = hpHit || absorbed > 0;
    if (mobility > 0 && !hpHit) this.player.invulnerableUntil = this.elapsed + BALANCE.invulnerability;
    if (hit) { this.sound(hpHit ? 'hurt' : 'shield'); this.effect(hpHit ? 'hit' : 'shield', this.player, 16, hpHit ? 0xff6f70 : 0xb9eeff); if (this.player.hp <= 0) { this.outcome='defeat'; this.status = 'over'; this.clearTemporaryState(); } }
    return hit;
  }
  step(rawDelta: number, input: MovementInput = { x: 0, y: 0 }) {
    if (this.status !== 'playing') return;
    const dt = Math.max(0, Math.min(rawDelta, 0.05)); this.elapsed += dt;
    if(this.finalEncounter.phase==='dying'){this.finalEncounter.update(this,dt);return;}
    if(!this.practiceDuel&&this.elapsed+1e-7>=FINAL_BOSS.at)this.finalEncounter.begin(this);
    const vector = direction(input.x, input.y);
    const magnitude = input.analog ? Math.min(1, Math.hypot(input.x, input.y)) : 1;
    if (!this.ultimate.casting && !this.mobility.update(this, dt)) { this.player.x += vector.x * magnitude * this.effectiveSpeed * dt; this.player.y += vector.y * magnitude * this.effectiveSpeed * dt; }
    if(this.finalEncounter.active)Object.assign(this.player,this.finalEncounter.clamp(this.player));
    if (vector.x || vector.y) this.facing = vector;
    // Release starts relief before this frame's spawns, including Splitter offspring.
    if (this.ultimate.selected === 'lightning') this.ultimate.update(this);
    if (this.status !== 'playing') return;
    const profile = profileAt(this.elapsed);
    const cadence=spawnCadenceAt(this.elapsed);
    const spawnFactor=this.ultimate.regularSpawnFactor(this.elapsed);
    if(this.practiceDuel||this.finalEncounter.active || spawnFactor===0)this.spawnClock.reset();
    else if (this.spawnClock.tick(dt*spawnFactor, cadence.interval / ((this.options.spawnRate ?? 1.3) * this.encounterDirector.regularSpawnFactor(this.elapsed)))) {
      for (let i = 0; i < cadence.burst; i++) {
        const at = this.elapsed >= 480 ? spawnPerimeter(this.player, this.width, this.height, this.rng, formationEdge(this.elapsed, i)) : undefined;
        this.spawn(pickEnemy(profile, this.rng), at, this.rng.next() < profile.elite);
      }
    }
    if(!this.practiceDuel&&!this.finalEncounter.active)this.encounterDirector.update(this);
    if(this.ultimate.selected==='frost')this.ultimate.update(this);
    advanceUltimateFreeze(this);
    if(!this.practiceDuel)this.guardianSystem.update(this, dt);
    this.enemySystem.update(this, dt);
    this.finalEncounter.update(this,dt);
    if (this.outcome || this.status !== 'playing') return;
    this.mobility.tick(this);
    if (this.ultimate.selected === 'fire') this.ultimate.update(this);
    this.enemies = this.enemies.filter(e => { const keep = this.practiceDuel || !!e.finalRole || e.kind === 'guardian' || distance(e, this.player) < Math.max(BALANCE.despawnDistance, Math.hypot(this.width, this.height) / 2 + 200) * (e.boss ? 2 : 1); if (!keep && e.boss) this.clearOwnedEffects(e.id); return keep; });
    tickAbilities(this);
    for (const shot of [...this.projectiles]) {
      if (this.status !== 'playing') break;
      if (shot.ownerId !== undefined && !this.enemies.some(e => e.id === shot.ownerId)) continue;
      if(shot.homing&&!steerGuardianOrb(this,shot,dt))continue;
      const old = { x: shot.x, y: shot.y }; shot.x += shot.vx * dt; shot.y += shot.vy * dt;
      if(this.ultimate.selected==='fire'&&this.ultimate.fire.absorb(this,old,shot))continue;
      if (shot.hostile) { if (segmentDistance(this.player, old, shot) < (shot.homing?GUARDIAN_ORBS[shot.homing.variant].radius+9:12)) { this.damagePlayer(shot.damage); shot.expires = 0; } continue; }
      const targets = this.combatTargets.filter(e => !shot.hits?.includes(e.id) && segmentDistance(e, old, shot) < e.radius + 4).sort((a, b) => distance(old, a) - distance(old, b));
      for (const target of targets) {
        this.damageEnemy(target, shot.damage, shot.source); shot.hits?.push(target.id);
        if (shot.source === 'fireball' && evolved(this, 'fireball') && !shot.exploded) {
          shot.exploded = true; const radius = 38 * this.stats.area;
          for (const e of [...this.enemies]) if (e.id !== target.id && distance(e, target) < radius + e.radius) this.damageEnemy(e, shot.damage * 0.45, 'fireball');
          this.effect('meteor', target, radius, 0xffa46c, 0.3);
        }
        if ((shot.pierce ?? 0) <= 0) { shot.expires = 0; break; } shot.pierce = (shot.pierce ?? 0) - 1;
      }
    }
    if (this.status !== 'playing') return;
    this.retainProjectiles(p => p.expires > this.elapsed && distance(p, this.player) < Math.max(700, Math.hypot(this.width, this.height)),true);
    this.effects = this.effects.filter(e => { if (e.expires > this.elapsed) return true; this.effectPool.release(e); return false; });
    const frozenOwners=new Set(this.enemies.filter(e=>ultimateFrozen(e,this.elapsed)).map(e=>e.id));
    for (const impact of this.impacts.filter(i => i.landAt <= this.elapsed&&!(i.hostile&&i.ownerId!==undefined&&frozenOwners.has(i.ownerId)))) {
      if (this.status !== 'playing') break;
      if (impact.ownerId !== undefined && !this.enemies.some(e => e.id === impact.ownerId)) continue;
      if (impact.hostile) { if (distance(impact, this.player) < impact.radius + 9) this.damagePlayer(impact.damage); }
      else { for (const enemy of [...this.enemies]) if (distance(impact, enemy) < impact.radius + enemy.radius) this.damageEnemy(enemy, impact.damage, impact.source);
        if (impact.source === 'meteor' && evolved(this, 'meteor')) this.addZone(impact, impact.radius * 0.8, 12 * this.stats.damage * (impact.damageScale ?? 1), 3, 'meteor'); }
      if (!impact.hostile && (impact.source === 'meteor' || impact.source === 'slam')) this.feedback({ type: 'impact', source: impact.source, strength: impact.damageScale ?? 1, target: { x: impact.x, y: impact.y } });
      if(impact.appearance==='runic-judgement')this.effect('runic-judgement',impact,impact.radius,0xffffff,RUNE_WARDEN_VFX.judgement,undefined,undefined,undefined,impact.ownerId);
      else this.effect('meteor', impact, impact.radius, impact.hostile ? 0xff829d : 0xffae65, 0.5, undefined, undefined, impact.hostile ? undefined : impact.source);
    }
    this.impacts = this.impacts.filter(i => i.landAt > this.elapsed||i.hostile&&i.ownerId!==undefined&&frozenOwners.has(i.ownerId));
    this.zones = this.zones.filter(z => z.expires > this.elapsed);
    this.necroticFlames.update(this);
    if (this.status !== 'playing') return;
    for (const zone of this.zones) if (!zone.wall && !zone.necrotic && this.elapsed >= zone.nextTick) { zone.nextTick = this.elapsed + 0.5; for (const e of [...this.enemies]) if (distance(e, zone) < zone.radius + e.radius) this.damageEnemy(e, zone.damage, zone.source); }
    if (this.status !== 'playing') return;
    for (const orb of [...this.orbs]) {
      const d = distance(orb, this.player);
      if (d < 12 || orb.expires <= this.elapsed) {
        this.orbs.splice(this.orbs.indexOf(orb), 1); const value = orb.value; this.orbPool.release(orb);
        if (d < 12 && orb.expires > this.elapsed) { this.sound('pickup'); this.feedback({ type: 'pickup', kind: 'xp' }); this.gainXp(value); if (this.status !== 'playing') break; }
      } else if (d < this.stats.pickup) { const vector = direction(this.player.x - orb.x, this.player.y - orb.y); orb.x += vector.x * 230 * dt; orb.y += vector.y * 230 * dt; }
    }
    if (this.status === 'playing') this.loot.update(this);
    if (this.status === 'playing') this.artifacts.update(this);
  }
  snapshot() {
    const damageByAbility=this.abilityDefinitions.map(a=>({id:a.id,name:a.name,damage:this.scoring.damage[a.id]}));
    const mostEffective=[...damageByAbility].sort((a,b)=>b.damage-a.damage)[0];
    return {
      regularKills:this.scoring.regularKills,eliteKills:this.scoring.eliteKills,bossKills:this.scoring.bossKills,damageByAbility,mostEffective:mostEffective?.damage>0?mostEffective:null,
      finalEncounter: this.finalEncounter.snapshot(),
      ...(this.practice?{practice:true}:{}),
      ...(this.practiceBoss?{practiceBoss:this.practiceBoss}:{}),
      ...(this.practiceDuel?{practiceElapsed:Math.max(0,this.elapsed-this.practiceDuel.at)}:{}),
      runId: this.runId, character: this.character, biome: this.biome, status: this.status, ...(this.outcome?{outcome:this.outcome}:{}), elapsed: this.elapsed,
      encounterNotice: this.encounterDirector.notice?.text ?? null, guardianWaves: this.guardianSystem.snapshot(), completedGuardianWaves: this.guardianSystem.completedWaves,
      guardians: this.guardians.map(e => ({ id: e.id, hp: e.hp, maxHp: e.maxHp, phase: this.guardianSystem.encounters.get(e.id)?.phase ?? null })),
      ...(this.ultimate.selected || this.scoring.damage['ultimate-lightning']+this.scoring.damage['ultimate-frost']+this.scoring.damage['ultimate-fire']>0 ? {ultimate:this.ultimate.snapshot(this.elapsed),ultimateDamage:{lightning:this.scoring.damage['ultimate-lightning'],frost:this.scoring.damage['ultimate-frost'],fire:this.scoring.damage['ultimate-fire']}} : {}),
      mobility: this.mobility.snapshot(this), guardianPhase: this.guardianSystem.encounter?.phase ?? null,
      buffs: this.buffs.snapshot(this.elapsed), lootNotice: this.loot.notice?.name ?? null,
      artifacts: this.artifacts.snapshot(), runNotice: this.guardianSystem.notice?.text ?? this.artifacts.notice?.text ?? null, guardianKills: this.scoring.guardianKills,
      hp: this.player.hp, maxHp: this.effectiveMaxHp, absorb: this.absorb, kills: this.kills, score: this.score,
      enrage:enrageAt(this.elapsed),
      killsByKind: { ...this.scoring.byKind }, enemies: this.regularCount,
      level: this.experience.level, xp: this.experience.xp, xpNext: xpThreshold(this.experience.level),
      offerId: this.offerId, pending: this.experience.pending,
      choices: this.choices.map(c => {
        const ability = ABILITIES.find(a => 'rank-' + a.id === c.id);
        return { id: c.id, name: c.name, description: c.description, category: MOBILITY_UPGRADES.find(u => `mobility-${u.id}` === c.id)?.category ?? null, tier: ability ? this.abilities[ability.id].level + 1 : (this.upgrades[c.id] ?? 0) + 1 };
      }),
      abilities: this.abilityDefinitions.map(a => ({ id: a.id, name: a.name, icon: a.icon, level: this.abilities[a.id].level, readyIn: Math.max(0, this.abilities[a.id].readyAt - this.elapsed) })),
      bosses: this.bosses.map(e => ({ id: e.id, name: ENEMY_NAMES[e.kind], hp: e.hp, maxHp: e.maxHp, phase: e.boss!.phase })),
      wave: this.finalEncounter.phase!=='inactive'?'Финальная встреча':profileAt(this.elapsed).name,
    };
  }
}
export type Snapshot = ReturnType<World['snapshot']>;
