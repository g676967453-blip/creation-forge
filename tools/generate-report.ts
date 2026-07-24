/**
 * 造化坊汇报说明书生成器（兼容入口）
 *
 * HTML 仪表盘已替代 Excel。
 * 静态生成: npx tsx tools/generate-dashboard.ts
 * 本地服务器: npm run dashboard → http://localhost:3456
 */

import { execSync } from "child_process";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
const SCRIPT = path.join(ROOT, "tools", "generate-dashboard.ts");
execSync(`npx tsx "${SCRIPT}"`, { cwd: ROOT, stdio: "inherit" });
