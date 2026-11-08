export type PracticeBoss = 'ash-warden' | 'rune-warden' | 'briar-beast' | 'astral-revenant';
// First Enrage cohort enables Blink as well as Volley/Judgement, using normal boss stats.
export const RUNE_PRACTICE = { kind:'sorcerer', at: 630, spawn: { x: 170, y: -40 } } as const;
export const BRIAR_PRACTICE = { kind:'charger', at: 630, spawn: { x: 170, y: -40 } } as const;
export const ASTRAL_PRACTICE={kind:'eclipse',at:630,spawn:{x:170,y:-40}} as const;
export function duelPractice(boss:PracticeBoss|null){return boss==='rune-warden'?RUNE_PRACTICE:boss==='briar-beast'?BRIAR_PRACTICE:boss==='astral-revenant'?ASTRAL_PRACTICE:null;}
