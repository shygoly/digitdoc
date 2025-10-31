# 数字人医生系统 - 详细开发步骤与路线图

> 基于 Spec-Kit 规范驱动开发方法
> 从零开始的 10 周快速迭代计划
> macOS 开发 + Windows 部署

---

## 📅 10 周交付计划概览

```
Week 1-2:  基础设施与环境搭建 ████░░░░░░░░░░░░░░░░
Week 3-4:  核心播放与采集       ████████░░░░░░░░░░░░
Week 5-6:  业务流程集成         ████████████░░░░░░░░
Week 7:    医生端大屏          ████████████░░░░░░░░
Week 8:    用户体验完善         ████████████░░░░░░░░
Week 9:    打包与部署           ████░░░░░░░░░░░░░░░
Week 10:   测试、优化与验收     ██░░░░░░░░░░░░░░░░░
```

**关键里程碑**：
- **Day 7**：基础框架可启动（MVP）
- **Day 21**：视频播放、语音输入工作
- **Day 35**：完整业务流程闭环
- **Day 60**：打包与自动更新验证
- **Day 70**：全功能测试完毕

---

## 🔧 Week 1-2: 基础设施与环境搭建

### 📋 Checklist

- [ ] macOS 开发环境完备
- [ ] Electron + Vite + React 骨架项目
- [ ] Git 仓库与 CI/CD 初始化
- [ ] 本地后端模拟环境启动
- [ ] 首个 Hello World 应用可启动

---

### Day 1: 环境初始化

#### 1.1 macOS 工具链安装

```bash
#!/bin/bash

# 1. 安装 Homebrew（如未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. 安装关键工具
brew install node ffmpeg mkcert mediamtx

# 3. 安装 Node 版本管理器
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts
nvm use --lts

# 4. 验证安装
node -v      # v20.x.x
npm -v       # 10.x.x
ffmpeg -version
mkcert -version
```

**时间**：30 min
**验收**：所有工具都能正常运行

#### 1.2 项目初始化

```bash
# 创建项目目录
mkdir digitDoc-app && cd digitDoc-app

# 初始化 npm 项目
npm init -y

# 安装核心依赖
npm install --save \
  react \
  react-dom \
  axios \
  socket.io-client \
  zustand \
  electron-store \
  electron-log

# 安装开发依赖
npm install --save-dev \
  electron \
  vite \
  @vitejs/plugin-react \
  typescript \
  @types/react \
  @types/react-dom \
  @types/node \
  electron-builder \
  electron-dev-webpack-plugin
```

**时间**：20 min
**验收**：`npm ls` 显示所有依赖已安装

#### 1.3 本地 HTTPS 证书

```bash
# 生成自签名证书（仅开发用）
mkdir -p .certs
cd .certs

mkcert -install
mkcert localhost 127.0.0.1 ::1

# 生成证书文件：localhost.pem（证书）、localhost-key.pem（密钥）
# 将路径记录到 Vite 配置中
```

**时间**：10 min
**验收**：生成 .certs/localhost.pem 和 .certs/localhost-key.pem

---

### Day 2-3: Electron + Vite 框架搭建

#### 2.1 目录结构设计

```
digitDoc-app/
├── src/
│   ├── main/
│   │   ├── index.ts           # Electron 主进程入口
│   │   ├── preload.ts         # Preload 脚本（受限 Node.js API）
│   │   └── handlers/          # IPC 处理器目录
│   │
│   ├── renderer/
│   │   ├── index.html         # HTML 入口
│   │   ├── App.tsx            # React 根组件
│   │   ├── pages/             # 页面组件
│   │   ├── components/        # 可复用组件
│   │   ├── services/          # 业务逻辑（API、Socket、存储）
│   │   └── styles/            # 全局样式
│   │
│   └── types/
│       ├── index.ts           # 全局类型定义
│       └── api.ts             # API 请求/响应类型
│
├── public/
│   └── wsplayer/              # wsplayer 库（从 zip 解压）
│       ├── index.html
│       ├── zvvideo.js
│       └── lib/
│
├── .vscode/
│   └── launch.json            # VSCode 调试配置
│
├── .github/
│   └── workflows/
│       ├── ci.yml             # CI 流程
│       └── release.yml        # 发布流程
│
├── vite.config.ts             # Vite 配置
├── tsconfig.json              # TypeScript 配置
├── electron-builder.json      # 打包配置
├── package.json
└── README.md
```

