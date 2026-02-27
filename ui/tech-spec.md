# FARS 技术规划文档

## 1. 组件清单

### shadcn/ui 组件
| 组件 | 用途 | 定制需求 |
|------|------|----------|
| Button | 新建项目按钮、操作按钮 | 自定义颜色、尺寸 |
| Badge | 状态标签、LIVE标签 | 自定义颜色变体 |
| Avatar | 用户头像 | 圆形，带状态指示 |
| ScrollArea | 可滚动区域 | 自定义滚动条样式 |
| Tooltip | 悬停提示 | 延迟显示 |
| Tabs | In Progress / completed 切换 | 自定义样式 |
| Card | 任务卡片容器 | 自定义边框、阴影 |
| Progress | 进度条 | 自定义颜色、高度 |
| Separator | 分隔线 | 颜色调整 |

### 自定义组件
| 组件 | 用途 | 复杂度 |
|------|------|--------|
| StageIndicator | 四阶段进度指示器 | 中 |
| StepList | 实验步骤列表 | 高 |
| StepItem | 单个步骤项 | 中 |
| JobMonitor | 任务监控面板 | 中 |
| JobCard | 单个任务卡片 | 低 |
| StatsBar | 底部统计栏 | 中 |
| ProjectQueue | 项目队列侧边栏 | 中 |
| ProjectItem | 单个项目项 | 低 |
| PulsingDot | 脉冲状态指示器 | 低 |
| TimerDisplay | 计时器显示 | 低 |

## 2. 动画实现规划

| 动画 | 库 | 实现方式 | 复杂度 |
|------|-----|----------|--------|
| 页面入场序列 | Framer Motion | AnimatePresence + stagger | 中 |
| 侧边栏滑入 | Framer Motion | motion.div + initial/animate | 低 |
| 内容淡入 | Framer Motion | motion.div + opacity | 低 |
| 列表 stagger | Framer Motion | staggerChildren + delayChildren | 中 |
| 运行中脉冲 | CSS + Framer Motion | animate + repeat | 低 |
| 进度条动画 | Framer Motion | motion.div + width | 低 |
| 数字计数 | Framer Motion | useMotionValue + animate | 中 |
| 悬停效果 | Tailwind CSS | transition + hover: | 低 |
| 子步骤展开 | Framer Motion | AnimatePresence + height | 中 |
| 新日志滑入 | Framer Motion | motion.div + y | 低 |

### 动画详细参数

**页面入场:**
```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};
```

**脉冲动画:**
```typescript
const pulseVariants = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.5, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};
```

**列表 stagger:**
```typescript
const listVariants = {
  visible: {
    transition: {
      staggerChildren: 0.05
    }
  }
};
```

## 3. 项目结构

```
app/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui 组件
│   │   ├── Header.tsx       # 顶部导航栏
│   │   ├── ProjectQueue.tsx # 左侧项目队列
│   │   ├── ExperimentStage.tsx # 主内容区
│   │   ├── StageIndicator.tsx # 阶段指示器
│   │   ├── StepList.tsx     # 步骤列表
│   │   ├── StepItem.tsx     # 单个步骤
│   │   ├── JobMonitor.tsx   # 右侧任务监控
│   │   ├── JobCard.tsx      # 任务卡片
│   │   ├── StatsBar.tsx     # 底部统计栏
│   │   ├── PulsingDot.tsx   # 脉冲指示器
│   │   └── TimerDisplay.tsx # 计时器
│   ├── hooks/
│   │   └── useTimer.ts      # 计时器 hook
│   ├── types/
│   │   └── index.ts         # TypeScript 类型
│   ├── data/
│   │   └── mockData.ts      # 模拟数据
│   ├── App.tsx
│   ├── App.css
│   └── main.tsx
├── public/
├── index.html
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## 4. 依赖清单

**核心依赖 (已包含):**
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui 组件

**额外依赖:**
```bash
npm install framer-motion lucide-react
```

**开发依赖:**
- 已包含在初始化中

## 5. 颜色配置 (Tailwind)

```javascript
// tailwind.config.js 扩展
colors: {
  fars: {
    bg: '#FFFFFF',
    'bg-secondary': '#F8FAFC',
    'bg-tertiary': '#F1F5F9',
    text: '#0F172A',
    'text-secondary': '#64748B',
    'text-tertiary': '#94A3B8',
    border: '#E2E8F0',
    'border-dark': '#CBD5E1',
    success: '#10B981',
    running: '#3B82F6',
    warning: '#F59E0B',
    error: '#EF4444',
    highlight: '#6366F1'
  }
}
```

## 6. 关键实现细节

### 阶段指示器
- 使用 flex 布局，四个等分
- 连接线使用绝对定位
- 当前阶段高亮显示
- 图标使用 Lucide React

### 步骤列表
- 使用递归组件处理子步骤
- 支持展开/收起
- 状态图标动态变化
- 悬停效果

### 任务监控
- 自动滚动到底部
- 新消息动画进入
- 时间戳格式化
- 状态颜色编码

### 统计栏
- 固定底部
- 数字动画
- 进度条动画
- 响应式布局

## 7. 性能优化

- 使用 React.memo 优化列表渲染
- 使用 useMemo 缓存计算值
- 使用 useCallback 优化回调
- 动画使用 GPU 加速 (transform, opacity)
- 虚拟滚动处理大量日志
