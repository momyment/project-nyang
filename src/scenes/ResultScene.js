import Phaser from 'phaser';
import { retrySettlement } from '../managers/RewardManager.js';

const COLORS = Object.freeze({
  sky: 0xb9dde8,
  cream: 0xfff8ec,
  paper: 0xfffdf8,
  ink: '#5D4B41',
  muted: '#8B7769',
  green: 0x527b61,
  greenLight: 0xe7f0e4,
  gold: 0xd8aa55,
  border: 0xe5d5bb,
});

export class ResultScene extends Phaser.Scene {
  constructor() { super('ResultScene'); }

  create() {
    const { width, height } = this.scale;
    this.settlement = this.registry.get('lastSettlement');
    const result = this.settlement?.result ?? {};
    this.cameras.main.setBackgroundColor(COLORS.sky);

    // 배경 장식은 가장자리에만 두어 결과 정보와 겹치지 않게 합니다.
    this.add.ellipse(90, height - 22, 300, 150, 0xa8c9a4, 0.65);
    this.add.ellipse(width - 70, height - 18, 360, 170, 0x91b99d, 0.7);
    this.add.rectangle(width / 2, height - 8, width, 44, 0xead7b5);
    this.add.rectangle(width / 2, height - 29, width, 6, 0x85aa88);

    this.add.text(width / 2, 47, '모험 완료!', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '48px', color: COLORS.ink, fontStyle: 'bold',
    }).setOrigin(0.5);

    const newRecord = result.newBestScore || result.newBestDistance;
    if (newRecord) {
      this.add.text(width / 2, 96, '✦  새로운 기록을 세웠어요!  ✦', {
        fontFamily: 'Gowun Dodum, sans-serif', fontSize: '22px', color: '#9A7443',
      }).setOrigin(0.5);
    } else {
      this.add.text(width / 2, 96, '오늘도 멋진 모험이었어요', {
        fontFamily: 'Gowun Dodum, sans-serif', fontSize: '21px', color: COLORS.muted,
      }).setOrigin(0.5);
    }

    const cardTop = 137;
    const cardHeight = 410;
    const card = this.add.graphics();
    card.fillStyle(COLORS.paper, 0.98);
    card.fillRoundedRect(width / 2 - 370, cardTop, 740, cardHeight, 28);
    card.lineStyle(3, COLORS.border, 1);
    card.strokeRoundedRect(width / 2 - 370, cardTop, 740, cardHeight, 28);

    // 이번 플레이의 점수를 가장 먼저 읽을 수 있게 별도 영역에 강조합니다.
    this.add.text(width / 2, 166, '이번 모험 점수', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '20px', color: COLORS.muted,
    }).setOrigin(0.5);
    this.add.text(width / 2, 211, `${result.score ?? 0}`, {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '64px', color: COLORS.ink, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(width / 2, 263, '점', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '20px', color: COLORS.muted,
    }).setOrigin(0.5);

    const tileY = 344;
    const tileWidth = 205;
    const tileGap = 18;
    const tileStart = width / 2 - (tileWidth * 3 + tileGap * 2) / 2 + tileWidth / 2;
    const stats = [
      ['이동 거리', `${result.distanceM ?? 0}m`],
      ['이번 생선', `${result.collectedFish ?? 0}개`],
      ['보유 생선', `${result.fishBalance ?? 0}개`],
    ];
    stats.forEach(([label, value], index) => {
      const x = tileStart + index * (tileWidth + tileGap);
      const tile = this.add.graphics();
      tile.fillStyle(COLORS.greenLight, 1);
      tile.fillRoundedRect(x - tileWidth / 2, tileY - 44, tileWidth, 94, 16);
      this.add.text(x, tileY - 22, label, {
        fontFamily: 'Gowun Dodum, sans-serif', fontSize: '17px', color: COLORS.muted,
      }).setOrigin(0.5);
      this.add.text(x, tileY + 12, value, {
        fontFamily: 'Gowun Dodum, sans-serif', fontSize: '25px', color: COLORS.ink, fontStyle: 'bold',
      }).setOrigin(0.5);
    });

    this.add.text(width / 2, 424, '나의 최고 기록', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '18px', color: COLORS.muted,
    }).setOrigin(0.5);
    this.add.text(width / 2 - 115, 466, `${result.bestScore ?? 0}점`, {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '21px', color: COLORS.ink,
    }).setOrigin(0.5);
    this.add.text(width / 2 + 135, 466, `최장 거리  ${result.bestDistance ?? 0}m`, {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '21px', color: COLORS.ink,
    }).setOrigin(0.5);

    this.saveStatus = this.add.text(width / 2, 568, '', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '17px', color: '#4E7958',
    }).setOrigin(0.5);
    this.showSaveStatus();
    this.makeButton(width / 2 - 145, 655, '다시 달리기', 270, () => this.scene.start('RunScene'), true);
    this.makeButton(width / 2 + 165, 655, '메인 화면', 230, () => this.scene.start('MenuScene'), false);
  }

  showSaveStatus() {
    if (this.settlement?.saved) {
      this.retryButton?.graphics.destroy();
      this.retryButton?.hitArea.destroy();
      this.retryButton?.text.destroy();
      this.retryButton = null;
      this.saveStatus.setColor('#4E7958').setText('✓  결과와 생선 기록을 저장했어요');
      return;
    }
    this.saveStatus.setColor('#A95D62').setText('저장하지 못했어요. 아래에서 다시 시도해 주세요.');
    this.retryButton = this.makeButton(this.scale.width / 2, 600, '저장 다시 시도', 220, () => {
      const saved = retrySettlement(this.settlement);
      if (saved) {
        this.settlement.saved = true;
        this.registry.set('saveData', this.settlement.save);
        this.showSaveStatus();
      } else {
        this.saveStatus.setText('다시 저장하지 못했어요. 잠시 후 다시 눌러 주세요.');
      }
    }, false, 42, 17);
  }

  makeButton(x, y, label, width, onClick, primary, height = 60, fontSize = 22) {
    const graphics = this.add.graphics();
    const draw = (fill, stroke = fill) => {
      graphics.clear();
      graphics.fillStyle(fill, 1);
      graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, 18);
      graphics.lineStyle(2, stroke, 1);
      graphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 18);
    };
    draw(primary ? COLORS.green : COLORS.paper, primary ? COLORS.green : COLORS.green);
    const hitArea = this.add.rectangle(x, y, width, height, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: `${fontSize}px`,
      color: primary ? '#ffffff' : '#45664e', fontStyle: 'bold',
    }).setOrigin(0.5);
    hitArea.on('pointerover', () => draw(primary ? 0x426d52 : 0xf3f7ef, primary ? 0x426d52 : 0x426d52));
    hitArea.on('pointerout', () => draw(primary ? COLORS.green : COLORS.paper, COLORS.green));
    hitArea.on('pointerdown', onClick);
    return { graphics, hitArea, text };
  }
}
