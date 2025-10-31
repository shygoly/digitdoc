# 数字人医生系统 - 完整项目规范

> 基于 Spec-Kit 规范驱动开发方法论
> 项目名称：digitDoc（数字人医生系统）
> 版本：1.0.0-spec
> 最后更新：2025-10
> 开发环境：macOS 13+ / Windows 10+

---

## 📋 项目宪法（Constitution）

### 核心原则

#### I. 以患者为中心的语音优先交互
- 所有核心流程（问诊、筛查、数据输入）优先使用语音驱动
- 触控仅作为兜底和特殊场景（点击同意、多选等）
- 语音识别失败时自动降级到触控输入
- 数字人表达（文字+语音+表情动作）保持同步

#### II. 整体一体化的医疗流程闭环
- 患者端：登录 → 问诊 → 量表筛查 → 病历采集 → 分诊推荐
- 医生端：患者列表 → 实时监看 → 互动干预 → 记录转诊
- 双向 socket.io 事件流确保两端状态实时同步
- 每个流程节点都有清晰的成功/失败标志

#### III. 多用户与隐私管理
- 单设备支持多人档案（人脸识别快速切换）
- 每个用户独立的病历、体测数据、交互历史
- 会话隔离：不同用户间不可见对方数据
- 游客模式：不保存任何个人信息

#### IV. 高可用与容错机制
- WebSocket/socket.io 断线自动重连（指数退避）
- 关键接口失败后自动重试（最多3次）
- 视频流异常自动降速或切换低码率
- 本地缓存关键数据（用户档案、上次问诊）以实现离线查看

#### V. 跨平台一致性与 Windows 优先
- macOS 作为开发与快速迭代环境（90% 逻辑）
- Windows 作为最终交付与性能验收环境
- GPU 硬解码、Kiosk 模式、自启动在两平台均需验证
- 代码共用，配置与打包分离

#### VI. 可观测与可维护性
- 所有网络请求、socket 事件都要记录日志（电子日志库）
- 关键业务操作（登录、问诊开始/结束、分诊）上报到后端日志系统
- 错误堆栈与重现步骤必须可追踪
- 性能指标（视频首帧延迟、ASR 响应时间）定期采样上报

#### VII. 医学合规与数据安全
- 所有患者数据传输使用 HTTPS/WSS 加密
- 敏感字段（身份证、诊疗记录）在本地不持久化或加密存储
- 符合医疗数据三级等保要求
- 审计日志：谁、什么时间、操作了什么、结果如何

---

## 🎯 产品需求规范（PRD）

### 8 大核心功能目标

| # | 功能 | 优先级 | 用户场景 | 验收标准 |
|---|------|--------|---------|---------|
| 1 | **数字人医生主界面** | P1 | 患者启动应用即看到数字人医生，可直接对话 | 数字人显示、语音识别启动、对话流畅 |
| 2 | **多用户登录与档案管理** | P1 | 同一设备多人使用，快速切换身份 | 人脸识别 < 2s，档案隔离，游客模式 |
| 3 | **实时问诊与对话** | P1 | 患者用语音描述症状，数字人实时回复建议 | ASR < 1s，TTS 口型同步，病历自动生成 |
| 4 | **摄像头采集与报告** | P2 | 患者可拍照上传医学检查报告，OCR 解析关键指标 | 拍照清晰、OCR 准确率 > 85%、结构化显示 |
| 5 | **基于病史的智能建议** | P2 | 结合既往史、体检数据、家族史生成医学建议 | 建议时延 < 3s，可溯源到具体数据项 |
| 6 | **智能量表筛查** | P1 | 数字人驱动糖尿病/认知障碍/抑郁症等量表，支持跳题与护理复核 | 全自动播报、异常检出、评分准确、可导出 |
| 7 | **医生端大屏展示系统** | P1 | 医生在独立大屏监看患者问诊全过程，可标注与干预 | 患者列表实时更新、视频/对话同步、可控制 |
| 8 | **医生端操作患者端可见** | P1 | 医生在大屏进行的任何操作（推送消息、改分诊标签等）患者端即时反馈 | 消息延迟 < 500ms、列表顺序同步 |

