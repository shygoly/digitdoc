# 问题诊断：localhost:5173 无内容显示

## 问题分析

通过 DevTools MCP 分析，发现了以下问题：

### 1. **Vite 配置问题** ✅ 已修复

**问题**：`vite.config.ts` 缺少 `root` 配置，导致 Vite 在项目根目录查找 `index.html`，但实际文件在 `renderer/` 目录。

**错误表现**：
- 浏览器访问 `https://localhost:5173/` 返回 404
- 控制台显示：`Failed to load resource: the server responded with a status of 404`

**修复方案**：
```typescript
export default defineConfig({
  root: './renderer',        // 添加此项，指定项目根目录
  publicDir: '../public',    // 指定 public 目录位置
  // ...
})
```

### 2. **服务器状态**

**检查方法**：
```bash
# 检查端口占用
lsof -i :5173

# 检查 Vite 进程
ps aux | grep vite
```

**如果服务器未运行**：
```bash
# 重新启动
pnpm dev
```

## 修复步骤

1. ✅ 更新 `vite.config.ts` 添加 `root` 配置
2. ⚠️ 需要重启 Vite 开发服务器以应用配置更改

## 验证方法

1. **检查 Vite 配置**：
   ```bash
   cat vite.config.ts | grep root
   ```
   应该看到：`root: './renderer',`

2. **重启开发服务器**：
   ```bash
   # 停止当前进程
   pkill -f vite
   
   # 重新启动
   pnpm dev
   ```

3. **访问页面**：
   - 浏览器访问：`https://localhost:5173`
   - 应该能看到接口测试页面内容

4. **检查控制台**：
   - 打开浏览器 DevTools (F12)
   - 查看 Console 和 Network 标签
   - 不应该有 404 错误

## 常见问题

### Q: 页面仍然显示空白
**A**: 检查：
- React 应用是否正确编译（查看 Network 标签中的 `main.tsx` 请求）
- 浏览器控制台是否有 JavaScript 错误
- `renderer/src/main.tsx` 是否正确引用 `App.tsx`

### Q: 证书警告
**A**: 这是正常的（自签名证书），点击"高级" → "继续访问"即可

### Q: wsplayer 脚本加载失败
**A**: 确保已执行：
```bash
./scripts/setup_wsplayer.sh
```
或手动复制文件到 `public/` 目录

## 下一步

配置修复后，重启开发服务器：
```bash
pnpm dev
```

然后在浏览器访问 `https://localhost:5173` 应该能看到完整的接口测试页面。