**时间**：30 min
**验收**：目录创建完毕，无缺失

#### 2.2 vite.config.ts 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    https: {
      key: '.certs/localhost-key.pem',
      cert: '.certs/localhost.pem'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
```

#### 2.3 Electron 主进程

```typescript
// src/main/index.ts
import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import isDev from 'electron-is-dev'

let mainWindow: BrowserWindow | null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true
    }
  })

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../renderer/index.html')}`

  mainWindow.loadURL(startUrl)

  // 开发时打开 DevTools
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// IPC 处理器示例
ipcMain.handle('get-app-version', () => app.getVersion())
```

#### 2.4 Preload 脚本

```typescript
// src/main/preload.ts
import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的 API 到渲染进程
contextBridge.exposeInMainWorld('electron', {
  // App 信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // 文件操作（通过 IPC）
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  writeFile: (path: string, data: string) =>
    ipcRenderer.invoke('write-file', path, data),

  // 日志
  log: (level: string, message: string) =>
    ipcRenderer.invoke('log', level, message)
})
```

#### 2.5 React 根组件与路由

```tsx
// src/renderer/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import { useAuthStore } from './services/store'

export default function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>
        {!isAuthenticated ? (
          <Route path="*" element={<LoginPage />} />
        ) : (
          <>
            <Route path="/" element={<HomePage />} />
            {/* 其他页面路由 */}
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}
```

#### 2.6 package.json 脚本

```json
{
  "scripts": {
    "dev": "vite",
    "dev:electron": "wait-on http://localhost:5173 && cross-env NODE_ENV=development electron .",
    "start": "concurrently -k 'npm run dev' 'npm run dev:electron'",
    "build": "vite build && electron-builder",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "concurrently": "^8.2.0",
    "cross-env": "^7.0.3",
    "wait-on": "^7.0.1"
  }
}
```

**时间**：60 min
**验收**：`npm start` 能启动应用，显示空白页面

---

### Day 4-5: 后端模拟环境与基础服务

#### 3.1 本地 RTSP 测试流

```bash
#!/bin/bash

# 启动 mediamtx（RTSP 媒体服务器）
# 如已装 homebrew，brew install mediamtx，否则从源码编译
mediamtx &
MEDIAMTX_PID=$!
sleep 2

# 下载或准备测试视频
# 以 demo.mp4 为例，可从网络下载或本地生成
ffmpeg -f lavfi -i testsrc=s=1280x720:d=3600 \
  -f lavfi -i sine=f=1000:d=3600 \
  -pix_fmt yuv420p -c:v libx264 -c:a aac \
  -y demo.mp4

# 推流到 RTSP
ffmpeg -re -stream_loop -1 -i demo.mp4 \
  -c:v libx264 -preset fast -b:v 2000k \
  -f rtsp rtsp://127.0.0.1:8554/stream &
FFMPEG_PID=$!

echo "RTSP 服务启动，MEDIAMTX_PID=$MEDIAMTX_PID，FFMPEG_PID=$FFMPEG_PID"
echo "播放地址：rtsp://127.0.0.1:8554/stream"

# 清理
trap "kill $MEDIAMTX_PID $FFMPEG_PID" EXIT
wait
```

**时间**：15 min
**验收**：`rtsp://127.0.0.1:8554/stream` 可被 ffplay 播放

#### 3.2 Node.js 模拟 WebSocket 服务

```typescript
// mock-backend/server.ts
import express from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import cors from 'cors'

const app = express()
const httpServer = createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*' }
})

app.use(cors())
app.use(express.json())

// REST API 模拟
app.get('/ExtExportAPI/GetAllDoctors', (req, res) => {
  res.json({
    code: 200,
    data: [
      {
        id: '001',
        name: '李医生',
        department: '内科',
        avatar: 'data:image/png;base64,...'
      }
    ]
  })
})

app.post('/ExtExportAPI/QueryHealthData', (req, res) => {
  const { userId, tableNames } = req.body
  res.json({
    code: 200,
    data: {
      glutable: [
        { date: '2025-10-30', value: 120, unit: 'mg/dL' }
      ],
      nibptable: [
        { date: '2025-10-30', systolic: 130, diastolic: 80 }
      ]
    }
  })
})

// Socket.io 事件处理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id)

  socket.on('chat_start', (data) => {
    console.log('问诊开始:', data)
    socket.emit('assistant_content', {
      text: '您好，我是数字人医生。请描述您的症状。',
      audioUrl: 'data:audio/mp3;base64,...'
    })
  })

  socket.on('user_content', (data) => {
    console.log('用户输入:', data.text)
    // 模拟大模型回复（延迟 1-2s）
    setTimeout(() => {
      socket.emit('assistant_content', {
        text: '我理解您的情况，建议您进一步检查血压。',
        audioUrl: 'data:audio/mp3;base64,...'
      })
    }, 1500)
  })

  socket.on('disconnect', () => {
    console.log('用户断开:', socket.id)
  })
})

httpServer.listen(9000, () => {
  console.log('后端模拟服务运行于 http://localhost:9000')
  console.log('Socket.io 监听于 ws://localhost:9000')
})
```

**时间**：30 min
**验收**：`node mock-backend/server.ts` 启动，Socket.io 可连接

#### 3.3 连接测试

```typescript
// src/renderer/services/RestService.ts
import axios from 'axios'

const API_BASE = 'http://localhost:8099'

export const restAPI = {
  getAllDoctors: async () => {
    try {
      const res = await axios.get(`${API_BASE}/ExtExportAPI/GetAllDoctors`)
      return res.data.data
    } catch (error) {
      console.error('Failed to fetch doctors:', error)
      return []
    }
  },

  queryHealthData: async (userId: string, tableNames: string[]) => {
    try {
      const res = await axios.post(`${API_BASE}/ExtExportAPI/QueryHealthData`, {
        userId,
        tableNames
      })
      return res.data.data
    } catch (error) {
      console.error('Failed to query health data:', error)
      return {}
    }
  }
}
```

```typescript
// src/renderer/services/SocketService.ts
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const socketService = {
  connect: (url = 'ws://localhost:9000') => {
    if (socket?.connected) return socket

    socket = io(url, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    })

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id)
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
    })

    return socket
  },

  disconnect: () => {
    socket?.disconnect()
    socket = null
  },

  emit: (event: string, data?: any) => {
    socket?.emit(event, data)
  },

  on: (event: string, callback: (data: any) => void) => {
    socket?.on(event, callback)
  }
}
```

**时间**：30 min
**验收**：应用启动时能输出"Socket connected"日志

---

### Day 6-7: CI/CD 与 Git 工作流初始化

#### 4.1 Git 仓库初始化

```bash
# 初始化 git
git init
git config user.name "Development Team"
git config user.email "dev@example.com"

# 添加 .gitignore
cat > .gitignore << 'EOF'
node_modules/
dist/
.env
.env.local
.DS_Store
*.log
*.swp
.vscode/settings.json
EOF

git add .
git commit -m "init: initial commit with Electron + Vite + React skeleton"

# 创建 GitHub 仓库（假设已有 GitHub 账号）
gh repo create digitDoc-app --source=. --remote=origin --push
```

**时间**：15 min
**验收**：代码已提交到 GitHub

#### 4.2 GitHub Actions CI 配置

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Build
        run: npm run build
```

**时间**：20 min
**验收**：GitHub 仓库的 Actions 标签显示 CI 流程成功

#### 4.3 分支保护与 PR 模板

```markdown
<!-- .github/pull_request_template.md -->
## 描述
简要说明本 PR 的目的。

## 变更内容
- [ ] 新功能
- [ ] Bug 修复
- [ ] 文档更新
- [ ] 性能优化

## 关键改动
- 项目 A：修改了什么
- 项目 B：修改了什么

## 测试
描述你的测试步骤。

## 截图（如适用）
附加截图。

## Checklist
- [ ] 代码经过自审
- [ ] 添加了必要注释
- [ ] 更新了相关文档
- [ ] 本地测试通过
- [ ] 无新的警告信息
```

在 GitHub 仓库 Settings → Branches 中启用分支保护：
- 要求 PR review（≥ 1 approval）
- 要求 CI 通过
- 禁止强制推送

**时间**：15 min
**验收**：main 分支受保护，无法直接推送

---

## 🎬 Week 3-4: 核心播放与采集

### Day 8-9: wsplayer 集成

#### 任务：在 React 中使用 wsplayer 播放 RTSP 流

**输入**：wsplayer.zip 解压后的文件

**实现**：

```tsx
// src/components/VideoPlayer.tsx
import { useEffect, useRef, useState } from 'react'

interface VideoPlayerProps {
  videoId: string
  url: string
  onReady?: (player: any) => void
  onError?: (err: Error) => void
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  url,
  onReady,
  onError
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const playerRef = useRef<any>(null)
  const [status, setStatus] = useState('initializing')

  useEffect(() => {
    if (!window.zvvideo || !canvasRef.current) return

    try {
      // 创建播放器实例
      const player = window.zvvideo.player()

      // 设置播放参数
      const opts = {
        videoId,
        cameraId: 'test_camera',
        rtspUrl: url,
        rtspWebSocketUrl: 'ws://localhost:9002/ws',
        isH265Url: 'ws://localhost:9002/ws',
        streamMark: 'test_stream'
      }

      // 播放视频
      player.play(opts, (result: any) => {
        if (result.code === 200) {
          setStatus('playing')
          onReady?.(player)
        } else {
          setStatus('error')
          onError?.(new Error(result.message))
        }
      })

      playerRef.current = player
    } catch (err) {
      setStatus('error')
      onError?.(err as Error)
    }

    // 清理
    return () => {
      if (playerRef.current) {
        playerRef.current.stop(videoId)
      }
    }
  }, [videoId, url, onReady, onError])

  return (
    <div className="video-container">
      <canvas
        ref={canvasRef}
        id={videoId}
        width={1280}
        height={720}
        className="w-full bg-black rounded-lg"
      />
      <div className="mt-2 text-sm text-gray-500">
        状态: {status}
      </div>
    </div>
  )
}
```

**测试**：

```tsx
// src/pages/HomePage.tsx
import { VideoPlayer } from '@/components/VideoPlayer'

export default function HomePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">数字人医生</h1>
      <VideoPlayer
        videoId="main-player"
        url="rtsp://127.0.0.1:8554/stream"
        onReady={(player) => console.log('Player ready:', player)}
        onError={(err) => console.error('Player error:', err)}
      />
    </div>
  )
}
```

**时间**：120 min
**验收**：
- [ ] RTSP 流在 canvas 中播放
- [ ] 无花屏或黑屏
- [ ] 帧率稳定（≥ 25fps）
- [ ] 内存占用 < 150MB

---

### Day 10-12: 麦克风与语音输入

#### 任务：实现语音录音与上传

```typescript
// src/services/VoiceService.ts
export class VoiceService {
  private mediaRecorder: MediaRecorder | null = null
  private audioContext: AudioContext | null = null
  private stream: MediaStream | null = null
  private audioChunks: Blob[] = []

