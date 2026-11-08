export type PracticeBoss = 'ash-warden' | 'rune-warden' | 'briar-beast' | 'astral-revenant' | 'rootbound-guardian';
// First Enrage cohort enables Blink as well as Volley/Judgement, using normal boss stats.
export const RUNE_PRACTICE = { kind:'sorcerer', at: 630, spawn: { x: 170, y: -40 } } as const;
export const BRIAR_PRACTICE = { kind:'charger', at: 630, spawn: { x: 170, y: -40 } } as const;
export const ASTRAL_PRACTICE={kind:'eclipse',at:630,spawn:{x:170,y:-40}} as const;
export const GUARDIAN_PRACTICE={kind:'guardian',at:630,spawn:{x:120,y:0}} as const;
export function duelPractice(boss:PracticeBoss|null){return boss==='rune-warden'?RUNE_PRACTICE:boss==='briar-beast'?BRIAR_PRACTICE:boss==='astral-revenant'?ASTRAL_PRACTICE:boss==='rootbound-guardian'?GUARDIAN_PRACTICE:null;}
