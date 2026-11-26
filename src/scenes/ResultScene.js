import Phaser from 'phaser';
import { retrySettlement } from '../managers/RewardManager.js';

export class ResultScene extends Phaser.Scene {
  constructor() { super('ResultScene'); }

  create() {
    const { width, height } = this.scale;
    const settlement = this.registry.get('lastSettlement');
    this.settlement = settlement;
    this.cameras.main.setBackgroundColor('#B9DDE8');
    this.add.ellipse(width / 2, height / 2 + 165, 800, 260, 0x8fb79b);
    this.add.rectangle(width / 2, height - 45, width, 110, 0xead7b5);
    this.add.text(width / 2, 72, '모험 완료!', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '56px', color: '#5D4B41', fontStyle: 'bold',
    }).setOrigin(0.5);
    if (settlement?.result?.newBestScore || settlement?.result?.newBestDistance) {
      this.add.text(width / 2, 132, '새로운 기록을 세웠어요!', {
        fontFamily: 'Gowun Dodum, sans-serif', fontSize: '28px', color: '#9A7443',
      }).setOrigin(0.5);
    }
    const result = settlement?.result ?? {};
    const panel = this.add.rectangle(width / 2, 350, 590, 300, 0xfff5e7, 0.96);
    panel.setStrokeStyle(3, 0xd8c6a5);
    this.add.text(width / 2, 255,
      `점수       ${result.score ?? 0}점\n이동 거리   ${result.distanceM ?? 0}m\n이번 생선   ${result.collectedFish ?? 0}개\n보유 생선   ${result.fishBalance ?? 0}개\n최고 점수   ${result.bestScore ?? 0}점\n최장 거리   ${result.bestDistance ?? 0}m`, {
        fontFamily: 'Gowun Dodum, sans-serif', fontSize: '24px', color: '#5D4B41',
        lineSpacing: 14, align: 'left',
      }).setOrigin(0.5, 0);
    this.saveStatus = this.add.text(width / 2, 526, '', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '20px', color: '#A95D62',
    }).setOrigin(0.5);
    this.showSaveStatus();
    this.makeButton(width / 2 - 170, 624, '다시 달리기', 280, () => this.scene.start('RunScene'));
    this.makeButton(width / 2 + 170, 624, '메인 화면', 230, () => this.scene.start('MenuScene'));
  }

  showSaveStatus() {
    if (this.settlement?.saved) {
      this.saveStatus.setColor('#5D8A62').setText('결과와 보유 생선을 저장했어요.');
      return;
    }
    this.saveStatus.setText('저장하지 못했어요. 아래를 눌러 다시 저장해 주세요.');
    this.makeButton(this.scale.width / 2, 568, '저장 다시 시도', 260, () => {
      const saved = retrySettlement(this.settlement);
      if (saved) {
        this.settlement.saved = true;
        this.registry.set('saveData', this.settlement.save);
        this.showSaveStatus();
      } else {
        this.saveStatus.setText('다시 저장하지 못했어요. 잠시 후 다시 눌러 주세요.');
      }
    }, 52, 18);
  }

  makeButton(x, y, label, width, onClick, height = 64, fontSize = 23) {
    const shape = this.add.rectangle(x, y, width, height, 0x8fb79b, 18)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: `${fontSize}px`, color: '#ffffff',
    }).setOrigin(0.5);
    shape.on('pointerover', () => shape.setFillStyle(0x79a98a));
    shape.on('pointerout', () => shape.setFillStyle(0x8fb79b));
    shape.on('pointerdown', onClick);
  }
}