### 关键指标

- **响应时间**：ASR 识别 < 1s，大模型回复 < 3s，网络延迟 < 200ms
- **可用性**：系统正常运行时间 > 99%，故障自动恢复 < 10s
- **患者体验**：首次交互引导时间 < 30s，单次问诊完整链路 < 5min
- **安全性**：无患者隐私泄露事件，审计覆盖 100% 敏感操作

---

## 🏗 系统架构规范

### 整体拓扑

```
┌─────────────────────────────────────────────────────────────┐
│                     Electron Shell                           │
│  (Patient App / Doctor App - 同代码库，不同配置)             │
├──────────────────────┬──────────────────────┬────────────────┤
│  Main Process        │ Renderer (React)     │ Preload Bridge │
├──────────────────────┼──────────────────────┼────────────────┤
│ - Auto-startup       │ ┌──────────────────┐ │ Native APIs    │
│ - Kiosk (doctor)     │ │ UI Components    │ │ File I/O       │
│ - Single Instance    │ │ - VideoPlayer    │ │ Device Mgmt    │
│ - Auto-update        │ │ - VoiceInput     │ │ Local Storage  │
│ - Crash Recovery     │ │ - FaceAuth       │ │                │
│                      │ │ - EMRCapture     │ │                │
│                      │ │ - Screening      │ │                │
│                      │ │ - HealthChart    │ │                │
│                      │ └──────────────────┘ │                │
│                      │                      │                │
│                      │ ┌──────────────────┐ │                │
│                      │ │ Services         │ │                │
│                      │ │ - SocketService  │ │                │
│                      │ │ - RestService    │ │                │
│                      │ │ - DeviceService  │ │                │
│                      │ │ - SettingsStore  │ │                │
│                      │ └──────────────────┘ │                │
└──────────────────────┴──────────────────────┴────────────────┘
           ↓                                         ↓
┌──────────────────────────────────────────────────────────────┐
│                  Backend Services                            │
├──────────────────────┬──────────────────────┬────────────────┤
│ Digital Human        │ Medical AI           │ Video Proc.    │
│ - LLM Model          │ - ASR Engine         │ - RTSP Server  │
│ - TTS                │ - Face Recognition   │ - H.264 Codec  │
│ - Avatar Video       │ - OCR (Reports)      │ - WebSocket    │
│                      │ - Screening Logic    │   Gateway      │
│ REST Port: 8099      │ REST + Socket.io     │ RTSP: 8554     │
│                      │ Port: 9000/9001      │ WS: 9002       │
└──────────────────────┴──────────────────────┴────────────────┘
```

### 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **桌面壳** | Electron | ^31 | 跨平台应用容器 |
| **UI 框架** | React | ^18 | 组件化前端 |
| **构建工具** | Vite | ^5 | 快速开发与打包 |
| **样式** | Tailwind CSS | ^3 | Utility-first CSS |
| **状态管理** | Zustand | ^4 | 轻量化状态库 |
| **网络库** | axios + socket.io-client | ^1.6 | HTTP + WebSocket |
| **音视频** | WebRTC + WebAudio API | Native | 麦克风/摄像头/音频处理 |
| **视频播放** | wsplayer (zip) | - | H.264/H.265 解码（自带） |
| **日志** | electron-log | ^5 | 前端日志持久化 |
| **存储** | electron-store | ^8 | 本地配置与缓存 |
| **打包** | electron-builder | ^24 | MSI/MSIX 生成 |

---

## 📐 功能分解与开发任务

### Phase 1: 基础设施与环境（Week 1-2）

#### Task 1.1: Electron 基座搭建
**目标**：完成 macOS 与 Windows 上可稳定启动的 Electron 应用框架

**输入**：
- Node.js LTS，electron@31，vite@5

**实现要点**：
- 主进程（main.ts）：窗体创建、IPC 通道、自启动配置
- Preload 脚本：受限的 Node.js API 暴露（文件、设备、日志）
- Vite 配置：HMR 开发服务器，预加载脚本打包
- 打包配置：MSI（Windows）、DMG（macOS）

