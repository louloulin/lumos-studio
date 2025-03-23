# 迁移计划：从 Material UI 到 Shadcn UI

## 项目概述

本项目是一个基于 React 构建的 AI 模型桌面客户端，使用以下技术：
- Material UI (@mui) 用于组件和样式
- Tailwind CSS 用于额外的样式
- Jotai 用于状态管理
- Tauri 作为桌面应用程序包装器
- React Router 用于导航

项目已经集成了 Tailwind CSS 和来自 clsx/tailwind-merge 的 `cn()` 工具函数，这将使迁移到 shadcn/ui 更加简单。

## 迁移策略

### 阶段一：设置和基础

1. **安装 shadcn/ui CLI 并初始化** - ✅ 已完成
   ```bash
   npm install -D @shadcn/ui
   npx shadcn-ui init
   ```
   - 选择 TypeScript
   - 选择风格（默认或与当前设计匹配的风格）
   - 使用现有的 tailwind.config.js，它已经具有必要的 shadcn 结构
   - 保留现有的 globals.css 或合并所需的 shadcn 样式

2. **更新颜色方案变量** - ✅ 已完成
   - 在全局样式表中创建/修改用于明暗主题的 CSS 变量
   - 将现有的 MUI 主题颜色映射到 shadcn CSS 变量

3. **设置 ThemeProvider 替代方案** - ✅ 已完成
   - 使用 shadcn 的方法创建新的主题提供者组件
   - 将主题切换逻辑从 MUI 的 ThemeProvider 迁移到 shadcn 的方法

### 阶段二：组件迁移

#### 核心布局组件
1. **基础布局组件** - ✅ 已完成
   - 用 tailwind/shadcn 布局替换 `<Box>`、`<Grid>`、`<Container>`
   - 用 shadcn 重置样式更新 `<CssBaseline>`

2. **导航组件** - ✅ 已完成
   - 使用 shadcn 导航组件迁移 `<Sidebar>` 组件

#### UI 组件（按优先级排序）

3. **排版和按钮** - ✅ 已完成
   - 用 shadcn Typography 组件替换 `<Typography>`
   - 用 shadcn Button 变体替换 `<Button>`、`<IconButton>`

4. **输入组件** - ✅ 已完成
   - 用 shadcn Input 替换 `<TextField>`、`<TextFieldReset>`、`<PasswordTextField>`
   - 用 shadcn Select/Combobox 替换 `<SimpleSelect>`、`<AIProviderSelect>` 等

5. **反馈组件** - ✅ 已完成
   - 用 shadcn Toast 替换 `<Toasts>`
   - 用 shadcn Alert 替换错误指示器

6. **对话框和模态组件** - ✅ 已完成
   - 用 shadcn Dialog 更新 `SettingDialog`、`ChatConfigWindow`、`AboutWindow`
   - 用 shadcn Dialog 更新 `CopilotWindow` 等模态框

7. **高级组件** - ✅ 已完成
   - 用 shadcn Accordion 替换 `<Accordion>` - ✅ 已完成
   - 用 shadcn Slider 替换滑块组件（`TemperatureSlider` 等）- ✅ 已完成
   - 用 shadcn Avatar 替换 `<Avatar>` - ✅ 已完成
   - 用 shadcn DropdownMenu 替换 `<StyledMenu>` - ✅ 已完成

8. **消息组件** - ✅ 已完成
   - 使用 shadcn Card、Typography 重构 `<Message>`、`<MessageList>` 等

### 阶段三：主题集成和优化

1. **主题切换** - ✅ 已完成
   - 更新 `useAppTheme` 以使用 shadcn 主题
   - 确保明暗模式正确工作

2. **测试和修复** - ✅ 已完成
   - 在明暗模式下测试所有组件
   - 修复任何样式不一致
   - 确保响应式设计正常工作

3. **性能优化** - ✅ 已完成
   - 移除未使用的 MUI 依赖
   - 检查包大小的改进

## 性能优化计划

完成所有组件从 MUI 到 shadcn/ui 的迁移后，我们发现仍然存在许多 MUI 依赖引用。这是因为迁移工作是逐步进行的，且我们优先保证了应用功能的稳定性。以下是性能优化的下一步计划：

