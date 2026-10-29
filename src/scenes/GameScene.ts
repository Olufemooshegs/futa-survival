import Phaser from 'phaser';
import {
  VIEW, GROUND_Y, PLAYER_X, JUMP_VELOCITY, GRAVITY,
  SLIDE_MIN_MS, HANGING_BOTTOM_Y, DESPAWN_X, COLORS,
} from '../config/theme';
import { LEVELS, type ObstacleDef } from '../config/levels';
import { overlaps, playerRect } from '../systems/collision';
import { computeScore, getTotalScore, saveTotalScore } from '../systems/score';
import { playJump, playHit, playClear, playCoin } from '../systems/audio';

interface LiveObstacle { container: Phaser.GameObjects.Container; hitRect: { x: number; y: number; w: number; h: number } }
interface LiveCoin { container: Phaser.GameObjects.Container; hitRect: { x: number; y: number; w: number; h: number } }

export class GameScene extends Phaser.Scene {
  private name = 'STUDENT';
  private dept = 'FUTA';
  private levelIdx = 0;
  private score = 0;
  private distancePx = 0;
  private baseTotalScore = 0;
  
  private obstacles: LiveObstacle[] = [];
  private coins: LiveCoin[] = [];
  private nextSpawnTime = 0;

  private player!: Phaser.GameObjects.Container;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private playerParts: Phaser.GameObjects.GameObject[] = [];
  private playerLabel!: Phaser.GameObjects.Text;
  private dustEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  
  private yOffset = 0;
  private vy = 0;
  private sliding = false;
  private slideHeld = false;
  private slideUntil = 0;
  private grounded = true;
  private ended = false;
  private isEndless = false;

  private bgGradient!: Phaser.GameObjects.Graphics;
  private groundRect!: Phaser.GameObjects.Rectangle;
  private bgBuildings: Phaser.GameObjects.Container[] = [];

  private hudLevel!: Phaser.GameObjects.Text;
  private hudScore!: Phaser.GameObjects.Text;

  constructor() { super({ key: 'GameScene', active: false }); }

  init(data: { name?: string; dept?: string }) {
    this.name = (data?.name ?? 'STUDENT').toUpperCase().slice(0, 12);
    this.dept = (data?.dept ?? 'FUTA').toUpperCase().slice(0, 4);
    this.levelIdx = 0;
    this.score = 0;
    this.distancePx = 0;
    this.baseTotalScore = getTotalScore();
    this.obstacles = [];
    this.coins = [];
    this.bgBuildings = [];
    this.nextSpawnTime = 0;
    this.yOffset = 0; this.vy = 0;
    this.sliding = false; this.slideHeld = false; this.slideUntil = 0;
    this.grounded = true; this.ended = false; this.isEndless = false;
  }

  create() {
    // FIXED: Removed the add: false property
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xFFFFFF, 1).fillRect(0, 0, 8, 8).generateTexture('dust', 8, 8);
    g.fillStyle(0xF5F1E8, 1).fillRect(0, 0, 12, 12).generateTexture('paper', 12, 12);
    g.destroy();

    const lvl = LEVELS[0];
    this.bgGradient = this.add.graphics();
    this.drawSky(lvl.bgColor, lvl.groundColor);

    for (let i = 0; i < 8; i++) this.createBuilding(i * 180);

    this.groundRect = this.add.rectangle(0, GROUND_Y, VIEW.w, VIEW.h - GROUND_Y, lvl.groundColor).setOrigin(0, 0);
    const groundLines = this.add.graphics().lineStyle(2, 0x000000, 0.2);
    for (let i = 0; i < VIEW.w; i += 40) groundLines.lineBetween(i, GROUND_Y + 10, i + 20, GROUND_Y + 10);

    this.playerShadow = this.add.ellipse(PLAYER_X, GROUND_Y + 5, 36, 12, 0x000000, 0.5);
    this.createRunner();

    this.dustEmitter = this.add.particles(0, 0, 'dust', {
      speed: { min: 20, max: 50 }, angle: { min: 160, max: 200 },
      scale: { start: 0.6, end: 0 }, lifespan: 400, frequency: 100, tint: 0x7FA894
    });

    this.playerLabel = this.add.text(PLAYER_X, GROUND_Y - 80, this.dept, { 
      fontFamily: 'monospace', fontSize: '12px', color: '#F2C14E', fontStyle: 'bold' 
    }).setOrigin(0.5);

