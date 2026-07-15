/**
 * 场景管理工具
 * Phaser 场景的通用辅助函数
 */

/**
 * 场景切换时传递的数据接口
 * 在你的场景 init() 中实现此接口来接收数据
 */
export interface SceneTransitionData {
  /** 触发切换的场景名称 */
  fromScene?: string;
}

/**
 * 安全地切换 Phaser 场景
 * 包装 scene.start()，添加错误处理和日志
 *
 * @param currentScene 当前场景实例
 * @param targetScene 目标场景 key
 * @param data 要传递的数据
 */
export function switchScene(
  currentScene: Phaser.Scene,
  targetScene: string,
  data: SceneTransitionData = {},
): void {
  data.fromScene = currentScene.scene.key;
  console.log(`[场景] ${currentScene.scene.key} → ${targetScene}`);
  currentScene.scene.start(targetScene, data);
}

/**
 * 安全地启动一个覆盖场景（不关闭当前场景）
 * 适用于暂停菜单、设置面板等
 */
export function launchOverlay(
  currentScene: Phaser.Scene,
  overlayScene: string,
  data?: Record<string, unknown>,
): void {
  currentScene.scene.launch(overlayScene, data);
  currentScene.scene.pause();
}

/**
 * 关闭覆盖场景并恢复当前场景
 */
export function closeOverlay(overlayScene: Phaser.Scene): void {
  const scenes = overlayScene.scene.manager.getScenes(false);
  for (const s of scenes) {
    if (s.scene.key !== overlayScene.scene.key) {
      s.scene.resume();
    }
  }
  overlayScene.scene.stop();
}
