import {
  averagePoints,
  clamp01,
  cosineSimilarity,
  distance3d,
  inverseLerp,
  subtract,
} from '../utils/math';
import type {
  HandPoseIntentSnapshot,
  NormalizedPoint,
  TrackedHand,
} from '../utils/types';
import {
  INDEX_MCP_INDEX,
  INDEX_PIP_INDEX,
  INDEX_TIP_INDEX,
  MIDDLE_MCP_INDEX,
  MIDDLE_PIP_INDEX,
  MIDDLE_TIP_INDEX,
  PINKY_MCP_INDEX,
  PINKY_PIP_INDEX,
  PINKY_TIP_INDEX,
  RING_MCP_INDEX,
  RING_PIP_INDEX,
  RING_TIP_INDEX,
  THUMB_CMC_INDEX,
  THUMB_MCP_INDEX,
  THUMB_TIP_INDEX,
  WRIST_INDEX,
} from './handLandmarks';
import {
  FINGER_AWAY_MAX,
  FINGER_AWAY_MIN,
  FINGER_AWAY_WEIGHT,
  FINGER_CURLED_THRESHOLD,
  FINGER_EXTENSION_MAX,
  FINGER_EXTENSION_MIN,
  FINGER_EXTENSION_WEIGHT,
  FINGER_OPEN_THRESHOLD,
  FINGER_STRAIGHT_MAX,
  FINGER_STRAIGHT_MIN,
  FINGER_STRAIGHT_WEIGHT,
  GRIP_POSE_CURLED_WEIGHT,
  GRIP_POSE_OPEN_WEIGHT,
  OPEN_HAND_FINGER_WEIGHT,
  OPEN_HAND_THUMB_WEIGHT,
  RELEASE_GRIP_CANCEL_THRESHOLD,
  RELEASE_MIN_OPEN_FINGERS,
  RELEASE_OPEN_SCORE_THRESHOLD,
  THUMB_AWAY_MAX,
  THUMB_AWAY_MIN,
  THUMB_AWAY_WEIGHT,
  THUMB_OPEN_THRESHOLD,
  THUMB_STRAIGHT_MAX,
  THUMB_STRAIGHT_MIN,
  THUMB_STRAIGHT_WEIGHT,
} from './intentTuning';

/**
 * Hand-pose intent (open-hand / grip-pose / release-ready) derived from MediaPipe landmarks.
 * Pure functions with no cross-frame state; the open-hand release gesture is the primary
 * whole-system release signal, so the per-hand scoring lives here in one place.
 */
export function computeHandPoseIntent(hand: TrackedHand): HandPoseIntentSnapshot {
  const wrist = hand.landmarks[WRIST_INDEX];
  const indexMcp = hand.landmarks[INDEX_MCP_INDEX];
  const middleMcp = hand.landmarks[MIDDLE_MCP_INDEX];
  const ringMcp = hand.landmarks[RING_MCP_INDEX];
  const pinkyMcp = hand.landmarks[PINKY_MCP_INDEX];
  const thumbCmc = hand.landmarks[THUMB_CMC_INDEX];
  const thumbMcp = hand.landmarks[THUMB_MCP_INDEX];
  const thumbTip = hand.landmarks[THUMB_TIP_INDEX];

  if (
    !wrist ||
    !indexMcp ||
    !middleMcp ||
    !ringMcp ||
    !pinkyMcp ||
    !thumbCmc ||
    !thumbMcp ||
    !thumbTip ||
    hand.palmScale <= 0
  ) {
    return createEmptyHandPose();
  }

  const palmCenter = averagePoints([wrist, indexMcp, middleMcp, ringMcp, pinkyMcp]);
  const fingerScores = [
    computeLongFingerOpenScore(hand, INDEX_MCP_INDEX, INDEX_PIP_INDEX, INDEX_TIP_INDEX),
    computeLongFingerOpenScore(
      hand,
      MIDDLE_MCP_INDEX,
      MIDDLE_PIP_INDEX,
      MIDDLE_TIP_INDEX,
    ),
    computeLongFingerOpenScore(hand, RING_MCP_INDEX, RING_PIP_INDEX, RING_TIP_INDEX),
    computeLongFingerOpenScore(
      hand,
      PINKY_MCP_INDEX,
      PINKY_PIP_INDEX,
      PINKY_TIP_INDEX,
    ),
  ];
  const thumbOpenScore = computeThumbOpenScore(hand, palmCenter);
  const longFingerOpenCount = fingerScores.filter(
    (score) => score >= FINGER_OPEN_THRESHOLD,
  ).length;
  const curledFingerCount = fingerScores.filter(
    (score) => score < FINGER_CURLED_THRESHOLD,
  ).length;
  const longFingerAverage =
    fingerScores.reduce((sum, score) => sum + score, 0) / fingerScores.length;
  const openHandScore = clamp01(
    longFingerAverage * OPEN_HAND_FINGER_WEIGHT + thumbOpenScore * OPEN_HAND_THUMB_WEIGHT,
  );
  const gripPoseScore = clamp01(
    (1 - openHandScore) * GRIP_POSE_OPEN_WEIGHT +
      (curledFingerCount / fingerScores.length) * GRIP_POSE_CURLED_WEIGHT,
  );

  return {
    openHandScore,
    gripPoseScore,
    openFingerCount:
      longFingerOpenCount + (thumbOpenScore >= THUMB_OPEN_THRESHOLD ? 1 : 0),
    releaseReady:
      openHandScore >= RELEASE_OPEN_SCORE_THRESHOLD &&
      longFingerOpenCount >= RELEASE_MIN_OPEN_FINGERS &&
      gripPoseScore <= RELEASE_GRIP_CANCEL_THRESHOLD,
  };
}

