# 数字人医生项目 - Spec-Kit SubAgent 设计方案

> 基于项目规范，设计可复用的 AI 子代理
> 用于加速规范编写、代码生成、测试、部署等环节

---

## 🤖 SubAgent 概述

SubAgent 是基于 Claude Code 的专用 AI 助手，针对项目的特定环节进行优化：

| Agent | 职责 | 触发方式 | 输入 | 输出 |
|-------|------|---------|------|------|
| **Spec Writer** | 将想法转化为 PRD | `/speckit.specify` | 功能描述 | 完整的规范文档 |
| **Architect** | 技术架构设计 | `/speckit.plan` | PRD | 技术方案 + 数据模型 |
| **Code Generator** | 自动生成代码框架 | `/speckit.implement` | 规范 + 架构 | 可运行的代码 |
| **Test Designer** | 设计测试用例 | `/speckit.test` | 规范 + 代码 | 测试套件 |
| **Reviewer** | 代码审查与合规检查 | `/speckit.review` | PR + 规范 | 审查意见 + 改进建议 |
| **DevOps** | 部署与发布管理 | `/speckit.deploy` | 代码 + 配置 | 打包 + 部署脚本 |
| **Doc Generator** | 自动生成文档 | `/speckit.document` | 代码 + 规范 | API 文档 + 用户手册 |
| **Performance Analyzer** | 性能分析与优化 | `/speckit.profile` | 代码 | 性能报告 + 优化建议 |

---

## 🎯 详细 SubAgent 设计

### 1️⃣ Spec Writer Agent（规范编写助手）

**职责**：将非正式的功能描述转化为标准的 Spec-Kit 规范

**输入**：
```
功能想法：
"患者可以用语音描述症状，系统给出诊疗建议"
```

**处理流程**：
1. 分解功能为多个用户故事
2. 定义验收标准（Gherkin 格式）
3. 识别技术依赖与风险
4. 生成完整的 FEATURE_TEMPLATE.md

**输出**：
```markdown
# Feature Specification: 语音问诊与诊疗建议

**优先级**：P1
**估计工时**：10 days

## 用户故事 1：患者用语音描述症状 (Priority: P1)

场景：患者启动应用后，说出"我最近头疼、没有食欲"

验收标准：
Given 用户已完成人脸识别登录
When 用户点击"开始说话"按钮
Then 显示录音动画
And 系统识别语音并显示转录文本
And 用户可确认或重新说话

...（更多内容）
```

**实现方式**：
```bash
# 在 Claude Code 中使用
/speckit.specify 患者可以用语音描述症状，系统给出诊疗建议
```

**关键功能**：
- 自动编号特性 (FEAT-001, FEAT-002, ...)
- 生成分支名 (feat/voice-diagnosis-system)
- 创建 specs/ 目录结构
- 识别跨功能依赖

---

### 2️⃣ Architect Agent（架构设计助手）

**职责**：从规范转化为技术设计方案

**输入**：规范文档 + 系统约束

**处理流程**：
1. 分析规范中的技术需求
2. 设计数据模型与 API 契约
3. 选择合适的技术方案
4. 生成架构图与决策记录

**输出示例**：

```markdown
# Technical Implementation Plan

## 数据模型

```typescript
interface ConversationMessage {
  id: string
  userId: string
  role: 'user' | 'assistant'
  content: string
  audioUrl?: string
  timestamp: number
}
```

## API 设计

```
POST /api/conversations/start
  Input: { userId, reason }
  Output: { conversationId, digitalDoctor }

POST /api/conversations/{id}/send-message
  Input: { text, audioUrl }
  Output: { assistant_reply, confidence }
```

## 架构图

```
┌─────────────┐     ┌──────────────┐
│ React 前端  │────→│  WebSocket   │────→ ┌──────────────┐
└─────────────┘     └──────────────┘      │  ASR 服务    │
                                          │  + 大模型    │
                                          │  + TTS      │
                                          └──────────────┘
