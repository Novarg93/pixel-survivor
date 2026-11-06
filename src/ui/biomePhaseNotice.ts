import { BIOME_ANNOUNCEMENT_SECONDS } from '../game/config/atmosphere';
import { mapDefinition } from '../game/config/biomes';
import type { Snapshot } from '../game/systems/World';

// The existing bounded UI snapshot supplies the run clock; no wall-clock timers/listeners.
export function biomePhaseNotice(state: Pick<Snapshot, 'biome' | 'elapsed' | 'status'>) {
  if (state.status === 'menu' || state.status === 'over') return null;
  const phase = mapDefinition(state.biome).presentation.phases.find(p =>
    p.announcement && state.elapsed >= p.start && state.elapsed < p.start + BIOME_ANNOUNCEMENT_SECONDS);
  if (!phase?.announcement) return null;
  const age = state.elapsed - phase.start;
  return { phase: phase.id, ...phase.announcement, remaining: 1 - age / BIOME_ANNOUNCEMENT_SECONDS,
    opacity: Math.min(1, (BIOME_ANNOUNCEMENT_SECONDS - age) / .5) };
}
