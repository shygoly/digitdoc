# 接口测试页面使用指南

## 前置准备

### 1. 复制 wsplayer 脚本文件

如果遇到权限问题，请手动执行：

```bash
# 创建目录
mkdir -p public/lib

# 复制文件
cp wsplayer_extracted/zvvideo.js public/
cp wsplayer_extracted/lib/streamedianAACH264H265.min.js public/lib/
```

或者使用脚本（可能需要 sudo）：

```bash
./scripts/setup_wsplayer.sh
```

### 2. 启动开发服务器

```bash
pnpm dev
```

## 功能说明

### REST API 测试

测试以下接口：
- **GetDialogData** - 获取医患对话数据
- **GetAllDoctors** - 获取所有医生信息
- **QueryHealthData** - 查询患者体测数据
- **GetAllUsers** - 获取患者信息

每个接口都有：
- 参数输入提示
- 响应结果显示（JSON 格式化）
- 错误提示
- 状态指示

### Socket.io 测试

1. **连接管理**
   - 选择服务器地址（患者端/管理端/医生端）
   - 连接/断开按钮
   - 连接状态显示

2. **事件发送**
   - case1-case6: 病历生成事件
   - triage: 分诊结果

3. **事件监听**
   - 实时显示接收到的所有 Socket.io 事件
   - 包括：case_content1-6, send_triage, user_content, assistant_content, face_detect

### 数字人测试

#### 视频播放模块
- **RTSP 流配置**: 输入 RTSP 地址（默认：`rtsp://localhost:8554/test`）
- **WebSocket 配置**: 输入 WebSocket 地址（用于 wsplayer）
- **播放控制**: 开始/停止播放按钮
- **状态显示**: 实时显示播放状态

#### 对话测试模块
- **开始完整对话**: 一键启动视频播放 + Socket.io 连接 + 对话流程
- **对话控制**: 开始/结束对话按钮
- **消息发送**: 输入文本消息（模拟语音输入）并发送
- **对话历史**: 实时显示医生和患者的对话记录
- **状态显示**: 显示对话状态（空闲/等待回复/对话中）

### 日志面板

所有操作都会记录到日志面板，包括：
- API 请求和响应
- Socket.io 事件
- 视频播放状态
- 对话流程

## 使用流程示例

### 测试完整对话流程

1. **配置服务器地址**
   - REST API: `http://218.206.102.135:8099/ExtExportAPI`
   - Socket.io: `http://218.206.102.135:3000` (患者端)

2. **连接 Socket.io**
   - 点击 "连接" 按钮
   - 确认状态显示为 "已连接"

3. **启动视频播放**
   - 输入 RTSP 地址（测试流：`rtsp://localhost:8554/test`）
   - 点击 "开始播放"

4. **开始对话**
   - 点击 "开始完整对话" 或 "开始对话"
   - 输入消息并点击 "发送消息"
   - 查看对话历史和数字人回复

5. **测试其他功能**
   - 测试 REST API 接口
   - 测试 Socket.io 事件（case1, triage 等）
   - 查看日志面板了解详细过程

## 注意事项

1. **wsplayer 脚本加载**
   - 如果视频播放失败，检查浏览器控制台是否有脚本加载错误
   - 确保 `public/` 目录下有正确的脚本文件

2. **跨域问题**
   - 如果遇到 CORS 错误，需要在后端配置 CORS 头
   - 或者使用 Electron 的 webSecurity: false（仅开发环境）

3. **Socket.io 连接**
   - 确保后端 Socket.io 服务器正在运行
   - 检查防火墙和网络连接

4. **RTSP 流测试**
   - 本地测试流：`rtsp://localhost:8554/test`
   - 确保 mediamtx 和 ffmpeg 正在运行