```

## 技术决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 语音识别 | 3rd party ASR API | 准确率高，支持多语言 |
| 大模型 | 内部部署的大模型 | 数据隐私，低延迟 |
| 网络协议 | WebSocket | 实时性要求 |
```

**实现方式**：
```bash
/speckit.plan 设计语音问诊系统的技术架构
# 输入：之前生成的规范文档
# 输出：plan.md + data-model.md + contracts/
```

---

### 3️⃣ Code Generator Agent（代码生成助手）

**职责**：根据规范和架构自动生成代码框架

**输入**：规范 + 架构 + 技术栈

**处理流程**：
1. 生成 React 组件骨架
2. 生成 Service 层封装
3. 生成 API 集成代码
4. 生成单元测试框架

**输出示例**：

```typescript
// 自动生成的文件结构
src/
├── components/
│   └── VoiceInput.tsx       // UI 组件
├── services/
│   ├── ConversationService.ts
│   └── ASRService.ts
├── hooks/
│   └── useConversation.ts
└── __tests__/
    └── VoiceInput.test.tsx
```

**代码示例**：
```typescript
// 自动生成的 ConversationService.ts
export class ConversationService {
  async startConversation(userId: string): Promise<string> {
    const res = await axios.post('/api/conversations/start', { userId })
    return res.data.conversationId
  }

  async sendMessage(
    conversationId: string,
    message: string
  ): Promise<AssistantResponse> {
    const res = await axios.post(
      `/api/conversations/${conversationId}/send-message`,
      { text: message }
    )
    return res.data
  }
}
```

**实现方式**：
```bash
/speckit.implement 为语音问诊功能生成代码框架
# 会生成：
# - src/components/VoiceInput.tsx
# - src/services/ConversationService.ts
# - src/hooks/useConversation.ts
# - 完整的单元测试框架
```

---

### 4️⃣ Test Designer Agent（测试设计助手）

**职责**：根据规范设计全面的测试用例

**输入**：规范文档 + 验收标准

**处理流程**：
1. 从规范中提取测试场景
2. 生成单元测试用例
3. 生成集成测试用例
4. 生成端到端测试用例
5. 生成性能测试用例

**输出示例**：

```typescript
// 自动生成的测试用例

describe('VoiceInput', () => {
  describe('用户故事 1：患者用语音描述症状', () => {
    test(
      'Given 用户已登录 When 点击开始说话 Then 显示录音动画',
      async () => {
        // 自动生成的测试代码
        const { getByRole } = render(<VoiceInput />)
        const button = getByRole('button', { name: /开始说话/i })

        fireEvent.click(button)

        expect(screen.getByTestId('recording-animation')).toBeInTheDocument()
      }
    )

    test('异常场景：麦克风权限被拒', async () => {
      // 自动生成的异常处理测试
    })

    test('边界场景：超长音频（>60秒）', async () => {
      // 自动生成的边界测试
    })
  })

  describe('性能测试', () => {
    test('语音识别延迟 < 1s', async () => {
      // 自动生成的性能测试
    })
  })
})
```

**实现方式**：
```bash
/speckit.test 为语音问诊功能生成完整测试套件
# 会生成：
# - src/__tests__/VoiceInput.test.tsx
# - src/__tests__/ConversationService.test.ts
# - e2e/voice-consultation.spec.ts
# - performance/voice-input.perf.ts
```

---

### 5️⃣ Code Reviewer Agent（代码审查助手）

**职责**：审查代码，确保符合项目规范和最佳实践

**输入**：PR + 规范 + 项目宪法

**处理流程**：
1. 检查代码是否符合规范
2. 检查是否满足验收标准
3. 执行代码质量检查（复杂度、覆盖率）
4. 检查安全性与性能
5. 检查医学合规性

**输出示例**：

```markdown
# Code Review: feat/voice-input

## ✅ 符合规范检查

- [x] 代码实现覆盖规范中的所有用户故事
- [x] 所有验收标准都有测试用例
- [x] API 设计符合 contracts/api.md
- [x] 数据模型符合 data-model.md

## ⚠️ 改进建议

### 1. 性能优化
```
文件：src/services/ASRService.ts
第 45 行：可以使用 debounce 避免频繁的 API 调用

