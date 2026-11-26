import { normaliseSave, saveData } from './SaveManager.js';

/** Build one immutable settlement snapshot before attempting storage. */
export function createSettlement(saveInput, run) {
  const save = normaliseSave(saveInput);
  if (save.lastSettledPlayId === run.playId) {
    return {
      duplicate: true,
      newBestScore: false,
      newBestDistance: false,
      save,
      result: makeResult(save, run, false, false, true),
    };
  }

  const newBestScore = run.score > save.bestScore;
  const newBestDistance = run.distanceM > save.bestDistance;
  const updated = normaliseSave({
    ...save,
    fish: save.fish + run.collectedFish,
    bestScore: Math.max(save.bestScore, run.score),
    bestDistance: Math.max(save.bestDistance, run.distanceM),
    lastSettledPlayId: run.playId,
  });
  return {
    duplicate: false,
    newBestScore,
    newBestDistance,
    save: updated,
    result: makeResult(updated, run, newBestScore, newBestDistance, false),
  };
}

function makeResult(save, run, newBestScore, newBestDistance, duplicate) {
  return {
    playId: run.playId,
    score: run.score,
    distanceM: run.distanceM,
    collectedFish: run.collectedFish,
    fishBalance: save.fish,
    bestScore: save.bestScore,
    bestDistance: save.bestDistance,
    newBestScore,
    newBestDistance,
    duplicate,
  };
}

export function settleRun(save, run, storage) {
  const settlement = createSettlement(save, run);
  const saved = settlement.duplicate || saveData(settlement.save, storage);
  return { ...settlement, saved };
}

/** Retry the exact saved snapshot; never add the run reward a second time. */
export function retrySettlement(settlement, storage) {
  return saveData(settlement.save, storage);
}
