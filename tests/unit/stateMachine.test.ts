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

  it('allows return only from passive focus states, never while following', () => {
    const focusView = createFocusViewStateMachine();
    expect(() => focusView.transition('BodyReturning')).not.toThrow();

    const controlled = createFocusViewStateMachine();
    controlled.transition('PlanetFocusControlled');
    expect(() => controlled.transition('BodyReturning')).toThrow(
      /Invalid interaction transition/,
    );
  });
});

function createFocusViewStateMachine(): InteractionStateMachine {
  const interaction = new InteractionStateMachine();
  interaction.transition('EmptyIdle');
  interaction.transition('HandsClosed');
  interaction.transition('PullArmed');
  interaction.transition('SolarOpening');
  interaction.transition('SolarActive');
  interaction.transition('PlanetActivated');
  interaction.transition('PlanetFocusView');
  return interaction;
}