当前：
```typescript
textInput.addEventListener('input', (e) => {
  this.transcribe(e.target.value)
})
```

建议：
```typescript
textInput.addEventListener('input', debounce((e) => {
  this.transcribe(e.target.value)
}, 300))
```
```

### 2. 安全性检查
```
文件：src/services/ConversationService.ts
第 12 行：敏感数据应加密存储

当前：localStorage.setItem('conversationId', id)
建议：localStorage.setItem('conversationId', encrypt(id))
```

### 3. 医学合规
```
文件：src/components/VoiceInput.tsx
缺少"隐私声明"和"数据处理说明"

建议添加：
- "您的语音数据将被加密传输"
- "可在设置中查看和删除录音记录"
```

## 📊 代码质量指标

| 指标 | 当前 | 目标 | 状态 |
|------|------|------|------|
| 测试覆盖率 | 78% | >80% | ⚠️ |
| 圈复杂度 | 12 | <10 | ⚠️ |
| 依赖安全 | ✓ | ✓ | ✅ |
| TypeScript strict | ✓ | ✓ | ✅ |

## ✅ 建议批准

需要解决上述 2 个问题后重新提交。
```

**实现方式**：
```bash
/speckit.review 审查 feat/voice-input 分支的代码
# 输入：规范 + 宪法 + 代码变更
# 输出：审查报告 + 改进建议 + 自动修复代码
```

---

### 6️⃣ DevOps Agent（部署管理助手）

**职责**：自动化打包、部署和发布流程

**职能**：
1. **打包**：生成 Windows MSI、macOS DMG
2. **部署**：发布到测试服务器、生产环境
3. **回滚**：快速回滚到上一个版本
4. **监控**：收集性能指标、错误日志

**输入**：代码版本 + 部署配置 + 发布清单

**输出示例**：

```bash
# 自动生成的部署脚本
#!/bin/bash

# 1. 构建
npm run build
npm run build:electron:windows
npm run build:electron:macos

# 2. 签名（Windows）
signtool sign /f cert.pfx /p password dist/digitDoc-1.0.0.msi

# 3. 上传到发布服务器
aws s3 cp dist/digitDoc-1.0.0.msi s3://releases/

# 4. 生成发布说明
gh release create v1.0.0 \
  --title "Release v1.0.0" \
  --body-file RELEASE_NOTES.md \
  dist/digitDoc-1.0.0.msi

# 5. 更新自动更新服务
curl -X POST https://update.example.com/api/releases \
  -H "Authorization: Bearer $UPDATE_TOKEN" \
  -d @update-metadata.json
```

**实现方式**：
```bash
/speckit.deploy 部署 v1.0.0 到生产环境
# 自动：
# - 构建应用
# - 签名代码
# - 上传到 CDN
# - 更新自动更新服务
# - 通知团队
```

---

### 7️⃣ Doc Generator Agent（文档生成助手）

**职责**：从代码和规范自动生成文档

**输入**：代码 + 类型定义 + 规范

**处理流程**：
1. 提取 TypeScript 类型定义
2. 生成 OpenAPI/Swagger 文档
3. 生成 API 使用示例
4. 生成用户手册
5. 生成架构决策记录（ADR）

**输出示例**：

```markdown
# API 文档 - 自动生成

## POST /api/conversations/start

**功能**：启动一个新的问诊会话

**请求**：
```typescript
interface StartConversationRequest {
  userId: string          // 患者 ID
  reason?: string         // 问诊原因（可选）
  doctorId?: string       // 指定医生（可选）
}
```

**响应**：
```typescript
interface StartConversationResponse {
  code: 200              // 状态码
  conversationId: string // 会话 ID
  digitalDoctor: {
    name: string
    avatar: string
    greeting: string
  }
}
```

**示例**：
```bash
curl -X POST https://api.example.com/api/conversations/start \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "reason": "头疼和食欲不振"
  }'

