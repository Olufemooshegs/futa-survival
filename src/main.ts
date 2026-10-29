import './ui/theme.css';
import Phaser from 'phaser';
import { VIEW, COLORS } from './config/theme';
import { GameScene } from './scenes/GameScene';
import { mountUI } from './ui/bridge';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: VIEW.w,
  height: VIEW.h,
  backgroundColor: '#' + COLORS.bgDeep.toString(16).padStart(6, '0'),
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [], // <--- EMPTY!
  render: { pixelArt: false, antialias: true },
};

const game = new Phaser.Game(config);
game.scene.add('GameScene', GameScene, false); 
mountUI(game);