# 开发环境快速启动指南

## ✅ 环境已准备完成

所有开发依赖已安装，HTTPS 证书已生成，项目结构已创建。

## 🚀 启动项目

### 开发模式（同时启动 Vite + Electron）

```bash
pnpm dev
```

这将：
1. 启动 Vite 开发服务器（HTTPS: `https://localhost:5173`）
2. 编译 Electron 主进程和 preload
3. 等待 Vite 就绪后启动 Electron 窗口

### 单独启动

```bash
# 只启动 Vite
pnpm dev:vite

# 只启动 Electron（需先运行 dev:vite）
pnpm dev:electron
```

## 📁 项目结构

```
digitDoc/
├── main/              # Electron 主进程
│   └── main.ts
├── preload/           # Preload 脚本
│   └── preload.ts
├── renderer/          # React 前端
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── ...
│   └── index.html
├── certs/             # HTTPS 证书（已生成）
│   ├── localhost.pem
│   └── localhost-key.pem
├── vite.config.ts     # Vite 配置（已配置 HTTPS）
└── package.json
```

## 🔧 配置说明

### HTTPS 支持

- Vite 开发服务器已配置为使用 `certs/localhost.pem`
- 访问地址：`https://localhost:5173`
- WebSocket 连接使用 `wss://` 协议

### Electron 调试

- 远程调试端口：`9222`
- VSCode 调试配置：`.vscode/launch.json`
- 可在 Chrome DevTools 中调试 Renderer 进程

### RTSP 测试流

测试流已在运行：
- 地址：`rtsp://localhost:8554/test`
- 停止：`kill $(cat /tmp/ffmpeg_rtsp_test.pid); kill $(cat /tmp/mediamtx.pid)`
- 重启：`./scripts/start_test_stream.sh demo.mp4`

## 🐛 常见问题

### 证书警告

如果浏览器/Electron 提示证书不受信任：
```bash
mkcert -install  # 需要输入密码
```

### 端口占用

如果 5173 端口被占用，修改 `vite.config.ts` 中的端口号。

### Electron 无法启动

确保先运行 `pnpm dev:vite` 让 Vite 服务器启动。

## 🧪 接口测试

项目已包含完整的接口测试页面，支持测试：
- REST API 接口（4个核心接口）
- Socket.io 事件（case1-case6, triage, 对话事件等）
- 数字人视频播放（wsplayer + RTSP）
- 数字人对话流程

### 使用测试页面

1. **准备 wsplayer 脚本**：
```bash
./scripts/setup_wsplayer.sh
# 或手动复制：
mkdir -p public/lib
cp wsplayer_extracted/zvvideo.js public/
cp wsplayer_extracted/lib/streamedianAACH264H265.min.js public/lib/
```

2. **启动项目**：
```bash
pnpm dev
```

3. **访问测试页面**：
   - 应用启动后会自动显示接口测试页面
   - 或在浏览器访问：`https://localhost:5173`

详细使用说明请参考：`README_API_TEST.md`

## 📝 下一步

1. ✅ 接口测试页面（已完成）
2. 集成 wsplayer 组件到主应用
3. 实现 WebRTC 音视频采集
4. 连接后端 API 并测试完整流程

参考 `macOS开发调试手册.md` 获取详细调试指南。
