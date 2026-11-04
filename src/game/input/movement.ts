import type { Point } from '../utils/math';

export interface MovementInput extends Point { analog?: boolean }

export const STICK_DEADZONE = 0.19;
export function radialStick(x: number, y: number): Point {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { x: 0, y: 0 };
  const length = Math.hypot(x, y);
  if (length <= STICK_DEADZONE) return { x: 0, y: 0 };
  const magnitude = (Math.min(1, length) - STICK_DEADZONE) / (1 - STICK_DEADZONE);
  return { x: x / length * magnitude, y: y / length * magnitude };
}

// A nonzero digital source wins. Never add independent movement vectors.
export function selectMovement(keyboard: Point, touch: Point, stick: Point): MovementInput {
  if (keyboard.x || keyboard.y) return keyboard;
  if (touch.x || touch.y) return touch;
  return { ...stick, analog: true };
}
