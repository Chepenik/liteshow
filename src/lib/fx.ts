// DJ Effects system: strobe, drop, bloom, spin, color, freeze, burst, divine

import { FX_NAMES, type FxName } from './constants';

export type FxState = Record<FxName, number>;

export function createFxState(): FxState {
  const state = {} as FxState;
  for (const name of FX_NAMES) state[name] = 0;
  return state;
}

export function updateFx(fx: FxState, dt: number): void {
  for (const k of FX_NAMES) {
    if (fx[k] > 0) fx[k] = Math.max(0, fx[k] - dt * 0.7);
  }
}

export function triggerFx(fx: FxState, name: FxName): void {
  fx[name] = 1;
}
