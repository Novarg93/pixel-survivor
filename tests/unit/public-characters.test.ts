import { expect, it } from 'vitest';
import { isPublicCharacter, runCharacter } from '../../src/game/bootstrap/publicCharacters';
import { World } from '../../src/game/systems/World';
it('keeps public selection Mage-only while retaining an explicit Warrior fixture and its real gameplay', () => {
  expect(isPublicCharacter('mage')).toBe(true); expect(isPublicCharacter('warrior')).toBe(false);
  expect(runCharacter()).toBe('mage'); expect(runCharacter('warrior')).toBe('warrior');
  const warrior = new World(1, { character: runCharacter('warrior'), spawnRate: 0 });
  expect(warrior.player.hp).toBe(150); expect(warrior.abilities.cleave.level).toBe(1); expect(warrior.abilities.fireball.level).toBe(0);
});