# 响应
{
  "code": 200,
  "conversationId": "conv-20251030-001",
  "digitalDoctor": {
    "name": "李医生",
    "greeting": "您好，我是数字医生李医生，请告诉我您的症状..."
  }
}
```

**错误情况**：
```
400: 缺少必要字段 userId
401: 认证失败
429: 请求过于频繁
503: 服务暂时不可用
```

---

## 使用示例

请参考 API 文档的其他端点...
```

**实现方式**：
```bash
/speckit.document 为 ConversationService 生成 API 文档
# 自动：
# - 扫描 TypeScript 类型
# - 生成 OpenAPI spec
# - 生成 Markdown 文档
# - 生成 Postman collection
```

---

### 8️⃣ Performance Analyzer Agent（性能分析助手）

**职责**：分析代码性能，提供优化建议

**输入**：代码 + 性能指标 + 目标

**处理流程**：
1. 分析时间复杂度和空间复杂度
2. 识别性能瓶颈
3. 运行性能测试
4. 与目标对比
5. 生成优化建议

**输出示例**：

```markdown
# 性能分析报告

## 📊 整体指标

| 指标 | 当前 | 目标 | 状态 |
|------|------|------|------|
| 首屏加载 | 2.5s | <2s | ⚠️ |
| 语音识别延迟 | 1.2s | <1s | ⚠️ |
| 内存占用 | 180MB | <200MB | ✅ |
| CPU 占用（待机） | 8% | <5% | ⚠️ |

## 🔍 瓶颈分析

### 瓶颈 1：首屏加载时间（2.5s → 2s）

**问题**：
```
Time Spent
├─ JavaScript 解析: 800ms (32%)  ⚠️ 最大瓶颈
├─ 资源下载: 600ms (24%)
├─ React 渲染: 500ms (20%)
├─ 初始化 WebSocket: 400ms (16%)
└─ 其他: 200ms (8%)
```

**根本原因**：
- 没有使用代码分割，全量加载所有组件
- 三方库没有优化（moment.js 太大）
- DevTools 在生产环境仍然加载

**优化方案**：
```typescript
// 1. 代码分割
const VoiceInput = lazy(() => import('./components/VoiceInput'))
const ConversationPanel = lazy(() => import('./components/ConversationPanel'))

// 2. 替换 moment.js
- moment.js (67KB)
+ date-fns (13KB)

// 3. 禁用 DevTools
if (process.env.NODE_ENV === 'production') {
  delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__
}
```

**预期效果**：800ms → 500ms（20% 改进）

---

### 瓶颈 2：语音识别延迟（1.2s → <1s）

**问题**：
```
流程耗时分析
├─ 录音上传: 400ms
├─ 网络延迟: 300ms  ⚠️
├─ ASR 处理: 300ms
└─ 响应接收: 200ms
总计: 1200ms
```

**根本原因**：
- 网络延迟无法控制，但可以优化上传
- 音频文件没有压缩
- 没有使用流式识别

**优化方案**：
```typescript
// 使用流式识别 + 音频压缩
async function recognizeAudioStream(stream: MediaStream) {
  // 1. 使用 WebCodecs 压缩音频
  const encoder = new AudioEncoder({
    output: (chunk) => {
      // 2. 立即上传，不等待录音结束
      socket.emit('audio-chunk', chunk)
    }
  })

  // 3. 后端流式处理，前端流式显示
  socket.on('transcription-partial', (text) => {
    setLiveTranscription(text)
  })
}
```

**预期效果**：1200ms → 700ms（42% 改进）

---

### 瓶颈 3：CPU 占用（8% → <5%）

**问题**：
- WebRTC 视频流处理未使用硬件加速
- JavaScript 事件处理没有防抖
- React 重新渲染过于频繁

**优化方案**：
```typescript
// 启用 GPU 硬解码
window.electron.appendSwitch('ignore-gpu-blacklist')

// 防抖事件处理
const debouncedSearch = useMemo(
  () => debounce((text) => {
    socket.emit('search-symptoms', text)
  }, 300),
  []
)