function computeLongFingerOpenScore(
  hand: TrackedHand,
  mcpIndex: number,
  pipIndex: number,
  tipIndex: number,
): number {
  const mcp = hand.landmarks[mcpIndex];
  const pip = hand.landmarks[pipIndex];
  const tip = hand.landmarks[tipIndex];

  if (!mcp || !pip || !tip || hand.palmScale <= 0) {
    return 0;
  }

  const straightness = cosineSimilarity(subtract(pip, mcp), subtract(tip, pip));
  const straightScore = inverseLerp(
    FINGER_STRAIGHT_MIN,
    FINGER_STRAIGHT_MAX,
    straightness,
  );
  const extensionScore = inverseLerp(
    FINGER_EXTENSION_MIN,
    FINGER_EXTENSION_MAX,
    distance3d(tip, mcp) / hand.palmScale,
  );
  const awayScore = inverseLerp(
    FINGER_AWAY_MIN,
    FINGER_AWAY_MAX,
    distance3d(tip, hand.center) / hand.palmScale,
  );

  return clamp01(
    straightScore * FINGER_STRAIGHT_WEIGHT +
      extensionScore * FINGER_EXTENSION_WEIGHT +
      awayScore * FINGER_AWAY_WEIGHT,
  );
}

function computeThumbOpenScore(
  hand: TrackedHand,
  palmCenter: NormalizedPoint,
): number {
  const thumbCmc = hand.landmarks[THUMB_CMC_INDEX];
  const thumbMcp = hand.landmarks[THUMB_MCP_INDEX];
  const thumbTip = hand.landmarks[THUMB_TIP_INDEX];

  if (!thumbCmc || !thumbMcp || !thumbTip || hand.palmScale <= 0) {
    return 0;
  }

  const straightness = cosineSimilarity(
    subtract(thumbMcp, thumbCmc),
    subtract(thumbTip, thumbMcp),
  );
  const straightScore = inverseLerp(
    THUMB_STRAIGHT_MIN,
    THUMB_STRAIGHT_MAX,
    straightness,
  );
  const awayScore = inverseLerp(
    THUMB_AWAY_MIN,
    THUMB_AWAY_MAX,
    distance3d(thumbTip, palmCenter) / hand.palmScale,
  );

  return clamp01(straightScore * THUMB_STRAIGHT_WEIGHT + awayScore * THUMB_AWAY_WEIGHT);
}

export function computeReleaseGesture(
  leftHandPose: HandPoseIntentSnapshot,
  rightHandPose: HandPoseIntentSnapshot,
): { active: boolean; score: number } {
  const leftScore = leftHandPose.openHandScore ?? 0;
  const rightScore = rightHandPose.openHandScore ?? 0;
  const score = Math.min(leftScore, rightScore);

  return {
    active: leftHandPose.releaseReady && rightHandPose.releaseReady,
    score,
  };
}

export function createEmptyHandPose(): HandPoseIntentSnapshot {
  return {
    openHandScore: null,
    gripPoseScore: null,
    openFingerCount: 0,
    releaseReady: false,
  };
}
