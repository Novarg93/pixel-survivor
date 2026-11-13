import {MINIBOSS_AMBIENCE_SAMPLES} from './minibossAmbienceSamples';
import {MINIBOSS_SAMPLES} from './minibossSamples';
import {FROST_ULTIMATE_SAMPLE} from './frostUltimateSample';
import {FIRE_ULTIMATE_SAMPLES} from './fireUltimateSamples';
import {mageSampleIds,mageSampleKey,mageSampleUrl,mageSampleGain,mageSampleForEvent,type MageSampleId} from './mageSamples';
import {ASH_WARDEN_SAMPLES} from './ashWardenSamples';
import type {SoundEvent} from './catalog';

export const WARRIOR_SAMPLES = {
  "warrior-banner": {
    "file": "assets/audio/warrior-uploaded-v1/banner.wav",
    "sha256": "8ed5f851c8327582c209305c32b30476fdc76515902f41191ed1ebe90d3086a6",
    "gain": 0.835173,
    "seconds": 10.16
  },
  "warrior-charge": {
    "file": "assets/audio/warrior-uploaded-v1/charge.wav",
    "sha256": "a934f47b9edab575dec34981b92ad4b22c26de70570f6842f7ed1755769a2170",
    "gain": 0.889046,
    "seconds": 0.6865
  },
  "warrior-cleave": {
    "file": "assets/audio/warrior-uploaded-v1/cleave.wav",
    "sha256": "2af2eeebfa2430b85ca683dc4cbe70b90e21ffcd78713a512c880181e8da3da4",
    "gain": 0.82936,
    "seconds": 0.6065
  },
  "warrior-shield_block": {
    "file": "assets/audio/warrior-uploaded-v1/shield_block.wav",
    "sha256": "66e2a4499dd93947c93ee5829b23206cb64b35dc090c19409dfea844581c8314",
    "gain": 1,
    "seconds": 0.8865
  },
  "warrior-spear_throw": {
    "file": "assets/audio/warrior-uploaded-v1/spear_throw.wav",
    "sha256": "62424cb796f9955e3c876c1c42b7e6fdb6214eb05ffeb9a668f7c6c9962934c2",
    "gain": 0.922977,
    "seconds": 0.6065
  },
  "warrior-spear_ultimate": {
    "file": "assets/audio/warrior-uploaded-v1/spear_ultimate.wav",
    "sha256": "ee95e6f75addbc837ce1583c708dfd5b970095a3da934bfde9a638ddc157fd31",
    "gain": 1,
    "seconds": 0.8865
  },
  "warrior-stomp": {
    "file": "assets/audio/warrior-uploaded-v1/stomp.wav",
    "sha256": "b23416e66581cc3903ba9f20a6fd46a08630ce1cd548fdfffb4046716cacabe3",
    "gain": 0.800024,
    "seconds": 0.6065
  },
  "warrior-ultimate_stomp": {
    "file": "assets/audio/warrior-uploaded-v1/ultimate_stomp.wav",
    "sha256": "e86b672e1a417811d48b045d90348514c40e6071e316c716e9d100833f139692",
    "gain": 0.877293,
    "seconds": 10.16
  },
  "warrior-whirlwind": {
    "file": "assets/audio/warrior-uploaded-v1/whirlwind.wav",
    "sha256": "04dbd379725cf5882397b95beea6d60aa52c95e4b44be8010f4ee20eff8ee4fa",
    "gain": 0.931008,
    "seconds": 0.8865
  }
} as const;
export type WarriorSampleId=keyof typeof WARRIOR_SAMPLES;
const warriorIds=Object.keys(WARRIOR_SAMPLES) as WarriorSampleId[];
const warriorEvents:Partial<Record<SoundEvent,WarriorSampleId>>={
  'cleave.swing':'warrior-cleave', 'whirlwind.active':'warrior-whirlwind', 'groundSlam.cast':'warrior-stomp',
  'bladestorm.active':'warrior-spear_throw', 'ironSkin.trigger':'warrior-shield_block', 'player.dash':'warrior-charge',
  'ultimate.banner':'warrior-banner', 'ultimate.earthbreaker':'warrior-ultimate_stomp', 'ultimate.ruin':'warrior-spear_ultimate',
};
const isWarrior=(id:AudioSampleId):id is WarriorSampleId=>Object.hasOwn(WARRIOR_SAMPLES,id);

