export function createScoreState() {
  return { distancePx: 0, distanceM: 0, collectedFish: 0, score: 0 };
}

export function calculateScore(distancePx, collectedFish) {
  return Math.floor(Math.max(0, distancePx) / 30) + Math.max(0, collectedFish) * 10;
}

export function advanceScore(state, distanceDeltaPx = 0, fishDelta = 0) {
  if (state.phase && state.phase !== 'running') return state;
  const distancePx = Math.max(0, state.distancePx + distanceDeltaPx);
  const collectedFish = Math.max(0, state.collectedFish + fishDelta);
  return {
    ...state,
    distancePx,
    distanceM: Math.floor(distancePx / 30),
    collectedFish,
    score: calculateScore(distancePx, collectedFish),
  };
}
