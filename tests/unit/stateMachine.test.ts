import { describe, expect, it } from 'vitest';
import { InteractionStateMachine } from '../../src/interaction/stateMachine';

describe('InteractionStateMachine', () => {
  it('allows direct body activation from solar browsing states', () => {
    const fromActive = new InteractionStateMachine();
    fromActive.transition('EmptyIdle');
    fromActive.transition('HandsClosed');
    fromActive.transition('PullArmed');
    fromActive.transition('SolarOpening');
    fromActive.transition('SolarActive');
    expect(() => fromActive.transition('PlanetActivated')).not.toThrow();
    expect(fromActive.state).toBe('PlanetActivated');

    const fromFreeHover = new InteractionStateMachine();
    fromFreeHover.transition('EmptyIdle');
    fromFreeHover.transition('HandsClosed');
    fromFreeHover.transition('PullArmed');
    fromFreeHover.transition('SolarOpening');
    fromFreeHover.transition('SolarActive');
    fromFreeHover.transition('SolarFreeHover');
    expect(() => fromFreeHover.transition('PlanetActivated')).not.toThrow();
    expect(fromFreeHover.state).toBe('PlanetActivated');
  });
});
