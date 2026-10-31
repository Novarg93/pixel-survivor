export type AbilityId = 'fireball' | 'frost' | 'lightning' | 'meteor' | 'shield' | 'cleave' | 'whirlwind' | 'slam' | 'blades' | 'iron';
export interface AbilityState { level: number; readyAt: number }
export interface AbilityDefinition { id: AbilityId; name: string; cooldown: number; color: number; icon: string; character?: 'warrior'; description?: string }
