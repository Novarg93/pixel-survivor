import { BALANCE } from '../config/gameBalance';
export interface Health { hp: number; maxHp: number; invulnerableUntil: number }
export function receiveDamage(health: Health, amount: number, now: number) {
  if (health.hp <= 0 || amount <= 0 || !Number.isFinite(amount) || now < health.invulnerableUntil) return false;
  health.hp = Math.max(0, health.hp - amount); health.invulnerableUntil = now + BALANCE.invulnerability;
  return true;
}
