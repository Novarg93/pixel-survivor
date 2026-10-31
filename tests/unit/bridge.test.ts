import { expect, it } from 'vitest';
import { Channel } from '../../src/game/events/bridge';
it('delivers typed values and disposes listeners', () => { const c = new Channel<number>(); let n = 0; const off = c.on(v => { n = v; }); c.emit(3); expect(n).toBe(3); off(); c.emit(5); expect(n).toBe(3); expect(c.size).toBe(0); });
