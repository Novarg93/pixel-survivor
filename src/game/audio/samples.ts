import {MINIBOSS_AMBIENCE_SAMPLES} from './minibossAmbienceSamples';
import {MINIBOSS_SAMPLES} from './minibossSamples';
import {FROST_ULTIMATE_SAMPLE} from './frostUltimateSample';
import {FIRE_ULTIMATE_SAMPLES} from './fireUltimateSamples';
import {mageSampleIds,mageSampleKey,mageSampleUrl,mageSampleGain,mageSampleForEvent,type MageSampleId} from './mageSamples';
import {ASH_WARDEN_SAMPLES} from './ashWardenSamples';
import type {SoundEvent} from './catalog';

export type WardenSampleId=keyof typeof ASH_WARDEN_SAMPLES;
export type FireSampleId=keyof typeof FIRE_ULTIMATE_SAMPLES;
export type MinibossSampleId=keyof typeof MINIBOSS_SAMPLES;
export type MinibossAmbienceId=keyof typeof MINIBOSS_AMBIENCE_SAMPLES;
export type AudioSampleId=MinibossAmbienceId|MinibossSampleId|MageSampleId|WardenSampleId|FireSampleId|'frost-ultimate';
export interface SampleRange {offset?:number;duration?:number}
// Measured lead-ins of the supplied recordings; presentation only, not combat timing.
export const WARDEN_AUDIO_LEAD={swing:.30,meteor:.20} as const;
const wardenIds=Object.keys(ASH_WARDEN_SAMPLES) as WardenSampleId[];
export const audioSampleIds:AudioSampleId[]=[...Object.keys(MINIBOSS_AMBIENCE_SAMPLES) as MinibossAmbienceId[],...Object.keys(MINIBOSS_SAMPLES) as MinibossSampleId[],...mageSampleIds,...wardenIds,'frost-ultimate',...Object.keys(FIRE_ULTIMATE_SAMPLES) as FireSampleId[]];
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
export const audioSampleForEvent=(event:SoundEvent)=>miniEvents[event]??(event==='ultimate.frostImpact'?'frost-ultimate':event==='ultimate.fire'?'fire-ultimate-pulse':wardenEvents[event]?.sample??mageSampleForEvent(event));
export function audioSampleRange(event:SoundEvent):SampleRange|undefined{
  const entry=wardenEvents[event];return entry&&(entry.offset!==undefined||entry.duration!==undefined)?{offset:entry.offset,duration:entry.duration}:undefined;
}
export const audioSampleKey=(id:AudioSampleId)=>isAmbience(id)?`pixel-audio:miniboss-ambience-v1:${id}:${MINIBOSS_AMBIENCE_SAMPLES[id].sha256.slice(0,12)}`:isMini(id)?`pixel-audio:miniboss-v1:${id}:${MINIBOSS_SAMPLES[id].sha256.slice(0,12)}`:id==='frost-ultimate'?`pixel-audio:frost-ultimate-v1:${FROST_ULTIMATE_SAMPLE.sha256.slice(0,12)}`:isFire(id)?`pixel-audio:fire-ultimate-v1:${id}:${FIRE_ULTIMATE_SAMPLES[id].sha256.slice(0,12)}`:isWarden(id)?`pixel-audio:warden-uploaded-v1:${id}:${ASH_WARDEN_SAMPLES[id].sha256.slice(0,12)}`:mageSampleKey(id);
export const audioSampleUrl=(id:AudioSampleId)=>isAmbience(id)?import.meta.env.BASE_URL+MINIBOSS_AMBIENCE_SAMPLES[id].file:isMini(id)?import.meta.env.BASE_URL+MINIBOSS_SAMPLES[id].file:id==='frost-ultimate'?import.meta.env.BASE_URL+FROST_ULTIMATE_SAMPLE.file:isFire(id)?import.meta.env.BASE_URL+FIRE_ULTIMATE_SAMPLES[id].file:isWarden(id)?import.meta.env.BASE_URL+ASH_WARDEN_SAMPLES[id].file:mageSampleUrl(id);
export const audioSampleGain=(id:AudioSampleId)=>isAmbience(id)?MINIBOSS_AMBIENCE_SAMPLES[id].gain:isMini(id)?MINIBOSS_SAMPLES[id].gain:id==='frost-ultimate'?FROST_ULTIMATE_SAMPLE.gain:isFire(id)?FIRE_ULTIMATE_SAMPLES[id].gain:isWarden(id)?ASH_WARDEN_SAMPLES[id].gain:mageSampleGain(id);
