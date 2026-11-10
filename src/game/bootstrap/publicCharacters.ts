import type { CharacterId } from '../config/characters';

export const PUBLIC_CHARACTER: CharacterId = 'mage';
// UI commands may be stale or issued by an older shell. Public runs are Mage.
// The override is supplied only by the DEV-only test fixture, never by commands.
export function runCharacter(testFixture?: CharacterId): CharacterId { return testFixture ?? PUBLIC_CHARACTER; }
export function isPublicCharacter(character: CharacterId) { return character === PUBLIC_CHARACTER; }
