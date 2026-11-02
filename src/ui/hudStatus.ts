export function xpPercent(xp: number, threshold: number) { return threshold > 0 ? Math.max(0, Math.min(100, Math.floor(xp / threshold * 100))) : 0; }
