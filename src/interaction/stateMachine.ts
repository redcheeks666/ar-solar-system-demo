import type { InteractionState } from '../utils/types';

const VALID_TRANSITIONS: Record<InteractionState, ReadonlySet<InteractionState>> = {
  CameraReady: new Set(['EmptyIdle']),
  EmptyIdle: new Set(['HandsClosed']),
  HandsClosed: new Set(['EmptyIdle', 'PullArmed']),
  PullArmed: new Set(['EmptyIdle', 'HandsClosed', 'SolarOpening']),
  SolarOpening: new Set(['SolarActive', 'EmptyIdle']),
  SolarActive: new Set(['BodyHover']),
  BodyHover: new Set(['SolarActive', 'BodyGrabbed']),
  BodyGrabbed: new Set(['BodyDetached', 'BodyReturning']),
  BodyDetached: new Set(['BodyGrabbed', 'BodyReturning']),
  BodyReturning: new Set(['SolarActive']),
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
