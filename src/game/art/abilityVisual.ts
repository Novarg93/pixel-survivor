// Rendering parameters only. Never imported by abilities, collisions or balancing.
export function abilityVisual(level: number) {
  const rank = Math.max(1, Math.min(5, Math.floor(Number.isFinite(level) ? level : 1))), power = (rank - 1) / 4;
  return { rank, power, lineWidth: 1 + power * 1.5, sparks: 4 + rank * 2, rings: 1 + Math.floor(rank / 2), brightness: .7 + power * .3, capstone: rank === 5 };
}