export type WardenSampleId=keyof typeof ASH_WARDEN_SAMPLES;
export type FireSampleId=keyof typeof FIRE_ULTIMATE_SAMPLES;
export type MinibossSampleId=keyof typeof MINIBOSS_SAMPLES;
export type MinibossAmbienceId=keyof typeof MINIBOSS_AMBIENCE_SAMPLES;
export type AudioSampleId=WarriorSampleId|MinibossAmbienceId|MinibossSampleId|MageSampleId|WardenSampleId|FireSampleId|'frost-ultimate';
export interface SampleRange {offset?:number;duration?:number}
// Measured lead-ins of the supplied recordings; presentation only, not combat timing.
export const WARDEN_AUDIO_LEAD={swing:.30,meteor:.20} as const;
const wardenIds=Object.keys(ASH_WARDEN_SAMPLES) as WardenSampleId[];
export const audioSampleIds:AudioSampleId[]=[...warriorIds,...Object.keys(MINIBOSS_AMBIENCE_SAMPLES) as MinibossAmbienceId[],...Object.keys(MINIBOSS_SAMPLES) as MinibossSampleId[],...mageSampleIds,...wardenIds,'frost-ultimate',...Object.keys(FIRE_ULTIMATE_SAMPLES) as FireSampleId[]];
const isAmbience=(id:AudioSampleId):id is MinibossAmbienceId=>Object.hasOwn(MINIBOSS_AMBIENCE_SAMPLES,id);
const isMini=(id:AudioSampleId):id is MinibossSampleId=>Object.hasOwn(MINIBOSS_SAMPLES,id);
const miniEvents:Partial<Record<SoundEvent,MinibossSampleId>>={
  'mini.runeCast':'mini-rune-cast','mini.astralCast':'mini-astral-cast','mini.teleport':'mini-teleport',
  'mini.briarCharge':'mini-briar-charge','mini.briarMelee':'mini-briar-melee','mini.totemCast':'mini-totem-cast',
};
const isFire=(id:AudioSampleId):id is FireSampleId=>Object.hasOwn(FIRE_ULTIMATE_SAMPLES,id);
const isWarden=(id:AudioSampleId):id is WardenSampleId=>Object.hasOwn(ASH_WARDEN_SAMPLES,id);
const wardenEvents:Partial<Record<SoundEvent,{sample:WardenSampleId}&SampleRange>>={
  'final.swing-windup':{sample:'warden-swing',offset:0,duration:WARDEN_AUDIO_LEAD.swing},
  'final.slash':{sample:'warden-swing',offset:WARDEN_AUDIO_LEAD.swing},
  'final.slam':{sample:'warden-slam'},
  'final.charge':{sample:'warden-charge'},
  'final.cleave':{sample:'warden-flamestrike'},
  'final.meteor-fall':{sample:'warden-meteor',offset:0,duration:WARDEN_AUDIO_LEAD.meteor},
  'final.impact':{sample:'warden-meteor',offset:WARDEN_AUDIO_LEAD.meteor},
};
export const audioSampleForEvent=(event:SoundEvent)=>warriorEvents[event]??miniEvents[event]??(event==='ultimate.frostImpact'?'frost-ultimate':event==='ultimate.fire'?'fire-ultimate-pulse':wardenEvents[event]?.sample??mageSampleForEvent(event));
export function audioSampleRange(event:SoundEvent):SampleRange|undefined{
  const entry=wardenEvents[event];return entry&&(entry.offset!==undefined||entry.duration!==undefined)?{offset:entry.offset,duration:entry.duration}:undefined;
}
export const audioSampleKey=(id:AudioSampleId)=>isWarrior(id)?`pixel-audio:warrior-uploaded-v1:${id}:${WARRIOR_SAMPLES[id].sha256.slice(0,12)}`:isAmbience(id)?`pixel-audio:miniboss-ambience-v1:${id}:${MINIBOSS_AMBIENCE_SAMPLES[id].sha256.slice(0,12)}`:isMini(id)?`pixel-audio:miniboss-v1:${id}:${MINIBOSS_SAMPLES[id].sha256.slice(0,12)}`:id==='frost-ultimate'?`pixel-audio:frost-ultimate-v1:${FROST_ULTIMATE_SAMPLE.sha256.slice(0,12)}`:isFire(id)?`pixel-audio:fire-ultimate-v1:${id}:${FIRE_ULTIMATE_SAMPLES[id].sha256.slice(0,12)}`:isWarden(id)?`pixel-audio:warden-uploaded-v1:${id}:${ASH_WARDEN_SAMPLES[id].sha256.slice(0,12)}`:mageSampleKey(id);
export const audioSampleUrl=(id:AudioSampleId)=>isWarrior(id)?import.meta.env.BASE_URL+WARRIOR_SAMPLES[id].file:isAmbience(id)?import.meta.env.BASE_URL+MINIBOSS_AMBIENCE_SAMPLES[id].file:isMini(id)?import.meta.env.BASE_URL+MINIBOSS_SAMPLES[id].file:id==='frost-ultimate'?import.meta.env.BASE_URL+FROST_ULTIMATE_SAMPLE.file:isFire(id)?import.meta.env.BASE_URL+FIRE_ULTIMATE_SAMPLES[id].file:isWarden(id)?import.meta.env.BASE_URL+ASH_WARDEN_SAMPLES[id].file:mageSampleUrl(id);
export const audioSampleGain=(id:AudioSampleId)=>isWarrior(id)?WARRIOR_SAMPLES[id].gain:isAmbience(id)?MINIBOSS_AMBIENCE_SAMPLES[id].gain:isMini(id)?MINIBOSS_SAMPLES[id].gain:id==='frost-ultimate'?FROST_ULTIMATE_SAMPLE.gain:isFire(id)?FIRE_ULTIMATE_SAMPLES[id].gain:isWarden(id)?ASH_WARDEN_SAMPLES[id].gain:mageSampleGain(id);
