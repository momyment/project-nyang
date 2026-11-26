import { DIFFICULTY_CONFIG, GAME_CONFIG } from '../config/gameConfig.js';

export function getDifficulty(distanceM) {
  return DIFFICULTY_CONFIG.find((level) => distanceM >= level.minDistance && distanceM <= level.maxDistance)
    ?? DIFFICULTY_CONFIG.at(-1);
}

export function advanceDifficulty(state, deltaMs) {
  if (state.phase !== 'running' || deltaMs <= 0) return state;
  const difficulty = getDifficulty(state.distanceM);
  const targetSpeed = GAME_CONFIG.baseSpeed * difficulty.speedMultiplier;
  const maxChange = GAME_CONFIG.speedAcceleration * deltaMs / 1000;
  const difference = targetSpeed - state.speed;
  const speed = state.speed + Math.sign(difference) * Math.min(Math.abs(difference), maxChange);
  return {
    ...state,
    difficultyLevel: difficulty.level,
    targetSpeed,
    speed: Math.min(GAME_CONFIG.baseSpeed * 1.8, speed),
  };
}
