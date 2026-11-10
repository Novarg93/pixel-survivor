import { inject, ref, type InjectionKey, type Ref } from 'vue';
import type { InputDevice } from '../game/events/bridge';
export const INPUT_DEVICE: InjectionKey<Ref<InputDevice>> = Symbol('input-device');
export function useInputDevice() { return inject(INPUT_DEVICE, ref<InputDevice>('keyboard')); }