  async startRecording(): Promise<void> {
    try {
      // 请求麦克风权限
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      // 创建 AudioContext（用于音频处理）
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)()

      // 创建 MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      this.audioChunks = []

      this.mediaRecorder.ondataavailable = (e) => {
        this.audioChunks.push(e.data)
      }

      this.mediaRecorder.start()
      console.log('开始录音...')
    } catch (error) {
      console.error('Failed to access microphone:', error)
      throw error
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('未开始录音'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
        resolve(audioBlob)

        // 关闭流
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop())
          this.stream = null
        }
      }

      this.mediaRecorder.stop()
      console.log('停止录音')
    })
  }

  async uploadAndTranscribe(
    audioBlob: Blob,
    onProgress?: (text: string) => void
  ): Promise<string> {
    const formData = new FormData()
    formData.append('audio', audioBlob)

    try {
      const res = await fetch('http://localhost:8099/ExtExportAPI/TranscribeAudio', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const result = await res.json()
      const text = result.data?.text || ''

      onProgress?.(text)
      return text
    } catch (error) {
      console.error('Failed to transcribe:', error)
      throw error
    }
  }
}
```

**UI 组件**：

```tsx
// src/components/VoiceInput.tsx
import { useState, useRef } from 'react'
import { VoiceService } from '@/services/VoiceService'
import { Loader } from 'lucide-react'

