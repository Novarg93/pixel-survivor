import type { EnemyKind } from '../config/enemyDefinitions';
import type { Point } from '../utils/math';
import type { AbilityId } from '../abilities/types';
export type DamageSource = AbilityId | 'nova' | 'unknown' | 'mobility';
export interface BossState { stage?: number; phase: 'approach' | 'windup' | 'charge' | 'recover'; until: number; direction: Point; aim: Point }
export type EliteModifier = 'frenzy' | 'shielded' | 'volatile';
export interface Enemy extends Point { discovered?: boolean; id: number; kind: EnemyKind; hp: number; maxHp: number; radius: number; hitUntil: number; slowUntil: number; slowFactor: number; mobilitySlowUntil?: number; elite: boolean; speed: number; damage: number; score: number; xp: number; shootAt: number; shootingAt: number; aim?: Point; frostStacks?: number; frostUntil?: number; freezeUntil?: number; freezeImmuneUntil?: number; born: number; modifier?: EliteModifier; rush?: BossState; offspring?: boolean; boss: BossState | null }
export interface Projectile extends Point { id: number; vx: number; vy: number; damage: number; expires: number; hostile: boolean; pierce?: number; hits?: number[]; ownerId?: number; source?: DamageSource; exploded?: boolean }
export interface Effect extends Point { id: number; kind: 'hit' | 'death' | 'frost' | 'lightning' | 'meteor' | 'shield' | 'cleave' | 'whirlwind'; radius: number; expires: number; color: number; target?: Point; started: number; duration: number; amount?: number }
export interface XpOrb extends Point { id: number; value: number; expires: number }
export interface Impact extends Point { id: number; radius: number; damage: number; landAt: number; hostile: boolean; ownerId?: number; source?: DamageSource }
export interface Zone extends Point { id: number; radius: number; damage: number; expires: number; nextTick: number; source: DamageSource; ownerId?: number }
