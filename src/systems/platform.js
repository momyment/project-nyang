export function isTouchDevice(navigatorObject = globalThis.navigator, mediaQuery = globalThis.matchMedia) {
  return Boolean(navigatorObject?.maxTouchPoints > 0 || mediaQuery?.('(pointer: coarse)')?.matches);
}

export function requiresLandscape(width, height, touchDevice) {
  return Boolean(touchDevice && width < height);
}

export function getControlInstructions(touchDevice) {
  return touchDevice
    ? '냥이는 자동으로 달려요!\n점프: 오른쪽 버튼 · 공중에서 다시 누르면 2단 점프\n슬라이딩: 왼쪽 버튼을 누르고 있기'
    : '냥이는 자동으로 달려요!\n점프: Space 또는 ↑ · 공중에서 다시 누르면 2단 점프\n슬라이딩: ↓ 키를 누르고 있기';
}