// 使用 React.memo 避免不必要渲染
const ConversationMessage = React.memo(({ message }) => {
  return <div>{message.text}</div>
})
```

## 📈 优化后预期

```
原始性能                优化后性能
─────────────────────────────────
首屏: 2.5s    ───→    首屏: 1.8s  ✅
ASR延迟: 1.2s ───→    ASR延迟: 0.7s ✅
CPU: 8%      ───→    CPU: 4%     ✅
内存: 180MB  ───→    内存: 150MB ✅
```

## 🎯 下一步行动

优先实施：
1. [ ] 代码分割和懒加载（预期 20% 改进）
2. [ ] moment.js → date-fns 替换（预期 5% 改进）
3. [ ] 流式识别实现（预期 35% 改进）
4. [ ] GPU 硬解码启用（预期 3% 改进）
```

**实现方式**：
```bash
/speckit.profile 分析当前应用的性能瓶颈
# 自动：
# - 运行 Lighthouse 审计
# - 分析 JavaScript 包大小
# - 测试 WebRTC 性能
# - 识别瓶颈 + 优化建议
# - 生成性能报告
```

---

## 🔄 SubAgent 工作流程

### 完整的开发周期（以一个新特性为例）

```
Day 1: 需求分析
  用户描述想法
  └─ Spec Writer Agent
     ├─ 分解为用户故事
     ├─ 定义验收标准
     └─ 生成 FEATURE_TEMPLATE.md

Day 2-3: 架构设计
  审视规范，设计技术方案
  └─ Architect Agent
     ├─ 设计数据模型
     ├─ 定义 API 契约
     ├─ 生成架构图
     └─ 输出 plan.md

Day 4-6: 代码实现
  开发者编写代码
  └─ Code Generator Agent（辅助）
     ├─ 生成组件骨架
     ├─ 生成 Service 层
     ├─ 生成测试框架
     └─ 开发者完成实现

Day 7: 测试
  确保代码质量
  └─ Test Designer Agent
     ├─ 补充测试用例
     └─ Test Reviewer Agent
        ├─ 验证测试覆盖率
        └─ 确保测试有效性

Day 8: 审查与优化
  确保符合规范
  └─ Code Reviewer Agent
     ├─ 检查规范符合性
     ├─ 检查医学合规
     └─ Performance Analyzer Agent
        ├─ 识别瓶颈
        └─ 优化建议

Day 9: 文档与发布准备
  生成文档，准备发布
  └─ Doc Generator Agent
     ├─ 生成 API 文档
     ├─ 生成用户手册
     └─ DevOps Agent
        ├─ 生成部署脚本
        └─ 准备发布

Day 10: 发布
  正式上线
  └─ DevOps Agent
     ├─ 打包应用
     ├─ 部署到测试环境
     └─ 部署到生产环境
```

---

## 🚀 Agent 调用示例

### 场景 1：添加新功能（体测数据展示）

```bash
# Step 1: 生成规范
/speckit.specify 患者可以查看个人的体测数据（血压、血糖、体温等）\
  以时间序列的图表展示，支持日周月视图，可以比较历史数据的变化趋势

# Step 2: 生成架构设计
/speckit.plan 设计体测数据展示的技术方案，包括数据获取、存储、展示

# Step 3: 生成代码框架
/speckit.implement 根据规范和架构为体测数据模块生成代码

# Step 4: 设计测试
/speckit.test 为体测数据展示模块生成全面的测试用例

# Step 5: 代码审查
/speckit.review 审查体测数据展示的实现代码

# Step 6: 性能优化
/speckit.profile 分析体测数据展示的性能，找出瓶颈

# Step 7: 生成文档
/speckit.document 为体测数据 API 生成完整文档

# Step 8: 准备发布
/speckit.deploy 部署体测数据展示功能到生产环境
```

### 场景 2：Bug 修复流程