    // FIXED: Removed the unused this.hudName property
    this.add.text(24, 20, `${this.name} (${this.dept})`, { fontFamily: 'monospace', fontSize: '20px', color: '#F2C14E', fontStyle: 'bold' });
    this.hudLevel = this.add.text(VIEW.w / 2, 20, '100L', { fontFamily: 'monospace', fontSize: '28px', color: '#F5F1E8', fontStyle: 'bold' }).setOrigin(0.5, 0);
    this.hudScore = this.add.text(VIEW.w - 24, 20, 'SCORE 0', { fontFamily: 'monospace', fontSize: '22px', color: '#F5F1E8' }).setOrigin(1, 0);

    this.input.keyboard?.on('keydown-SPACE', () => this.tryJump());
    this.input.keyboard?.on('keydown-UP', () => this.tryJump());
    this.input.keyboard?.on('keydown-W', () => this.tryJump());
    this.input.keyboard?.on('keydown-DOWN', () => this.trySlide());
    this.input.keyboard?.on('keydown-S', () => this.trySlide());
    this.input.keyboard?.on('keyup-DOWN', () => this.releaseSlide());
    this.input.keyboard?.on('keyup-S', () => this.releaseSlide());
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { if (p.y > VIEW.h * 0.6) this.trySlide(); else this.tryJump(); });
    this.input.on('pointerup', () => this.releaseSlide());

    this.showLevelBanner();
  }

  private drawSky(topColor: number, bottomColor: number) {
    this.bgGradient.clear();
    const steps = 10;
    const stepH = VIEW.h / steps;
    for (let i = 0; i < steps; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(topColor), Phaser.Display.Color.ValueToColor(bottomColor), steps, i
      );
      this.bgGradient.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      this.bgGradient.fillRect(0, i * stepH, VIEW.w, stepH + 1);
    }
  }

  private createBuilding(x: number) {
    const w = Phaser.Math.Between(80, 140);
    const h = Phaser.Math.Between(120, 240);
    const container = this.add.container(x, GROUND_Y - h);
    const b = this.add.rectangle(0, 0, w, h, 0x000000).setOrigin(0, 0).setAlpha(0.2);
    const windows = this.add.graphics().fillStyle(0xF2C14E, 0.1);
    for (let wy = 20; wy < h - 20; wy += 30) {
      for (let wx = 10; wx < w - 10; wx += 20) windows.fillRect(wx, wy, 10, 15);
    }
    container.add([b, windows]);
    this.bgBuildings.push(container);
  }

  private createRunner() {
    this.player = this.add.container(PLAYER_X, GROUND_Y);
    const skin = 0xF5F1E8; const suit = COLORS.accent; const shoe = 0x222222;

    const legLContainer = this.add.container(-4, 0);
    const legL = this.add.rectangle(0, 0, 8, 20, suit).setOrigin(0.5, 0);
    const shoeL = this.add.rectangle(0, 20, 12, 6, shoe).setOrigin(0.5, 0);
    legLContainer.add([legL, shoeL]);

    const legRContainer = this.add.container(4, 0);
    const legR = this.add.rectangle(0, 0, 8, 20, suit).setOrigin(0.5, 0);
    const shoeR = this.add.rectangle(0, 20, 12, 6, shoe).setOrigin(0.5, 0);
    legRContainer.add([legR, shoeR]);

    const torso = this.add.rectangle(0, -24, 16, 24, suit);
    const backpack = this.add.rectangle(-10, -24, 10, 18, 0x444444);
    const armL = this.add.rectangle(-2, -32, 6, 16, suit).setOrigin(0.5, 0);
    const armR = this.add.rectangle(2, -32, 6, 16, suit).setOrigin(0.5, 0);
    const neck = this.add.rectangle(0, -40, 6, 6, skin);
    const head = this.add.circle(0, -50, 9, skin);
    const hair = this.add.rectangle(0, -56, 16, 6, 0x111111).setOrigin(0.5, 0.5);

    this.playerParts = [legLContainer, legRContainer, torso, backpack, armL, armR, neck, head, hair];
    this.player.add(this.playerParts);

    this.tweens.add({ targets: [legLContainer, armR], angle: { from: -45, to: 45 }, duration: 160, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: [legRContainer, armL], angle: { from: 45, to: -45 }, duration: 160, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: [torso, backpack, neck, head, hair], y: '-=4', duration: 80, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  private showLevelBanner() {
    const lvl = LEVELS[this.levelIdx];
    this.hudLevel.setText(lvl.tag);
    const banner = this.add.text(VIEW.w / 2, VIEW.h / 2 - 40, `${lvl.tag} — ${lvl.title}`, { fontFamily: 'monospace', fontSize: '36px', color: '#F2C14E', fontStyle: 'bold' }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: banner, alpha: 1, duration: 400, hold: 600, yoyo: true, onComplete: () => banner.destroy() });
  }

  private tryJump() {
    if (this.ended || !this.grounded || this.sliding) return;
    this.vy = JUMP_VELOCITY; this.grounded = false; playJump();
    this.tweens.add({ targets: this.player, scaleX: 0.8, scaleY: 1.2, duration: 100, yoyo: true, ease: 'Sine.easeOut' });
  }

  private trySlide() {
    if (this.ended || !this.grounded) return;
    this.slideHeld = true;
    if (!this.sliding) { this.sliding = true; this.slideUntil = this.time.now + SLIDE_MIN_MS; }
  }
  private releaseSlide() { this.slideHeld = false; }

  update(time: number, delta: number) {
    if (this.ended) return;

    const lvl = LEVELS[this.levelIdx];
    const dt = delta / 1000;

    let currentSpeed = lvl.speed;
    if (this.levelIdx < LEVELS.length - 1 && !this.isEndless) {
      const prevMin = lvl.minScore;
      const nextMin = LEVELS[this.levelIdx + 1].minScore;
      const progress = Math.max(0, Math.min(1, (this.score - prevMin) / (nextMin - prevMin)));
      currentSpeed = lvl.speed + (lvl.speed * 0.7 * progress); 
    } else if (this.isEndless) {
      currentSpeed = 1400 + (this.distancePx * 0.05);
    }

    this.distancePx += currentSpeed * dt;
    const multiplier = this.isEndless ? 10 : 1;
    this.score = computeScore(this.distancePx, this.levelIdx, multiplier);
    this.hudScore.setText(`SCORE ${this.score + this.baseTotalScore}`);

    if (this.levelIdx < LEVELS.length - 1 && this.score >= LEVELS[this.levelIdx + 1].minScore) {
      this.levelIdx++;
      playClear();
      this.showLevelBanner();
      
      const newLvl = LEVELS[this.levelIdx];
      this.drawSky(newLvl.bgColor, newLvl.groundColor);
      this.groundRect.setFillStyle(newLvl.groundColor);
      this.cameras.main.flash(400, 255, 255, 255, false);

      if (this.levelIdx === 5) {
        this.isEndless = true;
        const gradText = this.add.text(VIEW.w / 2, VIEW.h / 2, 'GRADUATED!\nWELCOME TO ALUMNI ENDLESS MODE', {
          fontFamily: 'monospace', fontSize: '32px', color: '#F2C14E', align: 'center', fontStyle: 'bold',
          backgroundColor: '#000000', padding: { x: 20, y: 20 }
        }).setOrigin(0.5).setDepth(100);
        this.time.delayedCall(2500, () => gradText.destroy());
      }
    }

    if (!this.grounded) {
      this.vy += GRAVITY * dt;
      this.yOffset -= this.vy * dt;
      if (this.yOffset <= 0) { this.yOffset = 0; this.vy = 0; this.grounded = true; this.dustEmitter.explode(10, PLAYER_X, GROUND_Y); }
    }
    if (this.sliding && !this.slideHeld && time >= this.slideUntil) this.sliding = false;

    this.player.setPosition(PLAYER_X, GROUND_Y - this.yOffset);
    this.playerLabel.setPosition(PLAYER_X, GROUND_Y - this.yOffset - 80);
    const heightPercent = Math.min(1, this.yOffset / 200);
    this.playerShadow.setScale(1 - (heightPercent * 0.5)).setAlpha(0.5 - (heightPercent * 0.3));

    this.dustEmitter.setPosition(PLAYER_X - 10, GROUND_Y);
    this.dustEmitter.frequency = this.grounded && !this.sliding ? 80 : -1;

    if (this.sliding) {
      this.player.setAngle(-80).setScale(1.1, 0.6);
      this.dustEmitter.frequency = 50; 
    } else {
      this.player.setAngle(0).setScale(1, 1);
    }

    if (time > this.nextSpawnTime) {
      this.spawnObstacle(lvl);
      const speedMultiplier = this.levelIdx >= 3 ? 1.1 : 0.8; 
      const baseGap = 1600 - (currentSpeed * speedMultiplier); 
      this.nextSpawnTime = time + Math.max(250, baseGap) + (Math.random() * 300);
    }

    const pRect = playerRect(PLAYER_X, GROUND_Y, this.sliding, this.yOffset);
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.container.x -= currentSpeed * dt;
      o.hitRect.x = o.container.x;
      o.container.angle += Math.sin(time / 200) * 0.5;

      if (o.container.x + o.hitRect.w < DESPAWN_X) {
        o.container.destroy(); this.obstacles.splice(i, 1); continue;
      }
      if (overlaps(pRect, o.hitRect)) { this.die(o.container.x, o.container.y); return; }
    }

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.container.x -= currentSpeed * dt;
      c.hitRect.x = c.container.x;
      c.container.y = c.hitRect.y + Math.sin(time / 150) * 5;

      if (c.container.x < DESPAWN_X) {
        c.container.destroy(); this.coins.splice(i, 1); continue;
      }
      if (overlaps(pRect, c.hitRect)) {
        playCoin();
        this.distancePx += (500 * multiplier);
        c.container.destroy(); this.coins.splice(i, 1);
      }
    }
  }

  private spawnObstacle(lvl: any) {
    const spec: ObstacleDef = lvl.pool[Math.floor(Math.random() * lvl.pool.length)];
    const isHanging = Math.random() > 0.5;
    const y = isHanging ? HANGING_BOTTOM_Y - spec.height : GROUND_Y - spec.height;
    
    const container = this.add.container(VIEW.w + spec.width, y);
    const shadow = this.add.rectangle(6, 6, spec.width, spec.height, 0x000000, 0.4);
    const rect = this.add.rectangle(0, 0, spec.width, spec.height, COLORS.paper).setOrigin(0, 0);
    rect.setStrokeStyle(spec.signature ? 4 : 2, spec.signature ? COLORS.accent : COLORS.danger);

    const graphics = this.add.graphics().lineStyle(1, 0xaaaaaa, 0.6);
    for (let i = 6; i < spec.height - 6; i += 6) graphics.lineBetween(4, i, spec.width - 4, i);

    const label = this.add.text(spec.width / 2, spec.height / 2, spec.label, {
      fontFamily: 'monospace', fontSize: spec.signature ? '11px' : '9px', color: '#061F18', fontStyle: 'bold', align: 'center', wordWrap: { width: spec.width - 6 }
    }).setOrigin(0.5);

    container.add([shadow, rect, graphics, label]);
    container.angle = Phaser.Math.Between(-5, 5);
    this.obstacles.push({ container, hitRect: { x: container.x, y: container.y, w: spec.width, h: spec.height } });

    if (Math.random() < 0.5) { 
      const coinY = isHanging ? GROUND_Y - 60 : y - 70; 
      const coinContainer = this.add.container(VIEW.w + spec.width + (Math.random() * 80), coinY);
      const coinOuter = this.add.circle(0, 0, 12, 0xF2C14E).setStrokeStyle(2, 0xFFFFFF);
      const coinInner = this.add.text(0, 0, '$', { fontSize: '14px', color: '#B8913A', fontStyle: 'bold' }).setOrigin(0.5);
      this.tweens.add({ targets: coinOuter, scaleX: 0, duration: 400, yoyo: true, repeat: -1 });
      coinContainer.add([coinOuter, coinInner]);
      this.coins.push({ container: coinContainer, hitRect: { x: coinContainer.x - 12, y: coinY - 12, w: 24, h: 24 } });
    }
  }

  private die(hitX: number, hitY: number) {
    if (this.ended) return;
    this.ended = true;
    playHit();
    
    const lvl = LEVELS[this.levelIdx];
    const penalty = lvl.penalty;
    const finalTotalScore = Math.max(0, this.baseTotalScore + this.score - penalty);
    saveTotalScore(finalTotalScore);

    this.cameras.main.shake(200, 0.02);
    this.cameras.main.flash(100, 255, 0, 0, false);

    const emitter = this.add.particles(hitX, hitY, 'paper', {
      speed: { min: 100, max: 300 }, angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 }, rotate: { min: 0, max: 360 },
      lifespan: 1000, gravityY: 500, quantity: 20
    });
    emitter.explode(20);

    this.add.text(hitX, hitY - 50, `CARRYOVER: -${penalty}`, { fontSize: '24px', color: '#C0392B', fontStyle: 'bold' }).setOrigin(0.5);

    this.playerParts.forEach((part: any) => { 
      if (part.setFillStyle) part.setFillStyle(0xC0392B);
      if (part.each) part.each((child: any) => { if (child.setFillStyle) child.setFillStyle(0xC0392B); });
    });
    
    this.time.delayedCall(1200, () => this.finish(finalTotalScore));
  }

  private finish(finalScore: number) {
    this.ended = true;
    const lvl = LEVELS[this.levelIdx];
    const detail = {
      graduated: this.levelIdx >= 5,
      level: this.levelIdx + 1,
      levelTag: lvl.tag,
      score: finalScore,
      name: this.name,
      dept: this.dept,
    };
    this.scene.pause();
    window.dispatchEvent(new CustomEvent('futa:gameover', { detail }));
  }
}