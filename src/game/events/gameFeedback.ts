import type { AbilityId } from '../abilities/types';
import type { DamageSource } from '../entities/types';
import type { Point } from '../utils/math';
// Presentation-neutral, bounded gameplay notifications. No audio dependencies.
export type LegacyCue = 'cast' | 'kill' | 'pickup' | 'hurt' | 'level' | 'shield' | 'charge';
export type GameFeedback = { type: 'ability'; ability: AbilityId; target?: Point; endsAt?: number } | { type: 'impact'; source: DamageSource; strength?: number; target?: Point } | { type: 'pickup'; kind: 'xp' | 'heal' | 'buff' | 'artifact' };
