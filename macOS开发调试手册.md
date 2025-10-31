# 🧑‍💻 数字人医生项目 macOS 开发调试手册

> 适用于基于 Electron + React + wsplayer + WebRTC + socket.io 的数字医生系统  
> 开发环境：macOS 13+  
> 目标：在 Mac 上完成 90% 调试，最终在 Windows 上验收性能与兼容性。

---

## 1️⃣ 环境准备

**安装依赖**
```bash
brew install node ffmpeg mkcert mediamtx
xcode-select --install
nvm install --lts
```

**可选工具**
- VSCode（带调试插件）
- Charles / mitmproxy（抓包调试）
- Postman / curl（接口验证）

---

## 2️⃣ 项目结构推荐

```
project-root/
├─ main/          # Electron 主进程
├─ renderer/      # React 前端（Vite）
├─ preload/       # Electron Preload 脚本
├─ wsplayer/      # H264 播放器封装
├─ assets/
└─ package.json
```

---

## 3️⃣ package.json 示例

```json
{
  "scripts": {
    "dev": "concurrently -k \"vite\" \"wait-on http://localhost:5173 && cross-env VITE_DEV_SERVER_URL=http://localhost:5173 electron .\"",
    "build": "electron-builder"
  },
  "devDependencies": {
    "electron": "^31",
    "electron-builder": "^24",
    "concurrently": "^8",
    "cross-env": "^7",
    "wait-on": "^7",
    "vite": "^5"
  }
}
```

---

## 4️⃣ Electron 主进程示例

```ts
// main.ts
import { app, BrowserWindow } from 'electron'

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1440, height: 900,
    webPreferences: {
      preload: './preload.js',
      contextIsolation: true
    }
  })
  const devUrl = process.env.VITE_DEV_SERVER_URL
  await win.loadURL(devUrl || 'file://' + __dirname + '/index.html')
  win.webContents.openDevTools({ mode: 'detach' })
})
```

---

## 5️⃣ VSCode 调试配置

`.vscode/launch.json`
```json
{
  "version": "0.2.0",
  "compounds": [{ "name": "Electron All", "configurations": ["Electron Main", "Electron Renderer"] }],
  "configurations": [
    {
      "name": "Electron Main",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/electron",
      "args": ["."],
      "env": { "NODE_ENV": "development", "VITE_DEV_SERVER_URL": "http://localhost:5173" }
    },
    {
      "name": "Electron Renderer",
      "type": "chrome",
      "request": "attach",
      "port": 9222,
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

在 `main.ts` 中加：
```ts
app.commandLine.appendSwitch('remote-debugging-port', '9222')
```

---

## 6️⃣ wsplayer 与流媒体调试

**启动测试流**
```bash
mediamtx &   # 默认 RTSP :8554
ffmpeg -re -stream_loop -1 -i demo.mp4 -c:v libx264 -f rtsp rtsp://localhost:8554/test
```

**封装 wsplayer 组件**
```tsx
export const WSPlayer = ({ url }) => {
  const ref = useRef()
  useEffect(() => {
    const player = new window.WSPlayer({ url, canvas: ref.current })
    return () => player?.close()
  }, [url])
  return <canvas ref={ref} width="1280" height="720" />
}
```

在浏览器 DevTools → **Media** 面板观察帧率、缓冲、延迟。

---

## 7️⃣ WebRTC 与语音调试

- 地址栏输入 `chrome://webrtc-internals` 查看 ICE、码率、丢包。
- 输入 `chrome://gpu` 查看硬件加速状态。
- Electron 强制启用 GPU：
  ```ts
  app.commandLine.appendSwitch('ignore-gpu-blacklist')
  ```

---

## 8️⃣ socket.io 与 REST 调试

启用 socket.io 调试：
```bash
DEBUG=socket.io-client:manager,socket.io-client:socket pnpm dev
```

或在控制台：
```js
localStorage.debug = 'socket.io-client:manager,socket.io-client:socket'
location.reload()
```

REST 接口推荐封装 Axios：
```ts
import axios from 'axios'
export const api = axios.create({ baseURL: 'http://218.206.102.135:8099/ExtExportAPI' })
```

---

## 9️⃣ 本地 HTTPS 与跨域

```bash
mkcert -install
mkcert localhost 127.0.0.1 ::1
```

修改 Vite / Electron DevServer：
```js
server: { https: { key: 'localhost-key.pem', cert: 'localhost.pem' } }
```
前端 WS 改成 **wss://**，确保与后端一致。

---

## 🔟 摄像头与人脸登录

1. 系统授权（隐私与安全 → 摄像头/麦克风）  
2. 使用 WebRTC 采集视频流：
   ```ts
   const stream = await navigator.mediaDevices.getUserMedia({ video: true })
   ```
3. 推流到后端做人脸识别（WebRTC / WebSocket）  
4. 监听 `face_detect` 事件展示登录结果。

---

## 11️⃣ 模拟医生端大屏

```bash
electron . --kiosk --fullscreen
```
或在主进程：
```ts
win.setFullScreen(true)
app.setLoginItemSettings({ openAtLogin: true })
```

多显示器：
```ts
import { screen } from 'electron'
const displays = screen.getAllDisplays()
win.setBounds(displays[1].bounds)
```

---

## 12️⃣ 常见调试命令

```bash
# 启动 RTSP 并推流
brew install mediamtx ffmpeg
mediamtx &
ffmpeg -re -stream_loop -1 -i demo.mp4 -c:v libx264 -f rtsp rtsp://localhost:8554/test

# 启动项目
pnpm dev

# 观察 WebRTC
chrome://webrtc-internals
# 查看 GPU 解码
chrome://gpu
```

---

## 13️⃣ macOS 与 Windows 差异注意

| 项目 | macOS | Windows |
|------|--------|----------|
| GPU 解码 | VideoToolbox (H.264) | DXVA2 / D3D11 |
| Kiosk 模式 | Electron 原生 | Electron + WebView2 |
| 自启动 | `app.setLoginItemSettings` | 注册表/任务计划 |
| HTTPS 证书 | mkcert 简单 | 需自签/机构 CA |
| 麦克风权限 | 系统弹窗 | 通常默认允许 |

---

## ✅ 建议的调试顺序

1. REST 接口通 -> socket.io 连通 -> wsplayer 播流通。  
2. 调通语音问诊（WebRTC + ASR 回传）。  
3. 调数字人视频播放与语音同步。  
4. 量表筛查流程语音驱动全闭环。  
5. 打包 Electron 应用并在 Windows 验收。

---

> 建议：用 Mac 做 90% 逻辑/UI/流控开发；最后在 Windows 验证 GPU、Kiosk、自启、性能。

