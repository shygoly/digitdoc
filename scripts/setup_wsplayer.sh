#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC_DIR="$PROJECT_ROOT/public"
WS_PLAYER_DIR="$PROJECT_ROOT/wsplayer_extracted"

echo "设置 wsplayer 脚本文件..."

# 创建 public 目录结构
mkdir -p "$PUBLIC_DIR/lib"

# 复制 wsplayer 脚本文件
if [ -f "$WS_PLAYER_DIR/zvvideo.js" ]; then
  cp "$WS_PLAYER_DIR/zvvideo.js" "$PUBLIC_DIR/"
  echo "✓ 已复制 zvvideo.js"
else
  echo "✗ 未找到 zvvideo.js"
  exit 1
fi

if [ -f "$WS_PLAYER_DIR/lib/streamedianAACH264H265.min.js" ]; then
  cp "$WS_PLAYER_DIR/lib/streamedianAACH264H265.min.js" "$PUBLIC_DIR/lib/"
  echo "✓ 已复制 streamedianAACH264H265.min.js"
else
  echo "✗ 未找到 streamedianAACH264H265.min.js"
  exit 1
fi

echo "wsplayer 设置完成！"
ls -lh "$PUBLIC_DIR/"* "$PUBLIC_DIR/lib/"* 2>/dev/null || true
