# 数字人测试模块问题分析报告

## 通过 Playwright MCP 测试发现的问题

### ✅ 已修复的问题

1. **jQuery 未加载**
   - **错误**: `$ is not defined`
   - **原因**: wsplayer 依赖 jQuery，但未加载
   - **修复**: 
     - 复制 `jquery-1.12.4.min.js` 到 `public/lib/`
     - 更新 `index.html` 和动态加载脚本时先加载 jQuery

2. **baseWsIp 未定义**
   - **错误**: `baseWsIp is not defined`
   - **原因**: `zvvideo.js` 第 154 行使用了全局变量 `baseWsIp`
   - **修复**: 在播放前从 `wsUrl` 中提取 IP:端口，设置 `window.baseWsIp`

### ⚠️ 当前问题

3. **timeSession 未定义**（进行中）
   - **错误**: `timeSession is not defined`
   - **位置**: `zvvideo.js` 中某处使用了 `timeSession` 变量
   - **需要**: 检查并设置此变量

## wsplayer API 使用分析

根据代码分析，`zvvideo.js` 的 `play` 方法需要以下参数：

```javascript
{
  videoId: string,        // Canvas 元素的 ID
  cameraId: string,       // 摄像头 ID
  rtspUrl: string,        // RTSP 流地址
  rtspWebSocketUrl: string, // WebSocket 地址
  isH265Url: string,      // H265 流的 WebSocket 地址
  streamMark: string,     // 流标记
  errorId?: string,       // 错误显示元素的 ID（可选）
  startTime?: string,     // 回放开始时间（可选）
  endTime?: string,       // 回放结束时间（可选）
}
```

## 需要的全局变量

根据 `wsplayer_extracted/index.html` 和 `zvvideo.js` 的分析：

1. **baseWsIp** ✅ 已修复
   - 格式: `"host:port"` (如: `"localhost:8554"`)
   - 用途: 构建默认的 RTSP 和 WebSocket URL

2. **timeSession** ⚠️ 待修复
   - 需要检查 zvvideo.js 中如何使用
   - 可能是用于音频播放的时间戳

## 建议的修复方案

### 方案 1: 设置所有必需的全局变量

```typescript
// 在播放前设置
(window as any).baseWsIp = 'localhost:8554'
(window as any).timeSession = Date.now().toString() // 或生成唯一 ID
```

### 方案 2: 检查 zvvideo.js 的实际使用

查看 `zvvideo.js` 中 `timeSession` 的用途，如果只是用于生成唯一 ID，可以用时间戳替代。

### 方案 3: 直接调用 playVideo 方法

如果 `play` 方法有太多依赖，可以考虑直接调用 `playVideo` 方法，它似乎更直接。

## 下一步操作

1. 检查 `zvvideo.js` 中 `timeSession` 的使用位置
2. 设置适当的 `timeSession` 值
3. 重新测试视频播放功能
4. 如果仍有问题，考虑使用更底层的 API 或修改 wsplayer 适配
