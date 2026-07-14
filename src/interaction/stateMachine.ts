import type { InteractionState } from '../utils/types';

const VALID_TRANSITIONS: Record<InteractionState, ReadonlySet<InteractionState>> = {
  CameraReady: new Set(['EmptyIdle']),
  EmptyIdle: new Set(['HandsClosed']),
  HandsClosed: new Set(['EmptyIdle', 'PullArmed']),
  PullArmed: new Set(['EmptyIdle', 'HandsClosed', 'SolarOpening']),
  SolarOpening: new Set(['SolarActive', 'SolarClosing', 'EmptyIdle']),
  SolarActive: new Set([
    'SolarFreeHover',
    'SolarHandleControl',
    'SolarClosing',
    'BodyHover',
    'PlanetActivated',
  ]),
  SolarFreeHover: new Set(['SolarHandleControl', 'BodyHover', 'PlanetActivated']),
  SolarHandleControl: new Set(['SolarActive', 'SolarFreeHover', 'SolarClosing']),
  SolarClosing: new Set(['SolarActive', 'SolarFreeHover', 'SolarHandleControl', 'EmptyIdle']),
  BodyHover: new Set(['SolarActive', 'SolarFreeHover', 'PlanetActivated']),
  PlanetActivated: new Set([
    'BodyHover',
    'SolarActive',
    'SolarFreeHover',
    'PlanetFocusView',
  ]),
  PlanetFocusView: new Set(['PlanetFocusControlled', 'PlanetFocusFloating', 'BodyReturning']),
  PlanetFocusControlled: new Set(['PlanetFocusFloating']),
  PlanetFocusFloating: new Set(['PlanetFocusControlled', 'BodyReturning']),
  BodyReturning: new Set(['SolarActive', 'SolarFreeHover']),
};

export class InteractionStateMachine {
  private current: InteractionState = 'CameraReady';

  get state(): InteractionState {
    return this.current;
  }

  transition(next: InteractionState): void {
    if (next === this.current) {
      return;
    }

    const allowed = VALID_TRANSITIONS[this.current];

    if (!allowed?.has(next)) {
      throw new Error(
        `Invalid interaction transition: ${this.current} -> ${next}`,
      );
    }

    this.current = next;
  }
}