export const VoiceInput: React.FC<{
  onTranscribe: (text: string) => void
  disabled?: boolean
}> = ({ onTranscribe, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const voiceServiceRef = useRef(new VoiceService())

  const handleStartRecording = async () => {
    try {
      setIsRecording(true)
      await voiceServiceRef.current.startRecording()
    } catch (error) {
      alert('麦克风权限被拒绝，请在系统设置中允许')
      setIsRecording(false)
    }
  }

  const handleStopRecording = async () => {
    setIsRecording(false)
    setIsProcessing(true)

    try {
      const audioBlob = await voiceServiceRef.current.stopRecording()
      const text = await voiceServiceRef.current.uploadAndTranscribe(
        audioBlob,
        (partialText) => onTranscribe(partialText)
      )
      onTranscribe(text)
    } catch (error) {
      alert('语音识别失败：' + (error as Error).message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex gap-2">
      {!isRecording ? (
        <button
          onClick={handleStartRecording}
          disabled={disabled || isProcessing}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          🎤 开始说话
        </button>
      ) : (
        <button
          onClick={handleStopRecording}
          className="px-4 py-2 bg-red-500 text-white rounded-lg animate-pulse"
        >
          ⏹ 停止录音
        </button>
      )}

      {isProcessing && (
        <div className="flex items-center gap-2">
          <Loader className="animate-spin" size={20} />
          <span>处理中...</span>
        </div>
      )}
    </div>
  )
}
```

**时间**：150 min
**验收**：
- [ ] 点击"开始说话"显示麦克风权限弹窗
- [ ] 实时显示录音动画
- [ ] 停止后 < 2s 显示识别结果
- [ ] 噪音环境下准确率 > 80%

---

### Day 13-14: 摄像头与人脸登录

#### 任务：集成人脸识别登录

```typescript
// src/services/FaceAuthService.ts
export class FaceAuthService {
  private stream: MediaStream | null = null
  private videoElement: HTMLVideoElement | null = null

  async startFaceDetection(
    videoElement: HTMLVideoElement
  ): Promise<void> {
    try {
      this.videoElement = videoElement
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      })

      videoElement.srcObject = this.stream
      videoElement.play()

      console.log('摄像头已启动')
    } catch (error) {
      console.error('Failed to access camera:', error)
      throw error
    }
  }

  async captureFrame(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.videoElement) {
        throw new Error('摄像头未初始化')
      }

      const canvas = document.createElement('canvas')
      canvas.width = this.videoElement.videoWidth
      canvas.height = this.videoElement.videoHeight

      const ctx = canvas.getContext('2d')!
      ctx.drawImage(this.videoElement, 0, 0)

      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
      }, 'image/jpeg', 0.8)
    })
  }

  async recognize(
    frameBlob: Blob,
    socket: any
  ): Promise<{ userId: string; name: string }> {
    return new Promise((resolve, reject) => {
      // 通过 WebSocket 发送图像到后端
      socket.emit('face_recognition_request', {
        image: frameBlob,
        timestamp: Date.now()
      })

      // 监听识别结果
      const timeout = setTimeout(() => {
        reject(new Error('人脸识别超时'))
      }, 5000)

      socket.once('face_detect', (result: any) => {
        clearTimeout(timeout)
        if (result.code === 200) {
          resolve({
            userId: result.data.userId,
            name: result.data.name
          })
        } else {
          reject(new Error(result.message))
        }
      })
    })
  }

  stopFaceDetection(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null
    }
  }
}
```

**登录页面**：

```tsx
// src/pages/LoginPage.tsx
import { useEffect, useRef, useState } from 'react'
import { FaceAuthService } from '@/services/FaceAuthService'
import { socketService } from '@/services/SocketService'
import { useAuthStore } from '@/services/store'

