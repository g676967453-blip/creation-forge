import Phaser from 'phaser';

/**
 * BootScene — 游戏启动场景
 *
 * 这是每个 Phaser 游戏的入口场景。
 * 负责：资源预加载、显示加载进度、初始化全局设置。
 *
 * 修改 src/scenes/ 目录来扩展你的游戏。
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // 在这里预加载游戏资源
    // this.load.image('player', 'assets/player.png');
    // this.load.audio('jump', 'assets/jump.mp3');
  }

  create(): void {
    // 游戏标题
    this.add
      .text(400, 280, '造化坊 — 游戏启动!', {
        fontSize: '28px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5);

    // 开发提示
    this.add
      .text(400, 330, '修改 src/scenes/ 开始你的游戏开发之旅', {
        fontSize: '14px',
        color: '#aaaaaa',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5);

    // 操作提示
    this.add
      .text(400, 370, '按任意键继续...', {
        fontSize: '14px',
        color: '#888888',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5);

    // 按任意键进入下一个场景（如果你添加了的话）
    this.input.keyboard!.once('keydown', () => {
      // this.scene.start('MenuScene');
    });
  }

  update(): void {
    // 游戏循环 — 每帧调用一次
    // 在这里添加持续运行的逻辑
  }
}
