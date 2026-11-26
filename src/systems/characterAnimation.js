export function getCharacterAnimationKey(movementState) {
  if (movementState === 'SLIDE') return 'nyang-slide';
  if (movementState === 'FALL') return 'nyang-fall';
  if (movementState === 'JUMP' || movementState === 'DOUBLE_JUMP') return 'nyang-jump';
  return 'nyang-run';
}
