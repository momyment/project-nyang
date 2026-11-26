import { GAME_CONFIG } from '../config/gameConfig.js';

export const DEFAULT_SAVE = Object.freeze({
  fish: 0,
  bestScore: 0,
  bestDistance: 0,
  hasDefaultCharacter: true,
  selectedCharacter: 'CHR-001',
  tutorialSeen: false,
  lastSettledPlayId: null,
  schemaVersion: GAME_CONFIG.saveVersion,
});

export function normaliseSave(input = {}) {
  return {
    fish: validNonNegativeInt(input.fish, DEFAULT_SAVE.fish),
    bestScore: validNonNegativeInt(input.bestScore, DEFAULT_SAVE.bestScore),
    bestDistance: validNonNegativeInt(input.bestDistance, DEFAULT_SAVE.bestDistance),
    hasDefaultCharacter: input.hasDefaultCharacter !== false,
    selectedCharacter: typeof input.selectedCharacter === 'string' ? input.selectedCharacter : DEFAULT_SAVE.selectedCharacter,
    tutorialSeen: input.tutorialSeen === true,
    lastSettledPlayId: typeof input.lastSettledPlayId === 'string' ? input.lastSettledPlayId : null,
    schemaVersion: GAME_CONFIG.saveVersion,
  };
}

function validNonNegativeInt(value, fallback) {
  return Number.isSafeInteger(value) && value >= 0 ? value : fallback;
}

export function loadSave(storage) {
  let store;
  try {
    store = storage ?? globalThis.localStorage;
  } catch {
    return sessionFallback('저장소에 접근할 수 없어 이번 실행에서는 기록을 저장하지 않습니다.', 'storage');
  }

  let raw;
  try {
    raw = store.getItem(GAME_CONFIG.saveKey);
  } catch {
    return sessionFallback('저장소에 접근할 수 없어 이번 실행에서는 기록을 저장하지 않습니다.', 'storage');
  }
  if (raw === null) {
    const data = { ...DEFAULT_SAVE };
    try {
      store.setItem(GAME_CONFIG.saveKey, JSON.stringify(data));
      return { data, warning: null, errorType: null };
    } catch {
      return { ...sessionFallback('저장소에 접근할 수 없어 이번 실행에서는 기록을 저장하지 않습니다.', 'storage'), data };
    }
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return sessionFallback('기존 저장 데이터를 읽지 못했어요. 다시 시도하거나 저장 데이터를 초기화할 수 있어요.', 'corrupt');
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return sessionFallback('기존 저장 데이터를 읽지 못했어요. 다시 시도하거나 저장 데이터를 초기화할 수 있어요.', 'corrupt');
  }
  const data = normaliseSave(parsed);
  if (JSON.stringify(parsed) !== JSON.stringify(data)) {
    try {
      store.setItem(GAME_CONFIG.saveKey, JSON.stringify(data));
    } catch {
      return { ...sessionFallback('저장소에 접근할 수 없어 이번 실행에서는 기록을 저장하지 않습니다.', 'storage'), data };
    }
  }
  return { data, warning: null, errorType: null };
}

function sessionFallback(warning, errorType) {
  return { data: { ...DEFAULT_SAVE }, warning, errorType };
}

export function saveData(data, storage) {
  try {
    const store = storage ?? globalThis.localStorage;
    store.setItem(GAME_CONFIG.saveKey, JSON.stringify(normaliseSave(data)));
    return true;
  } catch {
    return false;
  }
}
