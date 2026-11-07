export type AudioBus = 'master' | 'music' | 'sfx' | 'ui' | 'ambient';
export const PATCHES = {
  ashSword:[.06,440,80,.65,.35],
  stormCharge:[.34,180,1800,.7,.4], skyStrike:[.16,1800,120,.2,.85], stormTension:[.115,1800,3100,.5,.2], storm:[1.1,85,32,.3,.8], frostCharge:[.45,180,520,.3,.8], frostImpact:[.25,100,45,.2,.5], frostSeal:[.2,1300,2300,.7,.1], frostAir:[.2,80,90,.1,.9], inferno:[.65,100,55,.2,.8], embers:[1.2,70,95,.1,.8],
  click: [.07, 900, 500, 0, .05], chime: [.3, 520, 1040, .25, .02], xp: [.12, 1000, 1450, .1, .01],
  heal: [.38, 360, 720, .4, .02], relic: [.6, 390, 1170, .6, .02], hurt: [.18, 140, 55, 0, .35],
  death: [.8, 200, 35, .2, .25], wind: [.22, 250, 750, .1, .65], blink: [.25, 400, 1350, .4, .1],
  fire: [.18, 220, 90, .1, .65], frost: [.48, 1700, 650, .6, .12], lightning: [.2, 1300, 260, .2, .75],
  meteor: [.5, 110, 35, .2, .75], shield: [.35, 660, 990, .65, .02], metal: [.2, 300, 100, .5, .25],
  stone: [.65, 100, 220, .6, .18], threat: [.65, 140, 65, .5, .3], laser: [.4, 330, 500, .5, .15],
  dash: [.24, 160, 560, .3, .6], whirl: [.5, 180, 420, .2, .75], blades: [.4, 420, 840, .7, .2], iron: [.5, 220, 440, .8, .08], slam: [.42, 80, 40, .4, .45],
} as const;
export type PatchId = keyof typeof PATCHES;
export type AssetId = PatchId | 'grove' | 'forest' | 'underscore';
function cue(asset: PatchId, bus: 'ui' | 'sfx', priority: number, gap: number, gain = .55, group = asset) { return { asset, bus, priority, gap, gain, group }; }
export const SOUND_CATALOG = {
  'final.step':cue('slam','sfx',4,.4,.12),
  'final.stop':cue('slam','sfx',10,.3,.5),
  'final.cast':cue('shield','sfx',10,.4,.4),
  'final.cleave':cue('ashSword','sfx',11,.4,.6),
  'final.spawn':cue('stone','sfx',11,.2,.45),
  'final.shield':cue('shield','sfx',11,.2,.45),
  'final.support':cue('metal','sfx',11,.2,.45),
  'final.break':cue('metal','sfx',11,.2,.45),
  'final.orb':cue('shield','sfx',11,.2,.45),
  'final.warning':cue('threat','sfx',11,.2,.45),
  'final.impact':cue('meteor','sfx',11,.2,.45),
  'final.charge-warning':cue('threat','sfx',11,.2,.45),
  'final.charge':cue('stone','sfx',11,.2,.45),
  'final.sword':cue('threat','sfx',11,.2,.45),
  'final.slash':cue('ashSword','sfx',11,.2,.45),
  'final.phase3':cue('stone','sfx',11,.2,.45),
  'final.death':cue('death','sfx',11,.2,.65),

  'ultimate.charge':cue('stormCharge','sfx',11,.3,.35), 'ultimate.sky':cue('skyStrike','sfx',11,.3,.8), 'ultimate.overload':cue('stormTension','sfx',11,.3,.26), 'ultimate.lightning':cue('storm','sfx',11,.5,.85), 'ultimate.frost':cue('frostCharge','sfx',11,.5,.35), 'ultimate.frostImpact':cue('frostImpact','sfx',11,.5,.65), 'ultimate.frostSeal':cue('frostSeal','sfx',11,.5,.5), 'ultimate.fire':cue('inferno','sfx',11,.5,.7), 'ultimate.embers':cue('embers','sfx',5,.9,.3),
  'ultimate.singe':cue('fire','sfx',5,.16,.18),
  'ui.start': cue('chime', 'ui', 8, .25), 'ui.select': cue('click', 'ui', 3, .1, .35),
  'ui.upgrade': cue('relic', 'ui', 8, .3, .45), 'ui.pause': cue('click', 'ui', 8, .15, .4), 'ui.gameOver': cue('threat', 'ui', 9, 1, .3),
  'player.hurt': cue('hurt', 'sfx', 10, .2), 'player.death': cue('death', 'sfx', 12, 1, .65),
  'player.dash': cue('dash', 'sfx', 7, .2), 'player.blink': cue('blink', 'sfx', 7, .2),
  'pickup.xp': cue('xp', 'sfx', 1, .16, .28), 'pickup.heal': cue('heal', 'sfx', 7, .2),
  'pickup.artifact': cue('relic', 'sfx', 9, .3), 'pickup.buff': cue('chime', 'sfx', 6, .2, .45),
  'encounter.bossArrive': cue('threat', 'sfx', 11, .6, .65), 'encounter.guardianAwaken': cue('stone', 'sfx', 11, .4, .65),
  'encounter.guardianLaser': cue('laser', 'sfx', 9, .25), 'encounter.guardianMeteor': cue('threat', 'sfx', 9, .25, .4),
  'encounter.charge': cue('threat', 'sfx', 9, .25, .45),
  'fireball.cast': cue('fire', 'sfx', 2, .16, .25), 'fireball.impact': cue('fire', 'sfx', 2, .16, .3),
  'frostNova.cast': cue('frost', 'sfx', 4, .16, .45), 'lightning.cast': cue('lightning', 'sfx', 4, .16, .4),
  'armageddon.impact': cue('meteor', 'sfx', 6, .1, .6), 'arcaneShield.trigger': cue('shield', 'sfx', 7, .2, .45),
  'cleave.swing': cue('wind', 'sfx', 2, .16, .3), 'cleave.impact': cue('metal', 'sfx', 3, .16, .35),
  'whirlwind.active': cue('whirl', 'sfx', 3, .2, .4), 'groundSlam.impact': cue('slam', 'sfx', 6, .18, .5),
  'bladestorm.active': cue('blades', 'sfx', 3, .2, .4), 'ironSkin.trigger': cue('iron', 'sfx', 6, .2, .4),
} as const;
export type SoundEvent = keyof typeof SOUND_CATALOG;
export const AUDIO_BUDGET = { voices: 12, sfx: 10, ui: 2, loops: 3, sampleRate: 22050 } as const;
export const AUDIO_PROVENANCE = { origin: 'Original procedural PCM synthesis and original sparse underscore composed for Pixel Survivor. No third-party samples or melodies.', usage: 'Generated audio is original project content, distributable with Pixel Survivor; no third-party audio attribution required.', authoring: 'src/game/audio/synthesis.ts + catalog.ts', networkAssets: 0 } as const;
export const AUDIO_ASSET_MANIFEST = [...Object.entries(PATCHES).map(([id, patch]) => ({ id, seconds: patch[0], channels: 1, sampleRate: AUDIO_BUDGET.sampleRate, source: 'original procedural patch' })), ...(['grove', 'forest', 'underscore'] as const).map(id => ({ id, seconds: id === 'underscore' ? 16 : 8, channels: 1, sampleRate: AUDIO_BUDGET.sampleRate, source: 'original procedural composition' }))];
