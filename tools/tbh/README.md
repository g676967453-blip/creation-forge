# tools/tbh — TBH 复刻调研实机自动化脚本（已归档待立项）

本目录是「TBH 游戏复刻」调研期间编写的实机自动化脚本。TBH 复刻项目尚未正式立项，脚本处于归档待用状态。

## 脚本清单

| 文件 | 用途 |
|------|------|
| `mumu_auto.ps1` | MuMu 模拟器 30 分钟自动实机操作：截屏、录屏、随机点击/滑动，用于采集游戏界面素材 |
| `capture_loop.ps1` | 300 秒循环：OBS 截屏 + Windows OCR 识别，输出带时间戳的文字日志，用于实机界面文字采集 |
| `ocr.ps1` | Windows WinRT OCR 工具：对单张图片执行 OCR 并输出文本 |
| `obsctl.mjs` | OBS WebSocket 控制脚本（被 capture_loop.ps1 调用） |
| `tbh_classes.txt` / `tbh_strings.txt` | TBH 客户端反编译提取的类名/字符串清单（调研资料） |

## 注意事项

- **硬编码绝对路径，换机必须修改**：
  - ps1 脚本内嵌 `J:\ceshi`（工作目录/输出目录，如 `J:\ceshi\frames`、`J:\ceshi\mumu_auto_*`）
  - `mumu_auto.ps1` 内嵌模拟器 adb 路径 `G:\MuMu Player 12\nx_main\adb.exe` 及设备端口 `127.0.0.1:16416`
- **调试输出 txt 已从 git 索引移除**：`capture_log.txt`、`debug_ocr_copy.txt`、`ocr_out.txt`、`ocr_yk.txt` 4 个文件为运行时的调试输出，不入版本库，仅存在于本地工作区。