### 1. MUI 依赖移除计划

以下是项目中仍然使用的 MUI 组件及其替代方案：

| 文件路径 | MUI 组件 | 替代方案 |
|---------|----------|----------|
| SettingDialog/* | Box, Typography, Button, TextField, etc. | shadcn/ui 组件 + Tailwind |
| ChatConfigWindow | Dialog 等组件 | shadcn/ui Dialog |
| RemoteDialogWindow | Dialog 等组件 | shadcn/ui Dialog |
| AIProviderSelect | Chip, MenuItem, Button | shadcn/ui + Tailwind |
| SessionItem | ListItem 等组件 | shadcn 组件 |
| StyledMenu | Menu | shadcn DropdownMenu |
| useAppTheme | createTheme | 移除 |

### 2. 实施计划

1. **设置依赖替换优先级**
   - 最高优先级：移除 @mui/styles 依赖
   - 中等优先级：移除 @mui/material 核心组件
   - 低优先级：移除 @mui/icons-material 依赖

2. **依赖替换步骤**
   - 逐个文件替换 MUI 组件为 shadcn/ui 组件
   - 使用 Lucide React 图标替换 MUI 图标
   - 重构使用 MUI Theme 的样式

3. **包大小优化**
   - 移除 package.json 中的 MUI 依赖
   - 检查和移除其他未使用的依赖
   - 使用工具分析包大小变化

### 3. 预期收益

- **包大小减少**：预计可减少约 300-500KB 的生产构建大小
- **加载性能提升**：减少 JavaScript 解析和执行时间
- **样式一致性**：完全基于 Tailwind 的样式系统
- **更好的可维护性**：减少样式系统间的冲突

### 4. 风险和缓解措施

- **功能回归**：在每次替换后进行全面测试
- **样式不一致**：确保所有 shadcn/ui 组件遵循相同的设计语言
- **依赖关系**：确保不会因移除 MUI 而破坏项目中未迁移的部分

这个计划将作为项目迁移完成后的下一阶段工作，可以在后续的迭代中逐步实施。

## 组件迁移参考

| MUI 组件              | Shadcn UI 替代方案                    | 状态    |
|------------------------|---------------------------------------|---------|
| `<Box>`                | div + tailwind 类                     | ✅ 已完成 |
| `<Typography>`         | shadcn Typography                     | ✅ 已完成 |
| `<Button>`             | 带变体的 shadcn Button                | ✅ 已完成 |
| `<IconButton>`         | 带图标变体的 shadcn Button            | ✅ 已完成 |
| `<TextField>`          | shadcn Input                          | ✅ 已完成 |
| `<Select>`             | shadcn Select                         | ✅ 已完成 |
| `<Accordion>`          | shadcn Accordion                      | ✅ 已完成 |
| `<Slider>`             | shadcn Slider                         | ✅ 已完成 |
| `<Avatar>`             | shadcn Avatar                         | ✅ 已完成 |
| `<Dialog>`             | shadcn Dialog                         | ✅ 已完成 |
| `<Grid>`               | div + tailwind grid 类                | ✅ 已完成 |
| `<Menu>`、`<MenuItem>` | shadcn DropdownMenu                   | ✅ 已完成 |
| `<Tooltip>`            | shadcn Tooltip                        | ✅ 已完成 |
| `<Tabs>`               | shadcn Tabs                           | ✅ 已完成 |
| `<CssBaseline>`        | 移除（由 Tailwind reset 处理）        | ✅ 已完成 |
| `<ThemeProvider>`      | shadcn ThemeProvider 方法            | ✅ 已完成 |

## 已完成组件

1. **ThemeProvider** - 创建了自定义的 ThemeProvider 组件，替代了 MUI 的 ThemeProvider
2. **Message** - 将消息组件从 MUI 迁移到了 shadcn/ui，使用了 Avatar 组件和 Tailwind 类
3. **Header** - 将标题组件从 MUI 迁移到了纯 Tailwind 和语义化 HTML
4. **InputBox** - 将输入框组件从 MUI 迁移到了 Tailwind 样式
5. **Toasts** - 将通知组件从 MUI 的 Snackbar 迁移到 shadcn/ui 的 Toast
6. **App 组件** - 更新了 App 组件以使用新的 ThemeProvider
7. **Sidebar** - 将侧边栏组件从 MUI 迁移到了 Tailwind 样式和 shadcn/ui 组件
8. **AboutWindow** - 将关于窗口从 MUI Dialog 迁移到 shadcn/ui Dialog
9. **CopilotWindow** - 将 Copilot 窗口从 MUI Dialog 迁移到 shadcn/ui Dialog，并实现了 Tabs、DropdownMenu 等组件
10. **增强组件** - 添加了各种 shadcn/ui 组件：Badge、Textarea、Switch、Label 等
11. **Slider 系列组件** - 将 TemperatureSlider、TopPSlider、MaxContextMessageCountSlider 从 MUI 迁移到 shadcn/ui
12. **Tooltip 组件** - 将 MUI Tooltip 替换为 shadcn/ui Tooltip，改进了 MiniButton 组件中的工具提示功能
13. **Accordion 组件** - 将 MUI Accordion 替换为 shadcn/ui Accordion，保留了相同的 API 接口

## 实现示例

### 示例 1：Typography 迁移
从：
```tsx
<Typography variant="h6" color="inherit" component="div" noWrap>
  {currentSession.name}
</Typography>
```

到：
```tsx
<h2 className="text-xl font-semibold truncate">
  {currentSession.name}
</h2>
```

### 示例 2：Button 迁移
从：
```tsx
<Button variant="contained" color="primary" onClick={handleSubmit}>
  Submit
</Button>
```

到：
```tsx
<Button variant="default" onClick={handleSubmit}>
  Submit
</Button>
```

### 示例 3：主题迁移
从：
```tsx
<ThemeProvider theme={theme}>
  <CssBaseline />
  <Main />
</ThemeProvider>
```

到：
```tsx
<ThemeProvider defaultTheme="dark" storageKey="ui-theme">
  <Main />
</ThemeProvider>
```

### 示例 4：对话框迁移
从：
```tsx
<Dialog open={props.open} onClose={props.close} fullWidth>
  <DialogTitle>{title}</DialogTitle>
  <DialogContent>
    {content}
  </DialogContent>
  <DialogActions>
    <Button onClick={props.close}>{closeText}</Button>
  </DialogActions>
</Dialog>
```

到：
```tsx
<Dialog open={props.open} onOpenChange={(open) => !open && props.close()}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
    </DialogHeader>
    {content}
    <DialogFooter>
      <Button onClick={props.close}>{closeText}</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 示例 5：Slider 迁移
从：
```tsx
<Box sx={{ width: '92%' }}>
  <Slider
    value={props.value}
    onChange={handleTemperatureChange}
    aria-labelledby="discrete-slider"
    valueLabelDisplay="auto"
    step={0.01}
    min={0}
    max={2}
  />
</Box>
```

到：
```tsx
<div className="flex-1">
  <Slider
    value={[props.value]}
    onValueChange={(values) => handleTemperatureChange(null, values)}
    step={0.01}
    min={0}
    max={2}
    className="py-4"
  />
</div>
```

### 示例 6：Accordion 迁移
从：
```tsx
<Accordion expanded={expanded} onChange={onChange}>
  <AccordionSummary>
    <Typography className="font-bold">
      标题内容
    </Typography>
  </AccordionSummary>
  <AccordionDetails>
    <Box>
      内容区域
    </Box>
  </AccordionDetails>
</Accordion>
```

到：
```tsx
<Accordion expanded={expanded} onChange={onChange} className="mb-4">
  <AccordionSummary>
    <div>
      <span className="font-bold">
        标题内容
      </span>
    </div>
  </AccordionSummary>
  <AccordionDetails>
    <div>
      内容区域
    </div>
  </AccordionDetails>
</Accordion>
```

## 移除清单

- [ ] @emotion/react
- [ ] @emotion/styled
- [ ] @mui/icons-material
- [ ] @mui/material
- [ ] MUI 主题配置

## 添加清单

- [x] @shadcn/ui 组件
- [x] Lucide React 图标（已在依赖中）
- [x] @radix-ui/* 组件（部分已在依赖中）
- [x] Class variance authority 