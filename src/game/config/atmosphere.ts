export type AtmospherePhase = 'normal' | 'dusk' | 'dying' | 'burning';
export interface AtmosphereStyle {
  tint: number;
  veilColor: number;
  veil: number;
  vignette: number;
  fogColor: number;
  fog: number;
  glow: number;
  embers: number;
}

export interface PhaseDefinition { id: AtmospherePhase; start: number; end: number; style: Readonly<AtmosphereStyle>; announcement?: { title: string; description: string } }
export const BIOME_ANNOUNCEMENT_SECONDS = 5;
// Run seconds, shared by art and atmosphere. Textures already carry deep shadows.
export const ATMOSPHERE_PHASES: readonly PhaseDefinition[] = [
  { id: 'normal', start: 0, end: 0, style: { tint: 0xffffff, veilColor: 0x81919d, veil: 0, vignette: 0, fogColor: 0xa7c4cd, fog: 0, glow: 0, embers: 0 } },
  { id: 'dusk', start: 300, end: 305, announcement: { title: 'Twilight Grove', description: 'Twilight falls over the forest' }, style: { tint: 0xf0f3fa, veilColor: 0x81919d, veil: .025, vignette: .12, fogColor: 0xa7c4cd, fog: 0, glow: 0, embers: 0 } },
  { id: 'dying', start: 600, end: 605, announcement: { title: 'Dying Grove', description: 'Leaves fall. The forest fades' }, style: { tint: 0xe4edf0, veilColor: 0x536b79, veil: .035, vignette: .2, fogColor: 0x97b7b9, fog: .085, glow: 0, embers: 0 } },
  { id: 'burning', start: 900, end: 905, announcement: { title: 'Burning Grove', description: 'Embers smolder. Ash rises above the grove' }, style: { tint: 0xf1e8e0, veilColor: 0x713c31, veil: .025, vignette: .18, fogColor: 0xb8a296, fog: .075, glow: .16, embers: 1 } },
];

export const ATMOSPHERE_BUDGET = { objects: 8, textures: 2, textureBytes: 196608, desktopMotes: 28, mobileMotes: 18, reducedMotes: 8 } as const;