**验收标准**：
- [ ] `npm run dev` 在 macOS 上能启动应用
- [ ] `npm run build` 生成 Windows MSI 文件
- [ ] 应用崩溃后能自动重启（可选）
- [ ] 多实例启动时仅运行一个（single instance）

**参考文件**：`macOS开发调试手册.md` 第 3~4 节

---

#### Task 1.2: 开发环境工具链配置
**目标**：macOS 上完整的开发与调试环境

**执行步骤**：
```bash
# 1. 环境检查
brew install node ffmpeg mkcert mediamtx
nvm install --lts && nvm use --lts

# 2. 项目初始化
npm init -y
npm install --save-dev electron vite react @vitejs/plugin-react

# 3. 本地 HTTPS 证书（开发用）
mkcert -install
mkcert localhost 127.0.0.1

# 4. VSCode 调试配置
# → 创建 .vscode/launch.json
```

**验收标准**：
- [ ] `node -v`, `npm -v`, `electron -v` 都能打印正确版本
- [ ] `mkcert localhost` 生成证书成功
- [ ] VSCode 调试器能单步执行 Electron 主进程

---

#### Task 1.3: 本地后端模拟环境
**目标**：在 macOS 上模拟后端服务（RTSP、WebSocket、REST API）

**执行步骤**：
```bash
# 1. 启动 RTSP 测试流
mediamtx &
ffmpeg -re -stream_loop -1 -i demo.mp4 -c:v libx264 -f rtsp rtsp://localhost:8554/test

# 2. Node.js 模拟 WebSocket 与 REST 服务
# → 创建 mock-backend/ 目录
npm install express socket.io cors uuid
node mock-backend/server.js
```

**验收标准**：
- [ ] `mediamtx` 运行，RTSP 流可播放
- [ ] 模拟 WebSocket 服务监听 9000 端口
- [ ] 模拟 REST API 监听 8099 端口，关键端点可返回示例数据

---

### Phase 2: 核心播放与采集（Week 3-4）

#### Task 2.1: 集成 wsplayer 组件
**目标**：在 React 中封装 wsplayer，支持 RTSP/WebSocket 播放

**输入**：
- wsplayer.zip（已有的 zvvideo.js + 库）
- React 容器组件框架

**实现要点**：
```tsx
// src/components/VideoPlayer.tsx
import { useEffect, useRef } from 'react'

export const VideoPlayer: React.FC<{
  videoId: string
  url: string
  onReady?: (player: any) => void
  onError?: (err: any) => void
}> = ({ videoId, url, onReady, onError }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // 初始化 wsplayer
    const player = window.zvvideo.player()
    // ... 绑定事件、处理错误、清理资源
  }, [url])

  return <canvas ref={canvasRef} id={videoId} />
}
```

**验收标准**：
- [ ] 视频正常播放，无花屏或卡顿
- [ ] 支持暂停、播放、进度拖拽
- [ ] 可切换主/子码流
- [ ] GPU 硬解码工作（chrome://gpu 确认）

**性能指标**：
- 首帧延迟 < 1s
- 1080p 播放帧率 ≥ 25fps
- 内存占用 < 200MB

---

#### Task 2.2: 麦克风采集与 ASR 集成
**目标**：通过 WebRTC/WebSocket 采集语音，发送到后端 ASR

**实现要点**：
```tsx
// src/services/VoiceService.ts
export class VoiceService {
  private mediaRecorder: MediaRecorder
  private audioContext: AudioContext

  async startRecording(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    // ... 初始化 MediaRecorder，将 PCM 数据通过 socket 发送
  }

  async stopRecording(): Promise<string> {
    // 返回 ASR 文本结果
  }
}
```

**验收标准**：
- [ ] 首次授权麦克风时显示系统权限弹窗
- [ ] 语音识别延迟 < 1s（网络正常条件下）
- [ ] 噪音场景下 ASR 准确率 > 80%
- [ ] 支持多语言识别（中文、英文）

