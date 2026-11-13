import type { CharacterId } from '../config/characters';

export const PUBLIC_CHARACTER: CharacterId = 'mage';
export function runCharacter(testFixture?: CharacterId, selected?: CharacterId): CharacterId { return testFixture ?? (selected && isPublicCharacter(selected) ? selected : PUBLIC_CHARACTER); }
export function isPublicCharacter(character: CharacterId) { return character === 'mage' || character === 'warrior'; }
