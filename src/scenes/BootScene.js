import Phaser from 'phaser';
import { DEFAULT_SAVE, loadSave, saveData } from '../managers/SaveManager.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    this.load.image('nyang-forest-background', `${import.meta.env.BASE_URL}assets/backgrounds/fairytale-forest-run.jpg`);
    this.load.spritesheet('nyang-cat', `${import.meta.env.BASE_URL}assets/characters/nyang-cat-animations.png`, {
      frameWidth: 362,
      frameHeight: 362,
    });
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#FFF5E7');
    this.add.text(width / 2, height / 2 - 42, '냥이의 대모험', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '48px', color: '#5D4B41',
    }).setOrigin(0.5);
    const bar = this.add.rectangle(width / 2, height / 2 + 35, 320, 14, 0x8fb79b).setOrigin(0, 0.5);
    bar.scaleX = 0;
    this.loadingBar = bar;
    this.loadProjectData();
  }

  loadProjectData() {
    const { data, warning, errorType } = loadSave();
    this.registry.set('saveData', data);
    this.registry.set('saveWarning', warning);
    if (errorType === 'corrupt') {
      this.showRecoveryDialog();
      return;
    }
    this.openMenu();
  }

  openMenu() {
    this.tweens.add({ targets: this.loadingBar, scaleX: 1, duration: 250, onComplete: () => this.scene.start('MenuScene') });
  }

  showRecoveryDialog() {
    const { width, height } = this.scale;
    this.recoveryObjects?.forEach((object) => object.destroy());
    this.recoveryObjects = [];
    const shade = this.add.rectangle(width / 2, height / 2, width, height, 0x493e37, 0.6).setDepth(100);
    const panel = this.add.rectangle(width / 2, height / 2, 680, 350, 0xfff5e7, 1).setDepth(101);
    panel.setStrokeStyle(4, 0xd8c6a5);
    const title = this.add.text(width / 2, height / 2 - 104, '저장 데이터를 읽지 못했어요', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '31px', color: '#5D4B41',
    }).setOrigin(0.5).setDepth(102);
    const message = this.add.text(width / 2, height / 2 - 34,
      '기존 기록은 아직 삭제하지 않았어요. 다시 시도하거나 초기화할 수 있어요.', {
        fontFamily: 'Gowun Dodum, sans-serif', fontSize: '20px', color: '#75655a', align: 'center',
      }).setOrigin(0.5).setDepth(102);
    this.recoveryObjects.push(shade, panel, title, message);
    this.makeRecoveryButton(width / 2 - 145, height / 2 + 94, '다시 시도', () => {
      this.recoveryObjects.forEach((object) => object.destroy());
      this.recoveryObjects = [];
      this.loadProjectData();
    });
    this.makeRecoveryButton(width / 2 + 145, height / 2 + 94, '초기화', () => this.confirmReset());
  }

  confirmReset() {
    const { width, height } = this.scale;
    this.recoveryObjects.forEach((object) => object.destroy());
    this.recoveryObjects = [];
    const shade = this.add.rectangle(width / 2, height / 2, width, height, 0x493e37, 0.6).setDepth(100);
    const panel = this.add.rectangle(width / 2, height / 2, 680, 300, 0xfff5e7, 1).setDepth(101);
    panel.setStrokeStyle(4, 0xd8c6a5);
    const title = this.add.text(width / 2, height / 2 - 82, '기록을 초기화할까요?', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '32px', color: '#5D4B41',
    }).setOrigin(0.5).setDepth(102);
    const message = this.add.text(width / 2, height / 2 - 18,
      '초기화하면 보유 생선과 최고 기록이 모두 삭제돼요.', {
        fontFamily: 'Gowun Dodum, sans-serif', fontSize: '20px', color: '#75655a', align: 'center',
      }).setOrigin(0.5).setDepth(102);
    this.recoveryObjects.push(shade, panel, title, message);
    this.makeRecoveryButton(width / 2 - 145, height / 2 + 78, '취소', () => this.showRecoveryDialog());
    this.makeRecoveryButton(width / 2 + 145, height / 2 + 78, '초기화할게요', () => {
      const saved = saveData(DEFAULT_SAVE);
      this.registry.set('saveData', { ...DEFAULT_SAVE });
      this.registry.set('saveWarning', saved ? null : '저장하지 못해 이번 실행에서는 기록을 보관할 수 없어요.');
      this.openMenu();
    });
  }

  makeRecoveryButton(x, y, label, action) {
    const shape = this.add.rectangle(x, y, 240, 60, 0x8fb79b, 16)
      .setDepth(102).setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '21px', color: '#fff',
    }).setOrigin(0.5).setDepth(103);
    shape.on('pointerdown', action);
    this.recoveryObjects.push(shape, text);
  }
}