---

#### Task 2.3: 摄像头与人脸登录
**目标**：摄像头采集，通过 WebRTC 发送给后端人脸识别

**实现步骤**：
1. 枚举设备列表（支持多摄像头）
2. 建立 WebRTC 连接，采集本地视频流
3. 后端识别后通过 socket 返回用户信息
4. 前端展示登录结果或请求再试

**验收标准**：
- [ ] 摄像头列表可正常枚举
- [ ] 视频预览实时显示在登录页面
- [ ] 人脸识别成功后自动跳转到首页
- [ ] 识别失败时可重试或返回手动输入

---

### Phase 3: 业务流程集成（Week 5-6）

#### Task 3.1: Socket.io 事件驱动的对话流程
**目标**：患者端与医生端通过 socket.io 实现实时对话与互动

**关键事件定义**：
```typescript
// 患者端发送
socket.emit('chat_start', { userId, doctorId, reason })
socket.emit('user_content', { text, audioUrl })

// 患者端监听
socket.on('assistant_content', ({ text, audioUrl, expression })
socket.on('send_triage', { department, level, reason })

// 医生端双向
socket.on('doctor_action', { action, target, value })
```

**验收标准**：
- [ ] 对话文本 < 500ms 回传
- [ ] 医生端操作患者端即时反馈
- [ ] socket 断线自动重连
- [ ] 所有事件都记录日志便于追踪

---

#### Task 3.2: REST API 集成（用户、体测、诊疗记录）
**目标**：将后端核心接口封装为 SDK

**关键 API**：
```typescript
// src/services/RestService.ts
export const restAPI = {
  // 用户管理
  getAllUsers: () => axios.get('/ExtExportAPI/GetAllUsers'),
  getUserProfile: (userId: string) => axios.get(`/ExtExportAPI/GetUser/${userId}`),

  // 医生管理
  getAllDoctors: () => axios.get('/ExtExportAPI/GetAllDoctors'),

  // 体测数据
  queryHealthData: (userId: string, tableNames: string[]) =>
    axios.post('/ExtExportAPI/QueryHealthData', { userId, tableNames }),

  // 病历
  submitEMR: (userId: string, emrData: EMRRecord) =>
    axios.post('/ExtExportAPI/SubmitEMR', { userId, ...emrData }),

  // 对话历史
  getDialogHistory: (userId: string, sessionId: string) =>
    axios.get(`/ExtExportAPI/GetDialogData/${userId}/${sessionId}`)
}
```

**验收标准**：
- [ ] 所有 API 调用包含正确的认证头
- [ ] 请求失败后自动重试（指数退避）
- [ ] 响应数据本地缓存 5 分钟减少重复请求
- [ ] 错误信息清晰，便于调试

---

#### Task 3.3: 量表筛查流程
**目标**：由后端驱动，数字人逐题播报，患者语音/触控答题

**流程**：
1. 后端推送量表元数据（题目、选项、跳题规则）
2. 前端由数字人播报，同时显示选项
3. 患者语音答题，或触控选择
4. 异常值自动跳过（如"不会"、"不适用"）
5. 护理可在医生端复核缺失项
6. 完结后显示评分与诊断建议

**验收标准**：
- [ ] 量表逐题播报，音视频同步
- [ ] 语音答题识别准确率 > 85%
- [ ] 支持跳题、回答修改、放弃筛查
- [ ] 评分逻辑与医学标准一致
- [ ] 可导出为 PDF 或影像病历

---

#### Task 3.4: 病历采集与 OCR
**目标**：拍照、上传、自动解析关键医学指标

**流程**：
1. 调用摄像头拍照
2. 本地质量检查（清晰度、光线）
3. 上传到后端 OCR 服务
4. 后端返回结构化文本（数值、单位、参考范围）
5. 前端显示原图 + 结构化摘要
6. 用户确认或手动修正后入库