export default function LoginPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState('waiting') // waiting | recognizing | success | error
  const [message, setMessage] = useState('')
  const faceServiceRef = useRef(new FaceAuthService())
  const { setUser } = useAuthStore()

  useEffect(() => {
    const init = async () => {
      try {
        // 连接 WebSocket
        socketService.connect('ws://localhost:9000')

        // 启动摄像头
        if (videoRef.current) {
          await faceServiceRef.current.startFaceDetection(videoRef.current)
          setStatus('recognizing')
          startRecognition()
        }
      } catch (error) {
        setStatus('error')
        setMessage((error as Error).message)
      }
    }

    init()

    return () => {
      faceServiceRef.current.stopFaceDetection()
      socketService.disconnect()
    }
  }, [])

  const startRecognition = async () => {
    try {
      const frame = await faceServiceRef.current.captureFrame()
      const result = await faceServiceRef.current.recognize(
        frame,
        socketService.connect()
      )

      setStatus('success')
      setMessage(`欢迎，${result.name}`)

      // 保存用户信息并跳转
      setUser({
        id: result.userId,
        name: result.name
      })

      setTimeout(() => {
        window.location.href = '/'
      }, 1500)
    } catch (error) {
      setMessage((error as Error).message)
      // 重试
      setTimeout(startRecognition, 2000)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">数字人医生</h1>

        <div className="relative bg-black rounded-lg overflow-hidden mb-4">
          <video
            ref={videoRef}
            className="w-full aspect-video"
            autoPlay
            playsInline
          />
          {status === 'recognizing' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="animate-pulse text-white text-sm">识别中...</div>
            </div>
          )}
        </div>

        <div className="text-center">
          <p
            className={`text-sm ${
              status === 'error' ? 'text-red-500' : 'text-gray-600'
            }`}
          >
            {message || '请看向摄像头进行人脸识别'}
          </p>
        </div>

        <button
          onClick={() => {
            // 游客模式
            setUser({ id: 'guest', name: '游客' })
            window.location.href = '/'
          }}
          className="w-full mt-6 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          以游客身份继续
        </button>
      </div>
    </div>
  )
}
```

**时间**：150 min
**验收**：
- [ ] 摄像头正常显示实时视频
- [ ] 人脸识别 < 2s 完成
- [ ] 成功识别后自动登录
- [ ] 游客模式正常工作

---

## 📊 Week 5-6: 业务流程集成

（篇幅限制，省略详细代码，仅列出关键任务）

### 任务列表

- [ ] **Task 5.1**：Socket.io 事件处理（对话、分诊、推送）
- [ ] **Task 5.2**：REST API 集成（用户、医生、体测数据）
- [ ] **Task 5.3**：量表筛查 UI 与逻辑
- [ ] **Task 5.4**：病历采集与 OCR 集成
- [ ] **Task 5.5**：体测数据图表展示

每个任务 3-5 天，共 15 天

---

## 🏥 Week 7: 医生端大屏系统

### 任务列表

- [ ] **Task 7.1**：Kiosk 模式配置
- [ ] **Task 7.2**：患者列表实时刷新
- [ ] **Task 7.3**：医生端监看与控制
- [ ] **Task 7.4**：分诊推荐与备注

---

## 🎨 Week 8: 用户体验完善

### 任务列表

- [ ] **Task 8.1**：多用户档案管理
- [ ] **Task 8.2**：离线缓存与数据同步
- [ ] **Task 8.3**：错误处理与用户反馈
- [ ] **Task 8.4**：性能优化（首屏加载、内存泄漏）

---

## 📦 Week 9: 打包与部署

### Day 50-56

- [ ] **Task 9.1**：Electron Builder Windows MSI 配置
- [ ] **Task 9.2**：自启动与开机启动
- [ ] **Task 9.3**：自动更新机制（electron-updater）
- [ ] **Task 9.4**：代码签名与发布

---

## ✅ Week 10: 测试与验收

### Day 57-70

- [ ] **Task 10.1**：功能测试（自动化 + 手动）
- [ ] **Task 10.2**：性能测试（内存、CPU、首帧延迟）
- [ ] **Task 10.3**：安全审计（代码扫描、依赖检查）
- [ ] **Task 10.4**：医学合规检查

---

## 🚀 快速参考

### 常用命令

```bash
# 开发
npm start                    # 启动 Electron 开发环境

# 构建
npm run build                # 全量打包

# 测试
npm run test                 # 运行测试
npm run test:coverage        # 覆盖率报告

# 代码质量
npm run lint                 # ESLint
npm run type-check           # TypeScript 检查
npm run format               # Prettier 格式化

# 发布
npm run release              # 创建 GitHub Release
```

### 调试 URL

- **Electron 主进程**：VSCode Debugger（F5 启动）
- **Renderer 进程**：DevTools（Ctrl+Shift+I）
- **WebRTC**：chrome://webrtc-internals
- **GPU**：chrome://gpu

---

## 📝 每周检查点

每周五进行进度评审：

```markdown
## Week N Summary

### ✅ Completed
- [ ] Task A
- [ ] Task B

### 📊 Metrics
- Code Coverage: XX%
- Performance: XXms (target: XXms)
- Bugs Fixed: X
- New Bugs Found: X

### 🚧 Blockers
- Issue A: ...
- Issue B: ...

### ✅ Next Week
- Task C
- Task D
```

---

**最后更新**：2025-10-30
**下一次更新**：Week 1 完成时

