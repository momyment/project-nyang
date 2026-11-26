import Phaser from 'phaser';
import { saveData } from '../managers/SaveManager.js';
import { getControlInstructions, isTouchDevice } from '../systems/platform.js';

const COLORS = Object.freeze({
  ink: '#57463e',
  mutedInk: '#806f63',
  cream: 0xfff8eb,
  green: 0x6d9b78,
  greenHover: 0x5e896a,
});

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); this.starting = false; }

  create() {
    const { width, height } = this.scale;
    this.touchDevice = isTouchDevice();
    this.starting = false;
    this.tutorialOpen = false;
    this.drawMenuBackground(width, height);

    this.add.text(width / 2, 83, '냥이의 대모험', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '62px', color: COLORS.ink, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(width / 2, 142, '작은 발걸음으로 떠나는 커다란 모험', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '25px', color: COLORS.mutedInk,
    }).setOrigin(0.5);

    const save = this.registry.get('saveData');
    this.drawInfoBadge(40, 30, `🐟  생선 ${save?.fish ?? 0}개`, 158);
    this.drawRecordCard(width - 40, 30, save);

    this.drawCat(300, 578, 1.05);
    this.drawStartCard(width - 305, 390, width, height);
    this.drawHelpButton(width - 40, height - 30, () => this.showTutorial(false));

    const warning = this.registry.get('saveWarning');
    if (warning) this.add.text(width / 2, height - 30, warning, {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '17px', color: '#b9585e',
    }).setOrigin(0.5, 1);
  }

  drawMenuBackground(width, height) {
    this.cameras.main.setBackgroundColor('#c4e2e9');

    const shapes = this.add.graphics();
    // 부드러운 햇빛과 구름으로 하늘에 작은 배경 포인트를 만듭니다.
    shapes.fillStyle(0xf7dfaa, 0.18).fillCircle(1082, 118, 78);
    shapes.fillStyle(0xf3d99a, 1).fillCircle(1082, 118, 48);
    this.drawCloud(shapes, 245, 240, 0xffffff, 0.72);
    this.drawCloud(shapes, 995, 255, 0xffffff, 0.56);

    // 멀리 있는 언덕과 앞쪽 초원을 분리해 캐릭터와 버튼을 또렷하게 보이게 합니다.
    shapes.fillStyle(0xa9cba8, 1).fillEllipse(215, 520, 600, 250);
    shapes.fillStyle(0x9fc49d, 1).fillEllipse(1080, 535, 620, 235);
    shapes.fillStyle(0x88b394, 1).fillEllipse(690, 604, 1150, 250);
    shapes.fillStyle(0xead8b6, 1).fillRect(0, height - 105, width, 105);
    shapes.fillStyle(0x789c72, 1).fillRect(0, height - 108, width, 6);

    // 산책길의 작은 꽃 장식
    for (const [x, y, color] of [[92, 633, 0xf1b7a8], [520, 661, 0xf3d27c], [1170, 640, 0xf1b7a8]]) {
      shapes.fillStyle(color, 0.9).fillCircle(x, y, 5);
      shapes.fillStyle(0xfff5e7, 0.9).fillCircle(x + 7, y + 1, 4);
      shapes.fillStyle(0xfff5e7, 0.9).fillCircle(x - 6, y + 2, 4);
      shapes.fillStyle(0x6c956f, 1).fillRect(x, y + 5, 2, 9);
    }
  }

  drawCloud(graphics, x, y, color, alpha) {
    graphics.fillStyle(color, alpha);
    graphics.fillEllipse(x, y + 10, 86, 27);
    graphics.fillCircle(x - 19, y + 3, 17);
    graphics.fillCircle(x + 2, y - 6, 23);
    graphics.fillCircle(x + 24, y + 4, 16);
  }

  drawInfoBadge(x, y, label, width) {
    const background = this.add.graphics();
    background.fillStyle(COLORS.cream, 0.96).fillRoundedRect(x, y, width, 44, 16);
    this.add.text(x + width / 2, y + 22, label, {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '20px', color: COLORS.ink,
    }).setOrigin(0.5);
  }

  drawRecordCard(right, y, save) {
    const width = 218;
    const left = right - width;
    const background = this.add.graphics();
    background.fillStyle(COLORS.cream, 0.94).fillRoundedRect(left, y, width, 68, 16);
    this.add.text(left + 18, y + 12, '나의 기록', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '16px', color: COLORS.mutedInk,
    });
    this.add.text(right - 16, y + 12, `${save?.bestScore ?? 0}점`, {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '18px', color: COLORS.ink, fontStyle: 'bold',
    }).setOrigin(1, 0);
    this.add.text(left + 18, y + 39, '최장 거리', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '15px', color: COLORS.mutedInk,
    });
    this.add.text(right - 16, y + 39, `${save?.bestDistance ?? 0}m`, {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '16px', color: COLORS.ink,
    }).setOrigin(1, 0);
  }

  drawCat(x, floorY, scale = 1) {
    return this.add.image(x, floorY, 'nyang-cat', 0)
      .setOrigin(0.5, 0.75)
      .setDisplaySize(250 * scale, 250 * scale);
  }

  drawStartCard(centerX, centerY, width, height) {
    const cardWidth = 430;
    const cardHeight = 250;
    const left = centerX - cardWidth / 2;
    const top = centerY - cardHeight / 2;
    const panel = this.add.graphics();
    panel.fillStyle(0x6f9478, 0.13).fillRoundedRect(left + 5, top + 8, cardWidth, cardHeight, 28);
    panel.fillStyle(COLORS.cream, 0.97).fillRoundedRect(left, top, cardWidth, cardHeight, 28);

    this.add.text(centerX, top + 49, '오늘은 어디까지 달려볼까요?', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '27px', color: COLORS.ink, fontStyle: 'bold',
      align: 'center', wordWrap: { width: cardWidth - 48 },
    }).setOrigin(0.5);
    this.add.text(centerX, top + 91, '냥이와 함께 첫 모험을 떠나요', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '18px', color: COLORS.mutedInk,
    }).setOrigin(0.5);

    const buttonY = top + 170;
    const buttonWidth = 300;
    const buttonHeight = 66;
    const buttonShape = this.add.graphics();
    const paintButton = (color) => {
      buttonShape.clear().fillStyle(color, 1)
        .fillRoundedRect(centerX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, 22);
    };
    paintButton(COLORS.green);
    const buttonZone = this.add.zone(centerX, buttonY, buttonWidth, buttonHeight)
      .setInteractive({ useHandCursor: true });
    const buttonLabel = this.add.text(centerX, buttonY, '모험 시작  ›', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '27px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    buttonZone.on('pointerover', () => paintButton(COLORS.greenHover));
    buttonZone.on('pointerout', () => paintButton(COLORS.green));

    const startRun = () => this.scene.start('RunScene');
    const begin = () => {
      if (this.starting) return;
      const currentSave = this.registry.get('saveData');
      if (!currentSave?.tutorialSeen) {
        this.starting = true;
        buttonZone.disableInteractive();
        this.showTutorial(true);
        return;
      }
      this.starting = true;
      buttonZone.disableInteractive();
      buttonLabel.setText('출발 준비 중…');
      startRun();
    };
    buttonZone.on('pointerdown', begin);
    buttonLabel.setInteractive({ useHandCursor: true }).on('pointerdown', begin);
  }

  showTutorial(firstRun) {
    if (this.tutorialOpen) return;
    this.tutorialOpen = true;
    const { width, height } = this.scale;
    const shade = this.add.rectangle(width / 2, height / 2, width, height, 0x493e37, 0.55);
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.cream, 1).fillRoundedRect(width / 2 - 340, height / 2 - 165, 680, 330, 28);
    const title = this.add.text(width / 2, height / 2 - 112, '모험 조작 안내', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '34px', color: COLORS.ink,
    }).setOrigin(0.5);
    const details = this.add.text(width / 2, height / 2 - 28,
      getControlInstructions(this.touchDevice), {
        fontFamily: 'Gowun Dodum, sans-serif', fontSize: '22px', color: COLORS.ink,
        align: 'center', lineSpacing: 14,
      }).setOrigin(0.5);
    const confirmGraphics = this.add.graphics();
    confirmGraphics.fillStyle(COLORS.green, 1).fillRoundedRect(width / 2 - 130, height / 2 + 81, 260, 58, 18);
    const confirm = this.add.zone(width / 2, height / 2 + 110, 260, 58)
      .setInteractive({ useHandCursor: true });
    const confirmLabel = this.add.text(width / 2, height / 2 + 110,
      firstRun ? '확인하고 시작' : '닫기', {
        fontFamily: 'Gowun Dodum, sans-serif', fontSize: '22px', color: '#ffffff',
      }).setOrigin(0.5);
    const handleConfirm = () => {
      if (firstRun) {
        const updated = { ...this.registry.get('saveData'), tutorialSeen: true };
        this.registry.set('saveData', updated);
        const ok = saveData(updated);
        if (!ok) this.registry.set('saveWarning', '안내 확인 상태를 저장하지 못했어요.');
        this.scene.start('RunScene');
      } else {
        this.tutorialOpen = false;
        shade.destroy(); panel.destroy(); title.destroy(); details.destroy();
        confirmGraphics.destroy(); confirm.destroy(); confirmLabel.destroy();
      }
    };
    confirm.on('pointerdown', handleConfirm);
    confirmLabel.setInteractive({ useHandCursor: true }).on('pointerdown', handleConfirm);
  }

  drawHelpButton(right, bottom, onClick) {
    const width = 154;
    const height = 42;
    const left = right - width;
    const top = bottom - height;
    const background = this.add.graphics();
    background.fillStyle(COLORS.cream, 0.95).fillRoundedRect(left, top, width, height, 16);
    const label = this.add.text(left + width / 2, top + height / 2, '조작 방법', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '17px', color: COLORS.ink,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const zone = this.add.zone(left + width / 2, top + height / 2, width, height)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerdown', onClick);
    label.on('pointerdown', onClick);
  }
}