**验收标准**：
- [ ] 拍照界面有实时预览与对焦提示
- [ ] OCR 识别准确率 > 85%（针对常见检查单）
- [ ] 关键数值（血糖、血压等）提取准确
- [ ] 支持多张报告、多个数据项同时上传

---

### Phase 4: 医生端大屏与实时监看（Week 7）

#### Task 4.1: 医生端 Kiosk 模式与布局
**目标**：医生端全屏展示，禁用系统导航，支持管理员热键

**实现要点**：
```typescript
// src/main/window.ts
if (isDoctorApp) {
  const win = new BrowserWindow({
    // ...
    kiosk: true, // Windows 与 macOS 全屏禁输入法
    show: false
  })
  win.loadURL(doctorAppUrl)

  // 管理员热键：Ctrl+Alt+Shift+Q 退出 Kiosk
  if (!app.isPackaged) {
    win.webContents.on('before-input-event', (event, input) => {
      if (input.control && input.alt && input.shift && input.key.toLowerCase() === 'q') {
        win.setKiosk(false)
      }
    })
  }
}
```

**验收标准**：
- [ ] 应用启动后即进入全屏模式
- [ ] 任务栏、菜单栏隐藏
- [ ] 鼠标移动到屏幕边界不显示系统控件
- [ ] 管理员可通过热键临时退出 Kiosk

---

#### Task 4.2: 医生端患者列表与实时监看
**目标**：医生端显示所有在线患者，可选择查看实时问诊

**界面元素**：
- 左侧：患者列表（头像、姓名、症状、状态、等待时间）
- 中央：患者端屏幕镜像（实时视频/对话/数据）
- 右侧：医生操作面板（推荐科室、备注、干预）

**验收标准**：
- [ ] 列表实时更新，延迟 < 1s
- [ ] 可搜索/筛选患者（按科室、症状等）
- [ ] 视频镜像流畅，无明显延迟
- [ ] 医生操作立即在患者端显示

---

#### Task 4.3: 医生端干预与控制
**目标**：医生可以对患者端进行有限的控制和指导

**控制项**：
- 推送消息（文字、语音）到患者端
- 修改分诊科室/优先级
- 标记患者为"已处理"或"需复诊"
- 批注关键病历要素
- 触发补充问卷或检查

**验收标准**：
- [ ] 所有医生操作都通过 socket.io 实时传递
- [ ] 患者端界面即时更新
- [ ] 操作历史记录便于追溯
- [ ] 敏感操作（如修改诊断）需确认

---

### Phase 5: 用户体验与完善（Week 8）

#### Task 5.1: 多用户档案与快速切换
**目标**：支持家庭多人使用，快速人脸识别切换

**功能**：
- 首次登录建档（人脸注册）
- 后续启动自动识别
- 游客模式（不保存信息）
- 档案编辑（头像、名字、年龄、基本病史）

**存储**：
- 本地加密存储（electron-store）
- 同步到云端（可选）

**验收标准**：
- [ ] 人脸识别准确率 > 95%
- [ ] 识别速度 < 2s
- [ ] 档案切换无数据泄露
- [ ] 游客模式完全不存数据

---

#### Task 5.2: 体测数据与健康图表
**目标**：整合体测数据（血压、血糖、心率等），时间序列展示

**图表类型**：
- 折线图（血压、血糖趋势）
- 仪表盘（当前血压等级）
- 柱状图（体重变化）

**验收标准**：
- [ ] 数据加载 < 1s
- [ ] 图表交互流畅（缩放、拖拽）
- [ ] 支持时间范围筛选（周、月、年）
- [ ] 可导出为图片或 Excel

---

#### Task 5.3: 离线缓存与数据同步
**目标**：在网络不稳定时仍可使用应用的基本功能

**缓存策略**：
- 用户档案：每次登录后缓存
- 体测数据：每次查询后缓存 5 分钟
- 对话历史：本地保存，上网时同步
- 量表答卷：草稿保存，可离线继续

**同步机制**：
- 网络恢复时自动同步待同步项
- 冲突时以服务器数据为准
- 用户有明确的"离线模式"标识

