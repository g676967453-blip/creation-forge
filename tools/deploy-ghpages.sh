#!/bin/bash
set -e
cd "$(dirname "$0")/.."
git commit -m "feat: 仪表盘网站化 — 部署至 GitHub Pages" || echo "nothing to commit"
git push origin main
echo "✅ 推送完成，请去 Settings > Pages 启用 docs/ 目录"
