import { describe, expect, it } from 'vitest';
import {
  computeCollapseIntentScore,
  computeControlConfidence,
  computePinchPenalty,
  computePinchPenaltySnapshot,
  computeReleaseConfidence,
  computeReGripConfidence,
  computeScaleIntentScore,
  computeSpatialPalmPostureScore,
  getReGripReason,
  getRotationIntent,
  getScaleIntent,
  matchEndpoints,
  type EndpointMatch,
  type HandPointPair,
} from '../../src/interaction/intentScoring';
import { createHand, point } from '../helpers/syntheticHands';
import { DEFAULT_GESTURE_THRESHOLDS } from '../helpers/testThresholds';

const matchedEndpoints: EndpointMatch = {
  leftMatched: true,
  rightMatched: true,
  score: 1,
};

function visibleHandPair(): HandPointPair {
  return {
    left: point(0.7, 0.5),
    right: point(0.3, 0.5),
    bothHandsVisible: true,
    lostHandHoldActive: false,
  };
}

describe('matchEndpoints', () => {
  it('scores direct endpoint hits inside the radius', () => {
    const match = matchEndpoints(
      visibleHandPair(),
      {
        left: point(0.7, 0.5),
        right: point(0.3, 0.5),
      },
      0.1,
    );

    expect(match).toEqual({
      leftMatched: true,
      rightMatched: true,
      score: 1,
    });
  });

  it('uses the lower-cost swapped assignment when hands arrive in opposite endpoint order', () => {
    const match = matchEndpoints(
      visibleHandPair(),
      {
        left: point(0.3, 0.5),
        right: point(0.7, 0.5),
      },
      0.1,
    );

    expect(match.leftMatched).toBe(true);
    expect(match.rightMatched).toBe(true);
    expect(match.score).toBe(1);
  });

  it('drops endpoint matches and score when both hands are outside the radius', () => {
    const match = matchEndpoints(
      visibleHandPair(),
      {
        left: point(0.45, 0.5),
        right: point(0.55, 0.5),
      },
      0.1,
    );

    expect(match.leftMatched).toBe(false);
    expect(match.rightMatched).toBe(false);
    expect(match.score).toBe(0);
  });
});

describe('control, release, and re-grip confidence', () => {
  it('raises control confidence with endpoint hits, tracking, palm evidence, and state inertia', () => {
    const low = computeControlConfidence({
      endpointScore: 0,
      availabilityScore: 0,
      palmFacingScore: 0,
      palmUpScore: 0,
      pinchPenalty: 0,
      hasStateInertia: false,
      trackingConfidence: 0,
    });
    const high = computeControlConfidence({
      endpointScore: 1,
      availabilityScore: 1,
      palmFacingScore: 1,
      palmUpScore: 0,
      pinchPenalty: 0,
      hasStateInertia: true,
      trackingConfidence: 1,
    });

    expect(low).toBeGreaterThan(0);
    expect(high).toBe(1);
    expect(high).toBeGreaterThan(low);
  });

  it('treats complete hand loss as release, but softens release while lost-hand hold is active', () => {
    expect(
      computeReleaseConfidence(
        {
          ...visibleHandPair(),
          bothHandsVisible: false,
          lostHandHoldActive: false,
        },
        matchedEndpoints,
        1,
      ),
    ).toBe(1);
    expect(
      computeReleaseConfidence(
        {
          ...visibleHandPair(),
          bothHandsVisible: false,
          lostHandHoldActive: true,
        },
        matchedEndpoints,
        1,
      ),
    ).toBe(0.28);
  });

  it('classifies precise and wide-magnet re-grip only from free-hover candidate states', () => {
    const precise = getReGripReason(
      'SolarFreeHover',
      matchedEndpoints,
      { leftMatched: false, rightMatched: false, score: 0 },
      0,
    );
    const wideMagnet = getReGripReason(
      'ReGripCandidate',
      { leftMatched: false, rightMatched: false, score: 0 },
      matchedEndpoints,
      0.7,
    );
    const inactive = getReGripReason(
      'SolarHandleControl',
      matchedEndpoints,
      matchedEndpoints,
      1,
    );

    expect(precise).toBe('endpoint');
    expect(wideMagnet).toBe('wideMagnet');
    expect(inactive).toBe('none');
  });

  it('keeps re-grip confidence lower when a planet-pinch penalty is present', () => {
    const base = computeReGripConfidence({
      endpointScore: 1,
      availabilityScore: 1,
      palmFacingScore: 1,
      palmUpScore: 0,
      pinchPenalty: 0,
      trackingConfidence: 1,
    });
    const penalized = computeReGripConfidence({
      endpointScore: 1,
      availabilityScore: 1,
      palmFacingScore: 1,
      palmUpScore: 0,
      pinchPenalty: 0.18,
      trackingConfidence: 1,
    });

    expect(base).toBe(1);
    expect(penalized).toBeLessThan(base);
  });
});

