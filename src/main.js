import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { RunScene } from './scenes/RunScene.js';
import { ResultScene } from './scenes/ResultScene.js';
import { GAME_CONFIG } from './config/gameConfig.js';
import { isTouchDevice, requiresLandscape } from './systems/platform.js';
import './style.css';

function updateOrientationWarning() {
  const warning = document.getElementById('orientation-warning');
  warning.hidden = !requiresLandscape(window.innerWidth, window.innerHeight, isTouchDevice());
}

window.addEventListener('resize', updateOrientationWarning);
window.addEventListener('orientationchange', updateOrientationWarning);
updateOrientationWarning();

try {
  new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_CONFIG.width,
    height: GAME_CONFIG.height,
    backgroundColor: '#f8f3e8',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene, MenuScene, RunScene, ResultScene],
    accessibility: { keyboard: true },
  });
} catch (error) {
  const warning = document.getElementById('orientation-warning');
  warning.hidden = false;
  warning.textContent = '게임을 불러오지 못했어요. 페이지를 새로고침해 주세요.';
  console.error('Project NYANG 초기화 오류:', error);
}
