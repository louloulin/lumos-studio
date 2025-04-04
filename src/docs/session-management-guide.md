# Lumos Studio 会话管理系统用户指南

## 概述

Lumos Studio 的会话管理系统已经完成全面优化，本指南介绍新的会话管理系统的使用方法、主要功能和最佳实践。

## 核心功能

### 1. 统一会话管理

所有会话管理功能现在都集中在 `SessionService` 中，不再使用 `chatService` 进行会话管理。

```typescript
import SessionService from '../services/session';

// 创建新会话
const session = await SessionService.createSession();

// 获取会话列表
const sessions = SessionService.getSessions();

// 获取特定会话
const session = SessionService.getSession(sessionId);
```

### 2. 增强会话安全

会话现在具有过期机制和ID轮换功能，提高了安全性。

```typescript
// 检查会话是否过期
const isExpired = SessionService.isSessionExpired(session);

// 轮换会话ID（在敏感操作后调用）
const updatedSession = SessionService.rotateSessionId(sessionId);
```

### 3. 会话同步机制

多标签页之间的会话状态同步已实现，确保用户体验一致。

```typescript
// 初始化会话同步（在应用启动时调用一次）
SessionService.initSessionService();

// 订阅会话同步事件
import SessionSync from '../services/sessionSync';

const unsubscribe = SessionSync.subscribeToSessionSync((detail) => {
  // 处理同步事件
  console.log('会话数据已同步:', detail);
});

// 取消订阅
unsubscribe();
```

### 4. 会话分析功能

现在可以跟踪会话使用情况和性能指标。

```typescript
import SessionAnalytics from '../services/sessionAnalytics';

// 获取会话统计数据
const stats = SessionAnalytics.getSessionStats();

// 获取响应时间指标
const metrics = SessionAnalytics.getResponseTimeMetrics();
```

## 最佳实践

### 会话创建和管理

1. 在开始新对话时，使用 `createSession` 方法创建会话
2. 使用 `addUserMessage` 添加用户消息，它会自动处理重复消息
3. 对于敏感操作（如权限更改），使用 `rotateSessionId` 增强安全性

```typescript
// 示例：创建会话并添加消息
const session = await SessionService.createSession();
await SessionService.addUserMessage(session.id, '你好，助手！');
```

### 错误处理

所有会话操作都已增强错误处理，但仍建议在关键操作中添加 try-catch 块：

```typescript
try {
  const session = await SessionService.createSession();
  // 使用会话...
} catch (error) {
  console.error('会话创建失败:', error);
  // 显示错误提示给用户
}
```

### 会话同步

确保在应用启动时初始化会话同步机制：

```typescript
// 在应用入口点
useEffect(() => {
  SessionService.initSessionService();
}, []);
```

## 会话生命周期

1. **创建**: 通过 `createSession` 创建新会话
2. **使用**: 通过 `addUserMessage` 和 `generateAssistantResponse` 进行对话
3. **轮换**: 在敏感操作后使用 `rotateSessionId` 更新会话ID
4. **过期**: 系统自动检测并处理过期会话（7天不活动或30天总寿命）
5. **删除**: 通过 `deleteSession` 手动删除会话

## 迁移指南

如果你的代码仍在使用旧的 `chatService` 进行会话管理，请按以下步骤迁移：

1. 导入 `SessionService` 替代 `chatService`
2. 使用 `createSession` 替代 `createNewSession`
3. 使用 `addUserMessage` 和 `generateAssistantResponse` 替代相应的旧方法

## 故障排除

常见问题及解决方案：

1. **会话不存在**: 检查会话ID是否正确，或会话是否已过期
2. **会话同步问题**: 确保已调用 `initSessionService`
3. **数据丢失**: 使用 `SessionSync.restoreSessions()` 尝试从备份恢复

## 联系支持

如有关于会话管理系统的问题或建议，请联系开发团队。 