**验收标准**：
- [ ] 离线状态下仍可查看缓存数据
- [ ] 缓存过期时提示用户
- [ ] 网络恢复后自动同步
- [ ] 无数据丢失或冲突

---

### Phase 6: 打包与部署（Week 9）

#### Task 6.1: Windows 打包与安装程序
**目标**：生成可分发的 MSI/MSIX 安装程序

**配置**：
```javascript
// electron-builder 配置
{
  "win": {
    "target": ["msi", "portable"],
    "certificateFile": "path/to/cert.pfx",
    "certificatePassword": "password"
  },
  "msi": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  }
}
```

**验收标准**：
- [ ] MSI 文件生成成功
- [ ] 可在 Windows 10/11 上正常安装
- [ ] 安装时可选择安装路径
- [ ] 支持"快速启动"菜单或桌面快捷方式

---

#### Task 6.2: 自启动与开机启动配置
**目标**：医生端应用支持开机自启（kiosk 模式）

**实现**：
```typescript
if (isDoctorApp) {
  app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: true // 后台启动
  })
}
```

**验收标准**：
- [ ] 重启 Windows 后应用自动启动
- [ ] 自启动可通过设置面板开关
- [ ] 启动时自动进入 Kiosk 模式
- [ ] 加入系统启动项（任务管理器可查看）

---

#### Task 6.3: 自动更新机制
**目标**：通过 electron-updater 实现在线升级

**流程**：
1. 启动时检查更新
2. 后台下载新版本
3. 提示用户安装（可延迟）
4. 重启应用并应用更新

**验收标准**：
- [ ] 更新检查 < 2s 完成
- [ ] 下载进度可显示
- [ ] 支持手动检查与自动检查
- [ ] 更新失败时可回滚

---

### Phase 7: 测试与优化（Week 10）

#### Task 7.1: 功能测试与自动化
**目标**：覆盖核心用户路径的自动化测试

**测试用例**：
- 患者端：登录 → 问诊 → 分诊 → 病历查询
- 医生端：患者列表 → 选择患者 → 实时监看 → 推荐科室
- 异常场景：网络掉线、WebSocket 重连、超时处理

**工具**：
- 单元测试：Vitest
- 集成测试：Playwright（自动化浏览器）
- 端对端测试：Cypress（用户交互）

**验收标准**：
- [ ] 核心路径覆盖率 > 80%
- [ ] 所有测试可在 CI/CD 自动运行
- [ ] 失败时能清晰定位问题

---

#### Task 7.2: 性能优化
**目标**：确保在低端 Windows 设备上也能流畅运行

**优化点**：
- 视频首帧延迟：目标 < 1.5s
- 内存占用：目标 < 300MB
- CPU 占用（待机）：目标 < 5%
- 打包体积：目标 < 150MB（不含视频库）

**优化方法**：
- 代码分割与懒加载
- 图片压缩与 WebP 转换
- 关键路径优化（首页加载流程）
- GPU 硬解码验证

**验收标准**：
- [ ] Chrome DevTools 性能分析无明显瓶颈
- [ ] 低端设备（4GB RAM）也能使用
- [ ] 多小时使用无内存泄漏

---

#### Task 7.3: 安全与合规检查
**目标**：确保用户数据安全，符合医疗数据规范

**检查项**：
- 所有网络通信使用 HTTPS/WSS
- 敏感数据（身份证、诊疗记录）加密存储
- 审计日志覆盖 100% 敏感操作
- 用户同意隐私协议才能使用

**工具**：
- 代码扫描：SonarQube / OWASP ZAP
- 依赖检查：npm audit
- 渗透测试：专业安全团队

**验收标准**：
- [ ] 无高危安全漏洞
- [ ] 依赖无已知漏洞
- [ ] 符合三级等保要求
- [ ] 隐私协议齐备

---

## 🚀 开发流程（遵循 Spec-Kit）

### 周期流程

每个 Feature 完整周期：**Specify → Plan → Tasks → Implement → Test → Review → Merge**

