import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { createRunnerState, advanceRunner, pressJump, getPlayerHitbox, damageRunner } from '../systems/runner.js';
import { ObstacleManager } from '../managers/ObstacleManager.js';
import { FishManager, markFishCollected } from '../managers/FishManager.js';
import { advanceScore } from '../managers/ScoreManager.js';
import { advanceDifficulty } from '../managers/DifficultyManager.js';
import { settleRun } from '../managers/RewardManager.js';
import { sweptHorizontalOverlap } from '../systems/collision.js';
import { getCharacterAnimationKey } from '../systems/characterAnimation.js';
import { isTouchDevice, requiresLandscape } from '../systems/platform.js';

export class RunScene extends Phaser.Scene {
  constructor() { super('RunScene'); this.state = createRunnerState(); }

  create() {
    const { width, height } = this.scale;
    this.state = createRunnerState();
    this.touchDevice = isTouchDevice();
    this.playId = globalThis.crypto?.randomUUID?.() ?? `play-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.finished = false;
    this.obstacleManager = new ObstacleManager();
    this.obstacles = [];
    this.fishManager = new FishManager();
    this.fishItems = [];
    this.createCatAnimations();
    const forestTexture = this.textures.get('nyang-forest-background').getSourceImage();
    const backgroundScaleX = width / forestTexture.width;
    const backgroundScaleY = height / forestTexture.height;
    this.createRepeatingForestTextures(forestTexture);
    this.backgroundLayer = this.add.tileSprite(width / 2, height / 2, width, height, 'nyang-forest-repeat')
      .setTileScale(backgroundScaleX, backgroundScaleY)
      .setDepth(0);
    const groundTexture = this.textures.get('nyang-ground-repeat').getSourceImage();
    this.groundLayer = this.add.tileSprite(
      width / 2,
      GAME_CONFIG.groundY + (height - GAME_CONFIG.groundY) / 2,
      width,
      height - GAME_CONFIG.groundY,
      'nyang-ground-repeat',
    ).setTileScale(backgroundScaleX, (height - GAME_CONFIG.groundY) / groundTexture.height)
      .setDepth(1);
    this.player = this.makeCat(GAME_CONFIG.playerX, GAME_CONFIG.groundY).setDepth(3);
    const { KeyCodes, JustDown } = Phaser.Input.Keyboard;
    this.jumpKeys = [
      this.input.keyboard.addKey(KeyCodes.SPACE, true),
      this.input.keyboard.addKey(KeyCodes.UP, true),
    ];
    this.slideKey = this.input.keyboard.addKey(KeyCodes.DOWN, true);
    this.isJustDown = JustDown;
    this.add.text(34, 24, '숲길을 달려요', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '24px', color: '#5D4B41',
      backgroundColor: '#FFF5E7', padding: { x: 12, y: 8 },
    }).setDepth(10);
    this.status = this.add.text(width - 34, 28, '출발 준비', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '24px', color: '#5D4B41',
      backgroundColor: '#FFF5E7', padding: { x: 12, y: 8 },
    }).setOrigin(1, 0).setDepth(10);
    this.pauseButton = this.add.text(width - 36, 82, 'Ⅱ 일시정지', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '19px', color: '#5D4B41',
      backgroundColor: '#FFF5E7', padding: { x: 12, y: 7 },
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(10);
    this.pauseButton.on('pointerdown', () => this.openPauseMenu(false));
    this.createTouchControls(width, height);
    this.healthLabel = this.add.text(34, 76, '', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '28px', color: '#E58B9B',
      backgroundColor: '#FFF5E7', padding: { x: 12, y: 6 },
    }).setDepth(10);
    this.updateHealthLabel();
    this.hudLabel = this.add.text(width / 2, 78, '', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '22px', color: '#5D4B41',
      backgroundColor: '#FFF5E7', padding: { x: 14, y: 8 },
    }).setOrigin(0.5, 0).setDepth(10);
    this.updateHud();
    this.add.text(width / 2, 26, this.touchDevice
      ? '왼쪽 버튼을 누르면 슬라이드  ·  오른쪽 버튼을 누르면 점프'
      : '점프 Space / ↑  ·  2단 점프 공중에서 다시 입력  ·  슬라이딩 ↓', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '18px', color: '#5D4B41',
      backgroundColor: '#FFF5E7', padding: { x: 12, y: 8 },
    }).setOrigin(0.5, 0).setDepth(10);
    this.countLabel = this.add.text(width / 2, height / 2 - 16, '', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '112px', color: '#F8FAFC',
      stroke: '#5D4B41', strokeThickness: 8,
    }).setOrigin(0.5);
    this.setupDebugTools();
    this.gameOverLabel = this.add.text(width / 2, height / 2 + 100, '모험 종료', {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '42px', color: '#5D4B41',
      backgroundColor: '#FFF5E7', padding: { x: 22, y: 14 },
    }).setOrigin(0.5).setVisible(false);
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC, true);
    this.onVisibilityChange = () => {
      if (document.hidden) this.openPauseMenu(true);
    };
    this.onViewportChange = () => {
      if (requiresLandscape(window.innerWidth, window.innerHeight, this.touchDevice)) {
        this.openPauseMenu(true);
      }
    };
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    window.addEventListener('resize', this.onViewportChange);
    window.addEventListener('orientationchange', this.onViewportChange);
    this.game.events.on(Phaser.Core.Events.BLUR, this.handleFocusLost, this);
    this.input.on('pointerup', this.releaseTouchInput, this);
    this.input.on('pointerupoutside', this.releaseTouchInput, this);
    this.input.on('pointermove', this.checkTouchBounds, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.removeFocusListeners, this);
    this.countdown();
  }

  makeCat(x, floorY) {
    return this.add.sprite(x, floorY, 'nyang-cat', 0)
      .setOrigin(0.5, 0.75)
      .setDisplaySize(184, 184)
      .play('nyang-run');
  }

  createRepeatingForestTextures(source) {
    const { width, height } = source;
    if (!this.textures.exists('nyang-forest-repeat')) {
      const texture = this.textures.createCanvas('nyang-forest-repeat', width * 2, height);
      const context = texture.getContext();
      context.drawImage(source, 0, 0, width, height);
      context.save();
      context.translate(width * 2, 0);
      context.scale(-1, 1);
      context.drawImage(source, 0, 0, width, height);
      context.restore();
      texture.refresh();
    }
    if (!this.textures.exists('nyang-ground-repeat')) {
      const cropY = Math.round(height * GAME_CONFIG.groundY / this.scale.height);
      const cropHeight = height - cropY;
      const texture = this.textures.createCanvas('nyang-ground-repeat', width * 2, cropHeight);
      const context = texture.getContext();
      context.drawImage(source, 0, cropY, width, cropHeight, 0, 0, width, cropHeight);
      context.save();
      context.translate(width * 2, 0);
      context.scale(-1, 1);
      context.drawImage(source, 0, cropY, width, cropHeight, 0, 0, width, cropHeight);
      context.restore();
      texture.refresh();
    }
  }

  createCatAnimations() {
    const animations = [
      { key: 'nyang-run', start: 0, end: 3, frameRate: 10, repeat: -1 },
      { key: 'nyang-jump', start: 4, end: 7, frameRate: 8, repeat: 0 },
      { key: 'nyang-fall', start: 7, end: 7, frameRate: 1, repeat: -1 },
      { key: 'nyang-slide', start: 8, end: 11, frameRate: 10, repeat: -1 },
    ];
    for (const animation of animations) {
      if (this.anims.exists(animation.key)) continue;
      this.anims.create({
        key: animation.key,
        frames: this.anims.generateFrameNumbers('nyang-cat', {
          start: animation.start,
          end: animation.end,
        }),
        frameRate: animation.frameRate,
        repeat: animation.repeat,
      });
    }
  }

  countdown() {
    this.state.phase = 'countdown';
    this.countdownValue = GAME_CONFIG.countdownSeconds;
    const show = () => {
      this.state.countdown = this.countdownValue;
      this.countLabel.setText(this.countdownValue > 0 ? String(this.countdownValue) : 'GO!');
      if (this.countdownValue === 0) {
        this.state.phase = 'running';
        this.status.setText('달리는 중');
        this.time.delayedCall(500, () => this.countLabel.setText(''));
        return;
      }
      this.countdownValue -= 1;
      this.countdownEvent = this.time.delayedCall(GAME_CONFIG.countdownStepMs, show);
    };
    show();
  }

  update(_time, delta) {
    if (this.pauseKey && this.isJustDown(this.pauseKey)) this.openPauseMenu(false);
    if (this.state.phase !== 'running') return;
    this.updateDebugTools();
    const jumpPressed = this.jumpKeys.some((key) => this.isJustDown(key));
    if (jumpPressed) this.state = pressJump(this.state);
    this.state = advanceRunner(this.state, delta, { slideHeld: this.slideKey.isDown || this.mobileSlideHeld });
    const worldDistance = this.state.speed * delta / 1000;
    this.state = advanceScore(this.state, worldDistance);
    this.state = advanceDifficulty(this.state, delta);
    const bob = this.state.movementState === 'RUN' ? Math.sin(this.state.elapsedMs / 85) * 2.5 : 0;
    this.player.y = GAME_CONFIG.groundY + this.state.playerY + bob;
    const nextAnimation = getCharacterAnimationKey(this.state.movementState);
    if (this.player.anims.currentAnim?.key !== nextAnimation) this.player.play(nextAnimation);
    this.player.setAlpha(
      this.state.invincibleRemainingMs > 0 && Math.floor(this.state.invincibleRemainingMs / 100) % 2 === 0 ? 0.38 : 1,
    );
    const scroll = worldDistance;
    this.backgroundLayer.tilePositionX += scroll * 0.18 / this.backgroundLayer.tileScaleX;
    this.groundLayer.tilePositionX += scroll / this.groundLayer.tileScaleX;

    for (const obstacle of this.obstacleManager.update(
      delta, this.state.speed, this.state.elapsedMs, GAME_CONFIG.groundY, this.state.difficultyLevel,
    )) {
      obstacle.graphic = this.drawObstacle(obstacle);
      this.obstacles.push(obstacle);
    }
    for (const fish of this.fishManager.update(this.state.elapsedMs, GAME_CONFIG.groundY, this.obstacles)) {
      fish.graphic = this.drawFish(fish);
      this.fishItems.push(fish);
    }

    const playerBox = getPlayerHitbox(this.state);
    const contacted = [];
    for (const obstacle of this.obstacles) {
      obstacle.previousX = obstacle.x;
      obstacle.x -= this.state.speed * delta / 1000;
      obstacle.graphic.x = obstacle.x;
      if (!obstacle.contacted && sweptHorizontalOverlap(playerBox, obstacle)) {
        obstacle.contacted = true;
        contacted.push(obstacle);
      }
    }

    if (contacted.length > 0) {
      const result = damageRunner(this.state);
      this.state = result.state;
      if (result.damaged) {
        this.updateHealthLabel();
        this.cameras.main.shake(90, 0.002);
      }
    }

    this.obstacles = this.obstacles.filter((obstacle) => {
      if (obstacle.x + obstacle.width < 0) {
        obstacle.graphic.destroy();
        return false;
      }
      return true;
    });

    let collectedNow = 0;
    for (const fish of this.fishItems) {
      fish.previousX = fish.x;
      fish.x -= worldDistance;
      fish.graphic.x = fish.x;
      if (this.state.phase === 'running' && !fish.collected
        && sweptHorizontalOverlap(playerBox, fish)) {
        if (markFishCollected(fish)) {
          collectedNow += 1;
          fish.graphic.destroy();
        }
      }
    }
    if (this.state.phase === 'running' && collectedNow > 0) {
      this.state = advanceScore(this.state, 0, collectedNow);
    }
    this.fishItems = this.fishItems.filter((fish) => {
      if (fish.collected || fish.x + fish.width < 0) {
        if (!fish.collected) fish.graphic.destroy();
        return false;
      }
      return true;
    });
    this.updateHud();

    if (this.state.phase === 'gameOver') {
      this.status.setText('달리기 종료');
      this.gameOverLabel.setVisible(true);
      this.player.setAlpha(1);
      this.finishRun();
    }
  }

  handleFocusLost() {
    this.openPauseMenu(true);
  }

  removeFocusListeners() {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('resize', this.onViewportChange);
    window.removeEventListener('orientationchange', this.onViewportChange);
    this.game.events.off(Phaser.Core.Events.BLUR, this.handleFocusLost, this);
    this.input.off('pointerup', this.releaseTouchInput, this);
    this.input.off('pointerupoutside', this.releaseTouchInput, this);
    this.input.off('pointermove', this.checkTouchBounds, this);
  }

  createTouchControls(width, height) {
    if (!this.touchDevice) return;
    const buttonY = height - 112;
    this.slideTouchButton = this.createTouchButton(112, buttonY, '↓', '슬라이드');
    this.jumpTouchButton = this.createTouchButton(width - 112, buttonY, '↑', '점프');
    this.slideTouchButton.on('pointerdown', (pointer) => {
      if (this.state.phase !== 'running') return;
      this.slidePointerId = pointer.id;
      this.mobileSlideHeld = true;
      this.slideTouchButton.setPressed(true);
    });
    this.jumpTouchButton.on('pointerdown', () => {
      this.jumpTouchButton.setPressed(true);
      if (this.state.phase === 'running') this.state = pressJump(this.state);
    });
    this.jumpTouchButton.on('pointerup', () => this.jumpTouchButton.setPressed(false));
    this.jumpTouchButton.on('pointerout', () => this.jumpTouchButton.setPressed(false));
  }

  createTouchButton(x, y, icon, label) {
    const width = 158;
    const height = 112;
    const background = this.add.graphics().setDepth(5);
    const paint = (pressed = false) => {
      const fill = label === '점프' ? 0x6d9b78 : 0x8e715d;
      background.clear();
      background.fillStyle(0x493e37, pressed ? 0.2 : 0.14)
        .fillRoundedRect(x - width / 2 + 3, y - height / 2 + 5, width, height, 30);
      background.fillStyle(fill, pressed ? 0.98 : 0.82)
        .fillRoundedRect(x - width / 2, y - height / 2, width, height, 30);
      background.lineStyle(3, 0xfff5e7, 0.92)
        .strokeRoundedRect(x - width / 2, y - height / 2, width, height, 30);
    };
    paint();
    const zone = this.add.zone(x, y, width, height)
      .setDepth(6).setInteractive({ useHandCursor: false });
    zone.setPressed = paint;
    this.add.text(x, y - 15, icon, {
      fontFamily: 'Arial, sans-serif', fontSize: '42px', color: '#ffffff', fontStyle: 'bold',
      stroke: 'rgba(73, 62, 55, 0.35)', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(7);
    this.add.text(x, y + 29, label, {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
      stroke: 'rgba(73, 62, 55, 0.35)', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(7);
    return zone;
  }

  setupDebugTools() {
    this.debugEnabled = import.meta.env.DEV;
    if (!this.debugEnabled) return;
    const keyboard = this.input.keyboard;
    this.debugKeys = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7']
      .map((key) => keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[key], true));
    this.debugPanel = this.add.text(26, 145, '', {
      fontFamily: 'monospace', fontSize: '15px', color: '#fff',
      backgroundColor: '#493e37', padding: { x: 9, y: 7 }, lineSpacing: 4,
    }).setDepth(20).setVisible(false);
    this.hitboxGraphics = this.add.graphics().setDepth(4).setVisible(false);
  }

  updateDebugTools() {
    if (!this.debugEnabled) return;
    const [toggle, addDistance, addFish, toggleInvincible, forceEnd, failSave, toggleHitbox] = this.debugKeys;
    if (this.isJustDown(toggle)) this.debugPanel.setVisible(!this.debugPanel.visible);
    if (this.isJustDown(addDistance)) this.state = advanceScore(this.state, 15_000);
    if (this.isJustDown(addFish)) this.state = advanceScore(this.state, 0, 1);
    if (this.isJustDown(toggleInvincible)) {
      this.state.invincibleRemainingMs = this.state.invincibleRemainingMs > 0 ? 0 : Number.MAX_SAFE_INTEGER;
    }
    if (this.isJustDown(forceEnd)) this.state = damageRunner({ ...this.state, health: 1, invincibleRemainingMs: 0 }).state;
    if (this.isJustDown(failSave)) this.forceSaveFailure = !this.forceSaveFailure;
    if (this.isJustDown(toggleHitbox)) this.hitboxGraphics.setVisible(!this.hitboxGraphics.visible);

    if (this.debugPanel.visible) {
      this.debugPanel.setText([
        '개발 확인 도구 (개발 모드 전용)',
        `F1 이 패널  ·  상태 ${this.state.phase}  ·  FPS ${Math.round(this.game.loop.actualFps)}`,
        `F2 +500m  ·  거리 ${this.state.distanceM}m  ·  레벨 ${this.state.difficultyLevel}`,
        `F3 +생선  ·  생선 ${this.state.collectedFish}  ·  점수 ${this.state.score}`,
        'F4 무적 켜기/끄기  ·  F5 게임 종료',
        `F6 저장 실패 ${this.forceSaveFailure ? '켜짐' : '꺼짐'}  ·  F7 충돌 영역 표시`,
      ]);
    }
    if (this.hitboxGraphics.visible) {
      this.hitboxGraphics.clear();
      const playerBox = getPlayerHitbox(this.state);
      this.hitboxGraphics.lineStyle(2, 0xff4f64, 1).strokeRect(playerBox.x, playerBox.y, playerBox.width, playerBox.height);
      for (const obstacle of this.obstacles) {
        this.hitboxGraphics.lineStyle(2, 0xffd24f, 1).strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      }
    }
  }

  releaseTouchInput(pointer) {
    if (pointer && this.slidePointerId !== undefined && pointer.id !== this.slidePointerId) return;
    this.mobileSlideHeld = false;
    this.slidePointerId = undefined;
    this.slideTouchButton?.setPressed(false);
    this.jumpTouchButton?.setPressed(false);
  }

  checkTouchBounds(pointer) {
    if (!this.mobileSlideHeld || pointer.id !== this.slidePointerId) return;
    const bounds = this.slideTouchButton.getBounds();
    if (!bounds.contains(pointer.worldX, pointer.worldY)) this.releaseTouchInput(pointer);
  }

  openPauseMenu(automatic) {
    if (this.finished || this.state.phase === 'paused' || this.state.phase === 'gameOver') return;
    if (!['running', 'countdown'].includes(this.state.phase)) return;
    this.pausedFromCountdown = this.state.phase === 'countdown';
    this.countdownEvent?.remove(false);
    this.state.phase = 'paused';
    this.releaseTouchInput();
    this.slideKey.reset();
    this.jumpKeys.forEach((key) => key.reset());
    this.pauseButton.setVisible(false);
    this.showPauseOptions(automatic);
  }

  showPauseOptions(automatic = false) {
    this.showDialog(
      '잠시 쉬어갈까요?',
      automatic ? '화면이 바뀌어 모험을 잠시 멈췄어요.' : '현재 거리와 점수는 그대로 보관돼요.',
      [
        { label: '계속하기', action: () => this.resumeRun() },
        { label: '다시 시작', action: () => this.showConfirm('다시 시작할까요?', '현재 획득한 보상은 저장되지 않아요.', '다시 시작', () => this.scene.restart()) },
        { label: '메인 화면', action: () => this.showConfirm('모험을 그만할까요?', '현재 획득한 보상은 저장되지 않아요.', '나가기', () => this.scene.start('MenuScene')) },
      ],
    );
  }

  resumeRun() {
    this.clearDialog();
    this.pauseButton.setVisible(true);
    this.state.phase = 'countdown';
    this.status.setText('다시 출발해요');
    this.countdown();
  }

  showConfirm(title, message, confirmLabel, confirmAction) {
    this.clearDialog();
    this.showDialog(title, message, [
      { label: '취소', action: () => this.showPauseOptions(false) },
      { label: confirmLabel, action: confirmAction },
    ]);
  }

  showDialog(title, message, buttons) {
    this.clearDialog();
    this.dialogObjects = [];
    const { width, height } = this.scale;
    const shade = this.add.rectangle(width / 2, height / 2, width, height, 0x493e37, 0.58).setDepth(100);
    shade.setInteractive();
    const panel = this.add.rectangle(width / 2, height / 2, 650, 350, 0xfff5e7, 1).setDepth(101);
    panel.setStrokeStyle(4, 0xd8c6a5);
    const heading = this.add.text(width / 2, height / 2 - 112, title, {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '36px', color: '#5D4B41',
    }).setOrigin(0.5).setDepth(102);
    const body = this.add.text(width / 2, height / 2 - 38, message, {
      fontFamily: 'Gowun Dodum, sans-serif', fontSize: '21px', color: '#75655a', align: 'center',
    }).setOrigin(0.5).setDepth(102);
    this.dialogObjects.push(shade, panel, heading, body);
    const buttonY = height / 2 + 94;
    const positions = buttons.length === 3 ? [-205, 0, 205] : [-145, 145];
    buttons.forEach((button, index) => {
      const x = width / 2 + positions[index];
      const shape = this.add.rectangle(x, buttonY, buttons.length === 3 ? 185 : 230, 64, 0x8fb79b, 16)
        .setDepth(102).setInteractive({ useHandCursor: true });
      const label = this.add.text(x, buttonY, button.label, {
        fontFamily: 'Gowun Dodum, sans-serif', fontSize: '22px', color: '#ffffff',
      }).setOrigin(0.5).setDepth(103);
      shape.on('pointerover', () => shape.setFillStyle(0x79a98a));
      shape.on('pointerout', () => shape.setFillStyle(0x8fb79b));
      shape.on('pointerdown', button.action);
      this.dialogObjects.push(shape, label);
    });
  }

  clearDialog() {
    this.dialogObjects?.forEach((object) => object.destroy());
    this.dialogObjects = [];
  }

  finishRun() {
    if (this.finished) return;
    this.finished = true;
    const storage = this.forceSaveFailure ? { setItem() { throw new Error('Debug: save failed'); } } : undefined;
    const settlement = settleRun(this.registry.get('saveData'), {
      playId: this.playId,
      score: this.state.score,
      distanceM: this.state.distanceM,
      collectedFish: this.state.collectedFish,
    }, storage);
    if (settlement.saved) this.registry.set('saveData', settlement.save);
    this.registry.set('lastSettlement', settlement);
    this.time.delayedCall(850, () => this.scene.start('ResultScene'));
  }

  updateHealthLabel() {
    this.healthLabel.setText(`${'♥ '.repeat(this.state.health)}${'♡ '.repeat(GAME_CONFIG.maxHealth - this.state.health)}`.trim());
  }

  updateHud() {
    this.hudLabel?.setText(`LV.${this.state.difficultyLevel}   ${this.state.distanceM}m   ${this.state.score}점   🐟 ${this.state.collectedFish}`);
  }

  drawFish(fish) {
    const graphic = this.add.graphics();
    graphic.fillStyle(0xb69a58, 0.16).fillEllipse(17, 26, 28, 7);
    graphic.fillStyle(0xe6bd69, 1).fillTriangle(25, 12, 32, 7, 32, 17);
    graphic.fillStyle(0xffe9a6, 1).fillEllipse(14, 12, 23, 16);
    graphic.lineStyle(1.5, 0xc69a4e, 0.9).strokeEllipse(14, 12, 23, 16);
    graphic.fillStyle(0xf4d17d, 1).fillTriangle(13, 12, 17, 7, 19, 16);
    graphic.fillStyle(0x6c5742, 1).fillCircle(7, 10, 1.5);
    graphic.fillStyle(0xffffff, 0.7).fillCircle(6.5, 9.5, 0.6);
    graphic.lineStyle(1, 0xf0cb73, 0.8).strokeCircle(15, 12, 4);
    graphic.setPosition(fish.x, fish.y);
    graphic.setDepth(4);
    return graphic;
  }

  drawObstacle(obstacle) {
    const graphic = this.add.graphics();
    graphic.fillStyle(0x453b32, 0.16).fillEllipse(obstacle.width / 2, obstacle.height + 6, obstacle.width + 14, 10);
    if (obstacle.kind === 'stone') {
      graphic.fillStyle(0x817b73, 1).fillRoundedRect(2, 7, obstacle.width - 4, obstacle.height - 8, 16);
      graphic.lineStyle(2, 0x6c655f, 0.8).strokeRoundedRect(2, 7, obstacle.width - 4, obstacle.height - 8, 16);
      graphic.fillStyle(0xb7b1a8, 0.82).fillEllipse(obstacle.width / 2 - 7, 17, 17, 8);
      graphic.fillStyle(0x6f8b62, 0.9).fillEllipse(obstacle.width / 2 + 10, obstacle.height - 10, 16, 5);
    } else if (obstacle.kind === 'log') {
      graphic.fillStyle(0x8e6348, 1).fillRoundedRect(2, 7, obstacle.width - 4, obstacle.height - 11, 16);
      graphic.lineStyle(2, 0x704d3c, 0.9).strokeRoundedRect(2, 7, obstacle.width - 4, obstacle.height - 11, 16);
      graphic.fillStyle(0xc49263, 1).fillCircle(obstacle.width - 14, obstacle.height / 2, 18);
      graphic.lineStyle(3, 0x795640, 1).strokeCircle(obstacle.width - 14, obstacle.height / 2, 16);
      graphic.lineStyle(1.5, 0x9b714f, 1).strokeCircle(obstacle.width - 14, obstacle.height / 2, 9);
      graphic.lineStyle(2, 0xd8b17f, 0.75).beginPath();
      graphic.moveTo(14, 20).lineTo(obstacle.width - 32, 20).strokePath();
      graphic.moveTo(10, 35).lineTo(obstacle.width - 34, 35).strokePath();
    } else {
      graphic.fillStyle(0x79583f, 1).fillRoundedRect(4, 17, obstacle.width - 8, 15, 8);
      graphic.lineStyle(2, 0x634a37, 0.8).strokeRoundedRect(4, 17, obstacle.width - 8, 15, 8);
      graphic.fillStyle(0x759d70, 1).fillEllipse(24, 15, 21, 15);
      graphic.fillStyle(0x8fb587, 1).fillEllipse(49, 11, 22, 18);
      graphic.fillStyle(0x6f966c, 1).fillEllipse(76, 16, 19, 14);
      graphic.fillStyle(0xd4e0a4, 0.9).fillEllipse(24, 12, 6, 3);
      graphic.fillStyle(0xd4e0a4, 0.9).fillEllipse(51, 8, 7, 3);
    }
    graphic.setPosition(obstacle.x, obstacle.y);
    graphic.setDepth(2);
    return graphic;
  }
}
