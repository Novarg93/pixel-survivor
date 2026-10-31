import { expect, it } from 'vitest';
import { World } from '../../src/game/systems/World';
import { validSettings } from '../../src/game/services/storage';
it('has timed feedback, bounded effects and expiry', () => { const w = new World(); const e = w.spawn('tank', { x: 50, y: 0 })!; w.damageEnemy(e, 1); expect(w.effects[0]).toMatchObject({ amount: 1, duration: 0.32 }); for (let i = 0; i < 200; i++) w.effect('death', w.player, 12, 1); expect(w.effects.length).toBe(96); for (let i = 0; i < 20; i++) w.step(0.05); expect(w.effects.length).toBeLessThan(96); });
it('accepts old settings and validates new visual controls', () => { expect(validSettings({ volume: 0.3, muted: false, pixelScale: 2 })).toBe(true); expect(validSettings({ volume: 0.3, muted: false, pixelScale: 2, effectsIntensity: 0.2, damageNumbers: true })).toBe(true); expect(validSettings({ volume: 0.3, muted: false, pixelScale: 2, effectsIntensity: -1 })).toBe(false); });