```
┌─────────────┐
│ Specification │ (PRD + User Stories + Acceptance Criteria)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Planning      │ (Architecture + Tech Decisions + Dependencies)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Task Breakdown│ (Small, independently deliverable tasks)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Implementation│ (Code + Unit Tests)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Integration  │ (API Mocking / Backend Integration)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Testing      │ (Manual + Automated + Performance)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Code Review  │ (Peer review + Architecture review)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Merge & Deploy │ (Main branch + Release branch + Tag)
└─────────────┘
```

### 每日开发节奏

**早会（15 min）**：
- 昨日完成情况
- 今日优先级
- 遇到的阻碍

**开发（6 hours）**：
- 按任务列表逐一实现
- 频繁提交（每 1-2 小时）
- 保持可编译、可测试状态

**晚会（15 min）**：
- 代码自审与提交
- PR 创建与描述
- 复盘与计划明日

### Git 工作流

```bash
# 新功能分支
git checkout -b feat/patient-voice-input

# 小步提交，保持历史清晰
git commit -m "feat: add microphone permission request UI"
git commit -m "feat: integrate Web Audio API for PCM recording"
git commit -m "test: add voice recording unit tests"

# 推送与创建 PR
git push origin feat/patient-voice-input
gh pr create --title "feat: patient voice input integration" \
  --body "Implements voice recording and ASR integration for patient input"

# Code Review 后合并（要求 >=2 approvals）
gh pr merge --squash  # 清整历史后合并
```

### 代码质量标准

| 指标 | 要求 | 检查工具 |
|------|------|---------|
| 代码风格 | Prettier + ESLint | CI/CD |
| 单元测试覆盖率 | > 80% | Vitest Coverage |
| 类型安全 | TypeScript strict mode | tsc --strict |
| 依赖安全 | 无已知漏洞 | npm audit |
| 代码复杂度 | < 15 (Cyclomatic) | SonarQube |
| Accessibility | WCAG AA 标准 | axe DevTools |

---

## 📊 交付物清单

### 代码库

- ✅ GitHub/GitLab 仓库，主分支受保护
- ✅ CI/CD 配置（GitHub Actions / GitLab CI）
- ✅ 自动化测试覆盖 > 80%
- ✅ 代码审查规则与 PR 模板

### 文档

- ✅ API 文档（OpenAPI / Swagger）
- ✅ 架构决策记录（ADR）
- ✅ 用户手册（患者端与医生端）
- ✅ 运维手册（部署、监控、故障排查）
- ✅ 开发者指南（本文档）

### 应用程序

- ✅ 患者端 Windows MSI / macOS DMG
- ✅ 医生端 Windows MSI / macOS DMG（可选）
- ✅ Web 版本（可选，基于同代码库）
- ✅ 自动更新机制

### 数据与日志

- ✅ 用户操作审计日志（导出为 CSV）
- ✅ 系统性能指标（首帧延迟、内存、CPU）
- ✅ 错误堆栈与重现步骤
- ✅ 用户反馈收集机制

---

## 🔄 迭代与改进

### 反馈机制

1. **用户反馈**：在应用内集成"反馈"按钮，收集截图 + 描述
2. **错误上报**：自动捕获未处理异常，上传堆栈与上下文
3. **性能监测**：定期采样视频延迟、ASR 响应时间、内存占用
4. **医学反馈**：医生端标记"错误诊断"或"改进建议"

### 每周评审

- 周五 EOD：汇总完成情况、性能指标、用户反馈
- 周一早会：根据反馈调整下周优先级

---

## 📞 支持与联系

- **技术支持**：[Slack 频道 / 邮件]
- **bug 报告**：GitHub Issues
- **功能需求**：Discussion / Feature Request
- **安全漏洞**：security@example.com

---

## 版本历史

| 版本 | 日期 | 变更 | 作者 |
|------|------|------|------|
| 1.0.0-spec | 2025-10 | 初稿：项目宪法、PRD、架构、任务分解、开发流程 | Claude AI |

---

**最后更新时间**：2025-10-30
**下一次审视**：2025-11-06（Sprint Review）

