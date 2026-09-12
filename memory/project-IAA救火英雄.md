# IAA 救火英雄（Godot 开发中）

> 最后更新：2026-09-09 | 状态：Godot v0.1.5+ 商店/角色/H5 链路齐，手机内网体验中

## 是什么

休闲类 IAA（广告变现）游戏《救火英雄》。竖屏 9:16，激励视频 + 插屏变现。
**技术路线已定为 Godot 4.7**：工程 `projects/IAA/fire-hero-godot/`（本机验证路径 `J:\ceshi\projects\IAA\fire-hero-godot`），数值以 HTML 原型 `fire-hero-iaa.html` 为权威源。
**引擎实际路径**：`F:\Godot_v4.7-stable_win64.exe\`（README 里的 C:\软件 路径已失效）。

## 已有产出（projects/IAA/）

### 玩法与规则 / 企划 / 美术 / UI
- `fire-hero-iaa.html` + `server.js`（HTML 原型 + 本地服务）；规则/企划/成本/微创新规格等 MD 齐全
- `art/`（风格锁/像素精灵集/导出）`ui-prototypes/` `audio/`（Kenney CC0 音效 wav）

### Godot 工程（进行中，v0.1.4 → v0.1.5+）
- **v0.1.4**（09-07）：道具最小集（钱袋/长条/锤子/灭火器/1UP）+ 火球
- **v0.1.5+（09-09）**：
  - **补给队商店 + 角色系统**：过关结算自动带商店（英雄位/道具位/刷新 mock）；5 角色（猫/狗免费、熊猫2000/卡皮3000/狐狸5000）；角色能力全接（猫移速/狗分/熊猫×2/卡皮抗火/狐狸影分身）
  - **狐狸影分身**：分 6 分身（只灭火）CD 6 秒可重复；分身 bug 已修（filter 类型错误中断 _process）
  - **长条/螺丝永久宽度**：整局跨关保留，顶屏边 450 封顶
  - **H5 手机体验链路**：Web export preset（nothreads）+ gzip（wasm 37.7→9.7MB 线上）+ server.js 目录补 index + MIME；**内网自签 HTTPS 8443**（`tools/make_cert.py`，certs/ 不入库）；体验地址 `https://192.168.3.188:8443/web-build/`（同 WiFi，首次点"继续访问"）
  - **网络音效**：Kenney CC0 14 条 WAV 放 `IAA/audio/`（不入游戏包），Sfx autoload 运行时 HTTP 下载→缓存→播放，事件全接
  - **触屏**：左右虚拟按钮 + 道具象形图标 + 右上角临时 +500 金币测试钮（`TEST_COIN_BTN_ENABLED` 正式前关）
  - **Web 乱码修复**：UI 全局默认 Zpix 字体
- 冒烟：shop **31/31**、clone、sfx 全过；`tools/smoke_*.tscn`
- 日志：`docs/dev-log-2026-09-04/07/09.md`

### 窗口坐标编辑器（09-08 前后）
- `window-editor.html`（垫背景图 + 自由坐标摆窗 + 自动/手动 + 导出 JSON）；Godot `level_db.gd`/`level_builder.gd` 支持坐标布局，自动读 `assets/levels/windows.json`

## 关键信息
- **手机内网体验现成**：`https://192.168.3.188:8443/web-build/`（需 node server.js 在跑，双击 `打开关卡配置.bat` 或 `node server.js 8080`）
- 版权红线：素材原创/Kenney CC0；禁止原版《飛INGヒーロー》素材音乐
- 道具贴图已换美术 64px 像素图（assets/props/items/）
- web-build/、certs/、node 产物不入库（gitignore 已加）

## 待办 / 下一步
- [ ] 手机 H5 真机验收（虚拟钮/图标/影分身/乱码已修）
- [ ] 正式发布前关测试金币钮（TEST_COIN_BTN_ENABLED=false）
- [ ] APK 出包需装 Android 模板+SDK（约 1.5-2GB，用户未确认）
- [ ] 音效不贴的换 Kenney 变体；角色/商店数值按反馈调
- [ ] G-016 美术概念图；立项预算决策

## 关联
- 日志：`fire-hero-godot/docs/dev-log-2026-09-09.md`（今日 16 提交汇总）
- 记忆：`memory/project-IAA救火英雄.md`
