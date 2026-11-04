import { radialStick } from './movement';
import type { Point } from '../utils/math';

// Positions in the browser's standard mapping, independent of device names.
export const GAMEPAD_BUTTONS = { confirm: 0, mobility: 2, previous: 4, next: 5, pause: 9, up: 12, down: 13, left: 14, right: 15 } as const;
export type GamepadAction = keyof typeof GAMEPAD_BUTTONS;
export type GamepadNotice = 'connected' | 'disconnected' | 'unsupported' | 'unavailable';
export type GamepadState = Pick<Gamepad, 'index' | 'connected' | 'mapping' | 'axes' | 'buttons'>;
export interface GamepadFrame { movement: Point; actions: GamepadAction[] }
interface Options {
  target: EventTarget;
  visibilityTarget: EventTarget;
  hidden: () => boolean;
  read?: () => readonly (GamepadState | null)[];
  notice: (notice: GamepadNotice) => void;
  activity: () => void;
}
const zero = (): Point => ({ x: 0, y: 0 });
function supported(pad: GamepadState) {
  return pad.mapping === 'standard' && pad.axes.length >= 2 && pad.axes.slice(0, 2).every(Number.isFinite)
    && pad.buttons.length >= 16 && Object.values(GAMEPAD_BUTTONS).every(i => pad.buttons[i] && Number.isFinite(pad.buttons[i].value));
}

// Owned by GameScene. poll is called ONLY by its existing update, even while
// World is paused. No RAF, timers, retained native pad objects or per-run listeners.
export class GamepadInputController {
  private index: number | undefined;
  private previous = new Set<number>();
  private context = '';
  private baseline = true;
  private needsNeutral = false;
  private focused = true;
  private disposed = false;
  private unavailable = false;
  private issue = '';
  private movement = zero();
  constructor(private options: Options) {
    options.target.addEventListener('blur', this.blur);
    options.target.addEventListener('focus', this.focus);
    options.target.addEventListener('gamepaddisconnected', this.disconnect);
    options.visibilityTarget.addEventListener('visibilitychange', this.visibility);
  }
  private blur = () => { this.focused = false; this.reset(); };
  private focus = () => { this.focused = true; this.reset(); };
  private visibility = () => { this.focused = !this.options.hidden(); this.reset(); };
  private disconnect = (event: Event) => {
    if ((event as GamepadEvent).gamepad.index === this.index) this.drop();
  };
  private drop() {
    if (this.index !== undefined) this.options.notice('disconnected');
    this.index = undefined; this.reset();
  }
  reset(preserveMovement = false) {
    this.baseline = true;
    if (!preserveMovement) { this.needsNeutral = true; this.movement = zero(); }
  }
  poll(context: string): GamepadFrame {
    const empty = (): GamepadFrame => ({ movement: zero(), actions: [] });
    if (this.disposed || this.unavailable || !this.focused || this.options.hidden()) return empty();
    let pads: readonly (GamepadState | null)[];
    try {
      if (!this.options.read) throw new Error('Gamepad API unavailable');
      pads = this.options.read();
    } catch {
      this.drop(); this.unavailable = true; this.options.notice('unavailable'); return empty();
    }
    const connected = pads.filter((p): p is GamepadState => !!p?.connected);
    let pad = connected.find(p => p.index === this.index && supported(p));
    if (!pad) {
      if (this.index !== undefined) this.drop();
      pad = connected.find(supported);
      if (pad) {
        this.index = pad.index; this.baseline = true; this.issue = '';
        this.options.notice('connected');
      }
    }
    if (!pad) {
      const issue = connected.length ? `unsupported:${connected[0].index}` : '';
      if (issue && this.issue !== issue) this.options.notice('unsupported');
      this.issue = issue;
      return empty();
    }
    const pressed = new Set(Object.values(GAMEPAD_BUTTONS).filter(i => pad.buttons[i].pressed || pad.buttons[i].value > .5));
    const actions = this.baseline || context !== this.context ? [] : (Object.keys(GAMEPAD_BUTTONS) as GamepadAction[])
      .filter(action => pressed.has(GAMEPAD_BUTTONS[action]) && !this.previous.has(GAMEPAD_BUTTONS[action]));
    this.previous = pressed; this.context = context; this.baseline = false;
    const stick = radialStick(pad.axes[0], pad.axes[1]);
    if (!stick.x && !stick.y) this.needsNeutral = false;
    const movement = this.needsNeutral ? zero() : stick;
    if (actions.length || Math.hypot(movement.x, movement.y) > 0 && (Math.hypot(this.movement.x, this.movement.y) === 0 || Math.hypot(movement.x - this.movement.x, movement.y - this.movement.y) > .03)) this.options.activity();
    this.movement = movement;
    return { movement, actions };
  }
  destroy() {
    if (this.disposed) return;
    this.disposed = true; this.index = undefined; this.reset(); this.previous.clear();
    this.options.target.removeEventListener('blur', this.blur);
    this.options.target.removeEventListener('focus', this.focus);
    this.options.target.removeEventListener('gamepaddisconnected', this.disconnect);
    this.options.visibilityTarget.removeEventListener('visibilitychange', this.visibility);
  }
}