```bash
# 用户反馈：语音识别经常失败

# Step 1: 分析问题
/speckit.review 分析为什么语音识别失败率高，提供根本原因

# Step 2: 制定修复方案
/speckit.plan 设计语音识别容错机制的改进方案

# Step 3: 实现修复
/speckit.implement 根据方案修改语音识别的实现

# Step 4: 测试修复
/speckit.test 为修复添加测试用例，覆盖之前失败的场景

# Step 5: 性能验证
/speckit.profile 确认修复后语音识别的性能指标

# Step 6: 发布补丁
/speckit.deploy 部署 hotfix 到生产环境
```

---

## 📋 SubAgent 能力清单

### Spec Writer
- ✅ 功能描述 → 规范文档
- ✅ 自动编号特性
- ✅ 生成分支名
- ✅ 创建目录结构
- ✅ 识别依赖关系

### Architect
- ✅ 规范 → 技术方案
- ✅ 数据模型设计
- ✅ API 契约定义
- ✅ 架构图生成
- ✅ 技术决策记录

### Code Generator
- ✅ 组件骨架生成
- ✅ Service 层生成
- ✅ Hook 生成
- ✅ 测试框架生成
- ✅ 类型定义生成

### Test Designer
- ✅ 单元测试生成
- ✅ 集成测试生成
- ✅ E2E 测试生成
- ✅ 性能测试生成
- ✅ 覆盖率分析

### Code Reviewer
- ✅ 规范符合性检查
- ✅ 代码质量检查
- ✅ 安全性检查
- ✅ 医学合规检查
- ✅ 改进建议生成

### DevOps
- ✅ 打包脚本生成
- ✅ 部署自动化
- ✅ 版本管理
- ✅ 回滚脚本
- ✅ 监控配置

### Doc Generator
- ✅ API 文档生成
- ✅ OpenAPI spec 生成
- ✅ 用户手册生成
- ✅ ADR 生成
- ✅ 代码注释优化

### Performance Analyzer
- ✅ 性能测试运行
- ✅ 瓶颈识别
- ✅ 优化建议生成
- ✅ 效果预测
- ✅ 基准对比

---

## 🛠️ 实现建议

### 如何在项目中使用 SubAgent

1. **创建 .claude/commands/ 目录下的命令文件**

```markdown
<!-- .claude/commands/speckit-specify.md -->

# /speckit.specify - 生成功能规范

## 用法
/speckit.specify [功能描述]

## 示例
/speckit.specify 患者可以查看体测数据时间序列

## 工作流程
1. 分解功能为用户故事
2. 定义验收标准（Gherkin）
3. 识别技术依赖
4. 生成 FEATURE_TEMPLATE.md
```

2. **在项目宪法中明确 Agent 的职责边界**

3. **建立 Agent 的评价标准**
   - 生成的规范是否清晰完整？
   - 生成的代码是否可以直接使用？
   - 生成的测试覆盖率是否达到目标？

4. **定期与 Agent 交互，收集反馈**
   - 哪些 Agent 最有用？
   - 需要什么改进？
   - 是否需要新的 Agent？

---

## 📈 预期收益

| 环节 | 手工耗时 | 使用 Agent | 节省时间 | 效率提升 |
|------|---------|-----------|---------|---------|
| 规范编写 | 2h | 0.5h | 1.5h | **75%** |
| 架构设计 | 3h | 1h | 2h | **67%** |
| 代码生成 | 4h | 1.5h | 2.5h | **63%** |
| 测试设计 | 3h | 1h | 2h | **67%** |
| 代码审查 | 1.5h | 0.5h | 1h | **67%** |
| 文档生成 | 2h | 0.5h | 1.5h | **75%** |
| 部署发布 | 1.5h | 0.5h | 1h | **67%** |

**每周节省**：约 12 小时（相当于 1.5 个开发人日）

---

## ✅ 总结

这 8 个 SubAgent 可以：

1. **加速开发**：减少重复工作，加快迭代速度
2. **提高质量**：确保规范、代码、测试、文档的一致性
3. **降低风险**：自动化检查、医学合规、安全审查
4. **提升体验**：开发者可专注于核心逻辑，重复工作由 Agent 处理

建议**优先实施** Spec Writer 和 Architect，因为它们驱动整个开发流程。