describe('scale, rotation, collapse, and pinch scoring', () => {
  it('scores scale intent only outside the velocity deadband and preserves velocity direction', () => {
    expect(computeScaleIntentScore(null, 1)).toBe(0);
    expect(getScaleIntent(0.01, computeScaleIntentScore(0.01, 1))).toBe('none');
    expect(getScaleIntent(0.12, computeScaleIntentScore(0.12, 1))).toBe('scaleUp');
    expect(getScaleIntent(-0.12, computeScaleIntentScore(-0.12, 1))).toBe('scaleDown');
  });

  it('classifies high rotation score as 2D or 3D from palm posture', () => {
    expect(getRotationIntent(0.1, 1, 0)).toBe('none');
    expect(getRotationIntent(0.5, 0, 1)).toBe('rotate2d');
    expect(getRotationIntent(0.5, 1, 0)).toBe('rotate3d');
    expect(computeSpatialPalmPostureScore(0, 0)).toBeGreaterThan(0);
  });

  it('scores reverse collapse from close distance and inward motion', () => {
    const atStart = computeCollapseIntentScore(
      DEFAULT_GESTURE_THRESHOLDS.collapseStartDistance,
      0,
      DEFAULT_GESTURE_THRESHOLDS,
    );
    const nearCompleteRelaxed = computeCollapseIntentScore(
      DEFAULT_GESTURE_THRESHOLDS.collapseCompleteDistance,
      0,
      DEFAULT_GESTURE_THRESHOLDS,
    );
    const nearCompleteInward = computeCollapseIntentScore(
      DEFAULT_GESTURE_THRESHOLDS.collapseCompleteDistance,
      -0.2,
      DEFAULT_GESTURE_THRESHOLDS,
    );

    expect(computeCollapseIntentScore(null, -0.2, DEFAULT_GESTURE_THRESHOLDS)).toBe(0);
    expect(atStart).toBe(0);
    expect(nearCompleteRelaxed).toBeGreaterThan(atStart);
    expect(nearCompleteInward).toBeGreaterThan(nearCompleteRelaxed);
    expect(nearCompleteInward).toBe(1);
  });

  it('applies stronger whole-system penalty when both hands are pinching', () => {
    const open = createHand({ center: point(0.7, 0.5), spread: 1.2 });
    const pinching = {
      ...open,
      thumbTip: point(0.7, 0.5),
      indexFingerTip: point(0.705, 0.5),
    };

    expect(computePinchPenalty({ left: open, right: open })).toBe(0);
    expect(computePinchPenalty({ left: pinching, right: open })).toBe(0.18);
    expect(computePinchPenalty({ left: pinching, right: pinching })).toBe(0.28);
    const snapshot = computePinchPenaltySnapshot({ left: pinching, right: open });
    expect(snapshot.leftRatio).toBeCloseTo(0.05);
    expect(snapshot.penalty).toBe(0.18);
  });
});
